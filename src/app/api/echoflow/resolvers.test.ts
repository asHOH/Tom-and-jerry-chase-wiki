import { GameDataManager } from '@/lib/dataManager';
import { createApprovedActionSnapshotFromRows } from '@/lib/gameData/published/approvedActionSnapshot';
import { getCanonicalGameData } from '@/lib/gameData/published/canonicalSources';
import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { contributors } from '@/data/contributors';
import { getActorProfile } from '@/features/actor-profiles/selectors';
import { getCharacterRelation } from '@/features/characters/utils/relations';

import { getAvailablePaths, getResolvers, resolvePath, type ResolverResult } from './resolvers';

jest.mock('@/features/actor-profiles/pendingProfiles', () => ({
  PENDING_ACTOR_PROFILE_NAMES: new Set([
    ...jest.requireActual('@/features/actor-profiles/pendingProfiles').PENDING_ACTOR_PROFILE_NAMES,
    '待补充角色',
  ]),
}));
jest.mock('@/lib/gameData/published/canonicalSources', () => {
  const actual = jest.requireActual('@/lib/gameData/published/canonicalSources');
  return { getCanonicalGameData: jest.fn(actual.getCanonicalGameData) };
});
jest.mock('@/lib/gameData/published/getApprovedActionSnapshot', () => ({
  getApprovedActionSnapshot: jest.fn(),
}));

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));
jest.mock('@/lib/gameData/published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'test-build',
}));
jest.mock('@/lib/articles/serverQueries', () => ({
  getApprovedArticleVersion: jest.fn(),
  getArticleBasicInfo: jest.fn(),
  getArticlesPageData: jest.fn(),
}));

type RecommendedCharacter = {
  id: string;
  relations: unknown;
};

const getRecommendedData = async (): Promise<RecommendedCharacter[]> => {
  const resolvers = await getResolvers();
  const recommendedResolver = resolvers.recommended;
  if (!recommendedResolver) {
    throw new Error('Expected recommended resolver to be registered.');
  }

  const result = await recommendedResolver.list();
  const data = (result as ResolverResult).data;
  if (!Array.isArray(data)) {
    throw new Error('Expected recommended resolver to return a list.');
  }
  return data as RecommendedCharacter[];
};

describe('echoflow resolvers', () => {
  beforeEach(() => {
    jest
      .mocked(getApprovedActionSnapshot)
      .mockResolvedValue(createApprovedActionSnapshotFromRows([]));
  });

  it('serves contributors even when published game data is unavailable', async () => {
    const reader = jest.mocked(getApprovedActionSnapshot);
    await reader.withImplementation(
      async () => {
        throw new Error('Published data unavailable');
      },
      async () => {
        expect(await resolvePath('Contributors', 'ignored')).toEqual({
          data: contributors,
          meta: {
            type: 'Contributor',
            path: '/contributors',
            count: contributors.length,
            hasDetail: false,
          },
        });
        expect(await resolvePath('contributors', 'ignored', true)).toMatchObject({
          data: contributors,
          meta: { updatedAt: expect.any(String) },
        });
        expect(reader).not.toHaveBeenCalled();
        expect(getCanonicalGameData).not.toHaveBeenCalled();
      }
    );
  });

  it('keeps case-insensitive item group lookup and operation precedence', async () => {
    expect((await resolvePath('itemgroups'))?.meta.path).toBe('/itemGroups');
    expect(await resolvePath('ITEMGROUPS', 'missing group', true)).toBeNull();
    expect((await resolvePath('usages', undefined, true))?.meta).toMatchObject({
      hasDetail: false,
    });
    expect(await resolvePath('missing resource')).toBeNull();
    expect(getApprovedActionSnapshot).not.toHaveBeenCalled();
    expect(getCanonicalGameData).not.toHaveBeenCalled();
  });

  it('lists items with approved edits and reads only the items domain', async () => {
    jest.mocked(getApprovedActionSnapshot).mockResolvedValueOnce(
      createApprovedActionSnapshotFromRows([
        {
          id: 'item-edit',
          entity_type: 'items',
          entry: { op: 'set', path: '火箭.description', newValue: 'EchoFlow test edit' },
          created_at: '2026-10-04T00:00:00Z',
          status: 'approved',
          message: null,
          reviewed_at: null,
          created_by: null,
        },
      ])
    );
    expect((await resolvePath('items'))?.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '火箭', description: 'EchoFlow test edit' }),
      ])
    );
    expect(jest.mocked(getApprovedActionSnapshot).mock.calls).toEqual([['items']]);
    expect(jest.mocked(getCanonicalGameData).mock.calls).toEqual([['items']]);
  });

  it.each([
    ['cat.应急治疗', 'cat'],
    ['mouse.应急治疗', 'mouse'],
    ['蓄力重击', 'cat'],
    ['冰冻保鲜', 'mouse'],
  ])('resolves special skill %s to %s', async (id, factionId) => {
    const resolver = (await getResolvers())['special-skills']!;
    const result = await resolver.detail!(encodeURIComponent(id!));
    expect(result?.data).toMatchObject({ factionId });
    expect(result?.meta.path).toContain(`/special-skills/${factionId}/`);
  });

  it.each(['应急治疗', '急速翻滚', 'mouse.蓄力重击', 'other.冰冻保鲜', 'missing'])(
    'leaves ambiguous or invalid special skill %s unresolved',
    async (id) => {
      const resolver = (await getResolvers())['special-skills']!;
      expect(await resolver.detail!(id)).toBeNull();
    }
  );

  it('discovers detail IDs using one scoped snapshot across all detail domains', async () => {
    const detailDomains = [
      'achievements',
      'buffs',
      'cards',
      'characters',
      'entities',
      'fixtures',
      'items',
      'maps',
      'modes',
      'specialSkills',
    ];
    const paths = await getAvailablePaths();
    const acquisitions = jest.mocked(getApprovedActionSnapshot).mock.calls;
    expect(acquisitions).toHaveLength(1);
    expect([...acquisitions[0]!].sort()).toEqual(detailDomains);
    expect(
      jest
        .mocked(getCanonicalGameData)
        .mock.calls.map(([domain]) => domain)
        .sort()
    ).toEqual(detailDomains);
    expect(paths.find(({ path }) => path === 'articles')?.availableDetails).toEqual([]);
    expect(paths.find(({ path }) => path === 'factions')?.availableDetails).toEqual([
      'cat',
      'mouse',
    ]);
    expect(paths.find(({ path }) => path === 'traits')).not.toHaveProperty('availableDetails');
    const path = paths.find(({ path }) => path === 'special-skills');
    expect(path?.availableDetails).toEqual(
      expect.arrayContaining(['cat.应急治疗', 'mouse.应急治疗'])
    );
    expect(path?.availableDetails).not.toContain('应急治疗');
  });

  it('should expose actor profile data with a deprecated role alias', async () => {
    const resolvers = await getResolvers();
    const characterResolver = resolvers.characters;
    if (!characterResolver) throw new Error('Expected character resolver to be registered.');

    const result = await characterResolver.list();
    if (!Array.isArray(result.data)) throw new Error('Expected character list data.');
    for (const id of ['侦探汤姆', '巴特']) {
      const profile = getActorProfile(id);
      const character = result.data.find((character: { id?: string }) => character.id === id);
      expect(character).toMatchObject({ id, actorProfile: profile, role: profile });
      expect(character.actorProfile).toBe(character.role);
      const detail = (await characterResolver.detail!(id))?.data;
      expect(detail).toMatchObject({ id, actorProfile: profile, role: profile });
    }
  });

  it('returns null profile fields in lists and details for a pending character', async () => {
    const characters = getCanonicalGameData('characters');
    const pendingCharacter = {
      id: '待补充角色',
      factionId: 'mouse' as const,
      faction: characters['巴特']!.faction,
      imageUrl: '',
      createDate: null,
      description: '',
      skills: [],
      knowledgeCardGroups: [],
    };
    const pendingCharacters = { ...characters, [pendingCharacter.id]: pendingCharacter };
    jest
      .mocked(getCanonicalGameData)
      .mockReturnValueOnce(pendingCharacters)
      .mockReturnValueOnce(pendingCharacters);
    const resolver = (await getResolvers()).characters!;
    const result = await resolver.list();
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: pendingCharacter.id, actorProfile: null, role: null }),
      ])
    );
    expect((await resolver.detail!(pendingCharacter.id))?.data).toMatchObject({
      id: pendingCharacter.id,
      actorProfile: null,
      role: null,
    });
  });

  it('should expose projected character relations in recommended data', async () => {
    const characterId = '恶魔汤姆';
    const characters = GameDataManager.getCharacters();
    const expectedRelations = getCharacterRelation(characters, characterId);

    expect(expectedRelations.counters.length).toBeGreaterThan(0);

    const recommendedData = await getRecommendedData();
    const recommendedCharacter = recommendedData.find((item) => item.id === characterId);

    expect(recommendedCharacter?.relations).toEqual(expectedRelations);
  });
});
