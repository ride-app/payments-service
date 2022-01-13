import WalletService from './wallet-service';
import { WalletServiceHandlers } from './proto/walletService/WalletService';

const walletServiceHandlers: WalletServiceHandlers = {
	createAccount: (call, callback) => {
		return callback(null, WalletService.createAccount(call.request));
	},
	getAccount: (call, callback) => {
		callback(null, {
			uid: '123',
			balance: 100,
		});
	},
	getAccountByUid: (call, callback) => {
		callback(null, {
			uid: '456',
			balance: 100,
		});
	},
	addTransactions: (call, callback) => {
		return callback(null, WalletService.addTransactions(call.request));
	},
	getTransaction: (call, callback) => {
		return callback(null, WalletService.getTransaction(call.request));
	},
	getTransactionsByBatchId: (call, callback) => {
		return callback(null, {
			transactions: [
				{
					accountId: '123',
					amount: 100,
					type: 'CREDIT',
					transactionId: '123',
				},
			],
		});
	},
	listTransactionsForAccount: (call, callback) => {
		return callback(
			null,
			WalletService.listTransactionsForAccount(call.request)
		);
	},
};

export default walletServiceHandlers;
