import type { Character } from '@/data/types';
import { getActorJumpHeight, getActorProfile } from '@/features/character-roles/selectors';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

import {
  getCharactersWithProperty,
  getPropertyInfo,
  rankCharactersByProperty,
  type RankableProperty,
} from './ranking';

const characters = {
  ...catCharactersWithImages,
  ...mouseCharactersWithImages,
} as Record<string, Character>;

const selectCharacters = (...ids: string[]): Character[] =>
  ids.map((id) => {
    const character = characters[id];
    if (!character) throw new Error(`Missing test character: ${id}`);
    return character;
  });

describe('character ranking utilities', () => {
  it.each<[RankableProperty, (roleId: string) => number | undefined]>([
    ['maxHp', (id) => getActorProfile(id).maxHp],
    ['attackBoost', (id) => getActorProfile(id).attack],
    ['hpRecovery', (id) => getActorProfile(id).hpRecovery],
    ['moveSpeed', (id) => getActorProfile(id).runSpeed],
    ['jumpHeight', (id) => getActorJumpHeight(getActorProfile(id))],
    ['clawKnifeCdHit', (id) => getActorProfile(id).attackCooldown.hit],
    ['clawKnifeCdUnhit', (id) => getActorProfile(id).attackCooldown.miss],
    ['clawKnifeRange', (id) => getActorProfile(id).attackRange],
    ['cheesePushSpeed', (id) => getActorProfile(id).pushCheeseSpeed],
    ['wallCrackDamageBoost', (id) => getActorProfile(id).wallDamage],
  ])('keeps the %s route key backed by its canonical selector', (property, getExpectedValue) => {
    const propertyInfo = getPropertyInfo(property);
    expect(propertyInfo).toBeDefined();
    expect(propertyInfo?.getValue(getActorProfile('汤姆'))).toBe(getExpectedValue('汤姆'));
    expect(propertyInfo?.getValue(getActorProfile('杰瑞'))).toBe(getExpectedValue('杰瑞'));
  });

  it('sorts lower cooldowns first', () => {
    const ranked = rankCharactersByProperty(selectCharacters('苏蕊', '如玉'), 'clawKnifeCdUnhit');

    expect(ranked.map(({ character, value }) => [character.id, value])).toEqual([
      ['如玉', 0.8],
      ['苏蕊', 4.9],
    ]);
  });

  it('uses the displayed integer jump height for ordering, formatting, and ties', () => {
    const ranked = rankCharactersByProperty(selectCharacters('汤姆', '杰瑞', '布奇'), 'jumpHeight');

    expect(
      ranked.map(({ character, rank, value, formattedValue }) => ({
        id: character.id,
        rank,
        value,
        formattedValue,
      }))
    ).toEqual([
      { id: '汤姆', rank: 1, value: 483, formattedValue: '483' },
      { id: '布奇', rank: 1, value: 483, formattedValue: '483' },
      { id: '杰瑞', rank: 3, value: 438, formattedValue: '438' },
    ]);
  });

  it('uses Character.factionId for property and query restrictions', () => {
    const catAndMouse = selectCharacters('汤姆', '杰瑞');

    expect(getCharactersWithProperty(catAndMouse, 'clawKnifeRange').map(({ id }) => id)).toEqual([
      '汤姆',
    ]);
    expect(getCharactersWithProperty(catAndMouse, 'cheesePushSpeed').map(({ id }) => id)).toEqual([
      '杰瑞',
    ]);
    expect(getCharactersWithProperty(catAndMouse, 'maxHp', 'mouse').map(({ id }) => id)).toEqual([
      '杰瑞',
    ]);
  });

  it('rejects characters without the required playable faction metadata', () => {
    const tom = selectCharacters('汤姆')[0];
    if (!tom) throw new Error('Missing 汤姆 fixture');
    const { factionId: _factionId, ...character } = tom;

    expect(() => rankCharactersByProperty([character], 'maxHp')).toThrow(
      'Character 汤姆 is missing its factionId'
    );
  });
});
