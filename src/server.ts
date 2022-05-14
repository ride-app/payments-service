import { Server } from "@grpc/grpc-js";
import walletServiceHandlers from "./wallet-service/handlers";

import { walletServiceDefinition } from "./gen/ride/wallet/v1alpha1/wallet_service.grpc-server";

const server = new Server();

server.addService(walletServiceDefinition, walletServiceHandlers);

export default server;
