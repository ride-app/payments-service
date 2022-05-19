import { ExpectedError, Reason } from "../errors/expected-error";
import {
	ListPayoutsRequest,
	ListPayoutsResponse,
	Payout,
} from "../gen/ride/payout/v1alpha1/payout_service";
import PayoutRepository from "../repositories/payout-repository";
import { walletRegex } from "../utils";
import { payoutDataToPayout } from "./utils";

async function listPayouts(
	req: ListPayoutsRequest
): Promise<ListPayoutsResponse> {
	try {
		if (req.parent.match(walletRegex) === null) {
			throw new ExpectedError("invalid parent", Reason.INVALID_ARGUMENT);
		}

		const walletId = req.parent.split("/").pop();

		if (!walletId) {
			throw new ExpectedError("Invalid walletId", Reason.INVALID_ARGUMENT);
		}

		const payouts = await PayoutRepository.instance.getPayoutsForWalletId(
			walletId
		);

		const res: Payout[] = [];

		payouts.forEach((payoutData) => {
			const payout = Payout.create({
				name: `${req.parent}/payouts/${payoutData.payoutId}`,
				...payoutDataToPayout(payoutData),
			});

			Payout.mergePartial(payout, payoutDataToPayout(payoutData));

			res.push(payout);
		});

		return {
			payouts: res,
			// TODO: pagination
			nextPageToken: "",
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create payout", Reason.INTERNAL);
	}
}

export default listPayouts;
