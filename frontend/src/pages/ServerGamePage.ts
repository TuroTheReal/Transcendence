import { Page } from "../router/router.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";

export function createServerGamePage(): HTMLElement {
	const serverGamePage = new ServerGamePage();
	const container = document.createElement("div");
	container.innerHTML = serverGamePage.render();

	// Appeler onMount après que le DOM soit créé
	requestAnimationFrame(() => {
		serverGamePage.onMount();
	});

	return container;
}

export class ServerGamePage implements Page {
	private statusInterval: number | null = null;
	private currentGame: ServerGame_solo | null = null;
	private navigationListener: ((e: Event) => void) | null = null;
	private handleVisibilityChange: (() => void) | null = null;

	render(): string {
		return `
            <style>
                /* Styles rétro gaming noir et violet - identiques au jeu normal */
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                * {
                    font-family: 'Orbitron', monospace;
                }
                
                .neon-text {
                    color: #bb86fc;
                    text-shadow:
                        0 0 3px #bb86fc,
                        0 0 6px #bb86fc,
                        0 0 9px #bb86fc;
                    animation: neonFlicker 2s infinite alternate;
                }
                
                @keyframes neonFlicker {
                    0%, 100% {
                        text-shadow: 
                            0 0 5px #9d4edd,
                            0 0 10px #9d4edd,
                            0 0 15px #9d4edd,
                            0 0 20px #9d4edd,
                            0 0 35px #9d4edd;
                    }
                    50% {
                        text-shadow: 
                            0 0 2px #9d4edd,
                            0 0 5px #9d4edd,
                            0 0 8px #9d4edd,
                            0 0 12px #9d4edd,
                            0 0 25px #9d4edd;
                    }
                }
                
                .neon-border {
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 10px #9d4edd,
                        inset 0 0 10px #9d4edd,
                        0 0 20px #9d4edd40;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a0d1a 50%, #0a0a0a 100%);
                }
                
                .retro-button {
                    background: linear-gradient(135deg, #1a0d1a 0%, #0a0a0a 50%, #1a0d1a 100%);
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 10px #9d4edd40,
                        inset 0 0 10px #9d4edd20;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .retro-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, #9d4edd40, transparent);
                    transition: left 0.5s;
                }
                
                .retro-button:hover {
                    border-color: #c77dff;
                    box-shadow: 
                        0 0 20px #9d4edd,
                        inset 0 0 20px #9d4edd30;
                    transform: scale(1.05);
                }
                
                .retro-button:hover::before {
                    left: 100%;
                }
                
                .starfield {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                    background: radial-gradient(2px 2px at 20px 30px, #9d4edd, transparent),
                                radial-gradient(2px 2px at 40px 70px, #c77dff, transparent),
                                radial-gradient(1px 1px at 90px 40px, #9d4edd, transparent),
                                radial-gradient(1px 1px at 130px 80px, #c77dff, transparent),
                                radial-gradient(2px 2px at 160px 30px, #9d4edd, transparent),
                                radial-gradient(1px 1px at 200px 90px, #c77dff, transparent),
                                radial-gradient(2px 2px at 240px 20px, #9d4edd, transparent);
                    background-size: 250px 150px;
                    animation: twinkle 4s ease-in-out infinite alternate;
                }
                
                @keyframes twinkle {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .retro-panel {
                    background: #050505;
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 15px #9d4edd40,
                        inset 0 0 15px #9d4edd20;
                    backdrop-filter: blur(5px);
                }
                
                .scan-lines::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        transparent 0%,
                        #9d4edd10 50%,
                        transparent 100%
                    );
                    background-size: 100% 4px;
                    animation: scan 0.1s linear infinite;
                    pointer-events: none;
                }
                
                @keyframes scan {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 4px; }
                }
                
                .retro-title {
                    font-size: 4rem;
                    font-weight: 900;
                    background: linear-gradient(45deg, #9d4edd, #c77dff, #9d4edd);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-align: center;
                    animation: titleGlow 3s ease-in-out infinite alternate;
                }
                
                @keyframes titleGlow {
                    0% { filter: drop-shadow(0 0 10px #9d4edd); }
                    100% { filter: drop-shadow(0 0 30px #c77dff); }
                }
                
                .scoreboard-panel {
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a0d1a 50%, #0a0a0a 100%);
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 20px #9d4edd60,
                        inset 0 0 20px #9d4edd30;
                }
                
                .game-canvas-frame {
                    background: #050505;
                    border: 3px solid #9d4edd;
                    box-shadow: 
                        0 0 30px #9d4edd80,
                        inset 0 0 30px #9d4edd40;
                }
                
                .corner-indicator {
                    width: 20px;
                    height: 20px;
                    border: 3px solid #9d4edd;
                    box-shadow: 0 0 10px #9d4edd;
                }
                
                .api-panel {
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a0d1a 50%, #0a0a0a 100%);
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 15px #9d4edd40,
                        inset 0 0 15px #9d4edd20;
                }
            </style>
            
            <!-- Champ d'étoiles -->
            <div class="starfield"></div>
            
            <div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden scan-lines relative">
                <div class="min-h-screen flex flex-col items-center justify-center p-4">
                    
                    <!-- Titre principal avec effet néon -->
                    <h1 class="retro-title neon-text mb-8">
                        🎮 SERVER-SIDE PONG
                    </h1>
                    
                    <!-- Menu principal -->
                    <div id="menu" class="retro-panel rounded-2xl p-8 mb-6">
                        <button class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300" data-route="/home">
                            ← RETOUR ACCUEIL
                        </button>
                        <h2 class="text-3xl font-bold text-purple-300 mb-8 text-center">MODE DE JEU SERVER-SIDE</h2>
                        
                        <div class="flex flex-col gap-6">
                            <button class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300" data-route="/server-game/solo">
                                <span class="relative z-10">🤖 SOLO (VS IA)</span>
                            </button>
                            <button class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300" data-route="/server-game/versus">
                                <span class="relative z-10">👥 VERSUS (2 JOUEURS)</span>
                            </button>
                            <button class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300" data-route="/server-game/multi">
                                <span class="relative z-10">🎯 MULTIJOUEUR (2v2)</span>
                            </button>
                        </div>
                    </div>

                        <!-- Informations API -->
                        <div class="api-panel rounded-lg p-4 mb-6">
                            <h3 class="text-lg font-semibold neon-text mb-2">📡 API Endpoints disponibles</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-300">
                                <div><code class="text-green-400">GET /api/games</code> - Lister les parties</div>
                                <div><code class="text-green-400">POST /api/game/create</code> - Créer une partie</div>
                                <div><code class="text-blue-400">GET /api/game/:id/state</code> - État complet</div>
                                <div><code class="text-blue-400">GET /api/game/:id/ball</code> - Position balle</div>
                                <div><code class="text-blue-400">GET /api/game/:id/paddles</code> - Position raquettes</div>
                                <div><code class="text-blue-400">GET /api/game/:id/score</code> - Score actuel</div>
                            </div>
                        </div>
                    </div>

                    

                    
                </div>
            </div>
        `;
	}

	async onMount(): Promise<void> {
		console.log("🎮 Server Game Page mounted");

		// Vérifier l'état du serveur
		await this.checkServerStatus();

		// ✅ OPTIMISATION : polling moins agressif et intelligent
		if (!this.statusInterval) {
			// Démarrer avec un délai plus long et seulement si la page est visible
			this.setupIntelligentPolling();
		}

		// Gérer les clics sur les boutons avec data-route
		this.navigationListener = (e: Event) => {
			const target = e.target as HTMLElement;
			console.log(
				"🎯 Click detected on:",
				target.tagName,
				target.className
			);

			// Vérifier si c'est un bouton avec data-route ou un enfant d'un tel bouton
			const routeElement = target.hasAttribute("data-route")
				? target
				: target.closest("[data-route]");
			const route = routeElement?.getAttribute("data-route");

			if (route) {
				console.log("🔄 Navigating to:", route);
				console.log("📍 Route element:", routeElement);

				// Empêcher la propagation pour éviter les conflits
				e.preventDefault();
				e.stopPropagation();

				import("../router/router.js")
					.then(({ router }) => {
						console.log(
							"🚀 Router imported, navigating to:",
							route
						);
						router.navigate(route).catch((error) => {
							console.error("❌ Navigation failed:", error);
						});
					})
					.catch((error) => {
						console.error("❌ Failed to import router:", error);
					});
			} else {
				console.log("⚠️ No data-route found on clicked element");
			}
		};

		document.addEventListener("click", this.navigationListener);
		console.log("🎯 Navigation event listener added to document");
	}

	private async startGame(mode: "solo" | "versus" | "multi"): Promise<void> {
		try {
			console.log(
				`🚀 LAUNCHING SERVER-SIDE ${mode.toUpperCase()} GAME...`
			);

			const connectionStatus =
				document.getElementById("connectionStatus");
			const gameIdElement = document.getElementById("gameId");
			const restartBtn = document.getElementById(
				"restartBtn"
			) as HTMLButtonElement;
			const startSoloBtn = document.getElementById(
				"startSoloBtn"
			) as HTMLButtonElement;
			const startVersusBtn = document.getElementById(
				"startVersusBtn"
			) as HTMLButtonElement;
			const startMultiBtn = document.getElementById(
				"startMultiBtn"
			) as HTMLButtonElement;

			// Désactiver les boutons de démarrage pendant la connexion
			if (startSoloBtn) startSoloBtn.disabled = true;
			if (startVersusBtn) startVersusBtn.disabled = true;
			if (startMultiBtn) startMultiBtn.disabled = true;

			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Arrêter le jeu actuel s'il existe
			if (this.currentGame) {
				this.currentGame.disconnect();
			}

			// Créer et démarrer le nouveau jeu SERVER-SIDE
			console.log("🎮 Creating server-side game instance...");
			this.currentGame = new ServerGame_solo(mode);

			console.log("🔌 Connecting to game server...");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS - Mettre à jour l'interface
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			// Activer le bouton restart et réactiver les boutons
			if (restartBtn) {
				restartBtn.disabled = false;
				restartBtn.classList.remove("hidden");
			}
			if (startSoloBtn) startSoloBtn.disabled = false;
			if (startVersusBtn) startVersusBtn.disabled = false;
			if (startMultiBtn) startMultiBtn.disabled = false;

			// Basculer l'affichage des contrôles selon le mode
			this.showControlsForMode(mode);

			console.log(
				`✅ ${mode.toUpperCase()} SERVER GAME LAUNCHED SUCCESSFULLY!`
			);
			console.log(`🎮 Game ID: ${this.currentGame.currentGameId}`);
			console.log(
				`🎯 Use W/S (Player 1) and ↑/↓ (Player 2) to control paddles`
			);
		} catch (error) {
			console.error(
				`❌ Failed to start server-side ${mode} game:`,
				error
			);

			const connectionStatus =
				document.getElementById("connectionStatus");
			const startSoloBtn = document.getElementById(
				"startSoloBtn"
			) as HTMLButtonElement;
			const startVersusBtn = document.getElementById(
				"startVersusBtn"
			) as HTMLButtonElement;
			const startMultiBtn = document.getElementById(
				"startMultiBtn"
			) as HTMLButtonElement;

			if (connectionStatus) {
				connectionStatus.textContent = "🔴 Erreur de connexion";
			}

			// Réactiver les boutons
			if (startSoloBtn) startSoloBtn.disabled = false;
			if (startVersusBtn) startVersusBtn.disabled = false;
			if (startMultiBtn) startMultiBtn.disabled = false;

			alert(
				`❌ Impossible de démarrer la partie server-side ${mode}.\n\nVérifiez que :\n• Le serveur backend est démarré\n• Les WebSockets sont activés\n• L'API est accessible sur /api/game/create`
			);
		}
	}

	private showControlsForMode(mode: "solo" | "versus" | "multi"): void {
		const controls2Players = document.getElementById("controls2Players");
		const controls4Players = document.getElementById("controls4Players");

		if (mode === "multi") {
			// Mode 2v2 - Afficher les contrôles pour 4 joueurs
			if (controls2Players) controls2Players.classList.add("hidden");
			if (controls4Players) controls4Players.classList.remove("hidden");
		} else {
			// Mode solo/versus - Afficher les contrôles pour 2 joueurs
			if (controls2Players) controls2Players.classList.remove("hidden");
			if (controls4Players) controls4Players.classList.add("hidden");
		}
	}

	private restartGame(): void {
		if (this.currentGame) {
			console.log("🔄 Restarting game...");
			this.currentGame.restart();
		} else {
			console.log("⚠️ No active game to restart");
		}
	}

	// ✅ NOUVEAU : polling intelligent basé sur la visibilité de l'onglet
	private setupIntelligentPolling(): void {
		const startPolling = (interval: number) => {
			if (this.statusInterval) {
				clearInterval(this.statusInterval);
			}
			this.statusInterval = setInterval(() => {
				if (!document.hidden) {
					// Seulement si l'onglet est visible
					this.checkServerStatus();
				}
			}, interval) as unknown as number;
		};

		// Polling adaptatif : plus lent si l'onglet n'est pas visible
		this.handleVisibilityChange = () => {
			if (document.hidden) {
				// Onglet en arrière-plan : polling très lent (60 secondes)
				startPolling(60000);
			} else {
				// Onglet actif : polling normal (30 secondes au lieu de 10)
				startPolling(30000);
			}
		};

		// Écouter les changements de visibilité
		document.addEventListener(
			"visibilitychange",
			this.handleVisibilityChange
		);

		// Démarrer avec la fréquence appropriée
		this.handleVisibilityChange();
	}

	private async checkServerStatus(): Promise<void> {
		try {
			// ✅ OPTIMISATION : une seule requête combinée au lieu de deux
			const gamesResponse = await fetch("/api/games");
			const gamesData = await gamesResponse.json();

			// Mettre à jour l'interface
			const serverState = document.getElementById("serverState");
			const activeGames = document.getElementById("activeGames");

			if (serverState) {
				// Utiliser les données de /api/games pour déterminer l'état du serveur
				serverState.textContent = gamesData.success
					? "🟢 En ligne"
					: "🔴 Erreur";
			}

			if (activeGames && gamesData.success) {
				activeGames.textContent = gamesData.totalGames.toString();
			}
		} catch (error) {
			console.error("Failed to check server status:", error);

			const serverState = document.getElementById("serverState");
			if (serverState) {
				serverState.textContent = "🔴 Hors ligne";
			}
		}
	}

	onUnmount(): void {
		console.log("🎮 Server Game Page unmounting");

		// ✅ AMÉLIORATION : nettoyer l'interval
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
			this.statusInterval = null;
		}

		// ✅ NOUVEAU : supprimer l'event listener de visibilité
		document.removeEventListener(
			"visibilitychange",
			this.handleVisibilityChange
		);

		// Supprimer l'event listener de navigation
		if (this.navigationListener) {
			document.removeEventListener("click", this.navigationListener);
			this.navigationListener = null;
		}

		// Déconnecter et nettoyer le jeu actuel
		if (this.currentGame) {
			console.log("🔌 Disconnecting current game before unmounting...");
			this.currentGame.disconnect();
			this.currentGame = null;
		}
	}
}
