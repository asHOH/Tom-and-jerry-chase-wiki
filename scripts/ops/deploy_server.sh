#!/bin/bash
set -euo pipefail

FORCE_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --force-build) FORCE_BUILD=1 ;;
    -h|--help)
      echo "Usage: $0 [--force-build]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg. Usage: $0 [--force-build]" >&2
      exit 2
      ;;
  esac
done

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
PINNED_NPM_VERSION="11.18.0"
ENV_FILE=".env.production"
PM2_APP_NAME="tjwiki"
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
CANDIDATE_RELEASE=""
ACTIVE_RELEASE=""
RETIRED_RELEASE=""
CUTOVER_STARTED_AT=""
CUTOVER_DURATION="0s"

if [ -e "$SCRIPT_DIR/../../.git" ]; then
  COMMON_GIT_DIR="$(git -C "$SCRIPT_DIR/../.." rev-parse --path-format=absolute --git-common-dir)"
  REPO_ROOT="$(cd "$(dirname "$COMMON_GIT_DIR")" && pwd -P)"
  REPO_PARENT_DIR="$(cd "$REPO_ROOT/.." && pwd)"
else
  REPO_PARENT_DIR="$(pwd -P)"
  REPO_ROOT="$REPO_PARENT_DIR/$REPO_DIR"
fi

RELEASES_DIR="$REPO_ROOT.releases"
DEPLOY_STATE_DIR="$REPO_ROOT/.tmp/deploy"
ENV_FILE="$REPO_ROOT/$ENV_FILE"

# PM2 may launch a daemon. It must not inherit the deployment lock.
pm2() {
  command pm2 "$@" 9>&-
}

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
    local total_mb available_mb limit_mb

    total_mb="$(awk '/MemTotal:/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null || echo "")"
    if [ -n "$total_mb" ] && [ "$total_mb" -gt 0 ]; then
      limit_mb=$((total_mb / 2))
      if [ "$limit_mb" -lt 768 ]; then
        limit_mb=768
      fi
      if [ "$limit_mb" -gt 2048 ]; then
        limit_mb=2048
      fi
      available_mb="$(awk '/MemAvailable:/ { print int($2 / 1024) }' /proc/meminfo)"
      if [ -n "$available_mb" ] && [ "$limit_mb" -gt $((available_mb - 1024)) ]; then
        limit_mb=$((available_mb - 1024))
      fi
      if [ "$limit_mb" -lt 768 ]; then
        echo "Fatal: insufficient available RAM for an online build with 1 GiB of headroom. Build off-server or free memory first."
        return 1
      fi

      NODE_MEMORY_LIMIT="$limit_mb"
      echo "Auto-detected V8 old-space limit: ${NODE_MEMORY_LIMIT} MB (system RAM: ${total_mb} MB; reserving available headroom for the live app and native allocations)."
      return 0
    fi
  fi

  NODE_MEMORY_LIMIT="2048"
  echo "Could not detect system RAM. Falling back to a ${NODE_MEMORY_LIMIT} MB V8 old-space limit."
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
  local requested_node
  requested_node="$(git -C "$REPO_ROOT" show "$CURRENT_HASH:.nvmrc")"
  nvm install "$requested_node"
  nvm use --silent "$requested_node" >/dev/null
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

ensure_pm2_cli() {
  if ! type -P pm2 >/dev/null 2>&1; then
    echo "PM2 is not available for the active Node.js version. Installing PM2 globally..."
    if ! npm install -g pm2; then
      echo "Fatal: failed to install PM2 globally for the active Node.js version."
      exit 1
    fi

    hash -r 2>/dev/null || true
  fi

  if ! type -P pm2 >/dev/null 2>&1; then
    echo "Fatal: pm2 is still not available after npm install -g pm2."
    exit 1
  fi

  # Updating the daemon can restart live apps; do that separately from deployment.
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
  local require_artifact="${3:-1}"
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
      if (process.argv[2] === "1" && (
        !body.gameDataArtifact ||
        typeof body.gameDataArtifact !== "object" ||
        Array.isArray(body.gameDataArtifact)
      )) process.exit(1);
    } catch {
      process.exit(1);
    }
  ' "$expected_commit" "$require_artifact"; then
    LAST_HEALTH_CHECK_ERROR="Invalid version response at $url; expected commit ${expected_commit:0:8} (require gameDataArtifact=$require_artifact), received: $(summarize_response "$response")"
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
  local require_artifact="${1:-1}"
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
      check_version_endpoint "$version_url" "$expected_commit" "$require_artifact" &&
      { [ -z "$public_health_url" ] || check_health_endpoint "$public_health_url"; } &&
      { [ -z "$public_version_url" ] || check_version_endpoint "$public_version_url" "$expected_commit" "$require_artifact"; }; then
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
  local require_artifact="${1:-1}"
  local release="$2"

  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    run_quietly pm2 delete "$PM2_APP_NAME" || return 1
  fi
  echo "Starting PM2 app '$PM2_APP_NAME' from $release..."
  ENV_FILE="$release/.env.production" run_quietly pm2 start "$release/$START_SCRIPT" \
    --name "$PM2_APP_NAME" --interpreter bash --cwd "$release" || return 1

  wait_for_application_health "$require_artifact" || return 1
  run_quietly pm2 save
}

find_active_release() {
  ACTIVE_RELEASE="$(pm2 jlist | node -e '
    const fs = require("node:fs");
    const apps = JSON.parse(fs.readFileSync(0, "utf8"));
    const app = apps.find((item) => item.name === process.argv[1]);
    if (app) {
      if (!app.pm2_env?.pm_cwd) process.exit(1);
      process.stdout.write(app.pm2_env.pm_cwd);
    }
  ' "$PM2_APP_NAME")"
  if [ -z "$ACTIVE_RELEASE" ]; then
    return 0
  fi
  ACTIVE_RELEASE="$(cd "$ACTIVE_RELEASE" && pwd -P)"
  if [ "$ACTIVE_RELEASE" != "$REPO_ROOT" ] &&
    [ "$(dirname "$ACTIVE_RELEASE")" != "$RELEASES_DIR" ]; then
    echo "Fatal: PM2 app '$PM2_APP_NAME' uses an unmanaged directory: $ACTIVE_RELEASE"
    return 1
  fi
  PREVIOUS_SOURCE_HASH="$(git -C "$ACTIVE_RELEASE" rev-parse HEAD)"
  verify_active_release
}

verify_active_release() {
  local health_url="${HEALTH_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/health}"
  local version_url="${VERSION_CHECK_URL:-http://127.0.0.1:${PORT:-3000}/api/version}"

  if ! (cd "$ACTIVE_RELEASE" && build_output_is_valid); then
    echo "Fatal: no complete last-known-good source and build output are available."
    return 1
  fi
  if ! check_health_endpoint "$health_url" ||
    ! check_version_endpoint "$version_url" "$PREVIOUS_SOURCE_HASH" 0; then
    echo "Fatal: the existing release could not be verified."
    [ -n "$LAST_HEALTH_CHECK_ERROR" ] && echo "$LAST_HEALTH_CHECK_ERROR"
    return 1
  fi
}

prepare_candidate_release() {
  CANDIDATE_RELEASE="$(mktemp -d "$RELEASES_DIR/${CURRENT_HASH:0:8}-XXXXXXXX")"
  git -C "$REPO_ROOT" worktree add --detach "$CANDIDATE_RELEASE" "$CURRENT_HASH"
  cp -p "$ENV_FILE" "$CANDIDATE_RELEASE/.env.production"
  chmod 600 "$CANDIDATE_RELEASE/.env.production"
  cd "$CANDIDATE_RELEASE"

  local base_release="${ACTIVE_RELEASE:-$REPO_ROOT}"
  if [ "${FORCE_DEPENDENCY_INSTALL:-0}" != "1" ] &&
    [ -f "$base_release/$DEPENDENCY_INPUTS_FILE" ] &&
    [ "$(cat "$base_release/$DEPENDENCY_INPUTS_FILE")" = "$(calculate_dependency_inputs)" ]; then
    echo "Copying matching dependencies into the isolated candidate..."
    cp -a --reflink=auto "$base_release/node_modules" ./node_modules
  fi
  if [ -d "$base_release/.next/cache" ]; then
    mkdir -p .next
    cp -a --reflink=auto "$base_release/.next/cache" .next/cache
  fi
  echo "Candidate directory: $CANDIDATE_RELEASE; the current app remains running."
}

preserve_last_known_good_release() {
  if [ -z "$ACTIVE_RELEASE" ]; then
    return 0
  fi
  verify_active_release || return 1
  LAST_KNOWN_GOOD_DIR="$ACTIVE_RELEASE"
  if [ "$ACTIVE_RELEASE" = "$REPO_ROOT" ]; then
    # One-time migration: retain the legacy release before updating the control checkout.
    LAST_KNOWN_GOOD_DIR="$(mktemp -d "$RELEASES_DIR/${PREVIOUS_SOURCE_HASH:0:8}-legacy-XXXXXXXX")"
    git -C "$REPO_ROOT" worktree add --detach "$LAST_KNOWN_GOOD_DIR" "$PREVIOUS_SOURCE_HASH" || return 1
    cp -a --reflink=auto "$ACTIVE_RELEASE/.next" "$ACTIVE_RELEASE/node_modules" \
      "$LAST_KNOWN_GOOD_DIR/" || return 1
    cp -a --reflink=auto "$ACTIVE_RELEASE/public/." "$LAST_KNOWN_GOOD_DIR/public/" || return 1
    cp -p "$ENV_FILE" "$LAST_KNOWN_GOOD_DIR/.env.production" || return 1
    chmod 600 "$LAST_KNOWN_GOOD_DIR/.env.production" || return 1
  fi
  echo "Retained verified last-known-good release ${PREVIOUS_SOURCE_HASH:0:8} at $LAST_KNOWN_GOOD_DIR."
}

set_release_link() {
  local name="$1" release="$2"
  ln -s "$release" "$DEPLOY_STATE_DIR/$name.$$" || return 1
  mv -Tf "$DEPLOY_STATE_DIR/$name.$$" "$DEPLOY_STATE_DIR/$name"
}

remove_release() {
  local release="$1"
  # Never remove the control checkout, current release, or an unrelated worktree.
  if [ -n "$release" ] && [ "$(dirname "$release")" = "$RELEASES_DIR" ] &&
    [ "$release" != "$ACTIVE_RELEASE" ] &&
    [ "$release" != "$(readlink -f "$DEPLOY_STATE_DIR/current" 2>/dev/null || true)" ]; then
    git -C "$REPO_ROOT" worktree remove --force "$release"
  fi
}

restore_last_known_good_release() {
  if [ -z "$LAST_KNOWN_GOOD_DIR" ]; then
    echo "Fatal: last-known-good release metadata is unavailable; automatic recovery cannot continue."
    return 1
  fi
  echo "Restoring last-known-good release ${PREVIOUS_SOURCE_HASH:0:8}..."
  EXPECTED_COMMIT_SHA="$PREVIOUS_SOURCE_HASH"
  ensure_pm2_process 0 "$LAST_KNOWN_GOOD_DIR" || return 1
  ACTIVE_RELEASE="$LAST_KNOWN_GOOD_DIR"
  set_release_link current "$ACTIVE_RELEASE" || return 1
  ROLLBACK_ARMED=0
  echo "Automatic rollback succeeded; production is serving ${PREVIOUS_SOURCE_HASH:0:8}."
}

handle_exit() {
  local exit_code=$?

  trap - EXIT
  cleanup_child_processes
  if [ "$exit_code" -ne 0 ]; then
    if [ "$ROLLBACK_ARMED" -eq 1 ]; then
      if ! restore_last_known_good_release; then
        echo "Fatal: automatic rollback failed. Releases were retained for manual recovery."
        exit "$exit_code"
      fi
    elif [ -n "$CUTOVER_STARTED_AT" ] && [ -z "$LAST_KNOWN_GOOD_DIR" ]; then
      if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
        run_quietly pm2 delete "$PM2_APP_NAME" || exit "$exit_code"
      fi
      ACTIVE_RELEASE=""
    fi
    cd "$REPO_ROOT" || exit "$exit_code"
    if [ -n "$CANDIDATE_RELEASE" ]; then
      remove_release "$CANDIDATE_RELEASE" || echo "Warning: could not remove failed candidate $CANDIDATE_RELEASE."
    fi
    if [ "$ACTIVE_RELEASE" = "$REPO_ROOT" ] && [ -n "$LAST_KNOWN_GOOD_DIR" ]; then
      remove_release "$LAST_KNOWN_GOOD_DIR" || echo "Warning: could not remove incomplete legacy snapshot $LAST_KNOWN_GOOD_DIR."
    fi
  fi
  exit "$exit_code"
}

# Parse the entry point before resetting the control checkout, which may replace this script.
{
trap handle_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

exec 9>"$REPO_ROOT.deploy.lock"
if ! flock -n 9; then
  echo "Fatal: another deployment is already running."
  exit 1
fi

begin_phase "1/6" "Fetch candidate source"
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
    echo "Fetch successful; the serving checkout is unchanged."
  else
    echo "Fatal: could not update '$TARGET_BRANCH' from origin. The existing application process is unchanged."
    exit 1
  fi
fi

CURRENT_HASH="$(git rev-parse "${TARGET_COMMIT:-origin/$TARGET_BRANCH}^{commit}")"
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

mkdir -p "$RELEASES_DIR" "$DEPLOY_STATE_DIR"
RELEASES_DIR="$(cd "$RELEASES_DIR" && pwd -P)"
find_active_release
RETIRED_RELEASE="$(readlink -f "$DEPLOY_STATE_DIR/previous" 2>/dev/null || true)"

begin_phase "4/6" "Prepare isolated candidate"
cd "${ACTIVE_RELEASE:-$REPO_ROOT}"
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

if [ "$FORCE_BUILD" -eq 1 ]; then
  BUILD_REASONS+=("forced")
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
if [ "${FORCE_DEPENDENCY_INSTALL:-0}" = "1" ] ||
  [ ! -f "$DEPENDENCY_INPUTS_FILE" ] ||
  [ "$(cat "$DEPENDENCY_INPUTS_FILE")" != "$(calculate_dependency_inputs)" ]; then
  BUILD_REASONS+=("dependencies")
fi
# The first deployment must move the process out of the mutable control checkout.
if [ "$ACTIVE_RELEASE" = "$REPO_ROOT" ]; then
  BUILD_REASONS+=("release-migration")
elif [ -z "$ACTIVE_RELEASE" ]; then
  BUILD_REASONS+=("no-active-release")
fi

if [ "${#BUILD_REASONS[@]}" -gt 0 ]; then
  BUILD_REASON_LIST="$(printf '%s, ' "${BUILD_REASONS[@]}")"
  BUILD_REASON_LIST="${BUILD_REASON_LIST%, }"
  echo "Build required; changed inputs: $BUILD_REASON_LIST"
  BUILD_STARTED_AT="$(date +%s)"

  prepare_candidate_release
  install_dependencies
  begin_phase "5/6" "Build while the current release serves"
  npm run set-runtime:node

  report_memory_status

  detect_node_memory_limit

  # Keep build-only limits out of the serving process and any rollback process.
  if NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY_LIMIT" NEXT_CPU_COUNT=1 \
    UV_THREADPOOL_SIZE=1 SKIP_BUILD_CHECKS=true NEXT_TELEMETRY_DISABLED=1 npm run build; then
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
    echo "The existing release was not stopped or modified."
    exit 1
  fi
else
  DEPENDENCY_ACTION="skipped"
  BUILD_ACTION="skipped"
  BUILD_DURATION="skipped"
  begin_phase "5/6" "Reuse verified release"
  echo "Build skipped; source, environment, toolchain, and output match the previous build."
fi

begin_phase "6/6" "Activate and verify application"
if [ -n "$CANDIDATE_RELEASE" ]; then
  preserve_last_known_good_release
  if [ -n "$LAST_KNOWN_GOOD_DIR" ]; then
    ROLLBACK_ARMED=1
  fi
  CUTOVER_STARTED_AT="$(date +%s)"
  echo "Build is ready; beginning the brief PM2 cutover."
  ensure_pm2_process 1 "$CANDIDATE_RELEASE"
  CUTOVER_DURATION="$(format_duration "$(($(date +%s) - CUTOVER_STARTED_AT))")"
  ACTIVE_RELEASE="$CANDIDATE_RELEASE"
  set_release_link current "$ACTIVE_RELEASE"
  if [ -n "$LAST_KNOWN_GOOD_DIR" ]; then
    set_release_link previous "$LAST_KNOWN_GOOD_DIR"
  fi
  ROLLBACK_ARMED=0
  CUTOVER_STARTED_AT=""
  # The primary checkout now holds operator tools; PM2 serves a separate release.
  cd "$REPO_ROOT"
  git reset --hard "$CURRENT_HASH"
  if [ "$RETIRED_RELEASE" != "$LAST_KNOWN_GOOD_DIR" ]; then
    remove_release "$RETIRED_RELEASE" || echo "Warning: could not remove retired release $RETIRED_RELEASE."
  fi
else
  wait_for_application_health
fi

DEPLOY_DURATION_SECONDS="$(($(date +%s) - DEPLOY_STARTED_AT))"
echo
echo "Deployment complete: commit=${CURRENT_HASH:0:8} branch=$TARGET_BRANCH dependencies=$DEPENDENCY_ACTION build=$BUILD_ACTION build_time=$BUILD_DURATION cutover_time=$CUTOVER_DURATION total_time=$(format_duration "$DEPLOY_DURATION_SECONDS") node=$NODE_VERSION npm=$NPM_VERSION pm2=$PM2_VERSION release=$ACTIVE_RELEASE"
}
