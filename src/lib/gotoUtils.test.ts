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

const baseline: PublishedGameDataByType = {
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
};

describe('getGotoResult', () => {
  it.each([
    ['炮弹', '猫衍生物', '炮弹', 'cat'],
    ['炮弹', '鼠衍生物', '火箭炮', 'mouse'],
    ['炮弹(猫衍生物)', undefined, '炮弹', 'cat'],
    ['炮弹（鼠衍生物）', undefined, '火箭炮', 'mouse'],
  ])('resolves %s with category %s to %s', async (query, category, name, factionId) => {
    expect(await getGotoResult(query!, category)).toEqual(
      expect.objectContaining({
        type: 'entity',
        name,
        factionId,
        url: `/entities/${encodeURIComponent(name!)}`,
      })
    );
  });

  it('preserves the canonical target and alternative suggestion for unqualified 炮弹', async () => {
    expect(await getGotoResult('炮弹')).toEqual(
      expect.objectContaining({
        type: 'entity',
        name: '炮弹',
        suggestions: expect.arrayContaining([
          expect.objectContaining({ type: 'entity', name: '火箭炮', factionId: 'mouse' }),
        ]),
      })
    );
  });

  it('does not ignore an explicit faction when only an opposite-faction target exists', async () => {
    expect(await getGotoResult('火箭炮', '猫衍生物')).toBeNull();
  });

  it('follows entity ownership using each published snapshot without a stale faction cache', async () => {
    const gameData: PublishedGameDataByType = {
      ...baseline,
      entities: {
        ...entities,
        炮弹: { ...entities['炮弹']!, owner: { name: '皇家火炮', type: 'entity' } },
        皇家火炮: { ...entities['皇家火炮']!, owner: { name: '火箭筒', type: 'skill' } },
      },
    };

    expect(await getGotoResult('炮弹', '猫衍生物', { gameData })).toBeNull();
    expect(await getGotoResult('皇家火炮', '鼠衍生物', { gameData })).toMatchObject({
      type: 'entity',
      name: '皇家火炮',
      factionId: 'mouse',
    });
    expect(await getGotoResult('炮弹', '猫衍生物', { gameData: baseline })).toMatchObject({
      type: 'entity',
      name: '炮弹',
      factionId: 'cat',
    });
  });

  it('leaves cyclic and conflicting ownership unclassified but honors an explicit faction', async () => {
    const gameData: PublishedGameDataByType = {
      ...baseline,
      entities: {
        ...entities,
        炮弹: { ...entities['炮弹']!, owner: { name: '皇家火炮', type: 'entity' } },
        皇家火炮: { ...entities['皇家火炮']!, owner: { name: '炮弹', type: 'entity' } },
        火箭炮: {
          ...entities['火箭炮']!,
          owner: [
            { name: '汤姆', type: 'character' },
            { name: '泰菲', type: 'character' },
          ],
        },
      },
    };

    expect(await getGotoResult('炮弹', '猫衍生物', { gameData })).toBeNull();
    expect(await getGotoResult('炮弹', '鼠衍生物', { gameData })).toBeNull();
    const explicitFaction: PublishedGameDataByType = {
      ...gameData,
      entities: {
        ...gameData.entities,
        火箭炮: { ...gameData.entities['火箭炮']!, factionId: 'mouse' },
      },
    };
    expect(await getGotoResult('炮弹', '鼠衍生物', { gameData: explicitFaction })).toMatchObject({
      type: 'entity',
      name: '火箭炮',
      factionId: 'mouse',
    });
  });

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
