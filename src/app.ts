import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/accounts_service';
import accountRepositoryHandlers from './handlers/accountRepositoryHandlers';
import ledgerRepositoryHandlers from './handlers/ledgerRepositoryHandlers';

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync('accounts_service.proto', {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(
	packageDefinition
) as unknown as ProtoGrpcType;

// The protoDescriptor object has the full package hierarchy
const { accountsService } = protoDescriptor;

const server = new grpc.Server();

server.addService(
	accountsService.AccountRepository.service,
	accountRepositoryHandlers
);
server.addService(
	accountsService.LedgerRepository.service,
	ledgerRepositoryHandlers
);

export default server;
