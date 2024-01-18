package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) CreatePayoutAccount(ctx context.Context, req *connect.Request[pb.CreatePayoutAccountRequest]) (*connect.Response[pb.CreatePayoutAccountResponse], error) {
	log := service.logger.WithField("method", "CreatePayoutAccount")
	log.WithField("request", req.Msg).Debug("Received CreatePayoutAccount request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.PayoutAccount.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching wallet for user")
	wallet, err := service.walletRepository.GetWallet(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch wallet")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("wallet", err))
	}

	if wallet == nil {
		log.Error("Wallet not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("wallet"))
	}

	log.Info("Fetching user")
	user, err := service.authRepository.GetUser(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch user")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("user", err))
	}

	if user == nil {
		log.Error("User not found")
		return nil, connect.NewError(connect.CodeFailedPrecondition, notFoundError("user"))
	}

	log.Info("Creating payout account")
	payoutAccount, err := service.payoutRepository.CreatePayoutAccount(ctx, log, user.Name, req.Msg.PayoutAccount)

	if err != nil {
		log.WithError(err).Error("Failed to create payout account")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("payout account", err))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.CreatePayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned CreatePayoutAccount response")
	log.Info("Returning CreatePayoutAccount response")
	return response, nil
}
