/**
 * @group api/get-transaction
 */

import { status } from "@grpc/grpc-js";
import { getTransaction } from "../../src/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import {
	Transaction,
	TransactionType,
} from "../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { ExpectedError, Reason } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { Timestamp } from "../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedGetTransaction = jest.mocked(getTransaction);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

describe("Get Transaction", () => {
	mockedGetTransaction.mockResolvedValue({});

	afterEach(mockedGetTransaction.mockClear);

	// it('When transactionId is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.getTransaction({}, (err, res) => {
	// 			expect(mockedGetTransaction).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('transactionId is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When transactionId is empty string returns INVALID_ARGUMENT error", () => {
		return new Promise<void>((resolve) => {
			client.getTransaction({ transactionId: "" }, (err, res) => {
				expect(mockedGetTransaction).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("transactionId is empty");
				resolve();
			});
		});
	});

	it("When throws NOT_FOUND return NOT_FOUND error", () => {
		mockedGetTransaction.mockImplementationOnce(async () => {
			throw new ExpectedError("Transaction Does Not Exist", Reason.NOT_FOUND);
		});

		return new Promise<void>((resolve) => {
			client.getTransaction(
				{ transactionId: "test-transaction-id" },
				(err, res) => {
					expect(mockedGetTransaction).toHaveBeenCalledTimes(1);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.NOT_FOUND);
					expect(err?.details).toBe("Transaction Does Not Exist");
					resolve();
				}
			);
		});
	});

	it("When throws internal error should return INTERNAL error", () => {
		mockedGetTransaction.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.getTransaction(
				{ transactionId: "test-transaction-id" },
				(err, res) => {
					expect(mockedGetTransaction).toHaveBeenCalledTimes(1);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INTERNAL);
					expect(err?.details).toBe("Internal Error");
					resolve();
				}
			);
		});
	});

	it("When transactionId is valid returns Transaction", () => {
		const transaction: Transaction = {
			transactionId: "test-transaction-id",
			accountId: "test-transaction-id",
			amount: 10,
			type: TransactionType.CREDIT,
			createTime: Timestamp.fromDate(new Date()),
			batchId: "test-batch-id",
		};

		mockedGetTransaction.mockImplementationOnce(async () => {
			return { transaction };
		});

		return new Promise<void>((resolve) => {
			client.getTransaction(
				{ transactionId: "test-transaction-id" },
				(err, res) => {
					expect(mockedGetTransaction).toHaveBeenCalledTimes(1);
					expect(err).toBeFalsy();
					expect(res).toBeDefined();
					expect(res).toEqual({ transaction });
					resolve();
				}
			);
		});
	});
});

afterAll(closeTestClient);
