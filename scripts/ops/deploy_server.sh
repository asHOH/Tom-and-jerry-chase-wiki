#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="Tom-and-jerry-chase-wiki"
REPO_URL="https://github.com/asHOH/Tom-and-jerry-chase-wiki.git"
# Alternative URL if you need mirroring
# REPO_URL="https://githubfast.com/asHOH/Tom-and-jerry-chase-wiki.git"
TARGET_BRANCH="develop"
# Set this to a specific commit hash to deploy that version. Leave empty to deploy the latest.
TARGET_COMMIT=""
# Node.js memory limit in MB. Adjust based on server capacity (for example, 2560 for a 4 GB VPS).
NODE_MEMORY_LIMIT="2048"
ENV_FILE=".env.production"
PM2_APP_NAME="tjwiki"
START_SCRIPT="scripts/ops/start_server.sh"

if [ -d "$SCRIPT_DIR/../../.git" ]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
  REPO_PARENT_DIR="$(cd "$REPO_ROOT/.." && pwd)"
else
  REPO_PARENT_DIR="$(pwd)"
  REPO_ROOT="$REPO_PARENT_DIR/$REPO_DIR"
fi

run_with_retry() {
  local max_attempts="$1"
  shift

  local attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "Attempt $attempt of $max_attempts..."
    if "$@"; then
      return 0
    fi

    if [ "$attempt" -eq "$max_attempts" ]; then
      break
    fi

    echo "Command failed. Retrying in 5 seconds..."
    sleep 5
    attempt=$((attempt + 1))
  done

  echo "Warning: command failed after $max_attempts attempts."
  return 1
}

run_git_with_retry() {
  run_with_retry 5 git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=60 "$@"
}

load_env_file() {
  set -a
  . "$ENV_FILE"
  set +a
}

ensure_nvm() {
  if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    echo "NVM not found or installation is incomplete. Installing or reinstalling NVM..."
    rm -rf "$HOME/.nvm"
    export NVM_SOURCE="https://gitee.com/mirrors/nvm.git"
    if ! curl --connect-timeout 15 -o- https://gitee.com/mirrors/nvm/raw/master/install.sh | bash; then
      echo "Fatal: NVM installation failed. Please check network or logs."
      exit 1
    fi
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "Fatal: NVM is still not correctly installed after attempting installation."
    exit 1
  fi

  . "$NVM_DIR/nvm.sh"
  echo "Ensuring correct Node.js version is installed..."
  nvm install
  nvm use --silent >/dev/null
}

install_dependencies() {
  echo "Installing or updating project dependencies..."

  local attempt=1
  while [ "$attempt" -le 3 ]; do
    echo "Attempt $attempt of 3..."

    local registry="https://registry.npmjs.org/"
    if [ "$attempt" -eq 1 ]; then
      registry="https://registry.npmmirror.com/"
      echo "Using npmmirror.com for the first attempt..."
    else
      echo "Falling back to registry.npmjs.org..."
    fi

    if npm install --ignore-scripts --registry "$registry"; then
      echo "Dependencies installed successfully."
      return 0
    fi

    if [ "$attempt" -eq 3 ]; then
      echo "Fatal: npm install failed after 3 attempts."
      exit 1
    fi

    echo "npm install failed. Retrying in 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
  done
}

ensure_pm2_process() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "Fatal: pm2 is not installed. Install PM2 before running deployments."
    exit 1
  fi

  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "Reloading PM2 app '$PM2_APP_NAME'..."
    pm2 reload "$PM2_APP_NAME" --update-env
  else
    echo "Starting PM2 app '$PM2_APP_NAME'..."
    pm2 start "$START_SCRIPT" --name "$PM2_APP_NAME" --interpreter bash --cwd "$PWD"
  fi

  pm2 save
}

# 1. Clone or update the repository.
if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "Cloning repository..."
  cd "$REPO_PARENT_DIR"
  if ! run_git_with_retry clone --branch "$TARGET_BRANCH" --single-branch "$REPO_URL"; then
    echo "Fatal: initial clone failed. Cannot continue."
    exit 1
  fi
  cd "$REPO_ROOT"
else
  echo "Repository exists. Attempting to update..."
  cd "$REPO_ROOT"

  if run_git_with_retry fetch origin "$TARGET_BRANCH"; then
    echo "Update successful."
    if [ -n "$TARGET_COMMIT" ]; then
      echo "Resetting to specific commit: $TARGET_COMMIT"
      git reset --hard "$TARGET_COMMIT"
    else
      echo "Resetting to the latest version."
      git reset --hard "origin/$TARGET_BRANCH"
    fi
  else
    echo "Could not update from remote. Starting with the existing local code."
  fi
fi

# 2. Set up production environment variables.
if [ ! -f "$ENV_FILE" ]; then
  if [ -f ".env.example" ]; then
    echo "Production environment file '$ENV_FILE' not found. Creating it from .env.example..."
    cp .env.example "$ENV_FILE"
    echo "Created '$ENV_FILE' from .env.example."
  else
    echo "Production environment file '$ENV_FILE' not found. Create it and run this script again."
  fi
  exit 1
fi

echo "Loading production environment variables from $ENV_FILE..."
load_env_file

# 3. Ensure Node.js is available.
ensure_nvm

# 4. Install dependencies.
install_dependencies

# 5. Build the application only if code has changed.
BUILD_HASH_FILE=".next/.build_hash"
CURRENT_HASH="$(git rev-parse HEAD)"
LAST_BUILD_HASH=""

export COMMIT_SHA="$CURRENT_HASH"
export NEXT_PUBLIC_BUILD_TIMESTAMP="$(git show -s --format=%cI "$CURRENT_HASH")"

if [ -f "$BUILD_HASH_FILE" ]; then
  LAST_BUILD_HASH="$(cat "$BUILD_HASH_FILE")"
fi

if [ "$CURRENT_HASH" != "$LAST_BUILD_HASH" ]; then
  echo "Code has changed since the last build. Building application..."
  npm run set-runtime:node

  echo "Memory status before build:"
  free -h 2>/dev/null || echo "Unable to check memory"

  export NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY_LIMIT"
  export NEXT_CPU_COUNT=1
  export UV_THREADPOOL_SIZE=1
  export SKIP_BUILD_CHECKS=true
  export NEXT_TELEMETRY_DISABLED=1

  if npm run build; then
    echo "Build successful."
    mkdir -p .next
    echo "$CURRENT_HASH" > "$BUILD_HASH_FILE"
  else
    BUILD_EXIT_CODE=$?
    echo "Fatal: build failed with exit code $BUILD_EXIT_CODE."
    if [ "$BUILD_EXIT_CODE" -eq 137 ]; then
      echo "(Exit code 137 usually indicates out of memory.)"
    fi
    echo "Keeping the existing app process unchanged."
    exit 1
  fi
else
  echo "No code changes detected. Skipping build."
fi

# 6. Start or reload the runtime process.
ensure_pm2_process
