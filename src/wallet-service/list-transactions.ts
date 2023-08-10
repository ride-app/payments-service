import { Code, ConnectError } from "@bufbuild/connect";
import {
	ListTransactionsRequest,
	ListTransactionsResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";
import TransactionRepository from "../repositories/transaction-repository.js";
import { walletRegex } from "../utils/regex.js";

async function listTransactions(
	request: ListTransactionsRequest
): Promise<ListTransactionsResponse> {
	if (request.parent.match(walletRegex) === null) {
		throw new ConnectError("invalid parent", Code.InvalidArgument);
	}

	const uid = request.parent.split("/")[1];

	const transactions = await TransactionRepository.instance.getTransactions(
		uid
	);

	return new ListTransactionsResponse({
		transactions,
		// TODO: pagination
		nextPageToken: "",
	});
}

export default listTransactions;
