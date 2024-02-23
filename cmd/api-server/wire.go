//go:build wireinject

package main

import (
	"github.com/dragonfish/go/v2/pkg/logger"
	"github.com/google/wire"
	"github.com/ride-app/payments-service/config"
	apihandlers "github.com/ride-app/payments-service/internal/api-handlers"
	authrepository "github.com/ride-app/payments-service/internal/repositories/auth"
	payoutrepository "github.com/ride-app/payments-service/internal/repositories/payout"
	rechargerepository "github.com/ride-app/payments-service/internal/repositories/recharge"
	transferrepository "github.com/ride-app/payments-service/internal/repositories/transfer"
	walletrepository "github.com/ride-app/payments-service/internal/repositories/wallet"
	thirdparty "github.com/ride-app/payments-service/third-party"
)

func InitializeService(logger logger.Logger, config *config.Config) (*apihandlers.PaymentsServiceServer, error) {
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
			transferrepository.NewFirestoreTransferRepository,
			wire.Bind(
				new(transferrepository.TransferRepository),
				new(*transferrepository.FirestoreImpl),
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
			apihandlers.New,
		),
	)
}
