import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createNotFoundPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Styles personnalisés pour les effets néon */
			.neon-text {
				text-shadow: 
					0 0 5px currentColor,
					0 0 10px currentColor,
					0 0 15px currentColor,
					0 0 20px currentColor;
			}
			
			.neon-border {
				box-shadow: 
					0 0 10px currentColor,
					inset 0 0 10px currentColor;
			}
			
			.particles {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: -1;
			}
			
			.particle {
				position: absolute;
				width: 2px;
				height: 2px;
				background: #00ff41;
				border-radius: 50%;
				animation: float 6s ease-in-out infinite;
			}
			
			@keyframes float {
				0%, 100% { transform: translateY(0px) rotate(0deg); }
				50% { transform: translateY(-20px) rotate(180deg); }
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
					rgba(0, 255, 65, 0.03) 50%,
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
			
			.glitch {
				position: relative;
				color: #ff0040;
				animation: glitch 2s infinite;
			}
			
			@keyframes glitch {
				0% { transform: translate(0); }
				20% { transform: translate(-2px, 2px); }
				40% { transform: translate(-2px, -2px); }
				60% { transform: translate(2px, 2px); }
				80% { transform: translate(2px, -2px); }
				100% { transform: translate(0); }
			}
		</style>
		
		<!-- Particules d'arrière-plan -->
		<div class="particles">
			<div class="particle" style="left: 10%; animation-delay: 0s;"></div>
			<div class="particle" style="left: 20%; animation-delay: 1s;"></div>
			<div class="particle" style="left: 30%; animation-delay: 2s;"></div>
			<div class="particle" style="left: 40%; animation-delay: 3s;"></div>
			<div class="particle" style="left: 50%; animation-delay: 4s;"></div>
			<div class="particle" style="left: 60%; animation-delay: 5s;"></div>
			<div class="particle" style="left: 70%; animation-delay: 2s;"></div>
			<div class="particle" style="left: 80%; animation-delay: 1s;"></div>
			<div class="particle" style="left: 90%; animation-delay: 3s;"></div>
		</div>
		
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">
			<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-red-400 border-opacity-30 neon-border max-w-md w-full flex flex-col items-center">
			  <h1 class="text-8xl font-bold text-red-400 neon-text glitch mb-8">${i18n.t('not_found.title')}</h1>
			  <p class="text-gray-300 mb-8 text-center">${i18n.t('not_found.message')}</p>
			  <button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-3 px-8 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 w-full" id="back-home">${i18n.t('not_found.back_home')}</button>
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
				router.navigate("/home");
			});
		});
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	return page;
}
