package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayoutAccount(ctx context.Context, req *connect.Request[pb.GetPayoutAccountRequest]) (*connect.Response[pb.GetPayoutAccountResponse], error) {
	log := service.logger.WithField("method", "GetPayoutAccount")
	log.WithField("request", req.Msg).Debug("Received GetPayoutAccount request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Name, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Fetching payout account")
	payoutAccount, err := service.payoutRepository.GetPayoutAccount(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch payout account")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout account", err))
	}

	if payoutAccount == nil {
		log.Error("Payout account not found")
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout account"))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetPayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned GetPayoutAccount response")
	log.Info("Returning GetPayoutAccount response")
	return response, nil
}
