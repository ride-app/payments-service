/**
 * @group api/get-transaction-by-account-id
 */
import { status } from '@grpc/grpc-js';
import { listTransactionsByAccountId } from '../../src/wallet-service';
import { WalletServiceClient } from '../../src/generated/ride/wallet/v1/WalletService';
import { ExpectedError, Reason } from '../../src/errors/expected-error';
import { closeTestClient, startTestClient } from '../utils/test-client';
import { TransactionType } from '../../src/generated/ride/wallet/v1/TransactionType';

jest.mock('../../src/wallet-service');
const mockedListTransactionsByAccountId = jest.mocked(
	listTransactionsByAccountId
);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe('List Transactions For Account', () => {
	mockedListTransactionsByAccountId.mockImplementation(async () => {
		return {};
	});

	afterEach(mockedListTransactionsByAccountId.mockClear);

	it('When accountId is missing returns INVALID_ARGUMENT error', () => {
		return new Promise<void>((resolve) => {
			client.listTransactionsByAccountId({}, (err, res) => {
				expect(mockedListTransactionsByAccountId).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe('accountId is empty');
				resolve();
			});
		});
	});

	it('When accountId is empty returns INVALID_ARGUMENT error', () => {
		return new Promise<void>((resolve) => {
			client.listTransactionsByAccountId({ accountId: '' }, (err, res) => {
				expect(mockedListTransactionsByAccountId).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe('accountId is empty');
				resolve();
			});
		});
	});

	it('When throws NOT_FOUND return NOT_FOUND error', () => {
		return new Promise<void>((resolve) => {
			mockedListTransactionsByAccountId.mockImplementation(async () => {
				throw new ExpectedError('account not found', Reason.NOT_FOUND);
			});
			client.listTransactionsByAccountId(
				{ accountId: 'accountId' },
				(err, res) => {
					expect(mockedListTransactionsByAccountId).toHaveBeenCalledTimes(1);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.NOT_FOUND);
					expect(err?.details).toBe('account not found');
					resolve();
				}
			);
		});
	});

	it('When throws INTERNAL_ERROR return INTERNAL_ERROR error', () => {
		return new Promise<void>((resolve) => {
			mockedListTransactionsByAccountId.mockImplementation(async () => {
				throw new ExpectedError('internal error', Reason.INTERNAL);
			});
			client.listTransactionsByAccountId(
				{ accountId: 'test-account-id' },
				(err, res) => {
					expect(mockedListTransactionsByAccountId).toHaveBeenCalledTimes(1);
					expect(err).toBeDefined();
					expect(res).toBeUndefined();
					expect(err?.code).toBe(status.INTERNAL);
					expect(err?.details).toBe('internal error');
					resolve();
				}
			);
		});
	});

	it('When accountId is valid returns list of transactions', () => {
		return new Promise<void>((resolve) => {
			mockedListTransactionsByAccountId.mockImplementation(async () => {
				return {
					transactions: [
						{
							transactionId: 'test-transaction-id',
							type: TransactionType.TRANSACTION_TYPE_CREDIT,
							amount: 100,
							accountId: 'test-account-id',
							timestamp: {
								seconds: new Date().getSeconds(),
								nanos: 0,
							},
						},
					],
				};
			});
			client.listTransactionsByAccountId(
				{ accountId: 'test-account-id' },
				(err, res) => {
					expect(mockedListTransactionsByAccountId).toHaveBeenCalledTimes(1);
					expect(err).toBeFalsy();
					expect(res).toBeDefined();
					expect(res?.transactions).toHaveLength(1);
					expect(res?.transactions[0].transactionId).toBe(
						'test-transaction-id'
					);
					expect(res?.transactions[0].type).toBe('CREDIT');
					expect(res?.transactions[0].amount).toBe(100);
					expect(res?.transactions[0].createTime).toBeDefined();
					resolve();
				}
			);
		});
	});
});
