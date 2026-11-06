import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { readFreshApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

import { getPublishedDomainReadModel, getPublishedDomainsReadModel } from './publishedSnapshot';
import { getPublishedReferenceSections, getReferenceActionSnapshot } from './reverseReferences';

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

it('refreshes an empty item reference list when only a referring domain is invalidated', async () => {
  const readSource = jest.mocked(readFreshApprovedActionRows);
  const itemId = '经验蛋糕';
  async function readPage() {
    const snapshot = await getReferenceActionSnapshot();
    const [item, references] = await Promise.all([
      getPublishedDomainReadModel('items', snapshot),
      getPublishedReferenceSections(snapshot, [{ name: itemId, type: 'item' }]),
    ]);
    return {
      item,
      references,
      rows: references.sections[0]!.groups.flatMap((group) => group.rows),
    };
  }
  readSource.mockResolvedValue([]);
  const initial = await readPage();
  expect(initial.rows).toEqual([]);
  const mention = '技能现在提到{经验蛋糕}。';
  const edit: PublicActionRow = {
    id: 'first-reference',
    entity_type: 'characters',
    created_at: '2026-11-07T00:00:00Z',
    status: 'approved',
    created_by: null,
    reviewed_at: null,
    message: null,
    entry: [
      { op: 'set', path: '汤姆.skills.0.name', newValue: '改名的技能' },
      { op: 'set', path: '汤姆.skills.0.description', newValue: mention },
    ],
  };
  readSource.mockResolvedValue([edit]);
  invalidatePublicGameDataActionsCache(['characters']);
  const added = await readPage();
  expect(added.item.revision).toBe(initial.item.revision);
  expect(added.references.revisions.characters).not.toBe(initial.references.revisions.characters);
  expect(added.rows).toHaveLength(1);
  expect(added.rows[0]).toMatchObject({
    name: '改名的技能',
    ownerSuffix: '（猫‐汤姆）',
    href: '/characters/' + encodeURIComponent('汤姆'),
    description: mention,
  });
  readSource.mockResolvedValue([]);
  invalidatePublicGameDataActionsCache(['characters']);
  expect((await readPage()).rows).toEqual([]);
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

it('refreshes a multi-domain read only when a requested domain is invalidated', async () => {
  const readSource = jest.mocked(readFreshApprovedActionRows);
  readSource.mockResolvedValue([]);
  const initial = await getPublishedDomainsReadModel(['items', 'maps']);
  expect(readSource).toHaveBeenCalledTimes(1);

  invalidatePublicGameDataActionsCache(['traits']);
  expect(await getPublishedDomainsReadModel(['items', 'maps'])).toEqual(initial);
  expect(readSource).toHaveBeenCalledTimes(1);

  readSource.mockResolvedValue([
    {
      id: 'approved-multi-domain-item',
      entity_type: 'items',
      entry: { op: 'set', path: '火箭.description', newValue: '组合页面的新描述' },
      created_at: '2026-10-04T00:00:00Z',
      status: 'approved',
      created_by: null,
      message: null,
      reviewed_at: null,
    },
  ]);
  invalidatePublicGameDataActionsCache(['items']);
  const updated = await getPublishedDomainsReadModel(['items', 'maps']);
  expect(updated.data.items['火箭']?.description).toBe('组合页面的新描述');
  expect(updated.revisions.items).not.toBe(initial.revisions.items);
  expect(updated.revisions.maps).toBe(initial.revisions.maps);
  expect(readSource).toHaveBeenCalledTimes(2);

  readSource.mockResolvedValue([]);
  invalidatePublicGameDataActionsCache(['items']);
  expect(await getPublishedDomainsReadModel(['items', 'maps'])).toEqual(initial);
  expect(readSource).toHaveBeenCalledTimes(3);
});
