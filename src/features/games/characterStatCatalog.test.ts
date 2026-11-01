import { actorProfilesByName } from '@/features/actor-profiles/data';
import { createActorProfileFixture } from '@/testUtils/actorProfiles';

import {
  CHARACTER_GAME_STAT_INFO,
  compareCharacterGameStatValues,
  getCharacterGameStats,
} from './characterStatCatalog';

jest.mock('@/features/actor-profiles/pendingProfiles', () => ({
  PENDING_ACTOR_PROFILE_NAMES: new Set(['待补充角色']),
}));

jest.mock('@/features/actor-profiles/data', () => ({ actorProfilesByName: { get: jest.fn() } }));

beforeEach(() => {
  const profiles = [
    createActorProfileFixture({ name: '测试猫', actorType: 'cat', physicsType: 'cat' }),
    createActorProfileFixture({ name: '测试鼠', actorType: 'special', physicsType: 'cat' }),
    createActorProfileFixture({ name: '相同跳高猫', jumpSpeed: 20.04 }),
  ];
  jest
    .mocked(actorProfilesByName.get)
    .mockImplementation((name) => profiles.find((profile) => profile.name === name));
});

describe('characterStatCatalog', () => {
  it('leaves pending character statistics unavailable', () => {
    const stats = getCharacterGameStats({ id: '待补充角色', factionId: 'mouse' });
    expect(Object.keys(stats)).toEqual(Object.keys(CHARACTER_GAME_STAT_INFO));
    expect(Object.values(stats).every((value) => value === undefined)).toBe(true);
  });

  it('projects canonical fields into game statistics', () => {
    expect(getCharacterGameStats({ id: '测试鼠', factionId: 'mouse' })).toEqual({
      maxHp: 120,
      attackBoost: 0,
      moveSpeed: 700,
      jumpHeight: 100,
      clawKnifeCdHit: undefined,
      cheesePushSpeed: 3.5,
      wallCrackDamageBoost: 1,
    });
  });

  it('omits mechanics that do not apply to the playable character faction', () => {
    const cat = getCharacterGameStats({ id: '测试猫', factionId: 'cat' });
    const mouse = getCharacterGameStats({ id: '测试鼠', factionId: 'mouse' });

    expect(cat.clawKnifeCdHit).toBe(4);
    expect(cat.cheesePushSpeed).toBeUndefined();
    expect(cat.wallCrackDamageBoost).toBeUndefined();
    expect(mouse.clawKnifeCdHit).toBeUndefined();
    expect(mouse.attackBoost).toBe(0);
  });

  it('uses Character.factionId rather than canonical physics metadata for restrictions', () => {
    const stats = getCharacterGameStats({ id: '测试鼠', factionId: 'mouse' });

    expect(stats.clawKnifeCdHit).toBeUndefined();
  });

  it('treats lower cooldowns as better', () => {
    expect(compareCharacterGameStatValues(2, 4, 'clawKnifeCdHit')).toBe('left');
    expect(compareCharacterGameStatValues(4, 2, 'clawKnifeCdHit')).toBe('right');
    expect(CHARACTER_GAME_STAT_INFO.clawKnifeCdHit.higherIsBetter).toBe(false);
  });

  it('compares and ties jump heights using the displayed integer', () => {
    const cat = getCharacterGameStats({ id: '测试猫', factionId: 'cat' });
    const otherCat = getCharacterGameStats({ id: '相同跳高猫', factionId: 'cat' });

    expect(cat.jumpHeight).toBe(100);
    expect(otherCat.jumpHeight).toBe(100);
    expect(
      compareCharacterGameStatValues(cat.jumpHeight!, otherCat.jumpHeight!, 'jumpHeight')
    ).toBe('tie');
  });
});
