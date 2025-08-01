import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sessionManager } from "../services/sessionManager.js";
import {
	generateEmailCode,
	send2FACodeEmail,
} from "../services/TwoFactorService.js";
import { extractTokenFromRequest } from "./profile.js";
// Import the Prometheus metrics
import { connectedUsers, loginRequests } from "../utils/metrics.js";
import { logger } from "../utils/logger.js";

const secretKey = process.env.COOKIE_SECRET;

export async function handleLogIn(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	console.log("DEBUG LOGIN MANAGEMENT");

	app.post(
		"/api/login",
		async (request: FastifyRequest, reply: FastifyReply) => {
			console.log("in /api/login");
			const { username, password, twoFactorToken } = request.body as {
				username: string;
				password: string;
				twoFactorToken?: string;
			};

			console.log(username);
			console.log(password);
			try {
				console.log("before prisma");
				const user = await prisma.user.findUnique({
					where: { username },
				});
				if (!user) {
					// Record failed login attempt
					loginRequests.inc({ status: 'failure' });
					return reply
						.status(401)
						.send({ success: false, message: "User not found" });
				}

				const passwordCheck = user.passwordHash ? await bcrypt.compare(
					password,
					user.passwordHash
				) : false;
				if (!passwordCheck) {
					// Record failed login attempt
					loginRequests.inc({ status: 'failure' });
					return reply
						.status(401)
						.send({ success: false, message: "Wrong password" });
				}

				// Check if 2FA is enabled
				console.log("before 2fa");
				if (user.isTwoFactorEnabled) {
					if (!twoFactorToken) {
						console.log(
							`🔍 LOGIN - 2FA enabled for user, type: ${user.twoFactorType}`
						);

						// POUR 2FA EMAIL : Envoyer automatiquement un code
						if (user.twoFactorType === "email") {
							const code = generateEmailCode();
							const expiresAt = new Date(
								Date.now() + 10 * 60 * 1000
							);

							console.log(
								`🔑 LOGIN - Generating code: ${code}, expires: ${expiresAt}`
							);

							await prisma.user.update({
								where: { id: user.id },
								data: {
									twoFactorCode: code,
									twoFactorCodeExpires: expiresAt,
								},
							});

							await send2FACodeEmail(user.email, code);

							console.log(
								`✅ LOGIN - Code sent to ${user.email}`
							);
						}

						return reply.status(200).send({
							success: false,
							requires2FA: true,
							message: "2FA verification required",
						});
					}
					console.log("after 2fa");

					// Verify 2FA token based on type
					const { verifyTOTPCode, verifyEmailCode } = await import(
						"../services/TwoFactorService.js"
					);

					let is2FAValid = false;

					if (user.twoFactorType === "totp" && user.twoFactorSecret) {
						is2FAValid = verifyTOTPCode(
							user.twoFactorSecret,
							twoFactorToken
						);
					} else if (user.twoFactorType === "email") {
						is2FAValid = verifyEmailCode(user, twoFactorToken);
					}

					if (!is2FAValid) {
						// Record failed login attempt due to invalid 2FA
						loginRequests.inc({ status: 'failure' });
						return reply.status(401).send({
							success: false,
							requires2FA: true,
							message: "Invalid 2FA token",
						});
					}

					// Clear email 2FA code after successful verification
					if (user.twoFactorType === "email") {
						await prisma.user.update({
							where: { id: user.id },
							data: {
								twoFactorCode: null,
								twoFactorCodeExpires: null,
							},
						});
					}
				}

				console.log("before JWT");
				// JWT generation - Only update if user wasn't already connected

				const wasAlreadyConnected = sessionManager.isUserOnline(user.username);

				await prisma.user.update({
					where: { id: user.id },
					data: {
						connected: true,
					},
				});

				console.log("✅ User status :", user.connected);
				console.log("🔑 Generating JWT for user:", user.username);
				console.log(
					"🔑 Secret key:",
					secretKey || "fallback-secret-key"
				);

				const token = jwt.sign(
					{
						id: user.id,
						username: user.username,
					},
					secretKey || "fallback-secret-key",
					{
						expiresIn: "24h",
					}
				);

				const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
				sessionManager.addSession(user.username, user.id, expiresAt);

				// PROMETHEUS METRICS: Increment connected users count only if user wasn't already connected
				if (!wasAlreadyConnected) {
					connectedUsers.set(sessionManager.getOnlineUsers().length);
					logger.info("📊 METRICS: Incremented connected users count");
				}

				// Record successful login attempt
				loginRequests.inc({ status: 'success' });

				console.log("🔑 Generated token:", token);

				return reply.send({
					success: true,
					token: token, // Envoyer le JWT au frontend
					user: {
						id: user.id,
						username: user.username,
						avatarUrl: user.avatarUrl,
						twoFactorEnabled: user.isTwoFactorEnabled,
					},
				});
			} catch (err) {
				console.error("Login error:", err);
				// Record failed login attempt due to server error
				loginRequests.inc({ status: 'failure' });
				reply.status(500).send({
					success: false,
					message: "Internal server error",
				});
			}
		}
	);

	app.get("/api/me", async (request: FastifyRequest, reply: FastifyReply) => {
		// Read JWT from header Authorization
		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply
				.status(401)
				.send({ success: false, message: "Not authenticated" });
		}

		const token = authHeader.substring(7); // Remove "Bearer "

		try {
			// Verify and decode the JWT
			const decoded = jwt.verify(
				token,
				secretKey || "fallback-secret-key"
			) as any;

			sessionManager.updateActivity(decoded.username);

			// Get the user from the DB
			const user = await prisma.user.findUnique({
				where: { id: decoded.id },
				select: {
					id: true,
					username: true,
					avatarUrl: true,
					connected: true,
					gamesPlayed: true,
					wins: true,
					losses: true,
				},
			});

			if (!user) {
				return reply.status(401).send({ error: "User not found" });
			}

			reply.send(user);
		} catch (error) {
			console.error("JWT verification error:", error);
			reply.status(401).send({ error: "Invalid token" });
		}
	});

	app.post(
		"/api/logout",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const authHeader = request.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return reply
					.status(401)
					.send({ success: false, message: "Not authenticated" });
			}
			const token = authHeader.substring(7);
			try {
				const decoded = jwt.verify(
					token,
					secretKey || "fallback-secret-key"
				) as any;

				// Get user's current connection status before updating
				const user = await prisma.user.findUnique({
					where: { id: decoded.id },
					select: { connected: true }
				});

				const wasOnline = sessionManager.isUserOnline(decoded.username);

				sessionManager.removeSession(decoded.username);

				await prisma.user.update({
					where: { id: decoded.id },
					data: { connected: false },
				});

				// PROMETHEUS METRICS: Decrement connected users count only if user was actually connected
				if (wasOnline) {
					connectedUsers.set(sessionManager.getOnlineUsers().length);
					logger.info("📊 METRICS: Decremented connected users count");
				}

				reply.send({ success: true });
			} catch (error) {
				reply
					.status(401)
					.send({ success: false, message: "Invalid token" });
			}
		}
	);

	app.get("/api/sessions/online", async (request: FastifyRequest, reply: FastifyReply) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const onlineUsers = sessionManager.getOnlineUsers();
		reply.send({
			success: true,
			onlineUsers,
			count: onlineUsers.length
		});
	});
}

export function requireAuth() {
	return async (request: any, reply: any) => {
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply.status(401).send({ error: "Authentication required" });
		}

		const token = authHeader.substring(7);

		try {
			const decoded = jwt.verify(
				token,
				secretKey || "fallback-secret-key"
			) as any;
			request.user = { userId: decoded.id, username: decoded.username };
		} catch (error) {
			return reply.status(401).send({ error: "Invalid token" });
		}
	};
}

export async function secureRoutes(app: FastifyInstance, prisma: PrismaClient) {
	const authMiddleware = requireAuth();

	// Apply the middleware to the protected routes
	app.addHook("preHandler", async (request, reply) => {
		const protectedPaths = [
			"/api/login",
			"/api/profile",
			"/api/profile/avatar",
			"/api/profile/username",
			"/api/profile/password",
			"/api/profile/matches",
			"/api/profile/friends",
			"/api/profile/friends/add",
			"/api/game",
			"/api/chat",
		];

		const isProtected = protectedPaths.some((path) =>
			request.url.startsWith(path)
		);

		if (isProtected) {
			await authMiddleware(request, reply);
		}
	});
}

// import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
// import { PrismaClient } from "@prisma/client";
// import * as bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { sessionManager } from "../services/sessionManager.js";
// import {
// 	generateEmailCode,
// 	send2FACodeEmail,
// } from "../services/TwoFactorService.js";
// import { extractTokenFromRequest } from "./profile.js";

// const secretKey = process.env.COOKIE_SECRET;

// export async function handleLogIn(
// 	app: FastifyInstance<any, any, any, any>,
// 	prisma: PrismaClient
// ) {
// 	console.log("DEBUG LOGIN MANAGEMENT");
// 	// app.register(cookie, {
// 	// 	secret: secretKey,
// 	// 	parseOptions: {},
// 	// } as FastifyCookieOptions);
// 	// console.log("DEBUG LOGIN MANAGEMENT 2");

// 	// app.get("/ws/login", { websocket: true }, async (connection, req) => {
// 	// 	console.log("🔧 New WebSocket connection from:", req.ip);

// 	// 	// Extract user info from query parameters or headers
// 	// 	const query = req.query as { username?: string; userId?: string };
// 	// 	const username = query.username;
// 	// 	const userId = query.userId;

// 	// 	if (!username || !userId) {
// 	// 		connection.send(
// 	// 			JSON.stringify({
// 	// 				type: "error",
// 	// 				message: "Missing user information",
// 	// 			})
// 	// 		);
// 	// 		connection.close();
// 	// 		return;
// 	// 	}

// 	// 	// Get the actual user ID from database
// 	// 	const user = await prisma.user.findUnique({
// 	// 		where: { username: username },
// 	// 	});

// 	// 	if (!user) {
// 	// 		connection.send(
// 	// 			JSON.stringify({
// 	// 				type: "error",
// 	// 				message: "User not found in database",
// 	// 			})
// 	// 		);
// 	// 		connection.close();
// 	// 		return;
// 	// 	}

// 	// 	// Store connection with actual user info from database
// 	// 	activeSessions.set(username, {
// 	// 		connection,
// 	// 		userId: user.id,
// 	// 		username,
// 	// 	});

// 	// 	console.log("activeSessions: ", activeSessions);

// 	// 	console.log(`🔗 User ${username} connected`);
// 	// });

// 	app.post(
// 		"/api/login",
// 		async (request: FastifyRequest, reply: FastifyReply) => {
// 			console.log("in /api/login");
// 			const { username, password, twoFactorToken } = request.body as {
// 				username: string;
// 				password: string;
// 				twoFactorToken?: string;
// 			};

// 			console.log(username);
// 			console.log(password);
// 			try {
// 				console.log("before prisma");
// 				const user = await prisma.user.findUnique({
// 					where: { username },
// 				});
// 				if (!user)
// 					return reply
// 						.status(401)
// 						.send({ success: false, message: "User not found" });
// 				const passwordCheck = user.passwordHash ? await bcrypt.compare(
// 					password,
// 					user.passwordHash
// 				) : false;
// 				if (!passwordCheck)
// 					return reply
// 						.status(401)
// 						.send({ success: false, message: "Wrong password" });

// 				// Check if 2FA is enabled
// 				console.log("before 2fa");
// 				if (user.isTwoFactorEnabled) {
// 					if (!twoFactorToken) {
// 						console.log(
// 							`🔍 LOGIN - 2FA enabled for user, type: ${user.twoFactorType}`
// 						);

// 						// POUR 2FA EMAIL : Envoyer automatiquement un code
// 						if (user.twoFactorType === "email") {
// 							const code = generateEmailCode();
// 							const expiresAt = new Date(
// 								Date.now() + 10 * 60 * 1000
// 							);

// 							console.log(
// 								`🔑 LOGIN - Generating code: ${code}, expires: ${expiresAt}`
// 							);

// 							await prisma.user.update({
// 								where: { id: user.id },
// 								data: {
// 									twoFactorCode: code,
// 									twoFactorCodeExpires: expiresAt,
// 								},
// 							});

// 							await send2FACodeEmail(user.email, code);

// 							console.log(
// 								`✅ LOGIN - Code sent to ${user.email}`
// 							);
// 						}

// 						return reply.status(200).send({
// 							success: false,
// 							requires2FA: true,
// 							message: "2FA verification required",
// 						});
// 					}
// 					console.log("after 2fa");

// 					// Verify 2FA token based on type
// 					const { verifyTOTPCode, verifyEmailCode } = await import(
// 						"../services/TwoFactorService.js"
// 					);

// 					let is2FAValid = false;

// 					if (user.twoFactorType === "totp" && user.twoFactorSecret) {
// 						is2FAValid = verifyTOTPCode(
// 							user.twoFactorSecret,
// 							twoFactorToken
// 						);
// 					} else if (user.twoFactorType === "email") {
// 						is2FAValid = verifyEmailCode(user, twoFactorToken);
// 					}

// 					if (!is2FAValid) {
// 						return reply.status(401).send({
// 							success: false,
// 							requires2FA: true,
// 							message: "Invalid 2FA token",
// 						});
// 					}

// 					// Clear email 2FA code after successful verification
// 					if (user.twoFactorType === "email") {
// 						await prisma.user.update({
// 							where: { id: user.id },
// 							data: {
// 								twoFactorCode: null,
// 								twoFactorCodeExpires: null,
// 							},
// 						});
// 					}
// 				}

// 				console.log("before JWT");
// 				// JWT generation
// 				await prisma.user.update({
// 					where: { id: user.id },
// 					data: {
// 						connected: true,
// 					},
// 				});
// 				console.log("✅ User status :", user.connected);
// 				console.log("🔑 Generating JWT for user:", user.username);
// 				console.log(
// 					"🔑 Secret key:",
// 					secretKey || "fallback-secret-key"
// 				);

// 				const token = jwt.sign(
// 					{
// 						id: user.id,
// 						username: user.username,
// 					}
// 					secretKey || "fallback-secret-key",
// 					{
// 						expiresIn: "24h",
// 					}
// 				);

// 				const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
// 				sessionManager.addSession(user.username, user.id, expiresAt);
// 				// incrementer compteur connected user pour grafana

// 				console.log("🔑 Generated token:", token);

// 				return reply.send({
// 					success: true,
// 					token: token, // Envoyer le JWT au frontend
// 					user: {
// 						id: user.id,
// 						username: user.username,
// 						avatarUrl: user.avatarUrl,
// 						twoFactorEnabled: user.isTwoFactorEnabled,
// 					},
// 				});
// 			} catch (err) {
// 				console.error("Login error:", err);
// 				reply.status(500).send({
// 					success: false,
// 					message: "Internal server error",
// 				});
// 			}
// 		}
// 	);

// 	app.get("/api/me", async (request: FastifyRequest, reply: FastifyReply) => {
// 		// Read JWT from header Authorization
// 		const authHeader = request.headers.authorization;
// 		if (!authHeader || !authHeader.startsWith("Bearer ")) {
// 			return reply
// 				.status(401)
// 				.send({ success: false, message: "Not authenticated" });
// 		}

// 		const token = authHeader.substring(7); // Remove "Bearer "

// 		try {
// 			// Verify and decode the JWT
// 			const decoded = jwt.verify(
// 				token,
// 				secretKey || "fallback-secret-key"
// 			) as any;

// 			sessionManager.updateActivity(decoded.username);

// 			// Get the user from the DB
// 			const user = await prisma.user.findUnique({
// 				where: { id: decoded.id },
// 				select: {
// 					id: true,
// 					username: true,
// 					avatarUrl: true,
// 					connected: true,
// 					gamesPlayed: true,
// 					wins: true,
// 					losses: true,
// 				},
// 			});

// 			//ADD active session save


// 			if (!user) {
// 				return reply.status(401).send({ error: "User not found" });
// 			}

// 			reply.send(user);
// 		} catch (error) {
// 			console.error("JWT verification error:", error);
// 			reply.status(401).send({ error: "Invalid token" });
// 		}
// 	});

// 	app.post(
// 		"/api/logout",
// 		async (request: FastifyRequest, reply: FastifyReply) => {
// 			const authHeader = request.headers.authorization;
// 			if (!authHeader || !authHeader.startsWith("Bearer ")) {
// 				return reply
// 					.status(401)
// 					.send({ success: false, message: "Not authenticated" });
// 			}
// 			const token = authHeader.substring(7);
// 			try {
// 				const decoded = jwt.verify(
// 					token,
// 					secretKey || "fallback-secret-key"
// 				) as any;

// 				sessionManager.removeSession(decoded.username);
// 					// decrementer compteur connected user pour grafana


// 				await prisma.user.update({
// 					where: { id: decoded.id },
// 					data: { connected: false },
// 				});
// 				reply.send({ success: true });
// 			} catch (error) {
// 				reply
// 					.status(401)
// 					.send({ success: false, message: "Invalid token" });
// 			}
// 		}
// 	);

// 	app.get("/api/sessions/online", async (request: FastifyRequest, reply: FastifyReply) => {
// 		const auth = extractTokenFromRequest(request);
// 		if (!auth) {
// 			return reply.status(401).send({ error: "Unauthorized" });
// 		}

// 		const onlineUsers = sessionManager.getOnlineUsers();
// 		reply.send({
// 			success: true,
// 			onlineUsers,
// 			count: onlineUsers.length
// 		});
// 	});
// }

// export function requireAuth() {
// 	return async (request: any, reply: any) => {
// 		const authHeader = request.headers.authorization;

// 		if (!authHeader || !authHeader.startsWith("Bearer ")) {
// 			return reply.status(401).send({ error: "Authentication required" });
// 		}

// 		const token = authHeader.substring(7);

// 		try {
// 			const decoded = jwt.verify(
// 				token,
// 				secretKey || "fallback-secret-key"
// 			) as any;
// 			request.user = { userId: decoded.id, username: decoded.username };
// 		} catch (error) {
// 			return reply.status(401).send({ error: "Invalid token" });
// 		}
// 	};
// }

// export async function secureRoutes(app: FastifyInstance, prisma: PrismaClient) {
// 	const authMiddleware = requireAuth();

// 	// Apply the middleware to the protected routes
// 	app.addHook("preHandler", async (request, reply) => {
// 		const protectedPaths = [
// 			"/api/login",
// 			"/api/profile",
// 			"/api/profile/avatar",
// 			"/api/profile/username",
// 			"/api/profile/password",
// 			"/api/profile/matches",
// 			"/api/profile/friends",
// 			"/api/profile/friends/add",
// 			"/api/game",
// 			"/api/chat",
// 		];

// 		const isProtected = protectedPaths.some((path) =>
// 			request.url.startsWith(path)
// 		);

// 		if (isProtected) {
// 			await authMiddleware(request, reply);
// 		}
// 	});
// }

// // async function generateJWT(username: string, prisma: PrismaClient){
// // 	const user = await prisma.user.findUnique({
// // 		where: { username }
// // 	});
// // 	const token = jwt.sign({
// // 		id: user?.id,
// // 		username: user?.username},
// // 		secretKey,
// // 		{ expiresIn: '1h' }
// // 	);
// // 	return token;
// // }
