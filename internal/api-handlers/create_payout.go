package apihandlers

import (
	"context"
	"errors"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
	walletrepository "github.com/ride-app/payments-service/internal/repositories/wallet"
)

func (service *PaymentsServiceServer) CreatePayout(ctx context.Context, req *connect.Request[pb.CreatePayoutRequest]) (*connect.Response[pb.CreatePayoutResponse], error) {
	log := service.logger.WithField("method", "CreatePayout")
	log.WithField("request", req.Msg).Debug("Received CreatePayout request")

	validator, err := protovalidate.New()
	if err != nil {
		log.WithError(err).Info("Failed to initialize validator")

		return nil, connect.NewError(connect.CodeInternal, err)
	}

	log.Info("Validating request")
	if err := validator.Validate(req.Msg); err != nil {
		log.WithError(err).Info("Invalid request")

		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Parent, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching wallet for user")
	wallet, err := service.walletRepository.GetWallet(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch wallet")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("wallet", err))
	}

	if wallet == nil {
		log.Error("Wallet not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("wallet"))
	}

	log.Info("Checking if payout amount is greater than wallet balance")
	if req.Msg.Payout.Amount > wallet.Balance {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("amount must be smaller than wallet balance"))
	}

	log.Info("Fetching payout account")
	payoutAccount, err := service.payoutRepository.GetPayoutAccount(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch payout account")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout account", err))
	}

	if payoutAccount == nil {
		log.Error("Payout account not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("payout account"))
	}

	log.Info("Creating payout")
	payout, err := service.payoutRepository.CreatePayout(ctx, log, payoutAccount, req.Msg.Payout)

	if err != nil {
		log.WithError(err).Error("Failed to create payout")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("payout", err))
	}

	log.Info("Forming transactions")
	entries := make(walletrepository.Entries, 1)
	entry := walletrepository.Entry{
		UserId: userId,
		Transaction: &pb.Transaction{
			Type:   pb.Transaction_TYPE_DEBIT,
			Amount: req.Msg.Payout.Amount,
		},
	}

	entries = append(entries, &entry)

	log.Info("Creating transactions")
	batchId, err := service.walletRepository.CreateTransactions(ctx, log, &entries)

	log.Debugf("Batch id: %s", *batchId)

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	res := connect.NewResponse(&pb.CreatePayoutResponse{
		Payout: payout,
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned CreatePayout response")
	log.Info("Returning CreatePayout response")
	return res, nil
}
