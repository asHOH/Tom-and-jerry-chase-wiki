import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';

import {
  defaultRetainedRowsPath,
  readIgnoredManifest,
  readIgnoredRetainedRows,
  readPreCutoverRetainedRowsBinding,
  resolveIgnoredTmpPath,
  retainedRowsDigest,
  writeRetainedRowsEvidence,
} from './game-data-compaction-evidence.mjs';

test('shares guarded manifest loading and immutable retained evidence across capture and verification', async () => {
  const root = await mkdtemp(join(tmpdir(), 'compaction-evidence-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true });
  try {
    git('init', '--quiet');
    await mkdir(join(root, '.tmp'));
    await writeFile(join(root, '.gitignore'), '.tmp/*\n!.tmp/unignored.json\n');
    const manifestPath = join(root, '.tmp/batch.json');
    const manifest = { rows: [{ id: 'one' }], repository: { head: 'baseline' } };
    await writeFile(manifestPath, JSON.stringify(manifest));
    assert.deepEqual(await readIgnoredManifest(root, '.tmp/batch.json'), {
      manifest,
      manifestPath,
      manifestRelativePath: '.tmp/batch.json',
    });
    for (const path of ['../outside.json', '.tmp/../../outside.json', 'outside.json']) {
      await assert.rejects(readIgnoredManifest(root, path), { code: 'manifest_must_be_under_tmp' });
    }
    await assert.rejects(readIgnoredManifest(root, '.tmp/unignored.json'), {
      code: 'manifest_must_be_ignored',
    });
    await writeFile(join(root, '.tmp/tracked.json'), '{}');
    git('add', '--force', '.tmp/tracked.json');
    await assert.rejects(readIgnoredManifest(root, '.tmp/tracked.json'), {
      code: 'manifest_must_be_ignored',
    });
    for (const content of ['{', 'null', '{}', '{"rows":[]}']) {
      await writeFile(manifestPath, content);
      await assert.rejects(readIgnoredManifest(root, manifestPath), { code: 'invalid_manifest' });
    }

    const retainedPath = await resolveIgnoredTmpPath(
      root,
      defaultRetainedRowsPath(manifestPath, 42),
      'retained_rows'
    );
    assert.equal(retainedPath.relativePath, '.tmp/batch.retained-rows-42.json');
    const evidence = {
      schemaVersion: 1,
      receiptKind: 'preCutoverRetainedRows',
      capturedAt: '2026-09-03T01:00:00.000Z',
      target: { host: 'project.supabase.co', projectRef: 'project' },
      replayEpoch: 42,
      actionRevision: `v1:${'a'.repeat(64)}`,
      snapshotRowCount: 3,
      rowCount: 1,
      rows: [{ id: 'one', entry: '保留内容' }],
    };
    const persisted = await writeRetainedRowsEvidence(retainedPath.path, evidence);
    assert.equal(await readFile(retainedPath.path, 'utf8'), persisted.serialized);
    assert.deepEqual(
      await writeRetainedRowsEvidence(retainedPath.path, { ...evidence, capturedAt: 'later' }),
      persisted
    );
    await assert.rejects(writeRetainedRowsEvidence(retainedPath.path, { ...evidence, rows: [] }), {
      code: 'retained_rows_conflict',
    });
    const { rows: _rows, schemaVersion: _version, ...metadata } = evidence;
    const binding = {
      ...metadata,
      path: retainedPath.relativePath,
      fileDigest: retainedRowsDigest(persisted.serialized),
    };
    manifest.result = { preCutoverRetainedRows: binding };
    assert.equal(readPreCutoverRetainedRowsBinding(manifest).path, retainedPath.relativePath);
    assert.deepEqual(await readIgnoredRetainedRows(root, retainedPath.path, manifest), {
      retained: evidence,
      binding,
      retainedRowsRelativePath: retainedPath.relativePath,
    });
    for (const [change, code] of [
      [{ path: '.tmp/other.json' }, 'retained_rows_path_mismatch'],
      [{ fileDigest: `v1:${'b'.repeat(64)}` }, 'retained_rows_digest_mismatch'],
      [{ replayEpoch: 43 }, 'retained_rows_binding_mismatch'],
      [{ rowCount: null }, 'invalid_pre_cutover_retained_rows_binding'],
    ]) {
      await assert.rejects(
        readIgnoredRetainedRows(root, retainedPath.path, {
          result: { preCutoverRetainedRows: { ...binding, ...change } },
        }),
        { code }
      );
    }
    await writeFile(retainedPath.path, `${persisted.serialized}\n`);
    await assert.rejects(readIgnoredRetainedRows(root, retainedPath.path, manifest), {
      code: 'retained_rows_digest_mismatch',
    });
    await writeFile(retainedPath.path, JSON.stringify({ rows: evidence.rows }));
    const legacy = await readIgnoredRetainedRows(root, retainedPath.path, {});
    assert.equal(legacy.binding, null);
    assert.deepEqual(legacy.retained.rows, evidence.rows);
    await writeFile(retainedPath.path, 'null');
    await assert.rejects(writeRetainedRowsEvidence(retainedPath.path, evidence), {
      code: 'retained_rows_conflict',
    });
    await assert.rejects(readIgnoredRetainedRows(root, retainedPath.path, {}), {
      code: 'invalid_retained_rows',
    });
  } finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    await rm(root, { recursive: true, force: true });
  }
});
