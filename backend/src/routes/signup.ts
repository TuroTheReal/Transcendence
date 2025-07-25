import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fastifyMultipart, Multipart } from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import { UserSignUpCheck } from "../other/signUpCheck.js"
import * as bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { PROJECT_ROOT } from "../server.js";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BCRYPT_ROUNDS = 12;

interface ParsedUserData {
	usernameValue: string;
	passwordValue: string;
	emailValue?: string;
	hashedPassword: string;
	avatarFile: any | null;
}

const AVATAR_CONFIG = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExts: ['jpg', 'jpeg', 'png', 'webp']
};

function validateAvatarFile(file: any): boolean {
	if (!file) return false;

	if (file.file && file.file.bytesRead > AVATAR_CONFIG.maxSize) {
		return false;
	}

	if (!AVATAR_CONFIG.allowedMimes.includes(file.mimetype)) {
		return false;
	}

	return true;
}

async function parseUserFormData(
	parts: AsyncIterableIterator<Multipart>,
	reply: FastifyReply
): Promise<ParsedUserData | null> {
	const fields: Record<string, any> = {};
	let avatarFile: any = null;

	try {
		for await (const part of parts) {
			if (part.type === "file" && part.fieldname === "avatar") {
				if (!validateAvatarFile(part)) {
					reply.code(400).send({
						error: "Invalid avatar file. Must be an image under 5MB."
					});
					return null;
				}
				avatarFile = part;
			} else if (part.type === "field") {
				const value = typeof part.value === 'string' ? part.value.trim() : part.value;
				fields[part.fieldname] = value;
			}
		}

		const usernameValue = fields.username;
		const passwordValue = fields.password;
		const emailValue = fields.email;

		if (!usernameValue || !passwordValue) {
			reply.code(400).send({
				error: "Username and password are required fields."
			});
			return null;
		}

		if (typeof passwordValue !== 'string' || passwordValue.length > 128) {
			reply.code(400).send({
				error: "Password must be a string and cannot exceed 128 characters."
			});
			return null;
		}
		const hashedPassword = await bcrypt.hash(passwordValue, BCRYPT_ROUNDS);

		console.log("Parsed user data:", {
			username: usernameValue,
			hasEmail: !!emailValue,
			hasAvatar: !!avatarFile
		});

		return {
			usernameValue,
			passwordValue,
			emailValue,
			hashedPassword,
			avatarFile
		};
	} catch (error) {
		console.error("Error parsing form data:", error);
		reply.code(400).send({
			error: "Invalid form data format."
		});
		return null;
	}
}

async function saveAvatar(avatarFile: any, username: string): Promise<string> {
	console.log("PROJECT_ROOT", PROJECT_ROOT);
	const avatarsDir = path.join(PROJECT_ROOT, "./public/avatars");
	if (!fs.existsSync(avatarsDir)) {
		fs.mkdirSync(avatarsDir, { recursive: true });
	}

	const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
	const timestamp = Date.now();
	const hash = createHash('md5').update(safeUsername + timestamp).digest('hex').substring(0, 8);
	const ext = avatarFile.mimetype === 'image/jpeg' ? 'jpg' : 'png';

	const fileName = `${safeUsername}_${hash}.${ext}`;
	const uploadPath = path.join(avatarsDir, fileName);
	await pipeline(avatarFile.file, fs.createWriteStream(uploadPath));
	return `/avatars/${fileName}`;
}

async function createUser(
	prisma: PrismaClient,
	username: string,
	hashedPassword: string,
	avatarPath: string
) {
	const existingUser = await prisma.user.findUnique({
		where: { username }
	});

	if (existingUser) {
		throw new Error("Username already exists");
	}
	console.log("About to create new user");
	console.log("avatarUrl: ", avatarPath);
	// Générer un email unique avec timestamp et random
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const uniqueEmail = `${username}_${timestamp}_${random}@transcendence.local`;

	const user = await prisma.user.create({
		data: {
			username,
			passwordHash: hashedPassword,
			email: uniqueEmail,
			avatarUrl: avatarPath || null,
		},
		select: {
			id: true,
			username: true,
			email: true,
			avatarUrl: true
		}
	});
	return user;
}

export async function registerNewUser(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	app.post("/api/signup", async (request, reply) => {
		const parts = request.parts();
		const userData = await parseUserFormData(parts, reply);
		if (!userData){return;}
		const userInfoForValidation = {
			username: userData.usernameValue,
			password: userData.passwordValue,
			avatar: userData.avatarFile
		};
		console.log("userInfoForValidation: ", userInfoForValidation);
		const checkResult = UserSignUpCheck(userInfoForValidation);
		if (checkResult === true){
			const { usernameValue, hashedPassword, avatarFile } =
				userData;
			console.log("AFTER USER SIGNUP CHECK");
			try {
				let avatarPath = "";
				if (avatarFile)
					avatarPath = await saveAvatar(avatarFile, usernameValue);
				const created = await createUser(
					prisma,
					usernameValue,
					hashedPassword,
					avatarPath
				);

				console.log("Created user:", created);
				reply.code(200).send({ success: true });
			} catch (err: any) {
				console.error("Signup error:", err);
				if (err.message === "Username already exists") {
					reply.code(409).send({ error: "Username already exists" });
				} else {
					reply.code(500).send({
						error: "Failed to create account. Please try again."
					});
				}
			}
		} else {
			reply.code(400).send({ error: checkResult });
			return ;
		}
	});
}
