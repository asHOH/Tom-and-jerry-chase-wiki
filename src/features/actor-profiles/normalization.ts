import {
  assertValidActorProfiles,
  normalizeActorProfileName,
  parseRawActorProfiles,
  type ActorProfile,
  type ActorProfileValidationContext,
  type ActorType,
  type PhysicsType,
  type RawActorProfile,
} from './schema';

export const EXCLUDED_ACTOR_PROFILE_NAMES = new Set(['火箭']);

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

const requireNumber = (profile: RawActorProfile, key: keyof RawActorProfile): number => {
  const value = profile[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`profile ${profile.name}.${key}: missing required finite number`);
  }
  return value;
};

const requireCode = <T extends number>(
  profile: RawActorProfile,
  key: 'actorType' | 'physicsTag' | 'sex'
): T => {
  const value = profile[key];
  if (typeof value !== 'number')
    throw new Error(`profile ${profile.name}.${key}: missing required enum`);
  return value as T;
};

const parseSize = (profile: RawActorProfile): ActorProfile['size'] => {
  if (typeof profile.size !== 'string')
    throw new Error(`profile ${profile.name}.size: missing required size`);
  const match = /^(\d+(?:\.\d+)?);(\d+(?:\.\d+)?)$/.exec(profile.size);
  if (!match?.[1] || !match[2]) {
    throw new Error(`profile ${profile.name}.size: expected width;height numeric format`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
};

const normalizeJumpSpeed = (profile: RawActorProfile): number => {
  if (typeof profile.jumpSpeed === 'number') return profile.jumpSpeed;
  if (profile.name === '罗宾汉杰瑞' && profile.jumpSpeed === '1675;1450') return 1675;
  throw new Error(`profile ${profile.name}.jumpSpeed: unexpected nonnumeric value`);
};

const roundAtMostSixDecimals = (value: number): number => Number(value.toFixed(6));

const normalizeInitialItem = (profile: RawActorProfile): string | undefined => {
  if (profile.item === undefined) return undefined;
  const item = INITIAL_ITEMS[profile.item];
  if (!item)
    throw new Error(`profile ${profile.name}.item: unknown item identifier ${profile.item}`);
  return item;
};

const normalizeProfile = (profile: RawActorProfile): ActorProfile => {
  const actorType = requireCode<0 | 1 | 2>(profile, 'actorType');
  const physicsTag = requireCode<1 | 2 | 1009>(profile, 'physicsTag');
  const sex = requireCode<0 | 1 | 2>(profile, 'sex');
  const attackCooldownHit = requireNumber(profile, 'attackCd');
  const attackCooldownMiss =
    profile.attackMissCdRate === undefined
      ? undefined
      : roundAtMostSixDecimals(attackCooldownHit * profile.attackMissCdRate);
  const initialItem = normalizeInitialItem(profile);

  return {
    name: normalizeActorProfileName(profile.name),
    actorType: ROLE_TYPES[actorType],
    physicsType: PHYSICS_TYPES[physicsTag],
    sex: SEXES[sex],
    size: parseSize(profile),
    runSpeed: requireNumber(profile, 'runSpeed'),
    jumpSpeed: normalizeJumpSpeed(profile),
    climbSpeed: requireNumber(profile, 'climbSpeed'),
    visionScale: requireNumber(profile, 'vision'),
    gravity: requireNumber(profile, 'gravity'),
    baseHp: requireNumber(profile, 'baseHp'),
    maxHp: requireNumber(profile, 'maxHp'),
    hpRecovery: requireNumber(profile, 'hpRecover'),
    ...(profile.attack === undefined ? {} : { attack: profile.attack }),
    wallDamage: requireNumber(profile, 'attackGoldGate'),
    ...(profile.attackRange === undefined ? {} : { attackRange: profile.attackRange }),
    attackCooldown: {
      hit: attackCooldownHit,
      ...(attackCooldownMiss === undefined ? {} : { miss: attackCooldownMiss }),
    },
    ...(profile.pushCheese === undefined ? {} : { pushCheeseSpeed: profile.pushCheese * 5 }),
    ...(initialItem === undefined ? {} : { initialItem }),
    ...(profile.deformCD === undefined ? {} : { deformCooldown: profile.deformCD }),
    ...(profile.buyCD === undefined ? {} : { shoppingCooldown: profile.buyCD }),
    ...(profile.buyDelay === undefined ? {} : { shoppingDelay: profile.buyDelay }),
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

  for (const rawProfile of rawProfiles) {
    const normalizedName = normalizeActorProfileName(rawProfile.name);
    if (normalizedName.trim() !== normalizedName) {
      throw new Error(`profile ${rawProfile.name}: name contains surrounding whitespace`);
    }
    if (normalizedNames.has(normalizedName)) {
      throw new Error(`profile ${normalizedName}: duplicate normalized name`);
    }
    normalizedNames.add(normalizedName);

    if (normalizedName === '火箭') {
      // 火箭 is a process item, not a character. Only its known near-empty placeholder is excluded.
      if (rawProfile.actorType !== 2 || Object.keys(rawProfile).length !== 2) {
        throw new Error(
          'profile 火箭: exclusion only permits the documented near-empty placeholder'
        );
      }
      continue;
    }
    includedProfiles.push(normalizeProfile(rawProfile));
  }

  const profilesByName = new Map(includedProfiles.map((profile) => [profile.name, profile]));
  const playableNames = new Set(context.playableCharacters.map((character) => character.id));
  const playableProfiles = context.playableCharacters.map((character) => {
    const profile = profilesByName.get(character.id);
    if (!profile) throw new Error(`character ${character.id}: missing canonical profile`);
    return profile;
  });
  const remainingProfiles = includedProfiles
    .filter((profile) => !playableNames.has(profile.name))
    .sort((left, right) => compareCodePoints(left.name, right.name));
  const profiles = [...playableProfiles, ...remainingProfiles];

  return assertValidActorProfiles(profiles, {
    ...context,
    excludedNames: EXCLUDED_ACTOR_PROFILE_NAMES,
  });
};

export const serializeActorProfiles = (profiles: readonly ActorProfile[]): string =>
  `${JSON.stringify(profiles, null, 2)}\n`;
