// import { FastifyInstance } from "fastify";
// import { Prisma, PrismaClient, User } from "@prisma/client";
// import { extractTokenFromRequest } from "./profile.js"

// interface GameDataRequest {
// 	players: number;
// 	player1: User;
// 	player1Id: number;
// 	player2: User;
// 	player2Id: number;
// 	score1: number;
// 	score2: number;
// 	winnerId: number;
// 	playedAt: Date;
// 	lasted: number;
// 	pointsUp: number;
// 	pointsDown: number;
// }

// async function findUser(prisma: PrismaClient, playerId: number)
// {
// 	const user = await prisma.user.findUnique({
// 		where: {id: playerId}
// 	});
// 	return user;
// }

// export async function registerGameRoute(
// 	app: FastifyInstance<any, any, any, any>,
// 	prisma: PrismaClient
// )	{
// 	app.post("/api/game/add", async(request, reply) =>{
// 		const auth = extractTokenFromRequest(request);
// 		if (!auth) {
// 			return reply.status(401).send({ error: 'Unauthorized' });
// 		}

// 		const gameData = request.body as GameDataRequest;
// 		if (!gameData) {
// 			reply.status(400).send({ error: "Game data not available" });
// 			return;
// 		}

// 		if (!gameData.player1Id || !gameData.player2Id) {
// 			reply.status(400).send({ error: "Player IDs are required" });
// 			return;
// 		}

// 		const [user1, user2] = await Promise.all([
// 			findUser(prisma, gameData.player1Id),
// 			findUser(prisma, gameData.player2Id)
// 		]);

// 		if (!user1) {
// 			reply.status(400).send({ error: `Player 1 (ID: ${gameData.player1Id}) doesn't exist` });
// 			return;
// 		}

// 		if (!user2) {
// 			reply.status(400).send({ error: `Player 2 (ID: ${gameData.player2Id}) doesn't exist` });
// 			return;
// 		}

// 		const game = await prisma.match.create({
// 			data:{
// 				players: gameData.players,
// 				player1Id: gameData.player1Id,
// 				player1: { connect: { id: gameData.player1Id } },
// 				player2Id: gameData.player2Id,
// 				player2: { connect: { id: gameData.player1Id } },
// 				score1: gameData.score1,
// 				score2: gameData.score2,
// 				winnerId: gameData.winnerId,
// 				playedAt: gameData.playedAt,
// 				lasted: gameData.lasted,
// 				pointsUp: gameData.pointsUp,
// 				pointsDown: gameData.pointsDown,
// 			}
// 		});

// 		await Promise.all([
// 			prisma.user.update({
// 				where: { id: gameData.player1Id },
// 				data: {
// 					gamesPlayed: { increment: 1 },
// 					matchesAsPlayer1: { connect: { id: game.id } }
// 				}
// 			}),
// 			prisma.user.update({
// 				where: { id: gameData.player2Id },
// 				data: {
// 					gamesPlayed: { increment: 1 },
// 					matchesAsPlayer2: { connect: { id: game.id } }
// 				}
// 			})
// 		]);
// 		reply.send({
// 			success: true,
// 			gameId: game.id,
// 		});
// 	});
// }

// // class GlobalStat {
// // 	winnerId: number = 0;
// // 	lasted: number = 0;
// // 	pointsUp: number = 0;
// // 	pointsDown: number = 0;
// // 	score1: number = 0;
// // 	score2: number = 0;
// // }

// // async function generateStatDashboard(prisma: PrismaClient, username: string)
// // {
// // 	try
// // 	{
// // 		const user = await prisma.user.findUnique({ where: { username } });


// // 	} catch(error){
// // 		console.error("Generate Dashboard: ", error);
// // 	}

// // }


// // async function generateIAStats(prisma: PrismaClient, user: any)
// // {
// // 	const matchesPlayer1 = await prisma.user.findMany({
// // 		where: {user.id: id}
// // 	})
// // }