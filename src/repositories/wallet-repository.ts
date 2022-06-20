/* eslint-disable no-underscore-dangle */
import { Firestore, FieldValue, getFirestore } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";

export default class WalletRepository {
	private static _instance: WalletRepository;

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

	async createWallet(uid: string) {
		await this.firestore.runTransaction(async (transaction) => {
			const walletRef = this.firestore.collection("wallets");
			const snap = await transaction.get(
				this.firestore.collection("wallets").doc(uid)
			);

			if (snap.exists) {
				throw new ExpectedError("Wallet Already Exists", Reason.ALREADY_EXISTS);
			}

			const payload = {
				balance: 0,
				createdAt: FieldValue.serverTimestamp(),
				updatedAt: FieldValue.serverTimestamp(),
			};

			transaction.create(walletRef.doc(uid), payload);
		});
	}

	getWallet(id: string) {
		return this.firestore.collection("wallets").doc(id).get();
	}
}
