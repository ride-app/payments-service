import { ExpectedError, Reason } from "../errors/expected-error";
import {
	GetTransactionRequest,
	GetTransactionResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import TransactionRepository from "../repositories/transaction-repository";
import { transactionRegex } from "../utils";

async function getTransaction(
	request: GetTransactionRequest
): Promise<GetTransactionResponse> {
	if (request.name.match(transactionRegex) === null) {
		throw new ExpectedError("Invalid name", Reason.INVALID_ARGUMENT);
	}

	// TODO: Do something about the null case
	const transactionId = request.name.split("/").pop()!;

	// TODO: Check if user is authorized to access this transaction
	const transaction = await TransactionRepository.instance.getTransaction(
		transactionId
	);

	if (!transaction) {
		throw new ExpectedError("Transaction does not exist", Reason.NOT_FOUND);
	}

	return {
		transaction,
	};
}

export default getTransaction;
