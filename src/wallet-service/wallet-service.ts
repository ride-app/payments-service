import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { ExpectedError, Reason } from "../errors/expected-error";

import WalletRepository from "../repositories/wallet-repository";
import {
	CreateTransactionMutationData,
	TransactionRepository,
} from "../repositories/transaction-repository";

import {
	CreateWalletRequest,
	CreateWalletResponse,
	CreateTransactionsRequest,
	CreateTransactionsResponse,
	GetWalletByUidRequest,
	GetWalletByUidResponse,
	GetWalletRequest,
	GetWalletResponse,
	GetTransactionRequest,
	GetTransactionResponse,
	ListTransactionsRequest,
	ListTransactionsResponse,
	ListTransactionsByBatchIdRequest,
	ListTransactionsByBatchIdResponse,
	TransactionType,
} from "../gen/ride/wallet/v1alpha1/wallet_service";

async function createWallet(
	request: CreateWalletRequest
): Promise<CreateWalletResponse> {
	const walletId = randomUUID();
	await WalletRepository.instance.createWalletTransaction(
		request.uid,
		walletId
	);

	const walletDetails = await WalletRepository.instance.getWalletQuery(
		walletId
	);

	if (walletDetails?.exists === false) {
		throw new ExpectedError("Wallet Creation Failed", Reason.NOT_FOUND);
	}

	return {
		wallet: {
			walletId,
			balance: walletDetails.get("balance") as number,
			uid: walletDetails.get("uid") as string,
			createTime: {
				seconds: walletDetails.get("createdAt")?.seconds,
				nanos: walletDetails.get("createdAt")?.nanoseconds,
			},
			updateTime: {
				seconds: walletDetails.get("updatedAt")?.seconds,
				nanos: walletDetails.get("updatedAt")?.nanoseconds,
			},
		},
	};
}

async function getWallet(
	request: GetWalletRequest
): Promise<GetWalletResponse> {
	const wallet = await WalletRepository.instance.getWalletQuery(
		request.walletId
	);

	if (wallet.exists === false) {
		throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
	}

	return {
		wallet: {
			walletId: wallet.id,
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

async function getWalletByUid(
	request: GetWalletByUidRequest
): Promise<GetWalletByUidResponse> {
	const wallet = await WalletRepository.instance.getWalletByUidQuery(
		request.uid
	);

	if (wallet.empty) {
		throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
	}

	return {
		wallet: {
			walletId: wallet.docs[0].id,
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
	const walletBalances: Record<string, number> = Object.fromEntries(
		request.transactions.map((t) => [t.walletId, 0])
	);

	await Promise.all(
		Object.keys(walletBalances).map(async (walletId) => {
			const wallet = await WalletRepository.instance.getWalletQuery(walletId);

			if (!wallet.exists) {
				throw new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE);
			}
		})
	);

	request.transactions.forEach((transaction) => {
		if (transaction.type === TransactionType.CREDIT) {
			walletBalances[transaction.walletId] += transaction.amount;
		} else if (transaction.type === TransactionType.DEBIT) {
			walletBalances[transaction.walletId] -= transaction.amount;
		} else {
			throw new ExpectedError("Invalid Transaction Type", Reason.BAD_STATE);
		}
	});

	const batchId = randomUUID();
	const transactionIds: string[] = [];
	const transactionData: Record<string, CreateTransactionMutationData> = {};

	Object.entries(walletBalances).forEach(([walletId, amount]) => {
		if (amount !== 0) {
			const transactionId = randomUUID();
			transactionIds.push(transactionId);
			transactionData[transactionId] = {
				walletId,
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
			walletId: doc.get("walletId") as string,
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
		transactions: snap.docs.map((doc) => ({
			transactionId: doc.id,
			walletId: doc.get("walletId") as string,
			amount: doc.get("amount") as number,
			createTime: {
				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
			},
			type: doc.get("type") as TransactionType,
			batchId: doc.get("batchId") as string,
		})),
	};
}

async function listTransactions(
	request: ListTransactionsRequest
): Promise<ListTransactionsResponse> {
	const transactionSnaps =
		await TransactionRepository.instance.listTransactionsByWalletIdTransaction(
			request.walletId
		);

	return {
		transactions: transactionSnaps.map((doc) => ({
			transactionId: doc.id,
			walletId: doc.get("walletId") as string,
			amount: doc.get("amount") as number,
			createTime: {
				seconds: BigInt((doc.get("timestamp") as FireTimestamp).seconds),
				nanos: (doc.get("timestamp") as FireTimestamp).nanoseconds,
			},
			type: doc.get("type") as TransactionType,
			batchId: doc.get("batchId") as string,
		})),
	};
}

export {
	createWallet,
	getWallet,
	getWalletByUid,
	createTransactions,
	getTransaction,
	listTransactionsByBatchId,
	listTransactions,
};
