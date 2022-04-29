/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
import { FieldValue, Firestore, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";

type CreateTransactionMutationData = {
	accountId: string;
	amount: number;
	type: "CREDIT" | "DEBIT";
};

class TransactionRepository {
	private static _instance: TransactionRepository;

	private static _firestore: Firestore;

	private constructor() {
		TransactionRepository._firestore = getFirestore();
	}

	static get instance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	async createTransactionsMutation(
		batchId: string,
		transactions: {
			[transactionIds: string]: CreateTransactionMutationData;
		}
	) {
		const transactionRef =
			TransactionRepository._firestore.collection("transactions");
		const batch = TransactionRepository._firestore.batch();

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

	getTransactionQuery(transactionId: string) {
		return TransactionRepository._firestore
			.collection("transactions")
			.doc(transactionId)
			.get();
	}

	listTransactionsByBatchIdQuery(batchId: string) {
		return TransactionRepository._firestore
			.collection("transactions")
			.where("batchId", "==", batchId)
			.get();
	}

	listTransactionsByAccountIdTransaction(accountId: string) {
		return TransactionRepository._firestore.runTransaction(
			async (transaction) => {
				const wallet = await transaction.get(
					TransactionRepository._firestore.collection("wallets").doc(accountId)
				);

				if (wallet.exists === false) {
					throw new ExpectedError("Account Does Not Exist", Reason.BAD_STATE);
				}
				const snap = await transaction.get(
					TransactionRepository._firestore
						.collection("transactions")
						.where("accountId", "==", accountId)
				);

				if (snap.empty) {
					throw new ExpectedError("No Transactions Found", Reason.NOT_FOUND);
				}

				return snap.docs;
			}
		);
	}
}

export { CreateTransactionMutationData, TransactionRepository };
