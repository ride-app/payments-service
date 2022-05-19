import { status } from "@grpc/grpc-js";
import { ExpectedError, Reason } from "../errors/expected-error";

import { IPayoutService } from "../gen/ride/wallet/payout/v1alpha1/payout_service.grpc-server";
import createPayout from "./create-payout";
import getPayout from "./get-payout";
import listPayouts from "./list-payouts";

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

const handlers: IPayoutService = {
	createPayout: async (call, callback) => {
		try {
			callback(null, await createPayout(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	getPayout: async (call, callback) => {
		try {
			callback(null, await getPayout(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
	listPayouts: async (call, callback) => {
		try {
			callback(null, await listPayouts(call.request));
		} catch (error) {
			handleError(callback, error);
		}
	},
};

export default handlers;
