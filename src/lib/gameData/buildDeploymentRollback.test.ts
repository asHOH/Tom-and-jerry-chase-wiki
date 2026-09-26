/** @jest-environment node */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const deployScript = readFileSync('scripts/ops/deploy_server.sh', 'utf8').replaceAll('\r\n', '\n');

describe('VPS build rollback contract', () => {
  it('requires artifacts on candidate releases, including public checks, but can recover an older release', () => {
    const functions = deployScript.slice(
      deployScript.indexOf('summarize_response()'),
      deployScript.indexOf('handle_exit()')
    );
    const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
    const complete = {
      commitSha: '12345678',
      gameDataArtifact: {
        deploymentIdentity: 'test-build',
        replayEpoch: null,
        actionRevision: 'empty',
        rowCount: 0,
      },
    };
    const cases: Array<{
      body: unknown;
      publicBody?: unknown;
      recovery?: boolean;
      status: number;
    }> = [
      { body: complete, status: 0 },
      ...[undefined, null, 'invalid', []].flatMap((gameDataArtifact) => {
        const incomplete = { commitSha: '12345678', gameDataArtifact };
        return [
          { body: incomplete, status: 1 },
          { body: complete, publicBody: incomplete, status: 1 },
        ];
      }),
      { body: { ...complete, commitSha: 'wrong' }, status: 1 },
      { body: { commitSha: '12345678' }, recovery: true, status: 0 },
      { body: { commitSha: 'wrong' }, recovery: true, status: 1 },
    ];
    // Batch the cases in one shell; every case still runs the real endpoint validators.
    const harness = `set -euo pipefail
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
case_count=0
while IFS=$'\t' read -r require_artifact expected_status TEST_VERSION_BODY TEST_PUBLIC_BODY; do
  case_count=$((case_count + 1))
  if wait_for_application_health "$require_artifact"; then actual_status=0; else actual_status=$?; fi
  if [ "$actual_status" -ne "$expected_status" ]; then
    echo "Case $case_count: expected $expected_status, received $actual_status" >&2
    exit 1
  fi
done <<< "$TEST_CASES"
printf 'Verified %s cases' "$case_count"`;
    const result = spawnSync(bash, ['-s'], {
      input: harness,
      encoding: 'utf8',
      env: {
        ...process.env,
        TEST_CASES: cases
          .map(({ body, publicBody = body, recovery, status }) =>
            [recovery ? 0 : 1, status, JSON.stringify(body), JSON.stringify(publicBody)].join('\t')
          )
          .join('\n'),
      },
    });
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Verified ${cases.length} cases`);
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
ACTIVE_RELEASE=active
REPO_ROOT=control
DEPENDENCY_INPUTS_FILE=package.json
calculate_dependency_inputs() { cat package.json; }
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

  it('keeps production intact during builds and recovers a failed cutover using isolated releases', () => {
    const testRoot = mkdtempSync(path.join(tmpdir(), 'tjwiki-deploy-test-'));
    try {
      const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
      const result = spawnSync(bash, ['scripts/ops/deploy_server.test.sh'], {
        encoding: 'utf8',
        timeout: 90_000,
        env: { ...process.env, TEST_ROOT: testRoot },
      });
      expect({
        error: result.error,
        status: result.status,
        output: result.stdout + result.stderr,
      }).toEqual({
        error: undefined,
        status: 0,
        output: expect.stringContaining('Verified isolated release deployments'),
      });
    } finally {
      rmSync(testRoot, { recursive: true, force: true });
    }
  }, 95_000);
});
