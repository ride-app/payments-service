package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayout(ctx context.Context, req *connect.Request[pb.GetPayoutRequest]) (*connect.Response[pb.GetPayoutResponse], error) {
	log := service.logger.WithField("method", "GetPayout")

	log.Info("Validating request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id and payment id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	paymentId := strings.Split(req.Msg.Name, "/")[4]
	log.Info("Fetching payout")
	payout, err := service.payoutRepository.GetPayout(ctx, log, userId, paymentId)
	payout, err := service.payoutRepository.GetPayout(ctx, log, userId, paymentId)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout", err))
	}

	if payout == nil {
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout"))
	}

	response := connect.NewResponse(&pb.GetPayoutResponse{
		Payout: payout,
	})

	log.Info("Validating response message")
	if err := response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}
	defer log.WithField("response", response.Msg).Debug("Returned GetPayout response")
	log.Info("Returning GetPayout response")
	return response, nil
	return response, nil
}
