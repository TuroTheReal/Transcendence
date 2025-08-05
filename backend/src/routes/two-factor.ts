import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
	generateEmailCode,
	verifyEmailCode,
	generateTOTPSecret,
	verifyTOTPCode,
	send2FACodeEmail,
} from "../services/TwoFactorService.js";

// Only one exported function for all 2FA routes!
export async function twoFactorRoutes(
	fastify: FastifyInstance,
	prisma: PrismaClient
) {
	// ===============================
	// Disable 2FA for a user (by userId with 2FA code verification)
	// ===============================
	fastify.post("/api/user/:userId/2fa/disable", async (request, reply) => {
		try {
			const { userId } = request.params as { userId: string };
			const { code } = request.body as { code: string };
			
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
			});

			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			if (!user.isTwoFactorEnabled) {
				return reply.status(400).send({ error: "2FA is not enabled" });
			}

			// Verify the provided 2FA code
			let isValidCode = false;
			
			if (user.twoFactorType === "totp" && user.twoFactorSecret) {
				isValidCode = verifyTOTPCode(user.twoFactorSecret, code);
			} else if (user.twoFactorType === "email") {
				// For email 2FA, we could send a code first, but for security
				// we'll require the current TOTP code if available, or implement email verification
				return reply.status(400).send({ 
					error: "Email 2FA disable requires contacting administrator" 
				});
			}

			if (!isValidCode) {
				return reply.status(400).send({ error: "Invalid 2FA code" });
			}

			// Disable 2FA
			await prisma.user.update({
				where: { id: parseInt(userId) },
				data: {
					isTwoFactorEnabled: false,
					twoFactorCode: null,
					twoFactorCodeExpires: null,
					twoFactorSecret: null,
					twoFactorEnabledAt: null,
					twoFactorType: null,
				},
			});

			return reply.send({ 
				success: true, 
				message: "2FA successfully disabled" 
			});
		} catch (error) {
			console.error("2FA disable error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Get 2FA status for a user
	// ===============================
	fastify.get("/api/user/:userId/2fa/status", async (request, reply) => {
		try {
			const { userId } = request.params as { userId: string };
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
				select: {
					isTwoFactorEnabled: true,
					twoFactorType: true,
				},
			});

			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			return reply.send({
				enabled: user.isTwoFactorEnabled,
				type: user.twoFactorType as "email" | "totp" | undefined,
			});
		} catch (error) {
			console.error("Get 2FA status error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// ROUTE TEMPORAIRE : Setup TOTP 2FA pour un utilisateur (GET version)
	// ===============================
	fastify.get(
		"/api/2fa/setup-totp-temp/:username",
		async (request, reply) => {
			try {
				const { username } = request.params as { username: string };
				// console.log(
				// 	`🔧 TEMP GET - Setting up TOTP 2FA for user: ${username}`
				// );

				const user = await prisma.user.findUnique({
					where: { username },
				});

				if (!user) {
					return reply.status(404).send({ error: "User not found" });
				}

				// Prevent Google OAuth users from enabling 2FA
				if (user.googleId) {
					const htmlResponse = `
					<!DOCTYPE html>
					<html>
					<head>
						<title>2FA Not Available</title>
						<style>
							body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
							.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 5px; }
						</style>
					</head>
					<body>
						<div class="error">
							<h1>🔐 Two-Factor Authentication Not Available</h1>
							<p>Two-Factor Authentication is managed by Google for OAuth accounts.</p>
							<p>Please use Google's security settings to manage your 2FA preferences.</p>
							<p><a href="https://myaccount.google.com/security">🔗 Go to Google Security Settings</a></p>
						</div>
					</body>
					</html>
					`;
					reply.type("text/html");
					return reply.send(htmlResponse);
				}

				// Generate TOTP secret
				const secretObj = generateTOTPSecret(user.username);

				// Save secret but don't enable 2FA yet (user needs to verify first)
				await prisma.user.update({
					where: { id: user.id },
					data: {
						twoFactorSecret: secretObj.base32,
						isTwoFactorEnabled: false, // Will be enabled after verification
						twoFactorType: null,
						twoFactorCode: null,
						twoFactorCodeExpires: null,
					},
				});

				// console.log(
				// 	`✅ TEMP GET - TOTP secret generated for ${username}`
				// );

				// Return HTML page with QR code and instructions
				const htmlResponse = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Setup Google Authenticator</title>
					<style>
						body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
						.qr-container { text-align: center; margin: 20px 0; }
						.secret { background: #91c0fdff; padding: 10px; border-radius: 5px; word-break: break-all; }
						.step { margin: 15px 0; padding: 10px; border-left: 4px solid #007bff; }
					</style>
				</head>
				<body>
					<h1>SET-UP GOOGLE AUTHENTICATOR FOR : ${username}</h1>

					<div class="step">
						<h3>Step 1: Download Google Authenticator</h3>
						<p>Install Google Authenticator on your phone from:</p>
						<ul>
							<li><strong>Android:</strong> Google Play Store</li>
							<li><strong>iOS:</strong> App Store</li>
						</ul>
					</div>

					<div class="step">
						<h3>Step 2: Scan QR Code</h3>
						<div class="qr-container">
							<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secretObj.otpauth_url)}" alt="QR Code">
						</div>
						<p><strong>Or manually enter this secret:</strong></p>
						<div class="secret">${secretObj.base32}</div>
					</div>

					<div class="step">
						<h3>Step 3: Verify Setup</h3>
						<p>Once you've added the account to Google Authenticator:</p>
						<ol>
							<li>Look at the 6-digit code in the app</li>
							<li>Go to: <strong>https://localhost:3002/api/2fa/verify-totp-temp/${username}/YOUR_6_DIGIT_CODE</strong></li>
							<li>Replace YOUR_6_DIGIT_CODE with the actual code</li>
						</ol>
					</div>

					<div class="step">
						<h3>Step 4: Test Login</h3>
						<p>After verification, try logging in normally. You'll be asked for the Google Authenticator code!</p>
					</div>
				</body>
				</html>
				`;

				reply.type("text/html");
				return reply.send(htmlResponse);
			} catch (error) {
				console.error("Setup TOTP error:", error);
				return reply
					.status(500)
					.send({ error: "Internal server error" });
			}
		}
	);

	// ===============================
	// ROUTE TEMPORAIRE : Vérifier et activer TOTP (GET version)
	// ===============================
	fastify.get(
		"/api/2fa/verify-totp-temp/:username/:code",
		async (request, reply) => {
			try {
				const { username, code } = request.params as {
					username: string;
					code: string;
				};
				// console.log(
				// 	`🔧 TEMP GET - Verifying TOTP for user: ${username}, code: ${code}`
				// );

				const user = await prisma.user.findUnique({
					where: { username },
				});

				if (!user || !user.twoFactorSecret) {
					return reply.status(400).send({
						error: "TOTP not set up. Please setup first.",
					});
				}

				// Verify the TOTP code
				const verified = verifyTOTPCode(user.twoFactorSecret, code);
				if (!verified) {
					return reply.status(400).send({
						error: "Invalid TOTP code",
						message:
							"The code from Google Authenticator is incorrect. Please try again.",
					});
				}

				// Enable TOTP 2FA
				await prisma.user.update({
					where: { id: user.id },
					data: {
						isTwoFactorEnabled: true,
						twoFactorType: "totp",
						twoFactorEnabledAt: new Date(),
						twoFactorCode: null,
						twoFactorCodeExpires: null,
					},
				});

				// console.log(`✅ TEMP GET - TOTP 2FA enabled for ${username}`);

				const htmlResponse = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>TOTP Verification Success</title>
					<style>
						body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
						.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; }
					</style>
				</head>
				<body>
					<div class="success">
						<h1>SUCCESS!!</h1>
						<h2>TOTP 2FA SUCCESSFULLY ENABLED FOR : ${username}</h2>
						<p>Google Authenticator is now configured and active.</p>
						<p><strong>Next time you login, you'll need to enter the 6-digit code from Google Authenticator!</strong></p>
						<p><a href="https://localhost:3002"> GO BACK TO LOGIN PAGE</a></p>
					</div>
				</body>
				</html>
				`;

				reply.type("text/html");
				return reply.send(htmlResponse);
			} catch (error) {
				console.error("Verify TOTP error:", error);
				return reply
					.status(500)
					.send({ error: "Internal server error" });
			}
		}
	);

	// ===============================
	// ROUTE TEMPORAIRE : Activer 2FA email pour un utilisateur (GET version)
	// ===============================
	fastify.get(
		"/api/2fa/enable-email-temp/:username",
		async (request, reply) => {
			try {
				const { username } = request.params as { username: string };
				// console.log(
				// 	`🔧 TEMP GET - Enabling email 2FA for user: ${username}`
				// );

				const user = await prisma.user.findUnique({
					where: { username },
				});

				if (!user) {
					return reply.status(404).send({ error: "User not found" });
				}

				// Prevent Google OAuth users from enabling 2FA
				if (user.googleId) {
					return reply.status(400).send({ 
						error: "Two-Factor Authentication is managed by Google for OAuth accounts" 
					});
				}

				await prisma.user.update({
					where: { id: user.id },
					data: {
						isTwoFactorEnabled: true,
						twoFactorType: "email",
						twoFactorEnabledAt: new Date(),
						twoFactorCode: null,
						twoFactorCodeExpires: null,
						twoFactorSecret: null,
					},
				});

				// console.log(`✅ TEMP GET - Email 2FA enabled for ${username}`);
				return reply.send({
					message: `Email 2FA enabled successfully for ${username}`,
					user: {
						username: user.username,
						isTwoFactorEnabled: true,
						twoFactorType: "email",
					},
				});
			} catch (error) {
				console.error("Enable email 2FA error:", error);
				return reply
					.status(500)
					.send({ error: "Internal server error" });
			}
		}
	);

	// ===============================
	// ROUTE TEMPORAIRE : Activer 2FA email pour un utilisateur (POST version)
	// ===============================
	fastify.post("/api/2fa/enable-email-temp", async (request, reply) => {
		try {
			const { username } = request.body as { username: string };
			// console.log(`🔧 TEMP - Enabling email 2FA for user: ${username}`);

			const user = await prisma.user.findUnique({
				where: { username },
			});

			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			// Prevent Google OAuth users from enabling 2FA
			if (user.googleId) {
				return reply.status(400).send({ 
					error: "Two-Factor Authentication is managed by Google for OAuth accounts" 
				});
			}

			await prisma.user.update({
				where: { id: user.id },
				data: {
					isTwoFactorEnabled: true,
					twoFactorType: "email",
					twoFactorEnabledAt: new Date(),
					twoFactorCode: null,
					twoFactorCodeExpires: null,
					twoFactorSecret: null,
				},
			});

			// console.log(`✅ TEMP - Email 2FA enabled for ${username}`);
			return reply.send({ message: "Email 2FA enabled successfully" });
		} catch (error) {
			console.error("Enable email 2FA error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Send email 2FA code
	// ===============================
	fastify.post("/api/2fa/email/send", async (request, reply) => {
		try {
			const { userId } = request.body as { userId: number };
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			// Prevent Google OAuth users from enabling 2FA
			if (user.googleId) {
				return reply.status(400).send({ 
					error: "Two-Factor Authentication is managed by Google for OAuth accounts" 
				});
			}

			const code = generateEmailCode();
			const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

			await prisma.user.update({
				where: { id: userId },
				data: {
					twoFactorCode: code,
					twoFactorCodeExpires: expiresAt,
				},
			});

			await send2FACodeEmail(user.email, code);

			return reply.send({ message: "2FA code sent to your email" });
		} catch (error) {
			console.error("Send email 2FA code error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Disable 2FA for a user
	// ===============================
	fastify.post("/api/2fa/disable", async (request, reply) => {
		try {
			const { userId, password } = request.body as {
				userId: number;
				password: string;
			};
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user)
				return reply.status(404).send({ error: "User not found" });

			const isValidPassword = user.passwordHash ? await bcrypt.compare(
				password,
				user.passwordHash
			) : false;
			if (!isValidPassword)
				return reply.status(400).send({ error: "Invalid password" });

			await prisma.user.update({
				where: { id: userId },
				data: {
					isTwoFactorEnabled: false,
					twoFactorCode: null,
					twoFactorCodeExpires: null,
					twoFactorSecret: null,
					twoFactorEnabledAt: null,
					twoFactorType: null,
				},
			});
			return reply.send({ message: "2FA successfully disabled" });
		} catch (error) {
			console.error("2FA disable error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Login endpoint (with 2FA check)
	// ===============================
	fastify.post("/api/2fa/login", async (request, reply) => {
		try {
			const { username, password, twoFactorCode } = request.body as {
				username: string;
				password: string;
				twoFactorCode: string;
			};

			const user = await prisma.user.findUnique({ where: { username } });
			if (!user)
				return reply.status(400).send({ error: "Invalid credentials" });

			const isValidPassword = user.passwordHash ? await bcrypt.compare(
				password,
				user.passwordHash
			) : false;
			if (!isValidPassword)
				return reply.status(400).send({ error: "Invalid credentials" });

			if (user.isTwoFactorEnabled) {
				if (user.twoFactorType === "email") {
					if (!user.twoFactorCode || !user.twoFactorCodeExpires)
						return reply
							.status(400)
							.send({ error: "2FA code not requested" });

					const now = new Date();
					if (
						user.twoFactorCode !== twoFactorCode ||
						user.twoFactorCodeExpires < now
					)
						return reply
							.status(400)
							.send({ error: "Invalid or expired 2FA code" });

					await prisma.user.update({
						where: { id: user.id },
						data: {
							twoFactorCode: null,
							twoFactorCodeExpires: null,
						},
					});
				} else if (user.twoFactorType === "totp") {
					if (!user.twoFactorSecret)
						return reply
							.status(400)
							.send({ error: "2FA secret missing" });

					const verified = verifyTOTPCode(
						user.twoFactorSecret,
						twoFactorCode
					);
					if (!verified)
						return reply
							.status(400)
							.send({ error: "Invalid TOTP code" });
				}
			}

			const token = jwt.sign(
				{ userId: user.id, username: user.username },
				process.env.COOKIE_SECRET || "secret-key",
				{ expiresIn: "24h" }
			);

			return reply.send({
				token,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					avatarUrl: user.avatarUrl,
					isTwoFactorEnabled: user.isTwoFactorEnabled,
					twoFactorType: user.twoFactorType,
				},
			});
		} catch (error) {
			console.error("2FA login error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Send 2FA code (email or TOTP)
	// ===============================
	fastify.post("/api/2fa/send", async (request, reply) => {
		try {
			const { userId } = request.body as { userId: number };
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user)
				return reply.status(404).send({ error: "User not found" });

			if (user.twoFactorType === "email") {
				const code = await generateEmailCode();
				const expires = new Date(Date.now() + 5 * 60 * 1000);
				await prisma.user.update({
					where: { id: userId },
					data: {
						twoFactorCode: code,
						twoFactorCodeExpires: expires,
					},
				});
				await send2FACodeEmail(user.email, code);
			} else if (user.twoFactorType === "totp") {
				if (!user.twoFactorSecret)
					return reply
						.status(400)
						.send({ error: "2FA secret missing" });
				return reply.send({
					message: "TOTP is enabled. Use your authenticator app.",
				});
			} else {
				return reply.status(400).send({ error: "2FA type not set" });
			}
			return reply.send({ message: "2FA code sent to your email." });
		} catch (error) {
			console.error("2FA send error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Verify email 2FA code (for enabling email 2FA)
	// ===============================
	fastify.post("/api/2fa/email/verify", async (request, reply) => {
		try {
			const { userId, code } = request.body as {
				userId: number;
				code: string;
			};
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user || !user.twoFactorCode || !user.twoFactorCodeExpires)
				return reply
					.status(400)
					.send({ error: "2FA not requested or expired" });

			const now = new Date();
			if (user.twoFactorCode !== code || user.twoFactorCodeExpires < now)
				return reply
					.status(400)
					.send({ error: "Invalid or expired code" });

			await prisma.user.update({
				where: { id: userId },
				data: {
					isTwoFactorEnabled: true,
					twoFactorCode: null,
					twoFactorCodeExpires: null,
					twoFactorEnabledAt: new Date(),
					twoFactorType: "email",
				},
			});
			return reply.send({ message: "2FA enabled successfully (email)" });
		} catch (error) {
			console.error("2FA email verify error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Setup TOTP (authenticator app) for a user
	// ===============================
	fastify.post("/api/2fa/totp/setup", async (request, reply) => {
		try {
			const { userId } = request.body as { userId: number };
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user)
				return reply.status(404).send({ error: "User not found" });

			// Prevent Google OAuth users from enabling 2FA
			if (user.googleId) {
				return reply.status(400).send({ 
					error: "Two-Factor Authentication is managed by Google for OAuth accounts" 
				});
			}

			const secretObj = await generateTOTPSecret(user.username);
			await prisma.user.update({
				where: { id: userId },
				data: { twoFactorSecret: secretObj.base32 },
			});
			return reply.send({
				otpauth_url: secretObj.otpauth_url,
				secret: secretObj.base32,
			});
		} catch (error) {
			console.error("TOTP setup error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// Verify TOTP code and enable TOTP 2FA
	// ===============================
	fastify.post("/api/2fa/totp/verify", async (request, reply) => {
		try {
			const { userId, code } = request.body as {
				userId: number;
				code: string;
			};
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user || !user.twoFactorSecret)
				return reply.status(400).send({ error: "TOTP not set up" });

			const verified = await verifyTOTPCode(user.twoFactorSecret, code);
			if (!verified)
				return reply.status(400).send({ error: "Invalid TOTP code" });

			await prisma.user.update({
				where: { id: userId },
				data: {
					isTwoFactorEnabled: true,
					twoFactorEnabledAt: new Date(),
					twoFactorType: "totp",
				},
			});
			return reply.send({ message: "2FA enabled successfully (TOTP)" });
		} catch (error) {
			console.error("TOTP verify error:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// ===============================
	// 2FA verification for login challenge (frontend expects this)
	// ===============================
	fastify.post("/api/2fa/verify", async (request, reply) => {
		try {
			const { username, code } = request.body as {
				username: string;
				code: string;
			};
			console.log(`🔍 2FA VERIFY - Username: ${username}, Code: ${code}`);

			const user = await prisma.user.findUnique({ where: { username } });
			if (!user || !user.isTwoFactorEnabled) {
				console.log(
					`❌ 2FA VERIFY - User not found or 2FA not enabled`
				);
				return reply
					.status(400)
					.send({ success: false, message: "2FA not enabled" });
			}

			console.log(
				`🔍 2FA VERIFY - User found, 2FA type: ${user.twoFactorType}`
			);
			console.log(
				`🔍 2FA VERIFY - Stored code: ${user.twoFactorCode}, Expires: ${user.twoFactorCodeExpires}`
			);

			if (user.twoFactorType === "email") {
				if (!user.twoFactorCode || !user.twoFactorCodeExpires) {
					return reply.status(400).send({
						success: false,
						message: "2FA code not requested",
					});
				}
				const now = new Date();
				if (
					user.twoFactorCode !== code ||
					user.twoFactorCodeExpires < now
				) {
					return reply.status(400).send({
						success: false,
						message: "Invalid or expired 2FA code",
					});
				}
				await prisma.user.update({
					where: { id: user.id },
					data: { twoFactorCode: null, twoFactorCodeExpires: null },
				});
			} else if (user.twoFactorType === "totp") {
				if (!user.twoFactorSecret) {
					return reply.status(400).send({
						success: false,
						message: "2FA secret missing",
					});
				}
				const verified = verifyTOTPCode(user.twoFactorSecret, code);
				if (!verified) {
					return reply
						.status(400)
						.send({ success: false, message: "Invalid TOTP code" });
				}
			} else {
				return reply
					.status(400)
					.send({ success: false, message: "2FA type not set" });
			}

			const token = jwt.sign(
				{ id: user.id, username: user.username },
				process.env.COOKIE_SECRET || "fallback-secret-key",
				{ expiresIn: "24h" }
			);

			return reply.send({
				success: true,
				token,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					avatarUrl: user.avatarUrl,
					isTwoFactorEnabled: user.isTwoFactorEnabled,
					twoFactorType: user.twoFactorType,
				},
			});
		} catch (error) {
			console.error("2FA verify error:", error);
			return reply
				.status(500)
				.send({ success: false, message: "Internal server error" });
		}
	});
}

/*
| Endpoint                     | Purpose                          |
| ---------------------------- | -------------------------------- |
| `POST /api/2fa/disable`      | Disable 2FA after password check |
| `POST /api/2fa/login`        | Login and validate 2FA code      |
| `POST /api/2fa/send`         | Send a 2FA code (email or TOTP)  |
| `POST /api/2fa/email/verify` | Verify email code and enable 2FA |
| `POST /api/2fa/totp/setup`   | Setup TOTP for 2FA               |
| `POST /api/2fa/totp/verify`  | Verify TOTP code and enable 2FA  |
| `POST /api/2fa/verify`       | 2FA login challenge (frontend)   |


If you use request.params in any route, add a similar type assertion:
const params = request.params as { id: string };
*/