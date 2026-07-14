import { getCharacterRelation } from '@/features/characters/utils/relations';
import { characters } from '@/data';

import { resolvers, type ResolverResult } from './resolvers';

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
  it('should expose actor profile data with a deprecated role alias', async () => {
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
  });

  it('should expose projected character relations in recommended data', async () => {
    const characterId = '恶魔汤姆';
    const expectedRelations = getCharacterRelation(characters, characterId);

    expect(expectedRelations.counters.length).toBeGreaterThan(0);

    const recommendedData = await getRecommendedData();
    const recommendedCharacter = recommendedData.find((item) => item.id === characterId);

    expect(recommendedCharacter?.relations).toEqual(expectedRelations);
  });
});
