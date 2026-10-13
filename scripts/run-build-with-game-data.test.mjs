import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
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
