import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createVerifierFailure } from '../cutover-game-data-compaction.mjs';

test('cutover forwards sanitized verifier causes and discards unstructured child errors', () => {
  const cause = { code: 'production_artifact_mismatch', failures: [{ field: 'replayEpoch' }] };
  for (const code of ['preflight_failed', 'post_check_failed']) {
    const error = createVerifierFailure(code, {
      code: 1,
      stderr: JSON.stringify({ error: cause }),
      message: 'Command failed: private command arguments',
    });
    assert.equal(error.code, code);
    assert.deepEqual(error.details, { exitCode: 1, verifierError: cause });
    for (const stderr of ['private unstructured output', '{}', '{"error":[]}']) {
      const fallback = createVerifierFailure(code, { code: 1, stderr });
      assert.deepEqual(fallback.details, { exitCode: 1, verifierError: undefined });
    }
  }
});

test('the cutover CLI includes its real preflight failure without contacting the database', () => {
  const result = spawnSync(
    process.execPath,
    [
      'scripts/cutover-game-data-compaction.mjs',
      '--manifest=outside-tmp.json',
      '--patched-ref=HEAD',
      '--production-origin=https://example.invalid',
    ],
    {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:1' },
    }
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stderr), {
    error: {
      code: 'preflight_failed',
      exitCode: 1,
      verifierError: { code: 'manifest_must_be_under_tmp' },
    },
  });
});
