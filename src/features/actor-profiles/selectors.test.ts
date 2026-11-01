import { createActorProfileFixture } from '@/testUtils/actorProfiles';

import {
  ACTOR_ATTRIBUTE_KEYS,
  ACTOR_ATTRIBUTE_PRESENTATION,
  formatActorAttackCooldown,
  formatActorPhysicsBodyName,
  formatActorPhysicsType,
  formatActorSex,
  formatActorSize,
  formatActorType,
  getActorJumpHeight,
  getActorProfile,
  getActorProfileForCharacter,
  haveUniformDisplayedGravity,
  isFactionDisplayedGravityUniform,
} from '.';
import { actorProfilesByName } from './data';
import { getOptionalActorProfile } from './selectors';

jest.mock('./pendingProfiles', () => ({
  PENDING_ACTOR_PROFILE_NAMES: new Set(['待补充角色']),
}));

jest.mock('./data', () => ({ actorProfilesByName: { get: jest.fn() } }));
jest.mock('@/features/characters/data/characterMetadata', () => ({
  characterFactionById: { 测试猫: 'cat', 测试鼠: 'mouse', 第二只测试鼠: 'mouse' },
}));

let profiles: ReturnType<typeof createActorProfileFixture>[];

beforeEach(() => {
  profiles = [
    createActorProfileFixture({ name: '测试猫', actorType: 'cat', physicsType: 'cat' }),
    createActorProfileFixture({ name: '测试鼠' }),
    createActorProfileFixture({ name: '第二只测试鼠', actorType: 'special', physicsType: 'cat' }),
    createActorProfileFixture({ name: '非玩家对象', gravity: -100 }),
  ];
  jest
    .mocked(actorProfilesByName.get)
    .mockImplementation((name) => profiles.find((profile) => profile.name === name));
});

describe('actor profile domain', () => {
  it('should strictly resolve canonical profiles', () => {
    expect(getActorProfile('测试猫')).toBe(profiles[0]);
    expect(() => getActorProfile('不存在的角色')).toThrow('Missing canonical actor profile');
  });

  it('allows only explicitly pending profiles to be unavailable', () => {
    expect(getOptionalActorProfile('待补充角色')).toBeUndefined();
    expect(getOptionalActorProfile('测试鼠')).toBe(getActorProfile('测试鼠'));
    expect(() => getOptionalActorProfile('不存在的角色')).toThrow(
      'Missing canonical actor profile'
    );
  });

  it.each([
    [20.04, 100],
    [20.06, 101],
  ])('rounds jump speed %s to integer height %s', (jumpSpeed, expectedHeight) => {
    const profile = createActorProfileFixture({ jumpSpeed });
    expect(getActorJumpHeight(profile)).toBe(expectedHeight);
  });

  it('should format canonical values without unknown fallbacks', () => {
    expect(formatActorType('special')).toBe('特殊');
    expect(formatActorPhysicsType('cat')).toBe('猫');
    expect(formatActorPhysicsBodyName('tom')).toBe('“汤姆”');
    expect(formatActorPhysicsBodyName('2v6dog')).toBe('“斯派克”');
    expect(formatActorSex('none')).toBe('无性别');
    expect(formatActorSize({ width: 85, height: 130 })).toBe('85 × 130');
    expect(formatActorAttackCooldown({ hit: 4.5, miss: 2.25 })).toBe('未命中 2.25 s / 命中 4.5 s');
    expect(formatActorAttackCooldown({ hit: 2 })).toBe('命中 2 s');
  });

  it('should determine gravity uniformity from playable faction membership', () => {
    expect(isFactionDisplayedGravityUniform('cat')).toBe(true);
    expect(isFactionDisplayedGravityUniform('mouse')).toBe(true);

    const baseProfile = getActorProfile('测试猫');
    expect(
      haveUniformDisplayedGravity([
        baseProfile,
        { ...baseProfile, name: '未来角色', gravity: baseProfile.gravity - 100 },
      ])
    ).toBe(false);
    profiles[1]!.gravity = -3;
    expect(isFactionDisplayedGravityUniform('mouse')).toBe(false);
  });

  it('keeps faction gravity non-uniform while a playable profile is pending', () => {
    const { characterFactionById } = jest.requireMock(
      '@/features/characters/data/characterMetadata'
    );
    characterFactionById['待补充角色'] = 'mouse';
    try {
      expect(isFactionDisplayedGravityUniform('mouse')).toBe(false);
      expect(isFactionDisplayedGravityUniform('cat')).toBe(true);
    } finally {
      delete characterFactionById['待补充角色'];
    }
  });

  it('should join by character id without inferring faction from profile fields', () => {
    const profile = getActorProfileForCharacter({ id: '第二只测试鼠', factionId: 'mouse' });

    expect(profile.actorType).toBe('special');
    expect(profile.physicsType).toBe('cat');
  });

  it('should provide presentation metadata for every actor attribute key', () => {
    expect(Object.keys(ACTOR_ATTRIBUTE_PRESENTATION).sort()).toEqual(
      [...ACTOR_ATTRIBUTE_KEYS].sort()
    );
    expect(ACTOR_ATTRIBUTE_PRESENTATION.visionScale.tooltip).toContain('视野');
    expect(
      Object.values(ACTOR_ATTRIBUTE_PRESENTATION).every(
        ({ detailedTooltip }) => detailedTooltip.length > 0
      )
    ).toBe(true);
    expect(ACTOR_ATTRIBUTE_PRESENTATION.hpRecovery).toMatchObject({
      label: 'Hp恢复',
      suffix: 'Hp/s',
      numeric: true,
    });
  });
});
