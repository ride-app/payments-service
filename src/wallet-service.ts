import {
	Firestore,
	FieldValue,
	getFirestore,
	Timestamp as FireTimestamp,
} from 'firebase-admin/firestore';
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

async function createAccount(
	request: CreateAccountRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Account> {
	const Id = await firestore.runTransaction(async (transaction) => {
		const walletRef = firestore.collection('wallets');
		const snap = await transaction.get(
			walletRef.where('uid', '==', request.uid).limit(1)
		);

		if (!snap.empty) {
			throw new ExpectedError('Account Already Exists', Reason.ALREADY_EXISTS);
		}

		const accountId = randomUUID();

		const payload = {
			balance: 0,
			uid: request.uid,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};

		transaction.create(walletRef.doc(accountId), payload);

		return accountId;
	});

	const accountDetails = await firestore.collection('wallets').doc(Id).get();

	if (accountDetails.exists === false) {
		throw new ExpectedError('Account Creation Failed', Reason.NOT_FOUND);
	}

	return {
		accountId: Id,
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
	request: GetAccountRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Account> {
	const wallet = await firestore
		.collection('wallets')
		.doc(request.accountId)
		.get();

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
	request: GetAccountByUidRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Account> {
	const wallet = await firestore
		.collection('wallets')
		.where('uid', '==', request.uid)
		.limit(1)
		.get();

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
	request: CreateTransactionsRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<CreateTransactionsResponse> {
	const accountBalances: Record<string, number> = Object.fromEntries(
		request.transactions.map((t) => [t.accountId, 0])
	);

	// check if all the accounts exist in firestore wallets collection
	await Promise.all(
		Object.keys(accountBalances).map(async (accountId) => {
			const account = await firestore
				.collection('wallets')
				.doc(accountId)
				.get();

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

	const transactionRef = firestore.collection('transactions');
	const batch = firestore.batch();

	Object.entries(accountBalances).forEach(([accountId, amount]) => {
		if (amount !== 0) {
			const transactionId = randomUUID();
			transactionIds.push(transactionId);
			const transaction = {
				accountId,
				amount: Math.abs(amount),
				timestamp: FieldValue.serverTimestamp(),
				type: amount > 0 ? 'CREDIT' : 'DEBIT',
				batchId,
			};
			batch.set(transactionRef.doc(transactionId), transaction);
		}
	});

	await batch.commit();

	return {
		batchId,
		transactionIds,
	};
}

async function getTransaction(
	request: GetTransactionRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Transaction> {
	const doc = await firestore
		.collection('transactions')
		.doc(request.transactionId)
		.get();

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
	request: ListTransactionsByBatchIdRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<ListTransactionsByBatchIdResponse> {
	const snap = await firestore
		.collection('transactions')
		.where('batchId', '==', request.batchId)
		.get();

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
	request: ListTransactionsByAccountIdRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<ListTransactionsByAccountIdResponse> {
	const transactions = await firestore.runTransaction(async (transaction) => {
		const wallet = await transaction.get(
			firestore.collection('wallets').doc(request.accountId)
		);

		if (wallet.exists === false) {
			throw new ExpectedError('Account Does Not Exist', Reason.BAD_STATE);
		}
		const snap = await transaction.get(
			firestore
				.collection('transactions')
				.where('accountId', '==', request.accountId)
		);

		if (snap.empty) {
			throw new ExpectedError('No Transactions Found', Reason.NOT_FOUND);
		}

		return snap.docs.map((doc) => {
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
		});
	});

	return {
		transactions,
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
