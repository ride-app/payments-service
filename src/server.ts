import { createServer } from "http";
// import { connectNodeAdapter } from "@bufbuild/connect-node";
// import routes from "./wallet-service/service.js";

const server = createServer(
	(req, res) => {
		res.write("Hello World!"); // write a response to the client
		res.end(); // end the response
	}
	// connectNodeAdapter({ routes }) // responds with 404 for other requests
);

export default server;
