package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) ListRecharges(ctx context.Context, req *connect.Request[pb.ListRechargesRequest]) (*connect.Response[pb.ListRechargesResponse], error) {
	log := service.logger.WithField("method", "ListRecharges")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	walletId := strings.Split(req.Msg.Parent, "/")[1]

	recharges, err := service.rechargeRepository.GetRecharges(ctx, log, walletId)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	response := connect.NewResponse(&pb.ListRechargesResponse{
		Recharges:     recharges,
		NextPageToken: "",
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
