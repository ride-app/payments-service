import { addTransactionsRequest__Output } from '../proto/accountsService/addTransactionsRequest';
import { addTransactionsResponse } from '../proto/accountsService/addTransactionsResponse';
import { getTransactionRequest__Output } from '../proto/accountsService/getTransactionRequest';
import { Transaction } from '../proto/accountsService/Transaction';
import { listTransactionRequest__Output } from '../proto/accountsService/listTransactionRequest';
import { listTransactionResponse } from '../proto/accountsService/listTransactionResponse';

class LedgerRepository {
	static addTransactions(
		request: addTransactionsRequest__Output
	): addTransactionsResponse {
		return {
			accountId: '123',
			transactionIds: ['123', '456'],
		};
	}

	static getTransaction(request: getTransactionRequest__Output): Transaction {
		return {
			transactionId: '123',
			accountId: '123',
			amount: 100,
			timestamp: new Date().toISOString(),
			type: 'CREDIT',
		};
	}

	static listTransactionsForAccountId(
		request: listTransactionRequest__Output
	): listTransactionResponse {
		return {
			transactions: [
				{
					transactionId: '123',
					accountId: '123',
					amount: 100,
					timestamp: new Date().toISOString(),
					type: 'CREDIT',
				},
			],
		};
	}
}

export default LedgerRepository;
