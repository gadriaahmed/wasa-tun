#!/usr/bin/env bash
###############################################################################
# Start (or stop) the React UI Vite dev server on port 3000.
###############################################################################
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UI_DIR="${ROOT}/modules/ui-react"
PID_FILE="${ROOT}/.ui-react.pid"
LOG_FILE="${ROOT}/.ui-react.log"

usage() {
  cat <<EOF
usage: $(basename "$0") {start|stop|status|restart}

  start    Install deps if needed and run Vite dev server (background)
  stop     Stop the background dev server
  status   Show whether the dev server is running
  restart  Stop then start
EOF
}

port_pids() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti :3000 2>/dev/null || true
  fi
}

ensure_env() {
  cd "${UI_DIR}"
  if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
  fi
  if [ ! -d node_modules ]; then
    echo "==> Installing React UI dependencies..."
    npm install
  fi
}

prepare_sources() {
  cd "${UI_DIR}"
  rm -rf node_modules/.vite
  rm -f vite.config.js vitest.config.js
  find src -name '*.js' -delete 2>/dev/null || true
  find src -name '*.js.map' -delete 2>/dev/null || true
}

is_running() {
  curl -sf http://localhost:3000/ >/dev/null 2>&1
}

write_port_pid() {
  local port_pid
  port_pid="$(port_pids | head -1 || true)"
  if [ -n "${port_pid}" ]; then
    echo "${port_pid}" >"${PID_FILE}"
  fi
}

start_server() {
  if is_running; then
    write_port_pid
    echo "React UI dev server already running (pid $(cat "${PID_FILE}" 2>/dev/null || echo unknown))"
    echo "  http://localhost:3000"
    return 0
  fi

  stale_pids="$(port_pids)"
  if [ -n "${stale_pids}" ]; then
    echo "==> Stopping stale process on port 3000..."
    kill ${stale_pids} 2>/dev/null || true
    sleep 1
  fi

  ensure_env
  prepare_sources
  cd "${UI_DIR}"

  if [ ! -x node_modules/.bin/vite ]; then
    echo "error: Vite binary missing — run: (cd modules/ui-react && npm install)" >&2
    exit 1
  fi

  echo "==> Starting React UI dev server..."
  : >"${LOG_FILE}"
  nohup ./node_modules/.bin/vite >>"${LOG_FILE}" 2>&1 &
  launcher_pid=$!
  disown "${launcher_pid}" 2>/dev/null || true
  echo "${launcher_pid}" >"${PID_FILE}"

  for _ in $(seq 1 30); do
    if is_running; then
      write_port_pid
      echo "React UI: http://localhost:3000  (log: ${LOG_FILE})"
      return 0
    fi
    if ! kill -0 "${launcher_pid}" 2>/dev/null; then
      echo "error: React UI failed to start. Log:" >&2
      tail -30 "${LOG_FILE}" >&2 || true
      rm -f "${PID_FILE}"
      exit 1
    fi
    sleep 1
  done

  echo "error: React UI did not become ready on :3000. Log:" >&2
  tail -30 "${LOG_FILE}" >&2 || true
  exit 1
}

stop_server() {
  if [ -f "${PID_FILE}" ]; then
    pid="$(cat "${PID_FILE}")"
    if kill -0 "${pid}" 2>/dev/null; then
      echo "==> Stopping React UI dev server (pid ${pid})..."
      kill "${pid}" 2>/dev/null || true
      sleep 1
      kill -9 "${pid}" 2>/dev/null || true
    fi
    rm -f "${PID_FILE}"
  fi

  stale_pids="$(port_pids)"
  if [ -n "${stale_pids}" ]; then
    kill ${stale_pids} 2>/dev/null || true
    sleep 1
    kill -9 ${stale_pids} 2>/dev/null || true
  fi

  echo "React UI dev server stopped"
}

status_server() {
  if is_running; then
    write_port_pid
    echo "React UI dev server running"
    echo "  http://localhost:3000"
    if [ -f "${PID_FILE}" ]; then
      echo "  pid $(cat "${PID_FILE}")"
    fi
    return 0
  fi

  rm -f "${PID_FILE}"
  echo "React UI dev server is not running"
  echo "  Start with: ./bin/ui-react-dev.sh start"
  exit 1
}

cmd="${1:-start}"
case "${cmd}" in
  start) start_server ;;
  stop) stop_server ;;
  restart) stop_server; start_server ;;
  status) status_server ;;
  -h|--help|help) usage ;;
  *) echo "error: unknown command: ${cmd}" >&2; usage; exit 1 ;;
esac
