import { nanoid } from "nanoid";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	CreateRechargeRequest,
	CreateRechargeResponse,
	Recharge,
	Recharge_Status,
} from "../gen/ride/recharge/v1alpha1/recharge_service";
import RechargeRepository from "../repositories/recharge-repository";
import WalletRepository from "../repositories/wallet-repository";
import razorpay from "../third-party/razorpay";
import { moneyToInt, walletRegex } from "../utils";

async function createRecharge(
	request: CreateRechargeRequest
): Promise<CreateRechargeResponse> {
	try {
		if (request.parent.match(walletRegex) === null) {
			throw new ExpectedError("Invalid parent", Reason.INVALID_ARGUMENT);
		}

		if (!request.recharge) {
			throw new ExpectedError("Invalid recharge", Reason.INVALID_ARGUMENT);
		}

		if (
			!request.recharge.amount ||
			request.recharge.amount.currencyCode !== "INR" ||
			request.recharge.amount.units <= 0 ||
			request.recharge.amount.nanos < 0
		) {
			throw new ExpectedError("Invalid amount", Reason.INVALID_ARGUMENT);
		}

		const walletId = request.parent.split("/").pop();

		if (!walletId || walletId === "-") {
			throw new ExpectedError("Invalid wallet id", Reason.INVALID_ARGUMENT);
		}

		const wallet = await WalletRepository.instance.getWallet(walletId);

		if (!wallet.exists) {
			throw new ExpectedError("Wallet does not exist", Reason.INVALID_ARGUMENT);
		}

		const rechargeAmount = moneyToInt(request.recharge.amount);

		if (Math.abs(wallet.get("balance")) > moneyToInt(request.recharge.amount)) {
			throw new ExpectedError(
				"Amount must be greater than balance due",
				Reason.INVALID_ARGUMENT
			);
		}

		const rechargeId = nanoid();

		// Fuck razorpay for lack of typing
		const data = razorpay.orders.create({
			currency: request.recharge.amount?.currencyCode ?? "INR",
			amount: rechargeAmount,
		});

		if (!data) {
			throw new ExpectedError("Internal error", Reason.INTERNAL);
		}

		const checkoutInfo = {
			payment_gateway: "razorpay",
			rzp_order_id: data.id,
		};

		const recharge = Recharge.create({
			name: `${request.parent}/recharges/${rechargeId}`,
			amount: request.recharge.amount,
			status: Recharge_Status.PENDING,
		});

		await RechargeRepository.instance.saveRecharge(
			walletId,
			recharge,
			checkoutInfo
		);

		return {
			recharge,
			checkoutInfo,
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create recharge", Reason.INTERNAL);
	}
}

export default createRecharge;
