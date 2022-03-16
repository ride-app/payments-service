import { Server } from '@grpc/grpc-js';
// import { loadSync } from '@grpc/proto-loader';
// import { ProtoGrpcType } from './generated/wallet_service';
import walletServiceHandlers from './handlers';

import { walletServiceDefinition } from './gen/ride/wallet/v1/wallet_service.grpc-server';

// // Suggested options for similarity to existing grpc.load behavior
// const packageDefinition = loadSync(
// 	`${__dirname}/../protos/ride/wallet/v1/wallet_service.proto`,
// 	{
// 		longs: Number,
// 		enums: String,
// 		defaults: true,
// 		oneofs: true,
// 	}
// );
// const protoDescriptor = loadPackageDefinition(
// 	packageDefinition
// ) as unknown as ProtoGrpcType;

// // The protoDescriptor object has the full package hierarchy
// const { ride } = protoDescriptor;

const server = new Server();

server.addService(walletServiceDefinition, walletServiceHandlers);

export default server;
