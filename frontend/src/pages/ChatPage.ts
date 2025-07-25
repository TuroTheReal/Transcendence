import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createChatPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Styles personnalisés pour les effets néon */
			.neon-text {
				text-shadow:
					0 0 5px currentColor,
					0 0 10px currentColor,
					0 0 15px currentColor,
					0 0 20px currentColor;
			}

			.neon-border {
				box-shadow:
					0 0 10px currentColor,
					inset 0 0 10px currentColor;
			}

			.particles {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: -1;
			}

			.particle {
				position: absolute;
				width: 2px;
				height: 2px;
				background: #00ff41;
				border-radius: 50%;
				animation: float 6s ease-in-out infinite;
			}

			@keyframes float {
				0%, 100% { transform: translateY(0px) rotate(0deg); }
				50% { transform: translateY(-20px) rotate(180deg); }
			}

			.scan-lines::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(
					transparent 0%,
					rgba(0, 255, 65, 0.03) 50%,
					transparent 100%
				);
				background-size: 100% 4px;
				animation: scan 0.1s linear infinite;
				pointer-events: none;
			}

			@keyframes scan {
				0% { background-position: 0 0; }
				100% { background-position: 0 4px; }
			}
		</style>

		<!-- Particules d'arrière-plan -->
		<div class="particles">
			<div class="particle" style="left: 10%; animation-delay: 0s;"></div>
			<div class="particle" style="left: 20%; animation-delay: 1s;"></div>
			<div class="particle" style="left: 30%; animation-delay: 2s;"></div>
			<div class="particle" style="left: 40%; animation-delay: 3s;"></div>
			<div class="particle" style="left: 50%; animation-delay: 4s;"></div>
			<div class="particle" style="left: 60%; animation-delay: 5s;"></div>
			<div class="particle" style="left: 70%; animation-delay: 2s;"></div>
			<div class="particle" style="left: 80%; animation-delay: 1s;"></div>
			<div class="particle" style="left: 90%; animation-delay: 3s;"></div>
		</div>

		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">
			<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400 border-opacity-30 neon-border max-w-6xl w-full flex flex-col items-center"
		  <header class="w-full flex items-center gap-4 mb-6">
			<button class="bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105" data-route="/home">${i18n.t('chat.back')}</button>
			<h2 class="text-3xl font-bold text-cyan-400 neon-text">${i18n.t('chat.title')}</h2>
		  </header>
      <main class="w-full flex flex-col items-center">
        <div class="flex w-full h-96">
          <!-- Online Users -->
          <div class="w-1/4 border-r border-cyan-400 border-opacity-30 flex flex-col bg-gray-800 bg-opacity-30 rounded-l-xl">
            <div class="p-4 border-b border-cyan-400 border-opacity-30">
              <h3 class="font-semibold text-cyan-400 neon-text">${i18n.t('chat.online_users')}</h3>
            </div>
            <div class="flex-1 overflow-y-auto" id="online-users-list">
              <div class="p-4 text-cyan-400 text-center">
                <div class="animate-spin inline-block w-4 h-4 border-2 border-cyan-400 border-t-green-400 rounded-full mb-2"></div>
                <div>${i18n.t('chat.connecting')}</div>
              </div>
            </div>
          </div>

          <!-- Conversations List -->
          <div class="w-1/3 border-r border-cyan-400 border-opacity-30 flex flex-col bg-gray-800 bg-opacity-30">
            <div class="p-4 border-b border-cyan-400 border-opacity-30">
              <h3 class="font-semibold text-cyan-400 neon-text">${i18n.t('chat.conversations')}</h3>
            </div>
            <div class="flex-1 overflow-y-auto" id="conversations-list">
              <!-- Conversations will appear here -->
            </div>
          </div>

          <!-- Chat Area -->
          <div class="flex-1 flex flex-col bg-gray-800 bg-opacity-30 rounded-r-xl">
            <div class="p-4 border-b border-cyan-400 border-opacity-30" id="chat-header">
              <h3 class="font-semibold text-cyan-400 neon-text">${i18n.t('chat.select_conversation')}</h3>
            </div>
            <div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
              <!-- Messages will appear here -->
            </div>
            <div class="bg-gray-700 bg-opacity-50 border-t border-cyan-400 border-opacity-30 p-4 flex gap-2">
              <input type="text" placeholder="${i18n.t('chat.type_message')}" id="message-input" class="flex-1 bg-gray-600 bg-opacity-50 text-white border border-cyan-400 border-opacity-30 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50">
              <button id="send-message" class="bg-gradient-to-r from-cyan-400 from-opacity-30 to-blue-400 to-opacity-30 hover:from-cyan-400 hover:from-opacity-50 hover:to-blue-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-cyan-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">${i18n.t('chat.send')}</button>
            </div>
          </div>
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
					<h2 class="text-xl font-bold text-red-400 neon-text mb-4">Erreur</h2>
					<p class="text-gray-300">Vous devez être connecté pour accéder au chat.</p>
					<button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 mt-4" data-route="/login">Se connecter</button>
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
							<h2 class="text-xl font-bold text-red-400 neon-text mb-4">Erreur</h2>
							<p class="text-gray-300">Impossible de récupérer les informations utilisateur.</p>
							<button class="bg-gradient-to-r from-red-400 from-opacity-30 to-orange-400 to-opacity-30 hover:from-red-400 hover:from-opacity-50 hover:to-orange-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-red-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 mt-4" data-route="/login">Se reconnecter</button>
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
async function getUserInfo() {
	try {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const response = await fetch('/api/me', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
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

	// Add this variable to store received messages
	let receivedMessages: Map<string, any[]> = new Map();

	function connectWebSocket() {
		// Utiliser l'URL complète du serveur backend
		ws = new WebSocket(
			`ws://localhost:3000/ws/chat?username=${encodeURIComponent(userData.username)}&userId=${userData.id}`
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
						console.log("🚫 User blocked:", data.username);
						blockedUsers.add(data.username);
						showBlockedMessage(data.username, true);
						break;
					case "user_unblocked":
						console.log("✅ User unblocked:", data.username);
						blockedUsers.delete(data.username);
						break;
					case "user_blocked_you":
						console.log("🚫 User blocked you:", data.username);
						usersWhoBlockedMe.add(data.username);
						showBlockedMessage(data.username, false);
						break;
					case "user_unblocked_you":
						console.log("✅ User unblocked you:", data.username);
						usersWhoBlockedMe.delete(data.username);
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
				<div class="p-4 text-red-500 text-center">
					<div class="mb-2">Connexion perdue</div>
					<button class="btn btn-sm" onclick="location.reload()">Reconnecter</button>
				</div>
			`;
		};

		ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			onlineUsersList.innerHTML = `
				<div class="p-4 text-red-500 text-center">
					Erreur de connexion
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
					<div class="p-4 text-gray-500 text-center">
						<div class="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
						<div class="mt-2">Récupération des utilisateurs...</div>
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
							<div class="p-4 text-red-500 text-center">
								Timeout - Impossible de récupérer les utilisateurs
								<button class="btn btn-sm mt-2" onclick="location.reload()">Recharger</button>
							</div>
						`;
					}
				}, 3000); // Timeout après 3 secondes
			} else {
				console.log("🔧 WebSocket not connected");
				// Si WebSocket n'est pas connecté, afficher un message d'erreur immédiatement
				onlineUsersList.innerHTML = `
					<div class="p-4 text-red-500 text-center">
						Erreur de connexion
						<button class="btn btn-sm mt-2" onclick="location.reload()">Reconnecter</button>
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
				<div class="p-4 text-cyan-400 text-center">
					Aucun utilisateur en ligne
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
				"p-3 border-b border-cyan-400 border-opacity-20 hover:bg-gray-700 hover:bg-opacity-30 cursor-pointer transition-all duration-300";
			userDiv.setAttribute("data-username", user.username);
			userDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${user.avatarUrl || "/public/default-avatar.png"}"
						 alt="${user.username}"
						 class="w-8 h-8 rounded-full border border-cyan-400 border-opacity-30">
					<div class="flex-1">
						<h4 class="font-medium text-cyan-400 text-sm">${user.username}</h4>
						<div class="flex items-center gap-1">
							<div class="w-2 h-2 bg-green-400 rounded-full shadow-sm" style="box-shadow: 0 0 10px #00ff41;"></div>
							<span class="text-xs text-green-400">En ligne</span>
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
			"p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer";
		userDiv.setAttribute("data-username", user.username);
		userDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<img src="${user.avatarUrl || "/public/default-avatar.png"}"
					 alt="${user.username}"
					 class="w-8 h-8 rounded-full">
				<div class="flex-1">
					<h4 class="font-medium text-gray-900 text-sm">${user.username}</h4>
					<div class="flex items-center gap-1">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<span class="text-xs text-green-600">En ligne</span>
					</div>
				</div>
				<div class="flex flex-col gap-1">
					<button class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" data-action="chat">
						💬
					</button>
					<button class="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600" data-action="profile">
						👤
					</button>
				</div>
			</div>
		`;

		userDiv.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const action = target.getAttribute('data-action');

			if (action === 'chat') {
				e.stopPropagation();
				startConversationWithUser(user.username);
			} else if (action === 'profile') {
				e.stopPropagation();
				// Navigate to user profile
				import("../router/router.js").then(({ router }) => {
					router.navigate(`/profile/${user.username}`);
				});
			} else if (!action) {
				// Click on the main area starts conversation
				startConversationWithUser(user.username);
			}
		});

		// Remove "Aucun utilisateur en ligne" message if it exists
		const noUsersMessage = onlineUsersList.querySelector(".text-gray-500");
		if (noUsersMessage) {
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
				<div class="p-4 text-gray-500 text-center">
					Aucune conversation
				</div>
			`;
			return;
		}

		conversations.forEach((conv) => {
			const convDiv = document.createElement("div");
			convDiv.className = `p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
				conv.unreadCount > 0 ? "bg-blue-50" : ""
			}`;
			convDiv.setAttribute('data-username', conv.partner.username);
			convDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${conv.partner.avatarUrl || "/public/default-avatar.png"}"
						 alt="${conv.partner.username}"
						 class="w-10 h-10 rounded-full">
					<div class="flex-1">
						<div class="flex justify-between items-center">
							<h4 class="font-medium text-gray-900">${conv.partner.username}</h4>
							${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">${conv.unreadCount}</span>` : ""}
						</div>
						<p class="text-sm text-gray-600 truncate">${conv.lastMessage}</p>
						<p class="text-xs text-gray-400">${new Date(conv.timestamp).toLocaleString()}</p>
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

		// Update header
		chatHeader.innerHTML = `
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h3 class="font-semibold text-gray-700">${username}</h3>
					<button class="text-blue-600 text-sm hover:underline" id="view-profile-btn">
						Voir profil
					</button>
				</div>
				<div class="flex gap-2">
					<button class="text-red-600 text-sm hover:underline" id="block-user-btn">
						Bloquer
					</button>
				</div>
			</div>
		`;

		// Add event listeners
		const viewProfileBtn = chatHeader.querySelector(
			"#view-profile-btn"
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
		const conversationElement = conversationsList.querySelector(`[data-username="${username}"]`);
		if (conversationElement) {
			// Remove the blue background indicating unread messages
			conversationElement.classList.remove('bg-blue-50');
			// Remove the red notification badge
			const badge = conversationElement.querySelector('.bg-red-500');
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
				<div class="text-center text-gray-500 py-8">
					Aucun message dans cette conversation
				</div>
			`;
			return;
		}

		// Check if current conversation is blocked
		const isBlocked = blockedUsers.has(currentConversation!);
		const isBlockedByMe = usersWhoBlockedMe.has(currentConversation!);

		if (isBlocked) {
			messagesContainer.innerHTML = `
				<div class="text-center text-gray-500 py-8">
					<div class="mb-4">
						<svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
						</svg>
						<h3 class="text-lg font-semibold text-gray-700 mb-2">Utilisateur bloqué</h3>
						<p class="text-gray-600">Vous avez bloqué cet utilisateur. Vous ne pouvez plus voir ses messages.</p>
					</div>
				</div>
			`;
			return;
		}

		if (isBlockedByMe) {
			messagesContainer.innerHTML = `
				<div class="text-center text-gray-500 py-8">
					<div class="mb-4">
						<svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
						</svg>
						<h3 class="text-lg font-semibold text-gray-700 mb-2">Cet utilisateur vous a bloqué</h3>
						<p class="text-gray-600">Vous ne pouvez plus envoyer de messages à cet utilisateur.</p>
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
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					msg.sender === "me"
						? "bg-blue-500 text-white"
						: "bg-gray-200 text-gray-800"
				}">
					<p class="text-sm">${msg.content}</p>
					<p class="text-xs opacity-75 mt-1">${new Date(msg.timestamp).toLocaleString()}</p>
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
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					data.sender === "me" || data.sender === userData.username
						? "bg-blue-500 text-white"
						: "bg-gray-200 text-gray-800"
				}">
					<p class="text-sm">${data.content}</p>
					<p class="text-xs opacity-75 mt-1">${new Date(data.timestamp).toLocaleString()}</p>
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
				showError(
					"Vous ne pouvez pas envoyer de messages à cet utilisateur car vous l'avez bloqué."
				);
				return;
			}

			if (usersWhoBlockedMe.has(currentConversation)) {
				showError(
					"Vous ne pouvez pas envoyer de messages à cet utilisateur car il vous a bloqué."
				);
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
		alert(`Profil de ${profile.username}:\nPartites jouées: ${profile.gamesPlayed}\nVictoires: ${profile.wins}\nDéfaites: ${profile.losses}`);
	}

	function blockUser(username: string) {
		if (confirm(`Êtes-vous sûr de vouloir bloquer ${username} ?`)) {
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
			"fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg";
		errorDiv.textContent = message;
		document.body.appendChild(errorDiv);

		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	function showBlockedMessage(username: string, isBlockedByMe: boolean) {
		const message = isBlockedByMe
			? `Vous avez bloqué ${username}. Vous ne recevrez plus ses messages.`
			: `${username} vous a bloqué. Vous ne pouvez plus lui envoyer de messages.`;

		showError(message);
	}

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
			refreshButton.innerHTML = "Rafraîchir la liste";
			refreshButton.title = "Rafraîchir la liste";
			refreshButton.addEventListener("click", refreshOnlineUsersList);
			header.appendChild(refreshButton);
		}
	}
}
