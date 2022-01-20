import { status } from '@grpc/grpc-js';
import { WalletServiceHandlers } from './proto/app/ride/walletService/WalletService';
import {
	createAccount,
	getAccount,
	getAccountByUid,
	getTransaction,
	getTransactionsByBatchId,
	listTransactionsForAccount,
	addTransactions,
} from './wallet-service';
import { ExpectedError, Reason } from './errors/expected-error';

function handleError(callback: CallableFunction, error: unknown) {
	let code = status.INTERNAL;
	let message = 'Something Went Wrong';

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
	// if (error instanceof InvalidArgumentError) {
	// 	code = status.INVALID_ARGUMENT;
	// 	message = error.message;
	// } else if (error instanceof InternalError) {
	// 	code = status.INTERNAL;
	// 	message = error.message;
	// }

	callback({
		code,
		message,
	});
}

const handlers: WalletServiceHandlers = {
	createAccount: async (call, callback) => {
		try {
			if (call.request.uid === '') {
				throw new ExpectedError('uid is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await createAccount(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	getAccount: async (call, callback) => {
		try {
			if (call.request.accountId === '') {
				throw new ExpectedError('accountId is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await getAccount(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	getAccountByUid: async (call, callback) => {
		try {
			if (call.request.uid === '') {
				throw new ExpectedError('uid is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await getAccountByUid(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	addTransactions: async (call, callback) => {
		try {
			callback(null, await addTransactions(call.request));
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
	getTransactionsByBatchId: async (call, callback) => {
		try {
			callback(null, await getTransactionsByBatchId(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	listTransactionsForAccount: async (call, callback) => {
		try {
			callback(null, await listTransactionsForAccount(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
};

export default handlers;
