/**
 * @group api/get-account-by-uid
 */

import { status } from '@grpc/grpc-js';
import { getAccountByUid } from '../../src/wallet-service';
import { WalletServiceClient } from '../../src/generated/ride/wallet/v1/WalletService';
import { Account } from '../../src/generated/ride/wallet/v1/Account';
import { ExpectedError, Reason } from '../../src/errors/expected-error';
import { closeTestClient, startTestClient } from '../utils/test-client';

jest.mock('../../src/wallet-service');
const mockedGetAccountByUid = jest.mocked(getAccountByUid);

let client: WalletServiceClient;

beforeAll(async () => {
	client = await startTestClient();
});

afterAll(closeTestClient);

describe('Get Account By uid', () => {
	mockedGetAccountByUid.mockImplementation(async () => {
		return {};
	});

	afterEach(mockedGetAccountByUid.mockClear);

	it('When uid is missing returns INVALID_ARGUMENT error', () => {
		return new Promise<void>((resolve) => {
			client.getAccountByUid({}, (err, res) => {
				expect(mockedGetAccountByUid).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe('uid is empty');
				resolve();
			});
		});
	});

	it('When uid is empty string returns INVALID_ARGUMENT error', () => {
		return new Promise<void>((resolve) => {
			client.getAccountByUid({ uid: '' }, (err, res) => {
				expect(mockedGetAccountByUid).toHaveBeenCalledTimes(0);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INVALID_ARGUMENT);
				expect(err?.details).toBe('uid is empty');
				resolve();
			});
		});
	});

	it('When throws NOT_FOUND return NOT_FOUND error', () => {
		mockedGetAccountByUid.mockImplementationOnce(async () => {
			throw new ExpectedError('Account Does Not Exist', Reason.NOT_FOUND);
		});

		return new Promise<void>((resolve) => {
			client.getAccountByUid({ uid: 'test-uid' }, (err, res) => {
				expect(mockedGetAccountByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.NOT_FOUND);
				expect(err?.details).toBe('Account Does Not Exist');
				resolve();
			});
		});
	});

	it('When throws internal error should return INTERNAL error', () => {
		mockedGetAccountByUid.mockImplementationOnce(async () => {
			throw new ExpectedError('Internal Error');
		});

		return new Promise<void>((resolve) => {
			client.getAccountByUid({ uid: 'test-uid' }, (err, res) => {
				expect(mockedGetAccountByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeDefined();
				expect(res).toBeUndefined();
				expect(err?.code).toBe(status.INTERNAL);
				expect(err?.details).toBe('Internal Error');
				resolve();
			});
		});
	});

	it('When uid is valid returns Account', () => {
		const account: Account = {
			accountId: 'test-account-id',
			uid: 'test-uid',
			balance: 0,
			createTime: { seconds: new Date().getSeconds(), nanos: 0 },
			updateTime: { seconds: new Date().getSeconds(), nanos: 0 },
		};

		mockedGetAccountByUid.mockImplementationOnce(async () => {
			return account;
		});

		return new Promise<void>((resolve) => {
			client.getAccountByUid({ uid: 'test-uid' }, (err, res) => {
				expect(mockedGetAccountByUid).toHaveBeenCalledTimes(1);
				expect(err).toBeFalsy();
				expect(res).toBeDefined();
				expect(res).toStrictEqual({
					accountId: 'test-account-id',
					uid: 'test-uid',
					balance: 0,
					createTime: expect.objectContaining({
						seconds: expect.any(Number),
						nanos: expect.any(Number),
					}),
					updateTime: expect.objectContaining({
						seconds: expect.any(Number),
						nanos: expect.any(Number),
					}),
				});
				resolve();
			});
		});
	});
});
