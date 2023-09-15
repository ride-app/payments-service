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
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Name, "/")[1]

	paymentId := strings.Split(req.Msg.Name, "/")[4]

	payout, err := service.payoutRepository.GetPayout(ctx, log, uid, paymentId)

	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	response := connect.NewResponse(&pb.GetPayoutResponse{
		Payout: payout,
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
