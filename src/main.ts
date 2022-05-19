import { Server, ServerCredentials } from "@grpc/grpc-js";
import { initializeApp } from "firebase-admin/app";
import walletServiceHandlers from "./wallet-service/handlers";
import rechargeServiceHandlers from "./recharge-service/handlers";

import { walletServiceDefinition } from "./gen/ride/wallet/v1alpha1/wallet_service.grpc-server";
import { rechargeServiceDefinition } from "./gen/ride/wallet/recharge/v1alpha1/recharge_service.grpc-server";

const port = process.env.PORT || 50051;

const server = new Server();

server.addService(walletServiceDefinition, walletServiceHandlers);
server.addService(rechargeServiceDefinition, rechargeServiceHandlers);

server.bindAsync(
	`localhost:${port}`,
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
