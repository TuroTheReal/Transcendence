
// version fusionne avec diagnostic SSL

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.devcontainer/.env');

const result = config({ path: envPath });
import { logger } from "./utils/logger.js";
import { metricsPlugin } from "./utils/metricsPlugin.js";
import fastify from "fastify";
import { registerNewUser } from "./routes/signup.js";
import { handleLogIn } from "./routes/login.js";
import { registerProfileRoute } from "./routes/profile.js";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import chatWebSocketRoutes from "./routes/chat.js";
import cookie from "@fastify/cookie";
import type { FastifyCookieOptions } from "@fastify/cookie";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerGameRoute } from "./routes/game.js";
import { GameManager } from "./game/GameManager.js";
import os from "os";
import { execSync } from "child_process";
import { twoFactorRoutes } from "./routes/two-factor.js";
import googleAuthRoutes from "./routes/google-auth.js";

// Configuration des chemins
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

// Extension du type FastifyRequest pour les métriques
declare module "fastify" {
	interface FastifyRequest {
		startTime?: number;
	}
}

// Configuration des ports adaptée à votre .env
const MAIN_PORT = process.env.MAIN_PORT
	? parseInt(process.env.MAIN_PORT)
	: 3002;
const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT
	? parseInt(process.env.HTTP_REDIRECT_PORT)
	: 8080;
const METRICS_PORT = process.env.METRICS_PORT
	? parseInt(process.env.METRICS_PORT)
	: 3001;

const PUBLIC_IP = process.env.PUBLIC_IP || "127.0.0.1";

const prisma = new PrismaClient();

// =============== GAME MANAGER SETUP ===============
let gameManager: GameManager;

// Fonction utilitaire pour détecter les requêtes Prometheus
function scrappingMessage(
	method: string,
	url: string,
	userAgent: string | undefined
) {
	if (url === "/metrics" && userAgent && userAgent.includes("Prometheus")) {
		return "Prometheus Scraping";
	}
	return null;
}

// Interface pour les options HTTPS
interface HttpsOptions {
	key: Buffer;
	cert: Buffer;
}

// Fonction améliorée pour diagnostiquer et charger les certificats SSL
const loadSSLCertificates = (): HttpsOptions | null => {
	console.log("🔍 === DIAGNOSTIC SSL ===");

	try {
		const sslPath = path.join(__dirname, "../ssl");
		const keyPath = path.join(sslPath, "key.pem");
		const certPath = path.join(sslPath, "cert.pem");

		// console.log(`🔍 Chemin SSL: ${sslPath}`);
		// console.log(`🔍 Dossier SSL existe: ${fs.existsSync(sslPath)}`);
		// console.log(`🔍 Fichier key.pem: ${keyPath}`);
		// console.log(`🔍 key.pem existe: ${fs.existsSync(keyPath)}`);
		// console.log(`🔍 Fichier cert.pem: ${certPath}`);
		// console.log(`🔍 cert.pem existe: ${fs.existsSync(certPath)}`);

		if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
			console.log("⚠️ Certificats SSL manquants - FORCER LE MODE HTTP");
			console.log("ℹ️ Le serveur démarrera en HTTP uniquement");
			return null;
		}

		// Tenter de lire les fichiers et vérifier leur contenu
		let keyContent: Buffer;
		let certContent: Buffer;

		try {
			keyContent = fs.readFileSync(keyPath);
			console.log(`✅ Clé privée lue: ${keyContent.length} bytes`);
		} catch (error) {
			console.error(`❌ Erreur lecture clé privée: ${(error as Error).message}`);
			return null;
		}

		try {
			certContent = fs.readFileSync(certPath);
			console.log(`✅ Certificat lu: ${certContent.length} bytes`);
		} catch (error) {
			console.error(`❌ Erreur lecture certificat: ${(error as Error).message}`);
			return null;
		}

		// Vérifier le format des certificats
		const keyStr = keyContent.toString();
		const certStr = certContent.toString();

		if (!keyStr.includes('-----BEGIN') || !keyStr.includes('-----END')) {
			console.error("❌ Format de clé privée invalide");
			return null;
		}

		if (!certStr.includes('-----BEGIN CERTIFICATE-----')) {
			console.error("❌ Format de certificat invalide");
			return null;
		}


		const httpsOptions: HttpsOptions = {
			key: keyContent,
			cert: certContent,
		};

		return httpsOptions;
	} catch (error: any) {
		console.error("❌ Erreur lors du diagnostic SSL:", error.message);
		console.log("⚠️ Le serveur fonctionnera en HTTP pour éviter les problèmes");
		return null;
	}
};

const httpsOptions = loadSSLCertificates();

// Création du serveur principal avec diagnostic amélioré
const app = fastify({
	logger: {
		level: "info",
	},
	...(httpsOptions && { https: httpsOptions }),
	trustProxy: true,
	disableRequestLogging: false,
});

// Création d'un serveur dédié pour les métriques (toujours en HTTP)
const metricsApp = fastify({
	logger: {
		level: "info",
	},
	trustProxy: true,
	disableRequestLogging: false,
});

// Configuration des hooks pour le serveur principal
app.addHook("onRequest", async (request, reply) => {
	request.startTime = Date.now();

	const scrapping = scrappingMessage(
		request.method,
		request.url,
		request.headers["user-agent"]
	);

	if (scrapping) {
		logger.debug({
			type: "prometheus_request",
			message: scrapping,
			method: request.method,
			url: request.url,
			ip: request.ip,
		});
	} else {
		logger.info({
			type: "http_request",
			method: request.method,
			url: request.url,
			ip: request.ip,
			userAgent: request.headers["user-agent"],
		});
	}
});

app.addHook("onResponse", async (request, reply) => {
	const responseTime = Date.now() - (request.startTime || 0);
	const scrapping = scrappingMessage(
		request.method,
		request.url,
		request.headers["user-agent"]
	);

	if (scrapping) {
		logger.debug({
			type: "prometheus_response",
			message: scrapping,
			method: request.method,
			url: request.url,
			statusCode: reply.statusCode,
			responseTime: responseTime,
		});
	} else {
		logger.info({
			type: "http_response",
			method: request.method,
			url: request.url,
			statusCode: reply.statusCode,
			responseTime: responseTime,
		});
	}
});

app.addHook("onError", async (request, reply, error) => {
	logger.error({
		type: "http_error",
		method: request.method,
		url: request.url,
		error: error.message,
		stack: error.stack,
	});
});

// Configuration similaire pour le serveur de métriques
metricsApp.addHook("onRequest", async (request, reply) => {
	request.startTime = Date.now();
	logger.debug({
		type: "metrics_request",
		method: request.method,
		url: request.url,
		ip: request.ip,
	});
});

metricsApp.addHook("onResponse", async (request, reply) => {
	const responseTime = Date.now() - (request.startTime || 0);
	logger.debug({
		type: "metrics_response",
		method: request.method,
		url: request.url,
		statusCode: reply.statusCode,
		responseTime: responseTime,
	});
});

// Configuration du serveur principal (application web)
const setupMainServer = async () => {
	console.log("📦 Configuration du serveur principal (application web)...");

	// Configuration des cookies avec clé secrète adaptée à votre .env
	await app.register(cookie, {
		secret:
			process.env.COOKIE_SECRET ||
			process.env.SECURITY_KEY ||
			"fallback-secret-key-for-dev",
		parseOptions: {},
	} as FastifyCookieOptions);

	// Configuration WebSocket
	await app.register(fastifyWebsocket, {
		options: {
			maxPayload: 1024 * 1024 * 10,
			clientTracking: true,
			perMessageDeflate: false,
		},
	});

	// Configuration multipart pour les uploads
	await app.register(fastifyMultipart, {
		limits: {
			fileSize: 5 * 1024 * 1024,
			files: 1,
		},
	});

	// Configuration des fichiers statiques - avatars en premier
	console.log("📁 Enregistrement des avatars statiques...");
	await app.register(async function (fastify) {
		await fastify.register(fastifyStatic, {
			root: path.join(PROJECT_ROOT, "public", "avatars"),
			prefix: "/avatars/",
			decorateReply: false,
		});
	});

	// Configuration des fichiers statiques - frontend en second
	console.log("📁 Enregistrement des fichiers statiques du frontend...");
	const frontendPath = path.join(__dirname, "../../frontend/dist");
	console.log("📂 Chemin du frontend:", frontendPath);
	console.log("📂 Le dossier existe?", fs.existsSync(frontendPath));
	if (fs.existsSync(frontendPath)) {
		console.log("📂 Contenu du dossier:", fs.readdirSync(frontendPath));
	}
	await app.register(async function (fastify) {
		await fastify.register(fastifyStatic, {
			root: frontendPath,
			prefix: "/",
		});
	});

	// Enregistrement des routes API dans l'ordre exact de la version de base
	console.log("🛣️ Enregistrement des routes...");
	await registerNewUser(app, prisma);
	await handleLogIn(app, prisma);
	await registerProfileRoute(app, prisma);
	await chatWebSocketRoutes(app, prisma);
	await registerNotificationRoutes(app, prisma);

	// =============== SERVER-SIDE PONG SETUP ===============
	console.log("🎮 Initializing Game Manager for Server-Side Pong...");
	try {
		gameManager = new GameManager(app);
		console.log("✅ GameManager created successfully");
		await registerGameRoute(app, prisma, gameManager);
		console.log("✅ Game routes registered successfully");
	} catch (error) {
		console.error("❌ Error initializing GameManager:", error);
	}

	// 2FA routes
	await twoFactorRoutes(app, prisma);

	// Google Auth routes
	await app.register(googleAuthRoutes, { prefix: '/api' });

	// Route de santé pour le monitoring
	app.get("/health", async (request, reply) => {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || "1.0.0",
			ssl: httpsOptions ? "enabled" : "disabled",
			metrics_server: `http://${PUBLIC_IP}:${METRICS_PORT}/metrics`,
			detected_ip: PUBLIC_IP,
			environment: fs.existsSync('/.dockerenv') ? "containerized" : "native",
		};
	});

	// Configuration du gestionnaire 404 pour le SPA - DOIT ÊTRE EN DERNIER
	app.setNotFoundHandler((_req, reply) => {
		reply.sendFile("index.html");
	});
};

// Configuration du serveur de métriques (toujours en HTTP)
const setupMetricsServer = async () => {
	console.log(
		"📊 Configuration du serveur de métriques (HTTP uniquement)..."
	);

	// Enregistrement du plugin de métriques sur le serveur dédié
	await metricsApp.register(metricsPlugin);

	// Route de santé pour le serveur de métriques
	metricsApp.get("/health", async (request, reply) => {
		return {
			status: "ok",
			service: "metrics-server",
			timestamp: new Date().toISOString(),
			environment: fs.existsSync('/.dockerenv') ? "containerized" : "native",
		};
	});

	// Redirection root vers /metrics pour faciliter les tests
	metricsApp.get("/", async (request, reply) => {
		return reply.redirect("/metrics");
	});
};

// PAS de serveur de redirection HTTP si on force le mode HTTP
const createHttpRedirectServer = () => {
	if (!httpsOptions) {
		console.log("ℹ️ Pas de serveur de redirection - Mode HTTP uniquement");
		return null;
	}

	console.log("🔄 Création du serveur de redirection HTTP...");
	const httpRedirectApp = fastify({
		logger: { level: "info" },
	});

	httpRedirectApp.addHook("onRequest", async (request, reply) => {
		const clientHost = request.headers.host?.split(":")[0] || "localhost";
		let redirectHost = PUBLIC_IP;

		if (clientHost === "localhost" || clientHost === "127.0.0.1") {
			redirectHost = "localhost";
		}

		const httpsUrl = `https://${redirectHost}:${MAIN_PORT.toString()}${request.url}`;
		console.log(
			`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`
		);

		reply.redirect(httpsUrl, 301);
	});

	return httpRedirectApp;
};

// Fonction de démarrage principale
const start = async () => {
	try {
		console.log("🚀 Démarrage du serveur Trans-App...");
		console.log("🔍 === CONFIGURATION RÉSEAU ===");
		console.log(`🌐 IP: ${PUBLIC_IP}`);
		console.log(`🚪 Port principal: ${MAIN_PORT}`);
		console.log(`📊 Port métriques: ${METRICS_PORT}`);
		console.log(`🔄 Port redirection: ${HTTP_REDIRECT_PORT}`);
		console.log(`🔒 SSL: ${httpsOptions ? "ACTIVÉ" : "DÉSACTIVÉ"}`);
		console.log(`🐳 Conteneur: ${fs.existsSync('/.dockerenv') ? "OUI" : "NON"}`);

		// Test de connexion à la base de données
		console.log("🗄️ Test de connexion à la base de données...");
		await prisma.$connect();
		console.log("✅ Base de données connectée avec succès");

		// Configuration des serveurs
		await setupMainServer();
		await setupMetricsServer();

		// Démarrage du serveur de métriques (toujours en premier)
		console.log(
			`📊 Démarrage du serveur de métriques HTTP sur le port ${METRICS_PORT}...`
		);
		await metricsApp.listen({
			port: METRICS_PORT,
			host: "0.0.0.0",
		});
		console.log(`✅ Serveur de métriques démarré avec succès`);

		// Démarrage du serveur principal
		const protocol = httpsOptions ? "HTTPS" : "HTTP";
		console.log(
			`🚀 Démarrage du serveur ${protocol} principal sur le port ${MAIN_PORT}...`
		);
		await app.listen({
			port: MAIN_PORT,
			host: "0.0.0.0",
		});

		console.log("\n🎉 === SERVEUR DÉMARRÉ AVEC SUCCÈS ===");
		console.log(`✅ Serveur ${protocol} principal: OK`);
		console.log(`🔗 Accès local: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`);

		if (PUBLIC_IP !== "localhost" && PUBLIC_IP !== "127.0.0.1") {
			console.log(`🌍 Accès réseau: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`);
		}

		// Métriques
		console.log(`📊 Métriques: http://localhost:${METRICS_PORT}/metrics`);
		if (PUBLIC_IP !== "localhost") {
			console.log(`📊 Métriques (réseau): http://${PUBLIC_IP}:${METRICS_PORT}/metrics`);
		}

		// Serveur de redirection uniquement si HTTPS est activé
		if (httpsOptions && HTTP_REDIRECT_PORT !== MAIN_PORT) {
			const httpRedirectApp = createHttpRedirectServer();
			if (httpRedirectApp) {
				console.log(
					`🌐 Démarrage du serveur de redirection HTTP sur le port ${HTTP_REDIRECT_PORT}...`
				);
				await httpRedirectApp.listen({
					port: HTTP_REDIRECT_PORT,
					host: "0.0.0.0",
				});
				console.log(
					`✅ Serveur de redirection: port ${HTTP_REDIRECT_PORT} → HTTPS:${MAIN_PORT}`
				);
			}
		}

		console.log("\n📋 === ACCÈS RECOMMANDÉS ===");
		if (httpsOptions) {
			console.log(`🔒 Application (HTTPS): https://localhost:${MAIN_PORT}`);
			if (PUBLIC_IP !== "localhost") {
				console.log(`🔒 Application (réseau): https://${PUBLIC_IP}:${MAIN_PORT}`);
			}
		} else {
			console.log(`🌐 Application (HTTP): http://localhost:${MAIN_PORT}`);
			if (PUBLIC_IP !== "localhost") {
				console.log(`🌐 Application (réseau): http://${PUBLIC_IP}:${MAIN_PORT}`);
			}
		}

	} catch (err) {
		console.error("💥 === ERREUR DE DÉMARRAGE ===");
		if (typeof err === "string") {
			logger.error(err);
		} else if (err instanceof Error) {
			logger.error({
				error: err.message,
				stack: err.stack,
			});
		}
		process.exit(1);
	}
};

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async (signal: string) => {
	console.log(`🛑 Signal ${signal} reçu, arrêt propre en cours...`);
	try {
		if (gameManager) {
			gameManager.shutdown();
		}

		await Promise.all([app.close(), metricsApp.close()]);
		await prisma.$disconnect();
		console.log("✅ Arrêt propre terminé");
		process.exit(0);
	} catch (error) {
		console.error("❌ Erreur lors de l'arrêt:", error);
		process.exit(1);
	}
};

// Gestionnaires de signaux
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Gestionnaires d'erreurs globales
process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	console.error("❌ Uncaught Exception:", error);
	process.exit(1);
});

// Démarrage du serveur
start();


// import { config } from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const envPath = path.join(__dirname, '../.env');
// console.log('🔍 Chemin du fichier .env:', envPath);
// console.log('🔍 Fichier .env existe:', fs.existsSync(envPath));

// const result = config({ path: envPath });
// console.log('🔍 Résultat chargement .env:', result.error ? result.error.message : 'Succès');

// import { logger } from "./utils/logger.js";
// import { metricsPlugin } from "./utils/metricsPlugin.js";
// import fastify from "fastify";
// import { registerNewUser } from "./routes/signup.js";
// import { handleLogIn } from "./routes/login.js";
// import { registerProfileRoute } from "./routes/profile.js";
// import fastifyStatic from "@fastify/static";
// import fastifyWebsocket from "@fastify/websocket";
// import fastifyMultipart from "@fastify/multipart";
// import { PrismaClient } from "@prisma/client";
// import chatWebSocketRoutes from "./routes/chat.js";
// import cookie from "@fastify/cookie";
// import type { FastifyCookieOptions } from "@fastify/cookie";
// import { registerNotificationRoutes } from "./routes/notifications.js";
// import { registerGameRoute } from "./routes/game.js";
// import { GameManager } from "./game/GameManager.js";
// import os from "os";
// import { execSync } from "child_process"; // Import manquant ajouté !
// import { twoFactorRoutes } from "./routes/two-factor.js";
// import googleAuthRoutes from "./routes/google-auth.js";

// // Configuration des chemins
// export const PROJECT_ROOT = path.resolve(__dirname, "../../");

// // Extension du type FastifyRequest pour les métriques
// declare module "fastify" {
// 	interface FastifyRequest {
// 		startTime?: number;
// 	}
// }

// // Configuration des ports adaptée à votre .env
// const MAIN_PORT = process.env.MAIN_PORT
// 	? parseInt(process.env.MAIN_PORT)
// 	: 3002;
// const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT
// 	? parseInt(process.env.HTTP_REDIRECT_PORT)
// 	: 8080;
// const METRICS_PORT = process.env.METRICS_PORT
// 	? parseInt(process.env.METRICS_PORT)
// 	: 3001;

// const PUBLIC_IP = process.env.PUBLIC_IP || "127.0.0.1";

// const prisma = new PrismaClient();

// // =============== GAME MANAGER SETUP ===============
// let gameManager: GameManager;

// // Fonction utilitaire pour détecter les requêtes Prometheus
// function scrappingMessage(
// 	method: string,
// 	url: string,
// 	userAgent: string | undefined
// ) {
// 	if (url === "/metrics" && userAgent && userAgent.includes("Prometheus")) {
// 		return "Prometheus Scraping";
// 	}
// 	return null;
// }

// // Interface pour les options HTTPS
// interface HttpsOptions {
// 	key: Buffer;
// 	cert: Buffer;
// }

// // Fonction pour charger les certificats SSL avec gestion d'erreur améliorée
// const loadSSLCertificates = (): HttpsOptions | null => {
// 	try {
// 		const sslPath = path.join(__dirname, "../ssl");

// 		if (
// 			!fs.existsSync(path.join(sslPath, "key.pem")) ||
// 			!fs.existsSync(path.join(sslPath, "cert.pem"))
// 		) {
// 			console.log(
// 				"ℹ️ Certificats SSL non trouvés - le serveur fonctionnera en HTTP"
// 			);
// 			return null;
// 		}

// 		const httpsOptions: HttpsOptions = {
// 			key: fs.readFileSync(path.join(sslPath, "key.pem")),
// 			cert: fs.readFileSync(path.join(sslPath, "cert.pem")),
// 		};

// 		console.log("✅ Certificats SSL chargés avec succès");
// 		return httpsOptions;
// 	} catch (error: any) {
// 		console.error(
// 			"❌ Erreur lors du chargement des certificats SSL:",
// 			error.message
// 		);
// 		console.log("⚠️ Le serveur fonctionnera en HTTP");
// 		return null;
// 	}
// };

// // Chargement des certificats
// const httpsOptions: HttpsOptions | null = loadSSLCertificates();

// // Création du serveur principal (application web)
// const app = fastify({
// 	logger: {
// 		level: "info",
// 	},
// 	// HTTPS uniquement pour l'application web principale
// 	...(httpsOptions && { https: httpsOptions }),
// 	trustProxy: true,
// 	disableRequestLogging: false,
// });

// // Création d'un serveur dédié pour les métriques (toujours en HTTP)
// const metricsApp = fastify({
// 	logger: {
// 		level: "info",
// 	},
// 	trustProxy: true,
// 	disableRequestLogging: false,
// });

// // Configuration des hooks pour le serveur principal
// app.addHook("onRequest", async (request, reply) => {
// 	request.startTime = Date.now();

// 	const scrapping = scrappingMessage(
// 		request.method,
// 		request.url,
// 		request.headers["user-agent"]
// 	);

// 	if (scrapping) {
// 		logger.debug({
// 			type: "prometheus_request",
// 			message: scrapping,
// 			method: request.method,
// 			url: request.url,
// 			ip: request.ip,
// 		});
// 	} else {
// 		logger.info({
// 			type: "http_request",
// 			method: request.method,
// 			url: request.url,
// 			ip: request.ip,
// 			userAgent: request.headers["user-agent"],
// 		});
// 	}
// });

// app.addHook("onResponse", async (request, reply) => {
// 	const responseTime = Date.now() - (request.startTime || 0);
// 	const scrapping = scrappingMessage(
// 		request.method,
// 		request.url,
// 		request.headers["user-agent"]
// 	);

// 	if (scrapping) {
// 		logger.debug({
// 			type: "prometheus_response",
// 			message: scrapping,
// 			method: request.method,
// 			url: request.url,
// 			statusCode: reply.statusCode,
// 			responseTime: responseTime,
// 		});
// 	} else {
// 		logger.info({
// 			type: "http_response",
// 			method: request.method,
// 			url: request.url,
// 			statusCode: reply.statusCode,
// 			responseTime: responseTime,
// 		});
// 	}
// });

// app.addHook("onError", async (request, reply, error) => {
// 	logger.error({
// 		type: "http_error",
// 		method: request.method,
// 		url: request.url,
// 		error: error.message,
// 		stack: error.stack,
// 	});
// });

// // Configuration similaire pour le serveur de métriques
// metricsApp.addHook("onRequest", async (request, reply) => {
// 	request.startTime = Date.now();
// 	logger.debug({
// 		type: "metrics_request",
// 		method: request.method,
// 		url: request.url,
// 		ip: request.ip,
// 	});
// });

// metricsApp.addHook("onResponse", async (request, reply) => {
// 	const responseTime = Date.now() - (request.startTime || 0);
// 	logger.debug({
// 		type: "metrics_response",
// 		method: request.method,
// 		url: request.url,
// 		statusCode: reply.statusCode,
// 		responseTime: responseTime,
// 	});
// });

// // Configuration du serveur principal (application web)
// const setupMainServer = async () => {
// 	console.log("📦 Configuration du serveur principal (application web)...");

// 	// Configuration des cookies avec clé secrète adaptée à votre .env
// 	await app.register(cookie, {
// 		secret:
// 			process.env.COOKIE_SECRET ||
// 			process.env.SECURITY_KEY ||
// 			"fallback-secret-key-for-dev",
// 		parseOptions: {},
// 	} as FastifyCookieOptions);

// 	// Configuration WebSocket
// 	await app.register(fastifyWebsocket, {
// 		options: {
// 			maxPayload: 1024 * 1024 * 10,
// 			clientTracking: true,
// 			perMessageDeflate: false,
// 		},
// 	});

// 	// Configuration multipart pour les uploads
// 	await app.register(fastifyMultipart, {
// 		limits: {
// 			fileSize: 5 * 1024 * 1024,
// 			files: 1,
// 		},
// 	});

// 	// Configuration des fichiers statiques - avatars en premier
// 	console.log("📁 Enregistrement des avatars statiques...");
// 	await app.register(async function (fastify) {
// 		await fastify.register(fastifyStatic, {
// 			root: path.join(PROJECT_ROOT, "public", "avatars"),
// 			prefix: "/avatars/",
// 			decorateReply: false,
// 		});
// 	});

// 	// Configuration des fichiers statiques - frontend en second
// 	console.log("📁 Enregistrement des fichiers statiques du frontend...");
// 	await app.register(async function (fastify) {
// 		await fastify.register(fastifyStatic, {
// 			root: path.join(__dirname, "../../frontend/dist"),
// 			prefix: "/",
// 		});
// 	});

// 	// Enregistrement des routes API
// 	console.log("🛣️ Enregistrement des routes...");
// 	await registerNewUser(app, prisma);
// 	await handleLogIn(app, prisma);
// 	await registerProfileRoute(app, prisma);
// 	await chatWebSocketRoutes(app, prisma);
// 	await registerNotificationRoutes(app, prisma);
// 	await twoFactorRoutes(app, prisma);
// 	await app.register(googleAuthRoutes, { prefix: '/api' });

// 	// =============== SERVER-SIDE PONG SETUP ===============
// 	console.log("🎮 Initializing Game Manager for Server-Side Pong...");
// 	try {
// 		gameManager = new GameManager(app);
// 		console.log("✅ GameManager created successfully");
// 		await registerGameRoute(app, prisma, gameManager);
// 		console.log("✅ Game routes registered successfully");
// 	} catch (error) {
// 		console.error("❌ Error initializing GameManager:", error);
// 	}

// 	// Route de santé pour le monitoring
// 	app.get("/health", async (request, reply) => {
// 		return {
// 			status: "ok",
// 			timestamp: new Date().toISOString(),
// 			version: process.env.npm_package_version || "1.0.0",
// 			ssl: httpsOptions ? "enabled" : "disabled",
// 			metrics_server: `http://${PUBLIC_IP}:${METRICS_PORT}/metrics`,
// 			// environment: isRunningInContainer() ? "containerized" : "native",
// 			detected_ip: PUBLIC_IP,
// 		};
// 	});

// 	// Configuration du gestionnaire 404 pour le SPA
// 	app.setNotFoundHandler((_req, reply) => {
// 		reply.sendFile("index.html");
// 	});
// };

// // Configuration du serveur de métriques (toujours en HTTP)
// const setupMetricsServer = async () => {
// 	console.log(
// 		"📊 Configuration du serveur de métriques (HTTP uniquement)..."
// 	);

// 	// Enregistrement du plugin de métriques sur le serveur dédié
// 	await metricsApp.register(metricsPlugin);

// 	// Route de santé pour le serveur de métriques
// 	metricsApp.get("/health", async (request, reply) => {
// 		return {
// 			status: "ok",
// 			service: "metrics-server",
// 			timestamp: new Date().toISOString(),
// 			// environment: isRunningInContainer() ? "containerized" : "native",
// 		};
// 	});

// 	// Redirection root vers /metrics pour faciliter les tests
// 	metricsApp.get("/", async (request, reply) => {
// 		return reply.redirect("/metrics");
// 	});
// };

// // Création du serveur de redirection HTTP (si HTTPS est activé)
// const createHttpRedirectServer = () => {
// 	if (!httpsOptions) {
// 		return null;
// 	}

// 	console.log("🔄 Création du serveur de redirection HTTP...");
// 	const httpRedirectApp = fastify({
// 		logger: { level: "info" },
// 	});

// 	httpRedirectApp.addHook("onRequest", async (request, reply) => {
// 		const clientHost = request.headers.host?.split(":")[0] || "localhost";
// 		let redirectHost = PUBLIC_IP;

// 		// Si l'accès se fait via localhost, maintenir localhost dans la redirection
// 		if (clientHost === "localhost" || clientHost === "127.0.0.1") {
// 			redirectHost = "localhost";
// 		}

// 		const httpsUrl = `https://${redirectHost}:${MAIN_PORT.toString()}${request.url}`;
// 		console.log(
// 			`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`
// 		);

// 		reply.redirect(httpsUrl, 301);
// 	});

// 	return httpRedirectApp;
// };

// // Fonction de démarrage principale
// const start = async () => {
// 	try {
// 		console.log("🚀 Démarrage du serveur Trans-App...");
// 		console.log(
// 			`🌐 Configuration réseau: IP=${PUBLIC_IP}, Port principal=${MAIN_PORT}, Port métriques=${METRICS_PORT}`
// 		);

// 		// Test de connexion à la base de données
// 		console.log("🗄️ Test de connexion à la base de données...");
// 		await prisma.$connect();
// 		console.log("✅ Base de données connectée avec succès");

// 		// Configuration des serveurs
// 		await setupMainServer();
// 		await setupMetricsServer();

// 		// Démarrage du serveur de métriques (toujours en premier)
// 		console.log(
// 			`📊 Démarrage du serveur de métriques HTTP sur le port ${METRICS_PORT}...`
// 		);
// 		await metricsApp.listen({
// 			port: METRICS_PORT,
// 			host: "0.0.0.0",
// 		});
// 		console.log(`✅ Serveur de métriques démarré avec succès`);
// 		console.log(
// 			`📊 Métriques Prometheus: http://localhost:${METRICS_PORT}/metrics`
// 		);
// 		console.log(
// 			`📊 Métriques (réseau): http://${PUBLIC_IP}:${METRICS_PORT}/metrics`
// 		);

// 		// Démarrage du serveur principal
// 		const protocol = httpsOptions ? "HTTPS" : "HTTP";
// 		console.log(
// 			`🚀 Démarrage du serveur ${protocol} principal sur le port ${MAIN_PORT}...`
// 		);
// 		await app.listen({
// 			port: MAIN_PORT,
// 			host: "0.0.0.0",
// 		});

// 		console.log(`✅ Serveur ${protocol} principal démarré avec succès`);
// 		console.log(
// 			`🔗 Accès local: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`
// 		);

// 		if (PUBLIC_IP !== "localhost") {
// 			console.log(
// 				`🌍 Accès réseau: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`
// 			);
// 		}

// 		// Si HTTPS est configuré, créer un serveur de redirection HTTP
// 		if (httpsOptions && HTTP_REDIRECT_PORT !== MAIN_PORT) {
// 			const httpRedirectApp = createHttpRedirectServer();
// 			if (httpRedirectApp) {
// 				console.log(
// 					`🌐 Démarrage du serveur de redirection HTTP sur le port ${HTTP_REDIRECT_PORT}...`
// 				);
// 				await httpRedirectApp.listen({
// 					port: HTTP_REDIRECT_PORT,
// 					host: "0.0.0.0",
// 				});
// 				console.log(
// 					`✅ Serveur de redirection HTTP démarré: port ${HTTP_REDIRECT_PORT} → HTTPS:${MAIN_PORT}`
// 				);
// 			}
// 		}

// 		// Instructions pour la configuration Docker et monitoring
// 		console.log("\n📋 Configuration pour votre stack de monitoring:");
// 		console.log(
// 			"═══════════════════════════════════════════════════════════════"
// 		);
// 		console.log(
// 			`📊 Prometheus - Target: http://dev:${METRICS_PORT}/metrics`
// 		);
// 		console.log(`📈 Grafana - Interface: http://localhost:9080`);
// 		console.log(`🕸️ ELK Stack - Logs disponibles via le logger configuré`);
// 		console.log(
// 			`🔗 Application: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`
// 		);
// 		console.log(
// 			"═══════════════════════════════════════════════════════════════"
// 		);

// 		if (PUBLIC_IP !== "localhost") {
// 			console.log("\n🌐 Accès depuis d'autres machines du réseau:");
// 			console.log(
// 				`   Application: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`
// 			);
// 			console.log(
// 				`   Métriques: http://${PUBLIC_IP}:${METRICS_PORT}/metrics`
// 			);
// 		}
// 	} catch (err) {
// 		if (typeof err === "string") {
// 			logger.error(err);
// 		} else if (err instanceof Error) {
// 			logger.error({
// 				error: err.message,
// 				stack: err.stack,
// 			});
// 		}
// 		process.exit(1);
// 	}
// };

// // Gestion propre de l'arrêt du serveur
// const gracefulShutdown = async (signal: string) => {
// 	console.log(`🛑 Signal ${signal} reçu, arrêt propre en cours...`);
// 	try {
// 		// Arrêter le GameManager proprement
// 		if (gameManager) {
// 			gameManager.shutdown();
// 		}

// 		await Promise.all([app.close(), metricsApp.close()]);
// 		await prisma.$disconnect();
// 		console.log("✅ Arrêt propre terminé");
// 		process.exit(0);
// 	} catch (error) {
// 		console.error("❌ Erreur lors de l'arrêt:", error);
// 		process.exit(1);
// 	}
// };

// // Gestionnaires de signaux
// process.on("SIGINT", () => gracefulShutdown("SIGINT"));
// process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// // Gestionnaires d'erreurs globales
// process.on("unhandledRejection", (reason, promise) => {
// 	console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
// 	process.exit(1);
// });

// process.on("uncaughtException", (error) => {
// 	console.error("❌ Uncaught Exception:", error);
// 	process.exit(1);
// });

// // Démarrage du serveur
// start();
