//go:generate go run github.com/golang/mock/mockgen -destination ./mock/$GOFILE . AuthRepository

package authrepository

import (
	"context"

	firebase "firebase.google.com/go/v4"
	auth "firebase.google.com/go/v4/auth"
	"github.com/dragonfish-tech/go/pkg/logger"
)

type AuthRepository interface {
	GetUser(ctx context.Context, log logger.Logger, id string) (*UserDetails, error)
}

type UserDetails struct {
	Name  string
	Phone string
}

type FirebaseImpl struct {
	firebaseAuth *auth.Client
}

func NewFirebaseAuthRepository(firebaseApp *firebase.App) (*FirebaseImpl, error) {
	firebaseAuth, err := firebaseApp.Auth(context.Background())
	if err != nil {
		return nil, err
	}

	return &FirebaseImpl{firebaseAuth: firebaseAuth}, nil
}

func (r *FirebaseImpl) GetUser(ctx context.Context, log logger.Logger, id string) (*UserDetails, error) {
	user, err := r.firebaseAuth.GetUser(ctx, id)
	if err != nil {
		return nil, err
	}

	return &UserDetails{
		Name:  user.DisplayName,
		Phone: user.PhoneNumber,
	}, nil
}
