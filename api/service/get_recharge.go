package service

import (
	"context"
	"errors"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetRecharge(ctx context.Context, req *connect.Request[pb.GetRechargeRequest]) (*connect.Response[pb.GetRechargeResponse], error) {
	log := service.logger.WithField("method", "GetRecharge")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Name, "/")[1]

	rechargeId := strings.Split(req.Msg.Name, "/")[4]

	recharge, err := service.rechargeRepository.GetRecharge(ctx, log, uid, rechargeId)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if recharge == nil {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("recharge not found"))
	}

	if err := recharge.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	response := connect.NewResponse(&pb.GetRechargeResponse{
		Recharge: recharge,
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
