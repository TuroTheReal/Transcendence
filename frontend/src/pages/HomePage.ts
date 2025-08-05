import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { createLogoutSwitcher } from "../components/logoutSwitcher.js";

export function createHomePage(): HTMLElement {
	// Debug: vérifier les tokens de sessionStorage
	console.log("🏠 HomePage - authToken:", sessionStorage.getItem('authToken'));
	console.log("🏠 HomePage - username:", sessionStorage.getItem('username'));
	console.log("🏠 HomePage - currentUser:", sessionStorage.getItem('currentUser'));

	const page = document.createElement("div");
	page.className = "animate-fade-in min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		const content = `
			<!-- Particles Background -->
			<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 10%; animation-delay: 0s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 20%; animation-delay: 1s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 30%; animation-delay: 2s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 40%; animation-delay: 3s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 50%; animation-delay: 4s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 60%; animation-delay: 5s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 70%; animation-delay: 2s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 80%; animation-delay: 1s;"></div>
				<div class="absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float" style="left: 90%; animation-delay: 3s;"></div>
			</div>
			
			<!-- Scan lines effect -->
			<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-green-400/5 before:to-transparent before:bg-[length:100%_4px] before:animate-scan before:pointer-events-none">
				<div class="bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-green-400/30 shadow-neon-green max-w-2xl w-full flex flex-col items-center p-8 animate-slide-up">
					<h1 class="text-6xl font-bold text-green-400 drop-shadow-neon-green animate-pulse mb-8 text-center">🚀 Transcendence</h1>
					<nav class="flex flex-wrap justify-center gap-3 mb-8">
						<button class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/50 rounded-xl text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-green-lg hover:border-green-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-green-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/game">${i18n.t('navigation.game')}</button>
						<button class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/50 rounded-xl text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-blue hover:border-blue-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-blue-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/server-game">🖥️ Server-Side Pong</button>
						<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-xl text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/profile">${i18n.t('navigation.profile')}</button>
						<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-xl text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/chat">${i18n.t('navigation.chat')}</button>
						<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-xl text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/leaderboard">${i18n.t('navigation.leaderboard')}</button>
					</nav>
					<h2 class="text-blue-400 text-xl font-semibold text-center mb-4">${i18n.t('home.welcome')}</h2>
					<p class="text-gray-400 mb-8 text-center">${i18n.t('home.subtitle')}</p>
					<button class="bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/60 rounded-xl text-white font-bold text-xl py-4 px-8 w-full max-w-xs transition-all duration-300 hover:scale-105 hover:shadow-neon-green-lg hover:border-green-300 hover:from-green-500/50 hover:to-emerald-500/50 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-green-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/game">
						🎮 ${i18n.t('home.start_game')}
					</button>
				</div>
				<div class="absolute top-4 right-4" id="language-switcher-container"></div>
				<div class="absolute top-4 left-4" id="logout-container"></div>
			</div>
		`;

		page.innerHTML = content;

		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		const logoutContainer = page.querySelector('#logout-container');
		if (logoutContainer)
			logoutContainer?.appendChild(createLogoutSwitcher());
	}

	renderContent();

	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	// Navigation - attached once, works for all renders
	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}