#!/usr/bin/env bash
set -e

REPO="raflymln/huawei-lte-gateway"
IMAGE="ghcr.io/${REPO}"
TAG="${1:-latest}"

echo "Installing Huawei LTE Gateway..."
echo "Repository: ${REPO}"
echo "Image tag: ${TAG}"

if ! command -v podman &> /dev/null; then
    if ! command -v docker &> /dev/null; then
        echo "Error: Neither podman nor docker is installed."
        exit 1
    fi
    RUNTIME=docker
else
    RUNTIME=podman
fi

echo "Using: ${RUNTIME}"

echo ""
echo "Creating compose.yml..."

cat > compose.yml << 'EOF'
services:
    gateway:
        image: ${IMAGE}:${TAG}
        container_name: huawei-lte-gateway
        restart: unless-stopped
        environment:
            - PORT=3000
            - MODEM_URL=http://192.168.8.1/api
        ports:
            - "3000:3000"
        healthcheck:
            test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
            interval: 30s
            timeout: 3s
            retries: 3
            start_period: 10s
EOF

echo "Created compose.yml"
echo ""
echo "To start:"
echo "  ${RUNTIME} compose up -d"
echo ""
echo "To update:"
echo "  ${RUNTIME} compose pull && ${RUNTIME} compose up -d"
