/* eslint-disable no-underscore-dangle */
import { FieldValue, Firestore, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";

type TransactionData = {
	walletId: string;
	amount: number;
	type: "CREDIT" | "DEBIT";
};

interface Transaction extends TransactionData {
	timestamp: Date;
	batchId?: string;
}

class TransactionRepository {
	private static _instance: TransactionRepository;

	private firestore: Firestore;

	private constructor() {
		this.firestore = getFirestore();
	}

	static get instance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	async createTransactions(
		transactions: {
			[transactionIds: string]: TransactionData;
		},
		batchId?: string
	): Promise<Date[]> {
		if (Object.keys(transactions).length > 1 && !batchId) {
			throw new ExpectedError("Batch Id Required", Reason.BAD_STATE);
		}

		const transactionRef = this.firestore.collection("transactions");
		const batch = this.firestore.batch();

		Object.entries(transactions).forEach(([transactionId, transaction]) => {
			const payload = {
				walletId: transaction.walletId,
				amount: Math.abs(transaction.amount),
				timestamp: FieldValue.serverTimestamp(),
				type: transaction.type,
				batchId,
			};
			batch.set(transactionRef.doc(transactionId), payload);
		});

		const commitResult = await batch.commit();

		return commitResult.map((result) => result.writeTime.toDate());
	}

	getTransaction(transactionId: string) {
		return this.firestore.collection("transactions").doc(transactionId).get();
	}

	listTransactionsByBatchId(batchId: string) {
		return this.firestore
			.collection("transactions")
			.where("batchId", "==", batchId)
			.get();
	}

	listTransactions(uid: string) {
		return this.firestore.runTransaction(async (transaction) => {
			const wallet = await transaction.get(
				this.firestore.collection("wallets").doc(uid)
			);

			if (!wallet.exists) {
				throw new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE);
			}
			const snap = await transaction.get(
				this.firestore.collection("transactions").where("walletId", "==", uid)
			);

			if (snap.empty) {
				throw new ExpectedError("No Transactions Found", Reason.NOT_FOUND);
			}

			return snap.docs;
		});
	}
}

export { TransactionData as CreateTransactionData, TransactionRepository };
