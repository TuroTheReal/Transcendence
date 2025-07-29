import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { createLogoutSwitcher } from "../components/logoutSwitcher.js";
import { createNeonContainer } from "../styles/neonTheme.js";

export function createHomePage(): HTMLElement {
	// Debug: vérifier les tokens de sessionStorage
	console.log("🏠 HomePage - authToken:", sessionStorage.getItem('authToken'));
	console.log("🏠 HomePage - username:", sessionStorage.getItem('username'));
	console.log("🏠 HomePage - currentUser:", sessionStorage.getItem('currentUser'));

	const page = document.createElement("div");
	page.className = "fade-in";

	const renderContent = () => {
		const content = `
			<div class="neon-card max-w-2xl w-full flex flex-col items-center p-8 slide-up">
				<h1 class="neon-title mb-8 text-center">🚀 Transcendence</h1>
				<nav class="neon-nav">
					<button class="neon-btn neon-btn-primary" data-route="/game">${i18n.t('navigation.game')}</button>
					<button class="neon-btn neon-btn-accent" data-route="/server-game">🖥️ Server-Side Pong</button>
					<button class="neon-btn neon-btn-secondary" data-route="/profile">${i18n.t('navigation.profile')}</button>
					<button class="neon-btn neon-btn-secondary" data-route="/chat">${i18n.t('navigation.chat')}</button>
					<button class="neon-btn neon-btn-secondary" data-route="/leaderboard">${i18n.t('navigation.leaderboard')}</button>
				</nav>
				<h2 class="neon-subtitle text-center mb-4">${i18n.t('home.welcome')}</h2>
				<p class="neon-text-muted mb-8 text-center">${i18n.t('home.subtitle')}</p>
				<button class="neon-btn neon-btn-primary text-xl py-4 px-8 w-full max-w-xs" data-route="/game">
					🎮 ${i18n.t('home.start_game')}
				</button>
			</div>
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="absolute top-4 left-4" id="logout-container"></div>
		`;

		page.innerHTML = createNeonContainer(content);

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