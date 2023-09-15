package service

import (
	"context"
	"errors"
	"math"
	"strings"

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
)

func (service *WalletServiceServer) CreatePayout(ctx context.Context, req *connect.Request[pb.CreatePayoutRequest]) (*connect.Response[pb.CreatePayoutResponse], error) {
	log := service.logger.WithField("method", "CreatePayout")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Parent, "/")[1]

	wallet, err := service.walletRepository.GetWallet(ctx, log, uid)

	if err != nil || wallet == nil {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("parent Wallet not found"))
	}

	if wallet.Balance <= 0 || req.Msg.Payout.Amount > int32(math.Abs(float64(wallet.Balance))) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("amount must be smaller than wallet balance"))
	}

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	payoutAccount, err := service.payoutRepository.GetPayoutAccount(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if payoutAccount == nil {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("payout account not found"))
	}

	payout, err := service.payoutRepository.CreatePayout(ctx, log, payoutAccount, req.Msg.Payout)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	transactions := &walletrepository.Transactions{
		uid: &pb.Transaction{
			Type:   pb.Transaction_TYPE_DEBIT,
			Amount: req.Msg.Payout.Amount,
		},
	}

	err = service.walletRepository.CreateTransactions(ctx, log, transactions, nanoid.New())

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	response := connect.NewResponse(&pb.CreatePayoutResponse{
		Payout: payout,
	})

	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
