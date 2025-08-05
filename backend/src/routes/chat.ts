import { FastifyInstance } from "fastify";
import "@fastify/websocket";
import { PrismaClient } from "@prisma/client";

// Store active connections with user information
export const activeConnections = new Map<
	string,
	{
		connection: any;
		userId: number;
		username: string;
	}
>();

export default async function chatWebSocketRoutes(
	fastify: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	fastify.get("/ws/chat", { websocket: true }, async (connection, req) => {
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

		activeConnections.set(username, {
			connection,
			userId: user.id,
			username,
		});

		connection.send(
			JSON.stringify({
				type: "connection_established",
				message: "Connected to chat server",
				username: username,
			})
		);

		const onlineUsersData = await getOnlineUsersData(prisma, username);
		connection.send(
			JSON.stringify({
				type: "online_users",
				users: onlineUsersData,
			})
		);

		const userData = await prisma.user.findUnique({
			where: { username: username },
			select: {
				username: true,
				avatarUrl: true,
			},
		});

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
					case "send_game_invite":
						await handleSendGameInvite(
							data,
							user.id,
							username,
							prisma
						);
						break;
					case "accept_game_invite":
						await handleAcceptGameInvite(
							data,
							user.id,
							username,
							prisma
						);
						break;
					case "decline_game_invite":
						await handleDeclineGameInvite(
							data,
							user.id,
							username,
							prisma
						);
						break;
					default:
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
			activeConnections.delete(username);

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
			sendToUser(senderUsername, {
				type: "error",
				message:
					"You cannot send messages to the user " +
					receiverUsername +
					" because you are blocked by " +
					receiverUsername,
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

		sendToUser(senderUsername, {
			type: "direct_message",
			id: savedMessage.id,
			sender: "me",
			receiver: receiverUsername,
			content: content,
			timestamp: savedMessage.createdAt.toISOString(),
			isRead: true,
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

		await prisma.block.create({
			data: {
				blockerId: blockerId,
				blockedId: userToBlock.id,
			},
		});

		sendToUserById(blockerId, {
			type: "user_blocked",
			username: usernameToBlock,
		});

		if (activeConnections.has(usernameToBlock)) {
			sendToUser(usernameToBlock, {
				type: "user_blocked_you",
				username:
					activeConnections.get(usernameToBlock)?.username || "",
			});
		}
	} catch (error) {
		sendToUserById(blockerId, {
			type: "error",
			message: "Failed to block user",
		});
	}
}

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

		await prisma.block.deleteMany({
			where: {
				blockerId: unblockerId,
				blockedId: userToUnblock.id,
			},
		});

		sendToUserById(unblockerId, {
			type: "user_unblocked",
			username: usernameToUnblock,
		});

		if (activeConnections.has(usernameToUnblock)) {
			sendToUser(usernameToUnblock, {
				type: "user_unblocked_you",
				username:
					activeConnections.get(usernameToUnblock)?.username || "",
			});
		}
	} catch (error) {
		sendToUserById(unblockerId, {
			type: "error",
			message: "Failed to unblock user",
		});
	}
}

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

async function handleGetConversations(
	userId: number,
	connection: any,
	prisma: PrismaClient
) {
	try {
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

async function handleGetMessages(
	data: any,
	userId: number,
	connection: any,
	prisma: PrismaClient
) {
	const { otherUsername } = data;

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

function sendToUser(username: string, data: any) {
	const connection = activeConnections.get(username);
	if (connection) {
		connection.connection.send(JSON.stringify(data));
	}
}

function sendToUserById(userId: number, data: any) {
	for (const [username, conn] of activeConnections) {
		if (conn.userId === userId) {
			conn.connection.send(JSON.stringify(data));
			break;
		}
	}
}

function broadcastToAll(data: any, excludeUsername?: string) {
	for (const [username, conn] of activeConnections) {
		if (username !== excludeUsername) {
			conn.connection.send(JSON.stringify(data));
		}
	}
}

export function sendTournamentNotification(username: string, message: string) {
	sendToUser(username, {
		type: "tournament_notification",
		message: message,
		timestamp: new Date().toISOString(),
	});
}

async function handleSendGameInvite(
	data: any,
	senderId: number,
	senderUsername: string,
	prisma: PrismaClient
) {
	const { receiverUsername } = data;

	if (!receiverUsername) {
		return;
	}

	try {
		const receiver = await prisma.user.findUnique({
			where: { username: receiverUsername },
		});

		if (!receiver) {
			sendToUser(senderUsername, {
				type: "error",
				message: "User not found",
			});
			return;
		}

		const isBlocked = await prisma.block.findFirst({
			where: {
				blockerId: receiver.id,
				blockedId: senderId,
			},
		});

		if (isBlocked) {
			sendToUser(senderUsername, {
				type: "error",
				message: "Cannot send game invitation to this user",
			});
			return;
		}

		// Clean up old processed invitations between these users (older than 1 hour)
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		await prisma.gameInvite.deleteMany({
			where: {
				OR: [
					{
						inviterId: senderId,
						inviteeId: receiver.id,
						status: { in: ["accepted", "declined"] },
						createdAt: { lt: oneHourAgo }
					},
					{
						inviterId: receiver.id,
						inviteeId: senderId,
						status: { in: ["accepted", "declined"] },
						createdAt: { lt: oneHourAgo }
					}
				]
			}
		});

		const existingInvite = await prisma.gameInvite.findFirst({
			where: {
				inviterId: senderId,
				inviteeId: receiver.id,
				status: "pending",
			},
		});

		if (existingInvite) {
			sendToUser(senderUsername, {
				type: "error",
				message:
					"You already have a pending game invitation to this user",
			});
			return;
		}

		const gameInvite = await prisma.gameInvite.create({
			data: {
				inviterId: senderId,
				inviteeId: receiver.id,
				status: "pending",
			},
		});

		if (activeConnections.has(receiverUsername)) {
			sendToUser(receiverUsername, {
				type: "game_invite_received",
				inviteId: gameInvite.id,
				senderUsername: senderUsername,
				timestamp: new Date().toISOString(),
			});
		}

		sendToUser(senderUsername, {
			type: "game_invite_sent",
			receiverUsername: receiverUsername,
			inviteId: gameInvite.id,
		});
	} catch (error) {
		console.error("❌ Error sending game invite:", error);
		sendToUser(senderUsername, {
			type: "error",
			message: "Failed to send game invitation",
		});
	}
}

async function handleAcceptGameInvite(
	data: any,
	userId: number,
	username: string,
	prisma: PrismaClient
) {
	const { inviteId } = data;

	if (!inviteId) {
		return;
	}

	try {
		const invite = await prisma.gameInvite.findUnique({
			where: { id: inviteId },
			include: {
				inviter: { select: { username: true } },
				invitee: { select: { username: true } },
			},
		});

		if (!invite || invite.inviteeId !== userId) {
			sendToUser(username, {
				type: "error",
				message: "Invalid game invitation",
			});
			return;
		}

		if (invite.status !== "pending") {
			sendToUser(username, {
				type: "error",
				message: "Game invitation already processed",
			});
			return;
		}

		// Generate a unique game room ID
		const gameRoomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Update the invitation with the game room ID
		await prisma.gameInvite.update({
			where: { id: inviteId },
			data: { 
				status: "accepted",
				gameRoomId: gameRoomId
			},
		});

		// Send redirect message to both players
		if (activeConnections.has(invite.inviter.username)) {
			sendToUser(invite.inviter.username, {
				type: "redirect_to_game",
				gameRoomId: gameRoomId,
				opponent: username,
				message: "Game invitation accepted! Redirecting to game...",
			});
		}

		sendToUser(username, {
			type: "redirect_to_game",
			gameRoomId: gameRoomId,
			opponent: invite.inviter.username,
			message: "Game invitation accepted! Redirecting to game...",
		});
	} catch (error) {
		console.error("❌ Error accepting game invite:", error);
		sendToUser(username, {
			type: "error",
			message: "Failed to accept game invitation",
		});
	}
}

async function handleDeclineGameInvite(
	data: any,
	userId: number,
	username: string,
	prisma: PrismaClient
) {
	const { inviteId } = data;

	if (!inviteId) {
		return;
	}

	try {
		// Find the invitation
		const invite = await prisma.gameInvite.findUnique({
			where: { id: inviteId },
			include: {
				inviter: { select: { username: true } },
				invitee: { select: { username: true } },
			},
		});

		if (!invite || invite.inviteeId !== userId) {
			sendToUser(username, {
				type: "error",
				message: "Invalid game invitation",
			});
			return;
		}

		if (invite.status !== "pending") {
			sendToUser(username, {
				type: "error",
				message: "Game invitation already processed",
			});
			return;
		}

		// Update invitation status
		await prisma.gameInvite.update({
			where: { id: inviteId },
			data: { status: "declined" },
		});

		// Notify sender
		if (activeConnections.has(invite.inviter.username)) {
			sendToUser(invite.inviter.username, {
				type: "game_invite_declined",
				receiverUsername: username,
				inviteId: inviteId,
			});
		}

		// Confirm to receiver
		sendToUser(username, {
			type: "game_invite_response",
			status: "declined",
			senderUsername: invite.inviter.username,
		});

		// Clean up the declined invitation after a short delay to allow immediate re-invitation
		setTimeout(async () => {
			try {
				await prisma.gameInvite.delete({
					where: { id: inviteId }
				});
			} catch (error) {
				console.error("Error cleaning up declined invitation:", error);
			}
		}, 5000); // 5 seconds delay
	} catch (error) {
		console.error("❌ Error declining game invite:", error);
		sendToUser(username, {
			type: "error",
			message: "Failed to decline game invitation",
		});
	}
}

async function getOnlineUsersData(
	prisma: PrismaClient,
	excludeUsername: string
) {
	try {
		const onlineUsernames = Array.from(activeConnections.keys()).filter(
			(u) => u !== excludeUsername
		);

		if (onlineUsernames.length === 0) {
			return [];
		}

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
		return users;
	} catch (error) {
		console.error("❌ Error getting online users data:", error);
		return [];
	}
}

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
