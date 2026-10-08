# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e
# Web e2e ilk yönetici aracı. Bağlam: etiketten çıkarılmış backend kaynak ağacı
# (bootstrap/main.go betik tarafından cmd/nizamio-e2e-bootstrap/ altına kopyalanmıştır).
# Taban imajlar digest'e sabitlidir (tedarik zinciri; çözüm: registry Docker-Content-Digest).
# Go sürümü etiketteki go.mod `go` satırıyla aynıdır (backend Makefile GO_VERSION).
FROM golang:1.26.0-bookworm@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0 GOFLAGS=-trimpath
RUN go build -o /out/e2e-bootstrap ./cmd/nizamio-e2e-bootstrap

FROM gcr.io/distroless/static-debian12:nonroot@sha256:afa5c872c891853ca7fcf1f12c3edb23f7eeef36189728842dd51042ff57f7ab
COPY --from=build /out/e2e-bootstrap /usr/local/bin/e2e-bootstrap
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/e2e-bootstrap"]
