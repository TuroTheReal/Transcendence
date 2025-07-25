// server.ts - Configuration améliorée pour Docker avec détection IP intelligente

import { logger } from './utils/logger.js';
import { metricsPlugin } from './utils/metricsPlugin.js';
import fastify from "fastify";
import { registerNewUser } from "./routes/signup.js";
import { handleLogIn } from "./routes/login.js";
import { registerProfileRoute } from "./routes/profile.js";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import chatWebSocketRoutes from "./routes/chat.js";
import cookie from '@fastify/cookie';
import type { FastifyCookieOptions } from '@fastify/cookie';
import { registerNotificationRoutes } from "./routes/notifications.js";
import fs from 'fs';
import os from 'os';

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

// Extension du type FastifyRequest pour les métriques
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

// Configuration des ports adaptée à votre .env
const MAIN_PORT = process.env.MAIN_PORT ? parseInt(process.env.MAIN_PORT) : 3000;
const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT ? parseInt(process.env.HTTP_REDIRECT_PORT) : 8080;
const METRICS_PORT = process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 3001; // Port dédié pour les métriques

// Fonction améliorée pour détecter l'IP accessible depuis l'extérieur
const getAccessibleIP = (): string => {
  const networkInterfaces = os.networkInterfaces();
  const candidateIPs: Array<{ip: string, interface: string, priority: number}> = [];

  console.log("🔍 Analyse des interfaces réseau disponibles:");

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      for (const iface of interfaces) {
        if (!iface.internal && iface.family === 'IPv4') {
          let priority = 0;

          // Priorisation basée sur le nom de l'interface et les plages d'IP
          if (interfaceName.startsWith('eth') || interfaceName.startsWith('ens')) {
            priority += 100; // Interface Ethernet physique
          }
          if (interfaceName.startsWith('wl') || interfaceName.includes('wifi')) {
            priority += 80; // Interface WiFi
          }

          // Éviter les interfaces Docker par défaut
          if (interfaceName.startsWith('docker') || interfaceName.startsWith('br-')) {
            priority -= 50;
          }

          // Privilégier les IP de réseau local standard
          if (iface.address.startsWith('192.168.') ||
              iface.address.startsWith('10.') ||
              iface.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
            priority += 50;
          }

          candidateIPs.push({
            ip: iface.address,
            interface: interfaceName,
            priority: priority
          });

          console.log(`   📡 ${interfaceName}: ${iface.address} (priorité: ${priority})`);
        }
      }
    }
  }

  if (candidateIPs.length > 0) {
    // Trier par priorité décroissante et prendre la meilleure
    candidateIPs.sort((a, b) => b.priority - a.priority);
    const bestIP = candidateIPs[0];
    console.log(`🎯 IP sélectionnée: ${bestIP.ip} (interface: ${bestIP.interface}, priorité: ${bestIP.priority})`);
    return bestIP.ip;
  }

  console.log("⚠️ Aucune IP publique détectée, utilisation de localhost");
  return 'localhost';
};

// Configuration IP intelligente
let PUBLIC_IP: string;
if (process.env.PUBLIC_IP && process.env.PUBLIC_IP !== 'auto') {
  PUBLIC_IP = process.env.PUBLIC_IP;
  console.log(`🎯 Utilisation de l'IP définie manuellement: ${PUBLIC_IP}`);
} else {
  PUBLIC_IP = getAccessibleIP();
}

const prisma = new PrismaClient();

// Fonction utilitaire pour détecter les requêtes Prometheus
function scrappingMessage(method: string, url: string, userAgent: string | undefined) {
  if (url === '/metrics' && userAgent && userAgent.includes('Prometheus')) {
    return 'Prometheus Scraping';
  }
  return null;
}

// Interface pour les options HTTPS
interface HttpsOptions {
  key: Buffer;
  cert: Buffer;
}

// Fonction pour charger les certificats SSL avec gestion d'erreur améliorée
const loadSSLCertificates = (): HttpsOptions | null => {
  try {
    const sslPath = path.join(__dirname, '../ssl');

    if (!fs.existsSync(path.join(sslPath, 'key.pem')) ||
        !fs.existsSync(path.join(sslPath, 'cert.pem'))) {
      console.log("ℹ️ Certificats SSL non trouvés - le serveur fonctionnera en HTTP");
      return null;
    }

    const httpsOptions: HttpsOptions = {
      key: fs.readFileSync(path.join(sslPath, 'key.pem')),
      cert: fs.readFileSync(path.join(sslPath, 'cert.pem'))
    };

    console.log("✅ Certificats SSL chargés avec succès");
    return httpsOptions;
  } catch (error: any) {
    console.error("❌ Erreur lors du chargement des certificats SSL:", error.message);
    console.log("⚠️ Le serveur fonctionnera en HTTP");
    return null;
  }
};

// Chargement des certificats
const httpsOptions: HttpsOptions | null = loadSSLCertificates();

// Création du serveur principal (application web)
const app = fastify({
  logger: {
    level: 'info',
  },
  // HTTPS uniquement pour l'application web principale
  ...(httpsOptions && { https: httpsOptions }),
  trustProxy: true,
  disableRequestLogging: false
});

// Création d'un serveur dédié pour les métriques (toujours en HTTP)
const metricsApp = fastify({
  logger: {
    level: 'info',
  },
  trustProxy: true,
  disableRequestLogging: false
});

// Configuration des hooks pour le serveur principal
app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();

  const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

  if (scrapping) {
    logger.debug({
      type: 'prometheus_request',
      message: scrapping,
      method: request.method,
      url: request.url,
      ip: request.ip
    });
  } else {
    logger.info({
      type: 'http_request',
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    });
  }
});

app.addHook('onResponse', async (request, reply) => {
  const responseTime = Date.now() - (request.startTime || 0);
  const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

  if (scrapping) {
    logger.debug({
      type: 'prometheus_response',
      message: scrapping,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: responseTime
    });
  } else {
    logger.info({
      type: 'http_response',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: responseTime
    });
  }
});

app.addHook('onError', async (request, reply, error) => {
  logger.error({
    type: 'http_error',
    method: request.method,
    url: request.url,
    error: error.message,
    stack: error.stack
  });
});

// Configuration similaire pour le serveur de métriques
metricsApp.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
  logger.debug({
    type: 'metrics_request',
    method: request.method,
    url: request.url,
    ip: request.ip
  });
});

metricsApp.addHook('onResponse', async (request, reply) => {
  const responseTime = Date.now() - (request.startTime || 0);
  logger.debug({
    type: 'metrics_response',
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: responseTime
  });
});

// Configuration du serveur principal (application web)
const setupMainServer = async () => {
  console.log("📦 Configuration du serveur principal (application web)...");

  // Configuration des cookies avec clé secrète adaptée à votre .env
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || process.env.SECURITY_KEY || 'fallback-secret-key-for-dev',
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
      files: 1
    }
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
  await app.register(async function (fastify) {
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, "../../frontend/src"),
      prefix: "/",
    });
  });

  // Enregistrement des routes API
  console.log("🛣️ Enregistrement des routes...");
  await registerNewUser(app, prisma);
  await handleLogIn(app, prisma);
  await registerProfileRoute(app, prisma);
  await chatWebSocketRoutes(app, prisma);
  await registerNotificationRoutes(app, prisma);

  // Route de santé pour le monitoring
  app.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      ssl: httpsOptions ? 'enabled' : 'disabled',
      metrics_server: `http://${PUBLIC_IP}:${METRICS_PORT}/metrics`
    };
  });

  // Configuration du gestionnaire 404 pour le SPA
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
  });
};

// Configuration du serveur de métriques (toujours en HTTP)
const setupMetricsServer = async () => {
  console.log("📊 Configuration du serveur de métriques (HTTP uniquement)...");

  // Enregistrement du plugin de métriques sur le serveur dédié
  await metricsApp.register(metricsPlugin);

  // Route de santé pour le serveur de métriques
  metricsApp.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'metrics-server',
      timestamp: new Date().toISOString()
    };
  });

  // Redirection root vers /metrics pour faciliter les tests
  metricsApp.get('/', async (request, reply) => {
    return reply.redirect('/metrics');
  });
};

// Création du serveur de redirection HTTP (si HTTPS est activé)
const createHttpRedirectServer = () => {
  if (!httpsOptions) {
    return null;
  }

  console.log("🔄 Création du serveur de redirection HTTP...");
  const httpRedirectApp = fastify({
    logger: { level: 'info' }
  });

  httpRedirectApp.addHook('onRequest', async (request, reply) => {
    const clientHost = request.headers.host?.split(':')[0] || 'localhost';
    let redirectHost = PUBLIC_IP;

    // Si l'accès se fait via localhost, maintenir localhost dans la redirection
    if (clientHost === 'localhost' || clientHost === '127.0.0.1') {
      redirectHost = 'localhost';
    }

    const httpsUrl = `https://${redirectHost}:${MAIN_PORT.toString()}${request.url}`;
    console.log(`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`);

    reply.redirect(httpsUrl, 301);
  });

  return httpRedirectApp;
};

// Fonction de démarrage principale
const start = async () => {
  try {
    console.log("🚀 Démarrage du serveur Trans-App...");
    console.log(`🌐 Configuration réseau: IP=${PUBLIC_IP}, Port principal=${MAIN_PORT}, Port métriques=${METRICS_PORT}`);

    // Test de connexion à la base de données
    console.log("🗄️ Test de connexion à la base de données...");
    await prisma.$connect();
    console.log("✅ Base de données connectée avec succès");

    // Configuration des serveurs
    await setupMainServer();
    await setupMetricsServer();

    // Démarrage du serveur de métriques (toujours en premier)
    console.log(`📊 Démarrage du serveur de métriques HTTP sur le port ${METRICS_PORT}...`);
    await metricsApp.listen({
      port: METRICS_PORT,
      host: '0.0.0.0'
    });
    console.log(`✅ Serveur de métriques démarré avec succès`);
    console.log(`📊 Métriques Prometheus: http://localhost:${METRICS_PORT}/metrics`);
    console.log(`📊 Métriques (réseau): http://${PUBLIC_IP}:${METRICS_PORT}/metrics`);

    // Démarrage du serveur principal
    const protocol = httpsOptions ? 'HTTPS' : 'HTTP';
    console.log(`🚀 Démarrage du serveur ${protocol} principal sur le port ${MAIN_PORT}...`);
    await app.listen({
      port: MAIN_PORT,
      host: '0.0.0.0'
    });

    console.log(`✅ Serveur ${protocol} principal démarré avec succès`);
    console.log(`🔗 Accès local: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`);

    if (PUBLIC_IP !== 'localhost') {
      console.log(`🌍 Accès réseau: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`);
    }

    // Si HTTPS est configuré, créer un serveur de redirection HTTP
    if (httpsOptions && HTTP_REDIRECT_PORT !== MAIN_PORT) {
      const httpRedirectApp = createHttpRedirectServer();
      if (httpRedirectApp) {
        console.log(`🌐 Démarrage du serveur de redirection HTTP sur le port ${HTTP_REDIRECT_PORT}...`);
        await httpRedirectApp.listen({
          port: HTTP_REDIRECT_PORT,
          host: '0.0.0.0'
        });
        console.log(`✅ Serveur de redirection HTTP démarré: port ${HTTP_REDIRECT_PORT} → HTTPS:${MAIN_PORT}`);
      }
    }

    // Instructions pour la configuration Docker et monitoring
    console.log("\n📋 Configuration pour votre stack de monitoring:");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`📊 Prometheus - Target: http://dev:${METRICS_PORT}/metrics`);
    console.log(`📈 Grafana - Interface: http://localhost:9080`);
    console.log(`🕸️ ELK Stack - Logs disponibles via le logger configuré`);
    console.log(`🔗 Application: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`);
    console.log("═══════════════════════════════════════════════════════════════");

    if (PUBLIC_IP !== 'localhost') {
      console.log("\n🌐 Accès depuis d'autres machines du réseau:");
      console.log(`   Application: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`);
      console.log(`   Métriques: http://${PUBLIC_IP}:${METRICS_PORT}/metrics`);
    }

  } catch (err) {
    if (typeof err === 'string') {
      logger.error(err);
    } else if (err instanceof Error) {
      logger.error({
        error: err.message,
        stack: err.stack
      });
    }
    process.exit(1);
  }
};

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 Signal ${signal} reçu, arrêt propre en cours...`);
  try {
    await Promise.all([
      app.close(),
      metricsApp.close()
    ]);
    await prisma.$disconnect();
    console.log("✅ Arrêt propre terminé");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'arrêt:", error);
    process.exit(1);
  }
};

// Gestionnaires de signaux
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Gestionnaires d'erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Démarrage du serveur
start();














// import { metricsPlugin } from './utils/metricsPlugin.js';
// import fastify from "fastify";
// import { registerNewUser } from "./routes/signup.js";
// import { handleLogIn } from "./routes/login.js";
// import { registerProfileRoute } from "./routes/profile.js";
// import fastifyStatic from "@fastify/static";
// import fastifyWebsocket from "@fastify/websocket";
// import fastifyMultipart from "@fastify/multipart";
// import path from "path";
// import { fileURLToPath } from "url";
// import { PrismaClient } from "@prisma/client";
// import chatWebSocketRoutes from "./routes/chat.js";
// import cookie from '@fastify/cookie';
// import type { FastifyCookieOptions } from '@fastify/cookie';
// import { registerNotificationRoutes } from "./routes/notifications.js";
// import fs from 'fs';
// import os from 'os';

// // Configuration des chemins
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// export const PROJECT_ROOT = path.resolve(__dirname, "../../");

// // Extension du type FastifyRequest pour les métriques
// declare module 'fastify' {
//   interface FastifyRequest {
//     startTime?: number;
//   }
// }

// // Configuration des ports adaptée à votre .env
// const MAIN_PORT = process.env.MAIN_PORT ? parseInt(process.env.MAIN_PORT) : 3000;
// const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT ? parseInt(process.env.HTTP_REDIRECT_PORT) : 80;

// // Fonction pour détecter l'IP publique (votre code existant)
// const getPublicIP = (): string => {
//   const networkInterfaces = os.networkInterfaces();

//   for (const interfaceName in networkInterfaces) {
//     const interfaces = networkInterfaces[interfaceName];
//     if (interfaces) {
//       for (const iface of interfaces) {
//         if (!iface.internal && iface.family === 'IPv4') {
//           console.log(`🌐 IP publique détectée automatiquement: ${iface.address} (interface: ${interfaceName})`);
//           return iface.address;
//         }
//       }
//     }
//   }

//   console.log("⚠️ Aucune IP publique détectée, utilisation de localhost");
//   return 'localhost';
// };

// // Détection intelligente de l'IP publique
// let PUBLIC_IP: string;
// if (process.env.PUBLIC_IP && process.env.PUBLIC_IP !== 'auto') {
//   PUBLIC_IP = process.env.PUBLIC_IP;
//   console.log(`🎯 Utilisation de l'IP définie manuellement: ${PUBLIC_IP}`);
// } else {
//   PUBLIC_IP = getPublicIP();
// }

// const prisma = new PrismaClient();

// // Fonction utilitaire pour détecter les requêtes Prometheus
// function scrappingMessage(method: string, url: string, userAgent: string | undefined) {
//   if (url === '/metrics' && userAgent && userAgent.includes('Prometheus')) {
//     return 'Prometheus Scraping';
//   }
//   return null;
// }

// // Interface pour les options HTTPS
// interface HttpsOptions {
//   key: Buffer;
//   cert: Buffer;
// }

// // Fonction pour charger les certificats SSL avec gestion d'erreur améliorée
// const loadSSLCertificates = (): HttpsOptions | null => {
//   try {
//     const sslPath = path.join(__dirname, '../ssl');

//     if (!fs.existsSync(path.join(sslPath, 'key.pem')) ||
//         !fs.existsSync(path.join(sslPath, 'cert.pem'))) {
//       console.log("ℹ️ Certificats SSL non trouvés - le serveur fonctionnera en HTTP");
//       console.log("📊 Les métriques seront accessibles en HTTP sur /metrics");
//       return null;
//     }

//     const httpsOptions: HttpsOptions = {
//       key: fs.readFileSync(path.join(sslPath, 'key.pem')),
//       cert: fs.readFileSync(path.join(sslPath, 'cert.pem'))
//     };

//     console.log("✅ Certificats SSL chargés avec succès");
//     console.log("⚠️ ATTENTION: Avec HTTPS activé, les métriques Prometheus nécessitent une configuration spéciale");
//     return httpsOptions;
//   } catch (error: any) {
//     console.error("❌ Erreur lors du chargement des certificats SSL:", error.message);
//     console.log("⚠️ Le serveur fonctionnera en HTTP - idéal pour les métriques Prometheus");
//     return null;
//   }
// };

// // Chargement des certificats
// const httpsOptions: HttpsOptions | null = loadSSLCertificates();

// // Création du serveur principal unifié
// const app = fastify({
//   logger: {
//     level: 'info',
//   },
//   // Configuration HTTPS conditionnelle
//   ...(httpsOptions && { https: httpsOptions }),
//   trustProxy: true,
//   disableRequestLogging: false
// });

// // Configuration des hooks de logging et métriques
// app.addHook('onRequest', async (request, reply) => {
//   request.startTime = Date.now();

//   const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

//   // Log spécial pour Prometheus pour éviter le spam de logs
//   if (scrapping) {
//     logger.debug({
//       type: 'prometheus_request',
//       message: scrapping,
//       method: request.method,
//       url: request.url,
//       ip: request.ip
//     });
//   } else {
//     logger.info({
//       type: 'http_request',
//       method: request.method,
//       url: request.url,
//       ip: request.ip,
//       userAgent: request.headers['user-agent']
//     });
//   }
// });

// app.addHook('onResponse', async (request, reply) => {
//   const responseTime = Date.now() - (request.startTime || 0);
//   const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

//   if (scrapping) {
//     logger.debug({
//       type: 'prometheus_response',
//       message: scrapping,
//       method: request.method,
//       url: request.url,
//       statusCode: reply.statusCode,
//       responseTime: responseTime
//     });
//   } else {
//     logger.info({
//       type: 'http_response',
//       method: request.method,
//       url: request.url,
//       statusCode: reply.statusCode,
//       responseTime: responseTime
//     });
//   }
// });

// app.addHook('onError', async (request, reply, error) => {
//   logger.error({
//     type: 'http_error',
//     method: request.method,
//     url: request.url,
//     error: error.message,
//     stack: error.stack
//   });
// });

// // Configuration du serveur principal
// const setupMainServer = async () => {
//   console.log("📦 Configuration du serveur principal...");

//   // IMPORTANT: Enregistrement du plugin de métriques sur le serveur principal
//   console.log("📊 Enregistrement du plugin de métriques Prometheus...");
//   await app.register(metricsPlugin);

//   // Configuration des cookies avec clé secrète adaptée à votre .env
//   await app.register(cookie, {
//     secret: process.env.COOKIE_SECRET || process.env.SECURITY_KEY || 'fallback-secret-key-for-dev',
//     parseOptions: {},
//   } as FastifyCookieOptions);

//   // Configuration WebSocket
//   await app.register(fastifyWebsocket, {
//     options: {
//       maxPayload: 1024 * 1024 * 10,
//       clientTracking: true,
//       perMessageDeflate: false,
//     },
//   });

//   // Configuration multipart pour les uploads
//   await app.register(fastifyMultipart, {
//     limits: {
//       fileSize: 5 * 1024 * 1024,
//       files: 1
//     }
//   });

//   // Configuration des fichiers statiques - avatars en premier
//   console.log("📁 Enregistrement des avatars statiques...");
//   await app.register(async function (fastify) {
//     await fastify.register(fastifyStatic, {
//       root: path.join(PROJECT_ROOT, "public", "avatars"),
//       prefix: "/avatars/",
//       decorateReply: false,
//     });
//   });

//   // Configuration des fichiers statiques - frontend en second
//   console.log("📁 Enregistrement des fichiers statiques du frontend...");
//   await app.register(async function (fastify) {
//     await fastify.register(fastifyStatic, {
//       root: path.join(__dirname, "../../frontend/src"),
//       prefix: "/",
//     });
//   });

//   // Enregistrement des routes API
//   console.log("🛣️ Enregistrement des routes...");
//   await registerNewUser(app, prisma);
//   await handleLogIn(app, prisma);
//   await registerProfileRoute(app, prisma);
//   await chatWebSocketRoutes(app, prisma);
//   await registerNotificationRoutes(app, prisma);

//   // Route de santé pour le monitoring
//   app.get('/health', async (request, reply) => {
//     return {
//       status: 'ok',
//       timestamp: new Date().toISOString(),
//       version: process.env.npm_package_version || '1.0.0',
//       ssl: httpsOptions ? 'enabled' : 'disabled'
//     };
//   });

//   // Configuration du gestionnaire 404 pour le SPA
//   app.setNotFoundHandler((_req, reply) => {
//     reply.sendFile("index.html");
//   });
// };

// // Création du serveur de redirection HTTP (si nécessaire)
// const createHttpRedirectServer = () => {
//   if (!httpsOptions) {
//     console.log("ℹ️ Pas de certificats SSL, serveur HTTP unique sur le port", MAIN_PORT);
//     console.log("📊 Les métriques seront disponibles sur: http://localhost:" + MAIN_PORT + "/metrics");
//     return null;
//   }

//   console.log("🔄 Création du serveur de redirection HTTP...");
//   const httpRedirectApp = fastify({
//     logger: { level: 'info' }
//   });

//   httpRedirectApp.addHook('onRequest', async (request, reply) => {
//     const clientHost = request.headers.host?.split(':')[0] || 'localhost';
//     let redirectHost = PUBLIC_IP;

//     if (clientHost === 'localhost' || clientHost === '127.0.0.1') {
//       redirectHost = 'localhost';
//     }

//     const httpsUrl = `https://${redirectHost}:${MAIN_PORT.toString()}${request.url}`;
//     console.log(`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`);

//     reply.redirect(httpsUrl, 301);
//   });

//   return httpRedirectApp;
// };

// // Fonction de démarrage principale
// const start = async () => {
//   try {
//     console.log("🚀 Démarrage du serveur Trans-App...");
//     console.log(`🌐 Configuration réseau: IP=${PUBLIC_IP}, Port principal=${MAIN_PORT}`);

//     // Test de connexion à la base de données
//     console.log("🗄️ Test de connexion à la base de données...");
//     await prisma.$connect();
//     console.log("✅ Base de données connectée avec succès");

//     // Configuration du serveur principal
//     await setupMainServer();

//     // Démarrage du serveur principal
//     const protocol = httpsOptions ? 'HTTPS' : 'HTTP';
//     console.log(`🚀 Démarrage du serveur ${protocol} principal sur le port ${MAIN_PORT}...`);
//     await app.listen({
//       port: MAIN_PORT,
//       host: '0.0.0.0'
//     });

//     console.log(`✅ Serveur ${protocol} démarré avec succès`);
//     console.log(`🔗 Accès local: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`);
//     console.log(`📊 Métriques Prometheus: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}/metrics`);

//     if (PUBLIC_IP !== 'localhost') {
//       console.log(`🌍 Accès réseau: ${protocol.toLowerCase()}://${PUBLIC_IP}:${MAIN_PORT}`);
//     }

//     // Si HTTPS est configuré, créer un serveur de redirection HTTP sur le port 80
//     if (httpsOptions && HTTP_REDIRECT_PORT !== MAIN_PORT) {
//       const httpRedirectApp = createHttpRedirectServer();
//       if (httpRedirectApp) {
//         console.log(`🌐 Démarrage du serveur de redirection HTTP sur le port ${HTTP_REDIRECT_PORT}...`);
//         await httpRedirectApp.listen({
//           port: HTTP_REDIRECT_PORT,
//           host: '0.0.0.0'
//         });
//         console.log(`✅ Serveur de redirection HTTP démarré: port ${HTTP_REDIRECT_PORT} → HTTPS:${MAIN_PORT}`);
//       }
//     }

//     // Instructions spéciales pour Docker et Prometheus
//     console.log("\n📋 Instructions pour votre stack Docker:");
//     console.log(`   - Prometheus doit cibler: http://dev:${MAIN_PORT}/metrics`);
//     console.log(`   - Grafana accessible sur: http://localhost:9080`);
//     console.log(`   - Application principale: ${protocol.toLowerCase()}://localhost:${MAIN_PORT}`);

//   } catch (err) {
//     if (typeof err === 'string') {
//       logger.error(err);
//     } else if (err instanceof Error) {
//       logger.error({
//         error: err.message,
//         stack: err.stack
//       });
//     }
//     process.exit(1);
//   }
// };

// // Gestion propre de l'arrêt du serveur
// const gracefulShutdown = async (signal: string) => {
//   console.log(`🛑 Signal ${signal} reçu, arrêt propre en cours...`);
//   try {
//     await app.close();
//     await prisma.$disconnect();
//     console.log("✅ Arrêt propre terminé");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Erreur lors de l'arrêt:", error);
//     process.exit(1);
//   }
// };

// // Gestionnaires de signaux
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// // Gestionnaires d'erreurs globales
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// process.on('uncaughtException', (error) => {
//   console.error('❌ Uncaught Exception:', error);
//   process.exit(1);
// });

// // Démarrage du serveur
// start();


















// import { logger } from './utils/logger.js';
// import { metricsPlugin } from './utils/metricsPlugin.js';
// // import { url } from 'inspector';
// import fastify from "fastify";
// import { registerNewUser } from "./routes/signup.js";
// // import { FastifyRequest } from "fastify";
// import { handleLogIn } from "./routes/login.js";
// import { registerProfileRoute } from "./routes/profile.js";
// import fastifyStatic from "@fastify/static";
// import fastifyWebsocket from "@fastify/websocket"; // ✅ Import corrigé
// import fastifyMultipart from "@fastify/multipart";
// import path from "path";
// import { fileURLToPath } from "url";
// import { PrismaClient } from "@prisma/client";
// // import websocketPlugin from "./plugins/websocket.js";
// import chatWebSocketRoutes from "./routes/chat.js";
// import cookie from '@fastify/cookie'
// import type { FastifyCookieOptions } from '@fastify/cookie'
// import { registerNotificationRoutes } from "./routes/notifications.js";
// // import { registerGameRoute } from "./routes/game.js";
// import fs from 'fs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// export const PROJECT_ROOT = path.resolve(__dirname, "../../");

// declare module 'fastify' {
//   interface FastifyRequest {
//     startTime?: number;
//   }
// }

// const prisma = new PrismaClient();
// const app = fastify({ logger: false, disableRequestLogging: false });

// logger.info("Enregistrement du plugin de métriques Prometheus");
// app.register(metricsPlugin);


// function scrappingMessage(method: string, url: string, userAgent: string | undefined) {
// 	if (url === '/metrics' && userAgent && userAgent.includes('Prometheus')) {
// 		return 'Scrapping';
// 	}
// }

// app.addHook('onRequest', async (request, reply) => {
//   request.startTime = Date.now();

//   const baseMessage = request.body;
//   const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

//   logger.info({
//     type: 'http_request',
//     message: scrapping || baseMessage,
//     method: request.method,
//     url: request.url,
//     ip: request.ip,
//     userAgent: request.headers['user-agent']
//   });
// });

// app.addHook('onResponse', async (request, reply) => {
//   const responseTime = Date.now() - (request.startTime || 0);

// const baseMessage = request.body;
//   const scrapping = scrappingMessage(request.method, request.url, request.headers['user-agent']);

//   logger.info({
//     type: 'http_response',
// 	message:  scrapping || baseMessage,
//     method: request.method,
//     url: request.url,
//     statusCode: reply.statusCode,
//     responseTime: responseTime
//   });
// });

// app.addHook('onError', async (request, reply, error) => {
//   logger.error({
//     type: 'http_error',
//     method: request.method,
//     url: request.url,
//     error: error.message,
//     stack: error.stack
//   });
// });

// const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3001;
// const HTTPS_PORT = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : 3443;

// const PUBLIC_IP = '10.16.13.4';

// let root = path.join(__dirname, 'frontend');
// logger.info("Configuration du serveur");

// let httpsOptions;
// try{
// 	httpsOptions = {
// 		key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
// 		cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
// 	};
// 	console.log("✅ Certificats SSL chargés avec succès");
// } catch (error : any) {
// 	  console.error("❌ Erreur lors du chargement des certificats SSL:", error.message);
// }

// const httpsApp = fastify({
//   logger: {
//     level: 'info',
//   },
//   https: httpsOptions,
//   http2: false,
//   trustProxy: true
// });


// const httpApp = fastify({
//   logger: {
//     level: 'info',
//   }
// });

// const setupHttpsApp = async () => {
// 	console.log("📦 Configuration du serveur HTTPS...");

// 	await httpsApp.register(cookie, {
// 		secret: process.env.COOKIE_SECRET || 'fallback-secret-key-for-dev',
// 		parseOptions: {},
// 	} as FastifyCookieOptions);

// 	await httpsApp.register(fastifyWebsocket, {
// 		options: {
// 		maxPayload: 1024 * 1024 * 10,
// 		clientTracking: true,
// 		perMessageDeflate: false,
// 		},
// 	});

// 	await httpsApp.register(fastifyMultipart, {
// 		limits: {
// 		fileSize: 5 * 1024 * 1024,
// 		files: 1
// 		}
// 	});

// 	console.log("📁 Registering avatars static files...");
// 	await httpsApp.register(async function (fastify) {
// 		await fastify.register(fastifyStatic, {
// 			root: path.join(PROJECT_ROOT, "public", "avatars"),
// 			prefix: "/avatars/",
// 			decorateReply: false,
// 		});
// 	});

// 	// Register frontend static SECOND
// 	console.log("📁 Registering frontend static files...");
// 	await httpsApp.register(async function (fastify) {
// 		await fastify.register(fastifyStatic, {
// 			root: path.join(__dirname, "../../frontend/src"),
// 			prefix: "/",
// 		});
// 	});

// 	console.log("🛣️ Enregistrement des routes HTTPS...");
// 	await registerNewUser(httpsApp, prisma);
// 	await handleLogIn(httpsApp, prisma);
// 	await registerProfileRoute(httpsApp, prisma);
// 	//await registerGameRoute(httpsApp, prisma);

// 	await chatWebSocketRoutes(httpsApp, prisma);
// 	await registerNotificationRoutes(httpsApp, prisma);

// 	// Make sure the setNotFoundHandler comes AFTER all static registrations
// 	httpsApp.setNotFoundHandler((_req, reply) => {
// 		reply.sendFile("index.html");
// 	});
// };

// const setupHttpApp = async () => {
// 	console.log("📦 Configuration du serveur HTTP (redirection)...");

// 	httpApp.addHook('onRequest', async (request, reply) => {
// 		const clientHost = request.headers.host?.split(':')[0] || 'localhost';
// 		let redirectHost = PUBLIC_IP;

// 		// Si la connexion vient de localhost, rediriger vers localhost
// 		if (clientHost === 'localhost' || clientHost === '127.0.0.1') {
// 			redirectHost = 'localhost';
// 		}
// 		const httpsUrl = `https://${redirectHost}:${HTTPS_PORT}${request.url}`;
// 		console.log(`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`);
// 		reply.redirect(301, httpsUrl);
// 	});
// };

// const start = async () => {
// //   try {
// //     await app.listen({ port: 3000, host: '0.0.0.0'});
// //     logger.info(`App is listening on port: 3000`);

// //   }
// 	try{
// 		console.log("🚀 Démarrage des serveurs HTTP et HTTPS...");

// 		console.log("🗄️ Test de connexion à la base de données...");
// 		await prisma.$connect();
// 		console.log("✅ Base de données connectée avec succès");

// 		await setupHttpsApp();
// 		//await setupHttpApp();

// 		console.log(`🔒 Démarrage du serveur HTTPS sur le port ${HTTPS_PORT}...`);
// 		await httpsApp.listen({
// 			port: HTTPS_PORT,
// 			host: '0.0.0.0'
// 		});

// 		// console.log(`🌐 Démarrage du serveur HTTP sur le port ${HTTP_PORT}...`);
// 		// await httpApp.listen({
// 		// 	port: HTTP_PORT,
// 		// 	host: '0.0.0.0'
// 		// });

// 	} catch (err) {
// 		if (typeof err === 'string') {
// 		logger.error(err);
// 		} else if (err instanceof Error) {
// 		logger.error({
// 			error: err.message,
// 			stack: err.stack
// 		});
// 		}
// 		process.exit(1);
// 	};
// }

// // process.on('SIGINT', async () => {
// //     console.log('🛑 Received SIGINT, shutting down gracefully...');
// //     await app.close();
// //     await prisma.$disconnect();
// //     process.exit(0);
// // });

// // process.on('SIGTERM', async () => {
// //     console.log('🛑 Received SIGTERM, shutting down gracefully...');
// //     await app.close();
// //     await prisma.$disconnect();
// //     process.exit(0);
// // });

// // process.on('unhandledRejection', (reason, promise) => {
// //     console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
// //     process.exit(1);
// // });

// // process.on('uncaughtException', (error) => {
// //     console.error('❌ Uncaught Exception:', error);
// //     process.exit(1);
// // });

// start();