import { Timestamp } from "../gen/google/protobuf/timestamp";
import { Money } from "../gen/google/type/money";
import {
	CreateRechargeRequest,
	CreateRechargeResponse,
	GetRechargeRequest,
	GetRechargeResponse,
	ListRechargesRequest,
	ListRechargesResponse,
	Recharge_Status,
} from "../gen/ride/wallet/recharge/v1alpha1/recharge_service";

async function createRecharge(
	req: CreateRechargeRequest
): Promise<CreateRechargeResponse> {
	return {
		recharge: {
			rechargeId: "",
			amount: Money.create({ currencyCode: "INR", units: BigInt(0), nanos: 0 }),
			status: Recharge_Status.PENDING,
			createTime: Timestamp.now(),
		},
	};
}

// get recharge
async function getRecharge(
	req: GetRechargeRequest
): Promise<GetRechargeResponse> {
	return {
		recharge: {
			rechargeId: "",
			amount: Money.create({ currencyCode: "INR", units: BigInt(0), nanos: 0 }),
			status: Recharge_Status.PENDING,
			createTime: Timestamp.now(),
		},
	};
}

// list recharges
async function listRecharges(
	req: ListRechargesRequest
): Promise<ListRechargesResponse> {
	return {
		recharges: [
			{
				rechargeId: "",
				amount: Money.create({
					currencyCode: "INR",
					units: BigInt(0),
					nanos: 0,
				}),
				status: Recharge_Status.PENDING,
				createTime: Timestamp.now(),
			},
		],
		nextPageToken: "asdfadsf",
	};
}

export { createRecharge, getRecharge, listRecharges };
