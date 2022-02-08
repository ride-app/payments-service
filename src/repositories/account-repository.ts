import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../errors/expected-error';

const firestore = getFirestore();

async function createAccountTransaction(uid: string, accountId: string) {
	await firestore.runTransaction(async (transaction) => {
		const walletRef = firestore.collection('wallets');
		const snap = await transaction.get(
			firestore.collection('wallets').where('uid', '==', uid).limit(1)
		);

		if (!snap.empty) {
			throw new ExpectedError('Account Already Exists', Reason.ALREADY_EXISTS);
		}

		const payload = {
			balance: 0,
			uid,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};

		transaction.create(walletRef.doc(accountId), payload);
	});
}

function getAccountQuery(id: string) {
	return firestore.collection('wallets').doc(id).get();
}

function getAccountByUidQuery(uid: string) {
	return firestore.collection('wallets').where('uid', '==', uid).limit(1).get();
}

export { createAccountTransaction, getAccountQuery, getAccountByUidQuery };
