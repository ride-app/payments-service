import { Firestore, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { Account } from './proto/app/ride/walletService/Account';
import { createAccountRequest__Output } from './proto/app/ride/walletService/createAccountRequest';
import { getAccountByUidRequest__Output } from './proto/app/ride/walletService/getAccountByUidRequest';
import { getAccountRequest__Output } from './proto/app/ride/walletService/getAccountRequest';
import { addTransactionsRequest__Output } from './proto/app/ride/walletService/addTransactionsRequest';
import { addTransactionsResponse } from './proto/app/ride/walletService/addTransactionsResponse';
import { getTransactionRequest__Output } from './proto/app/ride/walletService/getTransactionRequest';
import { Transaction } from './proto/app/ride/walletService/Transaction';
import { listTransactionRequest__Output } from './proto/app/ride/walletService/listTransactionRequest';
import { listTransactionResponse } from './proto/app/ride/walletService/listTransactionResponse';
import { getTransactionsByBatchIdRequest__Output } from './proto/app/ride/walletService/getTransactionsByBatchIdRequest';
import { getTransactionsByBatchIdResponse } from './proto/app/ride/walletService/getTransactionsByBatchIdResponse';
import { ExpectedError, Reason } from './errors/expected-error';

async function createAccount(
	request: createAccountRequest__Output,
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

	return { accountId: Id, ...accountDetails.data() } as Account;
}

async function getAccount(
	request: getAccountRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Account> {
	const wallet = await firestore
		.collection('wallets')
		.doc(request.accountId)
		.get();

	if (wallet.exists === false) {
		throw new ExpectedError('Account Does Not Exist', Reason.NOT_FOUND);
	}

	return { accountId: wallet.id, ...wallet.data() } as Account;
}

async function getAccountByUid(
	request: getAccountByUidRequest__Output,
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
	return { accountId: wallet.docs[0].id, ...wallet.docs[0].data() } as Account;
}

async function addTransactions(
	request: addTransactionsRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<addTransactionsResponse> {
	// let debitBalance = 0;
	// let creditBalance = 0;
	// let totalValue = 0;
	// let valueChange = 0;

	const squashedTransactions: Record<string, number> = Object.fromEntries(
		request.transactions.map((t) => [t.accountId, 0])
	);

	request.transactions.forEach((transaction) => {
		if (!Number.isInteger(transaction.amount)) {
			throw new Error(
				`Transaction amount must be an integer. Got ${transaction.amount}`
			);
		}

		if (transaction.type === 'CREDIT') {
			// creditBalance += transaction.amount;
			squashedTransactions[transaction.accountId] += transaction.amount;
		} else {
			// debitBalance += transaction.amount;
			squashedTransactions[transaction.accountId] -= transaction.amount;
		}
	});

	// Object.values(squashedTransactions).forEach((amount) => {
	// 	totalValue += Math.abs(amount);
	// 	valueChange += amount;
	// });

	// if (debitBalance !== creditBalance) {
	// 	throw new Error('Debit and credit balances do not match');
	// }

	// if (debitBalance !== totalValue || creditBalance !== totalValue) {
	// 	throw new Error('Total value does not match debit and credit balances');
	// }

	// if (valueChange !== 0) {
	// 	throw new Error('Value change is not zero');
	// }

	const batchId = randomUUID();
	const transactionIds: string[] = [];

	const transactionRef = firestore.collection('transactions');
	const batch = firestore.batch();

	Object.entries(squashedTransactions).forEach(([accountId, amount]) => {
		if (amount !== 0) {
			const transactionId = randomUUID();
			transactionIds.push(transactionId);
			const transaction = {
				transactionId,
				accountId,
				amount,
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
	request: getTransactionRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<Transaction> {
	const snap = await firestore
		.collection('transactions')
		.where('transactionId', '==', request.transactionId)
		.limit(1)
		.get();

	if (snap.empty) {
		throw new ExpectedError('Transaction Not Found', Reason.NOT_FOUND);
	}

	return snap.docs[0].data() as Transaction;
}

async function getTransactionsByBatchId(
	request: getTransactionsByBatchIdRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<getTransactionsByBatchIdResponse> {
	const snap = await firestore
		.collection('transactions')
		.where('batchId', '==', request.batchId)
		.get();

	if (snap.empty) {
		throw new ExpectedError(
			'No Tranactions Exist for Batch Id',
			Reason.NOT_FOUND
		);
	}

	return {
		transactions: snap.docs.map((doc) => doc.data() as Transaction),
	};
}

async function listTransactionsForAccount(
	request: listTransactionRequest__Output,
	firestore: Firestore = getFirestore()
): Promise<listTransactionResponse> {
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

		return snap.docs.map((doc) => doc.data() as Transaction);
	});

	return {
		transactions,
	};
}

export {
	createAccount,
	getAccount,
	getAccountByUid,
	addTransactions,
	getTransaction,
	getTransactionsByBatchId,
	listTransactionsForAccount,
};
