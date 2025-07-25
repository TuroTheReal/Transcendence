import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export const activeSessions = new Map<string, { userId: number; username: string; expiresAt: Date }>();

const secretKey = process.env.COOKIE_SECRET;

export async function handleLogIn(app: FastifyInstance<any, any, any, any>, prisma: PrismaClient){
	console.log("DEBUG LOGIN MANAGEMENT");
	// app.register(cookie, {
	// 	secret: secretKey,
	// 	parseOptions: {},
	// } as FastifyCookieOptions);
	// console.log("DEBUG LOGIN MANAGEMENT 2");

	app.post("/api/login", async (request: FastifyRequest, reply: FastifyReply) => {
			const { username, password } = request.body as { username: string; password: string };

			console.log(username);
			console.log(password);
			try{
				const user = await prisma.user.findUnique({
					where: { username }
				});
				if (!user)
					return reply.status(401).send({success: false, message: "User not found"});
				const passwordCheck = await bcrypt.compare(password, user.passwordHash);
				if (!passwordCheck)
					return reply.status(401).send({success: false, message: "Wrong password"});
				// JWT generation
				await prisma.user.update({
					where: { id:user.id },
					data: {
						connected: true
					}
				});
				console.log("✅ User status :", user.connected);
				console.log("🔑 Generating JWT for user:", user.username);
				console.log("🔑 Secret key:", secretKey || 'fallback-secret-key');

				const token = jwt.sign({
					id: user.id,
					username: user.username
				}, secretKey || 'fallback-secret-key', {
					expiresIn: '24h'
				});

				console.log("🔑 Generated token:", token);

				// Plus besoin de activeSessions Map ni de cookies

				return reply.send({
					success: true,
					token: token, // Envoyer le JWT au frontend
					user: {
						id: user.id,
						username: user.username,
						avatarUrl: user.avatarUrl,
					}
				});

			} catch (err) {
				console.error('Login error:', err);
				reply.status(500).send({
					success: false,
					message: "Internal server error"
				});
			}
	});

	app.get("/api/me", async (request: FastifyRequest, reply: FastifyReply) =>{
		// Read JWT from header Authorization
		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return reply.status(401).send({success: false, message: "Not authenticated"});
		}

		const token = authHeader.substring(7); // Remove "Bearer "

		try {
			// Verify and decode the JWT
			const decoded = jwt.verify(token, secretKey || 'fallback-secret-key') as any;

			// Get the user from the DB
			const user = await prisma.user.findUnique({
				where: { id: decoded.id },
				select: {
					id: true,
					username: true,
					avatarUrl: true,
					connected: true,
					gamesPlayed:true,
					wins: true,
					losses: true,
				}
			});

			if (!user) {
				return reply.status(401).send({ error: "User not found" });
			}

			reply.send(user);
		} catch (error) {
			console.error('JWT verification error:', error);
			reply.status(401).send({ error: "Invalid token" });
		}
	});

	app.post("/api/logout", async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return reply.status(401).send({ success: false, message: "Not authenticated" });
		}
		const token = authHeader.substring(7);
		try {
			const decoded = jwt.verify(token, secretKey || 'fallback-secret-key') as any;
			await prisma.user.update({
				where: { id: decoded.id },
				data: { connected: false }
			});
			reply.send({ success: true });
		} catch (error) {
			reply.status(401).send({ success: false, message: "Invalid token" });
		}
	});
}

export function requireAuth() {
	return async (request: any, reply: any) => {
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return reply.status(401).send({ error: "Authentication required" });
		}

		const token = authHeader.substring(7);

		try {
			const decoded = jwt.verify(token, secretKey || 'fallback-secret-key') as any;
			request.user = { userId: decoded.id, username: decoded.username };
		} catch (error) {
			return reply.status(401).send({ error: "Invalid token" });
		}
	};
}

export async function secureRoutes(app: FastifyInstance, prisma: PrismaClient) {
    const authMiddleware = requireAuth();

    // Apply the middleware to the protected routes
    app.addHook('preHandler', async (request, reply) => {
        const protectedPaths = [
            '/api/login',
            '/api/profile',
            '/api/profile/avatar',
            '/api/profile/username',
            '/api/profile/password',
            '/api/profile/matches',
			'/api/profile/friends',
			'/api/profile/friends/add',
            '/api/game',
            '/api/chat'
        ];

        const isProtected = protectedPaths.some(path =>
            request.url.startsWith(path)
        );

        if (isProtected) {
            await authMiddleware(request, reply);
        }
    });
}

// async function generateJWT(username: string, prisma: PrismaClient){
// 	const user = await prisma.user.findUnique({
// 		where: { username }
// 	});
// 	const token = jwt.sign({
// 		id: user?.id,
// 		username: user?.username},
// 		secretKey,
// 		{ expiresIn: '1h' }
// 	);
// 	return token;
// }
