//go:generate go run go.uber.org/mock/mockgen -destination ../../testing/mocks/$GOFILE -package mocks . WalletRepository

package walletrepository

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/aidarkhanov/nanoid"
	pb "github.com/ride-app/wallet-service/api/gen/ride/wallet/v1alpha1"
	"github.com/ride-app/wallet-service/config"
	"github.com/ride-app/wallet-service/utils/logger"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Transactions is a map where the key is the wallet ID against which the transaction is made.
type Transactions = map[string]*pb.Transaction

type WalletRepository interface {
	GetWallet(ctx context.Context, log logger.Logger, uid string) (*pb.Wallet, error)

	CreateTransactions(ctx context.Context, log logger.Logger, transactions *Transactions, batchId string) error

	GetTransaction(ctx context.Context, log logger.Logger, uid string, transactionId string) (*pb.Transaction, error)

	GetTransactions(ctx context.Context, log logger.Logger, uid string, batchId *string) ([]*pb.Transaction, error)
}

type FirestoreImpl struct {
	config    *config.Config
	firestore *firestore.Client
}

func NewFirestoreWalletRepository(config *config.Config, firebaseApp *firebase.App) (*FirestoreImpl, error) {
	firestore, err := firebaseApp.Firestore(context.Background())

	if err != nil {
		return nil, err
	}

	return &FirestoreImpl{config: config, firestore: firestore}, nil
}

func (r *FirestoreImpl) GetWallet(ctx context.Context, log logger.Logger, uid string) (*pb.Wallet, error) {

	doc, err := r.firestore.Collection("wallets").Doc(uid).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	wallet := pb.Wallet{
		Name:       "users/" + uid + "/wallet",
		Balance:    doc.Data()["balance"].(int32),
		CreateTime: timestamppb.New(doc.CreateTime),
		UpdateTime: timestamppb.New(doc.UpdateTime),
	}

	return &wallet, nil

}

func (r *FirestoreImpl) CreateTransactions(ctx context.Context, log logger.Logger, transactions *Transactions, batchId string) error {

	return r.firestore.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		for walletId, transaction := range *transactions {
			transactionId := nanoid.New()
			transaction.Name = fmt.Sprintf("users/%v/wallet/transactions/%v", walletId, transactionId)
			transaction.BatchId = &batchId

			createTime := time.Now()

			doc := map[string]interface{}{
				"walletId": walletId,
				"amount":   transaction.Amount,
				"type":     pb.Transaction_Type_name[int32(transaction.Type.Number())],
				"batchId":  batchId,
				"details": map[string]interface{}{
					"displayName": transaction.Details.DisplayName,
					"description": transaction.Details.Description,
					"reference":   transaction.Details.Reference,
				},
				"createTime": createTime,
			}

			transaction.CreateTime = timestamppb.New(createTime)

			if err := tx.Set(r.firestore.Doc(fmt.Sprintf("transactions/%v", transactionId)), doc); err != nil {
				return err
			}

			amount := transaction.Amount

			if transaction.Type == pb.Transaction_TYPE_DEBIT {
				amount = -amount
			}

			err := tx.Update(r.firestore.Doc(fmt.Sprintf("wallets/%v", walletId)), []firestore.Update{
				{
					Path:  "balance",
					Value: firestore.Increment(amount),
				},
			})

			if err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *FirestoreImpl) GetTransaction(ctx context.Context, log logger.Logger, uid string, transactionId string) (*pb.Transaction, error) {
	doc, err := r.firestore.Collection("transactions").Doc(transactionId).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	transaction := transactionFromDoc(doc)

	return transaction, nil
}

func (r *FirestoreImpl) GetTransactions(ctx context.Context, log logger.Logger, uid string, batchId *string) ([]*pb.Transaction, error) {
	query := r.firestore.Collection("transactions").Where("walletId", "==", uid)

	if batchId != nil {
		query = query.Where("batchId", "==", *batchId)
	}

	iter := query.Documents(ctx)
	defer iter.Stop()

	var transactions []*pb.Transaction

	for {
		doc, err := iter.Next()

		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		transaction := transactionFromDoc(doc)

		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

func transactionFromDoc(doc *firestore.DocumentSnapshot) *pb.Transaction {
	transaction := &pb.Transaction{
		Name:       "users/" + doc.Data()["walletId"].(string) + "/wallet/transactions/" + doc.Ref.ID,
		Amount:     doc.Data()["amount"].(int32),
		CreateTime: timestamppb.New(doc.CreateTime),
		Type:       pb.Transaction_Type(pb.Transaction_Type_value[doc.Data()["type"].(string)]),
		Details: &pb.Transaction_Details{
			DisplayName: doc.Data()["details"].(map[string]interface{})["displayName"].(string),
			Reference:   doc.Data()["details"].(map[string]interface{})["reference"].(string),
		},
	}

	batchIdData, err := doc.DataAt("batchId")

	if err == nil {
		batchId := batchIdData.(string)
		transaction.BatchId = &batchId
	}

	descriptionData, err := doc.DataAt("details.description")

	if err == nil {
		description := descriptionData.(string)
		transaction.Details.Description = &description
	}

	return transaction
}
