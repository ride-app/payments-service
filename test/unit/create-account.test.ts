/**
 * Unit Tests for TripRequest Model
 *
 * @group unit/create-account
 */

import { initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	Firestore,
	getFirestore,
	Timestamp,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { createAccountRequest__Output } from '../../src/proto/app/ride/walletService/createAccountRequest';

import { createAccount } from '../../src/wallet-service';

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

describe('Create Account', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('wallets'),
			bulkWriter
		);
	});

	describe('Given Account Does not Exist', () => {
		it('When uid is empty string returns INVALID_ARGUMENT error', async () => {
			const req: createAccountRequest__Output = {
				uid: '',
			};

			await expect(async () => {
				await createAccount(req, firestore);
			}).rejects.toThrow(
				new ExpectedError('uid is empty', Reason.INVALID_ARGUMENT)
			);

			const snap = await firestore
				.collection('wallets')
				.where('uid', '==', req.uid)
				.get();

			expect(snap.empty).toBe(true);
		});

		it('When uid is valid returns Account object', async () => {
			const request: createAccountRequest__Output = {
				uid: 'test-uid',
			};

			const res = await createAccount(request, firestore);

			expect(res.accountId).toBeTruthy();
			expect(res.balance).toBe(0);
			expect(res.uid).toBe(request.uid);

			const snap = await firestore
				.collection('wallets')
				.doc(res.accountId!)
				.get();

			expect(snap.exists).toBe(true);
			expect(snap.data()).toEqual({
				balance: 0,
				uid: request.uid,
				createdAt: expect.any(Timestamp),
				updatedAt: expect.any(Timestamp),
			});
		});
	});

	describe('Given Account Already Exists', () => {
		beforeAll(async () => {
			await firestore.collection('wallets').add({ uid: 'test-uid' });
		});

		it('When uid is valid returns ALREADY_EXISTS error', async () => {
			const request: createAccountRequest__Output = {
				uid: 'test-uid',
			};

			await expect(async () => {
				await createAccount(request, firestore);
			}).rejects.toThrowError(
				new ExpectedError('Account Already Exists', Reason.ALREADY_EXISTS)
			);
		});
	});
});
