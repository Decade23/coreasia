.PHONY: build run dev test lint clean tidy

APP_NAME := coreasia-gateway
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

## tidy: Clean up dependencies
tidy:
	go mod tidy

## clean: Remove build artifacts
clean:
	rm -rf $(BUILD_DIR)
	go clean

## help: Show available commands
help:
	@echo "Available commands:"
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':'
