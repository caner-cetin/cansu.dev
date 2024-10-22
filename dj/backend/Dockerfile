# Build stage
FROM golang:1.22.6-bullseye AS builder
WORKDIR /app
# Copy and download dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify
# Copy source code
COPY . .
# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server .
# Final stage
FROM debian:bullseye-slim
# Install ImageMagick and clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    imagemagick \ 
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /
# Copy the binary from the builder stage
COPY --from=builder /app/server /server
# Expose the port the app runs on
EXPOSE $PORT
# Run the binary
CMD ["/server"]