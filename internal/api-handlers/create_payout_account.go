package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) CreatePayoutAccount(ctx context.Context, req *connect.Request[pb.CreatePayoutAccountRequest]) (*connect.Response[pb.CreatePayoutAccountResponse], error) {
	log := service.logger.WithField("method", "CreatePayoutAccount")
	log.WithField("request", req.Msg).Debug("Received CreatePayoutAccount request")

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
	res := connect.NewResponse(&pb.CreatePayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned CreatePayoutAccount response")
	log.Info("Returning CreatePayoutAccount response")
	return res, nil
}
