/**
 * @group integration/get-account
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
	Timestamp,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { GetAccountRequest } from '../../src/gen/ride/wallet/v1/wallet_service';

import { getAccount } from '../../src/wallet-service';

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

describe('Get Account', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('wallets'),
			bulkWriter
		);
	});

	describe('Given Account Does not Exist', () => {
		it('returns NOT_FOUND error', async () => {
			const req: GetAccountRequest = {
				accountId: 'test-account-id',
			};

			await expect(async () => {
				await getAccount(req);
			}).rejects.toThrow(
				new ExpectedError('Account Does Not Exist', Reason.NOT_FOUND)
			);
		});
	});

	describe('Given Account Already Exists', () => {
		const existingAccountData = {
			uid: 'test-uid',
			balance: 0,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};

		beforeAll(async () => {
			await firestore
				.collection('wallets')
				.doc('test-account-id')
				.set(existingAccountData);
		});

		it('returns Account object', async () => {
			const req: GetAccountRequest = {
				accountId: 'test-account-id',
			};

			const res = await getAccount(req);

			expect(res).toEqual({
				account: {
					accountId: req.accountId,
					balance: existingAccountData.balance,
					uid: existingAccountData.uid,
					createTime: expect.objectContaining({
						seconds: expect.any(BigInt),
						nanos: expect.any(Number),
					}),
					updateTime: expect.objectContaining({
						seconds: expect.any(BigInt),
						nanos: expect.any(Number),
					}),
				},
			});
		});
	});
});
