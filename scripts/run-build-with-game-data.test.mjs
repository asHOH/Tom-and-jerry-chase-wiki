import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';
import { NextResponse } from 'next/server.js';
import { createJiti } from 'jiti';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

test('build wrapper loads its source modules before validating arguments', async () => {
  await assert.rejects(
    promisify(execFile)(process.execPath, ['scripts/run-build-with-game-data.mjs'], {
      cwd: projectRoot,
      windowsHide: true,
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /usage: run-build-with-game-data\.mjs <internal-output-script>/);
      assert.doesNotMatch(error.stderr, /MODULE_NOT_FOUND/);
      return true;
    }
  );
});

test('compiled version metadata survives artifact cleanup and a fresh runtime', async (t) => {
  const temporaryRoot = path.join(projectRoot, 'tmp');
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(path.join(temporaryRoot, 'version-metadata-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'scripts'));
  for (const name of ['src', 'scripts/lib']) {
    await cp(path.join(projectRoot, name), path.join(directory, name), { recursive: true });
  }
  for (const name of [
    'scripts/run-build-with-game-data.mjs',
    'next.config.ts',
    'csp.config.ts',
    'package.json',
    'tsconfig.json',
  ]) {
    await copyFile(path.join(projectRoot, name), path.join(directory, name));
  }
  const fixture = path.join(directory, 'npm-fixture.cjs');
  const output = path.join(directory, 'compiled-version.json');
  await writeFile(
    fixture,
    `const fs = require('node:fs');
const path = require('node:path');
const requireProject = require('node:module').createRequire(path.join(process.cwd(), 'package.json'));
const { createJiti } = requireProject('jiti');
const { transformSync } = requireProject('esbuild');
const config = createJiti(__filename)(path.join(process.cwd(), 'next.config.ts')).default;
const artifact = JSON.parse(fs.readFileSync(process.env.GAME_DATA_BUILD_ARTIFACT_PATH, 'utf8'));
const source = fs.readFileSync('src/app/api/version/route.ts', 'utf8');
const { code } = transformSync(source, {
  loader: 'ts', format: 'cjs',
  define: Object.fromEntries(Object.entries(config.env).map(([key, value]) => ['process.env.' + key, JSON.stringify(value)])),
});
fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ code, artifact, artifactPath: process.env.GAME_DATA_BUILD_ARTIFACT_PATH }));
`
  );
  await promisify(execFile)(
    process.execPath,
    ['scripts/run-build-with-game-data.mjs', 'build:output'],
    {
      cwd: directory,
      windowsHide: true,
      env: { ...process.env, NEXT_PUBLIC_DISABLE_ARTICLES: '1', npm_execpath: fixture },
    }
  );
  const { code, artifact, artifactPath } = JSON.parse(await readFile(output, 'utf8'));
  await assert.rejects(access(artifactPath), { code: 'ENOENT' });
  const expected = {
    deploymentIdentity: artifact.deploymentIdentity,
    replayEpoch: artifact.approvedActions.replayEpoch,
    actionRevision: `v1:${artifact.approvedActions.checksum}`,
    rowCount: artifact.approvedActions.rowCount,
  };
  const runtimeModule = { exports: {} };
  runInNewContext(code, {
    module: runtimeModule,
    process: { env: { NODE_ENV: 'production' } },
    require(name) {
      if (name === 'next/server') return { NextResponse };
      if (name === '@/env') return { env: { COMMIT_SHA: '12345678' } };
      if (name === '@/../package.json') return { version: '0.1.0' };
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
  });
  for (let request = 0; request < 2; request += 1) {
    const response = await runtimeModule.exports.GET();
    assert.deepEqual((await response.json()).gameDataArtifact, expected);
  }
});

test('replay epoch reader accepts valid epochs and rejects invalid or failed reads', async () => {
  const jiti = createJiti(import.meta.url, {
    alias: {
      'server-only': fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url)),
    },
  });
  const { readApprovedReplayEpoch } = jiti('../src/lib/gameData/approvedReplayEpoch.ts');
  const client = (data, error = null) => ({
    async rpc(name) {
      assert.equal(name, 'read_game_data_approved_replay_epoch');
      return { data, error };
    },
  });

  for (const epoch of [0, 42, Number.MAX_SAFE_INTEGER]) {
    assert.equal(await readApprovedReplayEpoch(client(epoch)), epoch);
  }
  for (const epoch of [null, undefined, -1, 1.5, '42', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(readApprovedReplayEpoch(client(epoch)), /approved_replay_epoch_invalid/);
  }
  const cause = new Error('RPC failed');
  await assert.rejects(readApprovedReplayEpoch(client(null, cause)), {
    message: 'approved_replay_epoch_read_failed',
    cause,
  });
});
