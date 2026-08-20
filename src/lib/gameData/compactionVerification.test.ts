import type { Action } from '@/lib/edit/diffUtils';

import {
  createCanonicalCompactionDigest,
  encodeCanonicalCompactionValue,
  findCompactionValueDifferences,
  verifyCompactionManifestRows,
  verifySetActionIdempotence,
  type CompactionSnapshotRow,
} from './compactionVerification';

const set = (path: string, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue: undefined,
  newValue,
});

const snapshotRow = (
  rowId: string,
  actions: readonly Action[] = [set('item.description', rowId)]
): CompactionSnapshotRow => ({
  rowId,
  createdAt: `2026-07-28T00:00:0${rowId}.000Z`,
  entityType: 'items',
  status: 'approved',
  actions,
});

describe('compaction verification', () => {
  it('creates canonical digests independent of object-key order while preserving array order', () => {
    const first = createCanonicalCompactionDigest({ b: 2, a: [1, undefined] });
    const reordered = createCanonicalCompactionDigest({ a: [1, undefined], b: 2 });
    const reversedArray = createCanonicalCompactionDigest({ a: [undefined, 1], b: 2 });

    expect(first).toEqual(reordered);
    expect(reversedArray.digest).not.toBe(first.digest);
    expect(encodeCanonicalCompactionValue({ missing: undefined })).not.toBe(
      encodeCanonicalCompactionValue({})
    );
  });

  it('rejects non-plain, non-finite, and cyclic values', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    expect(() => createCanonicalCompactionDigest(new Date())).toThrow(/plain objects/u);
    expect(() => createCanonicalCompactionDigest(Number.NaN)).toThrow(/finite numbers/u);
    expect(() => createCanonicalCompactionDigest(cyclic)).toThrow(/cycles/u);
  });

  it('detects manifest order, metadata, and previously bound digest drift', () => {
    const rows = [snapshotRow('1'), snapshotRow('2')];
    const manifestRows = rows.map((row) => ({
      id: row.rowId,
      createdAt: row.createdAt,
      entityType: row.entityType,
      status: row.status,
      isPublic: true,
      actionCount: row.actions.length,
      contentDigest: `digest-${row.rowId}`,
    }));
    const digests = { '1': 'digest-1', '2': 'digest-2' };

    expect(verifyCompactionManifestRows(manifestRows, rows, digests)).toEqual({
      unchanged: true,
      failures: [],
    });
    expect(
      verifyCompactionManifestRows(
        [{ ...manifestRows[1]!, status: 'pending' }, manifestRows[0]!],
        rows,
        { ...digests, '2': 'changed' }
      )
    ).toEqual({
      unchanged: false,
      failures: expect.arrayContaining([
        expect.objectContaining({ code: 'manifest_order_mismatch' }),
        expect.objectContaining({ code: 'manifest_row_mismatch', field: 'status' }),
        expect.objectContaining({ code: 'content_digest_mismatch', rowId: '2' }),
      ]),
    });
  });

  it('proves only concrete set actions idempotent', () => {
    expect(verifySetActionIdempotence([snapshotRow('1'), snapshotRow('2')])).toMatchObject({
      proven: true,
      actionCount: 2,
      operationCounts: { set: 2 },
      failures: [],
    });

    expect(
      verifySetActionIdempotence([
        snapshotRow('1', [
          set('item.description', undefined),
          { op: 'add', path: 'item.aliases.0', oldValue: undefined, newValue: 'alias' },
        ]),
      ])
    ).toMatchObject({
      proven: false,
      failures: [
        expect.objectContaining({ code: 'missing_set_value' }),
        expect.objectContaining({ code: 'non_set_operation' }),
      ],
    });
  });

  it('reports bounded structural paths for parity diagnostics', () => {
    expect(
      findCompactionValueDifferences(
        { actor: { tags: ['first'], removed: true } },
        { actor: { tags: ['changed', 'added'] } },
        3
      )
    ).toEqual([
      { path: '$.actor.removed', code: 'missing_after' },
      { path: '$.actor.tags[0]', code: 'value_mismatch' },
      { path: '$.actor.tags[1]', code: 'missing_before' },
    ]);
  });
});
