/**
 * @group integration/get-account-by-batch-id
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { ListTransactionsByBatchIdRequest__Output } from '../../src/generated/ride/wallet/v1/ListTransactionsByBatchIdRequest';

import { listTransactionsByBatchId } from '../../src/wallet-service';

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
	describe('Given Transactions Do Not Exist', () => {
		it('returns NOT_FOUND error', async () => {
			const req: ListTransactionsByBatchIdRequest__Output = {
				batchId: 'test-batch-id',
				_fieldMask: 'fieldMask',
			};

			await expect(async () => {
				await listTransactionsByBatchId(req);
			}).rejects.toThrow(
				new ExpectedError('Transactions Not Found', Reason.NOT_FOUND)
			);
		});
	});

	describe('Given Transactions Already Exist', () => {
		it('returns the transactions', async () => {
			const req: ListTransactionsByBatchIdRequest__Output = {
				batchId: 'test-batch-id',
				_fieldMask: 'fieldMask',
			};

			const transactions = [
				{
					accountId: 'test-account-1',
					amount: 10,
					timestamp: FieldValue.serverTimestamp(),
					type: 'CREDIT',
					batchId: 'test-batch-id',
				},
				{
					accountId: 'test-account-2',
					amount: 10,
					timestamp: FieldValue.serverTimestamp(),
					type: 'CREDIT',
					batchId: 'test-batch-id',
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

			const res = await listTransactionsByBatchId(req);

			expect(res.transactions).toEqual([
				{
					transactionId: 'test-transaction-0',
					accountId: 'test-account-1',
					amount: 10,
					createTime: expect.objectContaining({
						seconds: expect.any(Number),
						nanos: expect.any(Number),
					}),
					type: 'CREDIT',
					batchId: 'test-batch-id',
				},
				{
					transactionId: 'test-transaction-1',
					accountId: 'test-account-2',
					amount: 10,
					createTime: expect.objectContaining({
						seconds: expect.any(Number),
						nanos: expect.any(Number),
					}),
					type: 'CREDIT',
					batchId: 'test-batch-id',
				},
			]);
		});
	});
});
