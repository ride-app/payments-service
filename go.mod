module github.com/ride-app/payments-service

go 1.22.2

// HACK: pin protobuf version to fix build failure
replace google.golang.org/protobuf => google.golang.org/protobuf v1.34.2

require (
	buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go v1.34.2-20240717164558-a6c49f84cc0f.2
	cloud.google.com/go/firestore v1.16.0
	cloud.google.com/go/pubsub v1.42.0
	connectrpc.com/authn v0.1.0
	connectrpc.com/connect v1.16.2
	firebase.google.com/go/v4 v4.14.1
	github.com/aidarkhanov/nanoid v1.0.8
	github.com/bufbuild/protovalidate-go v0.6.4
	github.com/dragonfish/go/v2 v2.1.0
	github.com/golang/mock v1.6.0
	github.com/google/wire v0.6.0
	github.com/ilyakaznacheev/cleanenv v1.5.0
	github.com/onsi/ginkgo/v2 v2.19.1
	github.com/onsi/gomega v1.34.1
	github.com/razorpay/razorpay-go v1.3.2
	github.com/thoas/go-funk v0.9.3
	go.uber.org/mock v0.4.0
	golang.org/x/net v0.28.0
	google.golang.org/api v0.191.0
	google.golang.org/genproto v0.0.0-20240823204242-4ba0660f739c
	google.golang.org/genproto/googleapis/api v0.0.0-20240823204242-4ba0660f739c
	google.golang.org/protobuf v1.34.2
)

require (
	cloud.google.com/go v0.115.1 // indirect
	cloud.google.com/go/auth v0.8.0 // indirect
	cloud.google.com/go/auth/oauth2adapt v0.2.3 // indirect
	cloud.google.com/go/compute/metadata v0.5.0 // indirect
	cloud.google.com/go/iam v1.1.13 // indirect
	cloud.google.com/go/longrunning v0.5.12 // indirect
	cloud.google.com/go/storage v1.43.0 // indirect
	github.com/BurntSushi/toml v1.3.2 // indirect
	github.com/MicahParks/jwkset v0.5.12 // indirect
	github.com/MicahParks/keyfunc v1.9.0 // indirect
	github.com/MicahParks/keyfunc/v3 v3.2.5 // indirect
	github.com/antlr4-go/antlr/v4 v4.13.0 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/go-logr/logr v1.4.2 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/go-task/slim-sprig/v3 v3.0.0 // indirect
	github.com/golang-jwt/jwt/v4 v4.5.0 // indirect
	github.com/golang-jwt/jwt/v5 v5.2.0 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/google/cel-go v0.21.0 // indirect
	github.com/google/go-cmp v0.6.0 // indirect
	github.com/google/pprof v0.0.0-20240424215950-a892ee059fd6 // indirect
	github.com/google/s2a-go v0.1.8 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.2 // indirect
	github.com/googleapis/gax-go/v2 v2.13.0 // indirect
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/stoewer/go-strcase v1.3.0 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.49.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.49.0 // indirect
	go.opentelemetry.io/otel v1.28.0 // indirect
	go.opentelemetry.io/otel/metric v1.28.0 // indirect
	go.opentelemetry.io/otel/trace v1.28.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	go.uber.org/zap v1.26.0 // indirect
	golang.org/x/crypto v0.26.0 // indirect
	golang.org/x/exp v0.0.0-20240719175910-8a7402abbf56 // indirect
	golang.org/x/mod v0.19.0 // indirect
	golang.org/x/oauth2 v0.22.0 // indirect
	golang.org/x/sync v0.8.0 // indirect
	golang.org/x/sys v0.24.0 // indirect
	golang.org/x/text v0.17.0 // indirect
	golang.org/x/time v0.6.0 // indirect
	golang.org/x/tools v0.23.0 // indirect
	google.golang.org/appengine/v2 v2.0.5 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240814211410-ddb44dafa142 // indirect
	google.golang.org/grpc v1.65.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	olympos.io/encoding/edn v0.0.0-20201019073823-d3554ca0b0a3 // indirect
)
