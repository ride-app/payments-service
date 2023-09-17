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

	userId := strings.Split(req.Msg.Name, "/")[1]

	paymentId := strings.Split(req.Msg.Name, "/")[4]

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

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	return response, nil
}
