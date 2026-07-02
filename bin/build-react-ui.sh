#!/usr/bin/env bash
###############################################################################
# Build the React admin UI (modules/ui-react) for production static hosting.
###############################################################################
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UI_DIR="${ROOT}/modules/ui-react"

cd "${UI_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  echo "error: npm is required to build the React UI." >&2
  exit 1
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ ! -d node_modules ]; then
  echo "==> Installing React UI dependencies..."
  npm install
fi

echo "==> Building React UI..."
npm run build

if [ ! -f dist/index.html ]; then
  echo "error: React build did not produce dist/index.html" >&2
  exit 1
fi

echo "React UI built: ${UI_DIR}/dist"
