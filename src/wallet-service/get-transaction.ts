import { Code, ConnectError } from "@bufbuild/connect";
import {
	GetTransactionRequest,
	GetTransactionResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";
import TransactionRepository from "../repositories/transaction-repository.js";
import { transactionRegex } from "../utils/regex.js";

async function getTransaction(
	req: GetTransactionRequest
): Promise<GetTransactionResponse> {
	if (req.name.match(transactionRegex) === null) {
		throw new ConnectError("Invalid name", Code.InvalidArgument);
	}

	// TODO: Do something about the null case
	const transactionId = req.name.split("/").pop()!;

	// TODO: Check if user is authorized to access this transaction
	const transaction = await TransactionRepository.instance.getTransaction(
		transactionId
	);

	if (!transaction) {
		throw new ConnectError("Transaction does not exist", Code.NotFound);
	}

	return new GetTransactionResponse({
		transaction,
	});
}

export default getTransaction;
