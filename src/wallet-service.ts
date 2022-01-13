import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { Account } from './proto/walletService/Account';
import { createAccountRequest__Output } from './proto/walletService/createAccountRequest';
import { getAccountByUidRequest__Output } from './proto/walletService/getAccountByUidRequest';
import { getAccountRequest__Output } from './proto/walletService/getAccountRequest';
import { addTransactionsRequest__Output } from './proto/walletService/addTransactionsRequest';
import { addTransactionsResponse } from './proto/walletService/addTransactionsResponse';
import { getTransactionRequest__Output } from './proto/walletService/getTransactionRequest';
import { Transaction } from './proto/walletService/Transaction';
import { listTransactionRequest__Output } from './proto/walletService/listTransactionRequest';
import { listTransactionResponse } from './proto/walletService/listTransactionResponse';

class WalletService {
	static createAccount(request: createAccountRequest__Output): Account {
		return {
			accountId: '123',
		};
	}

	static getAccount(request: getAccountRequest__Output): Account {
		return {
			accountId: '123',
		};
	}

	static getAccountByUid(request: getAccountByUidRequest__Output): Account {
		return {
			uid: '456',
		};
	}

	static addTransactions(
		request: addTransactionsRequest__Output
	): addTransactionsResponse {
		let debitBalance = 0;
		let creditBalance = 0;
		let totalValue = 0;
		let valueChange = 0;

		const accountBalances: Record<string, number> = Object.fromEntries(
			request.transactions.map((t) => [t.accountId, 0])
		);

		request.transactions.forEach((transaction) => {
			if (!Number.isInteger(transaction.amount)) {
				throw new Error(
					`Transaction amount must be an integer. Got ${transaction.amount}`
				);
			}

			if (transaction.type === 'CREDIT') {
				creditBalance += transaction.amount;
				accountBalances[transaction.accountId] += transaction.amount;
			} else {
				debitBalance += transaction.amount;
				accountBalances[transaction.accountId] -= transaction.amount;
			}
		});

		Object.values(accountBalances).forEach((amount) => {
			totalValue += Math.abs(amount);
			valueChange += amount;
		});

		if (debitBalance !== creditBalance) {
			throw new Error('Debit and credit balances do not match');
		}

		if (debitBalance !== totalValue || creditBalance !== totalValue) {
			throw new Error('Total value does not match debit and credit balances');
		}

		if (valueChange !== 0) {
			throw new Error('Value change is not zero');
		}

		const batchId = randomUUID();
		const transactionIds: string[] = [];

		const firestore = getFirestore();

		firestore.runTransaction(async (transaction) => {
			const transactionRef = firestore.collection('transactions');

			transaction.set(transactionRef.doc(batchId), {});
		});

		return {
			batchId,
			transactionIds,
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

	static listTransactionsForAccount(
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

export default WalletService;
