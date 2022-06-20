import { status } from "@grpc/grpc-js";
import { ExpectedError, Reason } from "../errors/expected-error";

import { IWalletService } from "../gen/ride/wallet/v1alpha1/wallet_service.grpc-server";
import getWallet from "./get-wallet";
import listTransactions from "./list-transactions";
import getTransaction from "./get-transaction";
import createTransaction from "./create-transaction";
import batchCreateTransactions from "./batch-create-transactions";

function handleError(callback: CallableFunction, error: unknown) {
	let code = status.INTERNAL;
	let message = "Something Went Wrong";

	if (error instanceof ExpectedError) {
		switch (error.reason) {
			case Reason.INVALID_ARGUMENT:
				code = status.INVALID_ARGUMENT;
				break;
			case Reason.ALREADY_EXISTS:
				code = status.ALREADY_EXISTS;
				break;
			case Reason.BAD_STATE:
				code = status.FAILED_PRECONDITION;
				break;
			case Reason.NOT_FOUND:
				code = status.NOT_FOUND;
				break;

			default:
				break;
		}
		message = error.message;
	}

	callback({
		code,
		message,
	});
}

const handlers: IWalletService = {
	// createWallet: async (call, callback) => {
	// 	try {
	// 		if (call.request.uid === "") {
	// 			throw new ExpectedError("uid is empty", Reason.INVALID_ARGUMENT);
	// 		}
	// 		callback(null, await createWallet(call.request));
	// 	} catch (error) {
	// 		handleError(callback, error);
	// 	}
	// },
	getWallet: async (call, callback) => {
		try {
			callback(null, await getWallet(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	// getWalletByUid: async (call, callback) => {
	// 	try {
	// 		if (call.request.uid === "") {
	// 			throw new ExpectedError("uid is empty", Reason.INVALID_ARGUMENT);
	// 		}
	// 		callback(null, await getWalletByUid(call.request));
	// 	} catch (error) {
	// 		handleError(callback, error);
	// 	}
	// },
	createTransaction: async (call, callback) => {
		try {
			callback(null, await createTransaction(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},

	batchCreateTransactions: async (call, callback) => {
		try {
			callback(null, await batchCreateTransactions(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},

	getTransaction: async (call, callback) => {
		try {
			callback(null, await getTransaction(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},

	listTransactions: async (call, callback) => {
		try {
			callback(null, await listTransactions(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
};

export default handlers;
