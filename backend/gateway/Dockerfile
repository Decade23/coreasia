# ─────────────────────────────────────────────────────────────────────────────
# CoreAsia Gateway — PRODUCTION image (multi-stage)
#
# Build context = ./backend/gateway (repo-relative).
#   docker build -t ghcr.io/decade23/coreasia-gateway:latest backend/gateway
#
# The app runs DB migrations on startup from "file://migrations" (relative to the
# working dir), so the migrations/ dir MUST sit next to the binary at runtime.
# It also loads configs/config.yaml by default (-config flag) and overlays env
# vars on top (cleanenv), so we ship configs/ too — env from .env.prod wins.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

# go.mod declares go 1.25.x; GOTOOLCHAIN=auto lets the 1.24 image fetch the
# matching toolchain automatically at build time.
ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
ENV GOOS=linux

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Cache deps first.
COPY go.mod go.sum ./
RUN go mod download

# Then the source.
COPY . .

# Static, stripped binary.
RUN go build -ldflags "-s -w" -o /server ./cmd/server

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM alpine:3.20

# ca-certificates: outbound HTTPS (Resend, Midtrans, R2, etc.).
# tzdata: bot scheduler uses time.LoadLocation (Asia/Jakarta).
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Jakarta

# WORKDIR is /app so that "file://migrations" and "configs/config.yaml" resolve.
WORKDIR /app

COPY --from=builder /server ./server
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/configs ./configs

EXPOSE 8081

# YAML provides defaults; env vars (from .env.prod) override every field.
ENTRYPOINT ["/app/server"]
CMD ["-config", "configs/config.yaml"]
