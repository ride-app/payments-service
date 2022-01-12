import AccountRepository from '../services/account-repository';
import { AccountRepositoryHandlers } from '../proto/accountsService/AccountRepository';

const accountRepositoryHandlers: AccountRepositoryHandlers = {
	createAccount: (call, callback) => {
		return callback(null, AccountRepository.createAccount(call.request));
	},
	getAccount: (call, callback) => {
		callback(null, {
			uid: '123',
			balance: 100,
		});
	},
	getAccountByUid: (call, callback) => {
		callback(null, {
			uid: '456',
			balance: 100,
		});
	},
};

export default accountRepositoryHandlers;
