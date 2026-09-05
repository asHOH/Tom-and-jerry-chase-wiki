import { WikiChangeType } from '@/data/types';

import { createApprovedActionSnapshotFromRows } from './approvedActionSnapshot';
import { getPublishedEntityRouteReadModel } from './routeSelectors';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));
jest.mock('./buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'route-test-build',
}));

describe('published route and history selectors', () => {
  it('returns published entity data and entity-scoped action history from one revision', async () => {
    const snapshot = createApprovedActionSnapshotFromRows([
      {
        id: 'route-row',
        entity_type: 'items',
        entry: {
          op: 'set',
          path: '__phase1_item__.description',
          newValue: '已发布',
        },
        created_at: '2026-07-24T00:00:00.000Z',
        status: 'approved',
        created_by: null,
        message: null,
        reviewed_at: null,
      },
    ]);

    const result = await getPublishedEntityRouteReadModel(
      'items',
      '__phase1_item__',
      undefined,
      snapshot
    );

    expect(result.data).toMatchObject({ description: '已发布' });
    expect(result.history).toContainEqual({
      year: 2026,
      date: '7.24',
      type: WikiChangeType.UPDATE,
      description: '更新 描述',
    });
    expect(result.revision).toMatch(/^v1:[a-f0-9]{64}$/);
  });

  it('preserves static history when there are no approved rows', async () => {
    const snapshot = createApprovedActionSnapshotFromRows([]);
    const result = await getPublishedEntityRouteReadModel('items', '火箭', undefined, snapshot);

    expect(result.data).not.toBeNull();
    expect(result.history.length).toBeGreaterThan(0);
  });

  it('returns null for missing IDs and faction-scoped IDs without a valid faction', async () => {
    const snapshot = createApprovedActionSnapshotFromRows([]);
    const missing = await getPublishedEntityRouteReadModel('items', '   ', undefined, snapshot);
    const missingFaction = await getPublishedEntityRouteReadModel(
      'specialSkills',
      '翻盘',
      undefined,
      snapshot
    );

    expect(missing).toMatchObject({ entityId: '', data: null, history: [] });
    expect(missingFaction).toMatchObject({ data: null, history: [] });
  });
});
