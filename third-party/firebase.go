package thirdparty

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"github.com/ride-app/wallet-service/config"
)

func NewFirebaseApp(config *config.Config) (*firebase.App, error) {
	ctx := context.Background()
	conf := &firebase.Config{ProjectID: config.ProjectId}
	app, err := firebase.NewApp(ctx, conf)

	if err != nil {
		log.Fatalln(err)
		return nil, err
	}

	return app, nil
}
