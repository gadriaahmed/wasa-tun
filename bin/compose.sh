#!/usr/bin/env bash
# Wrapper: use `docker compose` (plugin) or `docker-compose` (standalone).
# Prefers Colima when Docker Desktop is not reachable.
set -euo pipefail

ensure_docker() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  local colima_sock="${HOME}/.colima/default/docker.sock"
  if [ -S "${colima_sock}" ]; then
    export DOCKER_HOST="unix://${colima_sock}"
    if docker info >/dev/null 2>&1; then
      return 0
    fi
  fi
  echo "error: Docker is not running." >&2
  echo "Start Colima:  colima start" >&2
  echo "Or Docker Desktop, then retry." >&2
  exit 1
}

ensure_docker

if docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi

if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose "$@"
fi

echo "error: Docker Compose not found (install docker compose plugin or docker-compose)." >&2
exit 1
