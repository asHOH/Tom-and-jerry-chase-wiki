import {
  ACTOR_ATTRIBUTE_KEYS,
  ACTOR_ATTRIBUTE_PRESENTATION,
  formatActorAttackCooldown,
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

describe('character role domain', () => {
  it('should strictly resolve canonical roles', () => {
    expect(getActorProfile('汤姆').name).toBe('汤姆');
    expect(() => getActorProfile('不存在的角色')).toThrow('Missing canonical character role');
  });

  it('should calculate one integer jump height selector', () => {
    const profile = getActorProfile('汤姆');
    expect(getActorJumpHeight(profile)).toBe(
      Math.round(profile.jumpSpeed ** 2 / (2 * Math.abs(profile.gravity)))
    );
    expect(Number.isInteger(getActorJumpHeight(profile))).toBe(true);
  });

  it('should format canonical values without unknown fallbacks', () => {
    expect(formatActorType('special')).toBe('特殊');
    expect(formatActorPhysicsType('cat')).toBe('猫');
    expect(formatActorSex('none')).toBe('无性别');
    expect(formatActorSize({ width: 85, height: 130 })).toBe('85 × 130');
    expect(formatActorAttackCooldown({ hit: 4.5, miss: 2.25 })).toBe('未命中 2.25 s / 命中 4.5 s');
    expect(formatActorAttackCooldown({ hit: 2 })).toBe('命中 2 s');
  });

  it('should determine gravity uniformity from playable faction membership', () => {
    expect(isFactionDisplayedGravityUniform('cat')).toBe(true);
    expect(isFactionDisplayedGravityUniform('mouse')).toBe(true);

    const baseProfile = getActorProfile('汤姆');
    expect(
      haveUniformDisplayedGravity([
        baseProfile,
        { ...baseProfile, name: '未来角色', gravity: baseProfile.gravity - 100 },
      ])
    ).toBe(false);
  });

  it('should join by character id without inferring faction from role fields', () => {
    const profile = getActorProfileForCharacter({ id: '兔子大表哥', factionId: 'mouse' });

    expect(profile.actorType).toBe('special');
    expect(profile.physicsType).toBe('cat');
  });

  it('should provide a tooltip for every role attribute key', () => {
    expect(Object.keys(ACTOR_ATTRIBUTE_PRESENTATION).sort()).toEqual(
      [...ACTOR_ATTRIBUTE_KEYS].sort()
    );
    expect(ACTOR_ATTRIBUTE_PRESENTATION.visionScale.tooltip).toContain('视野');
    expect(ACTOR_ATTRIBUTE_PRESENTATION.hpRecovery).toMatchObject({
      label: 'Hp恢复',
      suffix: 'Hp/s',
      numeric: true,
    });
  });
});
