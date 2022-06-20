# Ride Wallet API

**This API follows the [Google API Design Guidelines](https://cloud.google.com/apis/design)**

This API is used to interact with a user's wallet and transactions. This API Provides necessary methods to access user's `Wallet` and add `Transaction`(s).

Since `Wallet` is a [singleton resource](https://cloud.google.com/apis/design/design_patterns#singleton_resources) there is no `Create` or `Delete` method. Instead the Wallet is created implicitly when the user is created and deleted implicitly when the user is deleted.

Updates to the [source repository](https://github.com/ride-app/wallet-service) are automatically synced on a periodic basis, and each BSR commit is tagged with corresponding Git commits.
