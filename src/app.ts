import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/wallet-service';
import walletServiceHandlers from './wallet-service-handlers';

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync('accounts_service.proto', {
	keepCase: true,
	longs: Number,
	enums: String,
	defaults: true,
	oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(
	packageDefinition
) as unknown as ProtoGrpcType;

// The protoDescriptor object has the full package hierarchy
const { walletService } = protoDescriptor;

const server = new grpc.Server();

server.addService(walletService.WalletService.service, walletServiceHandlers);

export default server;
