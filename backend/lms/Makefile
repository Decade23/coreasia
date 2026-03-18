.PHONY: build run dev test lint migrate seed seed-dev docker-up docker-down clean tidy

APP_NAME := coreasia-lms-api
BUILD_DIR := ./tmp
CONFIG := configs/config.yaml

## build: Build the application binary
build:
	go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/server

## run: Run the application
run: build
	$(BUILD_DIR)/$(APP_NAME) -config $(CONFIG)

## dev: Run with hot-reload (requires air)
dev:
	air -c .air.toml

## test: Run all tests
test:
	go test ./... -v -cover

## lint: Run linter (requires golangci-lint)
lint:
	golangci-lint run ./...

## migrate: Run database migrations
migrate: build
	$(BUILD_DIR)/$(APP_NAME) -config $(CONFIG) -migrate

## seed: Run system seeds (after migration)
seed: build
	$(BUILD_DIR)/$(APP_NAME) -config $(CONFIG) -seed

## seed-dev: Run system + dev seeds (after migration)
seed-dev: build
	$(BUILD_DIR)/$(APP_NAME) -config $(CONFIG) -seed-dev

## tidy: Clean up dependencies
tidy:
	go mod tidy

## docker-up: Start all services with Docker Compose
docker-up:
	docker compose -f deployments/docker-compose.yml up -d

## docker-down: Stop all Docker services
docker-down:
	docker compose -f deployments/docker-compose.yml down

## docker-build: Build production Docker image
docker-build:
	docker build -f deployments/Dockerfile -t $(APP_NAME):latest .

## docker-logs: Follow Docker logs
docker-logs:
	docker compose -f deployments/docker-compose.yml logs -f api

## clean: Remove build artifacts
clean:
	rm -rf $(BUILD_DIR)
	go clean

## help: Show available commands
help:
	@echo "Available commands:"
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':'
