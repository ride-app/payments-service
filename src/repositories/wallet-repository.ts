/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import { Firestore, FieldValue, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";

export default class WalletRepository {
	private static _instance: WalletRepository;

	private static _firestore: Firestore;

	private constructor() {
		WalletRepository._firestore = getFirestore();
	}

	static get instance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	async createWalletTransaction(uid: string, walletId: string) {
		await WalletRepository._firestore.runTransaction(async (transaction) => {
			const walletRef = WalletRepository._firestore.collection("wallets");
			const snap = await transaction.get(
				WalletRepository._firestore
					.collection("wallets")
					.where("uid", "==", uid)
					.limit(1)
			);

			if (!snap.empty) {
				throw new ExpectedError("Wallet Already Exists", Reason.ALREADY_EXISTS);
			}

			const payload = {
				balance: 0,
				uid,
				createdAt: FieldValue.serverTimestamp(),
				updatedAt: FieldValue.serverTimestamp(),
			};

			transaction.create(walletRef.doc(walletId), payload);
		});
	}

	getWalletQuery(id: string) {
		return WalletRepository._firestore.collection("wallets").doc(id).get();
	}

	getWalletByUidQuery(uid: string) {
		return WalletRepository._firestore
			.collection("wallets")
			.where("uid", "==", uid)
			.limit(1)
			.get();
	}
}

// export { createWalletTransaction, getWalletQuery, getWalletByUidQuery };
