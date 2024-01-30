package apihandlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/deb-tech-n-sol/go/pkg/logger"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
	walletrepository "github.com/ride-app/payments-service/internal/repositories/wallet"
)

func (service *PaymentsServiceServer) CreateTransfers(ctx context.Context, req *connect.Request[pb.CreateTransfersRequest]) (*connect.Response[pb.CreateTransfersResponse], error) {
	log := service.logger.WithField("method", "CreateTransfers")
	log.WithField("request", req.Msg).Debug("Received CreateTransfers request")

	log.Info("Validating request")
	if err := req.Msg.Validate(); err != nil {
		log.WithError(err).Error("Invalid request")
		return nil, connect.NewError(connect.CodeInvalidArgument, invalidArgumentError(err))
	}

	log.Info("Creating transfers")
	transfers, err := service.transferRepository.CreateTransfers(ctx, log, &req.Msg.Transfers)

	if err != nil {
		log.WithError(err).Error("Failed to create transfers")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transfers", err))
	}

	entries := make(walletrepository.Entries, 0, len(req.Msg.Transfers)*2)

	log.Info("Generating transactions")
	for _, transfer := range req.Msg.Transfers {
		entry := generateTransactionEntries(log, transfer)

		entries = append(entries, *entry...)
	}

	log.Info("Creating transactions")
	batchId, err := service.walletRepository.CreateTransactions(ctx, log, &entries)

	if err != nil {
		log.WithError(err).Error("Failed to create transactions")
		return nil, connect.NewError(connect.CodeInternal, failedToCreateError("transactions", err))
	}

	log.Debugf("Batch id: %s", batchId)

	log.Info("Creating response message")
	response := connect.NewResponse(&pb.CreateTransfersResponse{
		BatchId:   *batchId,
		Transfers: *transfers,
	})

	log.Info("Validating response message")
	if err = response.Msg.Validate(); err != nil {
		return nil, connect.NewError(connect.CodeInternal, invalidResponseError(err))
	}

	defer log.WithField("response", response.Msg).Debug("Returned CreateTransfers response")
	log.Info("Returning CreateTransfers response")
	return response, nil
}

func generateTransactionEntries(log logger.Logger, transfer *pb.Transfer) *walletrepository.Entries {
	log.Info("Generating transaction entries for transfer")
	entries := make(walletrepository.Entries, 2)

	log.Info("Creating transaction entry for source wallet")
	sourceTransactionEntry := walletrepository.Entry{
		UserId: strings.Split(transfer.Source, "/")[1],
		Transaction: &pb.Transaction{
			Amount: transfer.Amount,
			Type:   pb.Transaction_TYPE_DEBIT,
			Details: &pb.Transaction_Details{
				DisplayName: transfer.Details.DisplayName,
				Description: transfer.Details.Description,
				Reference:   transfer.Details.Reference,
			},
		},
	}

	entries = append(entries, &sourceTransactionEntry)

	log.Info("Creating transaction entry for destination wallet")
	destinationTransactionEntry := walletrepository.Entry{
		UserId: strings.Split(transfer.Destination, "/")[1],
		Transaction: &pb.Transaction{
			Amount: transfer.Amount,
			Type:   pb.Transaction_TYPE_CREDIT,
			Details: &pb.Transaction_Details{
				DisplayName: transfer.Details.DisplayName,
				Description: transfer.Details.Description,
				Reference:   transfer.Details.Reference,
			},
		},
	}

	entries = append(entries, &destinationTransactionEntry)

	return &entries
}
