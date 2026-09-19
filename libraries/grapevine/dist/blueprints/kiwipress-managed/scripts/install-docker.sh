#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Docker and Compose already installed"
  exit 0
fi

if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
fi

apt-get update -y
apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker || true

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-v2 || true
fi

docker --version
docker compose version
