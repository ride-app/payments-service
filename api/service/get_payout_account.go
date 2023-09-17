package service

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayoutAccount(ctx context.Context, req *connect.Request[pb.GetPayoutAccountRequest]) (*connect.Response[pb.GetPayoutAccountResponse], error) {
	log := service.logger.WithField("method", "GetPayoutAccount")

	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
	}

	userId := strings.Split(req.Msg.Name, "/")[1]

	payoutAccount, err := service.payoutRepository.GetPayoutAccount(ctx, log, userId)

	if err != nil {
		log.WithError(err).Error("Failed to fetch payout account")
	}

	if payoutAccount == nil {
		log.Error("Payout account not found")
	}

	response := connect.NewResponse(&pb.GetPayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	if err = response.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid response")
	}

	log.WithField("response", response.Msg).Debug("Returning GetPayoutAccount response")
}
