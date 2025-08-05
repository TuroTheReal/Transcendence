import { i18n } from "../services/i18n.js";
import { AuthService } from "../middleware/auth.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

const authService = new AuthService();

export function createTwoFactorVerifyPage(): HTMLElement {
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
		
		<!-- Champ d'étoiles -->
		<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse"></div>
		<div class="absolute top-4 left-4 z-50">
			<div class="login-dropdown">
				<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" id="backToLogin" data-route="/login">
					← ${i18n.t('common.back')}
				</button>
			</div>
		</div>
		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
			
			<!-- Titre principal avec effet néon -->
			<h1 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse mb-12">
				🔐 ${i18n.t('auth.two_factor_title') || 'Two-Factor Verification'}
			</h1>
			
			<!-- Panneau de vérification 2FA -->
			<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
				<form class="space-y-6">
					<div>
						<input 
							type="text" 
							placeholder="${i18n.t('auth.two_factor_code') || '6-digit code'}" 
							id="two-factor-token" 
							maxlength="6"
							required 
							class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold text-center font-mono"
							autocomplete="one-time-code"
						>
					</div>
					<button type="submit" id="verify-btn" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full w-full text-xl py-4">
						<span class="relative z-10">✨ ${i18n.t('auth.verify_and_login') || 'Verify & Login'}</span>
					</button>
				</form>
				<div id="twofa-error" class="text-red-400 mt-4 text-center" style="display:none"></div>
			</div>
		</div>
		
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;
		
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		attachEventListeners();
	};

	const attachEventListeners = () => {
		const form = page.querySelector("form") as HTMLFormElement;
		const codeInput = page.querySelector(
			"#two-factor-token"
		) as HTMLInputElement;
		const backToLogin = page.querySelector('#backToLogin');
		
		if (backToLogin) {
			backToLogin.addEventListener("click", () => {
				import("../router/router.js").then(({ router }) => {
					router.navigate("/login");
				});
			});
		}

		if (codeInput) {
			codeInput.addEventListener("input", (e) => {
				const target = e.target as HTMLInputElement;
				target.value = target.value.replace(/\D/g, "").slice(0, 6);
			});
		}

		if (form) {
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				send2FACode(page);
			});
		} else {
		}
	};

	renderContent();
	
	window.addEventListener("languageChanged", renderContent);

	return page;
}

async function send2FACode(page: HTMLDivElement): Promise<void> {

	const codeInput = page.querySelector("#two-factor-token") as HTMLInputElement;
	const errorDiv = page.querySelector("#twofa-error") as HTMLDivElement;
	const username = sessionStorage.getItem("pending2FAUser");
	const isGoogleAuth = sessionStorage.getItem("pending2FAGoogle") === "true";
	const tempToken = sessionStorage.getItem("googleAuthTempToken");

	const code = codeInput.value.trim();


	if (!code || code.length !== 6) {
		console.log(`❌ 2FA FRONTEND - Invalid code length: ${code.length}`);
		if (errorDiv) {
			errorDiv.textContent = i18n.t("auth.invalid_2fa_code") || "Invalid code";
			errorDiv.style.display = "block";
		}
		return;
	}

	// Handle Google OAuth 2FA
	if (isGoogleAuth && tempToken) {
		try {
			const response = await fetch("/api/auth/google/verify-2fa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					tempToken: tempToken,
					twoFactorToken: code 
				}),
			});

			const data = await response.json();

			if (data.success && data.token) {
				sessionStorage.setItem("authToken", data.token);
				sessionStorage.setItem("username", data.user.username || "");
				sessionStorage.removeItem("pending2FAGoogle");
				sessionStorage.removeItem("googleAuthTempToken");
				
				await authService.getCurrentUser();
				
				import("../services/GlobalNotificationService.js").then(({ default: globalNotificationService }) => {
	                setTimeout(() => {
	                    globalNotificationService.connect();
	                }, 1000);
	            });
				
				import("../router/router.js").then(({ router }) => {
					router.navigate("/game");
				});
			} else {
				if (errorDiv) {
					errorDiv.textContent =
						data.message ||
						i18n.t("auth.invalid_2fa_code") ||
						"Invalid code";
					errorDiv.style.display = "block";
				}
			}
		} catch (error) {
			console.error("Google 2FA verify error:", error);
			if (errorDiv) {
				errorDiv.textContent =
					i18n.t("auth.login_error") +
					": " +
					(error || "Please try again.");
				errorDiv.style.display = "block";
			}
		}
		return;
	}

	// Handle regular login 2FA
	if (!username) {
		console.log(`❌ 2FA FRONTEND - No username found in pending2FAUser`);
		if (errorDiv) {
			errorDiv.textContent = "Session expired, please login again";
			errorDiv.style.display = "block";
		}
		return;
	}

	try {
		const verifyBtn = page.querySelector("#verify-btn") as HTMLButtonElement;
		if (verifyBtn) {
			verifyBtn.disabled = true;
			verifyBtn.innerHTML = `
				<span class="relative z-10 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
					${i18n.t("auth.verifying") || "Verifying..."}
				</span>
			`;
		}

		console.log(`📤 2FA FRONTEND - Sending request to /api/2fa/verify`);
		const response = await fetch("/api/2fa/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, code }),
			credentials: "include",
		});

		const data = await response.json();

		if (data.success && data.token) {
			sessionStorage.setItem("authToken", data.token);
			sessionStorage.setItem("username", username || "");
			sessionStorage.removeItem("pending2FAUser");
			await authService.getCurrentUser();
			
			import("../services/GlobalNotificationService.js").then(({ default: globalNotificationService }) => {
                setTimeout(() => {
                    globalNotificationService.connect();
                }, 1000);
            });
			
			import("../router/router.js").then(({ router }) => {
				router.navigate("/home");
			});
		} else {
			if (errorDiv) {
				errorDiv.textContent = data.message || i18n.t("auth.invalid_2fa_code") || "Invalid code";
				errorDiv.style.display = "block";
			}
		}
	} catch (error) {
		console.error("2FA verify error:", error);
		if (errorDiv) {
			errorDiv.textContent = i18n.t("auth.login_error") + ": " + (error || "Please try again.");
			errorDiv.style.display = "block";
		}
	} finally {
		const verifyBtn = page.querySelector("#verify-btn") as HTMLButtonElement;
		if (verifyBtn) {
			verifyBtn.disabled = false;
			verifyBtn.innerHTML = `
				<span class="relative z-10 text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
					${i18n.t("auth.verify_and_login") || "Verify & Login"}
				</span>
				<div class="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-purple-400/20 to-purple-400/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
			`;
		}
	}
}