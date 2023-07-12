/* eslint-disable no-underscore-dangle */
import { Timestamp } from "@bufbuild/protobuf";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Wallet } from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";

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

	async getWallet(uid: string): Promise<Wallet | undefined> {
		const snap = await this.firestore.collection("wallets").doc(uid).get();

		return snap.exists
			? new Wallet({
					name: `users/${uid}/wallet`,
					balance: snap.get("balance") as number,
					createTime: Timestamp.fromDate(snap.createTime!.toDate()),
					updateTime: Timestamp.fromDate(snap.updateTime!.toDate()),
			  })
			: undefined;
	}
}
