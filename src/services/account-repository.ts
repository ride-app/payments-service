import { Account } from '../proto/accountsService/Account';
import { createAccountRequest__Output } from '../proto/accountsService/createAccountRequest';
import { getAccountByUidRequest__Output } from '../proto/accountsService/getAccountByUidRequest';
import { getAccountRequest__Output } from '../proto/accountsService/getAccountRequest';

class AccountRepository {
	static createAccount(request: createAccountRequest__Output): Account {
		return {
			accountId: '123',
		};
	}

	static getAccount(request: getAccountRequest__Output): Account {
		return {
			accountId: '123',
		};
	}

	static getAccountByUid(request: getAccountByUidRequest__Output): Account {
		return {
			uid: '456',
		};
	}
}

export default AccountRepository;
