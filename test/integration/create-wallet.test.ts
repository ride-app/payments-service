/**
 * @group integration/create-wallet
 */

import { App, deleteApp, initializeApp } from "firebase-admin/app";
import {
	BulkWriter,
	Firestore,
	getFirestore,
	Timestamp,
} from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../../src/errors/expected-error";

import { CreateWalletRequest } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";

import { createWallet } from "../../src/wallet-service/wallet-service";

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

describe("Create Wallet", () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection("wallets"),
			bulkWriter
		);
	});

	describe("Given Wallet Does not Exist", () => {
		it("When uid is valid returns Wallet object", async () => {
			const request: CreateWalletRequest = {
				uid: "test-uid",
			};

			const { wallet } = await createWallet(request);

			expect(wallet).toBeDefined();
			expect(wallet?.walletId).toBeTruthy();
			expect(wallet?.balance).toBe(0);
			expect(wallet?.uid).toBe(request.uid);

			const snap = await firestore
				.collection("wallets")
				.doc(wallet!.walletId)
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

	describe("Given Wallet Already Exists", () => {
		beforeAll(async () => {
			await firestore
				.collection("wallets")
				.doc("test-wallet-id")
				.set({ uid: "test-uid" });
		});

		it("When uid is valid returns ALREADY_EXISTS error", async () => {
			await expect(async () => {
				await createWallet({ uid: "test-uid" });
			}).rejects.toThrowError(
				new ExpectedError("Wallet Already Exists", Reason.ALREADY_EXISTS)
			);
		});
	});
});
