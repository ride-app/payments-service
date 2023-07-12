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

	// async createWallet(uid: string): Promise<Timestamp> {
	// await this.firestore.runTransaction(async (transaction) => {
	// 	const walletRef = this.firestore.collection("wallets");
	// 	const snap = await transaction.get(
	// 		this.firestore.collection("wallets").doc(uid)
	// 	);

	// 	if (snap.exists) {
	// 		throw new ConnectError("Wallet Already Exists", Code.AlreadyExists);
	// 	}

	// 	const payload = {
	// 		balance: 0,
	// 		createdAt: FieldValue.serverTimestamp(),
	// 		updatedAt: FieldValue.serverTimestamp(),
	// 	};

	// 	transaction.create(walletRef.doc(uid), payload);
	// });

	// 	const writeResult = await this.firestore
	// 		.collection("wallets")
	// 		.doc(uid)
	// 		.set({
	// 			balance: 0,
	// 		});

	// 	return Timestamp.fromDate(writeResult.writeTime.toDate());
	// }

	async getWallet(uid: string): Promise<Wallet | undefined> {
		const snap = await this.firestore.collection("wallets").doc(uid).get();

		console.debug(`Snap exists: ${snap.exists}`);

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
