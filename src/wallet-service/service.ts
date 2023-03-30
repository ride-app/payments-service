import type { ConnectRouter } from "@bufbuild/connect";
import { WalletService } from "../gen/ride/wallet/v1alpha1/wallet_service_connect.js";
import getWallet from "./get-wallet.js";
import createTransaction from "./create-transaction.js";
import getTransaction from "./get-transaction.js";
import batchCreateTransactions from "./batch-create-transactions.js";
import listTransactions from "./list-transactions.js";
import verifyAuthHeader from "../utils/verify-auth-header.js";

const routes = (router: ConnectRouter) =>
	router.service(WalletService, {
		getWallet: async (req, context) => {
			await verifyAuthHeader(context);
			return getWallet(req);
		},
		createTransaction,
		batchCreateTransactions,
		getTransaction: async (req, context) => {
			await verifyAuthHeader(context);
			return getTransaction(req);
		},
		listTransactions,
	});

export default routes;
