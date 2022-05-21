/* eslint-disable no-underscore-dangle */
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";
import { Timestamp } from "../gen/google/protobuf/timestamp";
import {
	Transaction,
	Transaction_Details,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import { moneyToInt, numberToMoney } from "../utils";

function TransactionFromJSON(
	id: string,
	data: Record<string, any>
): Transaction {
	return {
		name: `users/${data.walletId}/wallet/transactions/${id}`,
		amount: numberToMoney(data.amount),
		createTime: Timestamp.fromDate(data.createTime!.toDate()),
		type: data.type as Transaction_Type,
		batchId: data.batchId,
		details: Transaction_Details.fromJson(data.details!),
	};
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
			[transactionIds: string]: Transaction;
		},
		batchId?: string
	): Promise<Date[]> {
		const TransactionToJSON = (
			transaction: Transaction
		): Record<string, unknown> => ({
			walletId: transaction.name.split("/")[1],
			amount: moneyToInt(transaction.amount!),
			type: transaction.type.toString(),
			batchId: transaction.batchId,
			details: Transaction_Details.toJson(transaction.details!),
		});

		if (Object.keys(transactions).length > 1 && !batchId) {
			throw new ExpectedError("Batch Id Required", Reason.BAD_STATE);
		}

		const transactionRef = this.firestore.collection("transactions");
		const batch = this.firestore.batch();

		Object.entries(transactions).forEach(([transactionId, transaction]) => {
			batch.set(
				transactionRef.doc(transactionId),
				TransactionToJSON(transaction)
			);
		});

		const commitResult = await batch.commit();

		return commitResult.map((result) => result.writeTime.toDate());
	}

	async getTransaction(
		transactionId: string
	): Promise<Transaction | undefined> {
		const snap = await this.firestore
			.collection("transactions")
			.doc(transactionId)
			.get();

		if (!snap.exists || !snap.data()) {
			return undefined;
		}

		return TransactionFromJSON(snap.id, snap.data()!);
	}

	async getTransactionsByBatchId(batchId: string): Promise<Transaction[]> {
		const snap = await this.firestore
			.collection("transactions")
			.where("batchId", "==", batchId)
			.get();

		if (!snap.empty) {
			return [];
		}

		return snap.docs.map((doc) => {
			if (!doc.data()) {
				throw new ExpectedError("Transaction does not exist", Reason.NOT_FOUND);
			}

			return TransactionFromJSON(doc.id, doc.data()!);
		});
	}

	async getTransactions(uid: string): Promise<Transaction[]> {
		const snap = await this.firestore
			.collection("transactions")
			.where("walletId", "==", uid)
			.get();

		if (!snap.empty) {
			return [];
		}

		return snap.docs.map((doc) => {
			if (!doc.data()) {
				throw new ExpectedError("Transaction does not exist", Reason.NOT_FOUND);
			}

			return TransactionFromJSON(doc.id, doc.data()!);
		});
	}
}

export default TransactionRepository;
