import { loadPackageDefinition, Server } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { ProtoGrpcType } from './generated/wallet-service';
import walletServiceHandlers from './handlers';

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = loadSync(
	`${__dirname}/../protos/wallet-service.proto`,
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

const server = new Server();

server.addService(ride.wallet.v1.WalletService.service, walletServiceHandlers);

export default server;
