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
FROM golang:1.26-alpine AS builder

# Keep the compiler on the maintained 1.26 patch line. Fetching only the
# go.mod minimum would leave the production binary on an older patch.
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
FROM alpine:3.22

# ca-certificates: outbound HTTPS (Resend, Midtrans, R2, etc.).
# tzdata: bot scheduler uses time.LoadLocation (Asia/Jakarta).
RUN apk upgrade --no-cache && apk add --no-cache ca-certificates tzdata
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
