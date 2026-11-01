import type { Character } from '@/data/types';
import { actorProfilesByName } from '@/features/actor-profiles/data';
import { getActorJumpHeight, getActorProfile } from '@/features/actor-profiles/selectors';
import { createActorProfileFixture } from '@/testUtils/actorProfiles';

import {
  getCharactersWithProperty,
  getPropertyInfo,
  rankCharactersByProperty,
  type RankableProperty,
} from './ranking';

jest.mock('@/features/actor-profiles/pendingProfiles', () => ({
  PENDING_ACTOR_PROFILE_NAMES: new Set(['待补充角色']),
}));

jest.mock('@/features/actor-profiles/data', () => ({ actorProfilesByName: { get: jest.fn() } }));

const characters: Record<string, Character> = Object.fromEntries(
  ['测试猫', '测试鼠', '相同跳高猫', '短冷却猫', '长冷却猫', '待补充角色'].map((id) => [
    id,
    {
      id,
      factionId: id === '测试鼠' || id === '待补充角色' ? 'mouse' : 'cat',
      description: '',
      skills: [],
      knowledgeCardGroups: [],
      imageUrl: '',
    },
  ])
);

beforeEach(() => {
  const profiles = [
    createActorProfileFixture({
      name: '测试猫',
      attackRange: 250,
      deformCooldown: 12,
      shoppingDelay: 1.25,
    }),
    createActorProfileFixture({ name: '测试鼠', jumpSpeed: 16, visionScale: 0.6 }),
    createActorProfileFixture({ name: '相同跳高猫', jumpSpeed: 20.04 }),
    createActorProfileFixture({ name: '短冷却猫', attackCooldown: { hit: 2, miss: 1 } }),
    createActorProfileFixture({ name: '长冷却猫', attackCooldown: { hit: 4, miss: 3 } }),
  ];
  jest
    .mocked(actorProfilesByName.get)
    .mockImplementation((name) => profiles.find((profile) => profile.name === name));
});

const selectCharacters = (...ids: string[]): Character[] =>
  ids.map((id) => {
    const character = characters[id];
    if (!character) throw new Error(`Missing test character: ${id}`);
    return character;
  });

describe('character ranking utilities', () => {
  it('excludes pending profiles from rankings and property filters', () => {
    const candidates = selectCharacters('待补充角色', '测试鼠');
    expect(getCharactersWithProperty(candidates, 'maxHp').map(({ id }) => id)).toEqual(['测试鼠']);
    expect(
      rankCharactersByProperty(candidates, 'maxHp').map(({ character }) => character.id)
    ).toEqual(['测试鼠']);
  });

  it.each<[RankableProperty, (roleId: string) => number | undefined]>([
    ['maxHp', (id) => getActorProfile(id).maxHp],
    ['attackBoost', (id) => getActorProfile(id).attack],
    ['hpRecovery', (id) => getActorProfile(id).hpRecovery],
    ['moveSpeed', (id) => getActorProfile(id).runSpeed],
    ['jumpHeight', (id) => getActorJumpHeight(getActorProfile(id))],
    ['jumpSpeed', (id) => getActorProfile(id).jumpSpeed],
    ['climbSpeed', (id) => getActorProfile(id).climbSpeed],
    ['visionScale', (id) => getActorProfile(id).visionScale],
    ['gravity', (id) => getActorProfile(id).gravity],
    ['clawKnifeCdHit', (id) => getActorProfile(id).attackCooldown.hit],
    ['clawKnifeCdUnhit', (id) => getActorProfile(id).attackCooldown.miss],
    ['clawKnifeRange', (id) => getActorProfile(id).attackRange],
    ['cheesePushSpeed', (id) => getActorProfile(id).pushCheeseSpeed],
    ['wallCrackDamageBoost', (id) => getActorProfile(id).wallDamage],
    ['deformCooldown', (id) => getActorProfile(id).deformCooldown],
    ['shoppingDelay', (id) => getActorProfile(id).shoppingDelay],
  ])('keeps the %s route key backed by its canonical selector', (property, getExpectedValue) => {
    const propertyInfo = getPropertyInfo(property);
    expect(propertyInfo).toBeDefined();
    expect(propertyInfo?.getValue(getActorProfile('测试猫'))).toBe(getExpectedValue('测试猫'));
    expect(propertyInfo?.getValue(getActorProfile('测试鼠'))).toBe(getExpectedValue('测试鼠'));
  });

  it('sorts lower cooldowns first', () => {
    const ranked = rankCharactersByProperty(
      selectCharacters('长冷却猫', '短冷却猫'),
      'clawKnifeCdUnhit'
    );

    expect(ranked.map(({ character, value }) => [character.id, value])).toEqual([
      ['短冷却猫', 1],
      ['长冷却猫', 3],
    ]);
  });

  it('sorts lower vision scales first', () => {
    const ranked = rankCharactersByProperty(selectCharacters('测试猫', '测试鼠'), 'visionScale');

    expect(ranked.map(({ value }) => value)).toEqual(
      [...ranked.map(({ value }) => value)].sort((a, b) => a - b)
    );
  });

  it('uses the displayed integer jump height for ordering, formatting, and ties', () => {
    const ranked = rankCharactersByProperty(
      selectCharacters('测试猫', '测试鼠', '相同跳高猫'),
      'jumpHeight'
    );

    expect(
      ranked.map(({ character, rank, value, formattedValue }) => ({
        id: character.id,
        rank,
        value,
        formattedValue,
      }))
    ).toEqual([
      { id: '测试猫', rank: 1, value: 100, formattedValue: '100' },
      { id: '相同跳高猫', rank: 1, value: 100, formattedValue: '100' },
      { id: '测试鼠', rank: 3, value: 64, formattedValue: '64' },
    ]);
  });

  it('uses Character.factionId for property and query restrictions', () => {
    const catAndMouse = selectCharacters('测试猫', '测试鼠');

    expect(getCharactersWithProperty(catAndMouse, 'clawKnifeRange').map(({ id }) => id)).toEqual([
      '测试猫',
    ]);
    expect(getCharactersWithProperty(catAndMouse, 'cheesePushSpeed').map(({ id }) => id)).toEqual([
      '测试鼠',
    ]);
    expect(getCharactersWithProperty(catAndMouse, 'maxHp', 'mouse').map(({ id }) => id)).toEqual([
      '测试鼠',
    ]);
  });

  it('rejects characters without the required playable faction metadata', () => {
    const cat = selectCharacters('测试猫')[0];
    if (!cat) throw new Error('Missing 测试猫 fixture');
    const { factionId: _factionId, ...character } = cat;

    expect(() => rankCharactersByProperty([character as Character], 'maxHp')).toThrow(
      'Character 测试猫 is missing its factionId'
    );
  });
});
