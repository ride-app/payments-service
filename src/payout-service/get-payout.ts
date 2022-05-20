import { ExpectedError, Reason } from "../errors/expected-error";
import {
	GetPayoutRequest,
	GetPayoutResponse,
	Payout,
} from "../gen/ride/payout/v1alpha1/payout_service";
import PayoutRepository from "../repositories/payout-repository";
import { payoutRegex } from "../utils";
import { payoutDataToPayout } from "./utils";

async function getPayout(
	request: GetPayoutRequest
): Promise<GetPayoutResponse> {
	try {
		if (request.name.match(payoutRegex) === null) {
			throw new ExpectedError("name is empty", Reason.INVALID_ARGUMENT);
		}

		const payoutId = request.name.split("/").pop();

		if (!payoutId) {
			throw new ExpectedError("Invalid payout id", Reason.INVALID_ARGUMENT);
		}

		const payoutData = await PayoutRepository.instance.getPayout(payoutId);

		if (!payoutData) {
			throw new ExpectedError("Payout does not exist", Reason.NOT_FOUND);
		}

		const payout = Payout.create({
			name: request.name,
			...payoutDataToPayout(payoutData),
		});

		return {
			payout,
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create payout", Reason.INTERNAL);
	}
}

export default getPayout;
