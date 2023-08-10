import { Code, ConnectError } from "@bufbuild/connect";
import { nanoid } from "nanoid";
import {
	CreateTransactionRequest,
	CreateTransactionResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";
import TransactionRepository from "../repositories/transaction-repository.js";
import WalletRepository from "../repositories/wallet-repository.js";
import { walletRegex } from "../utils/regex.js";

async function createTransaction(
	request: CreateTransactionRequest
): Promise<CreateTransactionResponse> {
 	if (request.parent.match(walletRegex) === null) {
    throw new ConnectError("Invalid parent", Code.InvalidArgument);
 	}

 	if (!request.transaction || !request.transaction.amount) {
    throw new ConnectError("Invalid transaction", Code.InvalidArgument);
 	}

	const uid = request.parent.split("/")[1];

	const wallet = await WalletRepository.instance.getWallet(uid);

 	if (!wallet) {
    throw new ConnectError("Wallet does not exist", Code.FailedPrecondition);
 	}

	const transactionId = nanoid();

	await TransactionRepository.instance.createTransactions({
		transactionId: request.transaction,
	});

	return new CreateTransactionResponse({
		transaction: {
			name: `${request.parent}/transactions/${transactionId}`,
			amount: request.transaction.amount,
			type: request.transaction.type,
		},
	});
}

export default createTransaction;