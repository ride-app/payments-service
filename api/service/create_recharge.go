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
	"github.com/ride-app/wallet-service/utils/logger"
)

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	walletrepository "github.com/ride-app/wallet-service/repositories/wallet"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (service *WalletServiceServer) CreateRecharge(ctx context.Context, req *connect.Request[pb.CreateRechargeRequest]) (*connect.Response[pb.CreateRechargeResponse], error) {
	log := service.logger.WithField("method", "CreateRecharge")
	log.WithField("request", req.Msg).Debug("Received CreateRecharge request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Request validation failed")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Extracting user id from request message")
	userId := strings.Split(req.Msg.Parent, "/")[1]
	log.WithField("userId", userId).Info("User id extracted from request message")
	userId := strings.Split(req.Msg.Parent, "/")[1]
	log.Debugf("User id: %s", userId)

	log.Info("Checking if user id in request message matches with user id in request header")
	if userId != req.Header().Get("user_id") {
		return nil, connect.NewError(connect.CodePermissionDenied, errors.New("permission denied"))
	}

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

	log.Info("Checking if recharge amount is greater than balance due")
	if wallet.Balance < 0 && req.Msg.Recharge.Amount < int32(math.Abs(float64(wallet.Balance))) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("amount must be greater than balance due"))
	}

	log.Info("Generating recharge id")
	rechargeId := nanoid.New()
	req.Msg.Recharge.Name = req.Msg.Parent + "/recharges/" + rechargeId

	log.Info("Creating razorpay order")
	rzp_response, err := service.razorpay.Order.Create(map[string]interface{}{
		"amount":   req.Msg.Recharge.Amount,
		"currency": "INR",
		"reciept":  "recharge/" + rechargeId,
	}, nil)

	if err != nil {
		log.WithError(err).Error("Failed to create razorpay order")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("razorpay order", err))
	}

	log.Info("Creating recharge")
	createTime, err := service.rechargeRepository.CreateRecharge(ctx, log, req.Msg.Recharge, &rzp_response)

	if err != nil {
		log.WithError(err).Error("Failed to create recharge")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("recharge", err))
	}

	log.Info("Creating transactions")
	transactions := &walletrepository.Transactions{
		userId: &pb.Transaction{
			Type:   pb.Transaction_TYPE_CREDIT,
			Amount: req.Msg.Recharge.Amount,
		},
	}

	log.Info("Creating transactions for Recharge")
	err = service.walletRepository.CreateTransactions(ctx, log, transactions, nanoid.New())

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	log.Info("Updating Recharge details")
	req.Msg.Recharge.CreateTime = timestamppb.New(*createTime)
	req.Msg.Recharge.Status = pb.Recharge_STATUS_SUCCESS

	log.Info("Creating response")
	response := connect.NewResponse(&pb.CreateRechargeResponse{
		Recharge: req.Msg.Recharge,
		CheckoutInfo: map[string]string{
			"payment_gateway": "razorpay",
			"rzp_order_id":    rzp_response["id"].(string),
		},
	})

	log.Info("Validating response")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned CreateRecharge response")
	log.Info("Returning CreateRecharge response")
	defer log.WithField("response", response.Msg).Debug("Returned CreateRecharge response")
	return response, nil
}
