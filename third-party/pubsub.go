package thirdparty

import (
	"context"
	"log"

	"cloud.google.com/go/pubsub"
	"github.com/ride-app/wallet-service/config"
)

func NewPubSubClient(config *config.Config) (*pubsub.Client, error) {
	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, config.ProjectId)

	if err != nil {
		log.Fatalln(err)
		return nil, err
	}

	return client, nil
}
