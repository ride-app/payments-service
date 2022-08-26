import { Server, ServerCredentials } from "@grpc/grpc-js";
import { initializeApp } from "firebase-admin/app";
import walletServiceHandlers from "./wallet-service/handlers.js";

import { walletServiceDefinition } from "./gen/ride/wallet/v1alpha1/wallet_service_pb.grpc-server.js";

const port = process.env.PORT || 50051;

const server = new Server();

server.addService(walletServiceDefinition, walletServiceHandlers);

server.bindAsync(
	`0.0.0.0:${port}`,
	ServerCredentials.createInsecure(),
	(err, p) => {
		if (err) {
			console.error(err);
			return;
		}

		initializeApp();
		server.start();
		console.info(`${Date.now()}: server listening to port ${p}`);
	}
);
