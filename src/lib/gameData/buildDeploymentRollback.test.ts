import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const deployScript = readFileSync('scripts/ops/deploy_server.sh', 'utf8').replaceAll('\r\n', '\n');

describe('VPS build rollback contract', () => {
  it('requires artifacts on candidate releases, including public checks, but can recover an older release', () => {
    const functions = deployScript.slice(
      deployScript.indexOf('summarize_response()'),
      deployScript.indexOf('handle_exit()')
    );
    const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
    const run = (body: unknown, mode = 'candidate', publicBody = body) =>
      spawnSync(
        bash,
        [
          '-c',
          `set -euo pipefail
${functions}
CURRENT_HASH=12345678abcdef
PM2_APP_NAME=test
HEALTH_CHECK_MAX_ATTEMPTS=1
PUBLIC_VERSION_CHECK_URL=public-version
fetch_endpoint() {
  if [[ "$1" == */api/health ]]; then
    FETCH_ENDPOINT_RESPONSE='{"status":"ok"}'
  elif [ "$1" = public-version ]; then
    FETCH_ENDPOINT_RESPONSE="$TEST_PUBLIC_BODY"
  else
    FETCH_ENDPOINT_RESPONSE="$TEST_VERSION_BODY"
  fi
}
ensure_pm2_cli() { :; }
run_quietly() { "$@"; }
pm2() { :; }
if [ "$TEST_MODE" = recovery ]; then
  ensure_pm2_process 0 || exit 1
else
  ensure_pm2_process || exit 1
fi`,
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            TEST_MODE: mode,
            TEST_VERSION_BODY: JSON.stringify(body),
            TEST_PUBLIC_BODY: JSON.stringify(publicBody),
          },
        }
      );
    const complete = {
      commitSha: '12345678',
      gameDataArtifact: {
        deploymentIdentity: 'test-build',
        replayEpoch: null,
        actionRevision: 'empty',
        rowCount: 0,
      },
    };
    const valid = run(complete);
    expect(valid.error).toBeUndefined();
    expect(valid.status).toBe(0);
    for (const gameDataArtifact of [undefined, null, 'invalid', []]) {
      const incomplete = { commitSha: '12345678', gameDataArtifact };
      expect(run(incomplete).status).toBe(1);
      expect(run(complete, 'candidate', incomplete).status).toBe(1);
    }
    expect(run({ ...complete, commitSha: 'wrong' }).status).toBe(1);
    const legacy = { commitSha: '12345678' };
    expect(run(legacy, 'recovery').status).toBe(0);
    expect(run({ commitSha: 'wrong' }, 'recovery').status).toBe(1);
  }, 30_000);

  it('forces a build only when requested and rejects unknown arguments before deployment', () => {
    const preamble = deployScript.slice(0, deployScript.indexOf('SCRIPT_DIR='));
    const decision = deployScript.slice(
      deployScript.indexOf('if [ "$FORCE_BUILD" -eq 1 ]; then'),
      deployScript.indexOf('if [ "${#BUILD_REASONS[@]}" -gt 0 ]; then')
    );
    expect(preamble).not.toContain('begin_phase "1/6"');
    expect(decision).not.toBe('');
    // Execute the real argument parser and build decision; no deployment operations run.
    const harness = `${preamble}
CURRENT_HASH=same
LAST_SOURCE_HASH=same
ENV_FILE_HASH=same
LAST_ENV_HASH=same
NODE_VERSION=same
LAST_NODE_VERSION=same
NPM_VERSION=same
LAST_NPM_VERSION=same
API_RUNTIME=same
LAST_API_RUNTIME=same
BUILD_REASONS=()
build_output_is_valid() { return 0; }
${decision}
printf '%s' "\${BUILD_REASONS[*]}"
`;
    const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
    const run = (...args: string[]) =>
      spawnSync(bash, ['-c', harness, 'deploy-test', ...args], { encoding: 'utf8' });
    const normal = run();
    expect(normal.error).toBeUndefined();
    expect(normal.status).toBe(0);
    expect(normal.stdout).toBe('');
    const forced = run('--force-build');
    expect(forced.status).toBe(0);
    expect(forced.stdout).toBe('forced');
    const invalid = run('--force-buid');
    expect(invalid.status).toBe(2);
    expect(invalid.stderr).toContain('Unknown argument');
  });

  it('preserves a verified source revision and build before stopping production', () => {
    expect(deployScript).toContain('preserve_last_known_good_release()');
    expect(deployScript).toContain('check_health_endpoint "$health_url"');
    expect(deployScript).toContain(
      'check_version_endpoint "$version_url" "$PREVIOUS_SOURCE_HASH" 0'
    );
    expect(deployScript).toContain('cp -a .next "$LAST_KNOWN_GOOD_DIR/.next"');
    const preserveCall = deployScript.search(/^\s+preserve_last_known_good_release\s*$/m);
    const stopCall = deployScript.search(/^\s+stop_pm2_process_for_build\s*$/m);

    expect(preserveCall).toBeGreaterThanOrEqual(0);
    expect(stopCall).toBeGreaterThanOrEqual(0);
    expect(preserveCall).toBeLessThan(stopCall);
  });

  it('arms an exit trap that restores source, output, dependencies, and PM2', () => {
    expect(deployScript).toContain('trap handle_exit EXIT');
    expect(deployScript).toContain('git reset --hard "$rollback_hash"');
    expect(deployScript).toContain('cp -a "$LAST_KNOWN_GOOD_DIR/.next" "$REPO_ROOT/.next"');
    expect(deployScript).toMatch(
      /restore_last_known_good_release\(\)[\s\S]*?install_dependencies[\s\S]*?ensure_pm2_process 0 \|\| return 1/
    );
    expect(deployScript).toContain(
      'Automatic rollback succeeded; production is serving ${rollback_hash:0:8}.'
    );
  });
});
