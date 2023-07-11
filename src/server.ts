import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@bufbuild/connect-fastify";
import routes from "./wallet-service/service.js";

const server = fastify();

await server.register(fastifyConnectPlugin, {
	routes,
});

export default server;
