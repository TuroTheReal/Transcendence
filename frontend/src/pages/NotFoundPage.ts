import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createNotFoundPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<!-- Champ d'étoiles en arrière-plan -->
		<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse"></div>

		<!-- Container principal avec effet scan -->
		<div class="min-h-screen flex items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none relative">
			
			<!-- Sélecteur de langue en haut à droite -->
			<div class="absolute top-4 right-4 z-50" id="language-switcher-container"></div>

			<!-- Interface principale -->
			<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 max-w-md w-full flex flex-col items-center">
				
				<!-- Titre principal avec effet glitch -->
				<h1 class="text-8xl font-bold text-red-400 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-8 relative">
					<span class="relative z-10 text-red-400 drop-shadow-[0_0_10px_rgb(239,68,68)] drop-shadow-[0_0_20px_rgb(239,68,68)] animate-pulse">
						${i18n.t('not_found.title')}
					</span>
				</h1>
				
				<!-- Message d'erreur -->
				<p class="text-gray-300 mb-8 text-center text-lg font-medium">
					${i18n.t('not_found.message')}
				</p>
				
				<!-- Bouton de retour avec style rétro -->
				<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full w-full relative overflow-hidden group" id="back-home">
					<span class="relative z-10 text-red-400 drop-shadow-[0_0_5px_rgb(239,68,68)]">
						${i18n.t('not_found.back_home')}
					</span>
					<div class="absolute inset-0 bg-gradient-to-r from-red-400/10 via-red-400/20 to-red-400/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
				</button>
			</div>
		</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Re-attach event listener
		const btn = page.querySelector("#back-home") as HTMLButtonElement;
		btn.addEventListener("click", () => {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/game");
			});
		});
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	return page;
}