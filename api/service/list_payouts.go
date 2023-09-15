package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) ListPayouts(ctx context.Context, req *connect.Request[pb.ListPayoutsRequest]) (*connect.Response[pb.ListPayoutsResponse], error) {
	log := service.logger.WithField("method", "ListPayouts")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Parent, "/")[1]

	payouts, err := service.payoutRepository.GetPayouts(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	res := connect.NewResponse(&pb.ListPayoutsResponse{
		Payouts:       payouts,
		NextPageToken: "",
	})

	if err := res.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return res, nil
}
