import { createServer } from "http2";
// import { connectNodeAdapter } from "@bufbuild/connect-node";
// import routes from "./wallet-service/service.js";

const server = createServer(
	(req, res) => {
		res.write(req.url); // write a response to the client
		res.end(); // end the response
	}
	// connectNodeAdapter({ routes }) // responds with 404 for other requests
);

export default server;
