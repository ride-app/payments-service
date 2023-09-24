package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetTransaction(ctx context.Context, req *connect.Request[pb.GetTransactionRequest]) (*connect.Response[pb.GetTransactionResponse], error) {
	log := service.logger.WithField("method", "GetTransaction")
	log.WithField("request", req.Msg).Debug("Received GetTransaction request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Extracting transaction id from request message")
	transactionId := strings.Split(req.Msg.Name, "/")[4]
	log.Debugf("Transaction id: %s", transactionId)

	log.Info("Fetching transaction")
	transaction, err := service.walletRepository.GetTransaction(ctx, log, userId, transactionId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch transaction")
		return nil, connect.NewError(connect.CodeNotFound, failedToFetchError("transaction", err))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetTransactionResponse{
		Transaction: transaction,
	})

	log.Info("Validating response message")
	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned GetTransaction response")
	log.Info("Returning GetTransaction response")
	return response, nil
}
