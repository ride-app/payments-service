# syntax=docker/dockerfile:1@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

# Create .netrc file for private go module
# FROM bufbuild/buf:1.26.1 as buf

# ARG BUF_USERNAME ""

# SHELL ["/bin/ash", "-o", "pipefail", "-c"]
# RUN --mount=type=secret,id=BUF_TOKEN \
#   buf registry login --username=$BUF_USERNAME --token-stdin < /run/secrets/BUF_TOKEN

# Build go binary
FROM golang:1.22-alpine@sha256:421bc7f4b90d042c56282bb894451108f8ab886687e1b73abaefad31ab10a14d as build

WORKDIR /go/src/app

# COPY --from=buf /root/.netrc /root/.netrc
# ENV GOPRIVATE=buf.build/gen/go

COPY go.mod go.sum /
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 go build -o /go/bin/app -ldflags "-X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn" ./cmd/api-server

# Run
FROM gcr.io/distroless/static:nonroot@sha256:e9ac71e2b8e279a8372741b7a0293afda17650d926900233ec3a7b2b7c22a246

WORKDIR /

COPY --from=build /go/bin/app .

EXPOSE 50051
CMD ["/app"]