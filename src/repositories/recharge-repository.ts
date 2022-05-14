import { getFirestore } from "firebase-admin/firestore";

async function getRecharge(rechargeId: string) {
	const doc = await getFirestore()
		.collection("recharges")
		.doc(rechargeId)
		.get();
}
