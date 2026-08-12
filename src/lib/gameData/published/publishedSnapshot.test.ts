import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';

import { createApprovedActionSnapshotFromRows } from './approvedActionSnapshot';
import { createPublishedDomainCacheKey } from './cachePolicy';
import { getCanonicalGameData } from './canonicalSources';
import { composePublishedGameDataSnapshot, type PublishedDomainReader } from './publishedSnapshot';
import { createPublishedRevision } from './revision';
import { selectPublishedGameData } from './selectPublishedDomain';
import type { PublishedGameDataByType } from './types';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));
jest.mock('./buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'test-build',
}));

function createMapBackedReader(
  cache: Map<string, unknown>,
  projection: string,
  misses: string[]
): PublishedDomainReader {
  return async <EntityType extends PublishableEntityType>(
    entityType: EntityType,
    snapshot: ReturnType<typeof createApprovedActionSnapshotFromRows>,
    buildIdentity: string
  ): Promise<PublishedGameDataByType[EntityType]> => {
    const key = createPublishedDomainCacheKey(
      buildIdentity,
      snapshot.actionRevision,
      entityType
    ).join('\u0000');
    const hit = cache.get(key);
    if (hit) return hit as PublishedGameDataByType[EntityType];

    misses.push(key);
    const value = { projection, entityType } as unknown as PublishedGameDataByType[EntityType];
    cache.set(key, value);
    return value;
  };
}

describe('composePublishedGameDataSnapshot', () => {
  it('composes every publishable domain from the same checked-replay snapshot', async () => {
    const canonicalBefore = Object.fromEntries(
      PUBLISHABLE_ENTITY_TYPES.map((entityType) => [
        entityType,
        structuredClone(getCanonicalGameData(entityType)),
      ])
    );
    const rows = PUBLISHABLE_ENTITY_TYPES.map((entityType, index) => {
      const canonical = getCanonicalGameData(entityType);
      const rootPrefix =
        entityType === 'specialSkills' || entityType === 'achievements'
          ? `cat.${Object.keys(canonical.cat)[0]!}`
          : Object.keys(canonical)[0]!;
      return {
        id: `complete-row-${index}`,
        entity_type: entityType,
        entry: {
          op: 'set',
          path: `${rootPrefix}.__phase1_complete_marker__`,
          newValue: entityType,
        },
        created_at: `2026-07-24T00:00:${String(index).padStart(2, '0')}.000Z`,
        status: 'approved',
        created_by: null,
        message: null,
        reviewed_at: null,
      };
    });
    const actionSnapshot = createApprovedActionSnapshotFromRows(rows);
    const readDomain: PublishedDomainReader = async (entityType, snapshot) =>
      selectPublishedGameData(entityType, getCanonicalGameData(entityType), snapshot);

    const result = await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'complete-build',
      readDomain,
    });

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      expect(result.data[entityType]).toEqual(
        selectPublishedGameData(entityType, getCanonicalGameData(entityType), actionSnapshot)
      );
      expect(getCanonicalGameData(entityType)).toEqual(canonicalBefore[entityType]);
    }
  });

  it('carries one exact global revision across the complete revision-consistent view', async () => {
    const actionSnapshot = createApprovedActionSnapshotFromRows([]);
    const readDomain = createMapBackedReader(new Map(), 'v1', []);

    const result = await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'build-a',
      readDomain,
    });

    expect(result.revision).toBe(createPublishedRevision('build-a', actionSnapshot.actionRevision));
    expect(result.actionRevision).toBe(actionSnapshot.actionRevision);
    expect(result.buildIdentity).toBe('build-a');
    expect(Object.keys(result.data)).toEqual([
      'characters',
      'cards',
      'entities',
      'buffs',
      'items',
      'fixtures',
      'maps',
      'modes',
      'specialSkills',
      'achievements',
      'traits',
    ]);
  });

  it('misses persistent domains when canonical data changes under a new build identity', async () => {
    const actionSnapshot = createApprovedActionSnapshotFromRows([]);
    const cache = new Map<string, unknown>();
    const misses: string[] = [];
    const first = await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'build-canonical-v1',
      readDomain: createMapBackedReader(cache, 'canonical-v1', misses),
    });
    const second = await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'build-canonical-v2',
      readDomain: createMapBackedReader(cache, 'canonical-v2', misses),
    });

    expect((first.data.items as unknown as { projection: string }).projection).toBe('canonical-v1');
    expect((second.data.items as unknown as { projection: string }).projection).toBe(
      'canonical-v2'
    );
    expect(misses).toHaveLength(PUBLISHABLE_ENTITY_TYPES.length * 2);
  });

  it('misses persistent domains when selector code changes under a new build identity', async () => {
    const actionSnapshot = createApprovedActionSnapshotFromRows([]);
    const cache = new Map<string, unknown>();
    const misses: string[] = [];
    await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'build-selector-v1',
      readDomain: createMapBackedReader(cache, 'selector-v1', misses),
    });
    const changed = await composePublishedGameDataSnapshot(actionSnapshot, {
      buildIdentity: 'build-selector-v2',
      readDomain: createMapBackedReader(cache, 'selector-v2', misses),
    });

    expect((changed.data.characters as unknown as { projection: string }).projection).toBe(
      'selector-v2'
    );
    expect(misses).toHaveLength(PUBLISHABLE_ENTITY_TYPES.length * 2);
  });
});
