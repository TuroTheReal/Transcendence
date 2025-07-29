import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { Game_solo } from "../components/game/game_solo.js";
import { Game_ligne } from "../components/game/game_ligne.js";
import { Game_tournoi } from "../components/game/game_tournoi.js";

export function createGamePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	let currentGame: Game_solo | Game_ligne | Game_tournoi | null = null;

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Styles rétro gaming noir et violet */
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
			
			.retro-input {
				background: linear-gradient(135deg, #0a0a0a 0%, #1a0d1a 100%);
				border: 2px solid #9d4edd;
				color: #c77dff;
				box-shadow: 
					0 0 10px #9d4edd40,
					inset 0 0 10px #9d4edd20;
			}
			
			.retro-input:focus {
				border-color: #c77dff;
				box-shadow: 
					0 0 20px #9d4edd,
					inset 0 0 20px #9d4edd30;
				outline: none;
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
		</style>
		
		<!-- Champ d'étoiles -->
		<div class="starfield"></div>
		
		<!-- Bouton LOG-IN en haut à gauche -->
		<div class="absolute top-4 left-4 z-50">
			<div class="login-dropdown">
				<button id="loginBtn" class="retro-button text-purple-300 font-bold py-2 px-4 rounded-lg transition-all duration-300">
					<span class="relative z-10">LOG-IN</span>
				</button>
				<div class="mx-auto">
					<button class="retro-button text-white font-bold py-2 px-4 rounded-lg" id="profilBtn">
						PROFIL
					</button>
					<button class="retro-button text-white font-bold py-2 px-4 rounded-lg" id="chatBtn">
						CHAT
					</button>
				</div>
					<button id="logoutBtn" class="retro-button text-red-300 font-bold py-2 px-4 rounded-lg transition-all duration-300">
						<span class="relative z-10">LOG-OUT</span>
					</button>				
				</div>
			</div>
		</div>


		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 scan-lines relative">
			
			<!-- Titre principal avec effet néon -->
			<h1 class="retro-title neon-text mb-12">
				🏓 RETRO PONG
			</h1>
			
			<!-- Menu principal -->
			<div id="menu" class="retro-panel rounded-2xl p-8">
				<button class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300" data-route="/home">
					← RETOUR ACCUEIL
				</button>
				<h2 class="text-3xl font-bold text-purple-300 mb-8 text-center">MODE DE JEU</h2>
				<div class="flex flex-col gap-6">
					<button id="localBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						<span class="relative z-10">🎮 JOUER EN LOCAL</span>
					</button>
					<button id="ligneBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						<span class="relative z-10">🌐 JOUER EN LIGNE</span>
					</button>
				</div>
			</div>
			<div>
				<p id="multiError" class="mt-4 text-red-400 hidden text-lg font-bold neon-text">
					Tu dois être connecté pour jouer en ligne				
				</p>
			</div>
			
			<!-- Menu local -->
			<div id="menu_local" class="hidden retro-panel rounded-2xl p-8">
				<button id="backToMainBtn" class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300">
					← RETOUR MENU PRINCIPAL
				</button>
				<h2 class="text-3xl font-bold text-purple-300 mb-8 text-center">MODE LOCAL</h2>
				<div class="flex flex-col gap-6">
					<button id="soloBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						🤖 SOLO (VS IA)
					</button>
					<button id="versusBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						👥 VERSUS (2 JOUEURS)
					</button>
					<button id="multiBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						🎯 MULTIJOUEUR (2v2)
					</button>
					<button id="tournoiBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						🏆 TOURNOI
					</button>
				</div>
			</div>
			
			<!-- Menu en ligne -->
			<div id="menu_ligne" class="hidden retro-panel rounded-2xl p-8">
				<button id="backToMainBtn2" class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300">
					← RETOUR MENU PRINCIPAL
				</button>
				<h2 class="text-3xl font-bold text-purple-300 mb-8 text-center">MODE EN LIGNE</h2>
				<div class="flex flex-col gap-6">
					<button id="solo_ligneBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						⚔️ 1V1
					</button>
					<button id="multiBtn" class="retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						🎯 MULTIJOUEUR (2v2)
					</button>
				</div>
			</div>
			
			<!-- Interface Tournoi -->
			<div id="menu_tournoi" class="hidden retro-panel rounded-2xl p-8">
				<button id="backToMainBtn3" class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300">
					← RETOUR MENU PRINCIPAL
				</button>
				<h2 class="text-3xl font-bold neon-text mb-8 text-center">🏆 TOURNOI - INSCRIPTION</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					${[1, 2, 3, 4]
						.map(
							(i) => `
					<div class="flex flex-col items-center retro-panel rounded-xl p-6">
						<div class="w-16 h-16 rounded-full retro-panel mb-4 flex items-center justify-center text-2xl neon-text">
							P${i}
						</div>
						<input type="text" placeholder="NOM JOUEUR ${i}" class="retro-input px-4 py-2 rounded-lg w-full text-center font-bold">
					</div>`
						)
						.join("")}
				</div>
				<div class="mt-8 text-center">
					<button id="startTournoiMatchmaking" class="hidden retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						VALIDER LES NOMS
					</button>
					<p id="tournoiError" class="mt-4 text-red-400 text-lg font-bold hidden neon-text">
						⚠️ TOUS LES NOMS DOIVENT ÊTRE REMPLIS ET UNIQUES !
					</p>
					<p id="tournoimess" class="m-8 text-purple-300 text-lg font-bold hidden neon-text">
					</p>
					<button id="startTournoi" class="hidden retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						🎯 COMMENCER TOURNOI
					</button>
				</div>
			</div>

			<!-- Interface 1v1 ligne -->
			<div id="menu_1v1" class="hidden retro-panel rounded-2xl p-8">
				<button id="backToMainBtn3" class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300">
					← RETOUR MENU PRINCIPAL
				</button>
				<h2 class="text-3xl font-bold neon-text mb-8 text-center">Inviter un ami</h2>
				<div class="mt-8 text-center">
					<button id="start1v1" class="hidden retro-button text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300">
						Commencer la partie
					</button>
					<p id="1v1Error" class="mt-4 text-red-400 text-lg font-bold hidden neon-text">
						Aucun ami n'a rejoint votre sesion
					</p>
				</div>
			</div>
			
			<!-- Zone de jeu -->
			<div id="game" class="hidden w-full max-w-6xl">
				<!-- Bouton retour -->
				<button id="backToMenuBtn" class="mb-6 retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300">
					← RETOUR MENU
				</button>
				
				<!-- Bouton restart -->
				<button id="restartBtn" class="hidden mb-6 mx-auto retro-button text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300">
					NOUVELLE PARTIE
				</button>
				
				<!-- Tableau de score -->
				<div id="scoreboard" class="scoreboard-panel rounded-2xl p-6 mb-6">
					<div class="grid grid-cols-2 gap-8 text-center">
						<div class="retro-panel rounded-xl p-4">
							<p id="scoreP1" class="text-2xl font-bold text-purple-300">JOUEUR 1 : 0</p>
						</div>
						<div class="retro-panel rounded-xl p-4">
							<p id="scoreP2" class="text-2xl font-bold text-purple-300">JOUEUR 2 : 0</p>
						</div>
					</div>
				</div>
				
				<!-- Canvas avec cadre futuriste -->
				<div class="relative game-canvas-frame rounded-2xl mx-auto" style="width: 800px; height: 600px;">
					<canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-black w-full h-full"></canvas>
					<!-- Indicateurs de coin -->
					<div class="absolute top-2 left-2 corner-indicator border-l-2 border-t-2"></div>
					<div class="absolute top-2 right-2 corner-indicator border-r-2 border-t-2"></div>
					<div class="absolute bottom-2 left-2 corner-indicator border-l-2 border-b-2"></div>
					<div class="absolute bottom-2 right-2 corner-indicator border-r-2 border-b-2"></div>
				</div>
				
				<!-- Compte à rebours -->
				<div id="countdowndisplay" class="text-6xl font-bold neon-text mt-8 text-center"></div>
				
				<!-- Message de fin de partie -->
				<div id="endMessage" class="text-3xl font-bold neon-text mt-8 text-center">
				</div>
				<button id="nextMatchBtn" class="hidden m-6 mx-auto retro-button text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300">
					MATCH SUIVANT
				</button>
				<button id="finalMatchBtn" class="hidden m-6 mx-auto retro-button text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300">
					FINALE !
				</button>
				
				<!-- Contrôles -->
				<div id="control_1" class="hidden retro-panel rounded-2xl p-6 mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">🎮 CONTRÔLES</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
						<div class="retro-panel rounded-lg p-4">
							<p id="control_player_1" class="text-purple-300 font-semibold">JOUEUR 1</p>
							<p id="control_player_1_command" class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="retro-panel rounded-lg p-4">
							<p id="control_player_2" class="text-purple-300 font-semibold">JOUEUR 2</p>
							<p id="control_player_2_command" class="text-sm text-gray-300">ARROW UP / ARROW DOWN</p>
						</div>
					</div>
				</div>
				
				<div id="control_2" class="hidden retro-panel rounded-2xl p-6 mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">🎮 CONTRÔLES</h3>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
						<div class="retro-panel rounded-lg p-3">
							<p class="text-purple-300 font-semibold">JOUEUR 1</p>
							<p class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="retro-panel rounded-lg p-3">
							<p class="text-purple-300 font-semibold">JOUEUR 2</p>
							<p class="text-sm text-gray-300">J / M</p>
						</div>
						<div class="retro-panel rounded-lg p-3">
							<p class="text-purple-300 font-semibold">JOUEUR 3</p>
							<p class="text-sm text-gray-300">9 / 6</p>
						</div>
						<div class="retro-panel rounded-lg p-3">
							<p class="text-purple-300 font-semibold">JOUEUR 4</p>
							<p class="text-sm text-gray-300">ARROW UP / ARROW DOWN</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;

		// Add language switcher
		const languageSwitcherContainer = page.querySelector(
			"#language-switcher-container"
		);
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		// Initialize game logic
		initializeGameLogic();
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener("languageChanged", renderContent);

	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			cleanupCurrentGame();

			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	function cleanupCurrentGame(): void {
		if (currentGame) {
			console.log("Nettoyage du jeu en cours...");

			if (typeof currentGame.cleanup === "function") {
				currentGame.cleanup();
			}

			if (typeof currentGame.back_to_menu === "function") {
				currentGame.back_to_menu();
			}

			if (typeof currentGame.destroy === "function") {
				currentGame.destroy();
			}

			currentGame = null;
		}
	}

	// reinitialiser l'interface
	function resetUIState(): void {
		const menu = page.querySelector("#menu") as HTMLElement;
		const menuLocal = page.querySelector("#menu_local") as HTMLElement;
		const menuLigne = page.querySelector("#menu_ligne") as HTMLElement;
		const menuTournoi = page.querySelector("#menu_tournoi") as HTMLElement;
		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const control1 = page.querySelector("#control_1") as HTMLElement;
		const control2 = page.querySelector("#control_2") as HTMLElement;
		const controlPlayer2 = page.querySelector(
			"#control_player_2"
		) as HTMLElement;
		const controlPlayer2Command = page.querySelector(
			"#control_player_2_command"
		) as HTMLElement;
		const controlPlayer1 = page.querySelector(
			"#control_player_1"
		) as HTMLElement;
		const controlPlayer1Command = page.querySelector(
			"#control_player_1_command"
		) as HTMLElement;
		const multiError = page.querySelector("#multiError") as HTMLElement;

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement;

		// reinitialiser page 1v1
		// si remote il y a

		//reinitialiser la page tournoi
		resetTournoiInterface();

		multiError.classList.add("hidden");

		// Cacher tous les menus sauf le menu principal
		menuLocal.style.display = "none";
		menuLigne.style.display = "none";
		game.style.display = "none";
		menuTournoi.style.display = "none";
		menu.style.display = "block";

		// Cacher les contrôles et le bouton restart
		restart.style.display = "none";
		control1.style.display = "none";
		control2.style.display = "none";

		if (controlPlayer2) {
			controlPlayer2.textContent = "Joueur 2";
		}
		if (controlPlayer2Command) {
			controlPlayer2Command.textContent = "ARROW UP / ARROW DOWN";
		}

		// gerer le log-in
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			//console.log("pas connecte");
			loginBtn.classList.remove("hidden");
			chatBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
		} else {
			loginBtn.classList.add("hidden");
			chatBtn.classList.remove("hidden");
			profilBtn.classList.remove("hidden");
			logoutBtn.classList.remove("hidden");
		}
	}

	function resetTournoiInterface(): void {
		const tournoiInputs = page.querySelectorAll(
			"#menu_tournoi input"
		) as NodeListOf<HTMLInputElement>;
		const startTournoiMatchmakingBtn = page.querySelector(
			"#startTournoiMatchmaking"
		) as HTMLButtonElement;
		const startTournoiBtn = page.querySelector(
			"#startTournoi"
		) as HTMLButtonElement;
		const tournoiMess = page.querySelector("#tournoimess") as HTMLElement;
		const tournoiError = page.querySelector("#tournoiError") as HTMLElement;
		const nextMatchBtn = page.querySelector("#nextMatchBtn") as HTMLElement;
		const finalMatchBtn = page.querySelector(
			"#finalMatchBtn"
		) as HTMLElement;

		// Vider tous les champs de saisie
		tournoiInputs.forEach((input) => {
			input.value = "";
		});

		// Remettre les boutons et messages dans leur état initial
		startTournoiMatchmakingBtn.style.display = "inline-block";
		startTournoiBtn.classList.add("hidden");
		tournoiMess.classList.add("hidden");
		tournoiError.classList.add("hidden");
		nextMatchBtn.style.display = "none";
		finalMatchBtn.style.display = "none";

		// Vider le message
		tournoiMess.innerText = "";
	}

	function initializeGameLogic() {
		const menu = page.querySelector("#menu") as HTMLElement;
		const localBtn = page.querySelector("#localBtn") as HTMLButtonElement;
		const ligneBtn = page.querySelector("#ligneBtn") as HTMLButtonElement;

		const menuLocal = page.querySelector("#menu_local") as HTMLElement;
		const soloBtn = page.querySelector("#soloBtn") as HTMLButtonElement;
		const versusBtn = page.querySelector("#versusBtn") as HTMLButtonElement;
		const backToMainBtn = page.querySelector(
			"#backToMainBtn"
		) as HTMLButtonElement;

		const menuLigne = page.querySelector("#menu_ligne") as HTMLElement;
		const soloLigneBtn = page.querySelector(
			"#solo_ligneBtn"
		) as HTMLButtonElement;
		const multiBtn = page.querySelector("#multiBtn") as HTMLButtonElement;
		const tournoiBtn = page.querySelector(
			"#tournoiBtn"
		) as HTMLButtonElement;
		const backToMainBtn2 = page.querySelector(
			"#backToMainBtn2"
		) as HTMLButtonElement;

		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const backToMenuBtn = page.querySelector(
			"#backToMenuBtn"
		) as HTMLButtonElement;
		const control1 = page.querySelector("#control_1") as HTMLElement;
		const scorep1 = page.querySelector("#scoreP1") as HTMLElement;
		const scorep2 = page.querySelector("#scoreP2") as HTMLElement;
		const control2 = page.querySelector("#control_2") as HTMLElement;
		const controlPlayer2 = page.querySelector(
			"#control_player_2"
		) as HTMLElement;
		const controlPlayer2Command = page.querySelector(
			"#control_player_2_command"
		) as HTMLElement;
		const controlPlayer1 = page.querySelector(
			"#control_player_1"
		) as HTMLElement;
		const controlPlayer1Command = page.querySelector(
			"#control_player_1_command"
		) as HTMLElement;

		const menuTournoi = page.querySelector("#menu_tournoi") as HTMLElement;
		const backToMainBtn3 = page.querySelector(
			"#backToMainBtn3"
		) as HTMLButtonElement;
		const startTournoiMatchmakingBtn = page.querySelector(
			"#startTournoiMatchmaking"
		) as HTMLButtonElement;
		let nextMatchBtn = page.querySelector("#nextMatchBtn") as
			| HTMLButtonElement
			| HTMLElement;
		let finalMatchBtn = page.querySelector("#finalMatchBtn") as
			| HTMLButtonElement
			| HTMLElement;
		const tournoiInputs = page.querySelectorAll(
			"#menu_tournoi input"
		) as NodeListOf<HTMLInputElement>;
		let startTournoiBtn = page.querySelector("#startTournoi") as
			| HTMLButtonElement
			| HTMLElement;

		let multiError = page.querySelector("#multiError") as HTMLElement;

		let menu1v1 = page.querySelector("#menu_1v1") as HTMLElement;
		let start1v1 = page.querySelector("#start1v1") as HTMLButtonElement;
		let error1v1 = page.querySelector("#error1v1") as HTMLElement;

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement;

		// connecte ou non
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			//console.log("pas connecte");
			loginBtn.classList.remove("hidden");
			chatBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
		} else {
			loginBtn.classList.add("hidden");
			logoutBtn.classList.remove("hidden");
			chatBtn.classList.remove("hidden");
			profilBtn.classList.remove("hidden");
		}

		function chooseMode(mode: "local" | "ligne"): void {
			cleanupCurrentGame();

			menu.style.display = "none";
			if (mode === "local") {
				menuLocal.style.display = "block";
				multiError.classList.add("hidden");
			} else {
				const token = sessionStorage.getItem("authToken");
				if (!token) {
					menu.style.display = "block";
					multiError.classList.remove("hidden");
					return;
				}
				menuLigne.style.display = "block";
			}
		}

		function backToMainMenu(): void {
			cleanupCurrentGame();
			resetUIState();
		}

		function startTournoi() {
			cleanupCurrentGame();

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			menuTournoi.style.display = "block";

			const errorText = page.querySelector(
				"#tournoiError"
			) as HTMLElement;
			startTournoiMatchmakingBtn.style.display = "inline-block";

			startTournoiMatchmakingBtn.addEventListener("click", () => {
				const names = Array.from(tournoiInputs).map((input) =>
					input.value.trim()
				);
				const allFilled = names.every((name) => name !== "");
				const allUnique = new Set(names).size === names.length;

				if (allFilled && allUnique) {
					errorText.classList.add("hidden");

					startTournoiMatchmakingBtn.style.display = "none";
					let random1 = random_number(0, 1);

					function random_number(min: number, max: number): number {
						let num = 0;

						while (true) {
							num = Math.random();

							const to_max = num > max;
							const to_min = num < min;

							if (to_max || to_min) continue;

							return num;
						}
					}

					if (random1 < 0.33)
						launchTournoi(names[2], names[3], names[0], names[1]);
					else if (random1 >= 0.33 && random1 < 0.66)
						launchTournoi(names[2], names[1], names[0], names[3]);
					else launchTournoi(names[1], names[3], names[0], names[2]);
				} else {
					errorText.classList.remove("hidden");
				}
			});

			// Cache l'erreur dès qu’on modifie un champ
			tournoiInputs.forEach((input) => {
				input.addEventListener("input", () => {
					errorText.classList.add("hidden");
				});
			});
		}

		function launchTournoi(
			player_a: string,
			player_b: string,
			player_c: string,
			player_d: string
		) {
			let finaliste_1: string;
			let finaliste_2: string;
			const tournoiMess = page.querySelector(
				"#tournoimess"
			) as HTMLElement;

			tournoiMess.innerText = `Le premier match entre ${player_a} et ${player_b} va commencer !`;
			tournoiMess.classList.remove("hidden");

			startTournoiBtn.classList.remove("hidden");

			// Supprimer tous les event listeners précédents
			const newStartBtn = startTournoiBtn.cloneNode(true) as HTMLElement;
			startTournoiBtn.parentNode?.replaceChild(
				newStartBtn,
				startTournoiBtn
			);
			startTournoiBtn = newStartBtn;

			startTournoiBtn.addEventListener("click", () => {
				startMatch1();
			});

			function startMatch1() {
				cleanupCurrentGame();
				currentGame = new Game_tournoi(player_a, player_b, 0);

				hideMenus();
				showGameInterface(player_a, player_b);

				currentGame.start_game_loop();

				waitForMatchEnd((winner) => {
					finaliste_1 = winner;
					showNextMatchButton(() => startMatch2());
				});
			}

			function startMatch2() {
				hideButton(nextMatchBtn);
				cleanupCurrentGame();
				currentGame = new Game_tournoi(player_c, player_d, 0);

				hideMenus();
				showGameInterface(player_c, player_d);

				currentGame.start_game_loop();

				waitForMatchEnd((winner) => {
					finaliste_2 = winner;
					showFinalMatchButton(() => startFinal());
				});
			}

			function startFinal() {
				console.log("la FINAAALE");
				hideButton(finalMatchBtn);
				cleanupCurrentGame();

				currentGame = new Game_tournoi(finaliste_1, finaliste_2, 1);

				hideMenus();
				showGameInterface(finaliste_1, finaliste_2);
				currentGame.start_game_loop();

				waitForMatchEnd((winner) => {
					// Le tournoi est terminé, afficher le bouton retour menu
					backToMenuBtn.style.display = "block";
				});
			}

			function waitForMatchEnd(callback: (winner: string) => void) {
				const interval = setInterval(() => {
					const result = currentGame.check_end_game();
					if (result === 1) {
						clearInterval(interval);
						const winner = currentGame.getPlayer1Name(); // existe que pour game_tournoi
						callback(winner);
					} else if (result === 2) {
						clearInterval(interval);
						const winner = currentGame.getPlayer2Name(); // existe que pour game_tournoi
						callback(winner);
					}
				}, 1000);
			}

			function hideMenus() {
				menuLocal.style.display = "none";
				menuLigne.style.display = "none";
				menuTournoi.style.display = "none";
				game.style.display = "block";
				backToMenuBtn.style.display = "none";
				loginBtn.classList.add("hidden");
				logoutBtn.classList.add("hidden");
				profilBtn.classList.add("hidden");
				chatBtn.classList.add("hidden");
			}

			function showGameInterface(player1: string, player2: string) {
				controlPlayer1.textContent = player1;
				scorep1.textContent = `${player1} : 0`;
				controlPlayer1Command.textContent = "W / S";

				controlPlayer2.textContent = player2;
				scorep2.textContent = `${player2} : 0`;
				controlPlayer2Command.textContent = "ARROW UP / ARROW DOWN";

				control1.style.display = "block";
			}

			function showNextMatchButton(callback: () => void) {
				// Nettoyer l'ancien event listener
				const newNextBtn = nextMatchBtn.cloneNode(true) as HTMLElement;
				nextMatchBtn.parentNode?.replaceChild(newNextBtn, nextMatchBtn);
				nextMatchBtn = newNextBtn;

				nextMatchBtn.style.display = "block";
				nextMatchBtn.addEventListener("click", callback);
			}

			function showFinalMatchButton(callback: () => void) {
				console.log("bouton final");
				// Nettoyer l'ancien event listener
				const newFinalBtn = finalMatchBtn.cloneNode(
					true
				) as HTMLElement;
				finalMatchBtn.parentNode?.replaceChild(
					newFinalBtn,
					finalMatchBtn
				);
				finalMatchBtn = newFinalBtn;

				finalMatchBtn.style.display = "block";
				finalMatchBtn.addEventListener("click", callback);
			}

			function hideButton(button: HTMLElement) {
				button.style.display = "none";
			}
		}

		function startGameSolo(mode: "solo" | "versus"): void {
			cleanupCurrentGame();
			currentGame = new Game_solo(mode);

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "block";
			restart.style.display = "block";
			loginBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			chatBtn.classList.add("hidden");

			const token = sessionStorage.getItem("authToken");
			if (token) {
				const userId = sessionStorage.getItem("username");
				scorep1.textContent = `${userId} : 0`;
			}
			if (mode === "solo") {
				controlPlayer2.textContent = "IA";
				controlPlayer2Command.textContent = "";
			} else {
				controlPlayer2.textContent = "Joueur 2";
				controlPlayer2Command.textContent = "ARROW UP / ARROW DOWN";
			}

			control1.style.display = "block";

			restart.onclick = () => {
				if (currentGame) {
					cleanupCurrentGame();
					currentGame = new Game_solo(mode);
					currentGame.start_game_loop();
				}
			};
			currentGame.start_game_loop();
		}

		// 2v2 EN LOCAL
		function startGame2v2Local(): void {
			cleanupCurrentGame();

			scorep1.textContent = "Equipe 1 : 0";
			scorep2.textContent = "Equipe 2 : 0";
			currentGame = new Game_ligne();

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "block";
			control2.style.display = "block";
			loginBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			chatBtn.classList.add("hidden");

			currentGame.start_game_loop();
		}

		// REMOTE 1v1 (a voir apres)
		function startGameLigneSolo(): void {
			//cleanupCurrentGame();

			// Créer une nouvelle instance du jeu
			//currentGame = new Game_solo(mode);

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "none";
			menu1v1.style.display = "block";
			loginBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			chatBtn.classList.add("hidden");

			//currentGame.start_game_loop();
		}

		function login() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/login");
			});
		}

		function go_profil() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/profile");
			});
		}

		function go_chat() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/chat");
			});
		}

		// ✅ PROTECTION CONTRE LES CLICS MULTIPLES
		let isButtonClickInProgress = false;

		function createProtectedClickHandler(
			handler: Function,
			buttonName: string
		) {
			return (...args: unknown[]) => {
				if (isButtonClickInProgress) {
					console.log(
						`⚠️ ${buttonName} click ignored - operation in progress`
					);
					return;
				}

				isButtonClickInProgress = true;
				console.log(
					`🎯 ${buttonName} clicked - protecting against multiple clicks`
				);

				try {
					handler(...args);
				} finally {
					// Libérer après un délai court pour éviter les double-clics
					setTimeout(() => {
						isButtonClickInProgress = false;
					}, 500);
				}
			};
		}

		localBtn.addEventListener(
			"click",
			createProtectedClickHandler(() => chooseMode("local"), "Local Mode")
		);
		ligneBtn.addEventListener(
			"click",
			createProtectedClickHandler(
				() => chooseMode("ligne"),
				"Online Mode"
			)
		);

		backToMainBtn.addEventListener("click", () => backToMainMenu());
		backToMainBtn2.addEventListener("click", () => backToMainMenu());
		backToMainBtn3.addEventListener("click", () => backToMainMenu());

		backToMenuBtn.addEventListener("click", () => backToMainMenu());

		soloBtn.addEventListener(
			"click",
			createProtectedClickHandler(
				() => startGameSolo("solo"),
				"Solo Game"
			)
		);
		versusBtn.addEventListener(
			"click",
			createProtectedClickHandler(
				() => startGameSolo("versus"),
				"Versus Game"
			)
		);

		soloLigneBtn.addEventListener(
			"click",
			createProtectedClickHandler(
				() => startGameLigneSolo(),
				"Solo Online"
			)
		);
		multiBtn.addEventListener(
			"click",
			createProtectedClickHandler(() => startGame2v2Local(), "Multi Game")
		);

		tournoiBtn.addEventListener(
			"click",
			createProtectedClickHandler(() => startTournoi(), "Tournament")
		);
		loginBtn.addEventListener("click", () => login());
		logoutBtn.addEventListener("click", async () => {
			try {
				const response = await fetch("/api/logout", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
					},
				});

				if (response.ok) {
					console.log("Logout successful on backend.");
				} else {
					console.error("Backend logout failed.");
				}
			} catch (error) {
				console.error("Error during logout fetch:", error);
			} finally {
				sessionStorage.clear();
				import("../router/router.js").then(({ router }) => {
					router.navigate("/game");
				});
			}
		});

		profilBtn.addEventListener("click", () => go_profil());
		chatBtn.addEventListener("click", () => go_chat());
	}

	window.addEventListener("beforeunload", () => {
		cleanupCurrentGame();
	});

	return page;
}
