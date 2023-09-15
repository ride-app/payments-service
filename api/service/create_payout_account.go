package service

import (
	"context"
	"errors"
	"strings"

	"connectrpc.com/connect"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
)

func (service *WalletServiceServer) CreatePayoutAccount(ctx context.Context, req *connect.Request[pb.CreatePayoutAccountRequest]) (*connect.Response[pb.CreatePayoutAccountResponse], error) {
	log := service.logger.WithField("method", "CreatePayoutAccount")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.PayoutAccount.Name, "/")[1]

	wallet, err := service.walletRepository.GetWallet(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if wallet == nil {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("parent Wallet not found"))
	}

	user, err := service.authRepository.GetUser(ctx, log, uid)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if user == nil {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("parent User not found"))
	}

	payoutAccount, err := service.payoutRepository.CreatePayoutAccount(ctx, log, user.Name, req.Msg.PayoutAccount)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	response := connect.NewResponse(&pb.CreatePayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
