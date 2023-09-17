package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayoutAccount(ctx context.Context, req *connect.Request[pb.GetPayoutAccountRequest]) (*connect.Response[pb.GetPayoutAccountResponse], error) {
	log := service.logger.WithField("method", "GetPayoutAccount")

	log.Info("Validating request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")

	log.Info("Fetching payout account")

	if err != nil {
		log.WithError(err).Error("Failed to fetch payout account")
		return nil, connect.NewError(connect.CodeInternal, failedToFetchError("payout account", err))
	}

	if payoutAccount == nil {
		return nil, connect.NewError(connect.CodeNotFound, notFoundError("payout account"))
	}

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.GetPayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	log.WithField("response", response.Msg).Debug("Returned GetPayoutAccount response")
}
