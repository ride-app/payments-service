import { ExpectedError, Reason } from "../errors/expected-error";
import {
	GetRechargeRequest,
	GetRechargeResponse,
	Recharge,
} from "../gen/ride/recharge/v1alpha1/recharge_service";
import RechargeRepository from "../repositories/recharge-repository";
import { rechargeRegex } from "../utils";
import { rechargeDataToRecharge } from "./utils";

async function getRecharge(
	request: GetRechargeRequest
): Promise<GetRechargeResponse> {
	try {
		if (request.name.match(rechargeRegex) === null) {
			throw new ExpectedError("Invalid name", Reason.INVALID_ARGUMENT);
		}

		const rechargeId = request.name.split("/").pop();

		if (!rechargeId) {
			throw new ExpectedError("Invalid recharge id", Reason.INVALID_ARGUMENT);
		}

		const rechargeData = await RechargeRepository.instance.getRecharge(
			rechargeId
		);

		if (!rechargeData) {
			throw new ExpectedError("Recharge does not exist", Reason.NOT_FOUND);
		}

		const recharge = Recharge.create({
			name: request.name,
			...rechargeDataToRecharge(rechargeData),
		});

		return {
			recharge,
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create recharge", Reason.INTERNAL);
	}
}

export default getRecharge;
