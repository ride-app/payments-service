# syntax=docker/dockerfile:1@sha256:865e5dd094beca432e8c0a1d5e1c465db5f998dca4e439981029b3b81fb39ed5

# Create .netrc file for private go module
# FROM bufbuild/buf:1.25.1 as buf

# ARG BUF_USERNAME ""

# SHELL ["/bin/ash", "-o", "pipefail", "-c"]
# RUN --mount=type=secret,id=BUF_TOKEN \
#   buf registry login --username=$BUF_USERNAME --token-stdin < /run/secrets/BUF_TOKEN

# Build go binary
FROM golang:1.23-alpine@sha256:9dd2625a1ff2859b8d8b01d8f7822c0f528942fe56cfe7a1e7c38d3b8d72d679 AS build

WORKDIR /go/src/app

# COPY --from=buf /root/.netrc /root/.netrc
# ENV GOPRIVATE=buf.build/gen/go

COPY go.mod go.sum /
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 go build -o /go/bin/app -ldflags "-X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn" ./cmd/api-server

# Run
FROM gcr.io/distroless/static:nonroot@sha256:26f9b99f2463f55f20db19feb4d96eb88b056e0f1be7016bb9296a464a89d772

COPY --from=build /go/bin/app .

EXPOSE 50051
ENTRYPOINT ["/home/nonroot/app"]
