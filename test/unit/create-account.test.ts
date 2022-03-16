/* jest ignore file */
// import { ExpectedError, Reason } from '../../src/errors/expected-error';

// import { CreateAccountRequest } from '../../src/gen/ride/wallet/v1/wallet_service';

// import { createAccount } from '../../src/wallet-service';

// import AccountRepository from '../../src/repositories/account-repository';

// jest.mock('../../src/repositories/account-repository', () => {
// 	return {
// 		AccountRepository: jest.fn().mockImplementation(() => {
// 			return {
// 				createAccountTransaction: jest.fn().mockResolvedValue({}),
// 				getAccountQuery: jest.fn().mockResolvedValue({}),
// 			};
// 		}),
// 	};
// });

// const mockedAccountRepository = jest.mocked(AccountRepository, true);

// describe('Create Account', () => {
// 	describe('Given Account Does not Exist', () => {
// 		mockedAccountRepository.prototype.getAccountQuery.mockImplementation(
// 			(id) => {
// 				if (id === 'test-account-id') {
// 					return Promise.resolve({
// 						exists: false,
// 					});
// 				}
// 				return { exists: true };
// 			}
// 		);

// 		mockedAccountRepository.prototype.createAccountTransaction.mockImplementation(
// 			(uid, _) => {
// 				if (uid === 'test-uid') {
// 					return Promise.resolve();
// 				}

// 				throw new ExpectedError(
// 					'Account Already Exists',
// 					Reason.ALREADY_EXISTS
// 				);
// 			}
// 		);
// 		it('When uid is valid returns Account object', async () => {
// 			const request: CreateAccountRequest = {
// 				uid: 'test-uid',
// 			};

// 			const { account } = await createAccount(request);

// 			expect(account.accountId).toBeTruthy();
// 			expect(account.balance).toBe(0);
// 			expect(account.uid).toBe(request.uid);

// 			const snap = await firestore
// 				.collection('wallets')
// 				.doc(account.accountId)
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

// 	describe('Given Account Already Exists', () => {
// 		beforeAll(async () => {
// 			await firestore
// 				.collection('wallets')
// 				.doc('test-wallet-id')
// 				.set({ uid: 'test-uid' });
// 		});

// 		it('When uid is valid returns ALREADY_EXISTS error', async () => {
// 			await expect(async () => {
// 				await createAccount({ uid: 'test-uid' });
// 			}).rejects.toThrowError(
// 				new ExpectedError('Account Already Exists', Reason.ALREADY_EXISTS)
// 			);
// 		});
// 	});
// });
