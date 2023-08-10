import { Code, ConnectError } from "@bufbuild/connect";
import {
	GetWalletRequest,
	GetWalletResponse,
} from "../gen/ride/wallet/v1alpha1/wallet_service_pb.js";

import WalletRepository from "../repositories/wallet-repository.js";
import { walletRegex } from "../utils/regex.js";

async function getWallet(req: GetWalletRequest): Promise<GetWalletResponse> {
	if (req.name.match(walletRegex) === null) {
  		throw new ConnectError("invalid wallet", Code.InvalidArgument);
	}

	const uid = req.name.split("/")[1];

	const wallet = await WalletRepository.instance.getWallet(uid);

	if (!wallet) {
  		throw new ConnectError("wallet does not exist", Code.NotFound);
	}

	return new GetWalletResponse({
		wallet,
	});
}

export default getWallet;