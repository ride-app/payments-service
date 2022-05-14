/**
 * @group api/get-transaction-by-wallet-id
 */
import { status } from "@grpc/grpc-js";
import { listTransactions } from "../../src/wallet-service/wallet-service";
import { WalletServiceClient } from "../../src/gen/ride/wallet/v1alpha1/wallet_service.grpc-client";
import { ExpectedError, Reason } from "../../src/errors/expected-error";
import { closeTestClient, startTestClient } from "../utils/test-client";
import { TransactionType } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";
import { Timestamp } from "../../src/gen/google/protobuf/timestamp";

jest.mock("../../src/wallet-service");
const mockedListTransactionsByWalletId = jest.mocked(listTransactions);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe("List Transactions For Wallet", () => {
	mockedListTransactionsByWalletId.mockResolvedValue({ transactions: [] });

	afterEach(mockedListTransactionsByWalletId.mockClear);

	// it('When walletId is missing returns INVALID_ARGUMENT error', () => {
	// 	return new Promise<void>((resolve) => {
	// 		client.listTransactions({}, (err, res) => {
	// 			expect(mockedListTransactionsByWalletId).toHaveBeenCalledTimes(0);
	// 			expect(err).toBeDefined();
	// 			expect(res).toBeUndefined();
	// 			expect(err?.code).toBe(status.INVALID_ARGUMENT);
	// 			expect(err?.details).toBe('walletId is empty');
	// 			resolve();
	// 		});
	// 	});
	// });

	it("When walletId is empty returns INVALID_ARGUMENT error", () =>
		new Promise<void>((resolve) => {
			client.listTransactions({ walletId: "" }, (err, res) => {
				expect(mockedListTransactionsByWalletId).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe("walletId is empty");
				resolve();
			});
		}));

	it("When throws NOT_FOUND return NOT_FOUND error", () =>
		new Promise<void>((resolve) => {
			mockedListTransactionsByWalletId.mockImplementation(async () => {
				throw new ExpectedError("wallet not found", Reason.NOT_FOUND);
			});
			client.listTransactions({ walletId: "walletId" }, (err, res) => {
				expect(mockedListTransactionsByWalletId).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe("wallet not found");
				resolve();
			});
		}));

	it("When throws INTERNAL_ERROR return INTERNAL_ERROR error", () =>
		new Promise<void>((resolve) => {
			mockedListTransactionsByWalletId.mockImplementation(async () => {
				throw new ExpectedError("internal error", Reason.INTERNAL);
			});
			client.listTransactions({ walletId: "test-wallet-id" }, (err, res) => {
				expect(mockedListTransactionsByWalletId).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe("internal error");
				resolve();
			});
		}));

	it("When walletId is valid returns list of transactions", () =>
		new Promise<void>((resolve) => {
			mockedListTransactionsByWalletId.mockResolvedValueOnce({
				transactions: [
					{
						transactionId: "test-transaction-id",
						type: TransactionType.CREDIT,
						amount: 100,
						walletId: "test-wallet-id",
						createTime: Timestamp.fromDate(new Date()),
						batchId: "test-batch-id",
					},
				],
			});
			client.listTransactions({ walletId: "test-wallet-id" }, (err, res) => {
				expect(mockedListTransactionsByWalletId).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res?.transactions).toHaveLength(1);
				expect(res?.transactions[0].transactionId).toBe("test-transaction-id");
				expect(res?.transactions[0].type).toBe(TransactionType.CREDIT);
				expect(res?.transactions[0].amount).toBe(100);
				expect(res?.transactions[0].createTime).toBeDefined();
				resolve();
			});
		}));
});
