import type { Action } from '@/lib/edit/diffUtils';
import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';

import {
  createApprovedActionSnapshot,
  createApprovedActionSnapshotFromRows,
  encodeApprovedActionRevisionRows,
} from './approvedActionSnapshot';

jest.mock('server-only', () => ({}), { virtual: true });

describe('createApprovedActionSnapshot', () => {
  it('copies and freezes the caller-owned row array and normalized actions', () => {
    const decoded = decodeStoredActionRow({
      id: 'row-1',
      entry: { op: 'set', path: 'item.description', newValue: 'published' },
    });
    if (!decoded.success) throw new Error(decoded.error.message);

    const mutableDecoded = structuredClone(decoded.value);
    const inputs = [
      {
        entityType: 'items' as const,
        createdAt: '2026-07-24T00:00:00.000Z',
        status: 'approved',
        createdBy: null,
        message: null,
        reviewedAt: null,
        decodedRow: mutableDecoded,
      },
    ];
    const snapshot = createApprovedActionSnapshot(inputs);

    inputs.length = 0;
    (mutableDecoded.actions[0] as Action).newValue = 'caller mutation';
    (mutableDecoded.rawEntry as Record<string, unknown>).newValue = 'caller raw mutation';

    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.rows[0]).toMatchObject({
      rowId: 'row-1',
      entityType: 'items',
      rawEntry: { newValue: 'published' },
      actions: [{ newValue: 'published' }],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.rows)).toBe(true);
    expect(Object.isFrozen(snapshot.rows[0]?.actions)).toBe(true);
    expect(Object.isFrozen(snapshot.rows[0]?.actions[0])).toBe(true);
  });

  it('uses the fixed v1 tuple encoding and SHA-256 vector', () => {
    const snapshot = createApprovedActionSnapshotFromRows([
      {
        id: 'row-β',
        entity_type: 'items',
        entry: [
          {
            path: '火箭.stats',
            op: 'set',
            newValue: { b: 2, a: 1 },
            oldValue: { z: 1, a: [3, { y: '鼠', x: null }] },
          },
          {
            oldValue: null,
            path: '火箭.legacy',
            op: 'delete',
          },
        ],
        created_at: '2026-07-24T00:00:00.000Z',
        status: 'approved',
        created_by: null,
        message: null,
        reviewed_at: null,
      },
    ]);

    expect(encodeApprovedActionRevisionRows(snapshot.rows)).toBe(
      '["v1",[["row-β","2026-07-24T00:00:00.000Z","items",[{"newValue":{"a":1,"b":2},"oldValue":{"a":[3,{"x":null,"y":"鼠"}],"z":1},"op":"set","path":"火箭.stats"},{"oldValue":null,"op":"delete","path":"火箭.legacy"}],"approved",null,null,null]]]'
    );
    expect(snapshot.actionRevision).toBe(
      'v1:92473a17490cadfd956b11ed2464544e04592e02994ce4e2098409178fee74d8'
    );
  });

  it('is insensitive to database JSON object-key order but preserves array order', () => {
    const base = {
      id: 'row-order',
      entity_type: 'items',
      created_at: '2026-07-24T00:00:00.000Z',
      status: 'approved',
      created_by: 'user',
      message: 'message',
      reviewed_at: '2026-07-24T01:00:00.000Z',
    };
    const first = createApprovedActionSnapshotFromRows([
      {
        ...base,
        entry: {
          op: 'set',
          path: '火箭.test',
          newValue: { z: 1, a: [{ d: 4, c: 3 }, 2] },
        },
      },
    ]);
    const reordered = createApprovedActionSnapshotFromRows([
      {
        ...base,
        entry: {
          newValue: { a: [{ c: 3, d: 4 }, 2], z: 1 },
          path: '火箭.test',
          op: 'set',
        },
      },
    ]);
    const reversedArray = createApprovedActionSnapshotFromRows([
      {
        ...base,
        entry: {
          op: 'set',
          path: '火箭.test',
          newValue: { a: [2, { c: 3, d: 4 }], z: 1 },
        },
      },
    ]);

    expect(reordered.actionRevision).toBe(first.actionRevision);
    expect(reversedArray.actionRevision).not.toBe(first.actionRevision);
  });

  it('covers row identity, order, replay fields, and visible history metadata', () => {
    const createInput = (
      rowId: string,
      overrides: Partial<
        Omit<Parameters<typeof createApprovedActionSnapshot>[0][number], 'decodedRow'>
      > = {},
      newValue = 'base'
    ) => {
      const decoded = decodeStoredActionRow({
        id: rowId,
        entry: { op: 'set', path: '火箭.description', newValue },
      });
      if (!decoded.success) throw new Error(decoded.error.message);
      return {
        entityType: 'items',
        createdAt: '2026-07-24T00:00:00.000Z',
        status: 'approved',
        createdBy: null,
        message: null,
        reviewedAt: null,
        ...overrides,
        decodedRow: decoded.value,
      };
    };
    const revision = (inputs: readonly ReturnType<typeof createInput>[]): `v1:${string}` =>
      createApprovedActionSnapshot(inputs).actionRevision;
    const base = createInput('row-a');
    const baseRevision = revision([base]);

    expect(revision([createInput('row-b')])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', { createdAt: '2026-07-25T00:00:00.000Z' })])).not.toBe(
      baseRevision
    );
    expect(revision([createInput('row-a', { entityType: 'cards' })])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', {}, 'changed')])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', { status: 'synced' })])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', { createdBy: 'user' })])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', { message: 'message' })])).not.toBe(baseRevision);
    expect(revision([createInput('row-a', { reviewedAt: '2026-07-24T01:00:00.000Z' })])).not.toBe(
      baseRevision
    );

    const second = createInput('row-b');
    expect(revision([base, second])).not.toBe(revision([second, base]));
  });

  it('accepts any public-row status while rejecting malformed and unknown types', () => {
    const base = {
      id: 'row-invalid',
      entity_type: 'items',
      entry: { op: 'set', path: '火箭.name', newValue: '火箭' },
      created_at: '2026-07-24T00:00:00.000Z',
      status: 'approved',
      created_by: null,
      message: null,
      reviewed_at: null,
    };

    expect(
      createApprovedActionSnapshotFromRows([{ ...base, status: 'pending' }]).rows[0]
    ).toMatchObject({
      rowId: 'row-invalid',
      status: 'pending',
    });
    expect(() =>
      createApprovedActionSnapshotFromRows([
        { ...base, entry: { op: 'set', path: '__proto__.polluted', newValue: true } },
      ])
    ).toThrow('failed stored decoding');
    expect(() =>
      createApprovedActionSnapshotFromRows([{ ...base, entity_type: 'unknown' }])
    ).toThrow('unknown entity type');
  });
});
