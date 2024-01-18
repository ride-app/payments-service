package service

import (
	"github.com/razorpay/razorpay-go"
	"github.com/ride-app/go/pkg/logger"
	"github.com/ride-app/wallet-service/config"
	ar "github.com/ride-app/wallet-service/repositories/auth"
	pr "github.com/ride-app/wallet-service/repositories/payout"
	rr "github.com/ride-app/wallet-service/repositories/recharge"
	tr "github.com/ride-app/wallet-service/repositories/transfer"
	wr "github.com/ride-app/wallet-service/repositories/wallet"
)

type WalletServiceServer struct {
	logger             logger.Logger
	config             *config.Config
	authRepository     ar.AuthRepository
	walletRepository   wr.WalletRepository
	transferRepository tr.TransferRepository
	rechargeRepository rr.RechargeRepository
	payoutRepository   pr.PayoutRepository
	razorpay           *razorpay.Client
}

func New(
	logger logger.Logger,
	config *config.Config,
	authRepository ar.AuthRepository,
	walletRepository wr.WalletRepository,
	transferRepository tr.TransferRepository,
	rechargeRepository rr.RechargeRepository,
	payoutRepository pr.PayoutRepository,
	razorpay *razorpay.Client,
) *WalletServiceServer {
	return &WalletServiceServer{
		logger:             logger,
		config:             config,
		authRepository:     authRepository,
		walletRepository:   walletRepository,
		transferRepository: transferRepository,
		payoutRepository:   payoutRepository,
		rechargeRepository: rechargeRepository,
		razorpay:           razorpay,
	}
}
