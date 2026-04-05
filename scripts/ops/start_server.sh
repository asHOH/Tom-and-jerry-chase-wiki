#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env.production}"

cd "$REPO_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fatal: environment file '$ENV_FILE' was not found."
  exit 1
fi

echo "Loading runtime environment from $ENV_FILE..."
set -a
. "$ENV_FILE"
set +a

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Fatal: NVM is not installed at '$NVM_DIR'."
  exit 1
fi

. "$NVM_DIR/nvm.sh"
nvm use --silent >/dev/null

echo "Starting the application..."
exec npm start
