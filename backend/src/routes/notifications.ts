import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { sendTournamentNotification } from "./chat.js";

/**
 * Register notification routes for tournament and game notifications
 *
 * @param app - Fastify instance
 * @param prisma - Prisma client instance
 */
export async function registerNotificationRoutes(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
) {
	/**
	 * Send tournament notification to all users
	 */
	app.post("/api/notifications/tournament", async (request, reply) => {
		try {
			const { message } = request.body as { message: string };

			if (!message) {
				return reply.code(400).send({ error: "Message is required" });
			}

			// Get all users
			const users = await prisma.user.findMany({
				select: { id: true, username: true },
			});

			// Create notifications for all users
			const notifications = await Promise.all(
				users.map((user) =>
					prisma.notification.create({
						data: {
							userId: user.id,
							type: "tournament",
							message: message,
						},
					})
				)
			);

			// Send real-time notifications via WebSocket to online users
			users.forEach((user) => {
				sendTournamentNotification(user.username, message);
			});

			reply.code(200).send({
				success: true,
				notificationsCreated: notifications.length,
			});
		} catch (error) {
			console.error("❌ Error creating tournament notification:", error);
			reply.code(500).send({ error: "Failed to create notification" });
		}
	});

	/**
	 * Send tournament notification to specific user
	 */
	app.post("/api/notifications/tournament/user", async (request, reply) => {
		try {
			const { username, message } = request.body as { username: string; message: string };

			if (!username || !message) {
				return reply.code(400).send({ error: "Username and message are required" });
			}

			// Find the user
			const user = await prisma.user.findUnique({
				where: { username },
				select: { id: true, username: true },
			});

			if (!user) {
				return reply.code(404).send({ error: "User not found" });
			}

			// Create notification in database
			const notification = await prisma.notification.create({
				data: {
					userId: user.id,
					type: "tournament",
					message: message,
				},
			});

			// Send real-time notification via WebSocket if user is online
			sendTournamentNotification(user.username, message);

			reply.code(200).send({
				success: true,
				notification,
			});
		} catch (error) {
			console.error("❌ Error creating user tournament notification:", error);
			reply.code(500).send({ error: "Failed to create notification" });
		}
	});

	/**
	 * Send tournament game notification (next game alert)
	 */
	app.post("/api/notifications/tournament/next-game", async (request, reply) => {
		try {
			const { player1, player2, message } = request.body as { 
				player1: string; 
				player2?: string; 
				message?: string;
			};

			if (!player1) {
				return reply.code(400).send({ error: "Player1 username is required" });
			}

			const defaultMessage = player2 
				? `Your tournament match against ${player2} is ready! Get ready to play Pong.`
				: `Your next tournament game is ready! Get ready to play Pong.`;
			
			const notificationMessage = message || defaultMessage;

			// Find player1
			const user1 = await prisma.user.findUnique({
				where: { username: player1 },
				select: { id: true, username: true },
			});

			if (!user1) {
				return reply.code(404).send({ error: "Player1 not found" });
			}

			let notifications = [];

			// Create notification for player1
			const notification1 = await prisma.notification.create({
				data: {
					userId: user1.id,
					type: "tournament",
					message: notificationMessage,
				},
			});
			notifications.push(notification1);

			// Send real-time notification to player1
			sendTournamentNotification(user1.username, notificationMessage);

			// If player2 exists, notify them too
			if (player2) {
				const user2 = await prisma.user.findUnique({
					where: { username: player2 },
					select: { id: true, username: true },
				});

				if (user2) {
					const player2Message = `Your tournament match against ${player1} is ready! Get ready to play Pong.`;
					
					const notification2 = await prisma.notification.create({
						data: {
							userId: user2.id,
							type: "tournament",
							message: player2Message,
						},
					});
					notifications.push(notification2);

					// Send real-time notification to player2
					sendTournamentNotification(user2.username, player2Message);
				}
			}

			reply.code(200).send({
				success: true,
				notifications,
			});
		} catch (error) {
			console.error("❌ Error creating tournament game notification:", error);
			reply.code(500).send({ error: "Failed to create notification" });
		}
	});

	/**
	 * Get user notifications
	 */
	app.get("/api/notifications/:userId", async (request, reply) => {
		try {
			const { userId } = request.params as { userId: string };
			const userIdNum = parseInt(userId);

			const notifications = await prisma.notification.findMany({
				where: { userId: userIdNum },
				orderBy: { createdAt: "desc" },
				take: 50,
			});

			reply.code(200).send({ notifications });
		} catch (error) {
			console.error("❌ Error getting notifications:", error);
			reply.code(500).send({ error: "Failed to get notifications" });
		}
	});

	/**
	 * Mark notification as read
	 */
	app.put(
		"/api/notifications/:notificationId/read",
		async (request, reply) => {
			try {
				const { notificationId } = request.params as {
					notificationId: string;
				};
				const notificationIdNum = parseInt(notificationId);

				await prisma.notification.update({
					where: { id: notificationIdNum },
					data: { isRead: true },
				});

				reply.code(200).send({ success: true });
			} catch (error) {
				console.error("❌ Error marking notification as read:", error);
				reply
					.code(500)
					.send({ error: "Failed to mark notification as read" });
			}
		}
	);

	/**
	 * Mark all notifications as read for a user
	 */
	app.put("/api/notifications/:userId/read-all", async (request, reply) => {
		try {
			const { userId } = request.params as { userId: string };
			const userIdNum = parseInt(userId);

			await prisma.notification.updateMany({
				where: { userId: userIdNum, isRead: false },
				data: { isRead: true },
			});

			reply.code(200).send({ success: true });
		} catch (error) {
			console.error("❌ Error marking all notifications as read:", error);
			reply
				.code(500)
				.send({ error: "Failed to mark notifications as read" });
		}
	});
}
