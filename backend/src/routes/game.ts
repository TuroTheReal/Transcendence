import { FastifyInstance } from "fastify";
import { Prisma, PrismaClient, User } from "@prisma/client";
import { extractTokenFromRequest } from "./profile.js";
import { GameManager } from "../game/GameManager.js";

interface GameDataRequest {
	players: number;
	player1: User;
	player1Id: number;
	player2: User;
	player2Id: number;
	score1: number;
	score2: number;
	winnerId: number;
	playedAt: Date;
	lasted: number;
	pointsUp: number;
	pointsDown: number;
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
	
	// Créer une nouvelle partie
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

	// Obtenir l'état d'une partie spécifique
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

	// Obtenir seulement la position de la balle
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

	// Obtenir seulement les positions des paddles
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
			reply.status(500).send({ error: 'Failed to list games' });
		}
	});

	// =============== ANCIENNE API POUR SAUVEGARDER LES MATCHES ===============
	
	app.post("/api/game/add", async(request, reply) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}

		const gameData = request.body as GameDataRequest;
		if (!gameData) {
			reply.status(400).send({ error: "Game data not available" });
			return;
		}

		if (!gameData.player1Id || !gameData.player2Id) {
			reply.status(400).send({ error: "Player IDs are required" });
			return;
		}

		const [user1, user2] = await Promise.all([
			findUser(prisma, gameData.player1Id),
			findUser(prisma, gameData.player2Id)
		]);

		if (!user1) {
			reply.status(400).send({ error: `Player 1 (ID: ${gameData.player1Id}) doesn't exist` });
			return;
		}

		if (!user2) {
			reply.status(400).send({ error: `Player 2 (ID: ${gameData.player2Id}) doesn't exist` });
			return;
		}

		const game = await prisma.match.create({
			data:{
				players: gameData.players,
				player1Id: gameData.player1Id,
				player2Id: gameData.player2Id,
				score1: gameData.score1,
				score2: gameData.score2,
				winnerId: gameData.winnerId,
				playedAt: gameData.playedAt,
				lasted: gameData.lasted,
				pointsUp: gameData.pointsUp,
				pointsDown: gameData.pointsDown,
			}
		});

		await Promise.all([
			prisma.user.update({
				where: { id: gameData.player1Id },
				data: {
					gamesPlayed: { increment: 1 }
				}
			}),
			prisma.user.update({
				where: { id: gameData.player2Id },
				data: {
					gamesPlayed: { increment: 1 }
				}
			})
		]);
		reply.send({
			success: true,
			gameId: game.id,
		});
	});
}