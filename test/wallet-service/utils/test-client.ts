import { credentials, Server, ServerCredentials } from "@grpc/grpc-js";
import { WalletServiceClient } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";

import { walletServiceDefinition } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-server";
import walletServiceHandlers from "../../../src/wallet-service/handlers";

const server = new Server();

let client: WalletServiceClient;

function startTestClient(): Promise<WalletServiceClient> {
	server.addService(walletServiceDefinition, walletServiceHandlers);
	return new Promise((resolve) => {
		server.bindAsync(
			`localhost:50051`,
			ServerCredentials.createInsecure(),
			(err) => {
				if (err) {
					throw err;
				}

				server.start();
				client = new WalletServiceClient(
					"localhost:50051",
					credentials.createInsecure()
				);
				resolve(client);
			}
		);
	});
}

function closeTestClient() {
	client.close();
	server.tryShutdown((err) => {
		if (err) {
			console.error(err);
		}
	});
}

export { startTestClient, closeTestClient };
