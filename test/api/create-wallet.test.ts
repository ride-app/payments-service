/**
 * @group api/create-wallet
 */

import { status } from "@grpc/grpc-js";
import { createWallet } from "../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { Wallet } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedCreateWallet = jest.mocked(createWallet);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

describe("Create Wallet", () => {
	mockedCreateWallet.mockImplementation(async () => ({}));

	afterEach(mockedCreateWallet.mockClear);

	// it('When uid is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.createWallet({}, (err, res) => {
	// 			expect(mockedCreateWallet).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('uid is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When uid is empty string returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.createWallet({ uid: "" }, (err, res) => {
				expect(mockedCreateWallet).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("uid is empty");
				resolve();
			});
		}));

	it("When uid is valid returns Wallet", () => {
		const wallet: Wallet = {
			walletId: "test-wallet-id",
			uid: "uid",
			balance: 0,
			createTime: Timestamp.fromDate(new Date()),
			updateTime: Timestamp.fromDate(new Date()),
		};

		mockedCreateWallet.mockImplementationOnce(async () => ({ wallet }));

		return new Promise<void>((resolve) => {
			client.createWallet({ uid: "uid" }, (err, res) => {
				expect(mockedCreateWallet).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toEqual({ wallet });
				resolve();
			});
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedCreateWallet.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.createWallet({ uid: "test-uid" }, (err, res) => {
				expect(mockedCreateWallet).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("Internal Error");
				resolve();
			});
		});
	});
});

afterAll(closeTestClient);
