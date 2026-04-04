#!/usr/bin/env bash
set -e

REPO="raflymln/huawei-lte-gateway"
IMAGE="ghcr.io/${REPO}"
TAG="${1:-latest}"
INSTALL_DIR="${HOME}/.config/huawei-lte-gateway"

check_version() {
    local current_tag="$1"
    local latest_tag

    latest_tag=$(curl -sSf "https://github.com/${REPO}/releases/latest" 2>/dev/null | grep -oP 'tag/v?\K[0-9.]+' | head -1 || echo "")

    if [ -z "$latest_tag" ]; then
        echo "Could not fetch latest version"
        return 1
    fi

    if [ "$current_tag" != "$latest_tag" ]; then
        echo "New version available: ${latest_tag} (current: ${current_tag})"
        read -p "Update to ${latest_tag}? [Y/n] " -n 1 -r || true
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            return 2
        fi
    else
        echo "Already on latest version: ${latest_tag}"
    fi

    return 0
}

check_podman_version() {
    if ! command -v podman &> /dev/null; then
        return 1
    fi

    local version
    version=$(podman version --format '{{.Version}}' 2>/dev/null | cut -d. -f1 || echo "0")

    if [ "$version" -lt 4 ]; then
        echo "Warning: Podman 4+ recommended. Found version ${version}"
    fi

    return 0
}

install() {
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
        check_podman_version
    fi

    echo "Using: ${RUNTIME}"

    mkdir -p "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"

    cat > docker-compose.yml << 'EOF'
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

    echo "Pulling image..."
    ${RUNTIME} compose pull

    echo "Starting service..."
    ${RUNTIME} compose up -d

    echo ""
    echo "Installed to: ${INSTALL_DIR}"
    echo "Service is running on http://localhost:3000"
}

update() {
    echo "Updating Huawei LTE Gateway..."

    cd "${INSTALL_DIR}"

    ${RUNTIME} compose pull
    ${RUNTIME} compose up -d

    echo "Update complete."
}

case "${1:-install}" in
    install)
        if [ -f "${INSTALL_DIR}/docker-compose.yml" ]; then
            echo "Service already installed. Checking for updates..."
            check_version "${TAG}"
            case $? in
                0) echo "No update needed." ;;
                1) echo "Skipping update check." ;;
                2) update ;;
            esac
        else
            install
        fi
        ;;
    update)
        update
        ;;
    uninstall)
        cd "${INSTALL_DIR}"
        ${RUNTIME} compose down
        rm -rf "${INSTALL_DIR}"
        echo "Uninstalled."
        ;;
    *)
        echo "Usage: $0 [install|update|uninstall]"
        exit 1
        ;;
esac
