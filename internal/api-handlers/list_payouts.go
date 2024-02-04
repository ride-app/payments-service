package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) ListPayouts(ctx context.Context, req *connect.Request[pb.ListPayoutsRequest]) (*connect.Response[pb.ListPayoutsResponse], error) {
	log := service.logger.WithField("method", "ListPayouts")
	log.WithField("request", req.Msg).Debug("Received ListPayouts request")

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
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned ListPayouts response")
	log.Info("Returning ListPayouts response")
	return res, nil
}
