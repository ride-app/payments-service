package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
)

func (service *PaymentsServiceServer) GetPayoutAccount(ctx context.Context, req *connect.Request[pb.GetPayoutAccountRequest]) (*connect.Response[pb.GetPayoutAccountResponse], error) {
	log := service.logger.WithField("method", "GetPayoutAccount")
	log.WithField("request", req.Msg).Debug("Received GetPayoutAccount request")

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
	res := connect.NewResponse(&pb.GetPayoutAccountResponse{
		PayoutAccount: payoutAccount,
	})

	log.Info("Validating response message")
	if err := validator.Validate(res.Msg); err != nil {
		log.WithError(err).Error("Invalid response")
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", res.Msg).Debug("Returned GetPayoutAccount response")
	log.Info("Returning GetPayoutAccount response")
	return res, nil
}
