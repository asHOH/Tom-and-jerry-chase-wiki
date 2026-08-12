import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
  traits,
} from '@/data/static';

import type { PublishedGameDataByType } from './gameData/published/types';
import { getGotoResult } from './gotoUtils';

describe('getGotoResult', () => {
  it('should resolve level 3 skill links with skill metadata', async () => {
    const result = await getGotoResult('3级旋转桶盖', '技能');

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({
        type: 'character-skill',
        name: '旋转桶盖',
        skillLevel: 3,
        skillType: 'weapon2',
      })
    );
  });

  it('resolves aliases and descriptions from the published server snapshot', async () => {
    const characterId = Object.keys(characters)[0]!;
    const publishedAlias = '__published_character_alias__';
    const publishedDescription = '__published_character_description__';
    const gameData = {
      achievements,
      buffs,
      cards,
      characters: {
        ...characters,
        [characterId]: {
          ...characters[characterId]!,
          aliases: [publishedAlias],
          description: publishedDescription,
        },
      },
      entities,
      fixtures,
      items,
      maps,
      modes,
      specialSkills,
      traits,
    } as PublishedGameDataByType;

    const result = await getGotoResult(publishedAlias, '角色', { gameData });

    expect(result).toEqual(
      expect.objectContaining({
        type: 'character',
        name: characterId,
        description: publishedDescription,
      })
    );
  });
});
