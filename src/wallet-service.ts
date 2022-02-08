import { Timestamp as FireTimestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { ExpectedError, Reason } from './errors/expected-error';

import { Account } from './generated/ride/wallet/v1/Account';
import { CreateAccountRequest__Output } from './generated/ride/wallet/v1/CreateAccountRequest';
import { GetAccountRequest__Output } from './generated/ride/wallet/v1/GetAccountRequest';
import { GetAccountByUidRequest__Output } from './generated/ride/wallet/v1/GetAccountByUidRequest';
import { CreateTransactionsRequest__Output } from './generated/ride/wallet/v1/CreateTransactionsRequest';
import { CreateTransactionsResponse } from './generated/ride/wallet/v1/CreateTransactionsResponse';

import { Transaction } from './generated/ride/wallet/v1/Transaction';
import { GetTransactionRequest__Output } from './generated/ride/wallet/v1/GetTransactionRequest';
import { ListTransactionsByBatchIdRequest__Output } from './generated/ride/wallet/v1/ListTransactionsByBatchIdRequest';
import { ListTransactionsByBatchIdResponse } from './generated/ride/wallet/v1/ListTransactionsByBatchIdResponse';
import { ListTransactionsByAccountIdRequest__Output } from './generated/ride/wallet/v1/ListTransactionsByAccountIdRequest';
import { ListTransactionsByAccountIdResponse } from './generated/ride/wallet/v1/ListTransactionsByAccountIdResponse';
import { TransactionType } from './generated/ride/wallet/v1/TransactionType';

import {
	getAccountByUidQuery,
	getAccountQuery,
	createAccountTransaction,
} from './repositories/account-repository';
import {
	createTransactionsMutation,
	CreateTransactionMutationData,
	getTransactionQuery,
	listTransactionsByBatchIdQuery,
	listTransactionsByAccountIdTransaction,
} from './repositories/transaction-repository';

async function createAccount(
	request: CreateAccountRequest__Output
): Promise<Account> {
	const accountId = randomUUID();
	await createAccountTransaction(request.uid, accountId);

	const accountDetails = await getAccountQuery(accountId);

	if (accountDetails?.exists === false) {
		throw new ExpectedError('Account Creation Failed', Reason.NOT_FOUND);
	}

	return {
		accountId,
		balance: accountDetails.get('balance') as number,
		uid: accountDetails.get('uid') as string,
		createTime: {
			seconds: accountDetails.get('createdAt')?.seconds,
			nanos: accountDetails.get('createdAt')?.nanoseconds,
		},
		updateTime: {
			seconds: accountDetails.get('updatedAt')?.seconds,
			nanos: accountDetails.get('updatedAt')?.nanoseconds,
		},
	};
}

async function getAccount(
	request: GetAccountRequest__Output
): Promise<Account> {
	const wallet = await getAccountQuery(request.accountId);

	if (wallet.exists === false) {
		throw new ExpectedError('Account Does Not Exist', Reason.NOT_FOUND);
	}

	return {
		accountId: wallet.id,
		balance: wallet.get('balance') as number,
		uid: wallet.get('uid') as string,
		createTime: {
			seconds: (wallet.get('createdAt') as FireTimestamp).seconds,
			nanos: (wallet.get('createdAt') as FireTimestamp).nanoseconds,
		},
		updateTime: {
			seconds: (wallet.get('updatedAt') as FireTimestamp).seconds,
			nanos: (wallet.get('updatedAt') as FireTimestamp).nanoseconds,
		},
	};
}

async function getAccountByUid(
	request: GetAccountByUidRequest__Output
): Promise<Account> {
	const wallet = await getAccountByUidQuery(request.uid);

	if (wallet.empty) {
		throw new ExpectedError('Account Does Not Exist', Reason.NOT_FOUND);
	}

	return {
		accountId: wallet.docs[0].id,
		uid: wallet.docs[0].get('uid') as string,
		balance: wallet.docs[0].get('balance') as number,
		createTime: {
			seconds: (wallet.docs[0].get('createdAt') as FireTimestamp).seconds,
			nanos: (wallet.docs[0].get('createdAt') as FireTimestamp).nanoseconds,
		},
		updateTime: {
			seconds: (wallet.docs[0].get('updatedAt') as FireTimestamp).seconds,
			nanos: (wallet.docs[0].get('updatedAt') as FireTimestamp).nanoseconds,
		},
	};
}

async function createTransactions(
	request: CreateTransactionsRequest__Output
): Promise<CreateTransactionsResponse> {
	const accountBalances: Record<string, number> = Object.fromEntries(
		request.transactions.map((t) => [t.accountId, 0])
	);

	await Promise.all(
		Object.keys(accountBalances).map(async (accountId) => {
			const account = await getAccountQuery(accountId);

			if (!account.exists) {
				throw new ExpectedError('Account Does Not Exist', Reason.BAD_STATE);
			}
		})
	);

	request.transactions.forEach((transaction) => {
		if (transaction.type === 'CREDIT') {
			accountBalances[transaction.accountId] += transaction.amount;
		} else if (transaction.type === 'DEBIT') {
			accountBalances[transaction.accountId] -= transaction.amount;
		} else {
			throw new ExpectedError('Invalid Transaction Type', Reason.BAD_STATE);
		}
	});

	const batchId = randomUUID();
	const transactionIds: string[] = [];
	const transactionData: Record<string, CreateTransactionMutationData> = {};

	Object.entries(accountBalances).forEach(([accountId, amount]) => {
		if (amount !== 0) {
			const transactionId = randomUUID();
			transactionIds.push(transactionId);
			transactionData[transactionId] = {
				accountId,
				amount: Math.abs(amount),
				type: amount > 0 ? 'CREDIT' : 'DEBIT',
			};
		}
	});

	await createTransactionsMutation(batchId, transactionData);

	return {
		batchId,
		transactionIds,
	};
}

async function getTransaction(
	request: GetTransactionRequest__Output
): Promise<Transaction> {
	const doc = await getTransactionQuery(request.transactionId);

	if (!doc.exists) {
		throw new ExpectedError('Transaction Not Found', Reason.NOT_FOUND);
	}

	return {
		transactionId: doc.id,
		accountId: doc.get('accountId') as string,
		amount: doc.get('amount') as number,
		createTime: {
			seconds: (doc.get('timestamp') as FireTimestamp).seconds,
			nanos: (doc.get('timestamp') as FireTimestamp).nanoseconds,
		},
		type: doc.get('type') as TransactionType,
		batchId: doc.get('batchId') as string,
	};
}

async function listTransactionsByBatchId(
	request: ListTransactionsByBatchIdRequest__Output
): Promise<ListTransactionsByBatchIdResponse> {
	const snap = await listTransactionsByBatchIdQuery(request.batchId);

	if (snap.empty) {
		throw new ExpectedError('Transactions Not Found', Reason.NOT_FOUND);
	}

	return {
		transactions: snap.docs.map((doc) => {
			return {
				transactionId: doc.id,
				accountId: doc.get('accountId') as string,
				amount: doc.get('amount') as number,
				createTime: {
					seconds: (doc.get('timestamp') as FireTimestamp).seconds,
					nanos: (doc.get('timestamp') as FireTimestamp).nanoseconds,
				},
				type: doc.get('type') as TransactionType,
				batchId: doc.get('batchId') as string,
			};
		}),
	};
}

async function listTransactionsByAccountId(
	request: ListTransactionsByAccountIdRequest__Output
): Promise<ListTransactionsByAccountIdResponse> {
	const transactionSnaps = await listTransactionsByAccountIdTransaction(
		request.accountId
	);

	return {
		transactions: transactionSnaps.map((doc) => {
			return {
				transactionId: doc.id,
				accountId: doc.get('accountId') as string,
				amount: doc.get('amount') as number,
				createTime: {
					seconds: (doc.get('timestamp') as FireTimestamp).seconds,
					nanos: (doc.get('timestamp') as FireTimestamp).nanoseconds,
				},
				type: doc.get('type') as TransactionType,
				batchId: doc.get('batchId') as string,
			};
		}),
	};
}

export {
	createAccount,
	getAccount,
	getAccountByUid,
	createTransactions,
	getTransaction,
	listTransactionsByBatchId,
	listTransactionsByAccountId,
};
