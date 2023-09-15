package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
)

func (service *WalletServiceServer) CreateTransactions(ctx context.Context, req *connect.Request[pb.CreateTransactionsRequest]) (*connect.Response[pb.CreateTransactionsResponse], error) {
	log := service.logger.WithField("method", "CreateTransactions")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	batchId := nanoid.New()

	var transactions walletrepository.Transactions = make(map[string]*pb.Transaction)

	for _, entry := range req.Msg.Transactions {
		uid := strings.Split(entry.Parent, "/")[1]

		wallet, err := service.walletRepository.GetWallet(ctx, log, uid)

		if err != nil || wallet == nil {
			return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("parent Wallet not found"))
		}

		entry.Transaction.Name = fmt.Sprintf("%v/transactions/%v", entry.Parent, batchId)

		transactions[uid] = entry.Transaction
	}

	err := service.walletRepository.CreateTransactions(ctx, log, &transactions, nanoid.New())

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	var transactionsInResponse []*pb.Transaction = make([]*pb.Transaction, 0)

	for _, transaction := range transactions {
		transactionsInResponse = append(transactionsInResponse, transaction)
	}

	response := connect.NewResponse(&pb.CreateTransactionsResponse{
		BatchId:      batchId,
		Transactions: transactionsInResponse,
	})

	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
