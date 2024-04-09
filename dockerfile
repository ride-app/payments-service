# syntax=docker/dockerfile:1@sha256:dbbd5e059e8a07ff7ea6233b213b36aa516b4c53c645f1817a4dd18b83cbea56

# Create .netrc file for private go module
# FROM bufbuild/buf:1.26.1 as buf

# ARG BUF_USERNAME ""

# SHELL ["/bin/ash", "-o", "pipefail", "-c"]
# RUN --mount=type=secret,id=BUF_TOKEN \
#   buf registry login --username=$BUF_USERNAME --token-stdin < /run/secrets/BUF_TOKEN

# Build go binary
FROM golang:1.22-alpine@sha256:cdc86d9f363e8786845bea2040312b4efa321b828acdeb26f393faa864d887b0 as build

WORKDIR /go/src/app

# COPY --from=buf /root/.netrc /root/.netrc
# ENV GOPRIVATE=buf.build/gen/go

COPY go.mod go.sum /
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 go build -o /go/bin/app -ldflags "-X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn" ./cmd/api-server

# Run
FROM gcr.io/distroless/static:nonroot@sha256:f41b84cda410b05cc690c2e33d1973a31c6165a2721e2b5343aab50fecb63441

WORKDIR /

COPY --from=build /go/bin/app .

EXPOSE 50051
CMD ["/app"]