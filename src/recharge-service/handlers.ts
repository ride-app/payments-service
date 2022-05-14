import { status } from "@grpc/grpc-js";
import { createRecharge, getRecharge, listRecharges } from "./recharge-service";
import { ExpectedError, Reason } from "../errors/expected-error";

import { IRechargeService } from "../gen/ride/wallet/recharge/v1alpha1/recharge_service.grpc-server";

function handleError(callback: CallableFunction, error: unknown) {
	let code = status.INTERNAL;
	let message = "Something Went Wrong";

	if (error instanceof ExpectedError) {
		switch (error.reason) {
			case Reason.INVALID_ARGUMENT:
				code = status.INVALID_ARGUMENT;
				break;
			case Reason.ALREADY_EXISTS:
				code = status.ALREADY_EXISTS;
				break;
			case Reason.BAD_STATE:
				code = status.FAILED_PRECONDITION;
				break;
			case Reason.NOT_FOUND:
				code = status.NOT_FOUND;
				break;

			default:
				break;
		}
		message = error.message;
	}

	callback({
		code,
		message,
	});
}

const handlers: IRechargeService = {
	createRecharge: async (call, callback) => {
		try {
			if (call.request.parent.match(/^wallets\/[A-Za-z0-9_-]+$/) === null) {
				throw new ExpectedError("rechargeId is empty", Reason.INVALID_ARGUMENT);
			}
			callback(null, await createRecharge(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	getRecharge: async (call, callback) => {
		try {
			if (
				call.request.name.match(
					/^wallets\/[A-Za-z0-9_-]+\/recharges\/[A-Za-z0-9_-]+$/
				) === null
			) {
				throw new ExpectedError("name is empty", Reason.INVALID_ARGUMENT);
			}
			callback(null, await getRecharge(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	listRecharges: async (call, callback) => {
		try {
			if (call.request.parent.match(/^wallets\/[A-Za-z0-9_-]+$/g) === null) {
				throw new ExpectedError("invalid parent", Reason.INVALID_ARGUMENT);
			}
			callback(null, await listRecharges(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
};

export default handlers;
