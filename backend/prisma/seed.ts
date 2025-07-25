import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seed...");

	// Hash password for all users
	const hashedPassword = await bcrypt.hash("password123", 10);

	// Create users
	const users = await Promise.all([
		prisma.user.upsert({
			where: { username: "alice" },
			update: {},
			create: {
				username: "alice",
				email: "alice@example.com",
				passwordHash: hashedPassword,
				avatarUrl:
					"https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
				gamesPlayed: 23,
				wins: 15,
				losses: 8,
			},
		}),
		prisma.user.upsert({
			where: { username: "bob" },
			update: {},
			create: {
				username: "bob",
				email: "bob@example.com",
				passwordHash: hashedPassword,
				avatarUrl:
					"https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
				wins: 12,
				losses: 10,
			},
		}),
		prisma.user.upsert({
			where: { username: "charlie" },
			update: {},
			create: {
				username: "charlie",
				email: "charlie@example.com",
				passwordHash: hashedPassword,
				avatarUrl:
					"https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
				wins: 8,
				losses: 15,
			},
		}),
		prisma.user.upsert({
			where: { username: "diana" },
			update: {},
			create: {
				username: "diana",
				email: "diana@example.com",
				passwordHash: hashedPassword,
				avatarUrl:
					"https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
				wins: 20,
				losses: 5,
			},
		}),
		prisma.user.upsert({
			where: { username: "eve" },
			update: {},
			create: {
				username: "eve",
				email: "eve@example.com",
				passwordHash: hashedPassword,
				avatarUrl:
					"https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
				wins: 6,
				losses: 12,
			},
		}),
	]);

	console.log(
		"✅ Users created:",
		users.map((u) => u.username)
	);

	// Create some matches
	const matches = await Promise.all([
		prisma.match.create({
			data: {
				player1Id: users[0].id, // alice
				player2Id: users[1].id, // bob
				score1: 10,
				score2: 8,
				winnerId: users[0].id, // alice wins
			},
		}),
		prisma.match.create({
			data: {
				player1Id: users[1].id, // bob
				player2Id: users[2].id, // charlie
				score1: 7,
				score2: 10,
				winnerId: users[2].id, // charlie wins
			},
		}),
		prisma.match.create({
			data: {
				player1Id: users[3].id, // diana
				player2Id: users[4].id, // eve
				score1: 10,
				score2: 3,
				winnerId: users[3].id, // diana wins
			},
		}),
	]);

	console.log("✅ Matches created:", matches.length);

	// Create some messages
	const messages = await Promise.all([
		prisma.message.create({
			data: {
				senderId: users[0].id, // alice
				receiverId: users[1].id, // bob
				content: "Salut Bob ! Tu veux jouer une partie ?",
			},
		}),
		prisma.message.create({
			data: {
				senderId: users[1].id, // bob
				receiverId: users[0].id, // alice
				content: "Bien sûr Alice ! Je suis prêt !",
			},
		}),
		prisma.message.create({
			data: {
				senderId: users[2].id, // charlie
				receiverId: users[3].id, // diana
				content: "GG pour la partie Diana !",
			},
		}),
	]);

	console.log("✅ Messages created:", messages.length);

	// Create some game invites
	const invites = await Promise.all([
		prisma.gameInvite.create({
			data: {
				inviterId: users[0].id, // alice
				inviteeId: users[2].id, // charlie
				status: "pending",
			},
		}),
		prisma.gameInvite.create({
			data: {
				inviterId: users[3].id, // diana
				inviteeId: users[4].id, // eve
				status: "accepted",
			},
		}),
	]);

	console.log("✅ Game invites created:", invites.length);

	// Create some notifications
	const notifications = await Promise.all([
		prisma.notification.create({
			data: {
				userId: users[0].id, // alice
				type: "tournament",
				message: "Un nouveau tournoi commence dans 1 heure !",
			},
		}),
		prisma.notification.create({
			data: {
				userId: users[1].id, // bob
				type: "game",
				message: "Charlie vous a invité à jouer",
			},
		}),
	]);

	console.log("✅ Notifications created:", notifications.length);

	console.log("🎉 Database seed completed successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Error during seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
