#!/usr/bin/env bash
###############################################################################
# One-time build of the frozen legacy AngularJS UI (Grunt + Bower).
# Output is committed under modules/ui/dist/ — normal builds only copy that tree.
###############################################################################
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}/modules/ui"

# Grunt 0.4 + old Bower break on Node 17+ (primordials). Prefer Node 16 via nvm.
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use >/dev/null 2>&1 || nvm install
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: Node.js is required (use Node 16: nvm install 16 && nvm use 16)."
  exit 1
fi

node_major="$(node -e "process.stdout.write(process.versions.node.split('.')[0])")"
if [ "${node_major}" -ge 17 ]; then
  echo "error: Node $(node -v) is too new for Grunt 0.4."
  echo "Use Node 16:  cd modules/ui && nvm install && nvm use"
  exit 1
fi

echo "Using Node $(node -v)"

npm install --legacy-peer-deps
./node_modules/.bin/grunt build

if [ ! -f dist/index.html ]; then
  echo "error: grunt build did not produce dist/index.html"
  exit 1
fi

echo ""
echo "Legacy UI built at modules/ui/dist/"
echo "Commit that directory, then use ./bin/dev.sh or ./bin/build.sh for normal builds."
