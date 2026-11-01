/** @jest-environment node */
import { NextRequest } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { readFreshApprovedActionRows } from '@/lib/gameData/runtimeActionSources';
import { POST } from '@/app/api/game-data-actions/edit-baseline/route';

import { getPublishedDomainReadModel, getPublishedDomainsReadModel } from './publishedSnapshot';
import type { PublishedDomainRevision, PublishedGameDataSnapshot } from './types';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (callback: unknown) => callback,
}));
jest.mock('./buildIdentity', () => ({ PRODUCTION_BUILD_IDENTITY: 'recovery-test-build' }));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => undefined,
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readFreshApprovedActionRows: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: async () => ({ allowed: true }) }));
jest.mock('@/lib/gameData/publicRouteMetrics', () => ({ logPublicGameDataRouteMetric: jest.fn() }));
jest.mock('@/constants/seo', () => ({ SITE_URL: 'https://www.tjwiki.com' }));
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

function request(visibleRevisions?: readonly PublishedDomainRevision[]) {
  return new NextRequest('https://www.tjwiki.com/api/game-data-actions/edit-baseline/', {
    method: 'POST',
    headers: {
      Origin: 'https://www.tjwiki.com',
      ...(visibleRevisions ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(visibleRevisions ? { body: JSON.stringify({ visibleRevisions }) } : {}),
  });
}

afterEach(() => jest.restoreAllMocks());

it('recovers a stale character page through the endpoint while retaining unrelated source and projection caches', async () => {
  // Node's native structuredClone creates prototypes outside Jest's test realm.
  jest
    .spyOn(global, 'structuredClone')
    .mockImplementation((value) => JSON.parse(JSON.stringify(value)));
  invalidatePublicGameDataActionsCache();
  const readSource = jest.mocked(readFreshApprovedActionRows);
  readSource.mockResolvedValue([]);
  const characters = await getPublishedDomainReadModel('characters');
  const traits = await getPublishedDomainReadModel('traits');
  const items = await getPublishedDomainReadModel('items');
  const combined = await getPublishedDomainsReadModel(['characters', 'maps']);
  expect(readSource).toHaveBeenCalledTimes(4);

  readSource.mockResolvedValue([
    {
      id: 'approved-character',
      entity_type: 'characters',
      entry: { op: 'set', path: '汤姆.description', newValue: '已发布的新描述' },
      created_at: '2026-11-01T00:00:00Z',
      status: 'approved',
      created_by: null,
      message: null,
      reviewed_at: null,
    },
  ]);

  const initial = await POST(request());
  const initialBaseline = (await initial.json()) as PublishedGameDataSnapshot;
  expect(initialBaseline.domainRevisions.characters).not.toBe(characters.revision);
  expect((await getPublishedDomainReadModel('characters')).revision).toBe(characters.revision);
  expect(readSource).toHaveBeenCalledTimes(5);

  const repair = await POST(
    request([
      { entityType: 'characters', revision: characters.revision },
      { entityType: 'traits', revision: traits.revision },
    ])
  );
  expect(repair.status).toBe(200);
  const repairedBaseline = (await repair.json()) as PublishedGameDataSnapshot;
  expect(readSource).toHaveBeenCalledTimes(6);

  const refreshedCharacters = await getPublishedDomainReadModel('characters');
  const refreshedTraits = await getPublishedDomainReadModel('traits');
  const refreshedItems = await getPublishedDomainReadModel('items');
  expect(refreshedCharacters.revision).toBe(repairedBaseline.domainRevisions.characters);
  expect(refreshedCharacters.data['汤姆']?.description).toBe('已发布的新描述');
  expect(refreshedTraits.revision).toBe(repairedBaseline.domainRevisions.traits);
  expect(refreshedTraits.data).toBe(traits.data);
  expect(refreshedItems.data).toBe(items.data);
  // Only the expired character source refills; the other domain caches remain hits.
  expect(readSource).toHaveBeenCalledTimes(7);

  const refreshedCombined = await getPublishedDomainsReadModel(['characters', 'maps']);
  expect(refreshedCombined.revisions.characters).toBe(repairedBaseline.domainRevisions.characters);
  expect(refreshedCombined.data.maps).toBe(combined.data.maps);
  expect(readSource).toHaveBeenCalledTimes(8);

  await POST(
    request([
      { entityType: 'characters', revision: refreshedCharacters.revision },
      { entityType: 'traits', revision: refreshedTraits.revision },
    ])
  );
  expect(readSource).toHaveBeenCalledTimes(9);
  await getPublishedDomainReadModel('characters');
  await getPublishedDomainReadModel('traits');
  await getPublishedDomainReadModel('items');
  expect(readSource).toHaveBeenCalledTimes(9);
});
