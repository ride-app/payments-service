import { PartialMessage } from "@protobuf-ts/runtime";
import { ExpectedError, Reason } from "../errors/expected-error";
import { Timestamp } from "../gen/google/protobuf/timestamp";
import { Money } from "../gen/google/type/money";
import {
	Recharge,
	Recharge_Status,
} from "../gen/ride/recharge/v1alpha1/recharge_service";

function stringToRechargeStatus(status: string): Recharge_Status {
	switch (status) {
		case "PENDING":
			return Recharge_Status.PENDING;

		case "SUCCESS":
			return Recharge_Status.SUCCESS;

		case "FAILED":
			return Recharge_Status.FAILED;

		default:
			return Recharge_Status.UNSPECIFIED;
	}
}

function rechargeDataToRecharge(
	data: Record<string, any>
): PartialMessage<Recharge> {
	const status = stringToRechargeStatus(data.status);

	if (status === Recharge_Status.UNSPECIFIED) {
		throw new ExpectedError("Invalid recharge status", Reason.BAD_STATE);
	}

	return {
		amount: Money.fromJson(data.amount),
		status,
		createTime: Timestamp.fromDate(data.createTime),
	};
}

export { stringToRechargeStatus, rechargeDataToRecharge };
