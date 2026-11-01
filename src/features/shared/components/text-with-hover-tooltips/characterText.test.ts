import { characters } from '@/data/static';
import { actorProfilesByName } from '@/features/actor-profiles/data';
import { createActorProfileFixture } from '@/testUtils/actorProfiles';

import { preprocessText, resolveCharacterExpression, wrapAutoNamesInText } from './characterText';

jest.mock('@/features/actor-profiles/pendingProfiles', () => ({
  PENDING_ACTOR_PROFILE_NAMES: new Set(['待补充角色']),
}));

jest.mock('@/features/actor-profiles/data', () => ({ actorProfilesByName: { get: jest.fn() } }));

const character = {
  ...characters['巴特']!,
  id: '测试角色',
  specialClawKnifeCdHit: 8,
  specialClawKnifeCdUnhit: 4,
};
beforeEach(() => {
  jest
    .mocked(actorProfilesByName.get)
    .mockImplementation((name) =>
      name === character.id ? createActorProfileFixture({ name }) : undefined
    );
});

it('leaves pending character attribute expressions unresolved while preserving skills', () => {
  const pendingCharacter = { ...character, id: '待补充角色' };
  expect(resolveCharacterExpression('maxHp', pendingCharacter)).toBeUndefined();
  expect(resolveCharacterExpression('skills[0].name', pendingCharacter)).toBe(
    character.skills[0]!.name
  );
});

it('resolves attributes alongside character skill expressions', () => {
  expect(resolveCharacterExpression('maxHp', character)).toBe(120);
  expect(resolveCharacterExpression('skills[0].name', character)).toBe(character.skills[0]!.name);
});

describe('wrapAutoNamesInText', () => {
  it('prefers higher-priority overlapping names over earlier lower-priority matches', () => {
    expect(wrapAutoNamesInText('ABC', ['BC', 'AB'], new Set())).toBe('A{BC}');
  });

  it('uses the longest matching name at the same position', () => {
    expect(wrapAutoNamesInText('剑客泰菲冲刺', ['剑客泰菲', '泰菲'], new Set())).toBe(
      '{剑客泰菲}冲刺'
    );
  });

  it('lets current character names block overlapping auto-wrap matches', () => {
    expect(wrapAutoNamesInText('侦探汤姆登场', ['侦探汤姆', '汤姆'], new Set(['侦探汤姆']))).toBe(
      '侦探汤姆登场'
    );
  });
});

describe('preprocessText', () => {
  it('wraps known non-current character names', () => {
    expect(preprocessText('布奇登场', '汤姆')).toBe('{布奇}登场');
  });

  it('does not wrap the current character name', () => {
    expect(preprocessText('汤姆登场', '汤姆')).toBe('汤姆登场');
  });

  it('wraps eligible names around existing markup without double-wrapping it', () => {
    expect(preprocessText('布奇{隐身}', '汤姆')).toBe('{布奇}{隐身}');
    expect(preprocessText('布奇《主动技能》', '汤姆')).toBe('{布奇}《主动技能》');
    expect(preprocessText('{布奇}登场', '汤姆')).toBe('{布奇}登场');
  });

  it('preserves current-character exclusions around existing markup', () => {
    expect(preprocessText('汤姆造成{25*}伤害', '汤姆')).toBe('汤姆造成{25*}伤害');
  });

  it('preserves malformed markup while wrapping eligible plain text', () => {
    expect(preprocessText('布奇{未闭合', '汤姆')).toBe('{布奇}{未闭合');
  });

  it('does not auto-wrap names inside inline-class markup', () => {
    expect(preprocessText('$布奇$text-orange-500#登场', '汤姆')).toBe('$布奇$text-orange-500#登场');
  });
});

describe('resolveCharacterExpression', () => {
  it('resolves covered placeholders from canonical actor profile data', () => {
    expect(resolveCharacterExpression(':maxHp', character)).toBe(120);
    expect(resolveCharacterExpression(':jumpHeight', character)).toBe(100);
    expect(resolveCharacterExpression(':clawKnifeCdUnhit', character)).toBe(2);
  });

  it('keeps skill-specific cooldown placeholders on the character definition', () => {
    expect(resolveCharacterExpression(':specialClawKnifeCdHit', character)).toBe(8);
    expect(resolveCharacterExpression(':specialClawKnifeCdUnhit', character)).toBe(4);
  });
});
