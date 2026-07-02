#!/usr/bin/env bash
# Resolve mvn on PATH or common Homebrew locations.
set -euo pipefail

if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
fi

for candidate in \
  /opt/homebrew/bin/mvn \
  /usr/local/bin/mvn \
  "${HOME}/homebrew/bin/mvn"; do
  if [ -x "${candidate}" ]; then
    exec "${candidate}" "$@"
  fi
done

echo "error: Maven (mvn) not found." >&2
echo "Install: brew install maven" >&2
echo "Or add Maven to PATH, e.g. in ~/.zshrc:" >&2
echo '  export PATH="/opt/homebrew/bin:$PATH"' >&2
exit 1
