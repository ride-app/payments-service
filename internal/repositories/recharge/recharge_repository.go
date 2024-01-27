//go:generate go run github.com/golang/mock/mockgen -destination ./mock/$GOFILE . RechargeRepository

package rechargerepository

import (
	"context"
	"errors"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/pubsub"
	firebase "firebase.google.com/go/v4"
	"github.com/deb-tech-n-sol/go/pkg/logger"
	pb "github.com/ride-app/wallet-service/api/ride/wallet/v1alpha1"
	"github.com/ride-app/wallet-service/config"
	"github.com/thoas/go-funk"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// RechargeRepository is an interface that defines the methods to be implemented by the repository
type RechargeRepository interface {
	CreateRecharge(ctx context.Context, log logger.Logger, recharge *pb.Recharge, checkout_response *map[string]interface{}) (createTime *time.Time, err error)
	GetRecharge(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Recharge, error)
	GetRecharges(ctx context.Context, log logger.Logger, userId string) ([]*pb.Recharge, error)
}

// FirestoreImpl is a struct that implements the RechargeRepository interface
type FirestoreImpl struct {
	config              *config.Config
	firestore           *firestore.Client
	createRechargeTopic *pubsub.Topic
}

// NewFirestoreRechargeRepository is a function that returns a new instance of FirestoreImpl
// It takes in a firebase app and a pubsub client as parameters
// It returns a pointer to a FirestoreImpl instance and an error
func NewFirestoreRechargeRepository(config *config.Config, firebaseApp *firebase.App, pubsubClient *pubsub.Client) (*FirestoreImpl, error) {
	// Get a firestore client from the firebase app
	firestore, err := firebaseApp.Firestore(context.Background())

	if err != nil {
		return nil, err
	}

	// Get a pubsub topic for recharge creation
	createRechargeTopic := pubsubClient.Topic("recharge/created")

	// Return a pointer to a new instance of FirestoreImpl with the firestore client and pubsub topic
	return &FirestoreImpl{config: config, firestore: firestore, createRechargeTopic: createRechargeTopic}, nil
}

// CreateRecharge is a method that creates a new recharge in the firestore database
// It takes in a context, a pointer to a pb.Recharge struct and a pointer to a map[string]interface{} struct as parameters
// It returns a pointer to a time.Time struct and an error
func (r *FirestoreImpl) CreateRecharge(ctx context.Context, log logger.Logger, recharge *pb.Recharge, checkout_response *map[string]interface{}) (createTime *time.Time, err error) {
	// Split the recharge name by "/" and get the last element as the document ID
	substrings := strings.Split(recharge.Name, "/")

	// Create a map of fields to be added to the firestore document
	doc := map[string]interface{}{
		"status":    pb.Recharge_STATUS_PENDING.String(),
		"amount":    recharge.Amount,
		"reference": (*checkout_response)["id"].(string),
		"method":    "razorpay",
	}

	// Add the document to the firestore collection with the document ID as the last element of the substrings array
	writeResult, err := r.firestore.Collection("recharges").Doc(substrings[len(substrings)-1]).Set(ctx, doc)

	if err != nil {
		return nil, err
	}

	// Publish a message to the pubsub topic for recharge creation
	result := r.createRechargeTopic.Publish(ctx, &pubsub.Message{
		Data: []byte(recharge.String()),
	})

	// Block until the result is returned and a server-generated ID is returned for the published message.
	_, err = result.Get(ctx)

	if err != nil {
		log.WithError(err).Info("pubsub: recharge/created: failed to publish message")
		return nil, err
	}

	// Return a pointer to the update time of the write result and nil for the error
	return &writeResult.UpdateTime, nil
}

// GetRecharge is a method that retrieves a single recharge from the firestore database
// It takes in a context and a string ID as parameters
// It returns a pointer to a pb.Recharge struct and an error
func (r *FirestoreImpl) GetRecharge(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Recharge, error) {
	doc, err := r.firestore.Collection("wallets").Doc(userId).Collection("recharges").Doc(id).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	recharge := docToRecharge(doc)

	if recharge == nil {
		return nil, errors.New("invalid recharge")
	}

	return recharge, nil
}

func (r *FirestoreImpl) GetRecharges(ctx context.Context, log logger.Logger, userId string) ([]*pb.Recharge, error) {
	iter := r.firestore.Collection("wallets").Doc(userId).Collection("recharges").Documents(ctx)

	recharges := []*pb.Recharge{}

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		recharge := docToRecharge(doc)

		if recharge != nil {
			return nil, errors.New("invalid recharge")
		}

		recharges = append(recharges, recharge)
	}

	return recharges, nil
}

// docToRecharge is a helper function that converts a firestore document to a pb.Recharge object
func docToRecharge(doc *firestore.DocumentSnapshot) *pb.Recharge {

	if !(funk.Contains(doc.Data(), "amount") && funk.Contains(doc.Data(), "status")) {
		return nil
	}

	return &pb.Recharge{
		Name:       "users/" + doc.Ref.Parent.Parent.ID + "/wallet/recharges/" + doc.Ref.ID,
		Amount:     doc.Data()["amount"].(int32),
		Status:     *pb.Recharge_Status(pb.Recharge_Status_value["STATUS_"+doc.Data()["status"].(string)]).Enum(),
		CreateTime: timestamppb.New(doc.CreateTime),
		UpdateTime: timestamppb.New(doc.UpdateTime),
	}
}
