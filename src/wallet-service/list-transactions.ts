import { ExpectedError, Reason } from "../errors/expected-error";
import {
	ListTransactionsRequest,
	ListTransactionsResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb";
import TransactionRepository from "../repositories/transaction-repository";
import { walletRegex } from "../utils";

async function listTransactions(
	request: ListTransactionsRequest
): Promise<ListTransactionsResponse> {
	if (request.parent.match(walletRegex) === null) {
		throw new ExpectedError("Invalid parent", Reason.INVALID_ARGUMENT);
	}

	const uid = request.parent.split("/")[1];

	const transactions = await TransactionRepository.instance.getTransactions(
		uid
	);

	return {
		transactions,
		// TODO: pagination
		nextPageToken: "",
	};
}

export default listTransactions;
