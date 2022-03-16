/**
 * @group integration/create-transactions
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	Firestore,
	getFirestore,
	Timestamp,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { CreateTransactionsRequest__Output } from '../../src/generated/ride/wallet/v1/CreateTransactionsRequest';

import { createTransactions } from '../../src/wallet-service';

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

describe('Create Transactions', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('transactions'),
			bulkWriter
		);
	});

	describe('Given Account Does Not Exist', () => {
		it('When transactions contains that account throws BAD_STATE error', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
				],
			};

			await expect(createTransactions(req)).rejects.toThrow(
				new ExpectedError('Account Does Not Exist', Reason.BAD_STATE)
			);
		});

		it('When transactions does not contain that account returns createTransactionsResponse', async () => {
			await firestore.collection('wallets').doc('test-account-id').set({});

			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res).toEqual({
				batchId: expect.any(String),
				transactionIds: expect.arrayContaining([expect.any(String)]),
			});

			const snap = await firestore
				.collection('transactions')
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				accountId: 'test-account-id',
				amount: 10,
				type: 'TRANSACTION_TYPE_CREDIT',
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});

			await firestore.recursiveDelete(
				firestore.collection('wallets'),
				bulkWriter
			);
		});
	});

	describe('Given Given All Accounts Exist', () => {
		beforeAll(async () => {
			await firestore.collection('wallets').doc('test-account-id').set({});
			await firestore.collection('wallets').doc('test-account-id-1').set({});
			await firestore.collection('wallets').doc('test-account-id-2').set({});
		});

		afterAll(async () => {
			await firestore.recursiveDelete(
				firestore.collection('wallets'),
				bulkWriter
			);
		});

		it('When all transactions are valid then adds all transactions to the database', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id-1',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id-2',
						amount: 10,
						type: 'TRANSACTION_TYPE_DEBIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res).toEqual({
				batchId: expect.any(String),
				transactionIds: expect.arrayContaining([expect.any(String)]),
			});
			expect(res.transactionIds!.length).toBe(3);

			const snap = await firestore.collection('transactions').get();

			expect(snap.empty).toBe(false);
			expect(snap.docs.length).toBe(3);
		});

		it('When multiple transaction to the same account is present then aggregates them to 1 transaction', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 100,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_DEBIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection('transactions')
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				accountId: 'test-account-id',
				amount: 100,
				type: 'TRANSACTION_TYPE_CREDIT',
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});

		it('When sum of all transactions to an account is 0 then makes no transaction against the account', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_DEBIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(0);

			const snap = await firestore.collection('transactions').get();

			expect(snap.empty).toBe(true);
		});

		it('When sum of all transactions to an account is positive then adds transaction with type TRANSACTION_TYPE_CREDIT', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 20,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_DEBIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection('transactions')
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				accountId: 'test-account-id',
				amount: 10,
				type: 'TRANSACTION_TYPE_CREDIT',
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});

		it('When sum of all transactions to an account is negative then adds transaction with type TRANSACTION_TYPE_DEBIT', async () => {
			const req: CreateTransactionsRequest__Output = {
				transactions: [
					{
						accountId: 'test-account-id',
						amount: 20,
						type: 'TRANSACTION_TYPE_DEBIT',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						type: 'TRANSACTION_TYPE_CREDIT',
					},
				],
			};

			const res = await createTransactions(req);
			expect(res.transactionIds!.length).toBe(1);

			const snap = await firestore
				.collection('transactions')
				.doc(res.transactionIds![0])
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				accountId: 'test-account-id',
				amount: 10,
				type: 'TRANSACTION_TYPE_DEBIT',
				timestamp: expect.any(Timestamp),
				batchId: res.batchId,
			});
		});
	});
});
