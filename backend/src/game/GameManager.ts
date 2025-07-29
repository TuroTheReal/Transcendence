import { FastifyInstance, FastifyRequest } from "fastify";
import { ServerPong, GameStateMessage } from "./ServerPongGame.js";

interface GameRoom {
	id: string;
	game: ServerPong;
	players: Map<string, { connection: any; lastPing: number }>; // WebSocket connection avec heartbeat
	mode: "solo" | "versus" | "multi";
	createdAt: number;
	// ✅ AJOUT : timeout pour nettoyage
	cleanupTimeout?: NodeJS.Timeout;
}

export class GameManager {
	private games: Map<string, GameRoom> = new Map();
	private fastify: FastifyInstance;
	// ✅ AJOUT : nettoyage périodique
	private cleanupInterval: NodeJS.Timeout | undefined;
	// ✅ AJOUT : limite du nombre de parties
	private readonly MAX_GAMES = 10;
	private readonly CLEANUP_GRACE_PERIOD = 10000; // 10 secondes au lieu de 30

	// ✅ NOUVEAU : Rate limiting
	private rateLimitMap: Map<string, { count: number; resetTime: number }> =
		new Map();
	private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
	private readonly RATE_LIMIT_MAX_REQUESTS = 10; // 10 créations de parties par minute par IP

	// ✅ NOUVEAU : Cache pour l'API
	private gamesListCache: { data: any[]; lastUpdate: number } | null = null;
	private readonly CACHE_DURATION = 5000; // 5 secondes de cache

	constructor(fastify: FastifyInstance) {
		this.fastify = fastify;
		this.setupWebSocketRoutes();
		// ✅ AJOUT : nettoyage périodique toutes les 5 minutes
		this.setupPeriodicCleanup();
	}

	private setupWebSocketRoutes() {
		// WebSocket pour rejoindre/créer une partie
		this.fastify.get(
			"/ws/game/:gameId",
			{ websocket: true },
			(connection, req: FastifyRequest) => {
				console.log("🔌 WebSocket connection attempt...");

				const params = req.params as { gameId: string };
				const query = req.query as {
					playerId?: string;
					mode?: "solo" | "versus" | "multi";
				};

				const gameId = params.gameId;
				const playerId = query.playerId || `player_${Date.now()}`;
				const clientIP = req.ip;

				console.log(
					`🎮 Player ${playerId} connecting to game ${gameId} from IP ${clientIP}`
				);
				console.log(`🔍 Query params:`, query);

				// ✅ NOUVEAU : vérifier le rate limiting
				if (!this.checkRateLimit(clientIP)) {
					console.warn(
						`🚫 Rate limit exceeded for ${clientIP}, rejecting WebSocket connection`
					);
					connection.close(1008, "Rate limit exceeded");
					return;
				}

				let gameRoom = this.games.get(gameId);

				// Créer une nouvelle partie si elle n'existe pas
				if (!gameRoom) {
					const mode = query.mode || "versus";
					console.log(
						`🆕 Creating new game room: ${gameId} (${mode})`
					);
					gameRoom = this.createGameRoom(gameId, mode);
					console.log(
						`✅ New game room created: ${gameId} (${mode})`
					);
				} else {
					console.log(`🔄 Using existing game room: ${gameId}`);
				}

				// Ajouter le joueur à la partie
				console.log(`👤 Adding player ${playerId} to game room`);
				gameRoom.players.set(playerId, {
					connection: connection,
					lastPing: Date.now(),
				});
				console.log(`👥 Players in room: ${gameRoom.players.size}`);

				// Configurer les callbacks du jeu
				console.log(`⚙️ Setting up game callbacks for ${gameId}`);
				try {
					gameRoom.game.setCallbacks(
						(state: GameStateMessage) =>
							this.broadcastGameState(gameId, state),
						(winner: "left" | "right") =>
							this.handleGameEnd(gameId, winner)
					);
					console.log(`✅ Game callbacks configured successfully`);
				} catch (error) {
					console.error(`❌ Error setting callbacks:`, error);
				}

				// Envoyer l'état initial
				console.log(`📤 Sending initial game state to ${playerId}`);
				try {
					const initialState = gameRoom.game.getGameState();
					console.log(`🔍 Connection type:`, typeof connection);
					console.log(`🔍 Connection keys:`, Object.keys(connection));

					// connection EST directement le WebSocket
					connection.send(JSON.stringify(initialState));
					console.log(`✅ Initial state sent successfully`);
				} catch (error) {
					console.error(`❌ Error sending initial state:`, error);
				}

				const wasEmpty = gameRoom.players.size === 1;
				console.log(
					`🎯 Should start game? Players: ${gameRoom.players.size}, wasEmpty: ${wasEmpty}`
				);
				if (wasEmpty) {
					console.log(
						`🚀 Starting game ${gameId} (first player connected)`
					);
					setTimeout(() => {
						if (gameRoom && gameRoom.players.size > 0) {
							console.log(
								`🎮 Actually starting server game for ${gameId}`
							);
							try {
								gameRoom.game.start();
								console.log(
									`✅ Server game started successfully!`
								);
							} catch (error) {
								console.error(
									`❌ Error starting server game:`,
									error
								);
							}
						}
					}, 1000);
				} else {
					console.log(
						`👥 Additional player joined game ${gameId} (${gameRoom.players.size} total players)`
					);
				}

				console.log(
					`🔧 Setting up WebSocket event handlers for ${playerId}`
				);

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
									// Répondre avec un pong
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

						console.log(
							`📨 Message from ${playerId}:`,
							data.type,
							data
						);
						this.handlePlayerMessage(gameId, playerId, data);
					} catch (err) {
						console.error(
							"❌ Error parsing WebSocket message:",
							err
						);
					}
				});

				// Gérer les erreurs
				connection.on("error", (error: Error) => {
					console.error(`❌ WebSocket error for ${playerId}:`, error);
				});

				// Gérer la déconnexion
				connection.on("close", (code: number, reason: Buffer) => {
					console.log(
						`👋 Player ${playerId} disconnected from game ${gameId} (code: ${code}, reason: ${reason.toString()})`
					);
					this.handlePlayerDisconnect(gameId, playerId);
				});

				console.log(
					`✅ Event handlers set up successfully for ${playerId}`
				);
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

	// ✅ AJOUT : nettoyage périodique
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

			if (isOld || isEmpty) {
				console.log(
					`🧹 Cleaning up old/empty game: ${gameId} (age: ${Math.round((now - gameRoom.createdAt) / 1000)}s, players: ${gameRoom.players.size})`
				);
				this.removeGameRoom(gameId);
			}
		}

		this.cleanupRateLimit();

		console.log(`📊 Active games after cleanup: ${this.games.size}`);
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
		const HEARTBEAT_TIMEOUT = 5 * 60 * 1000; // 5 minutes sans ping = connexion morte

		for (const [gameId, gameRoom] of this.games) {
			const playersToRemove: string[] = [];

			for (const [playerId, playerData] of gameRoom.players) {
				const timeSinceLastPing = now - playerData.lastPing;

				if (timeSinceLastPing > HEARTBEAT_TIMEOUT) {
					console.log(
						`💀 Player ${playerId} seems dead (no activity for ${Math.round(timeSinceLastPing / 1000)}s), removing...`
					);
					playersToRemove.push(playerId);
				} else if (playerData.connection.readyState !== 1) {
					console.log(
						`🔌 Player ${playerId} connection not open (state: ${playerData.connection.readyState}), removing...`
					);
					playersToRemove.push(playerId);
				}
			}

			// Supprimer les joueurs morts
			for (const playerId of playersToRemove) {
				this.handlePlayerDisconnect(gameId, playerId);
			}
		}
	}

	private removeGameRoom(gameId: string) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		// Annuler le timeout de nettoyage si il existe
		if (gameRoom.cleanupTimeout) {
			clearTimeout(gameRoom.cleanupTimeout);
		}

		// Fermer toutes les connexions WebSocket
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

		// Arrêter le jeu
		try {
			if (typeof gameRoom.game.end_game === "function") {
				gameRoom.game.end_game();
			}
		} catch (error) {
			console.error(`Error ending game ${gameId}:`, error);
		}

		// Supprimer de la map
		this.games.delete(gameId);
		this.invalidateGamesCache();
		console.log(`🗑️ Game room removed: ${gameId}`);
	}

	private invalidateGamesCache() {
		this.gamesListCache = null;
	}

	private handlePlayerMessage(gameId: string, playerId: string, data: any) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		switch (data.type) {
			case "playerInput":
				// Transmettre les inputs au jeu
				gameRoom.game.handlePlayerInput(playerId, data.keys);
				break;

			case "pauseGame":
				// Gérer la pause (si implémentée)
				break;

			case "restartGame":
				// Gérer le restart (si implémenté)
				break;

			default:
				console.log(`Unknown message type: ${data.type}`);
		}
	}

	private handlePlayerDisconnect(gameId: string, playerId: string) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		gameRoom.players.delete(playerId);
		console.log(
			`👋 Player ${playerId} disconnected. Remaining players: ${gameRoom.players.size}`
		);

		// Annuler l'ancien timeout si il existe
		if (gameRoom.cleanupTimeout) {
			clearTimeout(gameRoom.cleanupTimeout);
			gameRoom.cleanupTimeout = undefined;
		}

		// Si plus de joueurs, programmer la suppression
		if (gameRoom.players.size === 0) {
			console.log(
				`⏰ Scheduling cleanup for empty game ${gameId} in ${this.CLEANUP_GRACE_PERIOD / 1000}s`
			);
			gameRoom.cleanupTimeout = setTimeout(() => {
				// Vérifier à nouveau si la partie est toujours vide
				const currentRoom = this.games.get(gameId);
				if (currentRoom && currentRoom.players.size === 0) {
					console.log(`🗑️ Removing empty game room: ${gameId}`);
					this.removeGameRoom(gameId);
				}
			}, this.CLEANUP_GRACE_PERIOD);
		}
	}

	private broadcastGameState(gameId: string, state: GameStateMessage) {
		const gameRoom = this.games.get(gameId);
		if (!gameRoom) return;

		const stateMessage = JSON.stringify(state);

		// Envoyer à tous les joueurs connectés
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
				// Supprimer le joueur déconnecté
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

		// Notifier tous les joueurs
		for (const [_, playerData] of gameRoom.players) {
			try {
				if (playerData.connection.readyState === 1) {
					playerData.connection.send(endMessage);
				}
			} catch (err) {
				console.error("Error sending game end message:", err);
			}
		}

		console.log(`🏆 Game ${gameId} ended. Winner: ${winner}`);
	}

	// Méthodes publiques pour l'API REST
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
		console.log(
			`🎮 New game created via API: ${gameId} (${mode}) - Total games: ${this.games.size}`
		);
		return gameId;
	}

	// ✅ NOUVEAU : obtenir les statistiques de performance
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

	// ✅ AJOUT : méthode pour nettoyer au shutdown
	public shutdown() {
		console.log("🛑 Shutting down GameManager...");

		// Arrêter le nettoyage périodique
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = undefined;
		}

		// Supprimer toutes les parties
		for (const gameId of this.games.keys()) {
			this.removeGameRoom(gameId);
		}

		console.log("✅ GameManager shutdown complete");
	}
}
