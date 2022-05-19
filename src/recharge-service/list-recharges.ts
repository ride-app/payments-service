import { ExpectedError, Reason } from "../errors/expected-error";
import {
	ListRechargesRequest,
	ListRechargesResponse,
	Recharge,
} from "../gen/ride/recharge/v1alpha1/recharge_service";
import RechargeRepository from "../repositories/recharge-repository";
import { walletRegex } from "../utils";
import { rechargeDataToRecharge } from "./utils";

async function listRecharges(
	request: ListRechargesRequest
): Promise<ListRechargesResponse> {
	try {
		if (request.parent.match(walletRegex) === null) {
			throw new ExpectedError("invalid parent", Reason.INVALID_ARGUMENT);
		}

		const walletId = request.parent.split("/").pop();

		if (!walletId) {
			throw new ExpectedError("Invalid walletId", Reason.INVALID_ARGUMENT);
		}

		const recharges = await RechargeRepository.instance.getRechargesForWalletId(
			walletId
		);

		const res: Recharge[] = [];

		recharges.forEach((rechargeData) => {
			const recharge = Recharge.create({
				name: `${request.parent}/recharges/${rechargeData.rechargeId}`,
				...rechargeDataToRecharge(rechargeData),
			});

			res.push(recharge);
		});

		return {
			recharges: res,
			// TODO: pagination
			nextPageToken: "",
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create recharge", Reason.INTERNAL);
	}
}

export default listRecharges;
