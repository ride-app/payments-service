import LedgerRepository from '../services/ledger-repository';
import { LedgerRepositoryHandlers } from '../proto/accountsService/LedgerRepository';

const ledgerRepositoryHandlers: LedgerRepositoryHandlers = {
	addTransactions: (call, callback) => {
		return callback(null, LedgerRepository.addTransactions(call.request));
	},
	getTransaction: (call, callback) => {
		return callback(null, LedgerRepository.getTransaction(call.request));
	},
	listTransactionsForAccountId: (call, callback) => {
		return callback(
			null,
			LedgerRepository.listTransactionsForAccountId(call.request)
		);
	},
};

export default ledgerRepositoryHandlers;
