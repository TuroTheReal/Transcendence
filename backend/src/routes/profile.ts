import { FastifyInstance, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import bcrypt from "bcrypt";
import { PROJECT_ROOT } from "../server.js";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { request } from "http";
import { sessionManager } from "../services/sessionManager.js"

/*
TO DO:
- Ajuster la regle de mot de passe
- Friends click on name profil
*/

const secretKey = process.env.COOKIE_SECRET;

// function getFieldValue(field: any): string | undefined {
// 	if (!field) return undefined;
// 	if (Array.isArray(field)) field = field[0];
// 	if (typeof field.value === "string") return field.value;
// 	if (Buffer.isBuffer(field.value)) return field.value.toString();
// 	return undefined;
// }

export function extractTokenFromRequest(
	request: FastifyRequest
): { userId: number; username: string } | null {
	const authHeader = request.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	const token = authHeader.substring(7);
	try {
		const decoded = jwt.verify(
			token,
			secretKey || "fallback-secret-key"
		) as any;
		return { userId: decoded.id, username: decoded.username };
	} catch (error) {
		console.error("JWT verification error:", error);
		return null;
	}
}

export async function registerProfileRoute(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	app.get(
		"/avatars/:filename",
		async (
			request: FastifyRequest<{ Params: { filename: string } }>,
			reply
		) => {
			try {
				const filename = request.params.filename;
				console.log(
					"🔍 Server-level avatar route called for:",
					filename
				);

				if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
					return reply
						.status(400)
						.send({ error: "Invalid file type" });
				}

				const safeFilename = path.basename(filename);
				const filePath = path.join(
					PROJECT_ROOT,
					"public",
					"avatars",
					safeFilename
				);

				console.log("🔍 Serving avatar from server level:", filePath);

				if (!fs.existsSync(filePath)) {
					console.log("❌ Avatar file not found:", filePath);
					return reply
						.status(404)
						.send({ error: "Avatar not found" });
				}

				const stats = fs.statSync(filePath);
				console.log("📁 File size:", stats.size, "bytes");

				// Check if client wants base64 (for CSP bypass)
				const acceptsBase64 =
					request.headers.accept?.includes("application/json");

				if (acceptsBase64) {
					// Return as base64 JSON for CSP bypass
					const fileBuffer = fs.readFileSync(filePath);
					const base64 = fileBuffer.toString("base64");
					const ext = path.extname(filename).toLowerCase();
					let mimeType = "image/jpeg";
					if (ext === ".png") mimeType = "image/png";
					else if (ext === ".gif") mimeType = "image/gif";
					else if (ext === ".webp") mimeType = "image/webp";

					return reply.send({
						data: `data:${mimeType};base64,${base64}`,
						size: stats.size,
						filename: filename,
					});
				}

				// Normal image serving
				const ext = path.extname(filename).toLowerCase();
				let mimeType = "image/jpeg";
				if (ext === ".png") mimeType = "image/png";
				else if (ext === ".gif") mimeType = "image/gif";
				else if (ext === ".webp") mimeType = "image/webp";

				reply.header("Content-Type", mimeType);
				reply.header("Content-Length", stats.size);
				reply.header("Cache-Control", "public, max-age=86400");
				reply.header("Access-Control-Allow-Origin", "*");
				reply.header("Access-Control-Allow-Methods", "GET");
				reply.header("Access-Control-Allow-Headers", "Content-Type");

				const fileStream = fs.createReadStream(filePath);
				return reply.send(fileStream);
			} catch (error) {
				console.error("❌ Error serving avatar:", error);
				return reply
					.status(500)
					.send({ error: "Internal server error" });
			}
		}
	);

	app.get('/api/profile/user/:username/online', {
		handler: async (request, reply) => {
		try {

			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const { username } = request.params as { username: string };
			const isOnline = sessionManager.isUserOnline(username);

			reply.send({
				success: true,
				username: username,
				isOnline: isOnline
			});
		} catch (error) {
			console.error('Error checking user online status:', error);
			reply.status(500).send({
			success: false,
			error: 'Failed to check online status'
			});
		}
		}
	});

	app.get(
		"/api/profile",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const username = request.query.username as string;
			if (!username) {
				reply.status(400).send({ error: "Username is required" });
				return;
			}
			const { code, data } = await getUserInfo(username, prisma);

			reply.status(code).send(data);
		}
	);

	// ✅ Add this new route here, as a sibling, not inside the above handler: -> 2FA
	app.get(
		"/api/profile/:userId/2fa-status",
		async (
			request: FastifyRequest<{ Params: { userId: string } }>,
			reply
		) => {
			const userId = Number(request.params.userId);
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user) return reply.status(404).send({ enabled: false });
			return reply.send({
				enabled: !!user.isTwoFactorEnabled,
				type: user.twoFactorType || null,
			});
		}
	);

	// HANDLE AVATAR REQUEST
	app.post("/api/profile/avatar", async (request: FastifyRequest, reply) => {
		const auth = extractTokenFromRequest(request);
		console.log("auth: ", auth);
		if (!auth) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const file = await request.file();
		console.log("file: ", file);
		if (!file) {
			reply.status(400).send({ error: "Avatar file is required" });
			return;
		}

		const username = auth.username;
		console.log("username: ", username);
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		console.log("ABOUT TO UPDATE AVATAR");
		const avatarPath = await updateAvatar(prisma, username, file);
		console.log("avatarPath: ", avatarPath);
		reply.status(200).send({ success: true, avatarPath });
	});

	// HANDLE USERNAME REQUEST
	app.post(
		"/api/profile/username",
		async (
			request: FastifyRequest<{
				Querystring: { username: string; newUsername: string };
			}>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const { username, newUsername } = request.body as {
				username: string;
				newUsername: string;
			};

			// Use the username from the JWT token for security
			const currentUsername = auth.username;
			if (!currentUsername || !newUsername) {
				reply.status(400).send({ error: "Username is required" });
				return;
			}
			try {
				await updateUsername(prisma, currentUsername, newUsername);
				// Générer un nouveau JWT avec le nouveau username
				const updatedUser = await prisma.user.findUnique({
					where: { username: newUsername },
				});
				if (!updatedUser) {
					reply
						.status(400)
						.send({ error: "User not found after update" });
					return;
				}
				const newToken = jwt.sign(
					{ id: updatedUser.id, username: updatedUser.username },
					secretKey || "fallback-secret-key",
					{ expiresIn: "24h" }
				);
				reply.status(200).send({ success: true, token: newToken });
			} catch (err) {
				reply.status(400).send({
					error: "Username already exists or update failed",
				});
			}
		}
	);

	// HANDLE PASSWORD REQUEST
	app.post(
		"/api/profile/password",
		async (
			request: FastifyRequest<{
				Querystring: { username: string; newPassword: string };
			}>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const { username, newPassword } = request.body as {
				username: string;
				newPassword: string;
			};

			// Use the username from the JWT token for security
			const currentUsername = auth.username;
			if (!currentUsername || !newPassword) {
				reply
					.status(400)
					.send({ error: "Username and password are required" });
				return;
			}
			try {
				await updatePassword(prisma, currentUsername, newPassword);
				reply.status(200).send({ success: true });
			} catch (err) {
				reply.status(400).send({ error: "Update failed" });
			}
		}
	);

	// HANDLE MATCH HISTORY DISPLAY
	app.get(
		"/api/profile/matches",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const username = request.query.username as string;
			const user = await prisma.user.findUnique({ where: { username } });
			if (!user) {
				reply.status(404).send({ error: "User not found" });
			} else {
				const matches = await prisma.match.findMany({
					where: {
						OR: [{ player1Id: user.id }, { player2Id: user.id }],
					},
					orderBy: { playedAt: "desc" },
					include: {
						player1: { select: { username: true } },
						player2: { select: { username: true } },
					},
				});
				console.log("Matches : ", matches);
				reply.status(200).send(matches);
			}
		}
	);

	app.get(
		"/api/profile/friends",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const username = request.query.username as string;
			try {
				const user = await prisma.user.findUnique({
					where: { username },
					select: {
						id: true,
						friends: {
							select: {
								id: true,
								username: true,
								avatarUrl: true,
								gamesPlayed: true,
								connected: true,
							},
						},
					},
				});
				if (!user) reply.status(404).send({ error: "User not found" });
				console.log("Friends: ", user?.friends);
				reply.status(200).send(user?.friends);
			} catch (error) {
				console.error("Error fetching friends:", error);
				reply.status(500).send({ error: "Internal server error" });
			}
		}
	);

	// ROUTE POUR AJOUTER UN AMI
	app.post("/api/profile/friends/add", async (request, reply) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) return reply.status(401).send({ error: "Unauthorized" });

		const { friendUsername } = request.body as { friendUsername: string };
		if (!friendUsername)
			return reply.status(400).send({ error: "No username provided" });

		const user = await prisma.user.findUnique({
			where: { username: auth.username },
		});
		if (!user) return reply.status(404).send({ error: "User not found" });
		const friend = await prisma.user.findUnique({
			where: { username: friendUsername },
		});

		if (!friend) return reply.status(404).send({ error: "user not found" });
		if (user.id === friend.id)
			return reply.status(400).send({ error: "Cannot add yourself" });

		const alreadyFriend = await prisma.user.findFirst({
			where: {
				id: user.id,
				friends: { some: { id: friend.id } },
			},
		});
		if (alreadyFriend)
			return reply.status(400).send({ error: "Already friends" });

		await prisma.user.update({
			where: { id: user.id },
			data: {
				friends: { connect: { id: friend.id } },
			},
		});
		reply.send({ success: true });
	});
}

async function getUserInfo(username: string, prisma: PrismaClient) {
	if (!username) {
		return { code: 401, data: { error: "Not authenticated" } };
	}
	const user = await prisma.user.findUnique({
		where: { username },
		select: {
			username: true,
			avatarUrl: true,
			passwordHash: true,
			gamesPlayed: true,
			wins: true,
			losses: true,
			createdAt: true,
		},
	});
	if (!user) {
		return { code: 404, data: { error: "User not found" } };
	}
	return { code: 200, data: user };
}

async function updateUsername(
	prisma: PrismaClient,
	username: string,
	newUsername: string
) {
	await prisma.user.update({
		where: { username },
		data: { username: newUsername },
	});
}

async function updatePassword(
	prisma: PrismaClient,
	username: string,
	newPassword: string
) {
	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({
		where: { username },
		data: { passwordHash: hashedPassword },
	});
}

// async function updateAvatar(prisma: PrismaClient, username: string, file: any): Promise<string> {
// 	const uploadPath = path.join(PROJECT_ROOT, "./public/avatars", `${username}.png`);
// 	console.log("uploadPath: ", uploadPath);
// 	await pipeline(file, fs.createWriteStream(uploadPath));
// 	if (fs.existsSync(uploadPath)) {
// 		console.log("✅ Fichier sauvegardé avec succès");
// 		const stats = fs.statSync(uploadPath);
// 		console.log("📁 Taille du fichier:", stats.size, "bytes");
// 	} else {
// 		console.log("❌ Fichier non trouvé après sauvegarde");
// 	}
// 	const avatarPath = `/avatars/${username}.png`;
// 	console.log("avatarPath: ", avatarPath);

// 	await prisma.user.update({
// 		where: { username },
// 		data: { avatarUrl: avatarPath }
// 	});
// 	return avatarPath;
// }

async function updateAvatar(
	prisma: PrismaClient,
	username: string,
	file: any
): Promise<string> {
	const ext = path.extname(file.filename) || ".png";
	const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");
	const timestamp = Date.now();
	const hash = createHash("md5")
		.update(safeUsername + timestamp)
		.digest("hex")
		.substring(0, 8);

	const fileName = `${safeUsername}_${hash}${ext}`;
	const uploadPath = path.join(
		PROJECT_ROOT,
		"./public/avatars/",
		`${fileName}`
	);
	console.log("uploadPath: ", uploadPath);
	if (!file.file) {
		throw new Error("No file stream found");
	}
	await pipeline(file.file, fs.createWriteStream(uploadPath));
	if (fs.existsSync(uploadPath)) {
		console.log("✅ Fichier sauvegardé avec succès");
		const stats = fs.statSync(uploadPath);
		console.log("📁 Taille du fichier:", stats.size, "bytes");
	}
	const avatarPath = `/avatars/${fileName}`;
	console.log("avatarPath: ", avatarPath);

	await prisma.user.update({
		where: { username },
		data: { avatarUrl: avatarPath },
	});
	return avatarPath;
}
