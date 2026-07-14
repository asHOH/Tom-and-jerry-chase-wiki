import {
  assertValidActorProfiles,
  normalizeCharacterRoleName,
  parseRawActorProfiles,
  type ActorProfile,
  type ActorProfileValidationContext,
  type ActorType,
  type PhysicsType,
  type RawActorProfile,
} from './schema';

export const EXCLUDED_CHARACTER_ROLE_NAMES = new Set(['火箭']);

const ROLE_TYPES: Readonly<Record<0 | 1 | 2, ActorType>> = {
  0: 'mouse',
  1: 'cat',
  2: 'special',
};

const PHYSICS_TYPES: Readonly<Record<1 | 2 | 1009, PhysicsType>> = {
  1: 'mouse',
  2: 'cat',
  1009: 'special',
};

const SEXES = {
  0: 'none',
  1: 'male',
  2: 'female',
} as const;

const INITIAL_ITEMS: Readonly<Record<string, string>> = {
  rattrap: '老鼠夹',
  dazhadan: '鞭炮束',
};

const requireNumber = (role: RawActorProfile, key: keyof RawActorProfile): number => {
  const value = role[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`role ${role.name}.${key}: missing required finite number`);
  }
  return value;
};

const requireCode = <T extends number>(
  role: RawActorProfile,
  key: 'actorType' | 'physicsTag' | 'sex'
): T => {
  const value = role[key];
  if (typeof value !== 'number') throw new Error(`role ${role.name}.${key}: missing required enum`);
  return value as T;
};

const parseSize = (role: RawActorProfile): ActorProfile['size'] => {
  if (typeof role.size !== 'string')
    throw new Error(`role ${role.name}.size: missing required size`);
  const match = /^(\d+(?:\.\d+)?);(\d+(?:\.\d+)?)$/.exec(role.size);
  if (!match?.[1] || !match[2]) {
    throw new Error(`role ${role.name}.size: expected width;height numeric format`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
};

const normalizeJumpSpeed = (role: RawActorProfile): number => {
  if (typeof role.jumpSpeed === 'number') return role.jumpSpeed;
  if (role.name === '罗宾汉杰瑞' && role.jumpSpeed === '1675;1450') return 1675;
  throw new Error(`role ${role.name}.jumpSpeed: unexpected nonnumeric value`);
};

const roundAtMostSixDecimals = (value: number): number => Number(value.toFixed(6));

const normalizeInitialItem = (role: RawActorProfile): string | undefined => {
  if (role.item === undefined) return undefined;
  const item = INITIAL_ITEMS[role.item];
  if (!item) throw new Error(`role ${role.name}.item: unknown item identifier ${role.item}`);
  return item;
};

const normalizeRole = (role: RawActorProfile): ActorProfile => {
  const actorType = requireCode<0 | 1 | 2>(role, 'actorType');
  const physicsTag = requireCode<1 | 2 | 1009>(role, 'physicsTag');
  const sex = requireCode<0 | 1 | 2>(role, 'sex');
  const attackCooldownHit = requireNumber(role, 'attackCd');
  const attackCooldownMiss =
    role.attackMissCdRate === undefined
      ? undefined
      : roundAtMostSixDecimals(attackCooldownHit * role.attackMissCdRate);
  const initialItem = normalizeInitialItem(role);

  return {
    name: normalizeCharacterRoleName(role.name),
    actorType: ROLE_TYPES[actorType],
    physicsType: PHYSICS_TYPES[physicsTag],
    sex: SEXES[sex],
    size: parseSize(role),
    runSpeed: requireNumber(role, 'runSpeed'),
    jumpSpeed: normalizeJumpSpeed(role),
    climbSpeed: requireNumber(role, 'climbSpeed'),
    visionScale: requireNumber(role, 'vision'),
    gravity: requireNumber(role, 'gravity'),
    baseHp: requireNumber(role, 'baseHp'),
    maxHp: requireNumber(role, 'maxHp'),
    hpRecovery: requireNumber(role, 'hpRecover'),
    ...(role.attack === undefined ? {} : { attack: role.attack }),
    wallDamage: requireNumber(role, 'attackGoldGate'),
    ...(role.attackRange === undefined ? {} : { attackRange: role.attackRange }),
    attackCooldown: {
      hit: attackCooldownHit,
      ...(attackCooldownMiss === undefined ? {} : { miss: attackCooldownMiss }),
    },
    ...(role.pushCheese === undefined ? {} : { pushCheeseSpeed: role.pushCheese * 5 }),
    ...(initialItem === undefined ? {} : { initialItem }),
    ...(role.deformCD === undefined ? {} : { deformCooldown: role.deformCD }),
    ...(role.buyCD === undefined ? {} : { shoppingCooldown: role.buyCD }),
    ...(role.buyDelay === undefined ? {} : { shoppingDelay: role.buyDelay }),
  };
};

const compareCodePoints = (left: string, right: string): number => {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0)!);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0)!);
  const length = Math.min(leftPoints.length, rightPoints.length);

  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
};

export const normalizeActorProfiles = (
  input: unknown,
  context: Omit<ActorProfileValidationContext, 'excludedNames'>
): readonly ActorProfile[] => {
  const rawProfiles = parseRawActorProfiles(input);
  const normalizedNames = new Set<string>();
  const includedProfiles: ActorProfile[] = [];

  for (const rawRole of rawProfiles) {
    const normalizedName = normalizeCharacterRoleName(rawRole.name);
    if (normalizedName.trim() !== normalizedName) {
      throw new Error(`role ${rawRole.name}: name contains surrounding whitespace`);
    }
    if (normalizedNames.has(normalizedName)) {
      throw new Error(`role ${normalizedName}: duplicate normalized name`);
    }
    normalizedNames.add(normalizedName);

    if (normalizedName === '火箭') {
      // 火箭 is a process item, not a character. Only its known near-empty placeholder is excluded.
      if (rawRole.actorType !== 2 || Object.keys(rawRole).length !== 2) {
        throw new Error('role 火箭: exclusion only permits the documented near-empty placeholder');
      }
      continue;
    }
    includedProfiles.push(normalizeRole(rawRole));
  }

  const rolesByName = new Map(includedProfiles.map((role) => [role.name, role]));
  const playableNames = new Set(context.playableCharacters.map((character) => character.id));
  const playableRoles = context.playableCharacters.map((character) => {
    const role = rolesByName.get(character.id);
    if (!role) throw new Error(`character ${character.id}: missing canonical role`);
    return role;
  });
  const remainingRoles = includedProfiles
    .filter((role) => !playableNames.has(role.name))
    .sort((left, right) => compareCodePoints(left.name, right.name));
  const roles = [...playableRoles, ...remainingRoles];

  return assertValidActorProfiles(roles, {
    ...context,
    excludedNames: EXCLUDED_CHARACTER_ROLE_NAMES,
  });
};

export const serializeActorProfiles = (roles: readonly ActorProfile[]): string =>
  `${JSON.stringify(roles, null, 2)}\n`;
