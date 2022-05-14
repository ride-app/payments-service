/* jest ignore file */
// import { ExpectedError, Reason } from '../../src/errors/expected-error';

// import { CreateWalletRequest } from '../../src/gen/ride/wallet/v1alpha1/wallet_service';

// import { createWallet } from '../../src/wallet-service';

// import WalletRepository from '../../src/repositories/wallet-repository';

// jest.mock('../../src/repositories/wallet-repository', () => {
// 	return {
// 		WalletRepository: jest.fn().mockImplementation(() => {
// 			return {
// 				createWalletTransaction: jest.fn().mockResolvedValue({}),
// 				getWalletQuery: jest.fn().mockResolvedValue({}),
// 			};
// 		}),
// 	};
// });

// const mockedWalletRepository = jest.mocked(WalletRepository, true);

// describe('Create Wallet', () => {
// 	describe('Given Wallet Does not Exist', () => {
// 		mockedWalletRepository.prototype.getWalletQuery.mockImplementation(
// 			(id) => {
// 				if (id === 'test-wallet-id') {
// 					return Promise.resolve({
// 						exists: false,
// 					});
// 				}
// 				return { exists: true };
// 			}
// 		);

// 		mockedWalletRepository.prototype.createWalletTransaction.mockImplementation(
// 			(uid, _) => {
// 				if (uid === 'test-uid') {
// 					return Promise.resolve();
// 				}

// 				throw new ExpectedError(
// 					'Wallet Already Exists',
// 					Reason.ALREADY_EXISTS
// 				);
// 			}
// 		);
// 		it('When uid is valid returns Wallet object', async () => {
// 			const request: CreateWalletRequest = {
// 				uid: 'test-uid',
// 			};

// 			const { wallet } = await createWallet(request);

// 			expect(wallet.walletId).toBeTruthy();
// 			expect(wallet.balance).toBe(0);
// 			expect(wallet.uid).toBe(request.uid);

// 			const snap = await firestore
// 				.collection('wallets')
// 				.doc(wallet.walletId)
// 				.get();

// 			expect(snap.exists).toBe(true);
// 			expect(snap.data()).toEqual({
// 				balance: 0,
// 				uid: request.uid,
// 				createdAt: expect.any(Timestamp),
// 				updatedAt: expect.any(Timestamp),
// 			});
// 		});
// 	});

// 	describe('Given Wallet Already Exists', () => {
// 		beforeAll(async () => {
// 			await firestore
// 				.collection('wallets')
// 				.doc('test-wallet-id')
// 				.set({ uid: 'test-uid' });
// 		});

// 		it('When uid is valid returns ALREADY_EXISTS error', async () => {
// 			await expect(async () => {
// 				await createWallet({ uid: 'test-uid' });
// 			}).rejects.toThrowError(
// 				new ExpectedError('Wallet Already Exists', Reason.ALREADY_EXISTS)
// 			);
// 		});
// 	});
// });
