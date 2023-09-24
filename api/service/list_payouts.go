package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) ListPayouts(ctx context.Context, req *connect.Request[pb.ListPayoutsRequest]) (*connect.Response[pb.ListPayoutsResponse], error) {
	log := service.logger.WithField("method", "ListPayouts")
	log.WithField("request", req.Msg).Debug("Received ListPayouts request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Parent, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching payouts")
	payouts, err := service.payoutRepository.GetPayouts(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch payouts")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payouts", err))
	}

	log.Info("Creating response message")
	res := connect.NewResponse(&pb.ListPayoutsResponse{
		Payouts:       payouts,
		NextPageToken: "",
	})

	log.Info("Validating response message")
	if err := res.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	defer log.WithField("response", res.Msg).Debug("Returned ListPayouts response")
	log.Info("Returning ListPayouts response")
	return res, nil
}
