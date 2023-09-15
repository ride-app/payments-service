package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetTransaction(ctx context.Context, req *connect.Request[pb.GetTransactionRequest]) (*connect.Response[pb.GetTransactionResponse], error) {
	log := service.logger.WithField("method", "GetTransaction")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Name, "/")[1]

	transactionId := strings.Split(req.Msg.Name, "/")[4]

	transaction, err := service.walletRepository.GetTransaction(ctx, log, uid, transactionId)

	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	response := connect.NewResponse(&pb.GetTransactionResponse{
		Transaction: transaction,
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
