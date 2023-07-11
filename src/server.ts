import { createServer } from "http";
import { connectNodeAdapter } from "@bufbuild/connect-node";
import routes from "./wallet-service/service.js";

const server = createServer(
	connectNodeAdapter({ routes }) // responds with 404 for other requests
);

export default server;
