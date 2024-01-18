//go:generate go run github.com/golang/mock/mockgen -destination ./mock/$GOFILE . PayoutRepository

package payoutrepository

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/aidarkhanov/nanoid"
	"github.com/ride-app/go/pkg/logger"
	pb "github.com/ride-app/wallet-service/api/ride/wallet/v1alpha1"
	"github.com/ride-app/wallet-service/config"
	"github.com/thoas/go-funk"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type PayoutRepository interface {
	CreatePayout(ctx context.Context, log logger.Logger, payoutAccount *pb.PayoutAccount, payout *pb.Payout) (*pb.Payout, error)

	GetPayout(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Payout, error)

	GetPayouts(ctx context.Context, log logger.Logger, userId string) ([]*pb.Payout, error)

	// UpdatePayout(ctx context.Context, log logger.Logger, payout *pb.Payout) (createTime *time.Time, err error)

	CancelPayout(ctx context.Context, log logger.Logger, id string) (createTime *time.Time, err error)

	CreatePayoutAccount(ctx context.Context, log logger.Logger, name string, payoutAccount *pb.PayoutAccount) (*pb.PayoutAccount, error)

	GetPayoutAccount(ctx context.Context, log logger.Logger, userId string) (*pb.PayoutAccount, error)

	// UpdatePayoutAccount(ctx context.Context, log logger.Logger, payoutAccount *pb.PayoutAccount) (updateTime *time.Time, err error)
}

type FirestoreImpl struct {
	config    *config.Config
	firestore *firestore.Client
}

func NewFirestorePayoutRepository(config *config.Config, firebaseApp *firebase.App) (*FirestoreImpl, error) {
	firestore, err := firebaseApp.Firestore(context.Background())

	if err != nil {
		return nil, err
	}

	return &FirestoreImpl{config: config, firestore: firestore}, nil
}

func (r *FirestoreImpl) CreatePayout(ctx context.Context, log logger.Logger, payoutAccount *pb.PayoutAccount, payout *pb.Payout) (*pb.Payout, error) {
	substrings := strings.Split(payout.Name, "/")
	userId := substrings[1]
	payoutId := nanoid.New()

	payout.Name = "users/" + userId + "/wallet/payouts/" + payoutId

	doc := map[string]interface{}{
		"status": pb.Payout_STATUS_PENDING.String(),
		"amount": payout.Amount,
	}

	payoutResponse, err := sendPayoutLink(r.config.Razorpay_Account_Number, payout.Amount, payoutAccount.RazorpayContactId, payout.Name)

	if err != nil {
		return nil, err
	}

	doc["payout_id"] = payoutResponse["id"]

	// TODO: Implement the following code when implementing direct bank and upi transfer
	// if upiId := payoutAccount.GetUpiId(); upiId != "" {
	// } else if bankAccount := payoutAccount.GetBankAccount(); bankAccount != nil {
	// }

	writeResult, err := r.firestore.Collection("wallets").Doc(userId).Collection("payouts").Doc(payoutId).Set(ctx, doc)

	if err != nil {
		log.Fatalf("Failed to create payout: %v", err)
		return nil, err
	}

	payout.CreateTime = timestamppb.New(writeResult.UpdateTime)
	payout.UpdateTime = timestamppb.New(writeResult.UpdateTime)

	return payout, nil
}

func sendPayoutLink(accountNumber string, amount int32, contactId string, payoutName string) (map[string]interface{}, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"account_number": accountNumber,
		"amount":         amount,
		"description":    "Payout for " + payoutName,
		"contact": map[string]interface{}{
			"id": contactId,
		},
		"currency":             "INR",
		"purpose":              "payout",
		"send_sms":             true,
		"queue_if_low_balance": true,
		"notes": map[string]interface{}{
			"reference_id": payoutName,
		},
	})

	resp, err := http.Post("https://api.razorpay.com/v1/payout-links", "application/json", bytes.NewBuffer(body))

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)

	if err != nil {
		return nil, err
	}

	var response map[string]interface{}

	err = json.Unmarshal(data, &response)

	if err != nil {
		return nil, err
	}

	return response, nil
}

func (r *FirestoreImpl) GetPayout(ctx context.Context, log logger.Logger, userId string, id string) (*pb.Payout, error) {
	doc, err := r.firestore.Collection("wallets").Doc(userId).Collection("payouts").Doc(id).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	payout := docToPayout(doc)

	if payout == nil {
		return nil, errors.New("invalid payout")
	}

	return payout, nil
}

func (r *FirestoreImpl) GetPayouts(ctx context.Context, log logger.Logger, userId string) ([]*pb.Payout, error) {
	iter := r.firestore.Collection("wallets").Doc(userId).Collection("payout").Documents(ctx)

	payouts := []*pb.Payout{}

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		payout := docToPayout(doc)

		if payout != nil {
			return nil, errors.New("invalid payout")
		}

		payouts = append(payouts, payout)
	}

	return payouts, nil
}

// func (r *FirestoreImpl) UpdatePayout(ctx context.Context, log logger.Logger, payout *pb.Payout) (createTime *time.Time, err error) {
// 	return nil, nil
// }

func (r *FirestoreImpl) CancelPayout(ctx context.Context, log logger.Logger, id string) (createTime *time.Time, err error) {
	return nil, nil
}

// docToPayout is a helper function that converts a Firestore document to a Payout struct.
func docToPayout(doc *firestore.DocumentSnapshot) *pb.Payout {

	if !(funk.Contains(doc.Data(), "amount") && funk.Contains(doc.Data(), "status")) {
		return nil
	}

	return &pb.Payout{
		Name:       "users/" + doc.Ref.ID + "/wallet/payouts/" + doc.Ref.ID,
		Amount:     doc.Data()["amount"].(int32),
		Status:     *pb.Payout_Status(pb.Payout_Status_value["STATUS_"+doc.Data()["status"].(string)]).Enum(),
		CreateTime: timestamppb.New(doc.CreateTime),
		UpdateTime: timestamppb.New(doc.UpdateTime),
	}
}

func (r *FirestoreImpl) CreatePayoutAccount(ctx context.Context, log logger.Logger, name string, payoutAccount *pb.PayoutAccount) (*pb.PayoutAccount, error) {
	userId := strings.Split(payoutAccount.Name, "/")[1]

	body, _ := json.Marshal(map[string]interface{}{
		"name":          name,
		"referenced_id": userId,
	}) // marshal the payout API payload to JSON

	resp, err := http.Post("https://api.razorpay.com/v1/contacts", "application/json", bytes.NewBuffer(body))

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)

	if err != nil {
		return nil, err
	}

	var contactResponse map[string]interface{}

	err = json.Unmarshal(data, &contactResponse)

	if err != nil {
		return nil, err
	}

	doc := map[string]interface{}{
		"currency":            "INR",
		"razorpay_contact_id": contactResponse["id"],
	}

	// TODO: Implement the following code when implementing direct bank and upi transfer
	// if payoutAccount.Destination != nil {
	// 	payload := map[string]interface{}{
	// 		"contact_id": contactResponse["id"],
	// 	}
	// 	switch payoutAccount.Destination.(type) {
	// 	case *pb.PayoutAccount_BankAccount_:
	// 		bankAccount := payoutAccount.GetBankAccount()

	// 		payload["account_type"] = "bank_account"
	// 		payload["bank_account"] = map[string]interface{}{
	// 			"name":           bankAccount.HolderName,
	// 			"ifsc":           bankAccount.IfscCode,
	// 			"account_number": bankAccount.AccountNumber,
	// 		}
	// 	case *pb.PayoutAccount_UpiId:
	// 		upiId := payoutAccount.GetUpiId()

	// 		payload["account_type"] = "vpa"
	// 		payload["vpa"] = map[string]interface{}{
	// 			"address": upiId,
	// 		}

	// 	default:
	// 		return nil, errors.New("invalid payout account")
	// 	}

	// 	body, err = json.Marshal(payload)

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	resp, err = http.Post("https://api.razorpay.com/v1/fund_accounts", "application/json", bytes.NewBuffer(body))

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	defer resp.Body.Close()

	// 	data, err = io.ReadAll(resp.Body)

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	var fundAccountResponse map[string]interface{}

	// 	err = json.Unmarshal(data, &fundAccountResponse)

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	doc["razorpayFundAccountId"] = fundAccountResponse["id"]
	// }

	writeResult, err := r.firestore.Collection("payout-accounts").Doc(userId).Set(ctx, doc)

	payoutAccount.CreateTime = timestamppb.New(writeResult.UpdateTime)
	payoutAccount.UpdateTime = timestamppb.New(writeResult.UpdateTime)

	return payoutAccount, err
}

func (r *FirestoreImpl) GetPayoutAccount(ctx context.Context, log logger.Logger, userId string) (*pb.PayoutAccount, error) {
	doc, err := r.firestore.Collection("payout-accounts").Doc(userId).Get(ctx)

	if err != nil {
		return nil, err
	}

	if !doc.Exists() {
		return nil, nil
	}

	payoutAccount := docToPayoutAccount(doc)

	if payoutAccount == nil {
		return nil, errors.New("invalid payout account")
	}

	return payoutAccount, nil
}

// TODO: Update the function when implementing the api endpoint
// func (r *FirestoreImpl) UpdatePayoutAccount(ctx context.Context, log logger.Logger, payoutAccount *pb.PayoutAccount) (updateTime *time.Time, err error) {
// 	userId := strings.Split(payoutAccount.Name, "/")[1]

// 	doc := map[string]interface{}{
// 		"currency":   "INR",
// 		"accountNo":  payoutAccount.GetBankAccount().AccountNumber,
// 		"holderName": payoutAccount.GetBankAccount().HolderName,
// 		"ifsc":       payoutAccount.GetBankAccount().IfscCode,
// 	}

// 	writeResult, err := r.firestore.Collection("payout-accounts").Doc(userId).Set(ctx, doc, firestore.MergeAll)

// 	return &writeResult.UpdateTime, err
// }

func docToPayoutAccount(doc *firestore.DocumentSnapshot) *pb.PayoutAccount {

	if !(funk.Contains(doc.Data(), "accountNo") && funk.Contains(doc.Data(), "holderName") && funk.Contains(doc.Data(), "ifsc")) {
		return nil
	}

	return &pb.PayoutAccount{
		Name:         "users/" + doc.Ref.ID + "/wallet/payout-account",
		CurrencyCode: "INR",
		// Destination: &pb.PayoutAccount_BankAccount_{
		// 	BankAccount: &pb.PayoutAccount_BankAccount{
		// 		AccountNumber: doc.Data()["accountNo"].(string),
		// 		HolderName:    doc.Data()["holderName"].(string),
		// 		IfscCode:      doc.Data()["ifsc"].(string),
		// 	},
		// },
		CreateTime: timestamppb.New(doc.CreateTime),
		UpdateTime: timestamppb.New(doc.UpdateTime),
	}
}
