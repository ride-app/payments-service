/**
 * @group integration/get-wallet-by-uid
 */

import { App, deleteApp, initializeApp } from "firebase-admin/app";
import {
	BulkWriter,
	FieldValue,
	Firestore,
	getFirestore,
} from "firebase-admin/firestore";
import { ExpectedError, Reason } from "../../src/errors/expected-error";

import { GetWalletByUidRequest } from "../../src/gen/ride/wallet/v1alpha1/wallet_service";

import { getWalletByUid } from "../../src/wallet-service/wallet-service";

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

describe("Get Wallet By Uid", () => {
	afterEach(async () => {
		await firestore.recursiveDelete(
			firestore.collection("wallets"),
			bulkWriter
		);
	});

	describe("Given Wallet Does not Exist", () => {
		it("returns NOT_FOUND error", async () => {
			const req: GetWalletByUidRequest = {
				uid: "test-uid",
			};

			await expect(async () => {
				await getWalletByUid(req);
			}).rejects.toThrow(
				new ExpectedError("Wallet Does Not Exist", Reason.NOT_FOUND)
			);
		});
	});

	describe("Given Wallet Already Exists", () => {
		const existingWalletData = {
			uid: "test-uid",
			balance: 0,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};

		beforeAll(async () => {
			await firestore
				.collection("wallets")
				.doc("test-wallet-id")
				.set(existingWalletData);
		});

		it("returns Wallet object", async () => {
			const req: GetWalletByUidRequest = {
				uid: "test-uid",
			};

			const res = await getWalletByUid(req);

			expect(res).toEqual({
				wallet: {
					walletId: "test-wallet-id",
					balance: existingWalletData.balance,
					uid: req.uid,
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
