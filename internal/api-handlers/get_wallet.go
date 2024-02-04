package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) GetWallet(ctx context.Context, req *connect.Request[pb.GetWalletRequest]) (*connect.Response[pb.GetWalletResponse], error) {
	log := service.logger.WithField("method", "GetWallet")
	log.WithField("request", req.Msg).Debug("Received GetWallet request")

	validator, err := protovalidate.New()
	if err != nil {
		log.WithError(err).Info("Failed to initialize validator")

		return nil, connect.NewError(connect.CodeInternal, err)
	}

	log.Info("Validating request")
	if err := validator.Validate(req.Msg); err != nil {
		log.WithError(err).Info("Invalid request")

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
	res := connect.NewResponse(&pb.GetWalletResponse{
		Wallet: wallet,
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned GetWallet response")
	log.Info("Returning GetWallet response")
	return res, nil
}
