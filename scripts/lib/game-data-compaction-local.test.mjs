import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createJiti } from 'jiti';

import { parseArgs } from '../verify-game-data-compaction.mjs';

const execFileAsync = promisify(execFile);
const projectDir = fileURLToPath(new URL('../..', import.meta.url));
const args = ['--manifest=.tmp/manifest.json', '--patched-ref=HEAD'];

test('local checks need no deployment and cannot write cutover evidence', () => {
  assert.equal(parseArgs([...args, '--mode=local']).productionOrigin, undefined);
  assert.throws(() => parseArgs([...args, '--mode=local', '--write-manifest']), {
    code: 'local_mode_is_read_only',
  });
  assert.throws(() => parseArgs(args), { code: 'required_argument_missing' });
  assert.throws(() => parseArgs([...args, '--mode=post-cutover']), {
    code: 'required_argument_missing',
  });
});

test(
  'local CLI proves parity without a deployment, keeps evidence read-only, and rejects changed rows',
  { timeout: 180_000 },
  async () => {
    const jiti = createJiti(import.meta.url, {
      alias: {
        '@': join(projectDir, 'src'),
        'server-only': join(projectDir, 'scripts/lib/server-only-stub.mjs'),
      },
    });
    const { getCanonicalGameData } = jiti('../../src/lib/gameData/published/canonicalSources.ts');
    const [id, item] = Object.entries(getCanonicalGameData('items')).find(
      ([, value]) => typeof value.description === 'string'
    );
    const row = {
      id: 'a5d26d1f-d3a4-4d6b-aea5-000000000001',
      entity_type: 'items',
      entry: {
        op: 'set',
        path: `${id}.description`,
        oldValue: item.description,
        newValue: item.description,
      },
      created_at: '2026-09-25T00:00:00.000Z',
      status: 'approved',
      is_public: true,
      message: null,
      reviewed_at: null,
      created_by: null,
    };
    const requests = [];
    const server = createServer((request, response) => {
      requests.push(request.url);
      assert.equal(request.url, '/rest/v1/rpc/read_game_data_approved_replay_snapshot');
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify([{ replay_epoch: 1, action_rows: [row] }]));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const testRoot = await mkdtemp(join(projectDir, '.tmp/compaction-local-test-'));
    const manifestPath = join(testRoot, 'manifest.json');
    try {
      const { stdout: head } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
        cwd: projectDir,
        windowsHide: true,
      });
      const manifest = {
        repository: { head: head.trim() },
        rows: [
          {
            id: row.id,
            createdAt: row.created_at,
            entityType: row.entity_type,
            status: 'approved',
            isPublic: true,
            actionCount: 1,
          },
        ],
      };
      const serialized = JSON.stringify(manifest);
      await writeFile(manifestPath, serialized);
      const commandArgs = [
        'scripts/verify-game-data-compaction.mjs',
        '--mode=local',
        `--manifest=${manifestPath}`,
        `--patched-ref=${head.trim()}`,
      ];
      const options = {
        cwd: projectDir,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${server.address().port}`,
          SUPABASE_SECRET_KEY: 'local-test',
          NEXT_PUBLIC_DISABLE_ARTICLES: '0',
        },
      };
      const { stdout } = await execFileAsync(process.execPath, commandArgs, options);
      const report = JSON.parse(stdout);
      assert.equal(report.mode, 'local');
      assert.equal(report.wroteManifest, false);
      assert.equal(report.evidence.production, null);
      assert.equal(report.evidence.parity.proven, true);
      assert.equal(report.evidence.idempotence.proven, true);
      assert.deepEqual(report.evidence.actionPatch.verifiedRowIds, [row.id]);
      assert.equal(requests.length, 2);
      assert.equal(await readFile(manifestPath, 'utf8'), serialized);

      manifest.rows[0].actionCount = 2;
      await writeFile(manifestPath, JSON.stringify(manifest));
      await assert.rejects(execFileAsync(process.execPath, commandArgs, options), (error) => {
        assert.equal(JSON.parse(error.stderr).error.code, 'manifest_changed');
        return true;
      });
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      // Only remove the directory created for this test inside the ignored workspace area.
      assert.ok(relative(join(projectDir, '.tmp'), testRoot).startsWith('compaction-local-test-'));
      await rm(testRoot, { recursive: true, force: true });
    }
  }
);
