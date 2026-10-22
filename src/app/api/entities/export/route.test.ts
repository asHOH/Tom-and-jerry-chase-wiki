/** @jest-environment node */

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { readFreshApprovedActionRows } from '@/lib/gameData/runtimeActionSources';
import { entityDefinitions } from '@/features/entities/data/entities';

import { GET } from './route';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (callback: unknown) => callback,
}));
jest.mock('@/lib/gameData/published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'entity-export-test',
}));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => undefined,
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readFreshApprovedActionRows: jest.fn(),
}));
jest.mock('@/lib/gameData/published/canonicalSources', () => {
  const actual = jest.requireActual('@/lib/gameData/published/canonicalSources');
  return {
    // Node's structuredClone creates objects outside Jest's realm; keep JSON data in this realm.
    getCanonicalGameData: (type: string) =>
      JSON.parse(JSON.stringify(actual.getCanonicalGameData(type))),
  };
});
jest.mock('next/cache', () => {
  const entries = new Map<string, { tags: string[]; value: Promise<unknown> }>();
  return {
    unstable_cache:
      (read: () => Promise<unknown>, key: string[], options: { tags: string[] }) => () => {
        const cacheKey = JSON.stringify(key);
        let entry = entries.get(cacheKey);
        if (!entry) {
          entry = { tags: options.tags, value: Promise.resolve().then(read) };
          entries.set(cacheKey, entry);
        }
        return entry.value;
      },
    revalidateTag: (tag: string) => {
      for (const [key, entry] of entries) {
        if (entry.tags.includes(tag)) entries.delete(key);
      }
    },
  };
});

beforeEach(() => {
  invalidatePublicGameDataActionsCache(['entities']);
});

it('preserves the export shape and refreshes approved and revoked entity edits', async () => {
  const readSource = jest.mocked(readFreshApprovedActionRows);
  readSource.mockResolvedValue([]);
  const baseline = {
    source: 'site-data',
    total: Object.keys(entityDefinitions).length,
    entities: entityDefinitions,
  };
  const initial = await GET();
  expect(await initial.json()).toEqual(baseline);
  expect(initial.headers.get('Cache-Control')).toBe(
    'public, s-maxage=3600, stale-while-revalidate=39600'
  );
  const edit: PublicActionRow = {
    id: 'approved-entity',
    entity_type: 'entities',
    entry: { op: 'set', path: '果子.description', newValue: '公开的新描述' },
    created_at: '2026-10-22T00:00:00Z',
    status: 'approved',
    created_by: null,
    message: null,
    reviewed_at: null,
  };
  readSource.mockResolvedValue([edit]);
  invalidatePublicGameDataActionsCache(['entities']);
  const published = await GET();
  expect(published.status).toBe(200);
  expect(await published.json()).toEqual({
    ...baseline,
    entities: {
      ...entityDefinitions,
      果子: { ...entityDefinitions.果子, description: '公开的新描述' },
    },
  });
  readSource.mockResolvedValue([]);
  invalidatePublicGameDataActionsCache(['entities']);
  expect(await (await GET()).json()).toEqual(baseline);
  expect(readSource).toHaveBeenCalledTimes(3);
});

it('returns an uncached structured failure when published data cannot be read', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(readFreshApprovedActionRows).mockRejectedValueOnce(new Error('Unavailable'));
  const response = await GET();
  expect(response.status).toBe(500);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toEqual({ error: 'Failed to export entities' });
});
