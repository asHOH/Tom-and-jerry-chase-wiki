import type { Action } from '@/lib/edit/diffUtils';
import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';

import { createApprovedActionSnapshot } from './approvedActionSnapshot';

jest.mock('server-only', () => ({}), { virtual: true });

describe('createApprovedActionSnapshot', () => {
  it('copies and freezes the caller-owned row array and normalized actions', () => {
    const decoded = decodeStoredActionRow({
      id: 'row-1',
      entry: { op: 'set', path: 'item.description', newValue: 'published' },
    });
    if (!decoded.success) throw new Error(decoded.error.message);

    const mutableDecoded = structuredClone(decoded.value);
    const inputs = [{ entityType: 'items', decodedRow: mutableDecoded }];
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
});
