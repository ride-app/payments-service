package interceptors

import (
	"context"
	"errors"

	"connectrpc.com/connect"
	"github.com/ride-app/wallet-service/utils/logger"
)

func NewPanicInterceptor(ctx context.Context, log logger.Logger) (*connect.UnaryInterceptorFunc, error) {
	interceptor := func(next connect.UnaryFunc) connect.UnaryFunc {
		var handler connect.UnaryFunc

		defer func() {
			if r := recover(); r != nil {
				var err error

				switch e := r.(type) {
				case string:
					err = errors.New(e)
				case error:
					err = e
				default:
					err = errors.New("unknown handler panic")
				}

				log.WithError(err).Panic("panic caught by interceptor")

				handler = connect.UnaryFunc(func(
					_ context.Context,
					__ connect.AnyRequest,
				) (connect.AnyResponse, error) {

					return nil, connect.NewError(connect.CodeInternal, err)
				})
			}
		}()

		handler = connect.UnaryFunc(func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			return next(ctx, req)
		})

		return handler
	}

	interceptorFunc := connect.UnaryInterceptorFunc(interceptor)

	return &interceptorFunc, nil
}
