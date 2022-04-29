/**
 * @group api/create-account
 */

import { status } from "@grpc/grpc-js";
import { createAccount } from "../../src/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { Account } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedCreateAccount = jest.mocked(createAccount);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

describe("Create Account", () => {
	mockedCreateAccount.mockImplementation(async () => {
		return {};
	});

	afterEach(mockedCreateAccount.mockClear);

	// it('When uid is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.createAccount({}, (err, res) => {
	// 			expect(mockedCreateAccount).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('uid is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When uid is empty string returns INVALID_ARGUMENT error", () => {
		return new Promise<void>((resolve) => {
			client.createAccount({ uid: "" }, (err, res) => {
				expect(mockedCreateAccount).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("uid is empty");
				resolve();
			});
		});
	});

	it("When uid is valid returns Account", () => {
		const account: Account = {
			accountId: "test-account-id",
			uid: "uid",
			balance: 0,
			createTime: Timestamp.fromDate(new Date()),
			updateTime: Timestamp.fromDate(new Date()),
		};

		mockedCreateAccount.mockImplementationOnce(async () => {
			return { account };
		});

		return new Promise<void>((resolve) => {
			client.createAccount({ uid: "uid" }, (err, res) => {
				expect(mockedCreateAccount).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toEqual({ account });
				resolve();
			});
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedCreateAccount.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.createAccount({ uid: "test-uid" }, (err, res) => {
				expect(mockedCreateAccount).toHaveBeenCalledTimes(1);
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
