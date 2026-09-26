#!/bin/bash
# Runs through Jest in an isolated temporary directory. Real Git/worktrees/files;
# only the external runtime, build, and endpoint responses are simulated.
set -euo pipefail
DEPLOY_SCRIPT="$(pwd)/scripts/ops/deploy_server.sh"
TEST_ROOT="$(cd "${TEST_ROOT:?Jest must supply a temporary directory}" && pwd -P)"
export TEST_ROOT
cd "$TEST_ROOT"

git init -q -b develop upstream
cd upstream
git config user.email deploy-test@example.invalid
git config user.name deploy-test
git config commit.gpgsign false
git config core.hooksPath /dev/null
mkdir -p scripts/ops public
printf 'old-source\n' > source.txt
printf '24\n' > .nvmrc
printf '{}\n' > package.json
printf '{}\n' > package-lock.json
printf '#!/bin/bash\n' > scripts/ops/start_server.sh
printf 'old-public\n' > public/image.txt
printf '.next/\nnode_modules/\n.env.production\n.tmp/\npublic/sw.js\n' > .gitignore
git add .
git commit -qm old
export OLD_HASH="$(git rev-parse HEAD)"
cd "$TEST_ROOT"
git clone -q upstream Tom-and-jerry-chase-wiki
export CONTROL="$TEST_ROOT/Tom-and-jerry-chase-wiki"
cd upstream
printf 'new-source\n' > source.txt
printf 'new-public\n' > public/image.txt
git add .
git commit -qm candidate
export NEW_HASH="$(git rev-parse HEAD)"

mkdir -p "$CONTROL/.next/server" "$CONTROL/.next/static" "$CONTROL/.next/cache" "$CONTROL/node_modules"
printf 'old-build\n' > "$CONTROL/.next/BUILD_ID"
printf 'old-cache\n' > "$CONTROL/.next/cache/value"
printf 'old-dependency\n' > "$CONTROL/node_modules/value"
printf 'old-worker\n' > "$CONTROL/public/sw.js"
printf 'TEST_ENV=production\n' > "$CONTROL/.env.production"
printf '{"commitSha":"%.8s"}\n' "$OLD_HASH" > "$CONTROL/.next/version.json"
printf '%s' "$CONTROL" > "$TEST_ROOT/active"

cat > "$TEST_ROOT/mocks.sh" <<'MOCKS'
ensure_nvm() { :; }
ensure_pinned_npm() { :; }
ensure_pm2_cli() { :; }
detect_node_memory_limit() { NODE_MEMORY_LIMIT=768; }
report_memory_status() { :; }
cleanup_child_processes() { :; }
sleep() { :; }
# Git Bash lacks flock and native directory symlinks on some Windows machines.
if [[ "$(uname -s)" == MINGW* ]]; then
  flock() { :; }
  set_release_link() { printf '%s' "$2" > "$DEPLOY_STATE_DIR/$1"; }
  readlink() {
    if [[ "${@: -1}" == */.tmp/deploy/* ]]; then cat "${@: -1}"; else command readlink "$@"; fi
  }
fi
assert_live_files() {
  local live
  live="$(cat "$TEST_ROOT/active")"
  [ "$live" != "$PWD" ]
  [ "$(cat "$live/.next/BUILD_ID")" = "$EXPECTED_LIVE_BUILD" ]
  [ "$(cat "$live/node_modules/value")" = "$EXPECTED_LIVE_DEPENDENCY" ]
  [ "$(git -C "$CONTROL" rev-parse HEAD)" = "$EXPECTED_CONTROL_HASH" ]
}
npm() {
  case "$*" in
    --version) echo 11.18.0 ;;
    ci*)
      assert_live_files || return 90
      echo install >> "$TEST_ROOT/events"
      [ "$TEST_MODE" != install-fail ] || return 1
      mkdir -p node_modules
      echo new-dependency > node_modules/value
      ;;
    'run set-runtime:node')
      assert_live_files || return 90
      ;;
    'run build')
      assert_live_files || return 90
      [ "$NEXT_CPU_COUNT" = 1 ] && [ "$SKIP_BUILD_CHECKS" = true ] || return 91
      echo build >> "$TEST_ROOT/events"
      mkdir -p .next/cache
      echo changed-cache > .next/cache/value
      [ "$(cat "$(cat "$TEST_ROOT/active")/.next/cache/value")" = "$EXPECTED_LIVE_CACHE" ] || return 92
      [ "$TEST_MODE" != build-fail ] || return 1
      mkdir -p .next/server .next/static
      echo new-build > .next/BUILD_ID
      echo new-worker > public/sw.js
      printf '{"commitSha":"%.8s","gameDataArtifact":{}}\n' "$CURRENT_HASH" > .next/version.json
      echo build-complete >> "$TEST_ROOT/events"
      ;;
    *) echo "Unexpected npm command: $*" >&2; return 93 ;;
  esac
}
pm2() {
  local live=""
  if [ -f "$TEST_ROOT/active" ]; then live="$(cat "$TEST_ROOT/active")"; fi
  case "$1" in
    --version) echo 7.0.4 ;;
    jlist)
      if [ -n "$live" ]; then
        printf '[{"name":"tjwiki","pm2_env":{"pm_cwd":"%s"}}]' "$live"
      else echo '[]'; fi
      ;;
    describe) [ -n "$live" ] ;;
    delete)
      grep -q build-complete "$TEST_ROOT/events" || return 94
      echo delete >> "$TEST_ROOT/events"
      rm -f "$TEST_ROOT/active"
      ;;
    start)
      local release="${@: -1}"
      [ "$2" = "$release/scripts/ops/start_server.sh" ] || return 95
      [ "$ENV_FILE" = "$release/.env.production" ] || return 96
      [ "${SKIP_BUILD_CHECKS:-}" != true ] || return 97
      echo "start $release" >> "$TEST_ROOT/events"
      if [ "$TEST_MODE" = start-fail ] && [ "$(git -C "$release" rev-parse HEAD)" = "$NEW_HASH" ]; then
        return 1
      fi
      printf '%s' "$release" > "$TEST_ROOT/active"
      ;;
    save|logs) : ;;
    *) echo "Unexpected PM2 mutation: $*" >&2; return 98 ;;
  esac
}
fetch_endpoint() {
  local live="$(cat "$TEST_ROOT/active")"
  if [[ "$1" == */api/health ]]; then
    FETCH_ENDPOINT_RESPONSE='{"status":"ok"}'
  elif [ "$TEST_MODE" = activate-fail ] && [ "$(git -C "$live" rev-parse HEAD)" = "$NEW_HASH" ]; then
    FETCH_ENDPOINT_RESPONSE='{"commitSha":"wrong"}'
  else
    FETCH_ENDPOINT_RESPONSE="$(cat "$live/.next/version.json")"
  fi
}
HEALTH_CHECK_MAX_ATTEMPTS=1
MOCKS

# Inject fakes after real functions are defined, then execute the real entry point.
sed '/^trap handle_exit EXIT/i source "$TEST_ROOT/mocks.sh"' "$DEPLOY_SCRIPT" | tr -d '\r' > "$TEST_ROOT/deploy.sh"
export EXPECTED_LIVE_BUILD=old-build EXPECTED_LIVE_DEPENDENCY=old-dependency
export EXPECTED_LIVE_CACHE=old-cache EXPECTED_CONTROL_HASH="$OLD_HASH"
cd "$TEST_ROOT"

run_deploy() {
  local expected="$1"
  export TEST_MODE="$2"
  shift 2
  : > events
  local status=0
  bash deploy.sh "$@" > output 2>&1 || status=$?
  if [ "$status" -ne "$expected" ]; then cat output; echo "Unexpected status for $TEST_MODE: $status"; exit 1; fi
}

for mode in install-fail build-fail; do
  run_deploy 1 "$mode"
  ! grep -q delete events
  [ "$(cat active)" = "$CONTROL" ]
  [ "$(cat "$CONTROL/public/sw.js")" = old-worker ]
  [ "$(git -C "$CONTROL" rev-parse HEAD)" = "$OLD_HASH" ]
  [ "$(git -C "$CONTROL" worktree list --porcelain | grep -c '^worktree ')" -eq 1 ]
done

for mode in start-fail activate-fail; do
  run_deploy 1 "$mode"
  grep -q 'Automatic rollback succeeded' output
  rollback="$(cat active)"
  [ "$rollback" != "$CONTROL" ]
  [ "$(cat "$rollback/.next/BUILD_ID")" = old-build ]
  [ "$(cat "$rollback/node_modules/value")" = old-dependency ]
  [ "$(cat "$rollback/public/sw.js")" = old-worker ]
  [ "$(git -C "$CONTROL" rev-parse HEAD)" = "$OLD_HASH" ]
done

run_deploy 0 success
grep -q 'cutover_time=' output
first_release="$(cat active)"
[ "$first_release" != "$CONTROL" ]
[ "$(cat "$first_release/public/image.txt")" = new-public ]
[ "$(git -C "$CONTROL" rev-parse HEAD)" = "$NEW_HASH" ]
[ -d "$rollback" ]
export EXPECTED_LIVE_BUILD=new-build EXPECTED_LIVE_DEPENDENCY=new-dependency
export EXPECTED_LIVE_CACHE=changed-cache EXPECTED_CONTROL_HASH="$NEW_HASH"

run_deploy 0 success
grep -q 'build=skipped' output
[ ! -s events ]
[ "$(cat active)" = "$first_release" ]

run_deploy 0 success --force-build
second_release="$(cat active)"
[ "$second_release" != "$first_release" ]
grep -q 'dependencies=skipped' output
[ -d "$first_release" ]
[ ! -d "$rollback" ]

run_deploy 1 build-fail --force-build
! grep -q delete events
[ "$(cat active)" = "$second_release" ]
[ -d "$first_release" ]
[ "$(git -C "$CONTROL" worktree list --porcelain | grep -c '^worktree ')" -eq 3 ]
echo 'Verified isolated release deployments'
