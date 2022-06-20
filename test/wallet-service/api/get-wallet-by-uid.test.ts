/**
 * @group api/get-wallet-by-uid
 */

import { status } from "@grpc/grpc-js";
import { getWalletByUid } from "../../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { Wallet } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError, Reason } from "../../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedGetWalletByUid = jest.mocked(getWalletByUid);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe("Get Wallet By uid", () => {
	mockedGetWalletByUid.mockImplementation(async () => ({}));

	afterEach(mockedGetWalletByUid.mockClear);

	// it('When uid is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.getWalletByUid({}, (err, res) => {
	// 			expect(mockedGetWalletByUid).toHaveBeenCalledTimes(0);
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
			client.getWalletByUid({ uid: "" }, (err, res) => {
				expect(mockedGetWalletByUid).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("uid is empty");
				resolve();
			});
		}));

	it("When throws NOT_FOUND return NOT_FOUND error", () => {
		mockedGetWalletByUid.mockImplementationOnce(async () => {
			throw new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND);
		});

		return new Promise<void>((resolve) => {
			client.getWalletByUid({ uid: "test-uid" }, (err, res) => {
				expect(mockedGetWalletByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe("Wallet Does Not Exist");
				resolve();
			});
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedGetWalletByUid.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.getWalletByUid({ uid: "test-uid" }, (err, res) => {
				expect(mockedGetWalletByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("Internal Error");
				resolve();
			});
		});
	});

	it("When uid is valid returns Wallet", () => {
		const wallet: Wallet = {
			walletId: "test-wallet-id",
			uid: "test-uid",
			balance: 0,
			createTime: Timestamp.fromDate(new Date()),
			updateTime: Timestamp.fromDate(new Date()),
		};

		mockedGetWalletByUid.mockImplementationOnce(async () => ({ wallet }));

		return new Promise<void>((resolve) => {
			client.getWalletByUid({ uid: "test-uid" }, (err, res) => {
				expect(mockedGetWalletByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toStrictEqual({ wallet });
				resolve();
			});
		});
	});
});
