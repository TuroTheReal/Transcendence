import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { createTwoFactorSetup } from "../components/TwoFactorSetup.js"; //FOR 2FA
import { createLogoutSwitcher } from "../components/logoutSwitcher.js";
import { classes } from "../styles/retroStyles.js";
import { Chart, registerables } from "chart.js";

// Déplacer la fonction manage2FA ici, avant son utilisation
async function manage2FA(page: HTMLDivElement) {
	const manage2FABtn = page.querySelector("#manage-2fa") as HTMLButtonElement;
	if (manage2FABtn) {
		manage2FABtn.addEventListener("click", async () => {
			try {
				const token = sessionStorage.getItem("authToken");
				if (!token) {
					throw new Error("No auth token found");
				}

				// Get current user info to get user ID
				const userInfo = await getUserInfo();
				if (!userInfo || !userInfo.id) {
					throw new Error("Could not get user information");
				}

				// Check current 2FA status
				const response = await fetch(
					`/api/user/${userInfo.id}/2fa/status`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (response.ok) {
					const statusData = await response.json();

					if (statusData.enabled) {
						// 2FA is enabled - show disable option
						if (
							confirm(
								"Two-Factor Authentication is currently enabled. Would you like to disable it?"
							)
						) {
							// TODO: Implement disable 2FA functionality
							alert("Disable 2FA functionality coming soon!");
						}
					} else {
						// 2FA is disabled - show setup option
						if (
							confirm(
								"Would you like to enable Two-Factor Authentication?"
							)
						) {
							// Redirect to 2FA setup page or show setup modal
							window.open(
								`/api/2fa/setup-totp-temp/${userInfo.username}`,
								"_blank"
							);
						}
					}
				} else {
					console.error("Failed to get 2FA status");
					alert("Unable to check 2FA status. Please try again.");
				}
			} catch (error) {
				console.error("Error managing 2FA:", error);
				alert(
					"Error managing Two-Factor Authentication. Please try again."
				);
			}
		});
	}
}

export function createProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const render = () => {
		page.innerHTML = `
			<style>
				/* Import de la police Orbitron pour le thème rétro */
				@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

				* {
					font-family: 'Orbitron', monospace;
				}
			</style>

			<!-- Conteneur principal avec effet scan -->
			<div class="min-h-screen flex items-center justify-center p-4 ${classes.scanLinesContainer}">

				<!-- Conteneur principal avec disposition côte à côte - centré -->
				<div class="${classes.retroPanel} rounded-2xl p-8 flex gap-10 items-start" style="height: 90vh; max-width: 2000px; width: 95%;">

					<!-- Colonne de gauche : Profile + Friends -->
					<div class="flex flex-col gap-6 h-full" style="width: 1000px;">

						<!-- Bloc Profile Principal -->
						<div class="${classes.retroPanel} rounded-2xl p-6 w-full flex flex-col items-center flex-shrink-0">
							<header class="w-full mb-6">
								<button class="${classes.backButton}" data-route="/game">
									${i18n.t('profile.back')}
								</button>
								<h2 class="${classes.sectionTitle} mt-4">
									${i18n.t('profile.my_profile')}
								</h2>
							</header>

							<main class="w-full flex flex-col items-center">
								<div class="flex items-center gap-8 mb-8">
									<!-- Avatar avec bordure néon -->
									<div class="relative w-32 h-32 rounded-full ${classes.neonBorder} overflow-hidden">
										<img src="/default-avatar.png" id="user-avatar" class="w-full h-full object-cover">
										<button id="edit-avatar" title="${i18n.t('profile.edit_avatar')}"
											class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
											bg-purple-400 bg-opacity-20 hover:bg-opacity-40 text-purple-400 rounded-full p-2
											transition-all duration-300 border border-purple-400 border-opacity-50">
											<img src="../assets/edit.svg" alt="Edit" class="w-5 h-5">
										</button>
										<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" class="hidden" />
									</div>

									<!-- Informations utilisateur -->
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-3">
											<h3 id="username" class="text-2xl font-bold ${classes.neonText}">Username</h3>
											<button id="edit-username" title="${i18n.t('profile.edit_username')}"
												class="bg-purple-400 bg-opacity-20 hover:bg-opacity-40 text-purple-400 font-bold
												py-1 px-2 rounded-lg border border-purple-400 border-opacity-50 transition-all duration-300
												transform hover:scale-105">
												<img src="../assets/edit.svg" alt="Edit" class="w-4 h-4">
											</button>
										</div>

										<div class="flex items-center gap-3 mb-3">
											<span id="password" class="text-gray-300">${i18n.t('profile.password_display')}</span>
											<button id="edit-password" title="${i18n.t('profile.edit_password')}"
												class="bg-purple-400 bg-opacity-20 hover:bg-opacity-40 text-purple-400 font-bold
												py-1 px-2 rounded-lg border border-purple-400 border-opacity-50 transition-all duration-300
												transform hover:scale-105">
												<img src="../assets/edit.svg" alt="Edit" class="w-4 h-4">
											</button>
										</div>

										<!-- Stats avec panneau rétro -->
										<div class="${classes.retroPanel} rounded-xl p-4">
											<p id="user-stats" class="text-purple-300 text-sm font-bold">
												${i18n.t('profile.games_played_stats', {games: '0', wins: '0', losses: '0'})}
											</p>
										</div>
										<!-- Security Section -->
										<div class="w-full mb-4">
											<div class="space-y-2">
												<button id="manage-2fa" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm">
													🔐 ${i18n.t("profile.manage_2fa") || "Manage Two-Factor Authentication"}
												</button>
											</div>
										</div>
									</div>
								</div>
							</main>
						</div>

						<!-- Bloc Friends List -->
						<div id="friends-block" class="${classes.retroPanel} rounded-2xl p-6 w-full flex flex-col flex-1 min-h-0">
							<header class="w-full flex-shrink-0 mb-4 flex items-center justify-between">
								<h2 class="text-2xl font-bold text-green-400 drop-shadow-sm animate-pulse">
									${i18n.t('profile.friends_list')}
								</h2>
							</header>

							<main class="w-full flex-1 overflow-hidden min-h-0">
							</main>
						</div>
					</div>

					<!-- Colonne de droite : Match History + Dashboard -->
					<div class="flex flex-col gap-6 h-full" style="width: 1000px;">

						<!-- Match History -->
						<div id="match-block" class="${classes.retroPanel} rounded-2xl p-6 w-full flex flex-col min-h-0" style="height: 50%;">
							<header class="w-full mb-4 flex-shrink-0">
								<h2 class="text-2xl font-bold text-purple-400 ${classes.neonText}">
									${i18n.t('profile.match_history')}
								</h2>
							</header>
							<main class="w-full flex-1 overflow-hidden min-h-0">
							</main>
						</div>

						<!-- Dashboard -->
						<div id="dashboard" class="${classes.retroPanel} rounded-2xl p-6 w-full flex flex-col min-h-0" style="height: 50%;">
							<header class="w-full mb-4 flex-shrink-0">
								<h2 class="text-2xl font-bold text-purple-400 ${classes.neonText}">
									${i18n.t('profile.dashboard')}
								</h2>
							</header>
							<main class="w-full flex-1 overflow-hidden min-h-0">
							</main>
						</div>
					</div>
				</div>
			</div>

			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="absolute top-4 left-4" id="logout-container"></div>

		`;

		const languageSwitcherContainer = page.querySelector(
			"#language-switcher-container"
		);
		if (languageSwitcherContainer) {
			languageSwitcherContainer.innerHTML = "";
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		const logoutContainer = page.querySelector("#logout-container");
		if (logoutContainer) {
			logoutContainer.innerHTML = "";
			logoutContainer.appendChild(createLogoutSwitcher());
		}

		editAvatar(page);
		editUsername(page);
		editPassword(page);
		manage2FA(page); // <-- ADD to enable the 2FA button

		getUserInfo().then((data) => {
			if (data) {
				console.log("🔍 User data received:", data);
				const usernameElem = page.querySelector(
					"#username"
				) as HTMLElement;
				if (usernameElem) usernameElem.textContent = data.username;
				const avatarElem = page.querySelector(
					"#user-avatar"
				) as HTMLImageElement;
				if (avatarElem && data.avatarUrl) {
					console.log("🖼️ Setting avatar URL:", data.avatarUrl);

					const isDevMode = window.location.port === "5173"; // Vite dev server
					const serverUrl = isDevMode
						? `https://${window.location.hostname}:3443`
						: window.location.origin;

					const fullAvatarUrl = data.avatarUrl.startsWith("http")
						? data.avatarUrl // External URL, use as-is
						: `${serverUrl}${data.avatarUrl}`; // Local URL, add server prefix

					const avatarUrl = fullAvatarUrl.includes("?")
						? `${fullAvatarUrl}&cb=${Date.now()}`
						: `${fullAvatarUrl}?cb=${Date.now()}`;

					console.log("🌐 Full avatar URL:", avatarUrl);

					// Try to load image normally first
					const testImage = new Image();

					testImage.onload = function () {
						console.log("✅ Normal image loaded successfully!");
						avatarElem.src = avatarUrl;
					};

					testImage.onerror = async function (e) {
						console.error(
							"❌ Normal image failed, trying base64 fallback..."
						);

						try {
							// Fetch as base64 from our API
							const response = await fetch(avatarUrl, {
								headers: {
									Accept: "application/json",
								},
							});

							if (response.ok) {
								const data = await response.json();
								if (
									data.data &&
									data.data.startsWith("data:image")
								) {
									console.log(
										"✅ Base64 fallback successful!"
									);
									avatarElem.src = data.data;
								} else {
									throw new Error("Invalid base64 response");
								}
							} else {
								throw new Error("Base64 fetch failed");
							}
						} catch (error) {
							console.error(
								"❌ Base64 fallback also failed:",
								error
							);
							avatarElem.src = "/default-avatar.png";
						}
					};

					testImage.src = avatarUrl;
					console.log("🔄 Testing normal image load first");
				}

				const statElem = page.querySelector(
					"#user-stats"
				) as HTMLElement;
				if (
					statElem &&
					data.gamesPlayed != null &&
					data.wins != null &&
					data.losses != null
				) {
					statElem.textContent = i18n.t(
						"profile.games_played_stats",
						{
							games: data.gamesPlayed.toString(),
							wins: data.wins.toString(),
							losses: data.losses.toString(),
						}
					);
				}
			}
		});

		displayMatchHistory(page);
		displayFriendsList(page);
		startFriendsStatusUpdater(page);
		displayDashboard(page);
	};

	render();

	function handleLanguageChange() {
		window.removeEventListener("languageChanged", handleLanguageChange);
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "";
			app.appendChild(createProfilePage());
		}
	}

	window.addEventListener("languageChanged", handleLanguageChange);

	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		if (
			target.hasAttribute("data-route") ||
			target.closest("[data-route]")
		) {
			const routeElement = target.hasAttribute("data-route")
				? target
				: target.closest("[data-route]");
			const route = routeElement?.getAttribute("data-route");
			if (route) {
				window.removeEventListener(
					"languageChanged",
					handleLanguageChange
				);
				import("../router/router.js").then(({ router }) => {
					router.navigate(route);
				});
			}
		}
	});

	return page;
}

async function getUserInfo() {
	try {
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			throw new Error("No auth token found");
		}

		const response = await fetch("/api/me", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			const userData = await response.json();
			console.log("User data retrieved:", userData);
			return userData;
		} else {
			console.error("Failed to get user info");
			import("../router/router.js").then(({ router }) => {
				router.navigate("/login");
			});
			return null;
		}
	} catch (error) {
		console.error("Error fetching user info:", error);
		return null;
	}
}

//ADD EDIT USERNAME FUNCTION
async function editUsername(page: HTMLDivElement) {
	const token = sessionStorage.getItem("authToken");
	if (!token) {
		throw new Error("No auth token found");
	}
	const usernameElem = page.querySelector("#username") as HTMLElement;
	const editUsernameBtn = page.querySelector(
		"#edit-username"
	) as HTMLButtonElement;

	if (usernameElem && editUsernameBtn) {
		editUsernameBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: usernameElem,
				initialValue: usernameElem.textContent || "",
				inputType: "string",
				onValidate: async (newValue) => {
					const UserInfo = {
						username: usernameElem.textContent,
						newUsername: newValue,
					};
					const response = await fetch("/api/profile/username", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success) {
						if (data.token) {
							sessionStorage.setItem("authToken", data.token);
						}
						sessionStorage.removeItem("username");
						sessionStorage.setItem("username", newValue);
						usernameElem.textContent = newValue;
					} else {
						alert(i18n.t("profile.username_error"));
					}
				},
				page,
			});
		});
	}
}

async function editPassword(page: HTMLDivElement) {
	const token = sessionStorage.getItem("authToken");
	if (!token) {
		throw new Error("No auth token found");
	}
	const passwordElem = page.querySelector("#password") as HTMLElement;
	const editPasswordBtn = page.querySelector(
		"#edit-password"
	) as HTMLButtonElement;
	if (passwordElem && editPasswordBtn) {
		editPasswordBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: passwordElem,
				initialValue: "",
				inputType: "password",
				onValidate: async (newValue) => {
					const UserInfo = {
						username: sessionStorage.getItem("username"),
						newPassword: newValue,
					};
					const response = await fetch("/api/profile/password", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success) {
						console.log("Password succesfully edited!");
					} else {
						alert(i18n.t("profile.password_error"));
					}
					passwordElem.textContent = i18n.t(
						"profile.password_display"
					);
				},
				page,
			});
		});
	}
}

function enableInlineEdit({
	element,
	initialValue,
	onValidate,
	inputType = "text",
	page,
}: {
	element: HTMLElement;
	initialValue: string;
	onValidate: (newValue: string) => Promise<void> | void;
	inputType?: string;
	page: HTMLDivElement;
}) {
	const input = document.createElement("input");
	input.type = inputType;
	input.value = initialValue;
	input.className = "bg-gray-700 text-white border border-purple-400 rounded px-2 py-1 text-sm mr-2 w-auto inline-block focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200";

	const validateBtn = document.createElement("button");
	validateBtn.textContent = i18n.t("profile.validate");
	validateBtn.className = "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 mr-2";
	validateBtn.type = "button";

	const cancelBtn = document.createElement("button");
	cancelBtn.textContent = i18n.t("profile.cancel");
	cancelBtn.className = "bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200";
	cancelBtn.type = "button";

	const parent = element.parentElement;
	const oldContent = element.cloneNode(true);

	parent?.replaceChild(input, element);
	parent?.appendChild(validateBtn);
	parent?.appendChild(cancelBtn);

	const cleanup = () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "";
			app.appendChild(createProfilePage());
		}
	};

	validateBtn.onclick = async () => {
		await onValidate(input.value);
		cleanup();
	};
	cancelBtn.onclick = cleanup;

	input.focus();
	input.onkeydown = (e) => {
		if (e.key === "Escape") cleanup();
		if (e.key === "Enter") validateBtn.click();
	};
}

//CHANGE AVATAR FUNCTION
async function editAvatar(page: HTMLDivElement) {
	const editAvatarBtn = page.querySelector(
		"#edit-avatar"
	) as HTMLButtonElement;
	const fileInput = page.querySelector(
		"#avatar-file-input"
	) as HTMLInputElement;
	const avatarImg = page.querySelector("#user-avatar") as HTMLImageElement;

	if (editAvatarBtn && fileInput && avatarImg) {
		editAvatarBtn.addEventListener("click", (e) => {
			//e.preventDefault();
			fileInput.click();
		});
		fileInput.addEventListener("change", (e) => {
			const file = fileInput.files?.[0];
			console.log("file: ", file);
			if (file) {
				const reader = new FileReader();
				reader.onload = async function (evt) {
					if (evt.target && typeof evt.target.result === "string") {
						const avatarUrl = await updateDbAvatar(file);
						console.log("avatarUrl: ", avatarUrl);
						if (avatarUrl) avatarImg.src = avatarUrl;
					}
				};
				reader.readAsDataURL(file);
			}
		});
	}
}

async function updateDbAvatar(file: File) {
	const token = sessionStorage.getItem("authToken");
	if (!token) {
		throw new Error("No auth token found");
	}
	const formData = new FormData();
	const username = sessionStorage.getItem("username");
	formData.append("avatar", file);
	formData.append("username", username || "");

	const response = await fetch("/api/profile/avatar", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});
	if (response.ok) {
		const data = await response.json();
		console.log("Avatar updated!", data);
		if (data.avatarPath && typeof data.avatarPath === "string") {
			const timestampedUrl = `${data.avatarPath}?cb=${Date.now()}`;
			console.log("URL with cache busting:", timestampedUrl);
			return timestampedUrl;
		} else {
			console.error("Failed to update avatar");
			return null;
		}
	}
	console.error("Failed to update avatar - server error");
	return null;
}

async function getMatchHistory() {
	try {
		const user = await getUserInfo();
		if (!user) return null;

		const token = sessionStorage.getItem("authToken");
		if (!token) {
			throw new Error("No auth token found");
		}

		const response = await fetch(
			`/api/profile/matches?username=${encodeURIComponent(user.username)}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (response.ok) {
			const matches = await response.json();
			console.log("Match history retrieved!", matches);
			return matches;
		} else {
			console.error("Failed to retrieve match history");
			return null;
		}
	} catch (error) {
		console.error("Error fetching match history:", error);
		return null;
	}
}

async function displayMatchHistory(page: HTMLDivElement) {
	const username = sessionStorage.getItem("username");
	const history = await getMatchHistory();
	if (!history) return;

	const histDiv = page.querySelector("#match-block main");
	if (!histDiv) return;

	let html = `
		<div class="h-full flex flex-col">
			<div class="flex-1 overflow-y-auto min-h-0">
				<table class="w-full border-collapse">
					<thead class="sticky top-0 bg-gray-800 z-10">
						<tr class="border-b border-gray-600">
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.date")}</th>
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.opponent")}</th>
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.result")}</th>
						</tr>
					</thead>
					<tbody>
	`;

	for (let i = 0; i < history.length; i++) {
		const match = history[i];
		const isPlayer1 = match.player1.username === username;
		let opponent;
		if (match.player2) {
			opponent = match.player2.username;
		} else if (match.iaMode) {
			opponent = "IA";
		} else {
			opponent = "Local";
		}

		const minutes = Math.floor(match.lasted / 60);
		const seconds = match.lasted % 60;
		const gameTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

		// Déterminer les scores selon la position du joueur
		const playerScore = isPlayer1 ? match.score1 : match.score2;
		const opponentScore = isPlayer1 ? match.score2 : match.score1;

		const result = match.winnerId === (isPlayer1 ? match.player1Id : match.player2Id) ? i18n.t('profile.victory') : i18n.t('profile.defeat');
		const date = new Date(match.playedAt).toLocaleDateString();
		const statusClass =
			result === i18n.t("profile.victory")
				? "status-victory"
				: "status-defeat";

		html += `
			<tr class="match-row">
				<td>${date}</td>
				<td>${opponent}</td>
				<td><span class="${statusClass}">${result}</span></td>
				<td>
					<button
						class="expand-btn bg-purple-400 bg-opacity-20 hover:bg-opacity-40 text-purple-400
						       rounded px-2 py-1 text-xs border border-purple-400 border-opacity-50
						       transition-all duration-300 transform hover:scale-105"
						data-match-index="${i}"
						onclick="toggleMatchDetails(${i})"
					>
						<svg class="w-4 h-4 transform transition-transform duration-200"
						     id="arrow-${i}" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd"
							      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							      clip-rule="evenodd"/>
						</svg>
					</button>
				</td>
			</tr>
			<tr class="match-details-row hidden" id="details-${i}">
				<td colspan="4">
					<div class="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-purple-400 border-opacity-30">
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

							<!-- Temps de jeu -->
							<div class="flex flex-col items-center p-3 bg-purple-400 bg-opacity-10 rounded-lg border border-purple-400 border-opacity-20">
								<div class="text-purple-300 font-semibold mb-1">
									${i18n.t("profile.game_duration") || "Game Duration"}
								</div>
								<div class="text-white text-lg font-bold">${gameTime}</div>
							</div>

							<!-- Score du joueur -->
							<div class="flex flex-col items-center p-3 bg-green-400 bg-opacity-10 rounded-lg border border-green-400 border-opacity-20">
								<div class="text-green-300 font-semibold mb-1">
									${i18n.t("profile.your_score") || "Your Score"}
								</div>
								<div class="text-white text-lg font-bold">${playerScore}</div>
							</div>

							<!-- Score de l'adversaire -->
							<div class="flex flex-col items-center p-3 bg-red-400 bg-opacity-10 rounded-lg border border-red-400 border-opacity-20">
								<div class="text-red-300 font-semibold mb-1">
									${i18n.t("profile.opponent_score") || "Opponent Score"}
								</div>
								<div class="text-white text-lg font-bold">${opponentScore}</div>
							</div>

							<!-- Points section haute vs basse -->
							<div class="flex flex-col items-center p-3 bg-blue-400 bg-opacity-10 rounded-lg border border-blue-400 border-opacity-20">
								<div class="text-blue-300 font-semibold mb-1">
									${i18n.t("profile.section_points") || "Section Points"}
								</div>
								<div class="text-white text-sm">
									<div class="flex justify-between items-center mb-1">
										<span class="text-red-300">${i18n.t("profile.top_points") || "Top"}:</span>
										<span class="font-bold">${match.pointsUp}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-green-300">${i18n.t("profile.bottom_points") || "Bottom"}:</span>
										<span class="font-bold">${match.pointsDown}</span>
									</div>
								</div>
							</div>

						</div>

						<!-- Mode de jeu -->
						<div class="mt-3 pt-3 border-t border-purple-400 border-opacity-20">
							<div class="flex items-center justify-center">
								<span class="text-purple-300 text-xs font-semibold mr-2">
									${i18n.t("profile.game_mode") || "Game Mode"}:
								</span>
								<span class="px-2 py-1 rounded-full text-xs font-bold
									${match.iaMode ? 'bg-red-400 bg-opacity-20 text-red-300 border border-red-400 border-opacity-50' : ''}
									${match.tournamentMode ? 'bg-yellow-400 bg-opacity-20 text-yellow-300 border border-yellow-400 border-opacity-50' : ''}
									${match.multiMode ? 'bg-green-400 bg-opacity-20 text-green-300 border border-green-400 border-opacity-50' : ''}
									${!match.iaMode && !match.tournamentMode && !match.multiMode ? 'bg-gray-400 bg-opacity-20 text-gray-300 border border-gray-400 border-opacity-50' : ''}
								">
									${match.iaMode ? (i18n.t("profile.ia_mode") || "IA Mode") : ''}
									${match.tournamentMode ? (i18n.t("profile.tournament_mode") || "Tournament") : ''}
									${match.multiMode ? (i18n.t("profile.multiplayer_mode") || "Multiplayer") : ''}
									${!match.iaMode && !match.tournamentMode && !match.multiMode ? (i18n.t("profile.local_mode") || "Local") : ''}
								</span>
							</div>
						</div>
					</div>
				</td>
			</tr>
		`;
	}
	html += `
					</tbody>
				</table>
			</div>
		</div>
	`;
	histDiv.innerHTML = html;

	(window as any).toggleMatchDetails = function(index: number) {
	const detailsRow = document.getElementById(`details-${index}`);
	const arrow = document.getElementById(`arrow-${index}`);

		if (detailsRow && arrow) {
			if (detailsRow.classList.contains('hidden')) {
				detailsRow.classList.remove('hidden');
				arrow.classList.add('rotate-180');
			} else {
				detailsRow.classList.add('hidden');
				arrow.classList.remove('rotate-180');
			}
		}
	}
}

async function getFriendsList() {
	try {
		const user = await getUserInfo();
		if (!user) return null;

		const token = sessionStorage.getItem("authToken");
		if (!token) {
			throw new Error("No auth token found");
		}

		const response = await fetch(
			`/api/profile/friends?username=${encodeURIComponent(user.username)}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (response.ok) {
			const friends = await response.json();
			console.log("Friends list retrieved!", friends);
			return friends;
		} else {
			console.error("Failed to retrieve friends list");
			return null;
		}
	} catch (error) {
		console.error("Error fetching friends list:", error);
		return null;
	}
}

async function displayFriendsList(page: HTMLDivElement) {
	const username = sessionStorage.getItem("username");
	const friendsList = await getFriendsList();
	if (!friendsList) return;

	const friendsMain = page.querySelector("#friends-block main");
	if (!friendsMain) return;

	function fixAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return "/default-avatar.png";

		if (avatarUrl.startsWith("http")) {
			return avatarUrl;
		}

		// Déterminer l'URL du serveur correct
		const isDevMode = window.location.port === "5173";
		const serverUrl = isDevMode
			? `https://${window.location.hostname}:3445`
			: window.location.origin;

		// Construire l'URL complète
		return `${serverUrl}${avatarUrl}`;
	}

	let html = `
		<div class="h-full flex flex-col">
			<div class="flex-1 overflow-y-auto min-h-0">
				<table class="w-full border-collapse">
					<thead class="sticky top-0 bg-gray-800 z-10">
						<tr class="border-b border-gray-600">
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.status")}</th>
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.avatar")}</th>
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.name")}</th>
							<th class="p-2 text-left text-sm font-semibold text-gray-300">${i18n.t("profile.Games_played")}</th>
						</tr>
					</thead>
				<tbody>
	`;

	for (const friend of friendsList) {
		const status = await isUserOnline(friend.username);
		const avatar = fixAvatarUrl(friend.avatarUrl);
		const name = friend.username;
		const played = friend.gamesPlayed;

		const statusColor = status ? "bg-green-500" : "bg-gray-500";

		html += `
			<tr class="border-b border-gray-700 hover:bg-gray-800 transition-colors">
				<td class="p-2">
					<div class="w-3 h-3 rounded-full ${statusColor}"></div>
				</td>
				<td class="p-2">
					<div class="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
						<img src="${avatar || "/default-avatar.png"}" alt="avatar" class="w-full h-full object-cover">
					</div>
				</td>
				<td class="p-2 text-gray-200 text-sm">${name}</td>
				<td class="p-2 text-gray-300 text-sm">${played}</td>
			</tr>
		`;
	}
	html += `
					</tbody>
				</table>
			</div>
		</div>
	`;
	friendsMain.innerHTML = html;
	setupAddFriendFeature(page);
}

function startFriendsStatusUpdater(page: HTMLDivElement) {
	const interval = setInterval(async () => {
		try {
			await displayFriendsList(page);
		} catch (error) {
			console.error('Error updating friends status:', error);
		}
	}, 10000);

	const cleanup = () => {
		clearInterval(interval);
		window.removeEventListener('beforeunload', cleanup);
		window.removeEventListener('popstate', cleanup);
	};

	window.addEventListener('beforeunload', cleanup);
	window.addEventListener('popstate', cleanup);
	return cleanup;
}

async function isUserOnline(username: string): Promise<boolean> {
  try {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    const response = await fetch(`/api/profile/user/${encodeURIComponent(username)}/online`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.isOnline;
    }
    return false;
  } catch (error) {
    console.error('Error checking user online status:', error);
    return false;
  }
}

function setupAddFriendFeature(page: HTMLDivElement) {
	const friendsBlock = page.querySelector("#friends-block");
	if (!friendsBlock) return;

	const header = friendsBlock.querySelector("header");
	if (!header) return;
	let addBtn = header.querySelector("#add-friend-btn") as HTMLButtonElement;
	if (!addBtn) {
		addBtn = document.createElement("button");
		addBtn.id = "add-friend-btn";
		addBtn.title = "Add friend";
		addBtn.className =
			"bg-green-400 hover:bg-green-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all duration-200 ml-2";
		addBtn.textContent = "+";
		header.appendChild(addBtn);
	}

	let formContainer = friendsBlock.querySelector(
		"#add-friend-form-container"
	) as HTMLDivElement;
	if (!formContainer) {
		formContainer = document.createElement("div");
		formContainer.id = "add-friend-form-container";
		formContainer.className = "mt-2";
		header.insertAdjacentElement("afterend", formContainer);
	}

	addBtn.onclick = () => {
		formContainer.innerHTML = `
			<form id="add-friend-form" class="flex gap-2 mt-2">
				<input type="text" id="friend-username" placeholder="Username..." class="input bg-gray-700 text-white border border-green-400 rounded px-2 py-1" required>
				<button type="button" id="cancel-add-friend" class="bg-gray-400 hover:bg-gray-500 text-white rounded px-3 py-1 font-bold">Cancel</button>
				<button type="submit" class="bg-green-400 hover:bg-green-500 text-white rounded px-3 py-1 font-bold">Add</button>
				<span id="add-friend-error" class="text-red-400 ml-2"></span>
			</form>
		`;

		const cancelBtn = formContainer.querySelector(
			"#cancel-add-friend"
		) as HTMLButtonElement;
		cancelBtn?.addEventListener("click", () => {
			formContainer.innerHTML = "";
		});
		const form = formContainer.querySelector(
			"#add-friend-form"
		) as HTMLFormElement;
		form?.addEventListener("submit", async (e) => {
			e.preventDefault();
			const usernameInput = formContainer.querySelector(
				"#friend-username"
			) as HTMLInputElement;
			const username = usernameInput.value.trim();
			const errorSpan = formContainer.querySelector(
				"#add-friend-error"
			) as HTMLSpanElement;
			errorSpan.textContent = "";
			if (!username) return;

			const token = sessionStorage.getItem("authToken");
			try {
				const response = await fetch("/api/profile/friends/add", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ friendUsername: username }),
				});
				const data = await response.json();
				if (response.ok && data.success) {
					displayFriendsList(page);
					formContainer.innerHTML = "";
				} else {
					errorSpan.textContent = data.error || "user not found";
				}
			} catch (err) {
				errorSpan.textContent = "Erreur réseau";
			}
		});
	};
}


async function getDashboardStats(page: HTMLDivElement) {
	try{
		const user = await getUserInfo();
		if (!user) return null;
		const token = sessionStorage.getItem('authToken');
		const response = await fetch(`/api/game/stats?username=${encodeURIComponent(user.username)}`, {
			method: "GET",
			headers:{
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
		});
		if (response.ok) {
			const stats = await response.json();
			console.log('Game stats retrieved!', stats);
			if (stats.success && stats.iaStats && stats.tournamentStats && stats.multiStats) {
				return stats;
			} else {
				console.error('Invalid stats structure:', stats);
				return null;
			}
		} else {
			console.error('Failed to retrieve game stats');
			return null;
		}
	} catch (error) {
		console.error('Error fetching game stats:', error);
		return null;
	}
}

async function displayDashboard(page: HTMLDivElement)
{
	try{
		Chart.register(...registerables);
		const stats = await getDashboardStats(page);
		console.log("STATS: ", stats);
		const statDiv = page.querySelector("#dashboard main");
		if (!statDiv){
			console.error('Dashboard container not found');
			return;
		}

		statDiv.innerHTML = `
			<div class="h-full flex flex-col gap-4">
				<!-- Section du temps et points -->
				<div class="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
					<div class="flex-1 min-h-0">
						<h3 class="text-purple-400 text-sm font-semibold mb-2 text-center">
							${i18n.t('profile.total_game_time')}
						</h3>
						<div id="gameTime" class="h-full overflow-y-auto"></div>
					</div>

					<div class="flex-1 min-h-0">
						<h3 class="text-purple-400 text-sm font-semibold mb-2 text-center">
							${i18n.t('profile.side_point')}
						</h3>
						<div id="gameSide" class="h-full overflow-y-auto"></div>
					</div>
				</div>

				<!-- Section des graphiques -->
				<div class="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
					<div class="flex-1 min-h-0 flex flex-col">
						<h3 class="text-purple-400 text-sm font-semibold mb-2 text-center">
							${i18n.t('profile.game_types_distribution')}
						</h3>
						<div class="flex-1 flex items-center justify-center min-h-0">
							<canvas id="gameTypesChart" class="max-w-full max-h-full"></canvas>
						</div>
					</div>

					<div class="flex-1 min-h-0 flex flex-col">
						<h3 class="text-purple-400 text-sm font-semibold mb-2 text-center">
							${i18n.t('profile.winrate_by_type')}
						</h3>
						<div class="flex-1 flex items-center justify-center min-h-0">
							<canvas id="performanceChart" class="max-w-full max-h-full"></canvas>
						</div>
					</div>
				</div>
			</div>
		`;

		await createGameTypesChart(stats);
		await createPerformanceChart(stats);
		await displayGameTime(stats);
		await displaySidePoint(stats);

	} catch (error){
		console.error('Error with dashboard display:', error);
		const dashboardMain = page.querySelector("#dashboard main");
		if (dashboardMain) {
			dashboardMain.innerHTML = `
				<div style="text-align: center; color: #ef4444; padding: 20px;">
					<p>${i18n.t("profile.errorUser")}</p>
					<button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 4px; cursor: pointer;">
						Reload
					</button>
				</div>
			`;
		}
	}
}

async function displaySidePoint(stats: any)
{
	const container = document.getElementById('gameSide') as HTMLDivElement;
	if (!container) return;

	const topPoints = (stats.iaStats?.pointsUp + stats.tournamentStats?.pointsUp + stats.multiStats?.pointsUp) || 0;
	const bottomPoints = (stats.iaStats?.pointsDown + stats.tournamentStats?.pointsDown + stats.multiStats?.pointsDown) || 0;

	const totalPoints = topPoints + bottomPoints;

	if (totalPoints === 0) {
		container.innerHTML = `
			<div style="text-align: center; color: #9ca3af; padding: 40px;">
				<p>${i18n.t("profile.errorGame")}</p>
			</div>
		`;
		return;
	} else {
		container.innerHTML = `
			<div class="h-full flex flex-col items-center justify-center p-4">
				<div class="flex flex-col items-center space-y-4">
					<div class="flex items-center space-x-3">
						<div class="w-5 h-16 bg-red-400 rounded"></div>
						<div class="text-xs text-gray-200">
							${i18n.t('profile.top_points')}: ${topPoints}
						</div>
					</div>

					<div class="w-24 h-0.5 bg-purple-400"></div>

					<div class="flex items-center space-x-3">
						<div class="w-5 h-16 bg-green-400 rounded"></div>
						<div class="text-xs text-gray-200">
							${i18n.t('profile.bottom_points')}: ${bottomPoints}
						</div>
					</div>
				</div>
			</div>
		`;
	}
}

async function 	displayGameTime(stats: any)
{
	const container = document.getElementById('gameTime') as HTMLDivElement;
	if (!container) return;

	const iaTime = (stats.iaStats?.lasted || 0);
	const tournamentTime = (stats.tournamentStats?.lasted || 0);
	const multiTime = (stats.multiStats?.lasted || 0);

	const totalTime = iaTime + tournamentTime + multiTime;

	if (totalTime === 0) {
		container.innerHTML = `
			<div style="text-align: center; color: #9ca3af; padding: 40px;">
				<p>${i18n.t("profile.errorGame")}</p>
			</div>
		`;
		return;
	} else {
		const toMinutes = (s: number) => Math.floor(s / 60);
		const totalMin = toMinutes(totalTime);
		const iaMin = toMinutes(iaTime);
		const tournamentMin = toMinutes(tournamentTime);
		const multiMin = toMinutes(multiTime);

		const iaPercent = totalMin ? (iaMin / totalMin) * 100 : 0;
		const tournamentPercent = totalMin ? (tournamentMin / totalMin) * 100 : 0;
		const multiPercent = totalMin ? (multiMin / totalMin) * 100 : 0;

		container.innerHTML = `
			<div class="h-full flex flex-col items-center justify-center p-2">
				<div class="text-2xl text-purple-400 font-bold mb-4">
					${totalMin} min
				</div>

				<div class="w-full max-w-xs space-y-3">
					<div>
						<div class="text-xs text-red-400 mb-1">
							${i18n.t('profile.ia_games')}: ${iaMin} min
						</div>
						<div class="h-2 bg-red-400 rounded" style="width: ${iaPercent}%"></div>
					</div>

					<div>
						<div class="text-xs text-yellow-400 mb-1">
							${i18n.t('profile.tournament_games')}: ${tournamentMin} min
						</div>
						<div class="h-2 bg-yellow-400 rounded" style="width: ${tournamentPercent}%"></div>
					</div>

					<div>
						<div class="text-xs text-green-400 mb-1">
							${i18n.t('profile.multiplayer_games')}: ${multiMin} min
						</div>
						<div class="h-2 bg-green-400 rounded" style="width: ${multiPercent}%"></div>
					</div>
				</div>
			</div>
		`;
	}
}

async function createGameTypesChart(stats: any) {
	const ctx = document.getElementById('gameTypesChart') as HTMLCanvasElement;
	if (!ctx) return;

	const iaGames = (stats.iaStats?.winner || 0) + (stats.iaStats?.loser || 0);
	const tournamentGames = (stats.tournamentStats?.winner || 0) + (stats.tournamentStats?.loser || 0);
	const multiGames = (stats.multiStats?.winner || 0) + (stats.multiStats?.loser || 0);

	const totalGames = iaGames + tournamentGames + multiGames;

	if (totalGames === 0) {
		ctx.style.display = 'none';
		const container = ctx.parentElement;
		if (container) {
			container.innerHTML = `
				<div style="text-align: center; color: #9ca3af; padding: 40px;">
					<p>${i18n.t("profile.errorGame")}</p>
				</div>
			`;
		}
		return;
	} else {
		new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: [
					i18n.t('profile.ia_games'),
					i18n.t('profile.tournament_games'),
					i18n.t('profile.multiplayer_games')
				],
				datasets: [{
					data: [iaGames, tournamentGames, multiGames],
					backgroundColor: ['#ef4444', '#f59e0b','#10b981'],
					borderColor: ['#dc2626', '#d97706', '#059669'],
					borderWidth: 2,
					hoverOffset: 10
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: '#e5e7eb',
							font: {
								family: 'Orbitron',
								size: 11
							},
							padding: 15,
							usePointStyle: true
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#e5e7eb',
						bodyColor: '#e5e7eb',
						borderColor: '#a855f7',
						borderWidth: 1,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: function(context: any) {
								const percentage = ((context.parsed / totalGames) * 100).toFixed(1);
								return `${context.label}: ${context.parsed} parties (${percentage}%)`;
							}
						}
					}
				},
				elements: {
					arc: {
						borderWidth: 2
					}
				}
			}
		});
	}
}

async function createPerformanceChart(stats: any) {
	const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
	if (!ctx) return;

	const calculateWinRate = (winner: number, loser: number) => {
		const total = winner + loser;
		return total > 0 ? (winner / total) * 100 : 0;
	};

	const iaWinRate = calculateWinRate(stats.iaStats?.winner || 0, stats.iaStats?.loser || 0);
	const tournamentWinRate = calculateWinRate(stats.tournamentStats?.winner || 0, stats.tournamentStats?.loser || 0);
	const multiWinRate = calculateWinRate(stats.multiStats?.winner || 0, stats.multiStats?.loser || 0);

	new Chart(ctx, {
		type: 'bar',
		data: {
			labels: [
				i18n.t('profile.ia_games'),
				i18n.t('profile.tournament_games'),
				i18n.t('profile.multiplayer_games')
			],
			datasets: [{
				label: i18n.t('profile.victory_rate'),
				data: [iaWinRate, tournamentWinRate, multiWinRate],
				backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)'],
				borderColor: ['#ef4444', '#f59e0b', '#10b981'],
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					max: 100
				}
			}
		}
	});
}
