/**
 * @group integration/create-account
 */

import { App, deleteApp, initializeApp } from 'firebase-admin/app';
import {
	BulkWriter,
	Firestore,
	getFirestore,
	Timestamp,
} from 'firebase-admin/firestore';
import { ExpectedError, Reason } from '../../src/errors/expected-error';

import { CreateAccountRequest } from '../../src/gen/ride/wallet/v1/wallet_service';

import { createAccount } from '../../src/wallet-service';

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

describe('Create Account', () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection('wallets'),
			bulkWriter
		);
	});

	describe('Given Account Does not Exist', () => {
		it('When uid is valid returns Account object', async () => {
			const request: CreateAccountRequest = {
				uid: 'test-uid',
			};

			const { account } = await createAccount(request);

			expect(account).toBeDefined();
			expect(account?.accountId).toBeTruthy();
			expect(account?.balance).toBe(0);
			expect(account?.uid).toBe(request.uid);

			const snap = await firestore
				.collection('wallets')
				.doc(account!.accountId)
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
			await firestore
				.collection('wallets')
				.doc('test-wallet-id')
				.set({ uid: 'test-uid' });
		});

		it('When uid is valid returns ALREADY_EXISTS error', async () => {
			await expect(async () => {
				await createAccount({ uid: 'test-uid' });
			}).rejects.toThrowError(
				new ExpectedError('Account Already Exists', Reason.ALREADY_EXISTS)
			);
		});
	});
});
