import { nanoid } from "nanoid";
import { ExpectedError, Reason } from "../errors/expected-error";
import { Timestamp } from "../gen/google/protobuf/timestamp";
import {
	BatchCreateTransactionsRequest,
	BatchCreateTransactionsResponse,
	Transaction,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import {
	CreateTransactionData,
	TransactionRepository,
} from "../repositories/transaction-repository";
import WalletRepository from "../repositories/wallet-repository";
import { moneyToInt, walletRegex } from "../utils";

async function batchCreateTransactions(
	request: BatchCreateTransactionsRequest
): Promise<BatchCreateTransactionsResponse> {
	if (request.transactions.length === 0) {
		throw new ExpectedError("transactions is empty", Reason.INVALID_ARGUMENT);
	}

	const batchId = nanoid();
	const transactionIds: string[] = [];
	const transactionData: Record<string, CreateTransactionData> = {};

	await Promise.all(
		Object.values(request.transactions).map(async (entry, i) => {
			if (entry.parent.match(walletRegex) === null) {
				throw new ExpectedError(
					`userId is empty for transaction ${i}`,
					Reason.INVALID_ARGUMENT
				);
			}

			if (!entry.transaction || !entry.transaction.amount) {
				throw new ExpectedError(
					`transaction is empty for transaction ${i}`,
					Reason.INVALID_ARGUMENT
				);
			}

			if (moneyToInt(entry.transaction.amount) <= 0) {
				throw new ExpectedError(
					`Transaction amount must be positive. Got ${entry.transaction.amount} for transaction ${i}`,
					Reason.INVALID_ARGUMENT
				);
			}
			if (entry.transaction.type === Transaction_Type.UNSPECIFIED) {
				throw new ExpectedError(
					`Transaction type is not specified for transaction ${i}`,
					Reason.INVALID_ARGUMENT
				);
			}

			const walletId = entry.parent.split("/")[1];

			const wallet = await WalletRepository.instance.getWallet(walletId);

			if (!wallet.exists) {
				throw new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE);
			}

			const transactionId = nanoid();
			transactionIds.push(transactionId);
			transactionData[transactionId] = {
				walletId,
				amount: moneyToInt(entry.transaction.amount),
				type:
					entry.transaction.type === Transaction_Type.CREDIT
						? "CREDIT"
						: "DEBIT",
			};
		})
	);

	const writeTimes = await TransactionRepository.instance.createTransactions(
		transactionData,
		batchId
	);

	const transactions: Transaction[] = Object.values(request.transactions).map(
		(t, i) =>
			Transaction.create({
				name: `${t.parent}/transactions/${transactionIds[i]}`,
				amount: t.transaction!.amount,
				type: t.transaction!.type,
				createTime: Timestamp.fromDate(writeTimes[i]),
				batchId,
			})
	);

	return {
		batchId,
		transactions,
	};
}

export default batchCreateTransactions;
