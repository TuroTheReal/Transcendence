import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
const secretKey = 'abcde12345';

export async function handleLogIn(app: FastifyInstance, prisma: PrismaClient){
	console.log("DEBUG LOGIN MANAGEMENT");
	app.post("/api/login", async (request, reply) => {
			const { username, password } = request.body as { username: string; password: string };

			console.log(username);
			console.log(password);
			const user = await prisma.user.findUnique({
				where: { username }
			});
			if (!user)
				return reply.status(401).send({success: false, message: "User not found"});
			const passwordCheck = await bcrypt.compare(password, user.passwordHash);
			if (!passwordCheck)
				return reply.status(401).send({success: false, message: "Wrong password"});
			//const token = generateJWT(username,prisma);
			reply.send({success: true});

	});
}

async function generateJWT(username: string, prisma: PrismaClient){
	const user = await prisma.user.findUnique({
		where: { username }
	});
	const token = jwt.sign({
		id: user?.id,
		username: user?.username},
		secretKey,
		{ expiresIn: '1h' }
	);
	return token;
}