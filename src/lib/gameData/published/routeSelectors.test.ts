import { fetchPublicGameDataActionHistory } from '@/lib/gameData/publicActions';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';
import { WikiChangeType } from '@/data/types';

import { createApprovedActionSnapshotFromRows } from './approvedActionSnapshot';
import { getCanonicalGameData } from './canonicalSources';
import { getPublishedEntityRouteReadModel } from './routeSelectors';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));
jest.mock('./buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'route-test-build',
}));
jest.mock('@/lib/gameData/publicActions', () => ({ fetchPublicGameDataActionHistory: jest.fn() }));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({ getBuildGameDataArtifactPath: jest.fn() }));

describe('published route and history selectors', () => {
  beforeEach(() => {
    jest.mocked(fetchPublicGameDataActionHistory).mockResolvedValue([]);
    jest.mocked(getBuildGameDataArtifactPath).mockReturnValue(undefined);
  });

  it('keeps static and current snapshot history when runtime history is unavailable, then recovers', async () => {
    const failure = new Error('history offline');
    jest.mocked(fetchPublicGameDataActionHistory).mockRejectedValueOnce(failure);
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const snapshot = createApprovedActionSnapshotFromRows([
      {
        id: 'recent-row',
        entity_type: 'items',
        entry: { op: 'set', path: '火箭.description', newValue: '最新内容' },
        created_at: '2026-10-02T00:00:00.000Z',
        status: 'approved',
        created_by: null,
        message: null,
        reviewed_at: null,
      },
    ]);
    const result = await getPublishedEntityRouteReadModel('items', '火箭', undefined, snapshot);
    expect(result.data).toMatchObject({ description: '最新内容' });
    expect(result.history.unavailable).toBe(true);
    expect(result.history.entries).toEqual(
      expect.arrayContaining([expect.objectContaining({ year: 2026, date: '10.2' })])
    );
    expect(result.history.entries.length).toBeGreaterThan(1);
    expect(log).toHaveBeenCalledWith('Error fetching published entity history:', failure);
    const recovered = await getPublishedEntityRouteReadModel('items', '火箭', undefined, snapshot);
    expect(recovered.history.unavailable).toBe(false);
  });

  it('rejects a broken configured build artifact instead of emitting a partial static page', async () => {
    const failure = new Error('invalid build history');
    jest.mocked(getBuildGameDataArtifactPath).mockReturnValue('/build-artifact.json');
    jest.mocked(fetchPublicGameDataActionHistory).mockRejectedValueOnce(failure);
    await expect(
      getPublishedEntityRouteReadModel(
        'items',
        '火箭',
        undefined,
        createApprovedActionSnapshotFromRows([])
      )
    ).rejects.toBe(failure);
  });

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
    expect(result.history.entries).toContainEqual({
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
    expect(result.history.entries.length).toBeGreaterThan(0);
  });

  it('returns null for missing IDs and faction-scoped IDs without a valid faction', async () => {
    const snapshot = createApprovedActionSnapshotFromRows([]);
    const missing = await getPublishedEntityRouteReadModel('items', '   ', undefined, snapshot);
    const read = getPublishedEntityRouteReadModel;
    // @ts-expect-error Scoped reads require a faction; untyped callers still fail safely.
    const missingFaction = await read('specialSkills', '翻盘', undefined, snapshot);
    // @ts-expect-error Achievements also require a faction.
    const achievement = await read('achievements', 'test', undefined, snapshot);
    // @ts-expect-error Widening the domain must not bypass the faction requirement.
    const widened = await read<PublishableEntityType>('specialSkills', 'test', undefined, snapshot);

    expect(missing).toMatchObject({
      entityId: '',
      data: null,
      history: { entries: [], unavailable: false },
    });
    expect(missingFaction).toMatchObject({
      data: null,
      history: { entries: [], unavailable: false },
    });
    expect(achievement).toMatchObject({ data: null, history: { entries: [], unavailable: false } });
    expect(widened).toMatchObject({ data: null, history: { entries: [], unavailable: false } });
  });

  it.each(['specialSkills', 'achievements'] as const)(
    'reads each faction from the correct %s collection',
    async (entityType) => {
      const snapshot = createApprovedActionSnapshotFromRows([]);
      const baseline = getCanonicalGameData(entityType);
      for (const faction of ['cat', 'mouse'] as const) {
        const entityId = Object.keys(baseline[faction])[0]!;
        const result = await getPublishedEntityRouteReadModel(
          entityType,
          entityId,
          faction,
          snapshot
        );
        expect(result).toMatchObject({ entityType, entityId, factionId: faction });
        expect(result.data).toEqual(baseline[faction][entityId]);
        expect(result.data).toBeDefined();
      }
    }
  );
});
