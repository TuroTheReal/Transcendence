import type { Page } from "../router/router.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";
import { i18n } from "../services/i18n.js";

export function createServerGameMultiPage(): HTMLElement {
	const serverGameMultiPage = new ServerGameMultiPage();
	const container = document.createElement("div");
	container.innerHTML = serverGameMultiPage.render();

	requestAnimationFrame(() => {
		serverGameMultiPage.onMount();
	});

	return container;
}

export class ServerGameMultiPage implements Page {
	private currentGame: ServerGame_solo | null = null;
	private static isInstanceActive: boolean = false;
	private navigationListener: ((e: Event) => void) | null = null;
	//private restartListener: (() => void) | null = null;

	render(): string {
		return `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
			<div class="min-h-screen flex flex-col items-center justify-center p-4">

				<!-- Titre principal avec effet néon -->
				<h1 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse mb-12">
					🏓 RETRO PONG SERVER
				</h1>

				<!-- Zone de jeu -->
				<div id="game" class="w-full max-w-6xl">
					<!-- Bouton retour -->
					<button id="backToMenuBtn" class="mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/server-game">
						${i18n.t('chat.back')}
					</button>

					<!-- Statut de connexion -->
					<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4 mb-6">
						<div class="text-center">
							<p id="connectionStatus" class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">🟡 Initialisation...</p>
							<p id="gameId" class="text-purple-300 text-sm mt-2">ID: -</p>
						</div>
					</div>

					<!-- Tableau de score -->
					<div id="scoreboard" class="bg-gradient-to-br from-black via-purple-900/20 to-black border-2 border-purple-400 shadow-neon-purple-lg rounded-2xl p-6 mb-6">
						<div class="grid grid-cols-2 gap-8 text-center">
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4">
								<p id="scoreP1" class="text-2xl font-bold text-purple-300">
									Équipe 1 : 0
								</p>
							</div>
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4">
								<p id="scoreP2" class="text-2xl font-bold text-purple-300">
									Équipe 2 : 0
								</p>
							</div>
						</div>
					</div>

					<!-- Canvas avec cadre futuriste -->
					<div class="relative bg-black/95 border-4 border-purple-400 shadow-[0_0_30px_rgb(157,78,221,0.8),inset_0_0_30px_rgb(157,78,221,0.4)] rounded-2xl mx-auto" style="width: 800px; height: 600px;">
						<canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-black w-full h-full"></canvas>
					</div>

					<!-- Compte à rebours -->
					<div id="countdowndisplay" class="text-6xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mt-8 text-center"></div>

					<!-- Message de fin de partie -->
					<div id="endMessage" class="text-3xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mt-8 text-center"></div>

					<!-- Contrôles -->
					<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-6 mt-8">
						<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
							${i18n.t('game.control')}
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p1')}</p>
								<p class="text-sm text-gray-300">W / S</p>
							</div>
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p2')}</p>
								<p class="text-sm text-gray-300">J / M</p>
							</div>
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p3')}</p>
								<p class="text-sm text-gray-300">9 / 6</p>
							</div>
							<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p4')}</p>
								<p class="text-sm text-gray-300">↑ / ↓</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`;
	}

	async onMount(): Promise<void> {
		//console.log("🎯 Server Game Multi Page mounted");

		// ✅ PROTECTION CONTRE LES INSTANCES MULTIPLES
		if (ServerGameMultiPage.isInstanceActive)
		{
			//console.log("⚠️ Instance already active, preventing duplicate creation");
			return; // Sortir immédiatement si une instance est déjà active
		}

		ServerGameMultiPage.isInstanceActive = true;

		// ✅ PROTECTION CONTRE LES APPELS MULTIPLES
		if (this.currentGame) {
			//console.log("⚠️ Game already exists, cleaning up first");
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Gérer les clics sur les boutons avec data-route
		this.navigationListener = (e: Event) => {
			const target = e.target as HTMLElement;
			const route = target.getAttribute("data-route");
			if (route) {
				// Nettoyer avant de naviguer
				this.onUnmount();
				import("../router/router.js").then(({ router }) => {
					router.navigate(route);
				});
			}
		};
		document.addEventListener("click", this.navigationListener);

		// ✅ DÉMARRAGE SÉCURISÉ
		try {
			await this.startMultiGame();
		} catch (error) {
			//console.error("Failed to start game:", error);
			ServerGameMultiPage.isInstanceActive = false; // Libérer le verrou en cas d'erreur
		}

		// Event listener pour le bouton restart
		//const restartBtn = document.getElementById("restartBtn");
		// if (restartBtn) {
		// 	this.restartListener = () => this.restartGame();
		// 	restartBtn.addEventListener("click", this.restartListener);
		// }
	}

	private async startMultiGame(): Promise<void> {
		// ✅ VÉRIFICATION SUPPLÉMENTAIRE
		if (this.currentGame) {
			//console.log("⚠️ Game already running, skipping creation");
			return;
		}

		try {
			//console.log("🚀 Auto-starting server-side MULTI game...");

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Créer et démarrer le jeu SERVER-SIDE MULTI
			this.currentGame = new ServerGame_solo("multi");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			const gameIdElement = document.getElementById("gameId");
			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			//console.log("✅ SERVER-SIDE MULTI GAME LAUNCHED!");
		} catch (error) {
			//console.error("❌ Failed to start server-side multi game:", error);

			// ✅ NETTOYAGE EN CAS D'ERREUR
			if (this.currentGame) {
				this.currentGame.disconnect();
				this.currentGame = null;
			}

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🔴 Erreur de connexion";
			}

			// Relancer l'erreur pour que onMount() puisse libérer le verrou
			throw error;
		}
	}

	private restartGame(): void {
		if (this.currentGame) {
			//console.log("🔄 Restarting multi game...");
			this.currentGame.restart();
		}
	}

	onUnmount(): void {
		//console.log("🎯 Server Game Multi Page unmounting");

		// Supprimer les event listeners
		if (this.navigationListener) {
			document.removeEventListener("click", this.navigationListener);
			this.navigationListener = null;
		}

		// if (this.restartListener) {
		// 	const restartBtn = document.getElementById("restartBtn");
		// 	if (restartBtn) {
		// 		restartBtn.removeEventListener("click", this.restartListener);
		// 	}
		// 	this.restartListener = null;
		// }

		if (this.currentGame) {
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Réinitialiser le flag pour permettre de nouvelles instances
		ServerGameMultiPage.isInstanceActive = false;
	}
}