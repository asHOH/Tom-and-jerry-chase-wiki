import {
  CHARACTER_ROLE_ATTRIBUTE_KEYS,
  CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS,
  formatCharacterRoleAttackCooldown,
  formatCharacterRolePhysicsType,
  formatCharacterRoleSex,
  formatCharacterRoleSize,
  formatCharacterRoleType,
  getCharacterRole,
  getCharacterRoleForCharacter,
  getCharacterRoleJumpHeight,
  haveUniformDisplayedGravity,
  isFactionDisplayedGravityUniform,
} from '.';

describe('character role domain', () => {
  it('should strictly resolve canonical roles', () => {
    expect(getCharacterRole('汤姆').name).toBe('汤姆');
    expect(() => getCharacterRole('不存在的角色')).toThrow('Missing canonical character role');
  });

  it('should calculate one integer jump height selector', () => {
    const role = getCharacterRole('汤姆');
    expect(getCharacterRoleJumpHeight(role)).toBe(
      Math.round(role.jumpSpeed ** 2 / (2 * Math.abs(role.gravity)))
    );
    expect(Number.isInteger(getCharacterRoleJumpHeight(role))).toBe(true);
  });

  it('should format canonical values without unknown fallbacks', () => {
    expect(formatCharacterRoleType('special')).toBe('特殊');
    expect(formatCharacterRolePhysicsType('cat')).toBe('猫');
    expect(formatCharacterRoleSex('none')).toBe('无性别');
    expect(formatCharacterRoleSize({ width: 85, height: 130 })).toBe('85 × 130');
    expect(formatCharacterRoleAttackCooldown({ hit: 4.5, miss: 2.25 })).toBe(
      '未命中 2.25 秒 / 命中 4.5 秒'
    );
    expect(formatCharacterRoleAttackCooldown({ hit: 2 })).toBe('命中 2 秒');
  });

  it('should determine gravity uniformity from playable faction membership', () => {
    expect(isFactionDisplayedGravityUniform('cat')).toBe(true);
    expect(isFactionDisplayedGravityUniform('mouse')).toBe(true);

    const baseRole = getCharacterRole('汤姆');
    expect(
      haveUniformDisplayedGravity([
        baseRole,
        { ...baseRole, name: '未来角色', gravity: baseRole.gravity - 100 },
      ])
    ).toBe(false);
  });

  it('should join by character id without inferring faction from role fields', () => {
    const role = getCharacterRoleForCharacter({ id: '兔子大表哥', factionId: 'mouse' });

    expect(role.roleType).toBe('special');
    expect(role.physicsType).toBe('cat');
  });

  it('should provide a tooltip for every role attribute key', () => {
    expect(Object.keys(CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS).sort()).toEqual(
      [...CHARACTER_ROLE_ATTRIBUTE_KEYS].sort()
    );
    expect(CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS.visionScale).toContain('视野');
  });
});
