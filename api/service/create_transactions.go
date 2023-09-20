package service

import (
	"context"
	"fmt"
	"strings"

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
)

func (service *WalletServiceServer) CreateTransactions(ctx context.Context, req *connect.Request[pb.CreateTransactionsRequest]) (*connect.Response[pb.CreateTransactionsResponse], error) {
	log := service.logger.WithField("method", "CreateTransactions")
	log.WithField("request", req.Msg).Debug("Received CreateTransactions request")
}

	log.Info("Starting request validation")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request encountered")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}
	log.Info("Request validation completed successfully")

	log.Info("Starting batch id generation")
	batchId := nanoid.New()
	log.Debugf("Generated batch id: %s", batchId)

	var transactions walletrepository.Transactions = make(map[string]*pb.Transaction)

	log.Info("Starting transactions generation")
	for _, entry := range req.Msg.Transactions {
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

		log.Info("Updating transaction name")
		entry.Transaction.Name = fmt.Sprintf("%s/transactions/%s", entry.Parent, batchId)

		log.Info("Adding transaction to batch")
		transactions[userId] = entry.Transaction
	}
	log.Info("Transactions generation completed successfully")

	log.Info("Starting transactions creation")
	err := service.walletRepository.CreateTransactions(ctx, log, &transactions, nanoid.New())

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}
	log.Info("Transactions creation completed successfully")

	var transactionsInResponse []*pb.Transaction = make([]*pb.Transaction, 0)

	for _, transaction := range transactions {
		transactionsInResponse = append(transactionsInResponse, transaction)
	}

	log.Info("Starting response message creation")
	response := connect.NewResponse(&pb.CreateTransactionsResponse{
		BatchId:      batchId,
		Transactions: transactionsInResponse,
	})
	log.Info("Response message creation completed successfully")

	log.Info("Starting response message validation")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}
	log.Info("Response message validation completed successfully")

	defer log.WithField("response", response.Msg).Debug("Returned CreateTransactions response")
	log.Info("Returning CreateTransactions response")
	return response, nil
}
