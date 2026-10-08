# syntax=docker/dockerfile:1
# Web e2e ilk yönetici aracı. Bağlam: etiketten çıkarılmış backend kaynak ağacı
# (bootstrap/main.go betik tarafından cmd/nizamio-e2e-bootstrap/ altına kopyalanmıştır).
ARG GO_VERSION=1.26
FROM golang:${GO_VERSION}-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0 GOFLAGS=-trimpath
RUN go build -o /out/e2e-bootstrap ./cmd/nizamio-e2e-bootstrap

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/e2e-bootstrap /usr/local/bin/e2e-bootstrap
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/e2e-bootstrap"]
