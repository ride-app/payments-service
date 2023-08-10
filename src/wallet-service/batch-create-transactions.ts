import { Code, ConnectError } from "@bufbuild/connect";
import { Timestamp } from "@bufbuild/protobuf";
import { nanoid } from "nanoid";
import {
	BatchCreateTransactionsRequest,
	BatchCreateTransactionsResponse,
	Transaction,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";
import TransactionRepository from "../repositories/transaction-repository.js";
import WalletRepository from "../repositories/wallet-repository.js";
import { walletRegex } from "../utils/regex.js";

async function batchCreateTransactions(
	request: BatchCreateTransactionsRequest
): Promise<BatchCreateTransactionsResponse> {
	if (request.transactions.length === 0) {
  		throw new ConnectError("transactions is empty", Code.InvalidArgument);
	}

	const batchId = nanoid();
	const transactionIds: string[] = [];
	const transactionData: Record<string, Transaction> = {};

	await Promise.all(
		Object.values(request.transactions).map(async (entry, i) => {
			if (entry.parent.match(walletRegex) === null) {
    				throw new ConnectError(
    					`userid is empty for transaction ${i}`,
    					Code.InvalidArgument
    				);
			}

			if (!entry.transaction || !entry.transaction.amount) {
    				throw new ConnectError(
    					`transaction is empty for transaction ${i}`,
    					Code.InvalidArgument
    				);
			}

			if (entry.transaction.amount <= 0) {
    				throw new ConnectError(
    					`transaction amount must be positive. got ${entry.transaction.amount} for transaction ${i}`,
    					Code.InvalidArgument
    				);
			}
			if (entry.transaction.type === Transaction_Type.UNSPECIFIED) {
    				throw new ConnectError(
    					`transaction type is not specified for transaction ${i}`,
    					Code.InvalidArgument
    				);
			}

			const walletId = entry.parent.split("/")[1];

			const wallet = await WalletRepository.instance.getWallet(walletId);

			if (!wallet) {
    				throw new ConnectError(
    					"wallet does not exist",
    					Code.FailedPrecondition
    				);
			}

			const transactionId = nanoid();
			transactionIds.push(transactionId);

			const tempTransaction = entry.transaction.clone();

			tempTransaction.name = `${entry.parent}/transactions/${transactionId}`;
			tempTransaction.batchId = batchId;

			transactionData[transactionId] = tempTransaction;
		})
	);

	const writeTimes = await TransactionRepository.instance.createTransactions(
		transactionData,
		batchId
	);

	const transactions: Transaction[] = Object.values(request.transactions).map(
		(t, i) =>
			new Transaction({
				name: `${t.parent}/transactions/${transactionIds[i]}`,
				amount: t.transaction!.amount,
				type: t.transaction!.type,
				createTime: Timestamp.fromDate(writeTimes[i]),
				batchId,
			})
	);

	return new BatchCreateTransactionsResponse({
		batchId,
		transactions,
	});
}

export default batchCreateTransactions;