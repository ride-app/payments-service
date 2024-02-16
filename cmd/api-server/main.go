package main

import (
	"context"
	"fmt"
	"net/http"

	"connectrpc.com/authn"
	"connectrpc.com/connect"
	interceptors "github.com/dragonfish/go/pkg/connect/interceptors"
	middlewares "github.com/dragonfish/go/pkg/connect/middlewares"
	"github.com/dragonfish/go/pkg/logger"
	"github.com/ride-app/payments-service/api/ride/payments/v1alpha1/v1alpha1connect"
	"github.com/ride-app/payments-service/config"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func main() {
	config, err := config.New()

	log := logger.New(!config.Production, config.LogDebug)

	if err != nil {
		log.WithError(err).Fatal("Failed to read environment variables")
	}

	// Create a context that, when cancelled, ends the JWKS background refresh goroutine.
	ctx, cancel := context.WithCancel(context.Background())

	defer cancel()

	panicInterceptor, err := interceptors.NewPanicInterceptor(ctx)

	if err != nil {
		log.Fatalf("Failed to initialize panic interceptor: %v", err)
	}

	connectInterceptors := connect.WithInterceptors(panicInterceptor)

	service, err := InitializeService(log, config)

	if err != nil {
		log.Fatalf("Failed to initialize service: %v", err)
	}

	log.Info("Service Initialized")

	mux := http.NewServeMux()
	mux.Handle(v1alpha1connect.NewPaymentsServiceHandler(service, connectInterceptors))

	middleware := authn.NewMiddleware(middlewares.FirebaseAuth)
	handler := middleware.Wrap(mux)

	// trunk-ignore(semgrep/go.lang.security.audit.net.use-tls.use-tls)
	panic(http.ListenAndServe(
		fmt.Sprintf("0.0.0.0:%d", config.Port),
		// Use h2c so we can serve HTTP/2 without TLS.
		h2c.NewHandler(handler, &http2.Server{}),
	))

}
