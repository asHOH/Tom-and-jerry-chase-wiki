import { GameDataManager } from '@/lib/dataManager';
import { getCharacterRelation } from '@/features/characters/utils/relations';

import { getAvailablePaths, getResolvers, type ResolverResult } from './resolvers';

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
    const detectiveTom = result.data.find(
      (character: { id?: string }) => character.id === '侦探汤姆'
    );
    expect(detectiveTom).toMatchObject({
      id: '侦探汤姆',
      actorProfile: { name: '侦探汤姆', maxHp: 225, runSpeed: 780 },
      role: { name: '侦探汤姆', maxHp: 225, runSpeed: 780 },
    });
    expect(detectiveTom.actorProfile).toBe(detectiveTom.role);
    expect(result.data.find((character: { id?: string }) => character.id === '巴特')).toMatchObject(
      {
        id: '巴特',
        actorProfile: null,
        role: null,
      }
    );
    expect((await characterResolver.detail!('巴特'))?.data).toMatchObject({
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
