# Developer workflow for the Urban Object Inventory API.
.PHONY: run build test vet tidy check

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

test:
	go test ./...

vet:
	go vet ./...

tidy:
	go mod tidy

check: vet test
