package service

import (
	"context"
	"errors"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) GetPayoutAccount(ctx context.Context, req *connect.Request[pb.GetPayoutAccountRequest]) (*connect.Response[pb.GetPayoutAccountResponse], error) {
	log := service.logger.WithField("method", "GetPayoutAccount")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Name, "/")[1]

	payoutAccount, err := service.payoutRepository.GetPayoutAccount(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if payoutAccount == nil {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("payout Account not found"))
	}

	response := connect.NewResponse(&pb.GetPayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
