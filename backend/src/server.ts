import fastify from 'fastify';
import { registerNewUser } from './signup.js';
import { handleLogIn } from './login.js';
import { registerProfileRoute } from './profile.js'
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

const prisma = new PrismaClient();
const app = fastify({ logger: false, disableRequestLogging: false });

app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();

  // Log chaque requête du frontend
  logger.info({
    type: 'http_request',
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
});

app.addHook('onResponse', async (request, reply) => {
  const responseTime = Date.now() - (request.startTime || 0);

  // Log chaque réponse vers le frontend
  logger.info({
    type: 'http_response',
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: responseTime
  });
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

let root = path.join(__dirname, 'frontend');
logger.info("Configuration du serveur");

app.register(fastifyStatic, {
  root: path.join(__dirname, '../../frontend/src'),
  prefix: '/',
});

app.setNotFoundHandler((_req, reply) => {
  reply.sendFile('index.html');
});

app.register(fastifyStatic, {
  root: path.join(PROJECT_ROOT, 'public'),
  prefix: '/public/',
  decorateReply: false
});

logger.info("REGISTERING NEW USER");
registerNewUser(app, prisma);

logger.info("LOGGING IN NEW USER");
handleLogIn(app, prisma);

logger.info("GET USER INFO FOR FRONTEND");
registerProfileRoute(app, prisma);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0'});
    logger.info(`App is listening on port: 3000`);
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

start();