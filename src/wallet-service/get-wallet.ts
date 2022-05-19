import { Timestamp as FireTimestamp } from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	GetWalletRequest,
	GetWalletResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service";
import WalletRepository from "../repositories/wallet-repository";
import { walletRegex } from "../utils";

async function getWallet(
	request: GetWalletRequest
): Promise<GetWalletResponse> {
	if (request.name.match(walletRegex) === null) {
		throw new ExpectedError("Invalid wallet", Reason.INVALID_ARGUMENT);
	}

	const uid = request.name.split("/")[1];

	// TODO: Check if user is authorized to access this wallet
	const wallet = await WalletRepository.instance.getWallet(uid);

	if (wallet.exists === false) {
		throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
	}

	return {
		wallet: {
			name: request.name,
			balance: wallet.get("balance") as number,
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

export default getWallet;
