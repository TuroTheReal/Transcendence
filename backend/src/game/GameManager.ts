import { FastifyInstance, FastifyRequest } from "fastify";
import { ServerPong, GameStateMessage } from "./ServerPongGame.js";

interface GameRoom {
	id: string;
	game: ServerPong;
	players: Map<string, { connection: any; lastPing: number }>;
	mode: "solo" | "versus" | "multi";
	createdAt: number;
	cleanupTimeout?: NodeJS.Timeout;
}

export class GameManager {
	private games: Map<string, GameRoom> = new Map();
	private fastify: FastifyInstance;
	private cleanupInterval: NodeJS.Timeout | undefined;
	private readonly MAX_GAMES = 10;
	private readonly CLEANUP_GRACE_PERIOD = 10000; // 10 secondes

	private rateLimitMap: Map<string, { count: number; resetTime: number }> =
		new Map();
	private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
	private readonly RATE_LIMIT_MAX_REQUESTS = 10; // 10 créations de parties par minute par IP

	private gamesListCache: { data: any[]; lastUpdate: number } | null = null;
	private readonly CACHE_DURATION = 5000; // 5 secondes de cache

	constructor(fastify: FastifyInstance) {
		this.fastify = fastify;
		this.setupWebSocketRoutes();
		this.setupPeriodicCleanup();
	}

	private setupWebSocketRoutes() {
		// WebSocket pour rejoindre/créer une partie
		this.fastify.get(
			"/ws/game/:gameId",
			{ websocket: true },
			(connection, req: FastifyRequest) =>
			{
				const params = req.params as { gameId: string };
				const query = req.query as {
					playerId?: string;
					mode?: "solo" | "versus" | "multi";
				};

				const gameId = params.gameId;
				const playerId = query.playerId || `player_${Date.now()}`;
				const clientIP = req.ip;

				//console.log(`🎮 Player ${playerId} connecting to game ${gameId} from IP ${clientIP}`);
				//console.log(`🔍 Query params:`, query);

				// Check the rate limiting
				if (!this.checkRateLimit(clientIP)) {
					console.warn(
						`🚫 Rate limit exceeded for ${clientIP}, rejecting WebSocket connection`
					);
					connection.close(1008, "Rate limit exceeded");
					return;
				}

				let gameRoom = this.games.get(gameId);

				// Create a new game if it doesn't exist
				if (!gameRoom) {
					const mode = query.mode || "versus";
					gameRoom = this.createGameRoom(gameId, mode);
 				}

				// Add the player to the game
				gameRoom.players.set(playerId, {
					connection: connection,
					lastPing: Date.now(),
				});

				try {
					gameRoom.game.setCallbacks(
						(state: GameStateMessage) =>
							this.broadcastGameState(gameId, state),
						(winner: "left" | "right") =>
							this.handleGameEnd(gameId, winner)
					);
				} catch (error) {
					console.error(`❌ Error setting callbacks:`, error);
				}

				// Send the initial state
				try {
					const initialState = gameRoom.game.getGameState();

					// connection EST directement le WebSocket
					connection.send(JSON.stringify(initialState));
				} catch (error) {
					console.error(`❌ Error sending initial state:`, error);
				}

				const wasEmpty = gameRoom.players.size === 1;
				if (wasEmpty) {
					setTimeout(() => {
						if (gameRoom && gameRoom.players.size > 0) {
							try {
								gameRoom.game.start();
							} catch (error) {
								console.error(
									`❌ Error starting server game:`,
									error
								);
							}
						}
					}, 1000);
				} else {
				}

				connection.on("message", (message: string) => {
					try {
						const data = JSON.parse(message);

						if (data.type === "ping") {
							const currentGameRoom = this.games.get(gameId);
							if (currentGameRoom) {
								const playerData =
									currentGameRoom.players.get(playerId);
								if (playerData) {
									playerData.lastPing = Date.now();
									// Respond with a pong
									playerData.connection.send(
										JSON.stringify({
											type: "pong",
											timestamp: Date.now(),
										})
									);
								}
							}
							return;
						}

						this.handlePlayerMessage(gameId, playerId, data);
					} catch (err) {
						console.error(
							"❌ Error parsing WebSocket message:",
							err
						);
					}
				});

				connection.on("error", (error: Error) => {
					console.error(`❌ WebSocket error for ${playerId}:`, error);
				});

				connection.on("close", (code: number, reason: Buffer) =>
				{
					this.handlePlayerDisconnect(gameId, playerId);
				});
				
			}
		);
	}

	private createGameRoom(
		gameId: string,
		mode: "solo" | "versus" | "multi"
	): GameRoom {
		const game = new ServerPong(gameId, mode);
		const gameRoom: GameRoom = {
			id: gameId,
			game,
			players: new Map(),
			mode,
			createdAt: Date.now(),
		};

		this.games.set(gameId, gameRoom);
		return gameRoom;
	}

	private setupPeriodicCleanup() {
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupOldGames();
				this.cleanupDeadConnections();
			},
			5 * 60 * 1000
		); // 5 minutes
	}

	private cleanupOldGames() {
		const now = Date.now();
		const maxAge = 30 * 60 * 1000; // 30 minutes

		for (const [gameId, gameRoom] of this.games) {
			const isOld = now - gameRoom.createdAt > maxAge;
			const isEmpty = gameRoom.players.size === 0;

			if (isOld || isEmpty)
			{
				this.removeGameRoom(gameId);
			}
		}

		this.cleanupRateLimit();

	}

	private checkRateLimit(ip: string): boolean {
		const now = Date.now();
		const clientData = this.rateLimitMap.get(ip);

		if (!clientData || now > clientData.resetTime) {
			this.rateLimitMap.set(ip, {
				count: 1,
				resetTime: now + this.RATE_LIMIT_WINDOW,
			});
			return true;
		}

		if (clientData.count >= this.RATE_LIMIT_MAX_REQUESTS) {
			console.warn(
				`🚫 Rate limit exceeded for IP ${ip} (${clientData.count}/${this.RATE_LIMIT_MAX_REQUESTS})`
			);
			return false;
		}

		clientData.count++;
		return true;
	}

	private cleanupRateLimit() {
		const now = Date.now();
		for (const [ip, data] of this.rateLimitMap) {
			if (now > data.resetTime) {
				this.rateLimitMap.delete(ip);
			}
		}
	}

	private cleanupDeadConnections() {
		const now = Date.now();
		const HEARTBEAT_TIMEOUT = 2 * 60 * 1000;

		for (const [gameId, gameRoom] of this.games) {
			const playersToRemove: string[] = [];

			for (const [playerId, playerData] of gameRoom.players) {
				const timeSinceLastPing = now - playerData.lastPing;

				if (timeSinceLastPing > HEARTBEAT_TIMEOUT)
				{
					playersToRemove.push(playerId);
				} else if (playerData.connection.readyState !== 1) {
					playersToRemove.push(playerId);
				}
			}

			// Remove dead players
			for (const playerId of playersToRemove) {
				this.handlePlayerDisconnect(gameId, playerId);
			}
		}
	}

	private removeGameRoom(gameId: string) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		if (gameRoom.cleanupTimeout) {
			clearTimeout(gameRoom.cleanupTimeout);
		}

		// Close all WebSocket connections
		for (const [playerId, playerData] of gameRoom.players) {
			try {
				if (playerData.connection.readyState === 1) {
					playerData.connection.close(1000, "Game room closing");
				}
			} catch (error) {
				console.error(
					`Error closing connection for player ${playerId}:`,
					error
				);
			}
		}

		// Stop the game
		try {
			if (typeof gameRoom.game.end_game === "function") {
				gameRoom.game.end_game();
			}
		} catch (error) {
			console.error(`Error ending game ${gameId}:`, error);
		}

		// Remove from the map
		this.games.delete(gameId);
		this.invalidateGamesCache();
	}

	private invalidateGamesCache() {
		this.gamesListCache = null;
	}

	private handlePlayerMessage(gameId: string, playerId: string, data: any) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		switch (data.type) {
			case "playerInput":
				// Send the inputs to the game
				gameRoom.game.handlePlayerInput(playerId, data.keys);
				break;

			case "pauseGame":
				break;

			case "restartGame":
				break;

			default:
				//console.log(`Unknown message type: ${data.type}`);
		}
	}

	private handlePlayerDisconnect(gameId: string, playerId: string) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		gameRoom.players.delete(playerId);

		// Cancel the old timeout if it exists
		if (gameRoom.cleanupTimeout) {
			clearTimeout(gameRoom.cleanupTimeout);
			gameRoom.cleanupTimeout = undefined;
		}

		// If no players, schedule the removal
		if (gameRoom.players.size === 0) {
			gameRoom.cleanupTimeout = setTimeout(() => {
				// Check again if the game is still empty
				const currentRoom = this.games.get(gameId);
				if (currentRoom && currentRoom.players.size === 0) {
					this.removeGameRoom(gameId);
				}
			}, this.CLEANUP_GRACE_PERIOD);
		}
	}

	private broadcastGameState(gameId: string, state: GameStateMessage) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		const stateMessage = JSON.stringify(state);

		// Send to all connected players
		for (const [playerId, playerData] of gameRoom.players) {
			try {
				if (playerData.connection.readyState === 1) {
					playerData.connection.send(stateMessage);
					playerData.lastPing = Date.now();
				}
			} catch (err) {
				console.error(
					`Error sending state to player ${playerId}:`,
					err
				);
				// Remove the disconnected player
				gameRoom.players.delete(playerId);
			}
		}
	}

	private handleGameEnd(gameId: string, winner: "left" | "right") {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		const endMessage = JSON.stringify({
			type: "gameEnd",
			winner,
			timestamp: Date.now(),
		});

		// Notify all players
		for (const [_, playerData] of gameRoom.players) {
			try {
				if (playerData.connection.readyState === 1) {
					playerData.connection.send(endMessage);
				}
			} catch (err) {
				console.error("Error sending game end message:", err);
			}
		}

	}

	// Public methods for the REST API
	public getGameState(gameId: string): GameStateMessage | null {
		const gameRoom = this.games.get(gameId);
		return gameRoom ? gameRoom.game.getGameState() : null;
	}

	public getAllGames(): Array<{
		id: string;
		mode: string;
		players: number;
		createdAt: number;
	}> {
		const now = Date.now();

		if (
			this.gamesListCache &&
			now - this.gamesListCache.lastUpdate < this.CACHE_DURATION
		) {
			return this.gamesListCache.data;
		}

		const gamesList = Array.from(this.games.values()).map((room) => ({
			id: room.id,
			mode: room.mode,
			players: room.players.size,
			createdAt: room.createdAt,
		}));

		this.gamesListCache = {
			data: gamesList,
			lastUpdate: now,
		};

		return gamesList;
	}

	public createGame(mode: "solo" | "versus" | "multi" = "versus"): string {
		if (this.games.size >= this.MAX_GAMES) {
			console.warn(
				`⚠️ Maximum number of games reached (${this.MAX_GAMES}). Cleaning up old games...`
			);
			this.cleanupOldGames();

			if (this.games.size >= this.MAX_GAMES) {
				throw new Error(
					`Too many active games. Please try again later.`
				);
			}
		}

		const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.createGameRoom(gameId, mode);
		this.invalidateGamesCache();
		return gameId;
	}

	public getStats() {
		const now = Date.now();
		const connections = Array.from(this.games.values()).reduce(
			(total, room) => total + room.players.size,
			0
		);

		return {
			totalGames: this.games.size,
			totalConnections: connections,
			rateLimitEntries: this.rateLimitMap.size,
			cacheStatus: this.gamesListCache ? "active" : "empty",
			cacheAge: this.gamesListCache
				? now - this.gamesListCache.lastUpdate
				: null,
			memoryUsage: process.memoryUsage(),
			uptime: process.uptime(),
		};
	}

	public shutdown() {
		//console.log("🛑 Shutting down GameManager...");

		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = undefined;
		}

		for (const gameId of this.games.keys()) {
			this.removeGameRoom(gameId);
		}

		//console.log("✅ GameManager shutdown complete");
	}
}
