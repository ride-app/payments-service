import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../errors/expected-error';

const firestore = getFirestore();

type CreateTransactionMutationData = {
	accountId: string;
	amount: number;
	type: 'CREDIT' | 'DEBIT';
};

async function createTransactionsMutation(
	batchId: string,
	transactions: {
		[transactionIds: string]: CreateTransactionMutationData;
	}
) {
	const transactionRef = firestore.collection('transactions');
	const batch = firestore.batch();

	Object.entries(transactions).forEach(([transactionId, transaction]) => {
		const payload = {
			accountId: transaction.accountId,
			amount: Math.abs(transaction.amount),
			timestamp: FieldValue.serverTimestamp(),
			type: transaction.type,
			batchId,
		};
		batch.set(transactionRef.doc(transactionId), payload);
	});

	await batch.commit();
}

function getTransactionQuery(transactionId: string) {
	return firestore.collection('transactions').doc(transactionId).get();
}

function listTransactionsByBatchIdQuery(batchId: string) {
	return firestore
		.collection('transactions')
		.where('batchId', '==', batchId)
		.get();
}

function listTransactionsByAccountIdTransaction(accountId: string) {
	return firestore.runTransaction(async (transaction) => {
		const wallet = await transaction.get(
			firestore.collection('wallets').doc(accountId)
		);

		if (wallet.exists === false) {
			throw new ExpectedError('Account Does Not Exist', Reason.BAD_STATE);
		}
		const snap = await transaction.get(
			firestore.collection('transactions').where('accountId', '==', accountId)
		);

		if (snap.empty) {
			throw new ExpectedError('No Transactions Found', Reason.NOT_FOUND);
		}

		return snap.docs;
	});
}

export {
	createTransactionsMutation,
	CreateTransactionMutationData,
	getTransactionQuery,
	listTransactionsByBatchIdQuery,
	listTransactionsByAccountIdTransaction,
};
