import { status } from '@grpc/grpc-js';
import { WalletServiceHandlers } from './generated/ride/wallet/v1/WalletService';
import {
	createAccount,
	getAccount,
	getAccountByUid,
	createTransactions,
	getTransaction,
	listTransactionsByBatchId,
	listTransactionsByAccountId,
} from './wallet-service';
import { ExpectedError, Reason } from './errors/expected-error';
import { TransactionType } from './generated/ride/wallet/v1/TransactionType';

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

	callback({
		code,
		message,
	});
}

const handlers: WalletServiceHandlers = {
	CreateAccount: async (call, callback) => {
		try {
			if (call.request.uid === '') {
				throw new ExpectedError('uid is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await createAccount(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	GetAccount: async (call, callback) => {
		try {
			if (call.request.accountId === '') {
				throw new ExpectedError('accountId is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await getAccount(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	GetAccountByUid: async (call, callback) => {
		try {
			if (call.request.uid === '') {
				throw new ExpectedError('uid is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await getAccountByUid(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	CreateTransactions: async (call, callback) => {
		try {
			if (call.request.transactions.length === 0) {
				throw new ExpectedError(
					'transactions is empty',
					Reason.INVALID_ARGUMENT
				);
			}

			call.request.transactions.every((transaction, i) => {
				if (transaction.accountId === '') {
					throw new ExpectedError(
						`accountId is empty for transaction ${i}`,
						Reason.INVALID_ARGUMENT
					);
				}
				if (transaction.amount < 0) {
					throw new ExpectedError(
						`Transaction amount must be positive. Got ${transaction.amount} for transaction ${i}`,
						Reason.INVALID_ARGUMENT
					);
				}
				if (
					transaction.type ===
					TransactionType.TRANSACTION_TYPE_UNSPECIFIED.toString()
				) {
					throw new ExpectedError(
						`Transaction type is not specified for transaction ${i}`,
						Reason.INVALID_ARGUMENT
					);
				}
				return true;
			});

			callback(null, await createTransactions(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	GetTransaction: async (call, callback) => {
		try {
			if (call.request.transactionId === '') {
				throw new ExpectedError(
					'transactionId is empty',
					Reason.INVALID_ARGUMENT
				);
			}
			callback(null, await getTransaction(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	ListTransactionsByBatchId: async (call, callback) => {
		try {
			if (call.request.batchId === '') {
				throw new ExpectedError('batchId is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await listTransactionsByBatchId(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	ListTransactionsByAccountId: async (call, callback) => {
		try {
			if (call.request.accountId === '') {
				throw new ExpectedError('accountId is empty', Reason.INVALID_ARGUMENT);
			}
			callback(null, await listTransactionsByAccountId(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
};

export default handlers;
