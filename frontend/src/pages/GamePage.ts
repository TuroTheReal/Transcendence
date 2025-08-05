import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { Game_solo } from "../components/game/game_solo.js";
import { Game_ligne } from "../components/game/game_ligne.js";
import { Game_tournoi } from "../components/game/game_tournoi.js";

// Function to notify all users about tournament match start
async function notifyAllUsersAboutTournamentMatch(player1: string, player2: string, matchType: "first" | "second" | "final") {
	try {
		let message = "";
		const currentLanguage = i18n.getCurrentLanguage();
		
		switch (matchType) {
			case "first":
				if (currentLanguage === "en") {
					message = `🏆 Tournament Match Starting! ${player1} vs ${player2} - First Match`;
				} else if (currentLanguage === "fr") {
					message = `🏆 Match de Tournoi ! ${player1} vs ${player2} - Premier Match`;
				} else {
					message = `🏆 ¡Partido de Torneo! ${player1} vs ${player2} - Primer Partido`;
				}
				break;
			case "second":
				if (currentLanguage === "en") {
					message = `🏆 Tournament Match Starting! ${player1} vs ${player2} - Semi-Final`;
				} else if (currentLanguage === "fr") {
					message = `🏆 Match de Tournoi ! ${player1} vs ${player2} - Demi-Finale`;
				} else {
					message = `🏆 ¡Partido de Torneo! ${player1} vs ${player2} - Semi-Final`;
				}
				break;
			case "final":
				if (currentLanguage === "en") {
					message = `🎯 TOURNAMENT FINAL! ${player1} vs ${player2} - The Ultimate Match!`;
				} else if (currentLanguage === "fr") {
					message = `🎯 FINALE DU TOURNOI ! ${player1} vs ${player2} - Le Match Ultime !`;
				} else {
					message = `🎯 ¡FINAL DEL TORNEO! ${player1} vs ${player2} - ¡El Partido Definitivo!`;
				}
				break;
		}

		const response = await fetch('/api/notifications/tournament', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message })
		});

		if (!response.ok) {
			console.error('Failed to send tournament notification:', response.statusText);
		} else {
			// console.log('Tournament notification sent successfully');
		}
	} catch (error) {
		console.error('Error sending tournament notification:', error);
	}
}

export function createGamePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	let currentGame: Game_solo | Game_ligne | Game_tournoi | null = null;

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
			<!-- Bouton LOG-IN en haut à gauche -->
			<div class="absolute top-4 left-4 z-50">
				<div class="login-dropdown">
					<button id="loginBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						<span class="relative z-10">
						${i18n.t('game.connexion')}
						</span>
					</button>
					<button id="logoutBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full text-red-300">
						<span class="relative z-10">
						${i18n.t('game.deco')}
						</span>
					</button>
				</div>
			</div>
			<!-- TITRE tout en haut, centré -->
			<h2 id="nameId" class="text-2xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse absolute top-4 left-1/2 transform -translate-x-1/2 z-40"></h2>
			<!-- BOUTONS profil/chat centrés -->
			<div class="absolute top-0 flex flex-col items-center justify-center gap-4 mt-20">
				<div class="flex gap-4">
					<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" id="profilBtn">
						${i18n.t('game.profile')}
					</button>
					<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" id="chatBtn">
						CHAT
					</button>
				</div>
			</div>

			<!-- Titre principal avec effet néon -->
			<h1 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse mb-12">
				🏓 RETRO PONG
			</h1>

			<!-- Menu principal -->
			<div id="menu" class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8">
				<h2 class="text-3xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
				${i18n.t('game.game_mode')}
				</h2>
				<div class="flex flex-col gap-6">
					<button id="localBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						<span class="relative z-10">
						${i18n.t('game.local_mode')}
						</span>
					</button>
					<button id="ligneBtn" class="hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						<span class="relative z-10">
						${i18n.t('game.line_mode')}
						</span>
					</button>
					<button id="serverGameBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/server-game">
						<span class="relative z-10">
						${i18n.t('game.server_side_pong')}
						</span>
					</button>
				</div>
			</div>
			<div>
				<p id="multiError" class="mt-4 text-red-400 text-lg font-bold drop-shadow-[0_0_5px_rgb(239,68,68)] animate-pulse hidden">
					${i18n.t('game.mess_line_err')}
				</p>
			</div>

			<!-- Menu local -->
			<div id="menu_local" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8">
				<button id="backToMainBtn" class="mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('chat.back')}
				</button>
				<h2 class="text-3xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
				${i18n.t('game.mode_local')}
				</h2>
				<div class="flex flex-col gap-6">
					<button id="soloBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						🤖 SOLO (VS IA)
					</button>
					<button id="versusBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						👥 VERSUS (1v1)
					</button>
					<button id="multiBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						${i18n.t('game.multi')}
					</button>
					<button id="tournoiBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						${i18n.t('game.tournament')}
					</button>
				</div>
			</div>

			<!-- Menu en ligne -->
			<div id="menu_ligne" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8">
				<button id="backToMainBtn2" class="mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('chat.back')}
				</button>
				<h2 class="text-3xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
				${i18n.t('game.mode_line')}
				</h2>
				<div class="flex flex-col gap-6">
					<button id="solo_ligneBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						👥 VERSUS (1v1)
					</button>
					<button id="multiBtn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						${i18n.t('game.multi')}
					</button>
				</div>
			</div>

			<!-- Interface Tournoi -->
			<div id="menu_tournoi" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8">
				<button id="backToMainBtn3" class="mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('chat.back')}
				</button>
				<h2 class="text-3xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-8 text-center">
					${i18n.t('game.tournament')}
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					${[1,2,3,4].map(i => `
					<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4 text-center flex flex-col items-center gap-3">
						<div class="w-16 h-16 rounded-full border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center mb-2 text-2xl text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
							P${i}
						</div>
						<input type="text" placeholder="${i}" class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold">
					</div>`).join("")}
				</div>
				<div class="mt-8 text-center">
					<button id="startTournoiMatchmaking" class="hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						${i18n.t('game.valid_name')}
					</button>
					<p id="tournoiError" class="mt-4 text-red-400 text-lg font-bold drop-shadow-[0_0_5px_rgb(239,68,68)] animate-pulse hidden">
						${i18n.t('game.mess_valid_err')}
					</p>
					<p id="tournoimess" class="m-8 text-purple-300 text-lg font-bold hidden text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
					</p>
					<button id="startTournoi" class="hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						${i18n.t('game.start_tournament')}
					</button>
				</div>
			</div>

			<!-- Interface 1v1 ligne -->
			<div id="menu1v1" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8">
				<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-6" style="height: 45vh; max-width: 900px; width: 75%;">
					<div class="flex h-full">
						<!-- Bouton retour en haut à gauche -->
						<div class="flex flex-col justify-start">
							<button id="backToMainBtn4" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
								${i18n.t('chat.back')}
							</button>
						</div>

						<!-- Contenu principal à droite -->
						<div class="flex-1 ml-8 flex gap-8">
							<!-- Colonne de gauche : Liste d'amis -->
							<div class="flex flex-col h-full" style="width: 350px;">
								<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4 h-full flex flex-col">
									<header class="w-full flex-shrink-0 mb-4 flex items-center justify-between">
										<h2 class="text-2xl font-bold text-green-400 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">Liste d'amis</h2>
										<button class="bg-green-400/20 hover:bg-green-400/40 text-green-400 rounded-full p-2 transition-all duration-300 w-8 h-8 flex items-center justify-center">
											<span class="text-lg font-bold">+</span>
										</button>
									</header>

									<main class="w-full flex-1 overflow-y-auto">
										<div class="space-y-3">
											<!-- Amis en ligne -->
											<div class="bg-black/80 border border-purple-400/30 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 hover:shadow-neon-purple-sm">
												<div class="flex items-center justify-between">
													<div class="flex items-center">
														<span class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_6px_rgb(34,197,94)] mr-2"></span>
														<span class="text-green-400 font-semibold">Alex_Gaming</span>
													</div>
													<button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
														Inviter
													</button>
												</div>
											</div>

											<div class="bg-black/80 border border-purple-400/30 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 hover:shadow-neon-purple-sm">
												<div class="flex items-center justify-between">
													<div class="flex items-center">
														<span class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_6px_rgb(34,197,94)] mr-2"></span>
														<span class="text-green-400 font-semibold">PongMaster</span>
													</div>
													<button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
														Inviter
													</button>
												</div>
											</div>

											<div class="bg-black/80 border border-purple-400/30 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 hover:shadow-neon-purple-sm">
												<div class="flex items-center justify-between">
													<div class="flex items-center">
														<span class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_6px_rgb(34,197,94)] mr-2"></span>
														<span class="text-green-400 font-semibold">RetroGamer</span>
													</div>
													<button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
														Inviter
													</button>
												</div>
											</div>

											<!-- Amis hors ligne -->
											<div class="bg-black/80 border border-purple-400/30 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 hover:shadow-neon-purple-sm opacity-60">
												<div class="flex items-center justify-between">
													<div class="flex items-center">
														<span class="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
														<span class="text-gray-400 font-semibold">CyberPong</span>
													</div>
													<span class="text-gray-500 text-sm">Hors ligne</span>
												</div>
											</div>

											<div class="bg-black/80 border border-purple-400/30 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 hover:shadow-neon-purple-sm opacity-60">
												<div class="flex items-center justify-between">
													<div class="flex items-center">
														<span class="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
														<span class="text-gray-400 font-semibold">NeonPlayer</span>
													</div>
													<span class="text-gray-500 text-sm">Hors ligne</span>
												</div>
											</div>
										</div>
									</main>
								</div>
							</div>

							<!-- Colonne droite : Interface de jeu -->
							<div class="flex-1 h-full flex flex-col">
								<!-- En-tête -->
								<div class="text-center mb-8">
									<h1 class="text-4xl font-bold text-cyan-400 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-2">1v1 EN LIGNE</h1>
									<p class="text-blue-400 text-lg">Préparez-vous pour le combat !</p>
								</div>

								<!-- Zone des joueurs -->
								<div class="flex-1 flex items-center justify-center">
									<div class="flex flex-col items-center gap-6 w-full max-w-md">
										<!-- Joueur 1 -->
										<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4 text-center w-full">
											<div class="flex items-center gap-4">
												<div class="w-16 h-16 rounded-full border-4 border-cyan-400/50 border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] bg-gradient-to-br from-black via-purple-900/20 to-black overflow-hidden bg-gray-700 flex-shrink-0">
													<div class="w-full h-full flex items-center justify-center">
														<span class="text-cyan-400 text-lg font-bold">P1</span>
													</div>
												</div>
												<div class="flex-1">
													<h3 class="text-xl font-bold text-cyan-400 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-1">Joueur 1</h3>
													<div class="bg-gray-700/50 p-2 rounded-lg border border-cyan-400/30">
														<p class="text-cyan-400 text-xs">Prêt à jouer</p>
													</div>
												</div>
											</div>
										</div>
										<!-- Joueur 2 -->
										<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4 text-center w-full">
											<div class="flex items-center gap-4">
												<div class="w-16 h-16 rounded-full border-4 border-purple-400/50 border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] bg-gradient-to-br from-black via-purple-900/20 to-black overflow-hidden bg-gray-700 flex-shrink-0">
													<div class="w-full h-full flex items-center justify-center">
														<span class="text-purple-400 text-lg font-bold">P2</span>
													</div>
												</div>
												<div class="flex-1">
													<h3 class="text-xl font-bold text-purple-400 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-1">Joueur 2</h3>
													<div class="bg-gray-700/50 p-2 rounded-lg border border-purple-400/30">
														<p class="text-purple-400 text-xs">En attente...</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<!-- Zone de jeu -->
			<div id="game" class="hidden w-full max-w-6xl">
				<!-- Bouton retour -->
				<button id="backToMenuBtn" class="mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('chat.back')}
				</button>

				<!-- Bouton restart -->
				<button id="restartBtn" class="hidden mb-6 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('game.new_game')}
				</button>

				<!-- Tableau de score -->
				<div id="scoreboard" class="bg-gradient-to-br from-black via-purple-900/20 to-black border-2 border-purple-400 shadow-[0_0_20px_rgb(157,78,221,0.6),inset_0_0_20px_rgb(157,78,221,0.3)] rounded-2xl p-6 mb-6">
					<div class="grid grid-cols-2 gap-8 text-center">
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4">
							<p id="scoreP1" class="text-2xl font-bold text-purple-300">
							${i18n.t('game.player_1')}
							</p>
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-4">
							<p id="scoreP2" class="text-2xl font-bold text-purple-300">
							${i18n.t('game.player_2')}
							</p>
						</div>
					</div>
				</div>

				<!-- Canvas avec cadre futuriste -->
				<div class="relative bg-black/95 border-4 border-purple-400 shadow-[0_0_30px_rgb(157,78,221,0.8),inset_0_0_30px_rgb(157,78,221,0.4)] rounded-2xl mx-auto" style="width: 800px; height: 600px;">
					<canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-black w-full h-full"></canvas>
					<!-- Indicateurs de coin -->
					<div class="absolute top-2 left-2 w-4 h-4 border-purple-400 shadow-[0_0_5px_rgb(157,78,221)] border-l-2 border-t-2"></div>
					<div class="absolute top-2 right-2 w-4 h-4 border-purple-400 shadow-[0_0_5px_rgb(157,78,221)] border-r-2 border-t-2"></div>
					<div class="absolute bottom-2 left-2 w-4 h-4 border-purple-400 shadow-[0_0_5px_rgb(157,78,221)] border-l-2 border-b-2"></div>
					<div class="absolute bottom-2 right-2 w-4 h-4 border-purple-400 shadow-[0_0_5px_rgb(157,78,221)] border-r-2 border-b-2"></div>
				</div>

				<!-- Compte à rebours -->
				<div id="countdowndisplay" class="text-6xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mt-8 text-center"></div>

				<!-- Message de fin de partie -->
				<div id="endMessage" class="text-2xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mt-8 text-center">
				</div>
				<button id="nextMatchBtn" class="hidden m-6 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('game.next_game')}
				</button>
				<button id="finalMatchBtn" class="hidden m-6 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					${i18n.t('game.final')}
				</button>

				<!-- Contrôles -->
				<div id="control_1" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-6 mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
					${i18n.t('game.control')}
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p id="control_player_1" class="text-purple-300 font-semibold">
							${i18n.t('game.p1')}
							</p>
							<p id="control_player_1_command" class="text-sm text-gray-300">
							W / S</p>
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p id="control_player_2" class="text-purple-300 font-semibold">
							${i18n.t('game.p1')}
							</p>
							<p id="control_player_2_command" class="text-sm text-gray-300">
							↑ / ↓
							</p>
						</div>
					</div>
				</div>

				<div id="control_2" class="hidden bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-6 mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
					${i18n.t('game.control')}
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p1')}
							</p>
							<p class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p2')}
							</p>
							<p class="text-sm text-gray-300">J / M</p>
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p3')}
							</p>
							<p class="text-sm text-gray-300">9 / 6</p>
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p4')}
							</p>
							<p class="text-sm text-gray-300">
							↑ / ↓
							</p>
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
			//console.log("Nettoyage du jeu en cours...");

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
		const serverBtn = page.querySelector("#serverBtn") as HTMLButtonElement | null;
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

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement | null;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement | null;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement | null;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement | null;
		const nameId = page.querySelector("#nameId") as HTMLElement;

		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		languageSwitcherContainer?.classList.remove("hidden");

		// reinitialiser page 1v1
		//reset1v1RemoteInterface();

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
			if (loginBtn) loginBtn.classList.remove("hidden");
			if (chatBtn) chatBtn.classList.add("hidden");
			if (profilBtn) profilBtn.classList.add("hidden");
			if (logoutBtn) logoutBtn.classList.add("hidden");
		} else {
			if (loginBtn) loginBtn.classList.add("hidden");
			if (chatBtn) chatBtn.classList.remove("hidden");
			if (profilBtn) profilBtn.classList.remove("hidden");
			if (logoutBtn) logoutBtn.classList.remove("hidden");
			nameId.classList.remove("hidden");
			const userId = sessionStorage.getItem("username");
			nameId.innerText = `${userId}`;
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
		const serverBtn = page.querySelector("#serverBtn") as HTMLButtonElement | null;

		const menuLocal = page.querySelector("#menu_local") as HTMLElement;
		const soloBtn = page.querySelector("#soloBtn") as HTMLButtonElement | null;
		const versusBtn = page.querySelector("#versusBtn") as HTMLButtonElement | null;
		const backToMainBtn = page.querySelector(
			"#backToMainBtn"
		) as HTMLButtonElement | null;

		const menuLigne = page.querySelector("#menu_ligne") as HTMLElement;
		const soloLigneBtn = page.querySelector(
			"#solo_ligneBtn"
		) as HTMLButtonElement | null;
		const multiBtn = page.querySelector("#multiBtn") as HTMLButtonElement | null;
		const tournoiBtn = page.querySelector(
			"#tournoiBtn"
		) as HTMLButtonElement | null;
		const backToMainBtn2 = page.querySelector(
			"#backToMainBtn2"
		) as HTMLButtonElement | null;

		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const backToMenuBtn = page.querySelector(
			"#backToMenuBtn"
		) as HTMLButtonElement | null;
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
		) as HTMLButtonElement | null;
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

		let menu1v1 = page.querySelector("#menu1v1") as HTMLElement | null;
		let start1v1 = page.querySelector("#start1v1") as HTMLButtonElement | null;
		let error1v1 = page.querySelector("#error1v1") as HTMLElement | null;
		const backToMainBtn4 = page.querySelector('#backToMainBtn4') as HTMLButtonElement | null;

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement | null;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement | null;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement | null;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement | null;
		const nameId = page.querySelector("#nameId") as HTMLElement;

		// connecte ou non
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			//console.log("pas connecte");
			if (loginBtn) loginBtn.classList.remove("hidden");
			if (chatBtn) chatBtn.classList.add("hidden");
			if (profilBtn) profilBtn.classList.add("hidden");
			if (logoutBtn) logoutBtn.classList.add("hidden");
		} else {
			if (loginBtn) loginBtn.classList.add("hidden");
			if (logoutBtn) logoutBtn.classList.remove("hidden");
			if (chatBtn) chatBtn.classList.remove("hidden");
			if (profilBtn) profilBtn.classList.remove("hidden");
			nameId.classList.remove("hidden");
			const userId = sessionStorage.getItem("username");
			nameId.innerText = `${userId}`;
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

			const languageSwitcherContainer = page.querySelector('#language-switcher-container');
			languageSwitcherContainer?.classList.add("hidden");
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
			const tournoiMess = page.querySelector('#tournoimess') as HTMLElement;
			const endMessage = page.querySelector('#endMessage') as HTMLElement;

			if (i18n.getCurrentLanguage() == "en")
				tournoiMess.innerText = `The first match between ${player_a} and ${player_b} is going to start !`;
			else if (i18n.getCurrentLanguage() == "fr")
				tournoiMess.innerText = `Le premier match entre ${player_a} et ${player_b} va commencer !`;
			else
				tournoiMess.innerText = `El primer partido entre ${player_a} y ${player_b} va a comenzar !`;

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
				// Notify all connected users about tournament match start
				notifyAllUsersAboutTournamentMatch(player_a, player_b, "first");
				
				cleanupCurrentGame();
				currentGame = new Game_tournoi(player_a, player_b, 0);

				hideMenus();
				showGameInterface(player_a, player_b);

				currentGame.start_game_loop();

				waitForMatchEnd((winner) =>
				{
					finaliste_1 = winner;
					
					if (winner == player_a)
					{
						if (i18n.getCurrentLanguage() == "en")
							endMessage.innerText = `${player_a} win the game ! The next match between ${player_c} and ${player_d} is going to start !`;
						else if (i18n.getCurrentLanguage() == "fr")
							endMessage.innerText = `${player_a} gagne le match ! Le prochain match entre ${player_c} et ${player_d} va commencer !`;
						else
							endMessage.innerText = `${player_a} gana el partido ! El proximo partido entre ${player_c} y ${player_d} va a comenzar !`;
					}					
					else
					{
						if (i18n.getCurrentLanguage() == "en")
							endMessage.innerText = `${player_b} win the game ! The next match between ${player_c} and ${player_d} is going to start !`;
						else if (i18n.getCurrentLanguage() == "fr")
							endMessage.innerText = `${player_b} gagne le match ! Le prochain match entre ${player_c} et ${player_d} va commencer !`;
						else
							endMessage.innerText = `${player_b} gana el partido ! El proximo partido entre ${player_c} y ${player_d} va a comenzar !`;
					}	
					endMessage.classList.remove("hidden");
					showNextMatchButton(() => startMatch2());
				});
			}

			function startMatch2() {
				// Notify all connected users about tournament match start
				notifyAllUsersAboutTournamentMatch(player_c, player_d, "second");
				
				hideButton(nextMatchBtn);
				cleanupCurrentGame();
				currentGame = new Game_tournoi(player_c, player_d, 0);

				hideMenus();
				showGameInterface(player_c, player_d);

				currentGame.start_game_loop();

				waitForMatchEnd((winner) => {
					finaliste_2 = winner;
					if (winner == player_c)
					{
						if (i18n.getCurrentLanguage() == "en")
							endMessage.innerText = `${player_c} win the game ! The final between ${finaliste_1} and ${finaliste_2} is going to start !`;
						else if (i18n.getCurrentLanguage() == "fr")
							endMessage.innerText = `${player_c} gagne le match ! La finale entre ${finaliste_1} et ${finaliste_2} va commencer !`;
						else
							endMessage.innerText = `${player_c} gana el partido ! La final entre ${finaliste_1} y ${finaliste_2} va a comenzar !`;
					}					
					else
					{
						if (i18n.getCurrentLanguage() == "en")
							endMessage.innerText = `${player_d} win the game ! The final between ${finaliste_1} and ${finaliste_2} is going to start !`;
						else if (i18n.getCurrentLanguage() == "fr")
							endMessage.innerText = `${player_d} gagne le match ! La finale entre ${finaliste_1} et ${finaliste_2} va commencer !`;
						else
							endMessage.innerText = `${player_d} gana el partido ! La final entre ${finaliste_1} y ${finaliste_2} va a comenzar !`;
					}	
					endMessage.classList.remove("hidden");
					showFinalMatchButton(() => startFinal());
				});
			}

			function startFinal() {
				// Notify all connected users about tournament final start
				notifyAllUsersAboutTournamentMatch(finaliste_1, finaliste_2, "final");
				
				console.log("la FINAAALE");
				hideButton(finalMatchBtn);
				cleanupCurrentGame();

				currentGame = new Game_tournoi(finaliste_1, finaliste_2, 1);

				hideMenus();
				showGameInterface(finaliste_1, finaliste_2);
				currentGame.start_game_loop();

				waitForMatchEnd((winner) => {
					// Le tournoi est terminé, afficher le bouton retour menu
					if (backToMenuBtn) backToMenuBtn.style.display = "block";
				});
			}

			function waitForMatchEnd(callback: (winner: string) => void) {
				const interval = setInterval(() => {
					if (currentGame && 'check_end_game' in currentGame) {
						const result = currentGame.check_end_game();
						if (result === 1) {
							clearInterval(interval);
							const winner = 'getPlayer1Name' in currentGame ? currentGame.getPlayer1Name() : 'Player 1'; // existe que pour game_tournoi
							callback(winner);
						} else if (result === 2) {
							clearInterval(interval);
							const winner = 'getPlayer2Name' in currentGame ? currentGame.getPlayer2Name() : 'Player 2'; // existe que pour game_tournoi
							callback(winner);
						}
					}
				}, 1000);
			}

			function hideMenus() {
				menuLocal.style.display = "none";
				menuLigne.style.display = "none";
				menuTournoi.style.display = "none";
				game.style.display = "block";
				if (backToMenuBtn) backToMenuBtn.style.display = "none";
				if (loginBtn) loginBtn.classList.add("hidden");
				if (logoutBtn) logoutBtn.classList.add("hidden");
				if (profilBtn) profilBtn.classList.add("hidden");
				if (chatBtn) chatBtn.classList.add("hidden");
				nameId.classList.add("hidden");
			}

			function showGameInterface(player1: string, player2: string) {
				controlPlayer1.textContent = player1;
				scorep1.textContent = `${player1} : 0`;
				controlPlayer1Command.textContent = "W / S";

				controlPlayer2.textContent = player2;
				scorep2.textContent = `${player2} : 0`;
				// controlPlayer2Command.textContent = 'ARROW UP / ARROW DOWN';

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
			const languageSwitcherContainer = page.querySelector('#language-switcher-container');
			languageSwitcherContainer?.classList.add("hidden");
			currentGame = new Game_solo(mode);

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "block";
			restart.style.display = "block";
			if (loginBtn) loginBtn.classList.add("hidden");
			if (logoutBtn) logoutBtn.classList.add("hidden");
			if (profilBtn) profilBtn.classList.add("hidden");
			if (chatBtn) chatBtn.classList.add("hidden");
			nameId.classList.add("hidden");

			const token = sessionStorage.getItem("authToken");
			if (i18n.getCurrentLanguage() == "en")
			{
				if (token)
				{
					const userId = sessionStorage.getItem("username");
					scorep1.textContent = `${userId} : 0`;
					controlPlayer1.textContent = "Player 1";
					if (mode == "solo")
					{
						scorep2.textContent = "PLAYER 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "PLAYER 2 : 0"
						controlPlayer2.textContent = 'Player 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
				else
				{
					scorep1.textContent = "PLAYER 1 : 0";
					controlPlayer1.textContent = "Player 1";
					if (mode == "solo")
					{
						scorep2.textContent = "PLAYER 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "PLAYER 2 : 0"
						controlPlayer2.textContent = 'Player 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
			}
			else if (i18n.getCurrentLanguage() == "fr")
			{
				if (token)
				{
					const userId = sessionStorage.getItem("username");
					scorep1.textContent = `${userId} : 0`;
					controlPlayer1.textContent = "Joueur 1";
					if (mode == "solo")
					{
						scorep2.textContent = "JOUEUR 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "JOUEUR 2 : 0"
						controlPlayer2.textContent = 'Joueur 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
				else
				{
					scorep1.textContent = "JOUEUR 1 : 0";
					controlPlayer1.textContent = "Joueur 1";
					if (mode == "solo")
					{
						scorep2.textContent = "JOUEUR 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "JOUEUR 2 : 0"
						controlPlayer2.textContent = 'Joueur 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
			}
			else
			{
				if (token)
				{
					const userId = sessionStorage.getItem("username");
					scorep1.textContent = `${userId} : 0`;
					controlPlayer1.textContent = "Jugador 1";
					if (mode == "solo")
					{
						scorep2.textContent = "JUGADOR 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "JUGADOR 2 : 0"
						controlPlayer2.textContent = 'Jugador 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
				else
				{
					scorep1.textContent = "JUGADOR 1 : 0";
					controlPlayer1.textContent = "Jugador 1";
					if (mode == "solo")
					{
						scorep2.textContent = "JUGADOR 2 : 0"
						controlPlayer2.textContent = 'IA';
						controlPlayer2Command.textContent = "";
					}
					else
					{
						scorep2.textContent = "JUGADOR 2 : 0"
						controlPlayer2.textContent = 'Jugador 2';
						controlPlayer2Command.textContent = "↑ / ↓";
					}
				}
			}
			control1.style.display = 'block';

			restart.onclick = () =>
            {
				if (currentGame)
                {
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
			const languageSwitcherContainer = page.querySelector('#language-switcher-container');
			languageSwitcherContainer?.classList.add("hidden");

			if(i18n.getCurrentLanguage() == "en")
			{
				scorep1.textContent = "Team 1 : 0"
				scorep2.textContent = "Team 2 : 0"
			}
			else
			{
				scorep1.textContent = "Equipe 1 : 0"
				scorep2.textContent = "Equipe 2 : 0"
			}

			currentGame = new Game_ligne();

			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			restart.classList.add("hidden");
			game.style.display = "block";
			control2.style.display = "block";
			if (loginBtn) loginBtn.classList.add("hidden");
			if (logoutBtn) logoutBtn.classList.add("hidden");
			if (profilBtn) profilBtn.classList.add("hidden");
			if (chatBtn) chatBtn.classList.add("hidden");
			nameId.classList.add("hidden");

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

			if (menu1v1) menu1v1.style.display = "block";
			start1v1?.classList.remove("hidden");
			nameId.classList.add("hidden");

			//currentGame.start_game_loop();
		}

		function startGameRemote()
		{
			import("../router/router.js").then(({ router }) => {
				router.navigate("/remote");
			});
		}		
		
		function go_server_side()
		{
			import("../router/router.js").then(({ router }) => {
				router.navigate("/server-game");
			});
		}

		function login()
		{
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


		localBtn?.addEventListener("click", () => {
			try { chooseMode("local"); } catch(e) { console.error("Error in localBtn:", e); }
		});
		ligneBtn?.addEventListener("click", () => {
			try { chooseMode("ligne"); } catch(e) { console.error("Error in ligneBtn:", e); }
		});

		backToMainBtn?.addEventListener("click", () => {
			try { backToMainMenu(); } catch(e) { console.error("Error in backToMainBtn:", e); }
		});
		backToMainBtn2?.addEventListener("click", () => {
			try { backToMainMenu(); } catch(e) { console.error("Error in backToMainBtn2:", e); }
		});
		backToMainBtn3?.addEventListener("click", () => {
			try { backToMainMenu(); } catch(e) { console.error("Error in backToMainBtn3:", e); }
		});
		backToMainBtn4?.addEventListener("click", () => {
			try { backToMainMenu(); } catch(e) { console.error("Error in backToMainBtn4:", e); }
		});
		backToMenuBtn?.addEventListener("click", () => {
			try { backToMainMenu(); } catch(e) { console.error("Error in backToMenuBtn:", e); }
		});

		soloBtn?.addEventListener("click", () => {
			try { startGameSolo("solo"); } catch(e) { console.error("Error in soloBtn:", e); }
		});
		versusBtn?.addEventListener("click", () => {
			try { startGameSolo("versus"); } catch(e) { console.error("Error in versusBtn:", e); }
		});
		soloLigneBtn?.addEventListener("click", () => {
			try { startGameLigneSolo(); } catch(e) { console.error("Error in soloLigneBtn:", e); }
		});
		multiBtn?.addEventListener("click", () => {
			try { startGame2v2Local(); } catch(e) { console.error("Error in multiBtn:", e); }
		});
		tournoiBtn?.addEventListener("click", () => {
			try { startTournoi(); } catch(e) { console.error("Error in tournoiBtn:", e); }
		});
		loginBtn?.addEventListener("click", () => login());
		logoutBtn?.addEventListener("click", async () => {
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

		profilBtn?.addEventListener("click", () => go_profil());
		chatBtn?.addEventListener("click", () => go_chat());
		serverBtn?.addEventListener("click", () => go_server_side());
	}

	window.addEventListener("beforeunload", () => {
		cleanupCurrentGame();
	});

	return page;
}
