import { normalizeCharacterRoles, serializeCharacterRoles } from './normalization';
import {
  assertCharacterRoleData,
  parseCharacterRoleCollection,
  type CharacterRole,
  type CharacterRoleValidationContext,
  type RawCharacterRole,
} from './schema';

const createRawRole = (overrides: Partial<RawCharacterRole> = {}): RawCharacterRole => ({
  name: '测试角色',
  roleType: 0,
  physicsTag: 1,
  sex: 1,
  size: '85;130',
  runSpeed: 650,
  jumpSpeed: 1675,
  climbSpeed: 300,
  vision: 0.64,
  gravity: -3202.94,
  baseHp: 99,
  maxHp: 99,
  hpRecover: 2,
  attack: 10,
  attackGoldGate: 1,
  attackCd: 4.5,
  attackMissCdRate: 0.33,
  pushCheese: 1.15,
  attackRange: 275,
  item: 'rattrap',
  deformCD: 20,
  buyCD: 10,
  buyDelay: 4,
  ...overrides,
});

const createContext = (
  id = '测试角色',
  factionId: 'cat' | 'mouse' = 'mouse'
): Omit<CharacterRoleValidationContext, 'excludedNames'> => ({
  playableCharacters: [{ id, factionId }],
  references: [],
});

const createCanonicalRole = (overrides: Partial<CharacterRole> = {}): CharacterRole => ({
  name: '测试角色',
  roleType: 'mouse',
  physicsType: 'mouse',
  sex: 'male',
  size: { width: 85, height: 130 },
  runSpeed: 650,
  jumpSpeed: 1675,
  climbSpeed: 300,
  visionScale: 0.64,
  gravity: -3202.94,
  baseHp: 99,
  maxHp: 99,
  hpRecovery: 2,
  wallDamage: 1,
  attackCooldown: { hit: 2 },
  pushCheeseSpeed: 5,
  ...overrides,
});

describe('character role normalization', () => {
  it('should map every raw field and normalize floating-point cooldown noise', () => {
    const [role] = normalizeCharacterRoles([createRawRole()], createContext());

    expect(role).toEqual({
      name: '测试角色',
      roleType: 'mouse',
      physicsType: 'mouse',
      sex: 'male',
      size: { width: 85, height: 130 },
      runSpeed: 650,
      jumpSpeed: 1675,
      climbSpeed: 300,
      visionScale: 0.64,
      gravity: -3202.94,
      baseHp: 99,
      maxHp: 99,
      hpRecovery: 2,
      attack: 10,
      wallDamage: 1,
      attackRange: 275,
      attackCooldown: { hit: 4.5, miss: 1.485 },
      pushCheeseSpeed: 5.75,
      initialItem: '老鼠夹',
      deformCooldown: 20,
      shoppingCooldown: 10,
      shoppingDelay: 4,
    });
  });

  it('should map dazhadan to the site-facing 鞭炮束 identifier', () => {
    const [role] = normalizeCharacterRoles([createRawRole({ item: 'dazhadan' })], createContext());

    expect(role?.initialItem).toBe('鞭炮束');
  });

  it('should apply the allowlisted corrections and explicitly exclude 火箭', () => {
    const specialRole = createRawRole({
      name: '\\"正气守护\\"斯派克',
      roleType: 2,
      physicsTag: 2,
      sex: 0,
    });
    delete specialRole.pushCheese;
    const roles = normalizeCharacterRoles(
      [
        createRawRole({ name: '罗宾汉杰瑞', jumpSpeed: '1675;1450' }),
        createRawRole({ name: '表演者▪杰瑞' }),
        specialRole,
        { name: '火箭', roleType: 2 },
      ],
      {
        playableCharacters: [
          { id: '罗宾汉杰瑞', factionId: 'mouse' },
          { id: '表演者•杰瑞', factionId: 'mouse' },
        ],
        references: [
          {
            source: 'entity 正气守护',
            name: '“正气守护”斯派克',
            hasLegacyRepresentation: false,
          },
        ],
      }
    );

    expect(roles.map((role) => role.name)).toEqual([
      '罗宾汉杰瑞',
      '表演者•杰瑞',
      '“正气守护”斯派克',
    ]);
    expect(roles[0]?.jumpSpeed).toBe(1675);
  });

  it('should serialize playable roles first and remaining roles in code-point order', () => {
    const roles = normalizeCharacterRoles(
      [
        createRawRole({ name: '乙' }),
        createRawRole({ name: '可玩乙' }),
        createRawRole({ name: '甲' }),
        createRawRole({ name: '可玩甲' }),
      ],
      {
        playableCharacters: [
          { id: '可玩甲', factionId: 'mouse' },
          { id: '可玩乙', factionId: 'mouse' },
        ],
        references: [],
      }
    );

    expect(roles.map((role) => role.name)).toEqual(['可玩甲', '可玩乙', '乙', '甲']);
    expect(serializeCharacterRoles(roles)).toBe(`${JSON.stringify(roles, null, 2)}\n`);
  });

  it.each([
    ['invalid enum', () => ({ ...createRawRole(), roleType: 9 }), 'unknown enum value'],
    ['malformed size', () => createRawRole({ size: '85,130' }), 'width;height'],
    [
      'unexpected jump punctuation',
      () => createRawRole({ jumpSpeed: '1675,1450' }),
      'unexpected nonnumeric',
    ],
    [
      'missing core field',
      () => {
        const role = createRawRole();
        delete role.gravity;
        return role;
      },
      'missing required finite number',
    ],
  ])('should reject %s', (_name, createInvalidRole, message) => {
    expect(() => normalizeCharacterRoles([createInvalidRole()], createContext())).toThrow(message);
  });

  it('should reject duplicate names after correction', () => {
    expect(() =>
      normalizeCharacterRoles(
        [createRawRole({ name: '表演者▪杰瑞' }), createRawRole({ name: '表演者•杰瑞' })],
        createContext('表演者•杰瑞')
      )
    ).toThrow('duplicate normalized name');
  });

  it('should reject missing faction-specific mechanics', () => {
    const catWithoutAttack = createRawRole();
    delete catWithoutAttack.attack;
    expect(() =>
      normalizeCharacterRoles([catWithoutAttack], createContext('测试角色', 'cat'))
    ).toThrow('playable cat requires attack');

    const mouseWithoutPushSpeed = createRawRole();
    delete mouseWithoutPushSpeed.pushCheese;
    expect(() =>
      normalizeCharacterRoles([mouseWithoutPushSpeed], createContext('测试角色', 'mouse'))
    ).toThrow('playable mouse requires pushCheeseSpeed');
  });

  it('should preserve an omitted non-applicable miss cooldown', () => {
    const rawRole = createRawRole();
    delete rawRole.attackMissCdRate;
    const [role] = normalizeCharacterRoles([rawRole], createContext());
    expect(role?.attackCooldown).toEqual({ hit: 4.5 });
  });
});

describe('character role validation', () => {
  it('should reject unknown keys and non-finite values', () => {
    expect(() => parseCharacterRoleCollection([{ ...createCanonicalRole(), extra: true }])).toThrow(
      'unknown key'
    );
    expect(() =>
      parseCharacterRoleCollection([createCanonicalRole({ runSpeed: Number.NaN })])
    ).toThrow('expected a finite number');
  });

  it('should reject broken, excluded, and mixed legacy references', () => {
    const baseContext = {
      playableCharacters: [{ id: '测试角色', factionId: 'mouse' as const }],
      excludedNames: new Set(['火箭']),
    };
    const role = createCanonicalRole();

    expect(() =>
      assertCharacterRoleData([role], {
        ...baseContext,
        references: [{ source: 'entity 缺失', name: '不存在', hasLegacyRepresentation: false }],
      })
    ).toThrow('references missing canonical role');
    expect(() =>
      assertCharacterRoleData([role], {
        ...baseContext,
        references: [{ source: 'item 火箭', name: '火箭', hasLegacyRepresentation: false }],
      })
    ).toThrow('references excluded role');
    expect(() =>
      assertCharacterRoleData([role], {
        ...baseContext,
        references: [{ source: 'entity 混合', name: '测试角色', hasLegacyRepresentation: true }],
      })
    ).toThrow('cannot combine');
  });
});
