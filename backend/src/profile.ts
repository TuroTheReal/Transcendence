import { FastifyInstance } from "fastify";
import { FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import bcrypt from "bcrypt";
import { PROJECT_ROOT } from './server.js';

function getFieldValue(field: any): string | undefined {
	if (!field) return undefined;
	if (Array.isArray(field)) field = field[0];
	if (typeof field.value === 'string') return field.value;
	if (Buffer.isBuffer(field.value)) return field.value.toString();
	return undefined;
}

export async function registerProfileRoute(app: FastifyInstance, prisma: PrismaClient) {
	app.get('/api/profile', async (request: FastifyRequest<{ Querystring: { username: string } }>, reply) => {
		const username = request.query.username as string; // RECUPERER LE USERNAME DU JWT
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		const { code, data } = await getUserInfo(username, prisma);
		reply.status(code).send(data);
	});

	// HANDLE AVATAR REQUEST
	app.post('/api/profile/avatar', async (request: FastifyRequest, reply) => {
		const file = await request.file();
		console.log("file: ", file);
		if (!file){
			reply.status(400).send({ error: "Avatar file is required" });
			return;
		}
		const username = getFieldValue(file.fields.username);
		console.log("username: ", username);
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		const avatarUrl = updateAvatar(prisma, username, file.file);
		reply.status(200).send({ success: true, avatarUrl});
	});

	// HANDLE USERNAME REQUEST
	app.post('/api/profile/username', async (request: FastifyRequest<{ Querystring: { username: string, newUsername: string } }>, reply) => {
		const {username, newUsername} =  request.body as { username: string; newUsername: string }; // RECUPERER LE USERNAME DU JWT
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		try {
			await updateUsername(prisma, username, newUsername);
			reply.status(200).send({ success: true });
		} catch (err) {
			reply.status(400).send({ error: "Username already exists or update failed" });
		}
	});

	// HANDLE PASSWORD REQUEST
	app.post('/api/profile/password', async (request: FastifyRequest<{ Querystring: { username: string, newPassword: string } }>, reply) => {
		const {username, newPassword} =  request.body as { username: string; newPassword: string }; // RECUPERER LE USERNAME DU JWT
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		try {
			await updatePassword(prisma, username, newPassword);
			reply.status(200).send({ success: true });
		} catch (err) {
			reply.status(400).send({ error: "Update failed" });
		}
	});

}

async function getUserInfo(username: string, prisma: PrismaClient){
	if (!username) {
		 return { code: 401, data: { error: "Not authenticated" } };
	}
	const user = await prisma.user.findUnique({
		where: { username },
		select: { username: true, avatarUrl: true, passwordHash: true }
	});
	if (!user) {
		return { code: 404, data: { error: "User not found" } };
	}
	return { code: 200, data: user };
}

async function updateUsername(prisma: PrismaClient, username: string, newUsername: string){
	await prisma.user.update({
			where: { username },
			data: { username: newUsername }
		});
}

async function updatePassword(prisma: PrismaClient, username: string, newPassword: string){
	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({
			where: { username },
			data: { passwordHash: hashedPassword }
		});
}

async function updateAvatar(prisma: PrismaClient, username: string, file: any) {
	const uploadPath = path.join(PROJECT_ROOT, "./public/avatars", `${username}.png`);
	console.log("uploadPath: ", uploadPath);
	await pipeline(file, fs.createWriteStream(uploadPath));
	const avatarUrl = `/avatars/${username}.png`;
	console.log("avatarUrl: ", avatarUrl);

	await prisma.user.update({
		where: { username },
		data: { avatarUrl: avatarUrl }
	});
	return avatarUrl;
}