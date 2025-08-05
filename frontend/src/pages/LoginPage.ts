import { AuthService } from "../middleware/auth.js";
import { i18n } from "../services/i18n.js";
import { errorNotif } from "../services/errorNotification.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { getUserInfo } from "./ChatPage.js";

// Créer une instance locale (pas de singleton)
const authService = new AuthService();

export function createLoginPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden animate-fade-in";

const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<!-- Starfield Background -->
		<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse"></div>

		<div class="absolute top-4 left-4 z-50">
			<div class="login-dropdown">
				<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" id="backToGame" data-route="/game">
					← ${i18n.t('game.back')}
				</button>
			</div>
		</div>

		<!-- Scan lines effect -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">

			<h1 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse mb-12">
				🔐 ${i18n.t('auth.login_title')}
			</h1>

			<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
				<form class="space-y-6">
					<div>
						<input
							type="text"
							placeholder="${i18n.t('auth.username')}"
							id="username"
							required
							class="w-full px-4 py-3 rounded-lg bg-slate-700 border-2 border-slate-500 text-white text-lg font-semibold placeholder-slate-300 focus:bg-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 hover:border-slate-400 transition-all duration-300"
						>
					</div>
					<div>
						<input
							type="password"
							placeholder="${i18n.t('auth.password')}"
							id="password"
							required
							class="w-full px-4 py-3 rounded-lg bg-slate-700 border-2 border-slate-500 text-white text-lg font-semibold placeholder-slate-300 focus:bg-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 hover:border-slate-400 transition-all duration-300"
						>
					</div>
					<button type="submit" id="login-btn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-lg w-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						<span class="relative z-10">✨ ${i18n.t('common.login')}</span>
					</button>
				</form>
				<div class="mt-6 space-y-4">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-cyan-600"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-2 bg-gray-900 text-cyan-400">${i18n.t('auth.or')}</span>
						</div>
					</div>

					<button type="button" id="google-signin-btn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl w-full flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
						<svg class="w-5 h-5" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span class="relative z-10">${i18n.t('auth.google_signin')}</span>
					</button>
				</div>
				<button type="button" id="register-btn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl w-full mt-6 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
					<span class="relative z-10">📝 ${i18n.t('common.register')}</span>
				</button>
			</div>
		</div>

		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;

		//page.innerHTML = createNeonContainer(content);

		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		// Re-attach event listeners after re-render
		attachEventListeners();
	};

	const attachEventListeners = () => {
		const form = page.querySelector('form') as HTMLFormElement;
		const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
		const googleSigninBtn = page.querySelector('#google-signin-btn') as HTMLButtonElement;
		const backToGame = page.querySelector('#backToGame')

		if (backToGame) {
			backToGame.addEventListener("click", () => {
				import("../router/router.js").then(({ router }) => {
					router.navigate("/game");
				});
			});
		}
		if (form) {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				sendLogInInfo(page);
			});
		}

		if (signupBtn) {
			signupBtn.addEventListener("click", () => {
				import("../router/router.js").then(({ router }) => {
					router.navigate("/signup");
				});
			});
		}

		if (googleSigninBtn) {
			googleSigninBtn.addEventListener("click", () => {
				handleGoogleSignIn();
			});
		}
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	return page;
}

export async function requireAuth(): Promise<boolean> {
	const user = await authService.getCurrentUser();
	if (!user) {
		import("../router/router.js").then(({ router }) => {
			router.navigate('/login');
		});
		return false;
	}
	return true;
}

async function handleGoogleSignIn(): Promise<void> {
	try {
		// Redirect directly to Google OAuth (no popup)
		window.location.href = '/api/auth/google';
	} catch (error) {
		console.error('Google Sign-In error:', error);
		alert(i18n.t('auth.google_signin_error') || 'Google Sign-In failed');
	}
}

async function registerActiveSessions()
{
	const currentUser = sessionStorage.getItem("currentUser");
	let username = null;

	if (currentUser) {
		try {
			const user = JSON.parse(currentUser);
			username = user.username;
		} catch (e) {
			console.error("Error parsing user data:", e);
		}
	}

	const userId = sessionStorage.getItem("userId");
	if (userId) {
		// Si on a déjà l'userId en cache, on peut démarrer plus vite
		const userData = {
			id: parseInt(userId),
			username: username,
		};
		addActiveSessions(userData);
	} else {
		// Sinon, on récupère les données avec un timeout
		const userInfoPromise = getUserInfo();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("User info timeout")), 3000);
		});

		Promise.race([userInfoPromise, timeoutPromise])
			.then((userData) => {
				if (userData && userData.id) {
					sessionStorage.setItem("userId", userData.id.toString());
					addActiveSessions(userData);
				} else {
					throw new Error("Invalid user data");
				}
			})
	}
}

async function addActiveSessions(userData: any)
{
	let ws: WebSocket | null = null;
	function connectWebSocket() {
		ws = new WebSocket(
			`wss://localhost:3002/ws/login?username=${encodeURIComponent(userData.username)}&userId=${userData.id}`
		);

		ws.onopen = () => {
		};

		ws.onclose = () => {
		};

		ws.onerror = (error) => {
		};
	}
	connectWebSocket();
}

async function sendLogInInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;
	const twoFactorInput = page.querySelector("#two-factor-token") as HTMLInputElement;

	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
		twoFactorToken: twoFactorInput?.value || undefined,
	};

	try {
		const response = await fetch("/api/login", {
			method: "POST",
			credentials: 'include',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(UserInfo),
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { message: errorText };
			}

			switch (response.status) {
				case 400:
					if (errorData.message?.includes('username')) {
						errorNotif.showFieldError('username', 'username_required');
					} else if (errorData.message?.includes('password')) {
						errorNotif.showFieldError('password', 'password_required');
					} else {
						errorNotif.showErrorBanner('check_information', 'warning');
					}
					break;

				case 401:
					if (errorData.message?.includes('User not found')) {
						errorNotif.showFieldError('username', 'user_not_found');
						errorNotif.showErrorBanner('user_not_found_banner');
					} else if (errorData.message?.includes('Wrong password')) {
						errorNotif.showFieldError('password', 'wrong_password');
						errorNotif.showErrorBanner('wrong_password_banner');
					} else if (errorData.message?.includes('Invalid 2FA')) {
						errorNotif.showFieldError('two-factor-token', 'invalid_2fa');
						errorNotif.showErrorBanner('invalid_2fa_banner');
					} else {
						errorNotif.showErrorBanner('invalid_credentials');
					}
					break;

				case 429:
					errorNotif.showErrorBanner('too_many_attempts', 'warning');
					break;

				case 500:
					errorNotif.showErrorBanner('server_error');
					break;

				default:
					errorNotif.showErrorBanner('connection_error', 'error', { status: response.status.toString() });
			}
			return;
		}

		const data = await response.json();

		if (data.success) {
			sessionStorage.setItem('authToken', data.token);
			sessionStorage.setItem('username', data.user.username);

			errorNotif.showSuccessMessage('welcome_message', { username: data.user.username });

			 await authService.getCurrentUser();

            import("../services/GlobalNotificationService.js").then(({ default: globalNotificationService }) => {
                setTimeout(() => {
                    globalNotificationService.connect();
                }, 1000);
            });

            import("../router/router.js").then(({ router }) => {
                router.navigate('/game');
				registerActiveSessions()
            });

		} else if (data.requires2FA) {
			sessionStorage.setItem('pending2FAUser', UserInfo.username);

			// Injecter le champ 2FA avec traductions
			const form = page.querySelector('form');
			const submitButton = form?.querySelector('#login-btn');

			if (form && submitButton && !form.querySelector('#two-factor-token')) {
				const twoFAHTML = `
					<div class="mt-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
						<label class="block text-blue-300 text-sm mb-2">
							🔐 ${i18n.t('auth.twofa_code') || 'Code de vérification (6 chiffres)'}
						</label>
						<input
							type="text"
							id="two-factor-token"
							maxlength="6"
							placeholder="000000"
							class="w-full p-3 bg-gray-800 border border-blue-500 rounded text-center text-lg font-mono text-white focus:ring-2 focus:ring-blue-400"
						/>
						<p class="text-xs text-blue-300 mt-1 text-center">
							${i18n.t('errors.2fa_code_sent')}
						</p>
					</div>
				`;

				form.insertBefore(
					document.createRange().createContextualFragment(twoFAHTML),
					submitButton
				);

				// Formatter automatiquement le code
				const newTwoFAInput = form.querySelector('#two-factor-token') as HTMLInputElement;
				newTwoFAInput?.addEventListener('input', (e) => {
					const target = e.target as HTMLInputElement;
					target.value = target.value.replace(/\D/g, '').slice(0, 6);
				});

				newTwoFAInput?.focus();
			}

			errorNotif.showErrorBanner('_2fa_info', 'info');
		}

	} catch (error) {
		console.error("Login error:", error);

		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			errorNotif.showErrorBanner('network_error');
		} else {
			errorNotif.showErrorBanner('technical_error');
		}
	}
}

function show2FAInput(page: HTMLDivElement): void {
	const form = page.querySelector('.space-y-4') as HTMLFormElement;

	function show2FAInput(page: HTMLDivElement): void {
	// Find the login form
	const form = page.querySelector('form.space-y-6') as HTMLFormElement;
	if (!form) return;

	// Prevent duplicate 2FA input
	if (form.querySelector('#two-factor-token')) return;

	// Create 2FA input field
	const twoFactorDiv = document.createElement('div');
	twoFactorDiv.className = "mt-2";
	const twoFactorInput = document.createElement('input');
	twoFactorInput.type = 'text';
	twoFactorInput.id = 'two-factor-token';
	twoFactorInput.placeholder = i18n.t('auth.two_factor_code') || '6-digit code';
	twoFactorInput.maxLength = 6;
	twoFactorInput.className = 'bg-gray-900/70 border border-purple-400/50 rounded-lg text-white px-4 py-3 w-full text-center font-mono transition-all duration-300 focus:outline-none focus:border-purple-300 focus:shadow-neon-purple placeholder-gray-500';
	twoFactorInput.required = true;

	// Only allow digits
	twoFactorInput.addEventListener('input', (e) => {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 6);
	});

	twoFactorDiv.appendChild(twoFactorInput);

	// Insert 2FA input before the submit button
	const submitButton = form.querySelector('#login-btn');
	if (submitButton) {
		form.insertBefore(twoFactorDiv, submitButton);

		// Change button text for clarity
		submitButton.textContent = i18n.t('auth.verify_and_login') || 'Verify & Login';
	}

	// Focus on the 2FA input
	twoFactorInput.focus();
}
	// Check if 2FA input already exists
	// if (form.querySelector('#two-factor-token')) {
	//     return;
	// }

	// // Create 2FA input field
	// const twoFactorInput = document.createElement('input');
	// twoFactorInput.type = 'text';
	// twoFactorInput.id = 'two-factor-token';
	// twoFactorInput.placeholder = i18n.t('auth.2fa_code') || '6-digit code';
	// twoFactorInput.maxLength = 6;
	// twoFactorInput.className = 'input text-center font-mono';
	// twoFactorInput.required = true;

	// Format input (digits only)
//     twoFactorInput.addEventListener('input', (e) => {
//         const target = e.target as HTMLInputElement;
//         target.value = target.value.replace(/\D/g, '').slice(0, 6);
//     });

//     // Insert before the submit button
//     const submitButton = form.querySelector('#login-btn');
//     if (submitButton) {
//         form.insertBefore(twoFactorInput, submitButton);

//         // Update button text
//         submitButton.textContent = i18n.t('auth.verify_and_login') || 'Verify & Login';
//     }

//     // Focus on the 2FA input
//     twoFactorInput.focus();
}