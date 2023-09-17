package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayout(ctx context.Context, req *connect.Request[pb.GetPayoutRequest]) (*connect.Response[pb.GetPayoutResponse], error) {
	log := service.logger.WithField("method", "GetPayout")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id and payout id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)
	paymentId := strings.Split(req.Msg.Name, "/")[4]
	log.Debugf("Payout id: %s", paymentId)
	paymentId := strings.Split(req.Msg.Name, "/")[4]

	log.Info("Fetching payout")

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout", err))
	}

	if payout == nil {
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout"))
	}

	response := connect.NewResponse(&pb.GetPayoutResponse{
		Payout: payout,
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	log.Info("Returning GetPayout response")
}
