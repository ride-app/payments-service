import { PartialMessage } from "@protobuf-ts/runtime";
import { ExpectedError, Reason } from "../errors/expected-error";
import { Timestamp } from "../gen/google/protobuf/timestamp";
import { Money } from "../gen/google/type/money";
import {
	Payout,
	Payout_Status,
} from "../gen/ride/payout/v1alpha1/payout_service";

function stringToPayoutStatus(status: string): Payout_Status {
	switch (status) {
		case "PENDING":
			return Payout_Status.PENDING;

		case "SUCCESS":
			return Payout_Status.SUCCESS;

		case "FAILED":
			return Payout_Status.FAILED;

		default:
			return Payout_Status.UNSPECIFIED;
	}
}

function payoutDataToPayout(data: Record<string, any>): PartialMessage<Payout> {
	const status = stringToPayoutStatus(data.status);

	if (status === Payout_Status.UNSPECIFIED) {
		throw new ExpectedError("Invalid payout status", Reason.BAD_STATE);
	}

	return {
		amount: Money.fromJson(data.amount),
		status,
		createTime: Timestamp.fromDate(data.createTime),
	};
}

export { stringToPayoutStatus, payoutDataToPayout };
