import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { readFreshApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

import { getPublishedDomainReadModel } from './publishedSnapshot';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (callback: unknown) => callback,
}));
jest.mock('./buildIdentity', () => ({ PRODUCTION_BUILD_IDENTITY: 'scoped-invalidation-build' }));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => undefined,
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readFreshApprovedActionRows: jest.fn(),
}));
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

it('refreshes a published/revoked domain without refilling unrelated source and projection caches', async () => {
  const readSource = jest.mocked(readFreshApprovedActionRows);
  readSource.mockResolvedValue([]);
  const initialItems = await getPublishedDomainReadModel('items');
  const initialTraits = await getPublishedDomainReadModel('traits');
  expect(readSource).toHaveBeenCalledTimes(2);

  const edit: PublicActionRow = {
    id: 'approved-item',
    entity_type: 'items',
    entry: { op: 'set', path: '火箭.description', newValue: '公开的新描述' },
    created_at: '2026-10-04T00:00:00Z',
    status: 'approved',
    created_by: null,
    message: null,
    reviewed_at: null,
  };
  readSource.mockResolvedValue([edit]);
  invalidatePublicGameDataActionsCache(['items']);
  const updatedItems = await getPublishedDomainReadModel('items');
  expect(updatedItems.data['火箭']?.description).toBe('公开的新描述');
  expect(updatedItems.revision).not.toBe(initialItems.revision);
  expect(await getPublishedDomainReadModel('traits')).toEqual(initialTraits);
  expect(readSource).toHaveBeenCalledTimes(3);

  readSource.mockResolvedValue([]);
  invalidatePublicGameDataActionsCache(['items']);
  expect(await getPublishedDomainReadModel('items')).toEqual(initialItems);
  expect(await getPublishedDomainReadModel('traits')).toEqual(initialTraits);
  expect(readSource).toHaveBeenCalledTimes(4);
});
