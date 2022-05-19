import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	ListTransactionsRequest,
	ListTransactionsResponse,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import { TransactionRepository } from "../repositories/transaction-repository";
import { walletRegex } from "../utils";

async function listTransactions(
	request: ListTransactionsRequest
): Promise<ListTransactionsResponse> {
	if (request.parent.match(walletRegex) === null) {
		throw new ExpectedError("Invalid parent", Reason.INVALID_ARGUMENT);
	}

	const uid = request.parent.split("/")[1];

	const transactionSnaps =
		await TransactionRepository.instance.listTransactions(uid);

	return {
		transactions: transactionSnaps.map((doc) => ({
			name: `${request.parent}/transactions/${doc.id}`,
			walletId: doc.get("walletId") as string,
			amount: doc.get("amount") as number,
			createTime: {
				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
			},
			type: doc.get("type") as Transaction_Type,
			batchId: doc.get("batchId") as string,
		})),
		// TODO: pagination
		nextPageToken: "",
	};
}

export default listTransactions;
