package service

import (
	"context"
	"errors"
	"math"
	"strings"

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (service *WalletServiceServer) CreateRecharge(ctx context.Context, req *connect.Request[pb.CreateRechargeRequest]) (*connect.Response[pb.CreateRechargeResponse], error) {
	log := service.logger.WithField("method", "CreateRecharge")

	if err := req.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	uid := strings.Split(req.Msg.Parent, "/")[1]

	if uid != req.Header().Get("user_id") {
		return nil, connect.NewError(connect.CodePermissionDenied, errors.New("permission denied"))
	}

	wallet, err := service.walletRepository.GetWallet(ctx, log, uid)

	if err != nil || wallet == nil {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("parent Wallet not found"))
	}

	if wallet.Balance < 0 && req.Msg.Recharge.Amount < int32(math.Abs(float64(wallet.Balance))) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("amount must be greater than balance due"))
	}

	rechargeId := nanoid.New()

	req.Msg.Recharge.Name = req.Msg.Parent + "/recharges/" + rechargeId

	rzp_response, err := service.razorpay.Order.Create(map[string]interface{}{
		"amount":   req.Msg.Recharge.Amount,
		"currency": "INR",
		"reciept":  "recharge/" + rechargeId,
	}, nil)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, errors.New("something went wrong"))
	}

	transactions := &walletrepository.Transactions{
		uid: &pb.Transaction{
			Type:   pb.Transaction_TYPE_CREDIT,
			Amount: req.Msg.Recharge.Amount,
		},
	}

	err = service.walletRepository.CreateTransactions(ctx, log, transactions, nanoid.New())

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, errors.New("could not create recharge"))
	}

	createTime, err := service.rechargeRepository.CreateRecharge(ctx, log, req.Msg.Recharge, &rzp_response)

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, errors.New("could not create recharge"))
	}

	req.Msg.Recharge.CreateTime = timestamppb.New(*createTime)
	req.Msg.Recharge.Status = pb.Recharge_STATUS_PENDING

	response := connect.NewResponse(&pb.CreateRechargeResponse{
		Recharge: req.Msg.Recharge,
		CheckoutInfo: map[string]string{
			"payment_gateway": "razorpay",
			"rzp_order_id":    rzp_response["id"].(string),
		},
	})

	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return response, nil
}
