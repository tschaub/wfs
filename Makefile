SHELL := /bin/bash

TARGET := $(shell echo $${PWD\#\#*/})

# These will be provided to the target
VERSION := 1.0.0
BUILD := `git rev-parse --short HEAD`

# Use linker flags to provide version/build settings to the target
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Build=$(BUILD) -X=main.Name=$(TARGET)"

# go source files, ignore vendor directory
SRC = $(shell find . -type f -name '*.go' -not -path "./vendor/*")

.PHONY: build
build: $(TARGET) client
	@true

.PHONY: client
client:
	@cd client && npm run build

$(TARGET): packr $(SRC)
	@packr
	@go build $(LDFLAGS) -o $(TARGET)
	@packr clean

.PHONY: install
install:
	@packr
	@go install $(LDFLAGS)
	@packr clean

.PHONY: packr
packr:
	@go get github.com/gobuffalo/packr/...

.PHONY: clean
clean:
	@rm -f $(TARGET)

.PHONY: uninstall
uninstall: clean
	@rm -f $$(which ${TARGET})
