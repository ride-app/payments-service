import { nanoid } from "nanoid";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	CreateTransactionRequest,
	CreateTransactionResponse,
	Transaction,
	Transaction_Type,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import TransactionRepository from "../repositories/transaction-repository";
import WalletRepository from "../repositories/wallet-repository";
import { moneyToInt, walletRegex } from "../utils";

async function createTransaction(
	request: CreateTransactionRequest
): Promise<CreateTransactionResponse> {
	if (request.parent.match(walletRegex) === null) {
		throw new ExpectedError("Invalid parent", Reason.INVALID_ARGUMENT);
	}

	if (!request.transaction || !request.transaction.amount) {
		throw new ExpectedError("Invalid transaction", Reason.INVALID_ARGUMENT);
	}

	const uid = request.parent.split("/")[1];

	const wallet = await WalletRepository.instance.getWallet(uid);

	if (!wallet.exists) {
		throw new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE);
	}

	const transactionId = nanoid();

	await TransactionRepository.instance.createTransactions({
		transactionId: request.transaction,
	});

	return {
		transaction: {
			name: `${request.parent}/transactions/${transactionId}`,
			amount: request.transaction.amount,
			type: request.transaction.type,
		},
	};
}

export default createTransaction;
