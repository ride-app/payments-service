const walletRegex = /^users\/[A-Za-z0-9_-]+\/wallet$/;
const transactionRegex =
	/^users\/[A-Za-z0-9_-]+\/wallet\/transactions\/[A-Za-z0-9_-]+$/;
const payoutRegex = /^users\/[A-Za-z0-9_-]+\/wallet\/payouts\/[A-Za-z0-9_-]+$/;

export { walletRegex, transactionRegex, payoutRegex };
