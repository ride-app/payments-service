import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { ExpectedError, Reason } from "./errors/expected-error";

import AccountRepository from "./repositories/account-repository";
import {
	CreateTransactionMutationData,
	TransactionRepository,
} from "./repositories/transaction-repository";

import {
	CreateAccountRequest,
	CreateAccountResponse,
	CreateTransactionsRequest,
	CreateTransactionsResponse,
	GetAccountByUidRequest,
	GetAccountByUidResponse,
	GetAccountRequest,
	GetAccountResponse,
	GetTransactionRequest,
	GetTransactionResponse,
	ListTransactionsByAccountIdRequest,
	ListTransactionsByAccountIdResponse,
	ListTransactionsByBatchIdRequest,
	ListTransactionsByBatchIdResponse,
	TransactionType,
} from "./gen/ride/wallet/v1alpha1/wallet_service";

async function createAccount(
	request: CreateAccountRequest
): Promise<CreateAccountResponse> {
	const accountId = randomUUID();
	await AccountRepository.instance.createAccountTransaction(
		request.uid,
		accountId
	);

	const accountDetails = await AccountRepository.instance.getAccountQuery(
		accountId
	);

	if (accountDetails?.exists === false) {
		throw new ExpectedError("Account Creation Failed", Reason.NOT_FOUND);
	}

	return {
		account: {
			accountId,
			balance: accountDetails.get("balance") as number,
			uid: accountDetails.get("uid") as string,
			createTime: {
				seconds: accountDetails.get("createdAt")?.seconds,
				nanos: accountDetails.get("createdAt")?.nanoseconds,
			},
			updateTime: {
				seconds: accountDetails.get("updatedAt")?.seconds,
				nanos: accountDetails.get("updatedAt")?.nanoseconds,
			},
		},
	};
}

async function getAccount(
	request: GetAccountRequest
): Promise<GetAccountResponse> {
	const wallet = await AccountRepository.instance.getAccountQuery(
		request.accountId
	);

	if (wallet.exists === false) {
		throw new ExpectedError("Account Does Not Exist", Reason.NOT_FOUND);
	}

	return {
		account: {
			accountId: wallet.id,
			balance: wallet.get("balance") as number,
			uid: wallet.get("uid") as string,
			createTime: {
				seconds: BigInt((wallet.get("createdAt") as FireTimestamp).seconds),
				nanos: (wallet.get("createdAt") as FireTimestamp).nanoseconds,
			},
			updateTime: {
				seconds: BigInt((wallet.get("updatedAt") as FireTimestamp).seconds),
				nanos: (wallet.get("updatedAt") as FireTimestamp).nanoseconds,
			},
		},
	};
}

async function getAccountByUid(
	request: GetAccountByUidRequest
): Promise<GetAccountByUidResponse> {
	const wallet = await AccountRepository.instance.getAccountByUidQuery(
		request.uid
	);

	if (wallet.empty) {
		throw new ExpectedError("Account Does Not Exist", Reason.NOT_FOUND);
	}

	return {
		account: {
			accountId: wallet.docs[0].id,
			uid: wallet.docs[0].get("uid") as string,
			balance: wallet.docs[0].get("balance") as number,
			createTime: {
				seconds: BigInt(
					(wallet.docs[0].get("createdAt") as FireTimestamp).seconds
				),
				nanos: (wallet.docs[0].get("createdAt") as FireTimestamp).nanoseconds,
			},
			updateTime: {
				seconds: BigInt(
					(wallet.docs[0].get("updatedAt") as FireTimestamp).seconds
				),
				nanos: (wallet.docs[0].get("updatedAt") as FireTimestamp).nanoseconds,
			},
		},
	};
}

async function createTransactions(
	request: CreateTransactionsRequest
): Promise<CreateTransactionsResponse> {
	const accountBalances: Record<string, number> = Object.fromEntries(
		request.transactions.map((t) => [t.accountId, 0])
	);

	await Promise.all(
		Object.keys(accountBalances).map(async (accountId) => {
			const account = await AccountRepository.instance.getAccountQuery(
				accountId
			);

			if (!account.exists) {
				throw new ExpectedError("Account Does Not Exist", Reason.BAD_STATE);
			}
		})
	);

	request.transactions.forEach((transaction) => {
		if (transaction.type === TransactionType.CREDIT) {
			accountBalances[transaction.accountId] += transaction.amount;
		} else if (transaction.type === TransactionType.DEBIT) {
			accountBalances[transaction.accountId] -= transaction.amount;
		} else {
			throw new ExpectedError("Invalid Transaction Type", Reason.BAD_STATE);
		}
	});

	const batchId = randomUUID();
	const transactionIds: string[] = [];
	const transactionData: Record<string, CreateTransactionMutationData> = {};

	Object.entries(accountBalances).forEach(([accountId, amount]) => {
		if (amount !== 0) {
			const transactionId = randomUUID();
			transactionIds.push(transactionId);
			transactionData[transactionId] = {
				accountId,
				amount: Math.abs(amount),
				type: amount > 0 ? "CREDIT" : "DEBIT",
			};
		}
	});

	await TransactionRepository.instance.createTransactionsMutation(
		batchId,
		transactionData
	);

	return {
		batchId,
		transactionIds,
	};
}

async function getTransaction(
	request: GetTransactionRequest
): Promise<GetTransactionResponse> {
	const doc = await TransactionRepository.instance.getTransactionQuery(
		request.transactionId
	);

	if (!doc.exists) {
		throw new ExpectedError("Transaction Not Found", Reason.NOT_FOUND);
	}

	return {
		transaction: {
			transactionId: doc.id,
			accountId: doc.get("accountId") as string,
			amount: doc.get("amount") as number,
			createTime: {
				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
			},
			type: doc.get("type") as TransactionType,
			batchId: doc.get("batchId") as string,
		},
	};
}

async function listTransactionsByBatchId(
	request: ListTransactionsByBatchIdRequest
): Promise<ListTransactionsByBatchIdResponse> {
	const snap =
		await TransactionRepository.instance.listTransactionsByBatchIdQuery(
			request.batchId
		);

	if (snap.empty) {
		throw new ExpectedError("Transactions Not Found", Reason.NOT_FOUND);
	}

	return {
		transactions: snap.docs.map((doc) => {
			return {
				transactionId: doc.id,
				accountId: doc.get("accountId") as string,
				amount: doc.get("amount") as number,
				createTime: {
					seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
					nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
				},
				type: doc.get("type") as TransactionType,
				batchId: doc.get("batchId") as string,
			};
		}),
	};
}

async function listTransactionsByAccountId(
	request: ListTransactionsByAccountIdRequest
): Promise<ListTransactionsByAccountIdResponse> {
	const transactionSnaps =
		await TransactionRepository.instance.listTransactionsByAccountIdTransaction(
			request.accountId
		);

	return {
		transactions: transactionSnaps.map((doc) => {
			return {
				transactionId: doc.id,
				accountId: doc.get("accountId") as string,
				amount: doc.get("amount") as number,
				createTime: {
					seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
					nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
				},
				type: doc.get("type") as TransactionType,
				batchId: doc.get("batchId") as string,
			};
		}),
	};
}

export {
	createAccount,
	getAccount,
	getAccountByUid,
	createTransactions,
	getTransaction,
	listTransactionsByBatchId,
	listTransactionsByAccountId,
};
