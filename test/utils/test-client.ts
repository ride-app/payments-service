import {
	credentials,
	loadPackageDefinition,
	ServerCredentials,
} from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { WalletServiceClient } from '../../src/generated/ride/wallet/v1/WalletService';

import { ProtoGrpcType } from '../../src/generated/wallet_service';
import server from '../../src/server';

let client: WalletServiceClient;

function startTestClient(): Promise<WalletServiceClient> {
	return new Promise((resolve) => {
		server.bindAsync(
			`localhost:50051`,
			ServerCredentials.createInsecure(),
			(err) => {
				if (err) {
					throw err;
				}

				const packageDefinition = loadSync(
					`${__dirname}/../../protos/ride/wallet/v1/wallet_service.proto`,
					{
						// keepCase: true,
						longs: Number,
						enums: String,
						defaults: true,
						oneofs: true,
					}
				);
				const protoDescriptor = loadPackageDefinition(
					packageDefinition
				) as unknown as ProtoGrpcType;

				// The protoDescriptor object has the full package hierarchy
				const { ride } = protoDescriptor;

				server.start();
				client = new ride.wallet.v1.WalletService(
					'localhost:50051',
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
