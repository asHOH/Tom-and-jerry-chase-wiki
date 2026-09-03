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
# Node.js memory limit in MB. Leave empty to auto-detect from available RAM.
NODE_MEMORY_LIMIT="${NODE_MEMORY_LIMIT:-auto}"
PINNED_NPM_VERSION="11.19.1"
ENV_FILE=".env.production"
PM2_APP_NAME="tjwiki"
PM2_DAEMON_VERSION_CHECKED=0
START_SCRIPT="scripts/ops/start_server.sh"
DEPENDENCY_INPUTS_FILE="node_modules/.tjwiki_dependency_inputs"
DEPENDENCY_INSTALL_POLICY="npm-ci-ignore-scripts-v1"
LAST_HEALTH_CHECK_ERROR=""
FETCH_ENDPOINT_RESPONSE=""
DEPLOY_STARTED_AT="$(date +%s)"
DEPENDENCY_ACTION="not-started"
PREVIOUS_SOURCE_HASH=""
LAST_KNOWN_GOOD_DIR=""
ROLLBACK_ARMED=0

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

run_quietly() {
  local output exit_code

  if output="$("$@" 2>&1)"; then
    return 0
  else
    exit_code=$?
  fi

  if [ -n "$output" ]; then
    printf '%s\n' "$output" >&2
  fi
  return "$exit_code"
}

begin_phase() {
  echo
  echo "[deploy $1] $2"
}

format_duration() {
  local total_seconds="$1"
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))

  if [ "$minutes" -gt 0 ]; then
    printf '%dm %ds' "$minutes" "$seconds"
  else
    printf '%ds' "$seconds"
  fi
}

report_memory_status() {
  local summary

  summary="$(free -h 2>/dev/null | awk '/^Mem:/ { print $7 " available / " $2 " total" }')" || true
  echo "Memory before build: ${summary:-unavailable}."
}

load_env_file() {
  set -a
  . "$ENV_FILE"
  set +a
}

cleanup_child_processes() {
  local child_pids

  child_pids="$(ps -o pid= --ppid "$$" 2>/dev/null | tr -d ' ' || true)"
  if [ -z "$child_pids" ]; then
    return 0
  fi

  kill $child_pids 2>/dev/null || true
  sleep 1

  child_pids="$(ps -o pid= --ppid "$$" 2>/dev/null | tr -d ' ' || true)"
  if [ -n "$child_pids" ]; then
    kill -9 $child_pids 2>/dev/null || true
  fi
}

detect_node_memory_limit() {
  if [ -n "$NODE_MEMORY_LIMIT" ] && [ "$NODE_MEMORY_LIMIT" != "auto" ]; then
    return 0
  fi

  if [ -r /proc/meminfo ]; then
    local total_mb limit_mb

    total_mb="$(awk '/MemTotal:/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null || echo "")"
    if [ -n "$total_mb" ] && [ "$total_mb" -gt 0 ]; then
      limit_mb=$((total_mb / 2))
      if [ "$limit_mb" -lt 768 ]; then
        limit_mb=768
      fi
      if [ "$limit_mb" -gt 2048 ]; then
        limit_mb=2048
      fi

      NODE_MEMORY_LIMIT="$limit_mb"
      echo "Auto-detected Node.js memory limit: ${NODE_MEMORY_LIMIT} MB (system RAM: ${total_mb} MB)."
      return 0
    fi
  fi

  NODE_MEMORY_LIMIT="2048"
  echo "Could not detect system RAM. Falling back to ${NODE_MEMORY_LIMIT} MB for Node.js."
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

ensure_pinned_npm() {
  local current_npm

  current_npm="$(npm --version 2>/dev/null || echo "")"
  if [ "$current_npm" = "$PINNED_NPM_VERSION" ]; then
    return 0
  fi

  echo "Installing pinned npm version $PINNED_NPM_VERSION..."
  if ! (cd "${TMPDIR:-/tmp}" && npm install -g "npm@$PINNED_NPM_VERSION"); then
    echo "Fatal: failed to install npm@$PINNED_NPM_VERSION."
    exit 1
  fi

  hash -r 2>/dev/null || true
  current_npm="$(npm --version 2>/dev/null || echo "")"
  if [ "$current_npm" != "$PINNED_NPM_VERSION" ]; then
    echo "Fatal: expected npm $PINNED_NPM_VERSION, found ${current_npm:-unknown}."
    exit 1
  fi
}

calculate_dependency_inputs() {
  local npmrc_hash="missing"

  if [ -f ".npmrc" ]; then
    npmrc_hash="$(sha256sum .npmrc | awk '{ print $1 }')"
  fi

  {
    printf 'package_json=%s\n' "$(sha256sum package.json | awk '{ print $1 }')"
    printf 'package_lock=%s\n' "$(sha256sum package-lock.json | awk '{ print $1 }')"
    printf 'npmrc=%s\n' "$npmrc_hash"
    printf 'node=%s\n' "$NODE_VERSION"
    printf 'npm=%s\n' "$NPM_VERSION"
    printf 'platform=%s\n' "$(uname -s)"
    printf 'architecture=%s\n' "$(uname -m)"
    printf 'install_policy=%s\n' "$DEPENDENCY_INSTALL_POLICY"
  } | sha256sum | awk '{ print $1 }'
}

install_dependencies() {
  local current_inputs previous_inputs=""

  current_inputs="$(calculate_dependency_inputs)"
  if [ -f "$DEPENDENCY_INPUTS_FILE" ]; then
    previous_inputs="$(cat "$DEPENDENCY_INPUTS_FILE" 2>/dev/null || true)"
  fi

  if [ "${FORCE_DEPENDENCY_INSTALL:-0}" = "1" ]; then
    echo "Dependency installation forced by FORCE_DEPENDENCY_INSTALL=1."
  elif [ -d "node_modules" ] && [ "$current_inputs" = "$previous_inputs" ]; then
    DEPENDENCY_ACTION="skipped"
    echo "Dependencies skipped; manifest, lockfile, npm configuration, toolchain, and platform are unchanged."
    return 0
  fi

  echo "Installing project dependencies from package-lock.json..."
  rm -f "$DEPENDENCY_INPUTS_FILE"

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

    if npm ci --ignore-scripts --loglevel=error --registry "$registry"; then
      printf '%s\n' "$current_inputs" > "$DEPENDENCY_INPUTS_FILE"
      DEPENDENCY_ACTION="installed"
      echo "Dependencies installed successfully."
      return 0
    fi

    if [ "$attempt" -eq 3 ]; then
      echo "Fatal: npm ci failed after 3 attempts."
      exit 1
    fi

    echo "npm ci failed. Retrying in 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
  done
}

build_output_is_valid() {
  [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ] && [ -d ".next/static" ]
}

sync_pm2_daemon_version() {
  local report daemon_version cli_version

  if [ "$PM2_DAEMON_VERSION_CHECKED" -eq 1 ]; then
    return 0
  fi

  report="$(pm2 report 2>/dev/null || true)"
  daemon_version="$(
    printf '%s\n' "$report" |
      sed -n 's/^[[:space:]]*pm2d version[[:space:]]*:[[:space:]]*//p' |
      head -n 1
  )"
  cli_version="$(
    printf '%s\n' "$report" |
      sed -n 's/^[[:space:]]*local pm2[[:space:]]*:[[:space:]]*//p' |
      head -n 1
  )"

  if [ -n "$daemon_version" ] && [ "$daemon_version" = "$cli_version" ]; then
    PM2_DAEMON_VERSION_CHECKED=1
    return 0
  fi

  echo "Updating the in-memory PM2 daemon to match the installed CLI..."
  if ! pm2 update; then
    echo "Fatal: failed to update the in-memory PM2 daemon."
    exit 1
  fi
  PM2_DAEMON_VERSION_CHECKED=1
}

ensure_pm2_cli() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "PM2 is not available for the active Node.js version. Installing PM2 globally..."
    if ! npm install -g pm2; then
      echo "Fatal: failed to install PM2 globally for the active Node.js version."
      exit 1
    fi

    hash -r 2>/dev/null || true
  fi

  if ! command -v pm2 >/dev/null 2>&1; then
    echo "Fatal: pm2 is still not available after npm install -g pm2."
    exit 1
  fi

  sync_pm2_daemon_version
}

stop_pm2_process_for_build() {
  ensure_pm2_cli

  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "Stopping PM2 app '$PM2_APP_NAME' before rebuilding .next..."
    run_quietly pm2 stop "$PM2_APP_NAME"
  fi
}

clean_build_output() {
  echo "Cleaning generated build output while preserving .next/cache..."
  if [ -d ".next/cache" ]; then
    find .next -mindepth 1 -maxdepth 1 ! -name cache -exec rm -rf -- {} +
  else
    rm -rf .next
  fi
  rm -f public/sw.js public/workbox-*.js
}

summarize_response() {
  printf '%s' "$1" | tr '\r\n' ' ' | cut -c1-500
}

fetch_endpoint() {
  local url="$1"

  if ! FETCH_ENDPOINT_RESPONSE="$(
    curl --fail --silent --show-error --location \
      --connect-timeout 2 --max-time 5 "$url" 2>&1
  )"; then
    LAST_HEALTH_CHECK_ERROR="Request to $url failed: $(summarize_response "$FETCH_ENDPOINT_RESPONSE")"
    return 1
  fi
}

check_health_endpoint() {
  local url="$1"
  local response

  if ! fetch_endpoint "$url"; then
    return 1
  fi
  response="$FETCH_ENDPOINT_RESPONSE"

  if ! printf '%s' "$response" | node -e '
    const fs = require("node:fs");
    try {
      const body = JSON.parse(fs.readFileSync(0, "utf8"));
      if (body?.status !== "ok") process.exit(1);
    } catch {
      process.exit(1);
    }
  '; then
    LAST_HEALTH_CHECK_ERROR="Unexpected health response from $url: $(summarize_response "$response")"
    return 1
  fi
}

check_version_endpoint() {
  local url="$1"
  local expected_commit="$2"
  local response

  if ! fetch_endpoint "$url"; then
    return 1
  fi
  response="$FETCH_ENDPOINT_RESPONSE"

  if ! printf '%s' "$response" | node -e '
    const fs = require("node:fs");
    const expected = process.argv[1].slice(0, 8);
    try {
      const body = JSON.parse(fs.readFileSync(0, "utf8"));
      if (body?.commitSha !== expected) process.exit(1);
    } catch {
      process.exit(1);
    }
  ' "$expected_commit"; then
    LAST_HEALTH_CHECK_ERROR="Version mismatch at $url; expected ${expected_commit:0:8}, received: $(summarize_response "$response")"
    return 1
  fi
}

report_application_failure() {
  if [ -n "$LAST_HEALTH_CHECK_ERROR" ]; then
    echo "Last verification error: $LAST_HEALTH_CHECK_ERROR"
  fi

  echo "PM2 process details:"
  pm2 describe "$PM2_APP_NAME" || true
  echo "Recent PM2 logs:"
  pm2 logs "$PM2_APP_NAME" --lines 100 --nostream || true
}

wait_for_application_health() {
  local health_url="${HEALTH_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/health}"
  local version_url="${VERSION_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/version}"
  local public_health_url="${PUBLIC_HEALTH_CHECK_URL:-}"
  local public_version_url="${PUBLIC_VERSION_CHECK_URL:-}"
  local expected_commit="${EXPECTED_COMMIT_SHA:-$CURRENT_HASH}"
  local max_attempts="${HEALTH_CHECK_MAX_ATTEMPTS:-30}"
  local retry_delay="${HEALTH_CHECK_RETRY_DELAY_SECONDS:-2}"
  local attempt=1

  if [[ ! "$max_attempts" =~ ^[1-9][0-9]*$ ]]; then
    echo "Fatal: HEALTH_CHECK_MAX_ATTEMPTS must be a positive integer, found '$max_attempts'."
    return 1
  fi
  if [[ ! "$retry_delay" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    echo "Fatal: HEALTH_CHECK_RETRY_DELAY_SECONDS must be a non-negative number, found '$retry_delay'."
    return 1
  fi

  echo "Waiting for application verification at $health_url..."
  echo "Expecting deployed commit ${expected_commit:0:8} from $version_url."
  if [ -n "$public_health_url" ]; then
    echo "Public health verification is enabled at $public_health_url."
  fi
  if [ -n "$public_version_url" ]; then
    echo "Public version verification is enabled at $public_version_url."
  fi

  while [ "$attempt" -le "$max_attempts" ]; do
    LAST_HEALTH_CHECK_ERROR=""
    if check_health_endpoint "$health_url" &&
      check_version_endpoint "$version_url" "$expected_commit" &&
      { [ -z "$public_health_url" ] || check_health_endpoint "$public_health_url"; } &&
      { [ -z "$public_version_url" ] || check_version_endpoint "$public_version_url" "$expected_commit"; }; then
      echo "Application verification passed on attempt $attempt; commit ${expected_commit:0:8} is serving."
      return 0
    fi

    if [ "$attempt" -lt "$max_attempts" ]; then
      if [ "$attempt" -eq 1 ]; then
        echo "Application is starting; verification is not ready yet (attempt $attempt/$max_attempts)."
      elif [ $((attempt % 5)) -eq 0 ]; then
        echo "Verification attempt $attempt/$max_attempts failed: $LAST_HEALTH_CHECK_ERROR"
      fi
      sleep "$retry_delay"
    fi
    attempt=$((attempt + 1))
  done

  echo "Fatal: application verification failed after $max_attempts attempts."
  report_application_failure
  return 1
}

ensure_pm2_process() {
  ensure_pm2_cli

  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "Reloading PM2 app '$PM2_APP_NAME'..."
    run_quietly pm2 reload "$PM2_APP_NAME" --update-env
  else
    echo "Starting PM2 app '$PM2_APP_NAME'..."
    run_quietly pm2 start "$START_SCRIPT" --name "$PM2_APP_NAME" --interpreter bash --cwd "$PWD"
  fi

  wait_for_application_health
  run_quietly pm2 save
}

preserve_last_known_good_release() {
  local health_url="${HEALTH_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/health}"
  local version_url="${VERSION_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/version}"

  if [ -z "$PREVIOUS_SOURCE_HASH" ] || ! build_output_is_valid; then
    echo "Fatal: no complete last-known-good source and build output are available."
    return 1
  fi
  if ! pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1 ||
    ! check_health_endpoint "$health_url" ||
    ! check_version_endpoint "$version_url" "$PREVIOUS_SOURCE_HASH"; then
    echo "Fatal: the existing release could not be verified before the candidate build."
    [ -n "$LAST_HEALTH_CHECK_ERROR" ] && echo "$LAST_HEALTH_CHECK_ERROR"
    return 1
  fi

  LAST_KNOWN_GOOD_DIR="$REPO_ROOT/.tmp/deploy-last-known-good"
  rm -rf -- "$LAST_KNOWN_GOOD_DIR"
  mkdir -p "$LAST_KNOWN_GOOD_DIR/public"
  cp -a .next "$LAST_KNOWN_GOOD_DIR/.next"
  find public -maxdepth 1 -type f \
    \( -name 'sw.js*' -o -name 'swe-worker-*' -o -name 'workbox-*' -o -name 'fallback-*' -o -name 'version.json' \) \
    -exec cp -a -- {} "$LAST_KNOWN_GOOD_DIR/public/" \;
  printf '%s\n' "$PREVIOUS_SOURCE_HASH" > "$LAST_KNOWN_GOOD_DIR/source-revision"
  ROLLBACK_ARMED=1
  echo "Preserved verified last-known-good release ${PREVIOUS_SOURCE_HASH:0:8}."
}

restore_last_known_good_release() {
  local rollback_hash

  ROLLBACK_ARMED=0
  if [ -z "$LAST_KNOWN_GOOD_DIR" ] || [ ! -f "$LAST_KNOWN_GOOD_DIR/source-revision" ]; then
    echo "Fatal: last-known-good release metadata is unavailable; automatic recovery cannot continue."
    return 1
  fi
  rollback_hash="$(cat "$LAST_KNOWN_GOOD_DIR/source-revision")"
  echo "Restoring last-known-good release ${rollback_hash:0:8}..."

  git reset --hard "$rollback_hash"
  rm -rf -- "$REPO_ROOT/.next"
  cp -a "$LAST_KNOWN_GOOD_DIR/.next" "$REPO_ROOT/.next"
  find public -maxdepth 1 -type f \
    \( -name 'sw.js*' -o -name 'swe-worker-*' -o -name 'workbox-*' -o -name 'fallback-*' -o -name 'version.json' \) \
    -delete
  find "$LAST_KNOWN_GOOD_DIR/public" -maxdepth 1 -type f -exec cp -a -- {} public/ \;

  # A candidate may have changed package-lock.json and node_modules before it
  # failed, so restore the dependency set for the preserved source as well.
  install_dependencies
  CURRENT_HASH="$rollback_hash"
  EXPECTED_COMMIT_SHA="$rollback_hash"
  ensure_pm2_process
  echo "Automatic rollback succeeded; production is serving ${rollback_hash:0:8}."
}

handle_exit() {
  local exit_code=$?

  trap - EXIT
  cleanup_child_processes
  if [ "$exit_code" -ne 0 ] && [ "$ROLLBACK_ARMED" -eq 1 ]; then
    if ! restore_last_known_good_release; then
      echo "Fatal: automatic rollback failed. Manual recovery is required."
    fi
  fi
  exit "$exit_code"
}

trap handle_exit EXIT

begin_phase "1/6" "Update source"
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
  PREVIOUS_SOURCE_HASH="$(git rev-parse HEAD)"

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
    echo "Fatal: could not update '$TARGET_BRANCH' from origin. The existing application process is unchanged."
    exit 1
  fi
fi

CURRENT_HASH="$(git rev-parse HEAD)"
echo "Resolved source: branch=$TARGET_BRANCH commit=$CURRENT_HASH"

begin_phase "2/6" "Load production environment"
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

begin_phase "3/6" "Prepare runtime tools"
ensure_nvm
ensure_pinned_npm
ensure_pm2_cli

NODE_VERSION="$(node --version)"
NPM_VERSION="$(npm --version)"
PM2_VERSION="$(pm2 --version 2>/dev/null | tail -n 1)"
echo "Runtime tools: node=$NODE_VERSION npm=$NPM_VERSION pm2=$PM2_VERSION"

begin_phase "4/6" "Install dependencies"
install_dependencies

begin_phase "5/6" "Evaluate and build application"
BUILD_INPUTS_FILE=".next/.build_inputs"
API_RUNTIME="nodejs"
ENV_FILE_HASH="$(sha256sum "$ENV_FILE" | awk '{ print $1 }')"
LAST_SOURCE_HASH=""
LAST_ENV_HASH=""
LAST_NODE_VERSION=""
LAST_NPM_VERSION=""
LAST_API_RUNTIME=""
BUILD_REASONS=()

export COMMIT_SHA="$CURRENT_HASH"
export NEXT_PUBLIC_BUILD_TIMESTAMP="$(git show -s --format=%cI "$CURRENT_HASH")"

if [ -f "$BUILD_INPUTS_FILE" ]; then
  IFS=$'\t' read -r LAST_SOURCE_HASH LAST_ENV_HASH LAST_NODE_VERSION LAST_NPM_VERSION LAST_API_RUNTIME < "$BUILD_INPUTS_FILE" || true
fi

if [ "$CURRENT_HASH" != "$LAST_SOURCE_HASH" ]; then
  BUILD_REASONS+=("source")
fi
if [ "$ENV_FILE_HASH" != "$LAST_ENV_HASH" ]; then
  BUILD_REASONS+=("environment")
fi
if [ "$NODE_VERSION" != "$LAST_NODE_VERSION" ] ||
  [ "$NPM_VERSION" != "$LAST_NPM_VERSION" ] ||
  [ "$API_RUNTIME" != "$LAST_API_RUNTIME" ]; then
  BUILD_REASONS+=("toolchain")
fi
if ! build_output_is_valid; then
  BUILD_REASONS+=("output")
fi

if [ "${#BUILD_REASONS[@]}" -gt 0 ]; then
  BUILD_REASON_LIST="$(printf '%s, ' "${BUILD_REASONS[@]}")"
  BUILD_REASON_LIST="${BUILD_REASON_LIST%, }"
  echo "Build required; changed inputs: $BUILD_REASON_LIST"
  BUILD_STARTED_AT="$(date +%s)"

  if [ -n "$PREVIOUS_SOURCE_HASH" ] && build_output_is_valid; then
    preserve_last_known_good_release
  elif pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "Fatal: PM2 is running but no complete last-known-good release can be preserved."
    exit 1
  else
    echo "No existing production release is running; proceeding without a rollback candidate."
  fi
  stop_pm2_process_for_build
  clean_build_output

  npm run set-runtime:node

  report_memory_status

  detect_node_memory_limit

  export NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY_LIMIT"
  export NEXT_CPU_COUNT=1
  export UV_THREADPOOL_SIZE=1
  export SKIP_BUILD_CHECKS=true
  export NEXT_TELEMETRY_DISABLED=1

  if npm run build; then
    if ! build_output_is_valid; then
      echo "Fatal: build completed but .next output is missing required production files."
      exit 1
    fi

    mkdir -p .next
    printf '%s\t%s\t%s\t%s\t%s\n' \
      "$CURRENT_HASH" "$ENV_FILE_HASH" "$NODE_VERSION" "$NPM_VERSION" "$API_RUNTIME" \
      > "$BUILD_INPUTS_FILE"
    BUILD_ACTION="built"
    BUILD_DURATION_SECONDS="$(($(date +%s) - BUILD_STARTED_AT))"
    BUILD_DURATION="$(format_duration "$BUILD_DURATION_SECONDS")"
    echo "Build successful in $BUILD_DURATION."
  else
    BUILD_EXIT_CODE=$?
    echo "Fatal: build failed with exit code $BUILD_EXIT_CODE."
    if [ "$BUILD_EXIT_CODE" -eq 137 ]; then
      echo "(Exit code 137 usually indicates out of memory.)"
    fi
    echo "The app process may have been stopped before build to avoid serving mutated .next output."
    exit 1
  fi
else
  BUILD_ACTION="skipped"
  BUILD_DURATION="skipped"
  echo "Build skipped; source, environment, toolchain, and output match the previous build."
fi

begin_phase "6/6" "Activate and verify application"
ensure_pm2_process
ROLLBACK_ARMED=0
if [ -n "$LAST_KNOWN_GOOD_DIR" ]; then
  rm -rf -- "$LAST_KNOWN_GOOD_DIR"
fi

DEPLOY_DURATION_SECONDS="$(($(date +%s) - DEPLOY_STARTED_AT))"
echo
echo "Deployment complete: commit=${CURRENT_HASH:0:8} branch=$TARGET_BRANCH dependencies=$DEPENDENCY_ACTION build=$BUILD_ACTION build_time=$BUILD_DURATION total_time=$(format_duration "$DEPLOY_DURATION_SECONDS") node=$NODE_VERSION npm=$NPM_VERSION pm2=$PM2_VERSION"
