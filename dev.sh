#!/usr/bin/env bash
###############################################################################
# dev.sh — Local development helper for Wasabi
# Usage: ./dev.sh [command]
###############################################################################

set -e

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# ── Config ────────────────────────────────────────────────────────────────────
MAIN_CLASS="com.intuit.wasabi.Main"
MAIN_MODULE="modules/main"
UI_MODULE="modules/ui"
API_URL="http://localhost:8080/api/v1"
UI_URL="http://localhost:9000"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${BLUE}[wasabi]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

check_docker() {
  docker info >/dev/null 2>&1 || error "Docker is not running. Please start Docker first."
}

wait_healthy() {
  local name=$1
  local max=30
  local count=0
  log "Waiting for $name to be healthy..."
  while [ $count -lt $max ]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "not found")
    if [ "$status" = "healthy" ]; then
      success "$name is healthy"
      return 0
    fi
    sleep 2
    count=$((count + 1))
  done
  error "$name did not become healthy in time"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_start_db() {
  check_docker
  log "Starting databases..."
  docker compose up -d cassandra mysql
  wait_healthy "wasabi-cassandra"
  wait_healthy "wasabi-mysql"
  success "Databases are up"
}

cmd_migrate() {
  check_docker
  log "Running Cassandra migrations..."
  docker compose up wasabi-keyspace
  docker compose up wasabi-migration
  success "Migrations complete"
}

cmd_start_backend() {
  log "Starting Java backend..."
  log "Backend will be available at $API_URL/ping"
  cd "$MAIN_MODULE" && mvn exec:java "-Dexec.mainClass=$MAIN_CLASS"
}

cmd_start_frontend() {
  log "Starting frontend..."
  log "UI will be available at $UI_URL"
  cd "$UI_MODULE" && grunt serve
}

cmd_build() {
  log "Building project (skipping tests)..."
  mvn clean install -DskipTests
  success "Build complete"
}

cmd_status() {
  check_docker
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Wasabi Status${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Docker services
  for name in wasabi-cassandra wasabi-mysql; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "stopped")
    if [ "$status" = "healthy" ]; then
      echo -e "  ${GREEN}●${NC} $name — healthy"
    else
      echo -e "  ${RED}●${NC} $name — $status"
    fi
  done

  # Backend API
  if curl -s "$API_URL/ping" >/dev/null 2>&1; then
    echo -e "  ${GREEN}●${NC} backend — running ($API_URL)"
  else
    echo -e "  ${RED}●${NC} backend — not running"
  fi

  # Frontend
  if curl -s "$UI_URL" >/dev/null 2>&1; then
    echo -e "  ${GREEN}●${NC} frontend — running ($UI_URL)"
  else
    echo -e "  ${RED}●${NC} frontend — not running"
  fi

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Ping details
  if curl -s "$API_URL/ping" >/dev/null 2>&1; then
    echo -e "${BLUE}Health check:${NC}"
    curl -s "$API_URL/ping" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/ping"
    echo ""
  fi
}

cmd_stop() {
  check_docker
  log "Stopping all Docker services..."
  docker compose down
  success "All services stopped"
}

cmd_reset() {
  warn "This will delete all data and re-run migrations!"
  read -p "Are you sure? (y/N) " confirm
  [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && { log "Aborted."; exit 0; }

  check_docker
  log "Stopping services..."
  docker compose down -v

  log "Starting fresh databases..."
  cmd_start_db

  log "Running migrations..."
  cmd_migrate

  success "Reset complete — databases are fresh"
}

cmd_logs() {
  service=${2:-cassandra}
  log "Showing logs for: $service"
  docker logs "wasabi-$service" --tail=50 -f
}

cmd_ping() {
  log "Pinging API..."
  curl -s "$API_URL/ping" | python3 -m json.tool 2>/dev/null || \
  curl -i "$API_URL/ping"
}

usage() {
  echo ""
  echo -e "${BLUE}Wasabi Dev Helper${NC}"
  echo ""
  echo "Usage: ./dev.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start-db       Start Cassandra + MySQL"
  echo "  migrate        Run Cassandra keyspace + schema migrations"
  echo "  backend        Start Java backend (port 8080)"
  echo "  frontend       Start Angular UI (port 9000)"
  echo "  build          Build all Maven modules"
  echo "  status         Show status of all services"
  echo "  stop           Stop all Docker services"
  echo "  reset          Wipe data and re-run migrations"
  echo "  logs [service] Tail logs (cassandra|mysql)"
  echo "  ping           Ping the API health endpoint"
  echo ""
  echo "Typical workflow:"
  echo "  1. ./dev.sh start-db"
  echo "  2. ./dev.sh migrate"
  echo "  3. ./dev.sh backend     (in a new terminal)"
  echo "  4. ./dev.sh frontend    (in a new terminal)"
  echo "  5. ./dev.sh status"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
case "${1}" in
  start-db)  cmd_start_db ;;
  migrate)   cmd_migrate ;;
  backend)   cmd_start_backend ;;
  frontend)  cmd_start_frontend ;;
  build)     cmd_build ;;
  status)    cmd_status ;;
  stop)      cmd_stop ;;
  reset)     cmd_reset ;;
  logs)      cmd_logs "$@" ;;
  ping)      cmd_ping ;;
  *)         usage ;;
esac
