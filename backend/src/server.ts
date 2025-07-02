import fastify from 'fastify';
import { registerNewUser } from './signup.js';
import { handleLogIn } from './login.js';
import { registerProfileRoute } from './profile.js'
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

import Fastify, { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { logger, sendLogToLogstash } from './utils/logger.js';
import { httpRequestsTotal, httpRequestDuration, getMetrics } from './utils/metrics.js';


/*To do AGT:
 - Add Error management to signup and login;
 - Add rules to passwords and username;
 - Fix image display;
 - User profiles display stats, such as wins and losses.
 - Match History including 1v1 games, dates, and relevant details, accessible to logged-in users.
 - Implement Google Sign-In
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");


declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}


const prisma = new PrismaClient();
// logger.info(prisma);
const app = fastify({ logger: false });

app.addHook('onRequest', async (request) => {
	request.startTime = Date.now()
});

app.addHook('onResponse', async (request, reply) => {
	const duration = (Date.now() - (request.startTime || Date.now())) / 1000

	httpRequestsTotal.inc({
		method: request.method,
		route: request.url || 'unknow',
		status_code: reply.statusCode.toString()
	});

	httpRequestDuration.observe({
		method: request.method,
		route: request.url || 'unknow'
	}, duration);

	await sendLogToLogstash({
		method: request.method,
		url: request.url,
		status: reply.statusCode,
		duration: duration,
		level: 'info'
	});
});

app.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
  reply.type('text/plain');
  return await getMetrics();
});

app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  logger.info('Home page accessed');
  return { message: 'Transcendence with monitoring!' };
});

app.post('/api/test-log', async (request: FastifyRequest, reply: FastifyReply) => {
  logger.info('Test log endpoint called');
  await sendLogToLogstash({
    message: 'Manual test log from API',
    level: 'info',
    user_action: 'test_endpoint_called'
  });
  return { success: true };
});





let root = path.join(__dirname, 'frontend');
logger.info(root);

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

logger.info("REGISTERING NEW USER")
registerNewUser(app, prisma);

logger.info("LOGGING IN NEW USER")
handleLogIn(app, prisma);

logger.info("GET USER INFO FOR FRONTEND")
registerProfileRoute(app, prisma);

const start = async () => {
	try {
		await app.listen({ port: 3000, host: '0.0.0.0'});
		logger.info(`App is listening on port: 3000`);
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

start();
