#!/bin/bash
set -euo pipefail
WORKDIR="${WORKDIR:-/opt/kiwipress}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1/}"
HEALTH_WAIT="${HEALTH_WAIT:-180}"
export DEBIAN_FRONTEND=noninteractive

if [ -f "$WORKDIR/scripts/install-docker.sh" ]; then
  bash "$WORKDIR/scripts/install-docker.sh"
elif ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi

if [ -f "$WORKDIR/scripts/render-templates.sh" ]; then
  WORKDIR="$WORKDIR" bash "$WORKDIR/scripts/render-templates.sh"
fi

cd "$WORKDIR"
docker compose pull || true
docker compose up -d

if [ -n "$HEALTH_URL" ]; then
  end=$((SECONDS + HEALTH_WAIT))
  until curl -fsS "$HEALTH_URL" >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$end" ]; then
      echo "health wait timed out: $HEALTH_URL" >&2
      docker compose ps || true
      exit 1
    fi
    sleep 5
  done
  echo "stack healthy: $HEALTH_URL"
fi
