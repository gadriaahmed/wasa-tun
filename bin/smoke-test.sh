#!/usr/bin/env bash
###############################################################################
# Quick local stack health check (backend + optional React dev proxy).
###############################################################################
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_URL="${WASABI_API_URL:-http://localhost:8088}"
REACT_URL="${WASABI_REACT_URL:-http://localhost:3000}"

pass() { echo "  OK  $*"; }
fail() { echo "  FAIL $*"; errors=$((errors + 1)); }

errors=0

echo "==> Smoke test"
echo "Backend: ${BACKEND_URL}"
echo "React:   ${REACT_URL}"
echo ""

if curl -sf "${BACKEND_URL}/api/v1/ping" >/dev/null; then
  pass "backend ping"
else
  fail "backend ping — start with: ./bin/dev.sh --no-ui"
fi

if curl -sf "${BACKEND_URL}/" >/dev/null; then
  pass "legacy UI"
else
  fail "legacy UI at ${BACKEND_URL}/"
fi

if curl -sf "${REACT_URL}/" >/dev/null; then
  pass "react dev server"
  if curl -sf "${REACT_URL}/api/v1/ping" >/dev/null; then
    pass "vite proxy to backend"
  else
    fail "vite proxy — check modules/ui-react/vite.config.ts target is :8088"
  fi
else
  fail "react dev server — start with: ./bin/ui-react-dev.sh start"
fi

echo ""
if [ "${errors}" -eq 0 ]; then
  echo "All checks passed."
  exit 0
fi

echo "${errors} check(s) failed."
exit 1
