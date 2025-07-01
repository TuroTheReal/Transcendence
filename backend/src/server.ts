import fastify from 'fastify';
import { registerNewUser } from './signup.js';
import { handleLogIn } from './login.js';
import { registerProfileRoute } from './profile.js'
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

const prisma = await new PrismaClient();
const app = fastify();

let root = path.join(__dirname, 'frontend');
console.log(root);
app.register(fastifyStatic, {
	root: path.join(__dirname, '../../frontend/src'),
	prefix: '/',
});

app.setNotFoundHandler((_req, reply) => {
	reply.sendFile('index.html');
});


app.register(fastifyStatic, {
  root: path.join(PROJECT_ROOT, './public/avatars'),
  prefix: '/avatars/',
  decorateReply: false,
});

console.log("REGISTERING NEW USER")
registerNewUser(app, prisma);

console.log("LOGGING IN NEW USER")
handleLogIn(app, prisma);

console.log("GET USER INFO FOR FRONTEND")
registerProfileRoute(app, prisma);

const start = async () => {
	try {
		await app.listen({ port: 3000, host: '0.0.0.0'});
		console.log(`App is listening on port: 3000`);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
