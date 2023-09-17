package interceptors

import (
	"context"
	"errors"
	"time"

	"connectrpc.com/connect"
	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ride-app/wallet-service/utils/logger"
)

func NewAuthInterceptor(ctx context.Context, log logger.Logger) (*connect.UnaryInterceptorFunc, error) {
	jwksURI := "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

	options := keyfunc.Options{
		Ctx: ctx,
		RefreshErrorHandler: func(err error) {
			log.WithError(err).Fatal("There was an error with the jwt.Keyfunc")
		},
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  time.Minute * 5,
		RefreshTimeout:    time.Second * 10,
		RefreshUnknownKID: true,
	}

	jwks, err := keyfunc.Get(jwksURI, options)

	if err != nil {
		return nil, err
	}

	interceptor := func(next connect.UnaryFunc) connect.UnaryFunc {
		return connect.UnaryFunc(func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			if req.Header().Get("authorization") == "" {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("no token provided"),
				)
			}

			if req.Header().Get("authorization")[:7] != "Bearer " {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("invalid token format"),
				)
			}
			token, err := jwt.Parse(req.Header().Get("authorization")[7:], jwks.Keyfunc)

			if !token.Valid {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("invalid token"),
				)
			}

			req.Header().Set("user_id", token.Claims.(jwt.MapClaims)["user_id"].(string))

			if err != nil {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New(err.Error()),
				)
			}

			return next(ctx, req)
		})
	}

	interceptorFunc := connect.UnaryInterceptorFunc(interceptor)

	return &interceptorFunc, nil
}
