import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();
const port = 3000;

let root = path.join(__dirname, 'frontend');
console.log(root);
app.register(fastifyStatic, {
	root: path.join(__dirname, '../../frontend/dist'),
	prefix: '/',
});

app.setNotFoundHandler((_req, reply) => {
	reply.sendFile('index.html');
});


app.listen({ port:port }, () => {
	console.log(`App is listening on port: ${port}`);
});