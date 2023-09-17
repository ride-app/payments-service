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

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Generating batch id")
	batchId := nanoid.New()
	log.Debugf("Batch id: %s", batchId)

	var transactions walletrepository.Transactions = make(map[string]*pb.Transaction)

	log.Info("Generating transactions")
	for _, entry := range req.Msg.Transactions {
		log.Info("Extracting user id from request message")
		log.Infof("Creating transaction entry for user id: %s", userId)

		log.Debug("Fetching wallet for user")
		log.Info("Fetching wallet for user")

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

	log.Info("Creating transactions")
	log.Info("Creating transactions")

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	var transactionsInResponse []*pb.Transaction = make([]*pb.Transaction, 0)

	for _, transaction := range transactions {
		transactionsInResponse = append(transactionsInResponse, transaction)
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.CreateTransactionsResponse{
		BatchId:      batchId,
		Transactions: transactionsInResponse,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned CreateTransactions response")
	log.Info("Returning CreateTransactions response")
	log.Info("Returning CreateTransactions response")
}
