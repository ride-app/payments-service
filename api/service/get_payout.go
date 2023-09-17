package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayout(ctx context.Context, req *pb.GetPayoutRequest) (*pb.GetPayoutResponse, error) {
	log := service.logger.WithField("method", "GetPayout")

	log.Info("Validating request")
	if err := req.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id and payment id from request message")
	userId := strings.Split(req.Name, "/")[1]
	log.Debugf("User id: %s", userId)
	paymentId := strings.Split(req.Name, "/")[4]
	log.Debugf("Payment id: %s", paymentId)

	log.Info("Fetching payout")
	payout, err := service.fetchPayout(userId, paymentId)
	if err != nil {
		log.WithError(err).Error("Failed to fetch payout")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout", err))
	}

	if payout == nil {
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout"))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetPayoutResponse{
		Payout: payout,
	})

	log.Info("Validating response message")
	if err := response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	log.WithField("response", response.Msg).Debug("Returned GetPayout response")
	return response, nil
}
