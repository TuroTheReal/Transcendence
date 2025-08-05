import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

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
			<div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse"></div>

			<div class="absolute top-4 right-4 z-50" id="language-switcher-container"></div>

			<!-- Main Chat Container -->
			<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 max-w-7xl w-full h-[80vh] flex flex-col fade-in slide-up">
				<header class="w-full flex items-center gap-4 mb-6">
					<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" data-route="/game">
						← ${i18n.t("chat.back")}
					</button>
					<h2 class="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse text-3xl">
						💬 ${i18n.t("chat.title")}
					</h2>
				</header>

				<main class="flex-1 flex gap-4 min-h-0">
					<!-- Online Users Panel -->
					<div class="w-1/4 bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30">
							<h3 class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse font-bold text-lg">
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
					<div class="w-1/3 bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30">
							<h3 class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse font-bold text-lg">
								💭 ${i18n.t("chat.conversations")}
							</h3>
						</div>
						<div class="flex-1 overflow-y-auto" id="conversations-list">
							<!-- Conversations will appear here -->
						</div>
					</div>

					<!-- Chat Area -->
					<div class="flex-1 bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl flex flex-col min-h-0">
						<div class="p-4 border-b-2 border-purple-400/30" id="chat-header">
							<h3 class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse font-bold text-lg">
								💬 ${i18n.t("chat.select_conversation")}
							</h3>
						</div>
						<div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
							<!-- Messages will appear here -->
						</div>
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm border-t-2 border-purple-400/30 p-4 flex gap-2">
							<input
								type="text"
								placeholder="${i18n.t("chat.type_message")}"
								id="message-input"
								class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold flex-1"
							>
							<button id="send-message" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full">
								📤 ${i18n.t("chat.send")}
							</button>
						</div>
					</div>
				</main>
			</div>
		`;

		page.innerHTML = `
			<div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden">
				<div class="min-h-screen flex flex-col items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
					${content}
				</div>
			</div>
		`;

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
				<div class="min-h-screen flex items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
					<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 border border-red-400 border-opacity-30 max-w-md w-full text-center">
						<h2 class="text-xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-4">${i18n.t("common.error")}</h2>
						<p class="text-gray-300">${i18n.t("chat.login_required")}</p>
						<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full mt-4" data-route="/login">${i18n.t("chat.login_link")}</button>
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
					sessionStorage.setItem("userId", userData.id.toString());
					initializeChat(page, userData);
				} else {
					throw new Error("Invalid user data");
				}
			})
			.catch((error) => {
				console.error("❌ Failed to get user info:", error);
				page.innerHTML = `
					<div class="min-h-screen flex items-center justify-center p-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none">
						<div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-8 border border-red-400 border-opacity-30 max-w-md w-full text-center">
							<h2 class="text-xl font-bold text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse mb-4">${i18n.t("common.error")}</h2>
							<p class="text-gray-300">${i18n.t("chat.user_info_error")}</p>
							<button class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full mt-4" data-route="/login">${i18n.t("chat.reconnect_link")}</button>
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
		return userData;
	} catch (error) {
		console.error("❌ Error fetching user info:", error);
		throw error;
	}
}

function initializeChat(page: HTMLElement, userData: any) {
	// Use GlobalNotificationService for all WebSocket communication
	// No separate WebSocket needed for ChatPage
	let globalNotificationService: any = null;
	let chatMessageHandler: any = null; // Store reference to handler for cleanup
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
	// Pending invitations now managed by GlobalNotificationService

	// Add this variable to store received messages
	let receivedMessages: Map<string, any[]> = new Map();

	async function initializeGlobalService() {
		// Import the existing GlobalNotificationService instance
		const { default: service } = await import("../services/GlobalNotificationService.js");
		globalNotificationService = service;

		globalNotificationService.clearChatHandlers();
		
		// Register ChatPage-specific message handler
		chatMessageHandler = (data: any) => {
			switch (data.type) {
				case "connection_established":
					console.log("✅ Connected to chat server");
					loadConversations();
					setTimeout(() => requestOnlineUsers(), 100);
					return true;
				case "conversations":
					displayConversations(data.conversations);
					return true;
				case "messages":
					displayMessages(data.messages);
					return true;
				case "message_sent":
					return true;
				case "direct_message":
					handleNewMessage(data);
					return true;
				case "user_profile":
					displayUserProfile(data.profile);
					return true;
				case "online_users":
					if (onlineUsersList && onlineUsersList.parentNode) {
						displayOnlineUsers(data.users);
					} else {
						console.warn("⚠️ onlineUsersList element not found in DOM");
					}
					return true;
				case "user_offline":
					removeUserFromOnlineList(data.username);
					return true;
				case "user_online":
					addUserToOnlineList(data.user);
					return true;
				case "error":
					showError(data.message);
					return true;
				case "user_blocked":
					blockedUsers.add(data.username);
					showBlockedMessage(data.username, true);
					if (currentConversation === data.username) {
						updateBlockButton(data.username);
						if (globalNotificationService && globalNotificationService.isReady()) {
							globalNotificationService.sendMessage({
								type: "get_messages",
								otherUsername: data.username,
							});
						}
					}
					return true;
				case "user_unblocked":
					blockedUsers.delete(data.username);
					showBlockedMessage(data.username, true, true);
					if (currentConversation === data.username) {
						updateBlockButton(data.username);
						if (globalNotificationService && globalNotificationService.isReady()) {
							globalNotificationService.sendMessage({
								type: "get_messages",
								otherUsername: data.username,
							});
						}
					}
					return true;
				case "user_blocked_you":
					usersWhoBlockedMe.add(data.username);
					showBlockedMessage(data.username, false);
					return true;
				case "user_unblocked_you":
					usersWhoBlockedMe.delete(data.username);
					showBlockedMessage(data.username, false, true);
					if (currentConversation === data.username) {
						if (globalNotificationService && globalNotificationService.isReady()) {
							globalNotificationService.sendMessage({
								type: "get_messages",
								otherUsername: data.username,
							});
						}
					}
					loadConversations();
					return true;
				default:
					return false;
			}
		};
		
		globalNotificationService.addMessageHandler(chatMessageHandler);
		
		
		if (globalNotificationService.isReady()) {
			loadConversations();
			requestOnlineUsers();
		} else {
			globalNotificationService.forceReconnect();
			
			onlineUsersList.innerHTML = `
				<div class="p-4 text-blue-400 text-center">
					<div class="animate-spin inline-block w-6 h-6 border-2 border-blue-400 border-t-blue-300 rounded-full shadow-[0_0_8px_rgb(59,130,246)]"></div>
					<div class="mt-3 text-sm font-medium drop-shadow-[0_0_3px_rgb(147,197,253)]">Reconnecting...</div>
				</div>
			`;
		}

	}

	function requestOnlineUsers() {
		if (!onlineUsersList || !onlineUsersList.parentNode) {
			console.warn("⚠️ onlineUsersList element not found, cannot request users");
			return;
		}
		
		if (onlineUsersRequestTimeout) {
			clearTimeout(onlineUsersRequestTimeout);
		}

		onlineUsersRequestTimeout = setTimeout(() => {
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

			if (globalNotificationService && globalNotificationService.isReady()) {
				globalNotificationService.sendMessage({
					type: "get_online_users",
				});

				setTimeout(() => {
					if (onlineUsersList.querySelector(".animate-spin")) {
						onlineUsersList.innerHTML = `
							<div class="p-4 text-red-400 text-center">
								<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">${i18n.t("chat.timeout_users")}</div>
								<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_8px_rgb(239,68,68)] mt-3" onclick="location.reload()">${i18n.t("chat.reload")}</button>
							</div>
						`;
					}
				}, 10000);
			} else {
				console.log("🔧 GlobalNotificationService not ready, forcing reconnection...");
				globalNotificationService.forceReconnect();
				
				onlineUsersList.innerHTML = `
					<div class="p-4 text-orange-400 text-center">
						<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(251,146,60)]">Reconnecting...</div>
						<div class="text-sm text-orange-300 mt-1">Please wait a moment</div>
					</div>
				`;
				
				setTimeout(() => {
					if (globalNotificationService.isReady()) {
						requestOnlineUsers();
					} else {
						onlineUsersList.innerHTML = `
							<div class="p-4 text-red-400 text-center">
								<div class="text-lg font-medium drop-shadow-[0_0_3px_rgb(252,165,165)]">Connection failed</div>
								<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_8px_rgb(239,68,68)] mt-3" onclick="location.reload()">Reload Page</button>
							</div>
						`;
					}
				}, 3000);
			}
		}, 100);
	}

	function displayOnlineUsers(users: any[]) {
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

		const fragment = document.createDocumentFragment();

		users.forEach((user) => {
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
		if (user.username === userData.username) {
			return;
		}


		const existingUser = onlineUsersList.querySelector(
			`[data-username="${user.username}"]`
		);
		if (existingUser) {
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

		const noUsersMessage =
			onlineUsersList.querySelector(".text-purple-300");
		if (
			noUsersMessage &&
			noUsersMessage.textContent?.includes("Aucun utilisateur en ligne")
		) {
			noUsersMessage.remove();
		}

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
		selectConversation(username);

		loadConversations();
	}

	function loadConversations() {
		if (globalNotificationService && globalNotificationService.isReady()) {
			globalNotificationService.sendMessage({
				type: "get_conversations",
			});
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

		clearNotificationBadge(username);

			const hasPendingInvite = false;
		const inviteButtonClass = hasPendingInvite
			? "text-gray-400 text-sm cursor-not-allowed opacity-50"
			: "text-green-400 text-sm hover:text-green-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,197,94)]";
		const inviteButtonText = hasPendingInvite ? "🎮 Invitation Sent" : "🎮 Invite to Game";

		const isUserBlocked = blockedUsers.has(username);
		const blockButtonText = isUserBlocked ? `🔓 ${i18n.t("chat.unblock_user")}` : `🚫 ${i18n.t("chat.block_user")}`;
		const blockButtonClass = isUserBlocked 
			? "text-green-400 text-sm hover:text-green-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,197,94)]"
			: "text-red-400 text-sm hover:text-red-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(252,165,165)]";

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
					<button class="${blockButtonClass}" id="block-user-btn">
						${blockButtonText}
					</button>
				</div>
			</div>
		`;

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

		if (globalNotificationService && globalNotificationService.isReady()) {
			globalNotificationService.sendMessage({
				type: "get_messages",
				otherUsername: username,
			});
		}
	}

	function clearNotificationBadge(username: string) {
		const conversationElement = conversationsList.querySelector(
			`[data-username="${username}"]`
		);
		if (conversationElement) {
			conversationElement.classList.remove("bg-blue-50");
			const badge = conversationElement.querySelector(".bg-red-500");
			if (badge) {
				badge.remove();
			}
		}

		if (receivedMessages.has(username)) {
			receivedMessages.set(username, []);
		}

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
			globalNotificationService &&
			globalNotificationService.isReady() &&
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

			globalNotificationService.sendMessage({
				type: "direct_message",
				receiverUsername: currentConversation,
				content: message,
			});
			messageInput.value = "";
		}
	}

	function showUserProfile(username: string) {
		if (globalNotificationService && globalNotificationService.isReady()) {
			globalNotificationService.sendMessage({
				type: "get_user_profile",
				username: username,
			});
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
		const isUserBlocked = blockedUsers.has(username);
		const action = isUserBlocked ? "unblock" : "block";
		const confirmMessage = isUserBlocked 
			? `${i18n.t("chat.confirm_unblock")} ${username} ?`
			: `${i18n.t("chat.confirm_block")} ${username} ?`;

		if (confirm(confirmMessage)) {
			if (globalNotificationService && globalNotificationService.isReady()) {
				globalNotificationService.sendMessage({
					type: isUserBlocked ? "unblock_user" : "block_user",
					usernameToBlock: username,
				});
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

	function showBlockedMessage(username: string, isBlockedByMe: boolean, isUnblocked: boolean = false) {
		let message: string;
		
		if (isUnblocked) {
			message = `${i18n.t("chat.unblocked_success")} ${username}. ${i18n.t("chat.unblocked_success_message")}`;
			showSuccessMessage(message);
		} else {
			message = isBlockedByMe
				? `${i18n.t("chat.blocked_success")} ${username}. ${i18n.t("chat.blocked_success_message")}`
				: `${username} ${i18n.t("chat.blocked_by_message")}`;
			showError(message);
		}
	}

	function updateBlockButton(username: string) {
		const blockUserBtn = chatHeader.querySelector("#block-user-btn") as HTMLButtonElement;
		if (blockUserBtn) {
			const isUserBlocked = blockedUsers.has(username);
			const blockButtonText = isUserBlocked ? `🔓 ${i18n.t("chat.unblock_user")}` : `🚫 ${i18n.t("chat.block_user")}`;
			const blockButtonClass = isUserBlocked 
				? "text-green-400 text-sm hover:text-green-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,197,94)]"
				: "text-red-400 text-sm hover:text-red-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(252,165,165)]";
			
			blockUserBtn.className = blockButtonClass;
			blockUserBtn.innerHTML = blockButtonText;
		}
	}

	function sendGameInvite(username: string) {
		// Import and use GlobalNotificationService for game invites
		import("../services/GlobalNotificationService.js").then(({ default: globalNotificationService }) => {
			if (!globalNotificationService.isReady()) {
				showError("Not connected to notification service");
				return;
			}

			// Pending invitation check now handled by backend

			// Use GlobalNotificationService WebSocket instead of ChatPage WebSocket
			globalNotificationService.sendGameInvite(username);
		});
	}

	// Game invite handlers removed - now handled by GlobalNotificationService

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

	// Game invite global functions removed - now handled by GlobalNotificationService

	// Event listeners
	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			sendMessage();
		}
	});

	// Initialize GlobalNotificationService when page loads
	initializeGlobalService();
	addRefreshButton();
}

function refreshOnlineUsersList() {
	// This function will be updated to use globalNotificationService when available
	// For now, it's called from addRefreshButton but needs to be accessible globally
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
