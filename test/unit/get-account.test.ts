/**
 * Unit Tests for TripRequest Model
 *
 * @group unit/get-account
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

import { getAccountRequest__Output } from '../../src/proto/app/ride/walletService/getAccountRequest';

import { getAccount } from '../../src/wallet-service';

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

describe('Get Account', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('wallets'),
			bulkWriter
		);
	});

	describe('Given Account Does not Exist', () => {
		it('returns NOT_FOUND error', async () => {
			const req: getAccountRequest__Output = {
				accountId: 'test-account-id',
				_fieldMask: 'fieldMask',
			};

			await expect(async () => {
				await getAccount(req, firestore);
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
			const req: getAccountRequest__Output = {
				accountId: 'test-account-id',
				_fieldMask: 'fieldMask',
			};

			const res = await getAccount(req, firestore);

			expect(res).toEqual({
				accountId: req.accountId,
				balance: existingAccountData.balance,
				uid: existingAccountData.uid,
				createdAt: expect.any(Timestamp),
				updatedAt: expect.any(Timestamp),
			});
		});
	});
});
