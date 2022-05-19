/**
 * @group api/get-wallet
 */

import { status } from "@grpc/grpc-js";
import { getWallet } from "../../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { Wallet } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError, Reason } from "../../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedGetWallet = jest.mocked(getWallet);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe("Get Wallet", () => {
	mockedGetWallet.mockImplementation(async () => ({}));

	afterEach(mockedGetWallet.mockClear);

	// it('When walletId is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.getWallet({}, (err, res) => {
	// 			expect(mockedGetWallet).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('walletId is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When walletId is empty string returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.getWallet({ walletId: "" }, (err, res) => {
				expect(mockedGetWallet).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("walletId is empty");
				resolve();
			});
		}));

	it("When throws NOT_FOUND return NOT_FOUND error", () => {
		mockedGetWallet.mockImplementationOnce(async () => {
			throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
		});

		return new Promise<void>((resolve) => {
			client.getWallet({ walletId: "test-wallet-id" }, (err, res) => {
				expect(mockedGetWallet).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe("Wallet Does Not Exist");
				resolve();
			});
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedGetWallet.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.getWallet({ walletId: "test-wallet-id" }, (err, res) => {
				expect(mockedGetWallet).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("Internal Error");
				resolve();
			});
		});
	});

	it("When walletId is valid returns Wallet", () => {
		const wallet: Wallet = {
			walletId: "test-wallet-id",
			uid: "test-uid",
			balance: 0,
			createTime: Timestamp.fromDate(new Date()),
			updateTime: Timestamp.fromDate(new Date()),
		};

		mockedGetWallet.mockImplementationOnce(async () => ({ wallet }));

		return new Promise<void>((resolve) => {
			client.getWallet({ walletId: "test-wallet-id" }, (err, res) => {
				expect(mockedGetWallet).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toStrictEqual({ wallet });
				resolve();
			});
		});
	});
});
