/**
 * Unit Tests for TripRequest Model
 *
 * @group unit/get-account-by-uid
 */

import { initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
	Timestamp,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { getAccountByUidRequest__Output } from '../../src/proto/app/ride/walletService/getAccountByUidRequest';

import { getAccountByUid } from '../../src/wallet-service';

let firestore: Firestore;
let bulkWriter: BulkWriter;

beforeAll(async () => {
	initializeApp();
	firestore = getFirestore();
	bulkWriter = firestore.bulkWriter();
});

afterAll(async () => {
	await bulkWriter.close();
	await firestore.terminate();
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
			const req: getAccountByUidRequest__Output = {
				uid: 'test-uid',
				_fieldMask: 'fieldMask',
			};

			await expect(async () => {
				await getAccountByUid(req, firestore);
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
			const req: getAccountByUidRequest__Output = {
				uid: 'test-uid',
				_fieldMask: 'fieldMask',
			};

			const res = await getAccountByUid(req, firestore);

			expect(res).toEqual({
				accountId: 'test-account-id',
				balance: existingAccountData.balance,
				uid: req.uid,
				createdAt: expect.any(Timestamp),
				updatedAt: expect.any(Timestamp),
			});
		});
	});
});
