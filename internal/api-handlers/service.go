package apihandlers

import (
	"github.com/dragonfish-tech/go/pkg/logger"
	"github.com/razorpay/razorpay-go"
	"github.com/ride-app/payments-service/config"
	ar "github.com/ride-app/payments-service/internal/repositories/auth"
	pr "github.com/ride-app/payments-service/internal/repositories/payout"
	rr "github.com/ride-app/payments-service/internal/repositories/recharge"
	tr "github.com/ride-app/payments-service/internal/repositories/transfer"
	wr "github.com/ride-app/payments-service/internal/repositories/wallet"
)

type PaymentsServiceServer struct {
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
) *PaymentsServiceServer {
	return &PaymentsServiceServer{
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
