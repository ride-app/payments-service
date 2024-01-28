package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) GetRecharge(ctx context.Context, req *connect.Request[pb.GetRechargeRequest]) (*connect.Response[pb.GetRechargeResponse], error) {
	log := service.logger.WithField("method", "GetRecharge")
	log.WithField("request", req.Msg).Debug("Received GetRecharge request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Extracting recharge id from request message")
	rechargeId := strings.Split(req.Msg.Name, "/")[4]
	log.Debugf("Recharge id: %s", rechargeId)

	log.Info("Fetching recharge")
	recharge, err := service.rechargeRepository.GetRecharge(ctx, log, userId, rechargeId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch recharge")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("recharge", err))
	}

	if recharge == nil {
		log.Error("Recharge not found")
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("recharge"))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetRechargeResponse{
		Recharge: recharge,
	})

	log.Info("Validating response message")
	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned GetRecharge response")
	log.Info("Returning GetRecharge response")
	return response, nil
}
