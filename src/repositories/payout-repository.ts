/* eslint-disable no-underscore-dangle */
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Payout } from "../gen/ride/payout/v1alpha1/payout_service";

export default class PayoutRepository {
	private static _instance: PayoutRepository;

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

	async savePayout(
		walletId: string,
		payout: Payout,
		checkoutInfo: Record<string, unknown>
	): Promise<Date> {
		const data = {
			walletId,
			amount: {
				currencyCode: payout.amount!.currencyCode,
				units: Number(payout.amount!.units),
				nanos: payout.amount!.nanos,
			},
			status: payout.status.toString(),
			...checkoutInfo,
		};

		const res = await this.firestore
			.collection("payouts")
			.doc(payout.name.split("/").pop()!)
			.set(data);

		return res.writeTime.toDate();
	}

	async getPayout(payoutId: string): Promise<Record<string, any> | undefined> {
		const doc = await this.firestore.collection("payouts").doc(payoutId).get();

		if (!doc.exists) {
			return undefined;
		}

		return { createTime: doc.createTime!.toDate(), ...doc.data() };
	}

	async getPayoutsForWalletId(
		walletId: string
	): Promise<Record<string, any>[]> {
		const query = await this.firestore
			.collection("payouts")
			.where("walletId", "==", walletId)
			.get();

		const results: Record<string, any>[] = [];

		query.docs.forEach((doc) => {
			results.push({
				payoutId: doc.id,
				createTime: doc.createTime.toDate(),
				...doc.data(),
			});
		});

		return results;
	}
}
