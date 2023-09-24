package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
)

func (service *WalletServiceServer) CreateTransactions(ctx context.Context, req *connect.Request[pb.CreateTransactionsRequest]) (*connect.Response[pb.CreateTransactionsResponse], error) {
	log := service.logger.WithField("method", "CreateTransactions")
	log.WithField("request", req.Msg).Debug("Received CreateTransactions request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Generating batch id")

	var entries walletrepository.Entries = make(walletrepository.Entries, 0, len(req.Msg.Entries))

	log.Info("Generating transaction entries")
	for _, entry := range req.Msg.Entries {
		userId := strings.Split(entry.Parent, "/")[1]
		log.Infof("Creating transaction entry for user id: %s", userId)

		log.Debug("Fetching wallet for user")
		wallet, err := service.walletRepository.GetWallet(ctx, log, userId)

		if err != nil {
			log.WithError(err).Error("Failed to fetch wallet")
			return nil, connect.NewError(connect.CodeInternal, failedToFetchError("wallet", err))
		}

		if wallet == nil {
			log.Error("Wallet not found")
			return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("wallet"))
		}

		log.Info("Adding transaction entry to batch")
		entry := walletrepository.Entry{
			UserId:      userId,
			Transaction: entry.Transaction,
		}

		entries = append(entries, &entry)
	}

	log.Info("Creating transactions")
	batchId, err := service.walletRepository.CreateTransactions(ctx, log, &entries)

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	transactionsInResponse := make([]*pb.Transaction, 0)

	log.Info("Mapping transactions to response")
	for _, entry := range entries {
		transactionsInResponse = append(transactionsInResponse, entry.Transaction)
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.CreateTransactionsResponse{
		BatchId:      *batchId,
		Transactions: transactionsInResponse,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned CreateTransactions response")
	log.Info("Returning CreateTransactions response")
	return response, nil
}
