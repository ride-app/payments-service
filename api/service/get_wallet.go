package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetWallet(ctx context.Context, req *connect.Request[pb.GetWalletRequest]) (*connect.Response[pb.GetWalletResponse], error) {
	log := service.logger.WithField("method", "GetWallet")
	log.WithField("request", req.Msg).Debug("Received GetWallet request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching wallet")
	wallet, err := service.walletRepository.GetWallet(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch wallet")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("wallet", err))
	}

	if wallet == nil {
		log.Error("Wallet not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("wallet"))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetWalletResponse{
		Wallet: wallet,
	})

	log.Info("Validating response message")
	if err := response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned GetWallet response")
	log.Info("Returning GetWallet response")
	return response, nil
}
