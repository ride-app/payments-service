/**
 * @group api/create-transactions
 */

import { status } from "@grpc/grpc-js";
import { createTransactions } from "../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { ExpectedError } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { TransactionType } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";

jest.mock("../../src/wallet-service");
const mockedCreateTransactions = jest.mocked(createTransactions);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

describe("Create Transaction", () => {
	mockedCreateTransactions.mockResolvedValue({
		transactionIds: ["1", "2"],
		batchId: "3",
	});

	afterEach(mockedCreateTransactions.mockClear);

	// it('When there is no transactions returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.createTransactions({}, (err, res) => {
	// 			expect(mockedCreateTransactions).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('transactions is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When transactions is empty returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.createTransactions(
				{
					transactions: [],
				},
				(err, res) => {
					expect(mockedCreateTransactions).toHaveBeenCalledTimes(0);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INVALID_ARGUMENT);
					expect(err?.details).toBe("transactions is empty");
					resolve();
				}
			);
		}));

	it("When walletID is empty for a transaction returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.createTransactions(
				{
					transactions: [
						{
							walletId: "test-wallet-id",
							type: TransactionType.CREDIT,
							amount: 1,
						},
						{
							walletId: "",
							type: TransactionType.DEBIT,
							amount: 1,
						},
					],
				},
				(err, res) => {
					expect(mockedCreateTransactions).toHaveBeenCalledTimes(0);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INVALID_ARGUMENT);
					expect(err?.details).toBe("walletId is empty for transaction 1");
					resolve();
				}
			);
		}));

	// it('When amount is non integer for a transaction returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.createTransactions(
	// 			{
	// 				transactions: [
	// 					{
	// 						walletId: 'test-wallet-id',
	// 						type: TransactionType.CREDIT,
	// 						amount: 1,
	// 					},
	// 					{
	// 						walletId: 'test-wallet-id',
	// 						type: TransactionType.DEBIT,
	// 						amount: 5.55654,
	// 					},
	// 				],
	// 			},
	// 			(err, res) => {
	// 				expect(mockedCreateTransactions).toHaveBeenCalledTimes(0);
	// 				expect(err).toBeDefined();
	// 				expect(res).toBeUndefined();
	// 				expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 				expect(err?.details).toBe(
	// 					'Transaction amount must be an integer. Got 1.1 for transaction 1'
	// 				);
	// 				resolve();
	// 			}
	// 		);
	// 	});
	// });

	it("When amount is negative for a transaction returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.createTransactions(
				{
					transactions: [
						{
							walletId: "test-wallet-id",
							type: TransactionType.CREDIT,
							amount: 1,
						},
						{
							walletId: "test-wallet-id",
							type: TransactionType.DEBIT,
							amount: -1,
						},
					],
				},
				(err, res) => {
					expect(mockedCreateTransactions).toHaveBeenCalledTimes(0);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INVALID_ARGUMENT);
					expect(err?.details).toBe(
						"Transaction amount must be positive. Got -1 for transaction 1"
					);
					resolve();
				}
			);
		}));

	it("When throws internal error should return INTERNAL error", () => {
		mockedCreateTransactions.mockImplementationOnce(async () => {
			throw new ExpectedError("Internal Error");
		});

		return new Promise<void>((resolve) => {
			client.createTransactions(
				{
					transactions: [
						{
							walletId: "test-wallet-id",
							amount: 0,
							type: TransactionType.CREDIT,
						},
					],
				},
				(err, res) => {
					expect(mockedCreateTransactions).toHaveBeenCalledTimes(1);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INTERNAL);
					expect(err?.details).toBe("Internal Error");
					resolve();
				}
			);
		});
	});

	it("When request is valid returns batchId and transaction ids", () => {
		mockedCreateTransactions.mockImplementationOnce(async () => ({
			batchId: "test-batchId",
			transactionIds: ["test-transactionId-1", "test-transactionId-2"],
		}));

		return new Promise<void>((resolve) => {
			client.createTransactions(
				{
					transactions: [
						{
							walletId: "test-wallet-id-1",
							amount: 10,
							type: TransactionType.CREDIT,
						},
						{
							walletId: "test-wallet-id-2",
							amount: 20,
							type: TransactionType.DEBIT,
						},
					],
				},
				(err, res) => {
					expect(mockedCreateTransactions).toHaveBeenCalledTimes(1);
					expect(err).toBeFalsy();
					expect(res).toBeDefined();
					expect(res).toStrictEqual({
						batchId: "test-batchId",
						transactionIds: ["test-transactionId-1", "test-transactionId-2"],
					});
					resolve();
				}
			);
		});
	});
});

afterAll(closeTestClient);
