import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	GetTransactionRequest,
	GetTransactionResponse,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import { TransactionRepository } from "../repositories/transaction-repository";
import { numberToMoney, transactionRegex } from "../utils";

async function getTransaction(
	request: GetTransactionRequest
): Promise<GetTransactionResponse> {
	if (request.name.match(transactionRegex) === null) {
		throw new ExpectedError("Invalid name", Reason.INVALID_ARGUMENT);
	}

	// TODO: Do something about the null case
	const transactionId = request.name.split("/").pop()!;

	// TODO: Check if user is authorized to access this transaction
	const doc = await TransactionRepository.instance.getTransaction(
		transactionId
	);

	if (!doc.exists) {
		throw new ExpectedError("Transaction Not Found", Reason.NOT_FOUND);
	}

	return {
		transaction: {
			name: request.name,
			amount: numberToMoney(doc.get("amount") as number),
			createTime: {
				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
			},
			type: doc.get("type") as Transaction_Type,
			batchId: doc.get("batchId") as string,
		},
	};
}

export default getTransaction;
