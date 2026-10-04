import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BuildOutputError, runBuildOutput } from './run-build-output.mjs';

test('build output preserves failures and forwards the artifact environment', async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'tjwiki-build-output-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const npmCli = path.join(cwd, 'npm-fixture.mjs');
  await writeFile(
    npmCli,
    `import assert from 'node:assert/strict';
assert.deepEqual(process.argv.slice(2), ['run', 'build:output']);
assert.equal(process.env.GAME_DATA_BUILD_ARTIFACT_PATH, 'test-artifact.json');
assert.equal(process.env.DEPLOY_BUILD_ID, 'test-deployment');
if (process.env.TEST_SIGNAL) process.kill(process.pid, process.env.TEST_SIGNAL);
else process.exit(Number(process.env.TEST_EXIT_CODE));
`
  );
  const env = {
    ...process.env,
    npm_execpath: npmCli,
    GAME_DATA_BUILD_ARTIFACT_PATH: 'test-artifact.json',
    DEPLOY_BUILD_ID: 'test-deployment',
    TEST_SIGNAL: '',
  };

  await runBuildOutput('build:output', { cwd, env: { ...env, TEST_EXIT_CODE: '0' } });
  for (const exitCode of [1, 137, 143]) {
    await assert.rejects(
      runBuildOutput('build:output', { cwd, env: { ...env, TEST_EXIT_CODE: String(exitCode) } }),
      (error) => error instanceof BuildOutputError && error.exitCode === exitCode
    );
  }
  if (process.platform !== 'win32') {
    await assert.rejects(
      runBuildOutput('build:output', { cwd, env: { ...env, TEST_SIGNAL: 'SIGKILL' } }),
      (error) => error instanceof BuildOutputError && error.exitCode === 137
    );
  }
});

test('signal termination uses shell exit codes and unknown termination fails', () => {
  assert.equal(new BuildOutputError(null, 'SIGKILL').exitCode, 137);
  assert.equal(new BuildOutputError(null, 'SIGTERM').exitCode, 143);
  assert.equal(new BuildOutputError(null, null).exitCode, 1);
  assert.throws(() => runBuildOutput('build:output', { env: {} }), /npm_execpath_unavailable/);
});
