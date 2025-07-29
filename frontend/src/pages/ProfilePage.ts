import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { createTwoFactorSetup } from "../components/TwoFactorSetup.js"; //FOR 2FA
import { createLogoutSwitcher } from "../components/logoutSwitcher.js";
import { createNeonContainer } from "../styles/neonTheme.js";

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
	page.className =
		"min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const render = () => {
		const content = `
			<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">

			<!-- Conteneur principal avec disposition côte à côte - centré -->
			<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-blue-400 border-opacity-30 neon-border flex gap-10 items-start" style="height: 80vh; max-width: 1300px; width: 95%;">
				<!-- Colonne de gauche : Profile + Friends - largeur fixe (moitié du match history) -->
				<div class="flex flex-col gap-6 h-full" style="width: 800px;">
					<!-- Bloc Profile Principal -->
					<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400 border-opacity-30 neon-border w-full flex flex-col items-center flex-shrink-0">
						<header class="w-full mb-6">
							<button class="bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105" data-route="/home">${i18n.t("profile.back")}</button>
							<h2 class="text-3xl font-bold text-cyan-400 neon-text text-center mt-4">${i18n.t("profile.my_profile")}</h2>
						</header>
						<main class="w-full flex flex-col items-center">
							<div class="flex items-center gap-8 mb-8">
								<div class="relative w-32 h-32 rounded-full border-4 border-cyan-400 border-opacity-50 neon-border overflow-hidden">
									<img src="/default-avatar.png" id="user-avatar" class="w-full h-full object-cover">
									<button id="edit-avatar" title="${i18n.t("profile.edit_avatar")}" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-400 bg-opacity-20 hover:bg-opacity-40 text-cyan-400 rounded-full p-2 transition-all duration-300">
										<img src="../assets/edit.svg" alt="Edit" style="width:20px; height:20px;">
									</button>
									<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" style="display:none;" />
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-3">
										<h3 id="username" class="text-2xl font-bold text-cyan-400 neon-text">Username</h3>
										<button id="edit-username" title="${i18n.t("profile.edit_username")}" class="bg-gradient-to-r from-cyan-400 from-opacity-20 to-blue-400 to-opacity-20 hover:from-cyan-400 hover:from-opacity-40 hover:to-blue-400 hover:to-opacity-40 text-cyan-400 font-bold py-1 px-2 rounded-lg border border-cyan-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">
											<img src="../assets/edit.svg" alt="Edit" style="width:16px; height:16px;">
										</button>
									</div>
									<div class="flex items-center gap-3 mb-3">
										<span id="password" class="text-gray-300">${i18n.t("profile.password_display")}</span>
										<button id="edit-password" title="${i18n.t("profile.edit_password")}" class="bg-gradient-to-r from-cyan-400 from-opacity-20 to-blue-400 to-opacity-20 hover:from-cyan-400 hover:from-opacity-40 hover:to-blue-400 hover:to-opacity-40 text-cyan-400 font-bold py-1 px-2 rounded-lg border border-cyan-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">
											<img src="../assets/edit.svg" alt="Edit" style="width:16px; height:16px;">
										</button>
									</div>
									<div class="bg-gray-700 bg-opacity-50 p-4 rounded-xl border border-blue-400 border-opacity-30">
										<p id="user-stats" class="text-blue-400 text-sm">${i18n.t("profile.games_played_stats", { games: "0", wins: "0", losses: "0" })}</p>
									</div>
								</div>
							</div>
							
							<!-- Security Section -->
							<div class="w-full mb-4">
								<h4 class="text-lg font-semibold mb-3">${i18n.t("profile.security") || "Security"}</h4>
								<div class="space-y-2">
									<button id="manage-2fa" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm">
										🔐 ${i18n.t("profile.manage_2fa") || "Manage Two-Factor Authentication"}
									</button>
								</div>
							</div>
						</main>
					</div>

					<!-- Bloc Friends List - occupe le reste de l'espace -->
					<div id="friends-block" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-green-400 border-opacity-30 neon-border w-full flex flex-col flex-1">
						<header class="w-full flex-shrink-0 mb-4 flex items-center justify-between">
							<h2 class="text-2xl font-bold text-green-400 neon-text">${i18n.t("profile.friends_list")}</h2>
							<!-- Le bouton (+) sera ajouté ici par JS -->
						</header>
						<main class="w-full flex-1 overflow-y-auto">
							<!-- Le contenu de la liste d'amis sera ajouté ici -->
							<!-- Plus d'amis peuvent être ajoutés ici -->
						</main>
					</div>
				</div>

				<!-- Colonne de droite : Match History - largeur fixe -->
				<div class="flex flex-col gap-6 h-full" style="width: 800px;">
					<div id="match-block" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-purple-400 border-opacity-30 neon-border w-full flex flex-col h-full">
						<header class="w-full mb-4">
							<h2 class="text-2xl font-bold text-purple-400 neon-text">${i18n.t("profile.match_history")}</h2>
						</header>
						<main class="w-full flex-1 overflow-y-auto">
							<!-- Le contenu de l'historique des matchs sera ajouté ici -->
						</main>
					</div>
					<div id="dashboard" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-purple-400 border-opacity-30 neon-border w-full flex flex-col h-full">
						<header class="w-full mb-4">
							<h2 class="text-2xl font-bold text-purple-400 neon-text">${i18n.t("profile.dashboard")}</h2>
						</header>
						<main class="w-full flex-1 overflow-y-auto">
							<!-- Le contenu de l'historique des matchs sera ajouté ici -->
						</main>
					</div>
				</div>
			</div>
		</div>
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="absolute top-4 left-4" id="logout-container"></div>
		`;

		page.innerHTML = createNeonContainer(content);

		// Insérer le commutateur de langue
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
						? `https://${window.location.hostname}:3445`
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
	input.className = "input";
	input.style.marginRight = "8px";
	input.style.width = "auto";
	input.style.display = "inline-block";

	const validateBtn = document.createElement("button");
	validateBtn.textContent = i18n.t("profile.validate");
	validateBtn.className = "btn";
	validateBtn.type = "button";

	const cancelBtn = document.createElement("button");
	cancelBtn.textContent = i18n.t("profile.cancel");
	cancelBtn.className = "btn";
	cancelBtn.type = "button";
	cancelBtn.style.marginLeft = "8px";

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
		<table class="data-table">
			<thead>
				<tr>
					<th>${i18n.t("profile.date")}</th>
					<th>${i18n.t("profile.opponent")}</th>
					<th>${i18n.t("profile.result")}</th>
				</tr>
			</thead>
			<tbody>
	`;

	for (const match of history) {
		const isPlayer1 = match.player1.username === username;
		const opponent = isPlayer1
			? match.player2.username
			: match.player1.username;
		const result =
			match.winnerId === (isPlayer1 ? match.player1Id : match.player2Id)
				? i18n.t("profile.victory")
				: i18n.t("profile.defeat");
		const date = new Date(match.playedAt).toLocaleDateString();
		const statusClass =
			result === i18n.t("profile.victory")
				? "status-victory"
				: "status-defeat";

		html += `
			<tr>
				<td>${date}</td>
				<td>${opponent}</td>
				<td><span class="${statusClass}">${result}</span></td>
			</tr>
		`;
	}
	html += `</tbody></table>`;
	histDiv.innerHTML = html;
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

		// Si c'est une URL externe, l'utiliser telle quelle
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
		<div class="friends-table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th>${i18n.t("profile.status")}</th>
						<th>${i18n.t("profile.avatar")}</th>
						<th>${i18n.t("profile.name")}</th>
						<th>${i18n.t("profile.Games_played")}</th>
					</tr>
				</thead>
				<tbody>
	`;

	for (const friend of friendsList) {
		const status = friend.connected;
		const avatar = fixAvatarUrl(friend.avatarUrl);
		const name = friend.username;
		const played = friend.gamesPlayed;

		html += `
			<tr>
				<td>
					<div style="width:10px; height:10px; border-radius:50%; overflow:hidden; background:${status ? "green" : "gray"}; display:flex; align-items:center; justify-content:center;">
					</div>
				</td>
				<td>
					<div style="width:40px; height:40px; border-radius:50%; overflow:hidden; background:#222; display:flex; align-items:center; justify-content:center;">
						<img src="${avatar || "/default-avatar.png"}" alt="avatar" style="width:100%; height:100%; object-fit:cover;">
					</div>
				</td>
				<td>${name}</td>
				<td>${played}</td>
			</tr>
		`;
	}
	html += `</tbody></table></div>`;
	friendsMain.innerHTML = html;
	setupAddFriendFeature(page);
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
