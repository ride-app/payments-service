/**
 * @group integration/create-transactions
 */

import { App, deleteApp, initializeApp } from "firebase-admin/app";
import {
	BulkWriter,
	Firestore,
	getFirestore,
	Timestamp,
} from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../../../src/errors/expected-error";

import {
	CreateTransactionsRequest,
	TransactionType,
} from "../../../src/gen/ride/wallet/v1alpha1/wallet_service";

import { createTransactions } from "../../../src/wallet-service/wallet-service";

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

describe("Create Transactions", () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection("transactions"),
			bulkWriter
		);
	});

	describe("Given Wallet Does Not Exist", () => {
		it("When transactions contains that wallet throws BAD_STATE error", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
				],
			};

			await expect(createTransactions(req)).rejects.toThrow(
				new ExpectedError("Wallet Does Not Exist", Reason.BAD_STATE)
			);
		});

		it("When transactions does not contain that wallet returns createTransactionsResponse", async () => {
			await firestore.collection("wallets").doc("test-wallet-id").set({});

			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res).toEqual({
				batchId: expect.any(String),
				transactionIds: expect.arrayContaining([expect.any(String)]),
			});

			const snap = await firestore
				.collection("transactions")
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				walletId: "test-wallet-id",
				amount: 10,
				type: "CREDIT",
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});

			await firestore.recursiveDelete(
				firestore.collection("wallets"),
				bulkWriter
			);
		});
	});

	describe("Given Given All Wallets Exist", () => {
		beforeAll(async () => {
			await firestore.collection("wallets").doc("test-wallet-id").set({});
			await firestore.collection("wallets").doc("test-wallet-id-1").set({});
			await firestore.collection("wallets").doc("test-wallet-id-2").set({});
		});

		afterAll(async () => {
			await firestore.recursiveDelete(
				firestore.collection("wallets"),
				bulkWriter
			);
		});

		it("When all transactions are valid then adds all transactions to the database", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id-1",
						amount: 10,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id-2",
						amount: 10,
						type: TransactionType.DEBIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res).toEqual({
				batchId: expect.any(String),
				transactionIds: expect.arrayContaining([expect.any(String)]),
			});
			expect(res.transactionIds!.length).toBe(3);

			const snap = await firestore.collection("transactions").get();

			expect(snap.empty).toBe(false);
			expect(snap.docs.length).toBe(3);
		});

		it("When multiple transaction to the same wallet is present then aggregates them to 1 transaction", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 100,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.DEBIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection("transactions")
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				walletId: "test-wallet-id",
				amount: 100,
				type: "CREDIT",
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});

		it("When sum of all transactions to an wallet is 0 then makes no transaction against the wallet", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.DEBIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(0);

			const snap = await firestore.collection("transactions").get();

			expect(snap.empty).toBe(true);
		});

		it("When sum of all transactions to an wallet is positive then adds transaction with transaction type credit", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 20,
						type: TransactionType.CREDIT,
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.DEBIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection("transactions")
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				walletId: "test-wallet-id",
				amount: 10,
				type: "CREDIT",
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});

		it("When sum of all transactions to an wallet is negative then adds transaction with transaction type debit", async () => {
			const req: CreateTransactionsRequest = {
				transactions: [
					{
						walletId: "test-wallet-id",
						amount: 20,
						type: TransactionType.DEBIT,
					},
					{
						walletId: "test-wallet-id",
						amount: 10,
						type: TransactionType.CREDIT,
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection("transactions")
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				walletId: "test-wallet-id",
				amount: 10,
				type: "DEBIT",
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});
	});
});
