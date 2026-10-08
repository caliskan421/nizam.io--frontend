# syntax=docker/dockerfile:1
# Web e2e ilk yönetici aracı. Bağlam: etiketten çıkarılmış backend kaynak ağacı
# (bootstrap/main.go betik tarafından cmd/nizamio-e2e-bootstrap/ altına kopyalanmıştır).
# Taban imajlar digest'e sabitlidir (tedarik zinciri; çözüm: registry Docker-Content-Digest).
FROM golang:1.26-bookworm@sha256:dc9ad6c05acc7a88e5b71bde60a5fe3bd4b9f0db209011711b464107438a8107 AS build
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
