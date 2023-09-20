package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) CreatePayoutAccount(ctx context.Context, req *connect.Request[pb.CreatePayoutAccountRequest]) (*connect.Response[pb.CreatePayoutAccountResponse], error) {
	log := service.logger.WithField("method", "CreatePayoutAccount")
	log.WithField("request", req.Msg).Info("Received CreatePayoutAccount request")

	log.Info("Starting request validation")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Request validation failed")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}
	log.Info("Request validation successful")

	log.Info("Starting extraction of user id from request message")
	userId := strings.Split(req.Msg.PayoutAccount.Name, "/")[1]
	log.Infof("User id extracted: %s", userId)

	log.Info("Starting fetch of wallet for user")
	wallet, err := service.walletRepository.GetWallet(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Wallet fetch failed")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("wallet", err))
	}

	if wallet == nil {
		log.Error("Wallet not found for user")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("wallet"))
	}
	log.Info("Wallet fetch successful")

	log.Info("Starting fetch of user")
	user, err := service.authRepository.GetUser(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("User fetch failed")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("user", err))
	}

	if user == nil {
		log.Error("User not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("user"))
	}
	log.Info("User fetch successful")

	log.Info("Starting creation of payout account")
	payoutAccount, err := service.payoutRepository.CreatePayoutAccount(ctx, log, user.Name, req.Msg.PayoutAccount)

	if err != nil {
		log.WithError(err).Error("Payout account creation failed")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("payout account", err))
	}
	log.Info("Payout account creation successful")

	log.Info("Starting creation of response message")
	response := connect.NewResponse(&pb.CreatePayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Starting validation of response message")
	if err = response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Response validation failed")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}
	log.Info("Response validation successful")

	defer log.WithField("response", response.Msg).Info("Returning CreatePayoutAccount response")
	log.Info("CreatePayoutAccount process completed successfully")
	return response, nil
}
