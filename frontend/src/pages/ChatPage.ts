import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";
import { createNeonContainer } from "../styles/neonTheme.js";

export function createChatPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "fade-in";

	const renderContent = () => {
		const content = `
			<style>
				/* Import Orbitron font for retro theme */
				@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

				* {
					font-family: 'Orbitron', monospace;
				}
			</style>

			<!-- Champ d'étoiles -->
			<div class="${classes.starfield}"></div>

			<div class="absolute top-4 right-4 z-50" id="language-switcher-container"></div>

			<!-- Main Chat Container -->
			<div class="${classes.retroPanel} rounded-2xl p-8 max-w-7xl w-full h-[80vh] flex flex-col fade-in slide-up">
				<header class="w-full flex items-center gap-4 mb-6">
					<button class="${classes.backButton}" data-route="/game">
						← ${i18n.t("chat.back")}
					</button>
					<h2 class="${classes.retroTitle} text-3xl">
						💬 ${i18n.t("chat.title")}
					</h2>
				</header>

				<main class="flex-1 flex gap-4 min-h-0">
					<!-- Online Users Panel -->
					<div class="w-1/4 ${classes.retroPanel} rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30">
							<h3 class="${classes.neonText} font-bold text-lg">
								👥 ${i18n.t("chat.online_users")}
							</h3>
						</div>
						<div class="flex-1 overflow-y-auto" id="online-users-list">
							<div class="p-4 text-purple-300 text-center">
								<div class="animate-spin inline-block w-4 h-4 border-2 border-purple-400 border-t-purple-300 rounded-full mb-2"></div>
								<div>${i18n.t("chat.connecting")}</div>
							</div>
						</div>
					</div>

					<!-- Conversations Panel -->
					<div class="w-1/3 ${classes.retroPanel} rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30">
							<h3 class="${classes.neonText} font-bold text-lg">
								💭 ${i18n.t("chat.conversations")}
							</h3>
						</div>
						<div class="flex-1 overflow-y-auto" id="conversations-list">
							<!-- Conversations will appear here -->
						</div>
					</div>

					<!-- Chat Area -->
					<div class="flex-1 ${classes.retroPanel} rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30" id="chat-header">
							<h3 class="${classes.neonText} font-bold text-lg">
								💬 ${i18n.t("chat.select_conversation")}
							</h3>
						</div>
						<div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
							<!-- Messages will appear here -->
						</div>
						<div class="${classes.retroPanel} border-t-2 border-purple-400/30 p-4 flex gap-2">
							<input
								type="text"
								placeholder="${i18n.t("chat.type_message")}"
								id="message-input"
								class="${classes.tournamentInput} flex-1"
							>
							<button id="send-message" class="${classes.actionButton}">
								📤 ${i18n.t("chat.send")}
							</button>
						</div>
					</div>
				</main>
			</div>
		`;

		page.innerHTML = createNeonContainer(content);

		// Add language switcher
		const languageSwitcherContainer = page.querySelector(
			"#language-switcher-container"
		);
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener("languageChanged", renderContent);

	// Get current user info
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

	if (!username) {
		page.innerHTML = `
				<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">
					<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-red-400 border-opacity-30 neon-border max-w-md w-full text-center">
						<h2 class="text-xl font-bold text-red-400 neon-text mb-4">${i18n.t("common.error")}</h2>
						<p class="text-gray-300">${i18n.t("chat.login_required")}</p>
						<button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 mt-4" data-route="/login">${i18n.t("chat.login_link")}</button>
					</div>
				</div>
			`;

		// Add navigation handler
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

	// Optimiser le chargement : démarrer la connexion WebSocket immédiatement
	// avec un timeout pour getUserInfo
	const userId = sessionStorage.getItem("userId");
	if (userId) {
		// Si on a déjà l'userId en cache, on peut démarrer plus vite
		const userData = {
			id: parseInt(userId),
			username: username,
		};
		initializeChat(page, userData);
	} else {
		// Sinon, on récupère les données avec un timeout
		const userInfoPromise = getUserInfo();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("User info timeout")), 3000);
		});

		Promise.race([userInfoPromise, timeoutPromise])
			.then((userData) => {
				if (userData && userData.id) {
					console.log("✅ User info retrieved:", userData);
					sessionStorage.setItem("userId", userData.id.toString());
					initializeChat(page, userData);
				} else {
					throw new Error("Invalid user data");
				}
			})
			.catch((error) => {
				console.error("❌ Failed to get user info:", error);
				page.innerHTML = `
					<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">
						<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-red-400 border-opacity-30 neon-border max-w-md w-full text-center">
							<h2 class="text-xl font-bold text-red-400 neon-text mb-4">${i18n.t("common.error")}</h2>
							<p class="text-gray-300">${i18n.t("chat.user_info_error")}</p>
							<button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 mt-4" data-route="/login">${i18n.t("chat.reconnect_link")}</button>
						</div>
					</div>
				`;
			});
	}

	// Navigation
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

/**
 * Get user info from server with timeout
 */
export async function getUserInfo() {
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

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const userData = await response.json();
		console.log("✅ User data from /api/me:", userData);
		return userData;
	} catch (error) {
		console.error("❌ Error fetching user info:", error);
		throw error;
	}
}

/**
 * Initialize chat functionality with user data
 */
function initializeChat(page: HTMLElement, userData: any) {
	// WebSocket connection
	let ws: WebSocket | null = null;
	let currentConversation: string | null = null;
	const onlineUsersList = page.querySelector(
		"#online-users-list"
	) as HTMLElement;
	const conversationsList = page.querySelector(
		"#conversations-list"
	) as HTMLElement;
	const chatHeader = page.querySelector("#chat-header") as HTMLElement;
	const messagesContainer = page.querySelector(
		"#chat-messages"
	) as HTMLElement;
	const messageInput = page.querySelector(
		"#message-input"
	) as HTMLInputElement;
	const sendButton = page.querySelector("#send-message") as HTMLButtonElement;

	// Améliorer la fonction requestOnlineUsers avec debouncing
	let onlineUsersRequestTimeout: NodeJS.Timeout | null = null;

	// Add these variables at the top of initializeChat function
	let blockedUsers: Set<string> = new Set();
	let usersWhoBlockedMe: Set<string> = new Set();
	let pendingInvitations: Set<string> = new Set(); // Track pending invitations

	// Add this variable to store received messages
	let receivedMessages: Map<string, any[]> = new Map();

	function connectWebSocket() {
		// Utiliser l'URL complète du serveur backend
		ws = new WebSocket(
			`wss://localhost:3002/ws/chat?username=${encodeURIComponent(userData.username)}&userId=${userData.id}`
		);

		ws.onopen = () => {
			console.log("🔗 WebSocket connected");
			loadConversations();
			// Les utilisateurs en ligne sont maintenant envoyés automatiquement par le serveur
			// avec un petit délai pour éviter les race conditions
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("📨 Received:", data);

				switch (data.type) {
					case "connection_established":
						console.log("✅ Connected to chat server");
						break;
					case "conversations":
						displayConversations(data.conversations);
						break;
					case "messages":
						displayMessages(data.messages);
						break;
					case "message_sent":
						// Handle message sent confirmation (optional)
						console.log("✅ Message sent successfully");
						break;
					case "direct_message":
						handleNewMessage(data);
						break;
					case "user_profile":
						displayUserProfile(data.profile);
						break;
					case "online_users":
						console.log("👥 Online users:", data.users);
						displayOnlineUsers(data.users);
						break;
					case "user_offline":
						console.log("👤 User offline:", data.username);
						removeUserFromOnlineList(data.username);
						break;
					case "user_online":
						console.log("👤 User online:", data.user);
						addUserToOnlineList(data.user);
						break;
					case "error":
						showError(data.message);
						break;
					case "user_blocked":
						blockedUsers.add(data.username);
						showBlockedMessage(data.username, true);
						break;
					case "user_unblocked":
						blockedUsers.delete(data.username);
						break;
					case "user_blocked_you":
						usersWhoBlockedMe.add(data.username);
						showBlockedMessage(data.username, false);
						break;
					case "user_unblocked_you":
						usersWhoBlockedMe.delete(data.username);
						break;
					case "game_invite_received":
						handleGameInviteReceived(data);
						break;
					case "game_invite_sent":
						handleGameInviteSent(data);
						break;
					case "game_invite_accepted":
						handleGameInviteAccepted(data);
						break;
					case "game_invite_declined":
						handleGameInviteDeclined(data);
						break;
					case "game_invite_response":
						handleGameInviteResponse(data);
						break;
					case "tournament_notification":
						handleTournamentNotification(data);
						break;
					default:
						console.log("📨 Unknown message type:", data.type);
				}
			} catch (error) {
				console.error("❌ Error parsing message:", error);
			}
		};

		ws.onclose = () => {
			console.log("🔌 WebSocket disconnected");
			// Afficher un message à l'utilisateur
			onlineUsersList.innerHTML = `
				<div class="p-4 text-red-400 text-center">
					<div class="mb-2 text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.connection_lost")}</div>
					<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_8px_rgb(239,68,68)]" onclick="location.reload()">${i18n.t("chat.reconnect")}</button>
				</div>
			`;
		};

		ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			onlineUsersList.innerHTML = `
				<div class="p-4 text-red-400 text-center">
					<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.connection_error")}</div>
					<div class="text-sm text-red-300 mt-1">${i18n.t("chat.check_internet")}</div>
				</div>
			`;
		};
	}

	function requestOnlineUsers() {
		// Debounce les requêtes multiples
		if (onlineUsersRequestTimeout) {
			clearTimeout(onlineUsersRequestTimeout);
		}

		onlineUsersRequestTimeout = setTimeout(() => {
			// Afficher un indicateur de chargement seulement si la liste est vide
			if (
				onlineUsersList.children.length === 0 ||
				onlineUsersList.querySelector(".text-gray-500")
			) {
				onlineUsersList.innerHTML = `
					<div class="p-4 text-purple-300 text-center">
						<div class="animate-spin inline-block w-6 h-6 border-2 border-purple-400 border-t-purple-300 rounded-full shadow-[0_0_8px_rgb(157,78,221)]"></div>
						<div class="mt-3 text-sm font-medium drop-shadow-[0_0_3px_rgb(187,134,252)]">${i18n.t("chat.retrieving_users")}</div>
					</div>
				`;
			}

			if (ws && ws.readyState === WebSocket.OPEN) {
				console.log("🔧 Sending get_online_users request");
				ws.send(
					JSON.stringify({
						type: "get_online_users",
					})
				);

				// Réduire le timeout à 3 secondes au lieu de 5
				setTimeout(() => {
					if (onlineUsersList.querySelector(".animate-spin")) {
						console.log("🔧 Timeout reached for get_online_users");
						onlineUsersList.innerHTML = `
							<div class="p-4 text-red-400 text-center">
								<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.timeout_users")}</div>
								<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_8px_rgb(239,68,68)] mt-3" onclick="location.reload()">${i18n.t("chat.reload")}</button>
							</div>
						`;
					}
				}, 3000); // Timeout après 3 secondes
			} else {
				console.log("🔧 WebSocket not connected");
				// Si WebSocket n'est pas connecté, afficher un message d'erreur immédiatement
				onlineUsersList.innerHTML = `
					<div class="p-4 text-red-400 text-center">
						<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.connection_error")}</div>
						<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_8px_rgb(239,68,68)] mt-3" onclick="location.reload()">${i18n.t("chat.reconnect")}</button>
					</div>
				`;
			}
		}, 100); // Debounce de 100ms
	}

	function displayOnlineUsers(users: any[]) {
		// Solution simple : remplacer complètement la liste
		onlineUsersList.innerHTML = "";

		if (users.length === 0) {
			onlineUsersList.innerHTML = `
				<div class="p-4 text-purple-300 text-center">
					<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(187,134,252)]">${i18n.t("chat.no_users_online")}</div>
					<div class="text-sm text-purple-400/70 mt-1">${i18n.t("chat.no_users_online_message")}</div>
				</div>
			`;
			return;
		}

		// Créer un fragment pour optimiser les performances DOM
		const fragment = document.createDocumentFragment();

		users.forEach((user) => {
			// Skip current user
			if (user.username === userData.username) {
				return;
			}

			const userDiv = document.createElement("div");
			userDiv.className =
				"p-3 border-b border-purple-400 border-opacity-30 hover:bg-purple-900/20 hover:bg-opacity-40 cursor-pointer transition-all duration-300 rounded-lg";
			userDiv.setAttribute("data-username", user.username);
			userDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${user.avatarUrl || "/public/default-avatar.png"}"
						 alt="${user.username}"
						 class="w-8 h-8 rounded-full border-2 border-purple-400/50 shadow-[0_0_8px_rgb(157,78,221,0.3)]">
					<div class="flex-1">
						<h4 class="font-medium text-purple-300 text-sm drop-shadow-[0_0_3px_rgb(187,134,252)]">${user.username}</h4>
						<div class="flex items-center gap-1">
							<div class="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_rgb(34,197,94)]"></div>
							<span class="text-xs text-green-300 font-medium">En ligne</span>
						</div>
					</div>
				</div>
			`;

			userDiv.addEventListener("click", () => {
				startConversationWithUser(user.username);
			});

			fragment.appendChild(userDiv);
		});

		onlineUsersList.appendChild(fragment);
	}

	function addUserToOnlineList(user: any) {
		// Skip current user
		if (user.username === userData.username) {
			return;
		}

		console.log(`👤 Adding user ${user.username} to online list`);

		// Check if user already exists in the list
		const existingUser = onlineUsersList.querySelector(
			`[data-username="${user.username}"]`
		);
		if (existingUser) {
			return; // User already in list
		}

		const userDiv = document.createElement("div");
		userDiv.className =
			"p-3 border-b border-purple-400 border-opacity-30 hover:bg-purple-900/20 hover:bg-opacity-40 cursor-pointer transition-all duration-300 rounded-lg";
		userDiv.setAttribute("data-username", user.username);
		userDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<img src="${user.avatarUrl || "/public/default-avatar.png"}"
					 alt="${user.username}"
					 class="w-8 h-8 rounded-full border-2 border-purple-400/50 shadow-[0_0_8px_rgb(157,78,221,0.3)]">
				<div class="flex-1">
					<h4 class="font-medium text-purple-300 text-sm drop-shadow-[0_0_3px_rgb(187,134,252)]">${user.username}</h4>
					<div class="flex items-center gap-1">
						<div class="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_rgb(34,197,94)]"></div>
						<span class="text-xs text-green-300 font-medium">En ligne</span>
					</div>
				</div>
			</div>
		`;

		userDiv.addEventListener("click", () => {
			startConversationWithUser(user.username);
		});

		// Remove "Aucun utilisateur en ligne" message if it exists
		const noUsersMessage =
			onlineUsersList.querySelector(".text-purple-300");
		if (
			noUsersMessage &&
			noUsersMessage.textContent?.includes("Aucun utilisateur en ligne")
		) {
			noUsersMessage.remove();
		}

		// Add the user to the list
		onlineUsersList.appendChild(userDiv);
	}

	function removeUserFromOnlineList(username: string) {
		const userElement = onlineUsersList.querySelector(
			`[data-username="${username}"]`
		);
		if (userElement) {
			userElement.remove();
		}
	}

	function startConversationWithUser(username: string) {
		// Select the conversation with this user
		selectConversation(username);

		// Also update the conversations list to show this conversation
		loadConversations();
	}

	function loadConversations() {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_conversations",
				})
			);
		}
	}

	function displayConversations(conversations: any[]) {
		conversationsList.innerHTML = "";

		if (conversations.length === 0) {
			conversationsList.innerHTML = `
				<div class="p-4 text-purple-300 text-center">
					<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(187,134,252)]">${i18n.t("chat.no_conversations")}</div>
					<div class="text-sm text-purple-400/70 mt-1">${i18n.t("chat.no_conversations_message")}</div>
				</div>
			`;
			return;
		}

		conversations.forEach((conv) => {
			const convDiv = document.createElement("div");
			convDiv.className = `p-4 border-b border-purple-400/20 hover:bg-purple-900/20 cursor-pointer transition-all duration-300 rounded-lg ${
				conv.unreadCount > 0
					? "bg-purple-900/30 border-purple-400/40"
					: ""
			}`;
			convDiv.setAttribute("data-username", conv.partner.username);
			convDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${conv.partner.avatarUrl || "/public/default-avatar.png"}"
						 alt="${conv.partner.username}"
						 class="w-10 h-10 rounded-full border-2 border-purple-400/50 shadow-[0_0_8px_rgb(157,78,221,0.3)]">
					<div class="flex-1">
						<div class="flex justify-between items-center">
							<h4 class="font-medium text-purple-300 text-sm drop-shadow-[0_0_3px_rgb(187,134,252)]">${conv.partner.username}</h4>
							${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1 shadow-[0_0_6px_rgb(239,68,68)]">${conv.unreadCount}</span>` : ""}
						</div>
						<p class="text-sm text-purple-200 truncate">${conv.lastMessage}</p>
						<p class="text-xs text-purple-300/70">${new Date(conv.timestamp).toLocaleString()}</p>
					</div>
				</div>
			`;

			convDiv.addEventListener("click", () => {
				selectConversation(conv.partner.username);
			});

			conversationsList.appendChild(convDiv);
		});
	}

	function selectConversation(username: string) {
		currentConversation = username;

		// Clear notification badge immediately for this conversation
		clearNotificationBadge(username);

		// Check if there's a pending invitation for this user
		const hasPendingInvite = pendingInvitations.has(username);
		const inviteButtonClass = hasPendingInvite
			? "text-gray-400 text-sm cursor-not-allowed opacity-50"
			: "text-green-400 text-sm hover:text-green-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,197,94)]";
		const inviteButtonText = hasPendingInvite ? "🎮 Invitation Sent" : "🎮 Invite to Game";

		// Update header
		chatHeader.innerHTML = `
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h3 class="font-semibold text-purple-300 text-lg drop-shadow-[0_0_3px_rgb(187,134,252)]">${username}</h3>
					<button class="text-cyan-400 text-sm hover:text-cyan-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,211,238)]" id="view-profile-btn">
						👤 ${i18n.t("chat.view_profile")}
					</button>
				</div>
				<div class="flex gap-2">
					<button class="${inviteButtonClass}" id="invite-game-btn" ${hasPendingInvite ? 'disabled' : ''}>
						${inviteButtonText}
					</button>
					<button class="text-red-400 text-sm hover:text-red-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(252,165,165)]" id="block-user-btn">
						🚫 ${i18n.t("chat.block_user")}
					</button>
				</div>
			</div>
		`;

		// Add event listeners
		const viewProfileBtn = chatHeader.querySelector(
			"#view-profile-btn"
		) as HTMLButtonElement;
		const inviteGameBtn = chatHeader.querySelector(
			"#invite-game-btn"
		) as HTMLButtonElement;
		const blockUserBtn = chatHeader.querySelector(
			"#block-user-btn"
		) as HTMLButtonElement;

		viewProfileBtn.addEventListener("click", () => {
			// Navigate directly to user profile page
			import("../router/router.js").then(({ router }) => {
				router.navigate(`/profile/${username}`);
			});
		});

		inviteGameBtn.addEventListener("click", () => {
			sendGameInvite(username);
		});

		blockUserBtn.addEventListener("click", () => {
			blockUser(username);
		});

		// Load messages
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_messages",
					otherUsername: username,
				})
			);
		}
	}

	function clearNotificationBadge(username: string) {
		// Find the specific conversation div using data-username attribute
		const conversationElement = conversationsList.querySelector(
			`[data-username="${username}"]`
		);
		if (conversationElement) {
			// Remove the blue background indicating unread messages
			conversationElement.classList.remove("bg-blue-50");
			// Remove the red notification badge
			const badge = conversationElement.querySelector(".bg-red-500");
			if (badge) {
				badge.remove();
			}
		}

		// Clear any cached received messages for this conversation to prevent duplication
		if (receivedMessages.has(username)) {
			receivedMessages.set(username, []);
		}

		// Reload conversations after a short delay to allow server to mark messages as read
		setTimeout(() => {
			loadConversations();
		}, 500);
	}

	function displayMessages(messages: any[]) {
		messagesContainer.innerHTML = "";

		if (messages.length === 0) {
			messagesContainer.innerHTML = `
				<div class="text-center text-purple-300 py-8">
					<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(187,134,252)]">${i18n.t("chat.no_messages")}</div>
					<div class="text-sm text-purple-400/70 mt-2">${i18n.t("chat.no_messages_message")}</div>
				</div>
			`;
			return;
		}

		// Check if current conversation is blocked
		const isBlocked = blockedUsers.has(currentConversation!);
		const isBlockedByMe = usersWhoBlockedMe.has(currentConversation!);

		if (isBlocked) {
			messagesContainer.innerHTML = `
				<div class="text-center text-red-400 py-8">
					<div class="mb-4">
						<svg class="w-12 h-12 mx-auto text-red-400 mb-4 drop-shadow-[0_0_6px_rgb(239,68,68)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
						</svg>
						<h3 class="text-lg font-semibold text-red-300 mb-2 drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.user_blocked")}</h3>
						<p class="text-red-200">${i18n.t("chat.blocked_user_message")}</p>
					</div>
				</div>
			`;
			return;
		}

		if (isBlockedByMe) {
			messagesContainer.innerHTML = `
				<div class="text-center text-red-400 py-8">
					<div class="mb-4">
						<svg class="w-12 h-12 mx-auto text-red-400 mb-4 drop-shadow-[0_0_6px_rgb(239,68,68)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
						</svg>
						<h3 class="text-lg font-semibold text-red-300 mb-2 drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.user_blocked_you")}</h3>
						<p class="text-red-200">${i18n.t("chat.blocked_by_user_message")}</p>
					</div>
				</div>
			`;
			return;
		}

		// Combine database messages with received messages
		const allMessages = [...messages];
		if (currentConversation && receivedMessages.has(currentConversation)) {
			const receivedMsgs = receivedMessages.get(currentConversation)!;
			allMessages.push(...receivedMsgs);
		}

		// Sort messages by timestamp
		allMessages.sort(
			(a, b) =>
				new Date(a.timestamp).getTime() -
				new Date(b.timestamp).getTime()
		);

		allMessages.forEach((msg) => {
			const messageDiv = document.createElement("div");
			messageDiv.className = `mb-4 flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`;

			messageDiv.innerHTML = `
				<div class="max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg ${
					msg.sender === "me"
						? "bg-gradient-to-br from-purple-600 to-purple-700 text-white border border-purple-400 shadow-[0_0_10px_rgb(157,78,221,0.4)]"
						: "bg-gradient-to-br from-gray-700 to-gray-800 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgb(34,211,238,0.3)]"
				}">
					<p class="text-sm font-medium">${msg.content}</p>
					<p class="text-xs opacity-60 mt-2 ${msg.sender === "me" ? "text-purple-200" : "text-cyan-200"}">${new Date(msg.timestamp).toLocaleString()}</p>
				</div>
			`;

			messagesContainer.appendChild(messageDiv);
		});

		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	function handleNewMessage(data: any) {
		// Check if message is from/to a blocked user
		const isFromBlockedUser = blockedUsers.has(data.sender);
		const isToBlockedUser = blockedUsers.has(data.receiver);
		const isFromUserWhoBlockedMe = usersWhoBlockedMe.has(data.sender);

		// Don't display messages from blocked users or to users who blocked me
		if (isFromBlockedUser || isFromUserWhoBlockedMe) {
			return;
		}

		// Store the message for the conversation
		const conversationKey =
			data.sender === userData.username ? data.receiver : data.sender;
		if (!receivedMessages.has(conversationKey)) {
			receivedMessages.set(conversationKey, []);
		}
		receivedMessages.get(conversationKey)!.push(data);

		// If this message is for the current conversation, display it
		if (
			currentConversation &&
			(data.sender === currentConversation ||
				data.receiver === currentConversation ||
				data.sender === "me")
		) {
			const messageDiv = document.createElement("div");
			messageDiv.className = `mb-4 flex ${data.sender === "me" || data.sender === userData.username ? "justify-end" : "justify-start"}`;

			messageDiv.innerHTML = `
				<div class="max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg ${
					data.sender === "me" || data.sender === userData.username
						? "bg-gradient-to-br from-purple-600 to-purple-700 text-white border border-purple-400 shadow-[0_0_10px_rgb(157,78,221,0.4)]"
						: "bg-gradient-to-br from-gray-700 to-gray-800 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgb(34,211,238,0.3)]"
				}">
					<p class="text-sm font-medium">${data.content}</p>
					<p class="text-xs opacity-60 mt-2 ${data.sender === "me" || data.sender === userData.username ? "text-purple-200" : "text-cyan-200"}">${new Date(data.timestamp).toLocaleString()}</p>
				</div>
			`;

			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		// Only reload conversations if this user is the receiver (not the sender)
		if (data.receiver === userData.username) {
			loadConversations();
		}
	}

	function sendMessage() {
		const message = messageInput.value.trim();
		if (
			message &&
			ws &&
			ws.readyState === WebSocket.OPEN &&
			currentConversation
		) {
			// Check if user is blocked
			if (blockedUsers.has(currentConversation)) {
				showError(i18n.t("chat.cannot_send_blocked"));
				return;
			}

			if (usersWhoBlockedMe.has(currentConversation)) {
				showError(i18n.t("chat.cannot_send_blocked_by"));
				return;
			}

			ws.send(
				JSON.stringify({
					type: "direct_message",
					receiverUsername: currentConversation,
					content: message,
				})
			);
			messageInput.value = "";
		}
	}

	function showUserProfile(username: string) {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_user_profile",
					username: username,
				})
			);
		}
	}

	function displayUserProfile(profile: any) {
		// For now, just log the profile. In the future, this could open a modal or navigate to profile page
		console.log("📄 User profile received:", profile);

		// You could display this in a modal or navigate to the profile page
		alert(
			`${i18n.t("chat.profile_info")} ${profile.username}:\n${i18n.t("chat.games_played")}: ${profile.gamesPlayed}\n${i18n.t("chat.wins")}: ${profile.wins}\n${i18n.t("chat.losses")}: ${profile.losses}`
		);
	}

	function blockUser(username: string) {
		if (confirm(`${i18n.t("chat.confirm_block")} ${username} ?`)) {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(
					JSON.stringify({
						type: "block_user",
						usernameToBlock: username,
					})
				);
			}
		}
	}

	function showError(message: string) {
		const errorDiv = document.createElement("div");
		errorDiv.className =
			"fixed top-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgb(239,68,68)] border border-red-400/50 backdrop-blur-sm z-50";
		errorDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<div class="text-red-200">⚠️</div>
				<div class="font-medium">${message}</div>
			</div>
		`;
		document.body.appendChild(errorDiv);

		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	function showBlockedMessage(username: string, isBlockedByMe: boolean) {
		const message = isBlockedByMe
			? `${i18n.t("chat.blocked_success")} ${username}. ${i18n.t("chat.blocked_success_message")}`
			: `${username} ${i18n.t("chat.blocked_by_message")}`;

		showError(message);
	}

	function sendGameInvite(username: string) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			showError("Not connected to chat server");
			return;
		}

		// Check if there's already a pending invitation
		if (pendingInvitations.has(username)) {
			showError("You already have a pending invitation to this user");
			return;
		}

		ws.send(JSON.stringify({
			type: "send_game_invite",
			receiverUsername: username
		}));
	}

	function handleGameInviteReceived(data: any) {
		showGameInviteNotification(data.senderUsername, data.inviteId);
	}

	function handleGameInviteSent(data: any) {
		// Add to pending invitations
		pendingInvitations.add(data.receiverUsername);
		showSuccessMessage(`Game invitation sent to ${data.receiverUsername}`);

		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteAccepted(data: any) {
		// Remove from pending invitations
		pendingInvitations.delete(data.receiverUsername);
		showSuccessMessage(`${data.receiverUsername} accepted your game invitation! ${data.message || ''}`);

		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteDeclined(data: any) {
		// Remove from pending invitations
		pendingInvitations.delete(data.receiverUsername);
		showError(`${data.receiverUsername} declined your game invitation`);

		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteResponse(data: any) {
		const message = data.status === "accepted"
			? `Game invitation ${data.status}! ${data.message || ''}`
			: `Game invitation ${data.status}`;

		if (data.status === "accepted") {
			showSuccessMessage(message);
		} else {
			showError(message);
		}
	}

	function handleTournamentNotification(data: any) {
		showTournamentNotification(data.message);
	}

	function showGameInviteNotification(senderUsername: string, inviteId: number) {
		const notificationDiv = document.createElement("div");
		notificationDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-50 max-w-sm";
		notificationDiv.innerHTML = `
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3">
					<div class="text-green-200">🎮</div>
					<div>
						<div class="font-medium">Game Invitation</div>
						<div class="text-sm text-green-200">${senderUsername} wants to play Pong!</div>
					</div>
				</div>
				<div class="flex gap-2">
					<button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="acceptGameInvite(${inviteId})">
						Accept
					</button>
					<button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="declineGameInvite(${inviteId})">
						Decline
					</button>
				</div>
			</div>
		`;
		document.body.appendChild(notificationDiv);

		// Auto-remove after 30 seconds
		setTimeout(() => {
			if (notificationDiv.parentNode) {
				notificationDiv.remove();
			}
		}, 30000);
	}

	function showSuccessMessage(message: string) {
		const successDiv = document.createElement("div");
		successDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-50";
		successDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<div class="text-green-200">✅</div>
				<div class="font-medium">${message}</div>
			</div>
		`;
		document.body.appendChild(successDiv);

		setTimeout(() => {
			successDiv.remove();
		}, 5000);
	}

	function showTournamentNotification(message: string) {
		const notificationDiv = document.createElement("div");
		notificationDiv.className = "fixed top-4 left-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-lg shadow-[0_0_15px_rgb(147,51,234)] border border-purple-400/50 backdrop-blur-sm z-50 max-w-sm";
		notificationDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<div class="text-purple-200">🏆</div>
				<div>
					<div class="font-medium">Tournament Notification</div>
					<div class="text-sm text-purple-200">${message}</div>
				</div>
			</div>
		`;
		document.body.appendChild(notificationDiv);

		setTimeout(() => {
			notificationDiv.remove();
		}, 8000);
	}

	// Make functions globally available for onclick handlers
	(window as any).acceptGameInvite = (inviteId: number) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: "accept_game_invite",
				inviteId: inviteId
			}));
		}
		// Remove the notification
		const notification = document.querySelector('.fixed.top-4.right-4');
		if (notification) {
			notification.remove();
		}
	};

	(window as any).declineGameInvite = (inviteId: number) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: "decline_game_invite",
				inviteId: inviteId
			}));
		}
		// Remove the notification
		const notification = document.querySelector('.fixed.top-4.right-4');
		if (notification) {
			notification.remove();
		}
	};

	// Event listeners
	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			sendMessage();
		}
	});

	// Connect to WebSocket when page loads
	connectWebSocket();
	addRefreshButton();
}

function refreshOnlineUsersList() {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(
			JSON.stringify({
				type: "get_online_users",
			})
		);
	}
}

// Ajouter un bouton de rafraîchissement dans l'interface
function addRefreshButton() {
	// Chercher le header des utilisateurs en ligne de manière plus sûre
	const onlineUsersSection =
		document.querySelector("#online-users-list")?.parentElement;
	if (onlineUsersSection) {
		const header = onlineUsersSection.querySelector(".p-4") as HTMLElement;
		if (header) {
			const refreshButton = document.createElement("button");
			refreshButton.className =
				"ml-2 text-blue-600 hover:text-blue-800 text-sm";
			refreshButton.innerHTML = i18n.t("chat.reload");
			refreshButton.title = i18n.t("chat.reload");
			refreshButton.addEventListener("click", refreshOnlineUsersList);
			header.appendChild(refreshButton);
		}
	}
}
