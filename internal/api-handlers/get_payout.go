package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) GetPayout(ctx context.Context, req *connect.Request[pb.GetPayoutRequest]) (*connect.Response[pb.GetPayoutResponse], error) {
	log := service.logger.WithField("method", "GetPayout")
	log.WithField("request", req.Msg).Debug("Received GetPayout request")

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
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Extracting payment id from request message")
	paymentId := strings.Split(req.Msg.Name, "/")[4]
	log.Debugf("Payment id: %s", paymentId)

	log.Info("Fetching payout")
	payout, err := service.payoutRepository.GetPayout(ctx, log, userId, paymentId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch payout")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout", err))
	}

	if payout == nil {
		log.Error("Payout not found")
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout"))
	}

	log.Info("Creating response message")
	res := connect.NewResponse(&pb.GetPayoutResponse{
		Payout: payout,
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned GetPayout response")
	log.Info("Returning GetPayout response")
	return res, nil
}
