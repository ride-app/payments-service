import { nanoid } from "nanoid";
import { ExpectedError, Reason } from "../errors/expected-error";
import {
	CreatePayoutRequest,
	CreatePayoutResponse,
	Payout,
	Payout_Status,
} from "../gen/ride/payout/v1alpha1/payout_service";
import PayoutRepository from "../repositories/payout-repository";
import WalletRepository from "../repositories/wallet-repository";
import razorpay from "../third-party/razorpay";
import { moneyToInt, walletRegex } from "../utils";

async function createPayout(
	request: CreatePayoutRequest
): Promise<CreatePayoutResponse> {
	try {
		if (request.parent.match(walletRegex) === null) {
			throw new ExpectedError("Invalid parent", Reason.INVALID_ARGUMENT);
		}

		if (!request.payout) {
			throw new ExpectedError("Payout is empty", Reason.INVALID_ARGUMENT);
		}

		if (
			!request.payout.amount ||
			request.payout.amount.currencyCode !== "INR" ||
			request.payout.amount.units <= 0 ||
			request.payout.amount.nanos < 0
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

		const payoutAmount = moneyToInt(request.payout.amount);

		if (moneyToInt(request.payout.amount) > Math.abs(wallet.get("balance"))) {
			throw new ExpectedError(
				"Amount must be lesser than or equal to balance",
				Reason.INVALID_ARGUMENT
			);
		}

		const payoutId = nanoid();

		// Fuck razorpay for lack of typing
		// TODO: change to payout api
		const data = razorpay.orders.create({
			currency: request.payout.amount?.currencyCode ?? "INR",
			amount: payoutAmount,
		});

		if (!data) {
			throw new ExpectedError("Internal error", Reason.INTERNAL);
		}

		const checkoutInfo = {
			payment_gateway: "razorpay",
			rzp_order_id: data.id,
		};

		const payout = Payout.create({
			name: `${request.parent}/recharges/${payoutId}`,
			amount: request.payout.amount,
			status: Payout_Status.PENDING,
		});

		await PayoutRepository.instance.savePayout(walletId, payout, checkoutInfo);

		return {
			payout,
			checkoutInfo,
		};
	} catch (err) {
		if (err instanceof ExpectedError) {
			throw err;
		}
		throw new ExpectedError("Failed to create payout", Reason.INTERNAL);
	}
}

export default createPayout;
