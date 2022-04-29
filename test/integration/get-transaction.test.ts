/**
 * @group integration/get-transaction
 */

import { App, deleteApp, initializeApp } from "firebase-admin/app";
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../../src/errors/expected-error";

import { GetTransactionRequest } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";

import { getTransaction } from "../../src/wallet-service";

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

describe("Get Transaction", () => {
	describe("Given Transaction Does not Exist", () => {
		it("returns NOT_FOUND error", async () => {
			const req: GetTransactionRequest = {
				transactionId: "test-transaction-id",
			};

			await expect(async () => {
				await getTransaction(req);
			}).rejects.toThrow(
				new ExpectedError("Transaction Not Found", Reason.NOT_FOUND)
			);
		});
	});

	describe("Given Transaction Already Exists", () => {
		it("returns the transaction", async () => {
			const req: GetTransactionRequest = {
				transactionId: "test-transaction-id",
			};

			const transaction = {
				accountId: "test-account-id",
				amount: 1234,
				timestamp: FieldValue.serverTimestamp(),
				type: "CREDIT",
				batchId: "test-batch-id",
			};

			await firestore
				.collection("transactions")
				.doc("test-transaction-id")
				.create(transaction);

			const { transaction: result } = await getTransaction(req);

			expect(result).toBeDefined();
			expect(result?.transactionId).toBe("test-transaction-id");
			expect(result?.accountId).toBe("test-account-id");
			expect(result?.amount).toBe(transaction.amount);
			expect(result?.createTime).toBeInstanceOf(Object);
			expect(result?.type).toBe(transaction.type);
			expect(result?.batchId).toBe(transaction.batchId);
		});
	});
});
