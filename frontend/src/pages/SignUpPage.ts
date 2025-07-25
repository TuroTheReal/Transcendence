import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { createNeonContainer } from "../styles/neonTheme.js";

export function createSignUpPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "fade-in";

	const renderContent = () => {
		const content = `
			<div class="neon-card max-w-md w-full p-8 slide-up">
				<div class="flex justify-between items-center mb-6">
					<button class="neon-btn neon-btn-secondary text-sm" data-route="/login">
						← ${i18n.t('signup.back_to_login')}
					</button>
				</div>
				<h1 class="neon-title text-center mb-8">📝 ${i18n.t('signup.title')}</h1>
				<form class="space-y-6">
					<div>
						<input 
							type="text" 
							placeholder="${i18n.t('signup.username')}" 
							id="username" 
							required 
							class="neon-input"
						>
					</div>
					<div>
						<input 
							type="password" 
							placeholder="${i18n.t('signup.password')}" 
							id="password" 
							required 
							class="neon-input"
						>
					</div>
					<div>
						<label for="avatar" class="block text-sm font-medium neon-text-muted mb-2">
							${i18n.t('signup.avatar_label')}
						</label>
						<input 
							type="file" 
							id="avatar" 
							name="avatar" 
							accept="image/png, image/jpeg" 
							class="neon-input"
						/>
					</div>
					<div class="flex justify-center">
						<img 
							id="avatar-preview" 
							width="200" 
							class="border-2 border-green-400 rounded-lg shadow-lg neon-border" 
							style="display: none;" 
						/>
					</div>
					<button type="submit" class="neon-btn neon-btn-primary w-full">
						✨ ${i18n.t('signup.create_account')}
					</button>
				</form>
			</div>
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;
		
		page.innerHTML = createNeonContainer(content);
		
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
	const avatar = avatarInput.files?.[0];

	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
		avatar: avatar,
	};

	const user = UserInfo;
	const formData = new FormData();

	// PRINT DEBUG SIGNUP FORM
	console.log(`USERNAME: ${user.username}`);
	console.log(`PASSWORD: ${user.password}`);
	// END PRINT DEBUG SIGNUP FORM

	formData.append("username", user.username);
	formData.append("password", user.password);
	if (user.avatar) formData.append("avatar", user.avatar);

	for (const [key, value] of formData.entries()){
		console.log(key, value);
	}
	console.log("About to send response");
	
	try {
		const response = await fetch("/api/signup", {
			method: "POST",                            
			body: formData,
		});
		
		console.log(formData.get("username"));
		console.log(formData.get("password"));
		console.log(response);
		
		if (response.ok){
			console.log("Signup successfull");
			// Show success message with neon styling
			alert("✅ Account created successfully! You can now log in.");
			import("../router/router.js").then(({ router }) => {
				router.navigate('/login');
			});
		} else {
			const errorText = await response.text();
			console.error("Signup error response:", errorText);
			const data = JSON.parse(errorText);
			alert("❌ " + (data.error || i18n.t('signup.signup_error')));
		}
	} catch (error) {
		console.error("Signup error:", error);
		alert("❌ " + i18n.t('signup.signup_error'));
	}
}