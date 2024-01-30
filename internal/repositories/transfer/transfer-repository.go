//go:generate go run github.com/golang/mock/mockgen -destination ./mock/$GOFILE . TransferRepository

package transferrepository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/aidarkhanov/nanoid"
	"github.com/deb-tech-n-sol/go/pkg/logger"
	pb "github.com/ride-app/payments-service/api/ride/payments/v1alpha1"
	"github.com/ride-app/payments-service/config"
	"github.com/thoas/go-funk"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type TransferRepository interface {
	CreateTransfers(ctx context.Context, log logger.Logger, transfers *[]*pb.Transfer) (*[]*pb.Transfer, error)
	GetTransfer(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Transfer, error)
	GetTransfers(ctx context.Context, log logger.Logger, userId string) ([]*pb.Transfer, error)
}

type FirestoreImpl struct {
	config    *config.Config
	firestore *firestore.Client
}

func NewFirestoreTransferRepository(config *config.Config, firebaseApp *firebase.App) (*FirestoreImpl, error) {
	firestore, err := firebaseApp.Firestore(context.Background())

	if err != nil {
		return nil, err
	}

	return &FirestoreImpl{config: config, firestore: firestore}, nil
}

func (r *FirestoreImpl) CreateTransfers(ctx context.Context, log logger.Logger, transfers *[]*pb.Transfer) (*[]*pb.Transfer, error) {

	batch := r.firestore.BulkWriter(ctx)

	for _, transfer := range *transfers {
		substrings := strings.Split(transfer.Name, "/")
		userId := substrings[1]
		transferId := nanoid.New()

		transfer.Name = "users/" + userId + "/wallet/payouts/" + transferId

		createTime := time.Now()

		doc := map[string]interface{}{
			"status":      pb.Payout_STATUS_PENDING.String(),
			"source":      strings.Split(transfer.Source, "/")[1],
			"destination": strings.Split(transfer.Destination, "/")[1],
			"amount":      transfer.Amount,
			"details": map[string]interface{}{
				"display_name": transfer.Details.DisplayName,
				"description":  transfer.Details.Description,
				"reference":    transfer.Details.Reference,
			},
			"create_time": createTime,
		}

		transfer.CreateTime = timestamppb.New(createTime)
		transfer.UpdateTime = timestamppb.New(createTime)

		_, err := batch.Set(r.firestore.Doc(fmt.Sprintf("transfers/%v", transferId)), doc)

		if err != nil {
			log.Fatalf("Failed to create transfer: %v", err)
			return nil, err
		}
	}

	batch.End()

	return transfers, nil
}

// GetTransfer is a method that retrieves a single transfer from the firestore database
// It takes in a context and a string ID as parameters
// It returns a pointer to a pb.Transfer struct and an error
func (r *FirestoreImpl) GetTransfer(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Transfer, error) {
	doc, err := r.firestore.Collection("wallets").Doc(userId).Collection("transfers").Doc(id).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	transfer := docToTransfer(doc)

	if transfer == nil {
		return nil, errors.New("invalid transfer")
	}

	return transfer, nil
}

func (r *FirestoreImpl) GetTransfers(ctx context.Context, log logger.Logger, userId string) ([]*pb.Transfer, error) {
	iter := r.firestore.Collection("wallets").Doc(userId).Collection("transfers").Documents(ctx)

	transfers := []*pb.Transfer{}

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		transfer := docToTransfer(doc)

		if transfer != nil {
			return nil, errors.New("invalid transfer")
		}

		transfers = append(transfers, transfer)
	}

	return transfers, nil
}

// docToTransfer is a helper function that converts a firestore document to a pb.Transfer object
func docToTransfer(doc *firestore.DocumentSnapshot) *pb.Transfer {

	if !(funk.Contains(doc.Data(), "amount") && funk.Contains(doc.Data(), "status")) {
		return nil
	}

	return &pb.Transfer{
		Name:       "users/" + doc.Ref.Parent.Parent.ID + "/wallet/transfers/" + doc.Ref.ID,
		Amount:     doc.Data()["amount"].(int32),
		Status:     *pb.Transfer_Status(pb.Transfer_Status_value["STATUS_"+doc.Data()["status"].(string)]).Enum(),
		CreateTime: timestamppb.New(doc.CreateTime),
		UpdateTime: timestamppb.New(doc.UpdateTime),
	}
}
