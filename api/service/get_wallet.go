package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetWallet(ctx context.Context, req *connect.Request[pb.GetWalletRequest]) (*connect.Response[pb.GetWalletResponse], error) {
	log := service.logger.WithField("method", "GetWallet")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Name, "/")[1]

	wallet, err := service.walletRepository.GetWallet(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	response := connect.NewResponse(&pb.GetWalletResponse{
		Wallet: wallet,
	})

	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
