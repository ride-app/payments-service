// import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
// import { ExpectedError, Reason } from "../errors/expected-error";
// import {
// 	ListTransactionsByBatchIdRequest,
// 	ListTransactionsByBatchIdResponse,
// 	TransactionType,
// } from "../gen/ride/wallet/v1alpha1/wallet_service";
// import { TransactionRepository } from "../repositories/transaction-repository";

// async function listTransactionsByBatchId(
// 	request: ListTransactionsByBatchIdRequest
// ): Promise<ListTransactionsByBatchIdResponse> {
// 	const snap = await TransactionRepository.instance.listTransactionsByBatchId(
// 		request.batchId
// 	);

// 	if (snap.empty) {
// 		throw new ExpectedError("Transactions Not Found", Reason.NOT_FOUND);
// 	}

// 	return {
// 		transactions: snap.docs.map((doc) => ({
// 			transactionId: doc.id,
// 			walletId: doc.get("walletId") as string,
// 			amount: doc.get("amount") as number,
// 			createTime: {
// 				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
// 				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
// 			},
// 			type: doc.get("type") as TransactionType,
// 			batchId: doc.get("batchId") as string,
// 		})),
// 	};
// }

export default listTransactionsByBatchId;