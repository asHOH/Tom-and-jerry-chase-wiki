import type { FactionId } from '@/data/types';

export type ActorType = 'mouse' | 'cat' | 'special';
export type PhysicsType = FactionId | 'special';

export type ActorProfile = {
  name: string;
  actorType: ActorType;
  physicsType: PhysicsType;
  sex: 'male' | 'female' | 'none';
  size: { width: number; height: number };
  runSpeed: number;
  jumpSpeed: number;
  climbSpeed: number;
  visionScale: number;
  gravity: number;
  baseHp: number;
  maxHp: number;
  hpRecovery: number;
  attack?: number;
  wallDamage: number;
  attackRange?: number;
  attackCooldown: {
    hit: number;
    miss?: number;
  };
  pushCheeseSpeed?: number;
  initialItem?: string;
  deformCooldown?: number;
  shoppingCooldown?: number;
  shoppingDelay?: number;
};

export type RawActorProfile = {
  name: string;
  actorType?: 0 | 1 | 2;
  physicsTag?: 1 | 2 | 1009;
  sex?: 0 | 1 | 2;
  size?: string;
  runSpeed?: number;
  jumpSpeed?: number | string;
  climbSpeed?: number;
  vision?: number;
  gravity?: number;
  baseHp?: number;
  maxHp?: number;
  hpRecover?: number;
  attack?: number;
  attackGoldGate?: number;
  attackRange?: number;
  attackCd?: number;
  attackMissCdRate?: number;
  pushCheese?: number;
  item?: string;
  deformCD?: number;
  buyCD?: number;
  buyDelay?: number;
};

export type PlayableCharacterRef = {
  id: string;
  factionId: FactionId;
};

export type ActorProfileReference = {
  source: string;
  name: string;
  hasLegacyRepresentation: boolean;
};

export type ActorProfileValidationContext = {
  playableCharacters: readonly PlayableCharacterRef[];
  references: readonly ActorProfileReference[];
  excludedNames: ReadonlySet<string>;
};

const RAW_KEYS = new Set<keyof RawActorProfile>([
  'name',
  'actorType',
  'physicsTag',
  'sex',
  'size',
  'runSpeed',
  'jumpSpeed',
  'climbSpeed',
  'vision',
  'gravity',
  'baseHp',
  'maxHp',
  'hpRecover',
  'attack',
  'attackGoldGate',
  'attackRange',
  'attackCd',
  'attackMissCdRate',
  'pushCheese',
  'item',
  'deformCD',
  'buyCD',
  'buyDelay',
]);

const CANONICAL_KEYS = new Set<keyof ActorProfile>([
  'name',
  'actorType',
  'physicsType',
  'sex',
  'size',
  'runSpeed',
  'jumpSpeed',
  'climbSpeed',
  'visionScale',
  'gravity',
  'baseHp',
  'maxHp',
  'hpRecovery',
  'attack',
  'wallDamage',
  'attackRange',
  'attackCooldown',
  'pushCheeseSpeed',
  'initialItem',
  'deformCooldown',
  'shoppingCooldown',
  'shoppingDelay',
]);

const REQUIRED_CANONICAL_KEYS = [
  'name',
  'actorType',
  'physicsType',
  'sex',
  'size',
  'runSpeed',
  'jumpSpeed',
  'climbSpeed',
  'visionScale',
  'gravity',
  'baseHp',
  'maxHp',
  'hpRecovery',
  'wallDamage',
  'attackCooldown',
] as const satisfies readonly (keyof ActorProfile)[];

const RAW_NUMBER_KEYS = [
  'runSpeed',
  'climbSpeed',
  'vision',
  'gravity',
  'baseHp',
  'maxHp',
  'hpRecover',
  'attack',
  'attackGoldGate',
  'attackRange',
  'attackCd',
  'attackMissCdRate',
  'pushCheese',
  'deformCD',
  'buyCD',
  'buyDelay',
] as const satisfies readonly (keyof RawActorProfile)[];

const CANONICAL_NUMBER_KEYS = [
  'runSpeed',
  'jumpSpeed',
  'climbSpeed',
  'visionScale',
  'gravity',
  'baseHp',
  'maxHp',
  'hpRecovery',
  'attack',
  'wallDamage',
  'attackRange',
  'pushCheeseSpeed',
  'deformCooldown',
  'shoppingCooldown',
  'shoppingDelay',
] as const satisfies readonly (keyof ActorProfile)[];

type UnknownRecord = Record<string, unknown>;

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

const requireRecord = (value: unknown, path: string): UnknownRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'expected an object');
  }
  return value as UnknownRecord;
};

const assertExactKeys = (record: UnknownRecord, allowedKeys: ReadonlySet<string>, path: string) => {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      fail(`${path}.${key}`, 'unknown key');
    }
  }
};

function assertFiniteNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, 'expected a finite number');
  }
}

const assertOptionalFiniteNumber = (record: UnknownRecord, key: string, path: string) => {
  if (key in record) {
    assertFiniteNumber(record[key], `${path}.${key}`);
  }
};

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') {
    fail(path, 'expected a string');
  }
}

function assertEnum<T extends string | number>(
  value: unknown,
  values: ReadonlySet<T>,
  path: string
): asserts value is T {
  if (!values.has(value as T)) {
    fail(path, `unknown enum value ${String(value)}`);
  }
}

export const normalizeCharacterRoleName = (name: string): string => {
  if (name === '表演者▪杰瑞') return '表演者•杰瑞';
  if (name === '\\"正气守护\\"斯派克') return '“正气守护”斯派克';
  return name;
};

export const parseRawActorProfiles = (input: unknown): readonly RawActorProfile[] => {
  if (!Array.isArray(input)) {
    fail('roles', 'expected an array');
  }

  const values: unknown[] = input;
  return values.map((value, index) => {
    const path = `roles[${index}]`;
    const record = requireRecord(value, path);
    assertExactKeys(record, RAW_KEYS, path);
    assertString(record.name, `${path}.name`);
    if (record.name.trim().length === 0) fail(`${path}.name`, 'expected a nonempty name');

    if ('actorType' in record) {
      assertEnum(record.actorType, new Set([0, 1, 2]), `${path}.actorType`);
    }
    if ('physicsTag' in record) {
      assertEnum(record.physicsTag, new Set([1, 2, 1009]), `${path}.physicsTag`);
    }
    if ('sex' in record) {
      assertEnum(record.sex, new Set([0, 1, 2]), `${path}.sex`);
    }
    if ('size' in record) assertString(record.size, `${path}.size`);
    if ('item' in record) assertString(record.item, `${path}.item`);
    if ('jumpSpeed' in record) {
      const jumpSpeed = record.jumpSpeed;
      if (typeof jumpSpeed !== 'string') {
        assertFiniteNumber(jumpSpeed, `${path}.jumpSpeed`);
      }
    }
    for (const key of RAW_NUMBER_KEYS) {
      assertOptionalFiniteNumber(record, key, path);
    }

    return record as RawActorProfile;
  });
};

export const parseActorProfiles = (input: unknown): readonly ActorProfile[] => {
  if (!Array.isArray(input)) {
    fail('roles', 'expected an array');
  }

  const values: unknown[] = input;
  values.forEach((value, index) => {
    const path = `roles[${index}]`;
    const record = requireRecord(value, path);
    assertExactKeys(record, CANONICAL_KEYS, path);

    for (const key of REQUIRED_CANONICAL_KEYS) {
      if (!(key in record)) fail(`${path}.${key}`, 'missing required field');
    }

    assertString(record.name, `${path}.name`);
    if (record.name.trim().length === 0) fail(`${path}.name`, 'expected a nonempty name');
    assertEnum(record.actorType, new Set(['mouse', 'cat', 'special']), `${path}.actorType`);
    assertEnum(record.physicsType, new Set(['mouse', 'cat', 'special']), `${path}.physicsType`);
    assertEnum(record.sex, new Set(['male', 'female', 'none']), `${path}.sex`);

    const size = requireRecord(record.size, `${path}.size`);
    assertExactKeys(size, new Set(['width', 'height']), `${path}.size`);
    if (!('width' in size)) fail(`${path}.size.width`, 'missing required field');
    if (!('height' in size)) fail(`${path}.size.height`, 'missing required field');
    assertFiniteNumber(size.width, `${path}.size.width`);
    assertFiniteNumber(size.height, `${path}.size.height`);

    for (const key of CANONICAL_NUMBER_KEYS) {
      assertOptionalFiniteNumber(record, key, path);
    }
    const gravity = record.gravity;
    assertFiniteNumber(gravity, `${path}.gravity`);
    if (gravity >= 0) fail(`${path}.gravity`, 'expected negative, nonzero gravity');

    const cooldown = requireRecord(record.attackCooldown, `${path}.attackCooldown`);
    assertExactKeys(cooldown, new Set(['hit', 'miss']), `${path}.attackCooldown`);
    if (!('hit' in cooldown)) fail(`${path}.attackCooldown.hit`, 'missing required field');
    assertFiniteNumber(cooldown.hit, `${path}.attackCooldown.hit`);
    assertOptionalFiniteNumber(cooldown, 'miss', `${path}.attackCooldown`);

    if ('initialItem' in record) {
      assertString(record.initialItem, `${path}.initialItem`);
      if (record.initialItem.length === 0)
        fail(`${path}.initialItem`, 'expected a nonempty string');
    }
  });

  return values as readonly ActorProfile[];
};

export const assertValidActorProfiles = (
  input: unknown,
  context: ActorProfileValidationContext
): readonly ActorProfile[] => {
  const roles = parseActorProfiles(input);
  const rolesByName = new Map<string, ActorProfile>();

  for (const role of roles) {
    if (role.name.trim() !== role.name || normalizeCharacterRoleName(role.name) !== role.name) {
      fail(`role ${role.name}`, 'name is not normalized');
    }
    if (rolesByName.has(role.name)) fail(`role ${role.name}`, 'duplicate normalized name');
    rolesByName.set(role.name, role);
  }

  for (const character of context.playableCharacters) {
    const role = rolesByName.get(character.id);
    if (!role) fail(`character ${character.id}`, 'missing canonical role');

    if (character.factionId === 'cat') {
      if (role.attack === undefined)
        fail(`character ${character.id}`, 'playable cat requires attack');
      if (role.attackRange === undefined) {
        fail(`character ${character.id}`, 'playable cat requires attackRange');
      }
      if (role.attackCooldown.miss === undefined) {
        fail(`character ${character.id}`, 'playable cat requires attackCooldown.miss');
      }
    } else if (role.pushCheeseSpeed === undefined) {
      fail(`character ${character.id}`, 'playable mouse requires pushCheeseSpeed');
    }
  }

  for (const reference of context.references) {
    if (reference.hasLegacyRepresentation) {
      fail(reference.source, 'cannot combine characterRoleName with a legacy representation');
    }
    if (context.excludedNames.has(reference.name)) {
      fail(reference.source, `references excluded role ${reference.name}`);
    }
    if (!rolesByName.has(reference.name)) {
      fail(reference.source, `references missing canonical role ${reference.name}`);
    }
  }

  for (const excludedName of context.excludedNames) {
    if (rolesByName.has(excludedName)) fail(`role ${excludedName}`, 'excluded role is present');
  }

  return roles;
};
