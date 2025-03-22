# Support setting various labels on the final image
ARG COMMIT=""
ARG VERSION=""
ARG BUILDNUM=""

# Build Geth in a stock Go builder container
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache gcc musl-dev linux-headers git

# Get dependencies - will also be cached if we won't change go.mod/go.sum
COPY go.mod /go-ethereum/
COPY go.sum /go-ethereum/
RUN cd /go-ethereum && go mod download

ADD . /go-ethereum
RUN cd /go-ethereum && go run build/ci.go install -static ./cmd/geth

# Pull Geth into a second stage deploy alpine container
FROM node:16-alpine

RUN apk add --no-cache ca-certificates
COPY --from=builder /go-ethereum/build/bin/geth /usr/local/bin/

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY ./hardhat/package.json ./hardhat/package-lock.json ./
RUN npm install

# Copy the remaining Hardhat project files
COPY ./hardhat/ .

EXPOSE 8545 8546 30303 30303/udp

ENTRYPOINT ["geth"]

LABEL commit="$COMMIT" version="$VERSION" buildnum="$BUILDNUM"