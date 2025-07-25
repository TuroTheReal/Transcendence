import { FastifyInstance } from "fastify";
import "@fastify/websocket";
import { PrismaClient } from "@prisma/client";

// Store active connections with user information
const activeConnections = new Map<
	string,
	{
		connection: any;
		userId: number;
		username: string;
	}
>();

/**
 * Enhanced chat WebSocket routes with direct messaging, blocking, and notifications
 *
 * @param fastify - Fastify instance
 * @param prisma - Prisma client instance
 */
export default async function chatWebSocketRoutes(
	fastify: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	console.log("🔧 Registering WebSocket route: /ws/chat");

	fastify.get("/ws/chat", { websocket: true }, async (connection, req) => {
		console.log("🔧 New WebSocket connection from:", req.ip);

		// Extract user info from query parameters or headers
		const query = req.query as { username?: string; userId?: string };
		const username = query.username;
		const userId = query.userId;

		if (!username || !userId) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "Missing user information",
				})
			);
			connection.close();
			return;
		}

		// Get the actual user ID from database
		const user = await prisma.user.findUnique({
			where: { username: username },
		});

		if (!user) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "User not found in database",
				})
			);
			connection.close();
			return;
		}

		// Store connection with actual user info from database
		activeConnections.set(username, {
			connection,
			userId: user.id,
			username,
		});

		console.log(`🔗 User ${username} connected`);

		// Send welcome message
		connection.send(
			JSON.stringify({
				type: "connection_established",
				message: "Connected to chat server",
				username: username,
			})
		);

		// Envoyer immédiatement les utilisateurs en ligne (pas de setTimeout)
		const onlineUsersData = await getOnlineUsersData(prisma, username);
		connection.send(
			JSON.stringify({
				type: "online_users",
				users: onlineUsersData,
			})
		);

		// Get user data for broadcast
		const userData = await prisma.user.findUnique({
			where: { username: username },
			select: {
				username: true,
				avatarUrl: true,
			},
		});

		// Notify other users that a new user is online
		if (userData) {
			broadcastToAll(
				{
					type: "user_online",
					user: userData,
				},
				username
			);
		}

		connection.on("message", async (message: Buffer) => {
			try {
				const data = JSON.parse(message.toString());
				console.log("🔧 Received message:", data);

				switch (data.type) {
					case "direct_message":
						await handleDirectMessage(
							data,
							username,
							user.id,
							prisma
						);
						break;
					case "block_user":
						await handleBlockUser(data, user.id, prisma);
						break;
					case "unblock_user":
						await handleUnblockUser(data, user.id, prisma);
						break;
					case "get_user_profile":
						await handleGetUserProfile(data, connection, prisma);
						break;
					case "get_conversations":
						await handleGetConversations(
							user.id,
							connection,
							prisma
						);
						break;
					case "get_messages":
						console.log(
							"🔧 Processing get_messages with data:",
							data
						);
						await handleGetMessages(
							data,
							user.id,
							connection,
							prisma
						);
						break;
					case "get_online_users":
						await handleGetOnlineUsers(
							connection,
							prisma,
							username
						);
						break;
					default:
						console.log("🔧 Unknown message type:", data.type);
						connection.send(
							JSON.stringify({
								type: "error",
								message: "Unknown message type",
							})
						);
				}
			} catch (error) {
				console.error("❌ Error processing message:", error);
				connection.send(
					JSON.stringify({
						type: "error",
						message: "Invalid message format",
					})
				);
			}
		});

		connection.on("close", (code: number, reason: string) => {
			console.log(`🔌 User ${username} disconnected:`, code, reason);
			activeConnections.delete(username);

			// Notify other users
			broadcastToAll(
				{
					type: "user_offline",
					username: username,
				},
				username
			);
		});

		connection.on("error", (error: Error) => {
			console.error(`❌ WebSocket error for ${username}:`, error);
		});
	});

	console.log("✅ WebSocket route registered successfully");
}

/**
 * Handle direct message sending with blocking check
 *
 * @param data - Message data
 * @param senderUsername - Username of the sender
 * @param senderId - ID of the sender
 * @param prisma - Prisma client
 */
async function handleDirectMessage(
	data: any,
	senderUsername: string,
	senderId: number,
	prisma: PrismaClient
) {
	const { receiverUsername, content } = data;

	if (!receiverUsername || !content) {
		return;
	}

	try {
		// Get receiver user
		const receiver = await prisma.user.findUnique({
			where: { username: receiverUsername },
		});

		if (!receiver) {
			sendToUser(senderUsername, {
				type: "error",
				message: "Receiver user not found",
			});
			return;
		}

		// Check if sender is blocked by receiver
		const isBlocked = await prisma.block.findFirst({
			where: {
				blockerId: receiver.id,
				blockedId: senderId,
			},
		});

		if (isBlocked) {
			console.log(
				"🔧 Sender is blocked by receiver ",
				senderUsername,
				"by",
				receiverUsername
			);
			sendToUser(senderUsername, {
				type: "error",
				message:
					"You cannot send messages to the user " +
					receiverUsername +
					" because you are " +
					senderUsername,
			});
			return;
		}

		// Save message to database
		const savedMessage = await prisma.message.create({
			data: {
				senderId: senderId,
				receiverId: receiver.id,
				content: content,
			},
		});

		const messageData = {
			type: "direct_message",
			id: savedMessage.id,
			sender: senderUsername,
			receiver: receiverUsername,
			content: content,
			timestamp: savedMessage.createdAt.toISOString(),
			isRead: false,
		};

		// Send message to sender (so they see it in their conversation)
		sendToUser(senderUsername, {
			type: "direct_message",
			id: savedMessage.id,
			sender: "me", // Show as "me" for the sender
			receiver: receiverUsername,
			content: content,
			timestamp: savedMessage.createdAt.toISOString(),
			isRead: true, // Mark as read for sender since they sent it
		});

		// Send to receiver if online
		if (activeConnections.has(receiverUsername)) {
			sendToUser(receiverUsername, messageData);
		}
	} catch (error) {
		console.error("❌ Error handling direct message:", error);
		sendToUser(senderUsername, {
			type: "error",
			message: "Failed to send message",
		});
	}
}

/**
 * Handle user blocking
 *
 * @param data - Block data
 * @param blockerId - ID of the user doing the blocking
 * @param prisma - Prisma client
 */
async function handleBlockUser(
	data: any,
	blockerId: number,
	prisma: PrismaClient
) {
	const { usernameToBlock } = data;

	try {
		const userToBlock = await prisma.user.findUnique({
			where: { username: usernameToBlock },
		});

		if (!userToBlock) {
			sendToUserById(blockerId, {
				type: "error",
				message: "User not found",
			});
			return;
		}

		// Create block relationship
		await prisma.block.create({
			data: {
				blockerId: blockerId,
				blockedId: userToBlock.id,
			},
		});

		// Notify the blocker
		sendToUserById(blockerId, {
			type: "user_blocked",
			username: usernameToBlock,
		});

		// Notify the blocked user (if online)
		if (activeConnections.has(usernameToBlock)) {
			sendToUser(usernameToBlock, {
				type: "user_blocked_you",
				username:
					activeConnections.get(usernameToBlock)?.username || "",
			});
		}
	} catch (error) {
		console.error("❌ Error blocking user:", error);
		sendToUserById(blockerId, {
			type: "error",
			message: "Failed to block user",
		});
	}
}

/**
 * Handle user unblocking
 *
 * @param data - Unblock data
 * @param unblockerId - ID of the user doing the unblocking
 * @param prisma - Prisma client
 */
async function handleUnblockUser(
	data: any,
	unblockerId: number,
	prisma: PrismaClient
) {
	const { usernameToUnblock } = data;

	try {
		const userToUnblock = await prisma.user.findUnique({
			where: { username: usernameToUnblock },
		});

		if (!userToUnblock) {
			sendToUserById(unblockerId, {
				type: "error",
				message: "User not found",
			});
			return;
		}

		// Remove block relationship
		await prisma.block.deleteMany({
			where: {
				blockerId: unblockerId,
				blockedId: userToUnblock.id,
			},
		});

		// Notify the unblocker
		sendToUserById(unblockerId, {
			type: "user_unblocked",
			username: usernameToUnblock,
		});

		// Notify the unblocked user (if online)
		if (activeConnections.has(usernameToUnblock)) {
			sendToUser(usernameToUnblock, {
				type: "user_unblocked_you",
				username:
					activeConnections.get(usernameToUnblock)?.username || "",
			});
		}
	} catch (error) {
		console.error("❌ Error unblocking user:", error);
		sendToUserById(unblockerId, {
			type: "error",
			message: "Failed to unblock user",
		});
	}
}

/**
 * Handle getting user profile
 *
 * @param data - Request data
 * @param connection - WebSocket connection
 * @param prisma - Prisma client
 */
async function handleGetUserProfile(
	data: any,
	connection: any,
	prisma: PrismaClient
) {
	const { username } = data;

	try {
		const user = await prisma.user.findUnique({
			where: { username },
			select: {
				username: true,
				avatarUrl: true,
				gamesPlayed: true,
				wins: true,
				losses: true,
				createdAt: true,
			},
		});

		if (!user) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "User not found",
				})
			);
			return;
		}

		connection.send(
			JSON.stringify({
				type: "user_profile",
				profile: user,
			})
		);
	} catch (error) {
		console.error("❌ Error getting user profile:", error);
		connection.send(
			JSON.stringify({
				type: "error",
				message: "Failed to get user profile",
			})
		);
	}
}

/**
 * Handle getting user conversations
 *
 * @param userId - ID of the user
 * @param connection - WebSocket connection
 * @param prisma - Prisma client
 */
async function handleGetConversations(
	userId: number,
	connection: any,
	prisma: PrismaClient
) {
	try {
		// Get all users the current user has messaged with
		const conversations = await prisma.message.findMany({
			where: {
				OR: [{ senderId: userId }, { receiverId: userId }],
			},
			include: {
				sender: {
					select: { username: true, avatarUrl: true },
				},
				receiver: {
					select: { username: true, avatarUrl: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Group by conversation partner
		const conversationMap = new Map();
		conversations.forEach((msg: any) => {
			const partnerId =
				msg.senderId === userId ? msg.receiverId : msg.senderId;
			const partner = msg.senderId === userId ? msg.receiver : msg.sender;

			if (!conversationMap.has(partnerId)) {
				conversationMap.set(partnerId, {
					partner: partner,
					lastMessage: msg.content,
					timestamp: msg.createdAt,
					unreadCount: 0,
				});
			}
		});

		// Count unread messages
		const unreadMessages = await prisma.message.findMany({
			where: {
				receiverId: userId,
				isRead: false,
			},
		});

		unreadMessages.forEach((msg: any) => {
			const conversation = conversationMap.get(msg.senderId);
			if (conversation) {
				conversation.unreadCount++;
			}
		});

		connection.send(
			JSON.stringify({
				type: "conversations",
				conversations: Array.from(conversationMap.values()),
			})
		);
	} catch (error) {
		console.error("❌ Error getting conversations:", error);
		connection.send(
			JSON.stringify({
				type: "error",
				message: "Failed to get conversations",
			})
		);
	}
}

/**
 * Handle getting messages between two users
 *
 * @param data - Request data
 * @param userId - ID of the current user
 * @param connection - WebSocket connection
 * @param prisma - Prisma client
 */
async function handleGetMessages(
	data: any,
	userId: number,
	connection: any,
	prisma: PrismaClient
) {
	const { otherUsername } = data;

	// Add debug logging
	console.log("🔧 handleGetMessages called with data:", data);
	console.log("🔧 otherUsername:", otherUsername);
	console.log("🔧 userId:", userId);

	if (!otherUsername) {
		console.error("❌ otherUsername is undefined or null");
		connection.send(
			JSON.stringify({
				type: "error",
				message: "otherUsername is required",
			})
		);
		return;
	}

	try {
		const otherUser = await prisma.user.findUnique({
			where: { username: otherUsername },
		});

		if (!otherUser) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "User not found",
				})
			);
			return;
		}

		// Get messages between the two users
		const messages = await prisma.message.findMany({
			where: {
				OR: [
					{
						senderId: userId,
						receiverId: otherUser.id,
					},
					{
						senderId: otherUser.id,
						receiverId: userId,
					},
				],
			},
			orderBy: { createdAt: "asc" },
		});

		// Mark messages as read
		await prisma.message.updateMany({
			where: {
				senderId: otherUser.id,
				receiverId: userId,
				isRead: false,
			},
			data: { isRead: true },
		});

		connection.send(
			JSON.stringify({
				type: "messages",
				messages: messages.map((msg: any) => ({
					id: msg.id,
					sender: msg.senderId === userId ? "me" : otherUsername,
					content: msg.content,
					timestamp: msg.createdAt.toISOString(),
					isRead: msg.isRead,
				})),
			})
		);
	} catch (error) {
		console.error("❌ Error getting messages:", error);
		connection.send(
			JSON.stringify({
				type: "error",
				message: "Failed to get messages",
			})
		);
	}
}

/**
 * Send message to specific user by username
 *
 * @param username - Username of the target user
 * @param data - Data to send
 */
function sendToUser(username: string, data: any) {
	const connection = activeConnections.get(username);
	if (connection) {
		connection.connection.send(JSON.stringify(data));
	}
}

/**
 * Send message to specific user by ID
 *
 * @param userId - ID of the target user
 * @param data - Data to send
 */
function sendToUserById(userId: number, data: any) {
	for (const [username, conn] of activeConnections) {
		if (conn.userId === userId) {
			conn.connection.send(JSON.stringify(data));
			break;
		}
	}
}

/**
 * Broadcast message to all connected users except sender
 *
 * @param data - Data to broadcast
 * @param excludeUsername - Username to exclude from broadcast
 */
function broadcastToAll(data: any, excludeUsername?: string) {
	for (const [username, conn] of activeConnections) {
		if (username !== excludeUsername) {
			conn.connection.send(JSON.stringify(data));
		}
	}
}

/**
 * Send tournament notification to specific user
 *
 * @param username - Username of the target user
 * @param message - Notification message
 */
export function sendTournamentNotification(username: string, message: string) {
	sendToUser(username, {
		type: "tournament_notification",
		message: message,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Get online users data with caching and race condition protection
 *
 * @param prisma - Prisma client
 * @param excludeUsername - Username to exclude from the list
 * @returns Array of user objects with username and avatarUrl
 */
async function getOnlineUsersData(
	prisma: PrismaClient,
	excludeUsername: string
) {
	try {
		const onlineUsernames = Array.from(activeConnections.keys()).filter(
			(u) => u !== excludeUsername
		);

		console.log("🔧 Online usernames:", onlineUsernames);

		if (onlineUsernames.length === 0) {
			console.log("🔧 No online users found");
			return [];
		}

		// Réduire le timeout à 1 seconde pour être plus rapide
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("Database timeout")), 1000);
		});

		const usersPromise = prisma.user.findMany({
			where: {
				username: {
					in: onlineUsernames,
				},
			},
			select: {
				username: true,
				avatarUrl: true,
			},
		});

		const users = await Promise.race([usersPromise, timeoutPromise]);
		console.log("🔧 Retrieved users from database:", users);
		return users;
	} catch (error) {
		console.error("❌ Error getting online users data:", error);
		return [];
	}
}

/**
 * Handle getting online users request with debouncing
 *
 * @param connection - WebSocket connection
 * @param prisma - Prisma client
 * @param currentUsername - Current user's username
 */
async function handleGetOnlineUsers(
	connection: any,
	prisma: PrismaClient,
	currentUsername: string
) {
	try {
		const onlineUsersData = await getOnlineUsersData(
			prisma,
			currentUsername
		);
		connection.send(
			JSON.stringify({
				type: "online_users",
				users: onlineUsersData,
			})
		);
	} catch (error) {
		console.error("❌ Error handling get online users:", error);
		connection.send(
			JSON.stringify({
				type: "error",
				message: "Failed to get online users",
			})
		);
	}
}
