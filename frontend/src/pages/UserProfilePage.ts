import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createUserProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "page-container fade-in";

	// Get username from route parameters
	const routeParams = (window as any).routeParams || {};
	const targetUsername = routeParams.username;
	console.log("targetUsername", targetUsername);
	console.log("routeParams", routeParams);

	if (!targetUsername) {
		page.innerHTML = `
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="card max-w-md w-full text-center slide-up">
				<h2 class="section-title text-accent mb-4">${i18n.t('user_profile.error_title')}</h2>
				<p class="text-muted">${i18n.t('user_profile.username_missing')}</p>
				<button class="btn-primary mt-4" data-route="/home">${i18n.t('user_profile.back_to_home')}</button>
			</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		setupNavigation(page);
		return page;
	}

	const renderContent = () => {
		page.innerHTML = `
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="card max-w-2xl w-full flex flex-col items-center slide-up">
				<header class="nav-header w-full">
					<button class="btn-ghost" data-route="/chat">${i18n.t('user_profile.back_to_chat')}</button>
					<h2 class="page-title">${i18n.t('user_profile.title')} <span id="profile-username">${targetUsername}</span></h2>
				</header>
			<main class="w-full flex flex-col items-center">
				<div class="flex items-center gap-8 mb-8">
					<div class="avatar-container">
						<img src="/default-avatar.png" alt="Avatar" id="user-avatar" class="w-full h-full object-cover">
					</div>
					<div class="flex-1">
						<h3 id="username-display" class="section-title mb-2">${targetUsername}</h3>
						<p id="join-date" class="text-muted text-sm">${i18n.t('user_profile.member_since')} -</p>
					</div>
				</div>
				
				<div class="w-full grid grid-cols-3 gap-4 mb-8">
					<div class="text-center p-4 bg-surface rounded-modern border">
						<div id="games-played" class="text-2xl font-bold text-accent">-</div>
						<div class="text-sm text-muted">${i18n.t('user_profile.games_played')}</div>
					</div>
					<div class="text-center p-4 bg-surface rounded-modern border">
						<div id="wins" class="text-2xl font-bold text-success">-</div>
						<div class="text-sm text-muted">${i18n.t('user_profile.wins')}</div>
					</div>
					<div class="text-center p-4 bg-surface rounded-modern border">
						<div id="losses" class="text-2xl font-bold text-error">-</div>
						<div class="text-sm text-muted">${i18n.t('user_profile.losses')}</div>
					</div>
				</div>

				<div class="w-full">
					<h4 class="section-title mb-4">${i18n.t('user_profile.match_history')}</h4>
					<div id="matches-history" class="space-y-2">
						<div class="text-center text-muted py-4">
							<div class="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-accent rounded-full mb-2"></div>
							<div>${i18n.t('user_profile.loading')}</div>
						</div>
					</div>
				</div>

				<div class="w-full mt-6 flex gap-4 justify-center">
					<button id="send-message-btn" class="btn-primary">
						${i18n.t('user_profile.send_message')}
					</button>
					<button id="invite-game-btn" class="btn-secondary">
						${i18n.t('user_profile.invite_game')}
					</button>
				</div>
			</main>
			</div>
		</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	// Load user data
	loadUserProfile(page, targetUsername);
	setupNavigation(page);
	setupActions(page, targetUsername);

	return page;
}

async function loadUserProfile(page: HTMLElement, username: string) {
	try {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		// Get user profile data
		const profileResponse = await fetch(`/api/profile?username=${encodeURIComponent(username)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (!profileResponse.ok) {
			throw new Error(`HTTP ${profileResponse.status}`);
		}

		const userData = await profileResponse.json();
		
		// Update UI with user data
		const usernameDisplay = page.querySelector('#username-display');
		const userAvatar = page.querySelector('#user-avatar') as HTMLImageElement;
		const joinDate = page.querySelector('#join-date');
		const gamesPlayed = page.querySelector('#games-played');
		const wins = page.querySelector('#wins');
		const losses = page.querySelector('#losses');

		if (usernameDisplay) usernameDisplay.textContent = userData.username;
		if (userAvatar && userData.avatarUrl) {
			userAvatar.src = userData.avatarUrl;
		}
		if (joinDate) {
			const date = new Date(userData.createdAt).toLocaleDateString('fr-FR');
			joinDate.textContent = `${i18n.t('user_profile.member_since')} ${date}`;
		}
		if (gamesPlayed) gamesPlayed.textContent = userData.gamesPlayed?.toString() || '0';
		if (wins) wins.textContent = userData.wins?.toString() || '0';
		if (losses) losses.textContent = userData.losses?.toString() || '0';

		// Load match history
		loadMatchHistory(page, username);

	} catch (error) {
		console.error('Error loading user profile:', error);
		const main = page.querySelector('main');
		if (main) {
			main.innerHTML = `
				<div class="text-center p-8">
					<h3 class="text-xl font-bold text-red-400 neon-text mb-2">${i18n.t('user_profile.error_title')}</h3>
					<p class="text-gray-300">${i18n.t('user_profile.profile_load_error')} ${username}</p>
					<button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 mt-4" data-route="/chat">${i18n.t('user_profile.back_to_chat')}</button>
				</div>
			`;
		}
	}
}

async function loadMatchHistory(page: HTMLElement, username: string) {
	try {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const matchesResponse = await fetch(`/api/profile/matches?username=${encodeURIComponent(username)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (!matchesResponse.ok) {
			throw new Error(`HTTP ${matchesResponse.status}`);
		}

		const matches = await matchesResponse.json();
		const matchesHistory = page.querySelector('#matches-history');

		if (matchesHistory) {
			if (matches.length === 0) {
				matchesHistory.innerHTML = `
					<div class="text-center text-cyan-400 py-4">
						${i18n.t('user_profile.no_matches')}
					</div>
				`;
			} else {
				matchesHistory.innerHTML = matches.map((match: any) => {
					const isWinner = match.winnerId === match.player1.id;
					const resultClass = isWinner ? 'text-green-400' : 'text-red-400';
					return `
						<div class="bg-gray-700 bg-opacity-50 p-4 rounded-xl border border-purple-400 border-opacity-30">
							<div class="flex justify-between items-center">
								<div>
									<span class="font-medium text-cyan-400">${match.player1.username}</span>
									<span class="text-gray-400 mx-2">${i18n.t('user_profile.vs')}</span>
									<span class="font-medium text-cyan-400">${match.player2.username}</span>
								</div>
								<div class="text-right">
									<div class="font-bold ${resultClass}">
										${match.score1} - ${match.score2}
									</div>
									<div class="text-xs text-gray-400">
										${new Date(match.playedAt).toLocaleDateString('fr-FR')}
									</div>
								</div>
							</div>
						</div>
					`;
				}).join('');
			}
		}
	} catch (error) {
		console.error('Error loading match history:', error);
		const matchesHistory = page.querySelector('#matches-history');
		if (matchesHistory) {
			matchesHistory.innerHTML = `
				<div class="text-center text-red-400 py-4">
					${i18n.t('user_profile.history_load_error')}
				</div>
			`;
		}
	}
}

function setupNavigation(page: HTMLElement) {
	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
			});
		}
	});
}

function setupActions(page: HTMLElement, targetUsername: string) {
	const sendMessageBtn = page.querySelector('#send-message-btn');
	const inviteGameBtn = page.querySelector('#invite-game-btn');

	sendMessageBtn?.addEventListener('click', () => {
		// Retourner au chat et ouvrir la conversation avec cet utilisateur
		import('../router/router.js').then(({ router }) => {
			// Store the username to open conversation in chat
			sessionStorage.setItem('openConversationWith', targetUsername);
			router.navigate('/chat');
		});
	});

	inviteGameBtn?.addEventListener('click', () => {
		// TODO: Implement game invitation
		alert(i18n.t('user_profile.game_invite_todo', { username: targetUsername }));
	});
}