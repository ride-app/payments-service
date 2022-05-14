/**
 * @group integration/list-transactions-by-wallet-id
 */

import { App, deleteApp, initializeApp } from "firebase-admin/app";
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../../src/errors/expected-error";

import { ListTransactionsRequest } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";

import { listTransactions } from "../../src/wallet-service/wallet-service";

let app: App;
let firestore: Firestore;
let bulkWriter: BulkWriter;

beforeAll(async () => {
	app = initializeApp();
	firestore = getFirestore();
	bulkWriter = firestore.bulkWriter();
});

afterAll(async () => {
	await bulkWriter.close();
	await firestore.terminate();
	await deleteApp(app);
});

describe("Get Transactions By BatchId", () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection("transactions"),
			bulkWriter
		);
	});
	describe("Given Wallet Does Not Exist", () => {
		// throws BAD_STATE error
		it("throws BAD_STATE error", async () => {
			const req: ListTransactionsRequest = {
				walletId: "test-wallet-id",
			};

			await expect(async () => {
				await listTransactions(req);
			}).rejects.toThrow(
				new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE)
			);
		});
	});

	describe("Given Wallet Exists", () => {
		beforeAll(async () => {
			await firestore.collection("wallets").doc("test-wallet-id").set({});
		});

		afterAll(async () => {
			await firestore.recursiveDelete(
				firestore.collection("wallets"),
				bulkWriter
			);
		});
		describe("When Transactions Do Not Exist", () => {
			it("throws NOT_FOUND error", async () => {
				const req: ListTransactionsRequest = {
					walletId: "test-wallet-id",
				};

				await expect(async () => {
					await listTransactions(req);
				}).rejects.toThrow(
					new ExpectedError("No Transactions Found", Reason.NOT_FOUND)
				);
			});
		});

		describe("When Transactions Already Exist", () => {
			it("returns the transactions", async () => {
				const req: ListTransactionsRequest = {
					walletId: "test-wallet-id",
				};

				const transactions = [
					{
						walletId: "test-wallet-id",
						amount: 10,
						timestamp: FieldValue.serverTimestamp(),
						type: "CREDIT",
						batchId: "test-batch-id-1",
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						timestamp: FieldValue.serverTimestamp(),
						type: "CREDIT",
						batchId: "test-batch-id-2",
					},
				];

				const batch = firestore.batch();

				transactions.forEach((transaction, i) => {
					const transactionRef = firestore
						.collection("transactions")
						.doc(`test-transaction-${i}`);
					batch.set(transactionRef, transaction);
				});

				await batch.commit();

				const res = await listTransactions(req);

				expect(res.transactions).toEqual([
					{
						transactionId: "test-transaction-0",
						walletId: "test-wallet-id",
						amount: 10,
						createTime: expect.objectContaining({
							seconds: expect.any(BigInt),
							nanos: expect.any(Number),
						}),
						type: "CREDIT",
						batchId: "test-batch-id-1",
					},
					{
						transactionId: "test-transaction-1",
						walletId: "test-wallet-id",
						amount: 10,
						createTime: expect.objectContaining({
							seconds: expect.any(BigInt),
							nanos: expect.any(Number),
						}),
						type: "CREDIT",
						batchId: "test-batch-id-2",
					},
				]);
			});
		});
	});
});
