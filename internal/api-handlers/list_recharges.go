package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) ListRecharges(ctx context.Context, req *connect.Request[pb.ListRechargesRequest]) (*connect.Response[pb.ListRechargesResponse], error) {
	log := service.logger.WithField("method", "ListRecharges")
	log.WithField("request", req.Msg).Debug("Received ListRecharges request")

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

	log.Info("Fetching recharges")
	recharges, err := service.rechargeRepository.GetRecharges(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch recharges")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("recharges", err))
	}

	log.Info("Creating response message")
	res := connect.NewResponse(&pb.ListRechargesResponse{
		Recharges:     recharges,
		NextPageToken: "",
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned ListRecharges response")
	log.Info("Returning ListRecharges response")
	return res, nil
}
