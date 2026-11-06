import { GameDataManager } from '@/lib/dataManager';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
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
jest.mock('@/lib/gameData/published/publishedSnapshot', () => {
  const actual = jest.requireActual('@/lib/gameData/published/publishedSnapshot');
  return { ...actual, getPublishedGameDataSnapshot: jest.fn(actual.getPublishedGameDataSnapshot) };
});

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
  it('serves contributors even when published game data is unavailable', async () => {
    const reader = jest.mocked(getPublishedGameDataSnapshot);
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
    expect(getPublishedGameDataSnapshot).not.toHaveBeenCalled();
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

  it('advertises faction-qualified special-skill detail IDs', async () => {
    const path = (await getAvailablePaths()).find(({ path }) => path === 'special-skills');
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
    const snapshot = await getPublishedGameDataSnapshot();
    const pendingCharacter = {
      id: '待补充角色',
      factionId: 'mouse' as const,
      faction: snapshot.data.characters['巴特']!.faction,
      imageUrl: '',
      createDate: null,
      description: '',
      skills: [],
      knowledgeCardGroups: [],
    };
    const pendingSnapshot = {
      ...snapshot,
      data: {
        ...snapshot.data,
        characters: { ...snapshot.data.characters, [pendingCharacter.id]: pendingCharacter },
      },
    };
    jest
      .mocked(getPublishedGameDataSnapshot)
      .mockResolvedValueOnce(pendingSnapshot)
      .mockResolvedValueOnce(pendingSnapshot);
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
