/**
 * @group api/get-transaction-by-batch-id
 */

import { status } from "@grpc/grpc-js";
import { listTransactionsByBatchId } from "../../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { ExpectedError, Reason } from "../../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { TransactionType } from "../../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { Timestamp } from "../../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedListTransactionsByBatchId = jest.mocked(listTransactionsByBatchId);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe("Get Transactions by Batch Id", () => {
	mockedListTransactionsByBatchId.mockResolvedValue({ transactions: [] });

	afterEach(mockedListTransactionsByBatchId.mockClear);

	// it('When batchId is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.listTransactionsByBatchId({}, (err, res) => {
	// 			expect(mockedListTransactionsByBatchId).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('batchId is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When batchId is empty string returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.listTransactionsByBatchId({ batchId: "" }, (err, res) => {
				expect(mockedListTransactionsByBatchId).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("batchId is empty");
				resolve();
			});
		}));

	it("When throws NOT_FOUND return NOT_FOUND error", () => {
		mockedListTransactionsByBatchId.mockImplementation(async () => {
			throw new ExpectedError(
				"No Transactions Exist for Batch Id",
				Reason.NOT_FOUND
			);
		});

		return new Promise<void>((resolve) => {
			client.listTransactionsByBatchId({ batchId: "123" }, (err, res) => {
				expect(mockedListTransactionsByBatchId).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe("No Transactions Exist for Batch Id");
				resolve();
			});
		});
	});

	it("When throws INTERNAL returns INTERNAL error", () => {
		mockedListTransactionsByBatchId.mockImplementation(async () => {
			throw new ExpectedError("Internal Error", Reason.INTERNAL);
		});

		return new Promise<void>((resolve) => {
			client.listTransactionsByBatchId({ batchId: "123" }, (err, res) => {
				expect(mockedListTransactionsByBatchId).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("Internal Error");
				resolve();
			});
		});
	});

	it("When batchId is valid returns getTransactionsByBatchIdResponse", () => {
		mockedListTransactionsByBatchId.mockResolvedValueOnce({
			transactions: [
				{
					transactionId: "test-transaction-id-1",
					walletId: "test-wallet-id-1",
					amount: 10,
					type: TransactionType.CREDIT,
					createTime: Timestamp.fromDate(new Date()),
					batchId: "123",
				},
				{
					transactionId: "test-transaction-id-2",
					walletId: "test-wallet-id-2",
					amount: 20,
					type: TransactionType.CREDIT,
					createTime: Timestamp.fromDate(new Date()),
					batchId: "123",
				},
			],
		});

		return new Promise<void>((resolve) => {
			client.listTransactionsByBatchId({ batchId: "123" }, (err, res) => {
				expect(mockedListTransactionsByBatchId).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res?.transactions).toHaveLength(2);
				resolve();
			});
		});
	});
});
