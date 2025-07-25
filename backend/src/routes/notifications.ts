import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

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
