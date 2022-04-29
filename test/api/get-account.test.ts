/**
 * @group api/get-account
 */

import { status } from "@grpc/grpc-js";
import { getAccount } from "../../src/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { Account } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError, Reason } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedGetAccount = jest.mocked(getAccount);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe("Get Account", () => {
	mockedGetAccount.mockImplementation(async () => {
		return {};
	});

	afterEach(mockedGetAccount.mockClear);

	// it('When accountId is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.getAccount({}, (err, res) => {
	// 			expect(mockedGetAccount).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('accountId is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When accountId is empty string returns INVALID_ARGUMENT error", () => {
		return new Promise<void>((resolve) => {
			client.getAccount({ accountId: "" }, (err, res) => {
				expect(mockedGetAccount).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("accountId is empty");
				resolve();
			});
		});
	});

	it("When throws NOT_FOUND return NOT_FOUND error", () => {
		mockedGetAccount.mockImplementationOnce(async () => {
			throw new ExpectedError("Account Does Not Exist", Reason.NOT_FOUND);
		});

		return new Promise<void>((resolve) => {
			client.getAccount({ accountId: "test-account-id" }, (err, res) => {
				expect(mockedGetAccount).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe("Account Does Not Exist");
				resolve();
			});
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedGetAccount.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.getAccount({ accountId: "test-account-id" }, (err, res) => {
				expect(mockedGetAccount).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("Internal Error");
				resolve();
			});
		});
	});

	it("When accountId is valid returns Account", () => {
		const account: Account = {
			accountId: "test-account-id",
			uid: "test-uid",
			balance: 0,
			createTime: Timestamp.fromDate(new Date()),
			updateTime: Timestamp.fromDate(new Date()),
		};

		mockedGetAccount.mockImplementationOnce(async () => {
			return { account };
		});

		return new Promise<void>((resolve) => {
			client.getAccount({ accountId: "test-account-id" }, (err, res) => {
				expect(mockedGetAccount).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toStrictEqual({ account });
				resolve();
			});
		});
	});
});
