import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { ExpectedError, Reason } from "../errors/expected-error";

import WalletRepository from "../repositories/wallet-repository";
import { TransactionRepository } from "../repositories/transaction-repository";

import {
	ListTransactionsByBatchIdRequest,
	ListTransactionsByBatchIdResponse,
	TransactionType,
	BatchCreateTransactionsRequest,
	BatchCreateTransactionsResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service";

// async function createWallet(
// 	request: CreateWalletRequest
// ): Promise<CreateWalletResponse> {
// 	const walletId = randomUUID();
// 	await WalletRepository.instance.createWallet(request.uid, walletId);

// 	const walletDetails = await WalletRepository.instance.getWallet(walletId);

// 	if (walletDetails?.exists === false) {
// 		throw new ExpectedError("Wallet Creation Failed", Reason.NOT_FOUND);
// 	}

// 	return {
// 		wallet: {
// 			walletId,
// 			balance: walletDetails.get("balance") as number,
// 			uid: walletDetails.get("uid") as string,
// 			createTime: {
// 				seconds: walletDetails.get("createdAt")?.seconds,
// 				nanos: walletDetails.get("createdAt")?.nanoseconds,
// 			},
// 			updateTime: {
// 				seconds: walletDetails.get("updatedAt")?.seconds,
// 				nanos: walletDetails.get("updatedAt")?.nanoseconds,
// 			},
// 		},
// 	};
// }

// async function getWalletByUid(
// 	request: GetWalletByUidRequest
// ): Promise<GetWalletByUidResponse> {
// 	const wallet = await WalletRepository.instance.getWalletByUid(request.uid);

// 	if (wallet.empty) {
// 		throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
// 	}

// 	return {
// 		wallet: {
// 			walletId: wallet.docs[0].id,
// 			uid: wallet.docs[0].get("uid") as string,
// 			balance: wallet.docs[0].get("balance") as number,
// 			createTime: {
// 				seconds: BigInt(
// 					(wallet.docs[0].get("createdAt") as FireTimestamp).seconds
// 				),
// 				nanos: (wallet.docs[0].get("createdAt") as FireTimestamp).nanoseconds,
// 			},
// 			updateTime: {
// 				seconds: BigInt(
// 					(wallet.docs[0].get("updatedAt") as FireTimestamp).seconds
// 				),
// 				nanos: (wallet.docs[0].get("updatedAt") as FireTimestamp).nanoseconds,
// 			},
// 		},
// 	};
// }
