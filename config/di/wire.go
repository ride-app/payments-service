//go:build wireinject

package di

import (
	"github.com/google/wire"
	"github.com/ride-app/wallet-service/api/service"
	"github.com/ride-app/wallet-service/config"
	authrepository "github.com/ride-app/wallet-service/repositories/auth"
	payoutrepository "github.com/ride-app/wallet-service/repositories/payout"
	rechargerepository "github.com/ride-app/wallet-service/repositories/recharge"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
	thirdparty "github.com/ride-app/wallet-service/third-party"
	"github.com/ride-app/wallet-service/utils/logger"
)

func InitializeService(logger logger.Logger, config *config.Config) (*service.WalletServiceServer, error) {
	panic(
		wire.Build(
			thirdparty.NewFirebaseApp,
			thirdparty.NewPubSubClient,
			thirdparty.NewRazorpayClient,
			authrepository.NewFirebaseAuthRepository,
			wire.Bind(
				new(authrepository.AuthRepository),
				new(*authrepository.FirebaseImpl),
			),
			walletrepository.NewFirestoreWalletRepository,
			wire.Bind(
				new(walletrepository.WalletRepository),
				new(*walletrepository.FirestoreImpl),
			),
			rechargerepository.NewFirestoreRechargeRepository,
			wire.Bind(
				new(rechargerepository.RechargeRepository),
				new(*rechargerepository.FirestoreImpl),
			),
			payoutrepository.NewFirestorePayoutRepository,
			wire.Bind(
				new(payoutrepository.PayoutRepository),
				new(*payoutrepository.FirestoreImpl),
			),
			service.New,
		),
	)
}
