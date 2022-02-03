/**
 * @group integration/get-account-by-uid
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { GetAccountByUidRequest__Output } from '../../src/generated/ride/wallet/v1/GetAccountByUidRequest';

import { getAccountByUid } from '../../src/wallet-service';

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

describe('Get Account By Uid', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('wallets'),
			bulkWriter
		);
	});

	describe('Given Account Does not Exist', () => {
		it('returns NOT_FOUND error', async () => {
			const req: GetAccountByUidRequest__Output = {
				uid: 'test-uid',
				_fieldMask: 'fieldMask',
			};

			await expect(async () => {
				await getAccountByUid(req);
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
			const req: GetAccountByUidRequest__Output = {
				uid: 'test-uid',
				_fieldMask: 'fieldMask',
			};

			const res = await getAccountByUid(req);

			expect(res).toEqual({
				accountId: 'test-account-id',
				balance: existingAccountData.balance,
				uid: req.uid,
				createTime: expect.objectContaining({
					seconds: expect.any(Number),
					nanos: expect.any(Number),
				}),
				updateTime: expect.objectContaining({
					seconds: expect.any(Number),
					nanos: expect.any(Number),
				}),
			});
		});
	});
});
