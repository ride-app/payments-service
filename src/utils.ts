import { Money } from "./gen/google/type/money";

const walletRegex = /^users\/[A-Za-z0-9_-]+\/wallet$/;
const transactionRegex =
	/^users\/[A-Za-z0-9_-]+\/wallet\/transactions\/[A-Za-z0-9_-]+$/;
const rechargeRegex =
	/^users\/[A-Za-z0-9_-]+\/wallet\/recharges\/[A-Za-z0-9_-]+$/;
const payoutRegex = /^users\/[A-Za-z0-9_-]+\/wallet\/payouts\/[A-Za-z0-9_-]+$/;

function moneyToNumber(money: Money) {
	return Number(money.units) * 100 + money.nanos / 10000000;
}

function numberToMoney(amount: number) {
	return Money.create({
		units: BigInt(Math.floor(amount / 100)),
		nanos: (amount % 100) * 10000000,
	});
}

export {
	walletRegex,
	transactionRegex,
	rechargeRegex,
	payoutRegex,
	moneyToNumber as moneyToInt,
	numberToMoney,
};
