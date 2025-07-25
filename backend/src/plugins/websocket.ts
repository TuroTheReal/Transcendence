import { FastifyInstance } from "fastify";
import { fastifyWebsocket } from "@fastify/websocket";

export default async function websocketPlugin(fastify: FastifyInstance) {
	// WebSocket plugin is already registered in server.ts
	console.log("✅ WebSocket plugin configuration ready");
}
