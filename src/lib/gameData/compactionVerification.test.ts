import type { Action } from '@/lib/edit/diffUtils';

import { applyCheckedActionRow } from './checkedActionReplay';
import {
  applyCompactionReconciliation,
  createCanonicalCompactionDigest,
  encodeCanonicalCompactionValue,
  findCompactionValueDifferences,
  readCompactionReconciliation,
  resolveCompactionManifestSelection,
  verifyCompactionActionIdempotence,
  verifyCompactionArtifactMetadata,
  verifyCompactionManifestRows,
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
  it('allows exact reviewed values in either direction without masking other changes', () => {
    const before = { characters: { example: { tags: ['old'], description: 'unchanged' } } };
    const after = { characters: { example: { tags: ['new'], description: 'unchanged' } } };
    const changes = [{ path: ['characters', 'example', 'tags'], before: ['old'], after: ['new'] }];
    expect(applyCompactionReconciliation(before, changes, 'forward')).toEqual(after);
    expect(applyCompactionReconciliation(after, changes, 'reverse')).toEqual(before);
    expect(before.characters.example.tags).toEqual(['old']);
    const unexpected = structuredClone(after);
    unexpected.characters.example.description = 'unexpected';
    expect(applyCompactionReconciliation(before, changes, 'forward')).not.toEqual(unexpected);
    expect(() => applyCompactionReconciliation(after, changes, 'forward')).toThrow(
      'value_mismatch'
    );
    expect(() =>
      applyCompactionReconciliation(before, [...changes, ...changes], 'forward')
    ).toThrow('overlapping');
    expect(() =>
      applyCompactionReconciliation(before, [{ ...changes[0], path: ['missing'] }], 'forward')
    ).toThrow('path_missing');
    expect(() =>
      applyCompactionReconciliation(before, [{ ...changes[0], path: ['__proto__'] }], 'forward')
    ).toThrow('invalid');
    expect(() =>
      readCompactionReconciliation({ reason: 'approved', publishedChanges: [] })
    ).toThrow('invalid');
    expect(readCompactionReconciliation(undefined)).toBeUndefined();
  });
  it('keeps manifest rows as the backward-compatible cutover set', () => {
    const rows = [{ id: 'cutover-1' }, { id: 'cutover-2' }];

    expect(resolveCompactionManifestSelection(rows, {})).toEqual({
      success: true,
      value: {
        cutoverRowIds: ['cutover-1', 'cutover-2'],
        verificationDependencyRowIds: [],
        verificationRowIds: ['cutover-1', 'cutover-2'],
      },
    });
    expect(
      resolveCompactionManifestSelection(rows, {
        cutoverRowIds: ['cutover-1', 'cutover-2'],
        verificationDependencyRowIds: ['dependency-1'],
      })
    ).toEqual({
      success: true,
      value: {
        cutoverRowIds: ['cutover-1', 'cutover-2'],
        verificationDependencyRowIds: ['dependency-1'],
        verificationRowIds: ['cutover-1', 'cutover-2', 'dependency-1'],
      },
    });
  });

  it('rejects ambiguous cutover and verification dependency roles', () => {
    const rows = [{ id: 'cutover-1' }, { id: 'cutover-2' }];

    expect(
      resolveCompactionManifestSelection(rows, {
        cutoverRowIds: ['cutover-2', 'cutover-1'],
        verificationDependencyRowIds: ['cutover-1', 'dependency-1', 'dependency-1'],
      })
    ).toEqual({
      success: false,
      failures: expect.arrayContaining([
        { code: 'cutover_row_ids_mismatch' },
        { code: 'verification_dependency_overlaps_cutover', rowId: 'cutover-1' },
        { code: 'duplicate_verification_dependency_id', rowId: 'dependency-1' },
      ]),
    });
  });

  it('binds production proof to a concrete build artifact and frozen snapshot', () => {
    const expected = { replayEpoch: 42, actionRevision: 'v1:revision', rowCount: 3 };

    expect(
      verifyCompactionArtifactMetadata({ deploymentIdentity: 'build-1', ...expected }, expected)
    ).toEqual({ proven: true, mismatchedFields: [] });
    expect(
      verifyCompactionArtifactMetadata(
        { deploymentIdentity: '', replayEpoch: 41, actionRevision: 'old', rowCount: 2 },
        expected
      )
    ).toEqual({
      proven: false,
      mismatchedFields: ['deploymentIdentity', 'replayEpoch', 'actionRevision', 'rowCount'],
    });
  });

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

  it('accepts concrete sets and rejects missing values and array additions', () => {
    expect(verifyCompactionActionIdempotence([snapshotRow('1'), snapshotRow('2')])).toMatchObject({
      proven: true,
      actionCount: 2,
      operationCounts: { set: 2 },
      failures: [],
    });

    expect(
      verifyCompactionActionIdempotence([
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

  it('accepts a temporary property delete and preserves the result on repeated row replay', () => {
    const actions: Action[] = [
      set('actor.skills.0.cancelableAftercast', ['跳跃键']),
      {
        op: 'delete',
        path: 'actor.skills.0.cancelableAftercast',
        oldValue: ['跳跃键'],
        newValue: undefined,
      },
      set('actor.skills.0.aftercast', 0),
      set('actor.skills.0.cancelableAftercast', '无后摇'),
    ];
    expect(verifyCompactionActionIdempotence([snapshotRow('1', actions)])).toMatchObject({
      proven: true,
      operationCounts: { set: 3, delete: 1 },
      failures: [],
    });
    const expected = { actor: { skills: [{ aftercast: 0, cancelableAftercast: '无后摇' }] } };
    const target = structuredClone(expected);
    for (let run = 0; run < 2; run += 1) {
      expect(applyCheckedActionRow({ rowId: '1', actions, targets: [target] }).success).toBe(true);
      expect(target).toEqual(expected);
    }
  });

  it.each([
    ['array index', 'item.aliases.0', [set('item.aliases.0', 'restored')]],
    ['array length', 'item.aliases.length', [set('item.aliases.length', 1)]],
    ['root', 'item', [set('item', {})]],
    ['no restoration', 'item.value', []],
    ['missing restoration value', 'item.value', [set('item.value', undefined)]],
    ['ancestor write', 'item.value', [set('item', {}), set('item.value', 'restored')]],
    ['trimmed ancestor write', 'item.value', [set(' item ', {}), set('item.value', 'restored')]],
    ['descendant write', 'item.value', [set('item.value.child', 1), set('item.value', 'restored')]],
  ] as const)('rejects a delete with %s', (_label, path, following) => {
    const actions: Action[] = [
      set(path, 'initial'),
      { op: 'delete', path, oldValue: 'initial', newValue: undefined },
      ...following,
    ];
    expect(verifyCompactionActionIdempotence([snapshotRow('1', actions)])).toMatchObject({
      proven: false,
      failures: expect.arrayContaining([{ rowId: '1', actionIndex: 1, code: 'non_set_operation' }]),
    });
  });

  it('requires the preceding set and restoration in the same atomic row', () => {
    const deletion: Action = {
      op: 'delete',
      path: 'item.value',
      oldValue: 'initial',
      newValue: undefined,
    };
    expect(
      verifyCompactionActionIdempotence([
        snapshotRow('1', [set('item.value', 'initial')]),
        snapshotRow('2', [deletion, set('item.value', 'restored')]),
      ]).proven
    ).toBe(false);
    expect(
      verifyCompactionActionIdempotence([
        snapshotRow('1', [set('item.value', 'initial'), deletion]),
        snapshotRow('2', [set('item.value', 'restored')]),
      ]).proven
    ).toBe(false);
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
