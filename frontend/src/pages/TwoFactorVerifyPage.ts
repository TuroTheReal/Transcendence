import { i18n } from "../services/i18n.js";
import { createNeonContainer } from "../styles/neonTheme.js";
import { AuthService } from "../middleware/auth.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

const authService = new AuthService();

export function createTwoFactorVerifyPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "fade-in";

	const renderContent = () => {
		const content = `
            <div class="neon-card max-w-md w-full p-8 slide-up">
                <h1 class="neon-title text-center mb-8">${i18n.t("auth.2fa_title") || "Two-Factor Verification"}</h1>
                <form class="space-y-6">
                    <div>
                        <input 
                            type="text" 
                            placeholder="${i18n.t("auth.2fa_code") || "6-digit code"}" 
                            id="two-factor-token" 
                            maxlength="6"
                            required 
                            class="neon-input text-center font-mono"
                            autocomplete="one-time-code"
                        >
                    </div>
                    <button type="submit" id="verify-btn" class="neon-btn neon-btn-primary w-full">
                        ${i18n.t("auth.verify_and_login") || "Verify & Login"}
                    </button>
                </form>
                <div id="twofa-error" class="text-error mt-2" style="display:none"></div>
            </div>
            <div class="absolute top-4 right-4" id="language-switcher-container"></div>
        `;

		page.innerHTML = createNeonContainer(content);

		// Add language switcher
		const languageSwitcherContainer = page.querySelector(
			"#language-switcher-container"
		);
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		attachEventListeners();
	};

	const attachEventListeners = () => {
		console.log("🔧 2FA DEBUG - Attaching event listeners");

		const form = page.querySelector("form") as HTMLFormElement;
		const codeInput = page.querySelector(
			"#two-factor-token"
		) as HTMLInputElement;

		console.log("🔧 2FA DEBUG - Form found:", !!form);
		console.log("🔧 2FA DEBUG - Code input found:", !!codeInput);

		if (codeInput) {
			codeInput.addEventListener("input", (e) => {
				const target = e.target as HTMLInputElement;
				target.value = target.value.replace(/\D/g, "").slice(0, 6);
			});
			console.log("🔧 2FA DEBUG - Input event listener attached");
		}

		if (form) {
			form.addEventListener("submit", (e) => {
				console.log("🔧 2FA DEBUG - Form submit event triggered!");
				e.preventDefault();
				send2FACode(page);
			});
			console.log("🔧 2FA DEBUG - Submit event listener attached");
		} else {
			console.log("❌ 2FA DEBUG - Form not found!");
		}
	};

	renderContent();
	window.addEventListener("languageChanged", renderContent);
	return page;
}

async function send2FACode(page: HTMLDivElement): Promise<void> {
	console.log("🔧 2FA DEBUG - send2FACode function called!");

	const codeInput = page.querySelector(
		"#two-factor-token"
	) as HTMLInputElement;
	const errorDiv = page.querySelector("#twofa-error") as HTMLDivElement;
	const username = sessionStorage.getItem("pending2FAUser");

	const code = codeInput.value.trim();

	console.log(`🔍 2FA FRONTEND - Username: ${username}, Code: ${code}`);

	if (!code || code.length !== 6) {
		console.log(`❌ 2FA FRONTEND - Invalid code length: ${code.length}`);
		if (errorDiv) {
			errorDiv.textContent =
				i18n.t("auth.invalid_2fa_code") || "Invalid code";
			errorDiv.style.display = "block";
		}
		return;
	}

	if (!username) {
		console.log(`❌ 2FA FRONTEND - No username found in pending2FAUser`);
		if (errorDiv) {
			errorDiv.textContent = "Session expired, please login again";
			errorDiv.style.display = "block";
		}
		return;
	}

	try {
		console.log(`📤 2FA FRONTEND - Sending request to /api/2fa/verify`);
		const response = await fetch("/api/2fa/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, code }),
			credentials: "include",
		});

		console.log(`📥 2FA FRONTEND - Response status: ${response.status}`);
		const data = await response.json();
		console.log(`📥 2FA FRONTEND - Response data:`, data);

		if (data.success && data.token) {
			sessionStorage.setItem("authToken", data.token);
			sessionStorage.setItem("username", username || "");
			sessionStorage.removeItem("pending2FAUser");
			await authService.getCurrentUser();
			import("../router/router.js").then(({ router }) => {
				router.navigate("/home");
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
		console.error("2FA verify error:", error);
		if (errorDiv) {
			errorDiv.textContent =
				i18n.t("auth.login_error") +
				": " +
				(error || "Please try again.");
			errorDiv.style.display = "block";
		}
	}
}
