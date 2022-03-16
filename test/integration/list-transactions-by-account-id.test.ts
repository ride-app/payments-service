/**
 * @group integration/list-transactions-by-account-id
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { ListTransactionsByAccountIdRequest } from '../../src/gen/ride/wallet/v1/wallet_service';

import { listTransactionsByAccountId } from '../../src/wallet-service';

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

describe('Get Transactions By BatchId', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('transactions'),
			bulkWriter
		);
	});
	describe('Given Account Does Not Exist', () => {
		// throws BAD_STATE error
		it('throws BAD_STATE error', async () => {
			const req: ListTransactionsByAccountIdRequest = {
				accountId: 'test-account-id',
			};

			await expect(async () => {
				await listTransactionsByAccountId(req);
			}).rejects.toThrow(
				new ExpectedError('Account Does Not Exist', Reason.BAD_STATE)
			);
		});
	});

	describe('Given Account Exists', () => {
		beforeAll(async () => {
			await firestore.collection('wallets').doc('test-account-id').set({});
		});

		afterAll(async () => {
			await firestore.recursiveDelete(
				firestore.collection('wallets'),
				bulkWriter
			);
		});
		describe('When Transactions Do Not Exist', () => {
			it('throws NOT_FOUND error', async () => {
				const req: ListTransactionsByAccountIdRequest = {
					accountId: 'test-account-id',
				};

				await expect(async () => {
					await listTransactionsByAccountId(req);
				}).rejects.toThrow(
					new ExpectedError('No Transactions Found', Reason.NOT_FOUND)
				);
			});
		});

		describe('When Transactions Already Exist', () => {
			it('returns the transactions', async () => {
				const req: ListTransactionsByAccountIdRequest = {
					accountId: 'test-account-id',
				};

				const transactions = [
					{
						accountId: 'test-account-id',
						amount: 10,
						timestamp: FieldValue.serverTimestamp(),
						type: 'CREDIT',
						batchId: 'test-batch-id-1',
					},
					{
						accountId: 'test-account-id',
						amount: 10,
						timestamp: FieldValue.serverTimestamp(),
						type: 'CREDIT',
						batchId: 'test-batch-id-2',
					},
				];

				const batch = firestore.batch();

				transactions.forEach((transaction, i) => {
					const transactionRef = firestore
						.collection('transactions')
						.doc(`test-transaction-${i}`);
					batch.set(transactionRef, transaction);
				});

				await batch.commit();

				const res = await listTransactionsByAccountId(req);

				expect(res.transactions).toEqual([
					{
						transactionId: 'test-transaction-0',
						accountId: 'test-account-id',
						amount: 10,
						createTime: expect.objectContaining({
							seconds: expect.any(BigInt),
							nanos: expect.any(Number),
						}),
						type: 'CREDIT',
						batchId: 'test-batch-id-1',
					},
					{
						transactionId: 'test-transaction-1',
						accountId: 'test-account-id',
						amount: 10,
						createTime: expect.objectContaining({
							seconds: expect.any(BigInt),
							nanos: expect.any(Number),
						}),
						type: 'CREDIT',
						batchId: 'test-batch-id-2',
					},
				]);
			});
		});
	});
});
