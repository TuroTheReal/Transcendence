import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();
const port = 3000;
const host = '0.0.0.0'; // to be available out of the docker container

let root = path.join(__dirname, 'frontend');
console.log(root);
app.register(fastifyStatic, {
	root: path.join(__dirname, '../../frontend/dist'),
	prefix: '/',
});

app.setNotFoundHandler((_req, reply) => {
	reply.sendFile('index.html');
});


app.listen({ port:port, host:host }, () => {
	console.log(`App is listening on port: ${port}`);
});