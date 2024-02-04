package apihandlers

import (
	"context"
	"errors"
	"math"
	"strings"

	"connectrpc.com/connect"
	"github.com/aidarkhanov/nanoid"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
	walletrepository "github.com/ride-app/payments-service/internal/repositories/wallet"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (service *PaymentsServiceServer) CreateRecharge(ctx context.Context, req *connect.Request[pb.CreateRechargeRequest]) (*connect.Response[pb.CreateRechargeResponse], error) {
	log := service.logger.WithField("method", "CreateRecharge")
	log.WithField("request", req.Msg).Debug("Received CreateRecharge request")

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

	log.Info("Creating transaction entries")
	entries := make(walletrepository.Entries, 1)
	entry := walletrepository.Entry{
		UserId: userId,
		Transaction: &pb.Transaction{
			Type:   pb.Transaction_TYPE_CREDIT,
			Amount: req.Msg.Recharge.Amount,
		},
	}

	entries = append(entries, &entry)

	log.Info("Creating transactions for Recharge")
	batchId, err := service.walletRepository.CreateTransactions(ctx, log, &entries)

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	log.Debugf("Batch id: %s", batchId)

	log.Info("Updating Recharge details")
	req.Msg.Recharge.CreateTime = timestamppb.New(*createTime)
	req.Msg.Recharge.Status = pb.Recharge_STATUS_SUCCESS

	log.Info("Creating response")
	res := connect.NewResponse(&pb.CreateRechargeResponse{
		Recharge: req.Msg.Recharge,
		CheckoutInfo: map[string]string{
			"payment_gateway": "razorpay",
			"rzp_order_id":    rzp_response["id"].(string),
		},
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned CreateRecharge response")
	log.Info("Returning CreateRecharge response")
	return res, nil
}
