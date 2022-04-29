/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import { Firestore, FieldValue, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";

export default class AccountRepository {
	private static _instance: AccountRepository;

	private static _firestore: Firestore;

	private constructor() {
		AccountRepository._firestore = getFirestore();
	}

	static get instance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	async createAccountTransaction(uid: string, accountId: string) {
		await AccountRepository._firestore.runTransaction(async (transaction) => {
			const walletRef = AccountRepository._firestore.collection("wallets");
			const snap = await transaction.get(
				AccountRepository._firestore
					.collection("wallets")
					.where("uid", "==", uid)
					.limit(1)
			);

			if (!snap.empty) {
				throw new ExpectedError(
					"Account Already Exists",
					Reason.ALREADY_EXISTS
				);
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

	getAccountQuery(id: string) {
		return AccountRepository._firestore.collection("wallets").doc(id).get();
	}

	getAccountByUidQuery(uid: string) {
		return AccountRepository._firestore
			.collection("wallets")
			.where("uid", "==", uid)
			.limit(1)
			.get();
	}
}

// export { createAccountTransaction, getAccountQuery, getAccountByUidQuery };
