
import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { errorNotif } from "../services/errorNotification.js";

export function createSignUpPage(): HTMLElement {
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

		<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse"></div>
		<div class="absolute top-4 left-4 z-50">
			<div class="login-dropdown">
				<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/login">
					← ${i18n.t('signup.back_to_login')}
				</button>
			</div>
		</div>
		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">

			<!-- Titre principal avec effet néon -->
			<h1 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse mb-12">
				📝 ${i18n.t('signup.title')}
			</h1>

			<!-- Panneau de création de compte -->
			<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
				<form class="space-y-6">
					<div>
						<input
							type="text"
							placeholder="${i18n.t('signup.username')}"
							id="username"
							required
							class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold"
						>
					</div>
					<div>
						<input
							type="text"
							placeholder="${i18n.t('signup.email')}"
							id="email"
							required
							class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold"
						>
					</div>
					<div>
						<input
							type="password"
							placeholder="${i18n.t('signup.password')}"
							id="password"
							required
							class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold"
						>
					</div>
					<div>
						<label for="avatar" class="block text-sm font-medium text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-2">
							${i18n.t('signup.avatar_label')}
						</label>
						<input
							type="file"
							id="avatar"
							name="avatar"
							accept="image/png, image/jpeg"
							class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold text-sm"
						/>
					</div>
					<div class="flex justify-center">
						<img
							id="avatar-preview"
							width="200"
							class="border-4 border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] bg-gradient-to-br from-black via-purple-900/20 to-black rounded-lg shadow-lg"
							style="display: none;"
						/>
					</div>
					<button type="submit" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full w-full text-xl py-4">
						<span class="relative z-10">✨ ${i18n.t('signup.create_account')}</span>
					</button>
				</form>
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

		// Re-attach event listeners
		attachEventListeners();
	};

	const attachEventListeners = () => {
		const form = page.querySelector("form") as HTMLFormElement;
		const avatarInput = page.querySelector("#avatar") as HTMLInputElement;
		const avatarPreview = page.querySelector("#avatar-preview") as HTMLImageElement;

		// Form submission
		if (form) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				sendSignUpInfo(page);
			});
		}

		// Avatar preview
		if (avatarInput && avatarPreview) {
			avatarInput.addEventListener("change", (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						avatarPreview.src = e.target?.result as string;
						avatarPreview.style.display = "block";
					};
					reader.readAsDataURL(file);
				}
			});
		}
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}

export async function sendSignUpInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;
	const avatarInput = page.querySelector("#avatar") as HTMLInputElement;
	const emailInput = page.querySelector("#email") as HTMLInputElement;
	const avatar = avatarInput.files?.[0];

	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
		avatar: avatar,
		email: emailInput.value,
	};

	const user = UserInfo;
	const formData = new FormData();

	// // PRINT DEBUG SIGNUP FORM
	// console.log(`USERNAME: ${user.username}`);
	// console.log(`PASSWORD: ${user.password}`);
	// console.log(`EMAIL: ${user.email}`);
	// // END PRINT DEBUG SIGNUP FORM

	formData.append("username", user.username);
	formData.append("password", user.password);
	formData.append("email", user.email);
	if (user.avatar) formData.append("avatar", user.avatar);

	// for (const [key, value] of formData.entries()){
	// 	console.log(key, value);
	// }
	//console.log("About to send response");

    try {
        const response = await fetch("/api/signup", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;

            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }

            switch (response.status) {
                case 409:
                    if (errorData.error?.includes('Username')) {
                        errorNotif.showFieldError('username', 'username_taken');
                        errorNotif.showErrorBanner('username_taken_banner');
                    } else if (errorData.error?.includes('Email')) {
                        errorNotif.showFieldError('email', 'email_taken');
                        errorNotif.showErrorBanner('email_taken_banner');
                    }
                    break;

                case 400:
                    if (errorData.error?.includes('avatar')) {
                        errorNotif.showErrorBanner('avatar_problem', 'warning');
                    } else {
                        errorNotif.showErrorBanner('check_fields', 'warning');
                    }
                    break;

                default:
                    errorNotif.showErrorBanner('signup_error', 'error', { error: errorData.error || 'Erreur inconnue' });
            }
            return;
        }

        // Succès
        errorNotif.showSuccessMessage('signup_success');

        setTimeout(() => {
            import("../router/router.js").then(({ router }) => {
                router.navigate('/login');
            });
        }, 2000);

    } catch (error) {
        console.error("Signup error:", error);
        errorNotif.showErrorBanner('network_error');
    }
}