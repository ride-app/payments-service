package thirdparty

import (
	razorpay "github.com/razorpay/razorpay-go"
	"github.com/ride-app/payments-service/config"
)

func NewRazorpayClient(config *config.Config) *razorpay.Client {
	return razorpay.NewClient(config.Razorpay_Key, config.Razorpay_Secret)
}
