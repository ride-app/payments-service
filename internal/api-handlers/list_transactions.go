package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) ListTransactions(ctx context.Context, req *connect.Request[pb.ListTransactionsRequest]) (*connect.Response[pb.ListTransactionsResponse], error) {
	log := service.logger.WithField("method", "ListTransactions")
	log.WithField("request", req.Msg).Debug("Received ListTransactions request:")

	log.Info("Validating request message")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid argument")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Parent, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching transactions for user")
	transactions, err := service.walletRepository.GetTransactions(ctx, log, userId, nil)
	if err != nil {
		log.WithError(err).Error("Failed to fetch transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("transactions", err))
	}

	log.Info("Creating response message")
	res := connect.NewResponse(&pb.ListTransactionsResponse{
		Transactions:  transactions,
		NextPageToken: "",
	})

	log.Info("Validating response message")
	if err := res.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned ListTransactions response")
	log.Info("Returning ListTransactions response")
	return res, nil
}
