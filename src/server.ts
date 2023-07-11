import { createServer } from "http";
import { connectNodeAdapter } from "@bufbuild/connect-node";
import routes from "./wallet-service/service.js";

// const server = fastify({ trustProxy: true });

// await server.register(fastifyConnectPlugin, {
// 	routes,
// });

const server = createServer(
	connectNodeAdapter({ routes }) // responds with 404 for other requests
);

export default server;
