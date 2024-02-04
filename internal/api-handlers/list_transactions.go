package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) ListTransactions(ctx context.Context, req *connect.Request[pb.ListTransactionsRequest]) (*connect.Response[pb.ListTransactionsResponse], error) {
	log := service.logger.WithField("method", "ListTransactions")
	log.WithField("request", req.Msg).Debug("Received ListTransactions request:")

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
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned ListTransactions response")
	log.Info("Returning ListTransactions response")
	return res, nil
}
