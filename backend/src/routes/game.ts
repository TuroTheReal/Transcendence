import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma, PrismaClient, User, Match } from "@prisma/client";
import { extractTokenFromRequest } from "./profile.js";
import { GameManager } from "../game/GameManager.js";

interface GameDataRequest {
	players: number;
	player1: User;
	player1Id: number;
	player2: User;
	player2Id?: number | null;
	score1: number;
	score2: number;
	winnerId: number | null;
	playedAt: Date;
	lasted: number;
	pointsUp: number;
	pointsDown: number;
	iaMode?: boolean;
	tournamentMode?: boolean;
	multiMode?: boolean;
}

async function findUser(prisma: PrismaClient, playerId: number) {
	const user = await prisma.user.findUnique({
		where: {id: playerId}
	});
	return user;
}

export async function registerGameRoute(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient,
	gameManager: GameManager
) {
	// =============== SERVER-SIDE PONG API ROUTES ===============

	app.post("/api/game/create", async (request, reply) => {
		try {
			const { mode } = request.body as { mode?: 'solo' | 'versus' };
			const gameId = gameManager.createGame(mode || 'versus');

			reply.send({
				success: true,
				gameId,
				message: `Game created: ${gameId}`
			});
		} catch (error) {
			console.error('Error creating game:', error);
			reply.status(500).send({ error: 'Failed to create game' });
		}
	});

	app.get("/api/game/:gameId/state", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			reply.send({
				success: true,
				gameId,
				state: gameState
			});
		} catch (error) {
			console.error('Error getting game state:', error);
			reply.status(500).send({ error: 'Failed to get game state' });
		}
	});

	app.get("/api/game/:gameId/ball", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			reply.send({
				success: true,
				gameId,
				ball: {
					x: gameState.ball.ball_x,
					y: gameState.ball.ball_y,
					dirX: gameState.ball.ball_dir_x,
					dirY: gameState.ball.ball_dir_y,
					speed: Math.sqrt(gameState.ball.ball_dir_x ** 2 + gameState.ball.ball_dir_y ** 2)
				}
			});
		} catch (error) {
			console.error('Error getting ball position:', error);
			reply.status(500).send({ error: 'Failed to get ball position' });
		}
	});

	app.get("/api/game/:gameId/paddles", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			reply.send({
				success: true,
				gameId,
				paddles: {
					left: gameState.paddle.left_paddle_y,
					right: gameState.paddle.right_paddle_y
				}
			});
		} catch (error) {
			console.error('Error getting paddle positions:', error);
			reply.status(500).send({ error: 'Failed to get paddle positions' });
		}
	});

	// Obtenir le score actuel
	app.get("/api/game/:gameId/score", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			reply.send({
				success: true,
				gameId,
				score: {
					left: gameState.state.left_score,
					right: gameState.state.right_score
				},
				gameStatus: {
					running: gameState.state.game_running,
					paused: gameState.state.is_paused,
					mode: gameState.state.game_mode
				}
			});
		} catch (error) {
			console.error('Error getting game score:', error);
			reply.status(500).send({ error: 'Failed to get game score' });
		}
	});

	// Lister toutes les parties actives
	app.get("/api/games", async (request, reply) => {
		try {
			const games = gameManager.getAllGames();

			reply.send({
				success: true,
				games,
				totalGames: games.length
			});
		} catch (error) {
			console.error('Error listing games:', error);
			reply.status(400).send({ error: 'Failed to list games' });
		}
	});

	// =============== ANCIENNE API POUR SAUVEGARDER LES MATCHES ===============

	app.post("/api/game/add", async(request, reply) =>{
		try{
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			//console.log("AUTH GAME : ", auth);
			const gameData = request.body as GameDataRequest;
			if (!gameData) {
				reply.status(400).send({ error: "Game data not available" });
				return;
			}

			//console.log("GAME DATA : ", gameData);
			//console.log("PLAYER ID1 CHECK OK");
			if (!gameData.player1Id) {
				return reply.status(400).send({ error: "Player1 ID is required" });
			}

			//console.log("PLAYER ID1 CHECK OK");
			const user1 = await findUser(prisma, gameData.player1Id);
			if (!user1) {
				return reply.status(400).send({
					error: `Player 1 (ID: ${gameData.player1Id}) doesn't exist`
				});
			}
			//console.log("USER1 FOUND IN PRISMA");

			let user2 = null;
			if (gameData.player2Id) {
				user2 = await findUser(prisma, gameData.player2Id);
				if (!user2) {
					return reply.status(400).send({
						error: `Player 2 (ID: ${gameData.player2Id}) doesn't exist`
					});
				}
			}

			const game = await prisma.match.create({
				data: {
					players: gameData.players,
					player1Id: gameData.player1Id,
					//player1: { connect: { id: gameData.player1Id } },

					...(gameData.player2Id && user2 && {
						player2Id: gameData.player2Id,
						//player2: { connect: { id: gameData.player2Id } }
					}),

					score1: gameData.score1,
					score2: gameData.score2,
					winnerId: gameData.winnerId,
					playedAt: new Date(gameData.playedAt),
					lasted: gameData.lasted,
					pointsUp: gameData.pointsUp,
					pointsDown: gameData.pointsDown,
					iaMode: gameData.iaMode || false,
					tournamentMode: gameData.tournamentMode || false,
					multiMode: gameData.multiMode || false,
				}
			});

			//console.log("GAME CREATED:", game);
			await prisma.user.update({
					where: { id: gameData.player1Id },
					data: {
						gamesPlayed: { increment: 1 },
						...(gameData.player1Id === gameData.winnerId
							? { wins: { increment: 1 } }
							: { losses: { increment: 1 } }
						),
						matchesAsPlayer1: { connect: { id: game.id } }
					}
				});
			if (gameData.player2Id){
				await prisma.user.update({
					where: { id: gameData.player2Id },
					data: {
						gamesPlayed: { increment: 1 },
						...(gameData.player2Id === gameData.winnerId
							? { wins: { increment: 1 } }
							: { losses: { increment: 1 } }
						),
						matchesAsPlayer2: { connect: { id: game.id } }
					}
				});
			}
			reply.send({
				success: true,
				gameId: game.id,
			});
		} catch (error: any) {
			console.error("Error while creating match:", error);
			reply.status(500).send({
				error: "Internal server error",
				details: error.message
			});
		}
	});

	app.get("/api/game/stats", async(
		request: FastifyRequest<{ Querystring: { username: string }}>,
		reply:  FastifyReply
	) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}

		const username = request.query.username as string;
		const statResults = await generateStats(prisma, username)
        if (statResults === null) {
            return reply.status(404).send({ error: 'stat Results not found for user' });
        }
		const {iaStats, tournamentStats, multiStats} = statResults;
		if (!iaStats || !tournamentStats || !multiStats)
			return reply.status(400).send({ error: "No game stats" });
		// console.log("iaStats: ", iaStats);
		// console.log("tournamentStats: ", tournamentStats);
		// console.log("multiStats: ", multiStats);
		return reply.status(200).send({success:true, iaStats, tournamentStats, multiStats});
	});
}

class GlobalStat {
	winner: number = 0;
	loser: number = 0;
	lasted: number = 0;
	pointsUp: number = 0;
	pointsDown: number = 0;
	score: number = 0;
}

async function generateStats(prisma: PrismaClient, username: string)
{
	const matches = await prisma.user.findUnique({
		where: { username },
		select:{
			matchesAsPlayer1: true,
			matchesAsPlayer2: true,
			gamesPlayed: true,
		}
	});
	if (!matches)
		return null;
	let iaStats = new GlobalStat;
	let tournamentStats = new GlobalStat;
	let multiStats = new GlobalStat;
	if (matches.matchesAsPlayer1.length > 0 || matches.matchesAsPlayer2.length > 0){
		await handleMatches(matches.matchesAsPlayer1, prisma, username, iaStats, tournamentStats, multiStats)
		await handleMatches(matches.matchesAsPlayer2, prisma, username, iaStats, tournamentStats, multiStats)
	}
	return {iaStats, tournamentStats, multiStats};
}

async function getWinnerStatus(prisma: PrismaClient, username: string, matche: Match): Promise <number>
{
	const user = await prisma.user.findUnique({
		where: { username },
		select:{ id: true }
	});
	if (!user) return 0;
	return matche.winnerId === user.id ? 1 : -1;
}

function addUpGameStats(matche: Match, tab: GlobalStat, winCount: number)
{
	if (winCount > 0) {
		tab.winner += 1;
	} else if (winCount < 0) {
		tab.loser += 1;
	}
	tab.lasted += matche.lasted;
	tab.pointsUp += matche.pointsUp;
	tab.pointsDown += matche.pointsDown;
	tab.score += matche.score1;
}

async function handleMatches(
	matches: Match[],
	prisma: PrismaClient,
	username: string,
	iaStats: GlobalStat,
	tournamentStats: GlobalStat,
	multiStats: GlobalStat)
{
	let iaGames = 0, tounamentGames = 0, multiGames = 0;
	for (let matche of matches)
	{
		if (matche.iaMode == true)
		{
			iaGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, iaStats, winCount);
		}
		else if (matche.tournamentMode == true)
		{
			tounamentGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, tournamentStats, winCount);
		}
		else if (matche.multiMode == true)
		{
			multiGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, multiStats, winCount);
		}
	}
}