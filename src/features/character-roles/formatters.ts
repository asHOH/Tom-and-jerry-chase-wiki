import type { CharacterRole, PhysicsType, RoleType } from './schema';

const ROLE_TYPE_LABELS: Readonly<Record<RoleType, string>> = {
  mouse: '老鼠',
  cat: '猫咪',
  special: '特殊',
};

const PHYSICS_TYPE_LABELS: Readonly<Record<PhysicsType, string>> = {
  mouse: '鼠',
  cat: '猫',
  special: '特殊',
};

const SEX_LABELS: Readonly<Record<CharacterRole['sex'], string>> = {
  male: '男性',
  female: '女性',
  none: '无性别',
};

export const formatCharacterRoleNumber = (value: number): string => String(value);

export const formatCharacterRoleType = (value: RoleType): string => ROLE_TYPE_LABELS[value];

export const formatCharacterRolePhysicsType = (value: PhysicsType): string =>
  PHYSICS_TYPE_LABELS[value];

export const formatCharacterRoleSex = (value: CharacterRole['sex']): string => SEX_LABELS[value];

export const formatCharacterRoleSize = (value: CharacterRole['size']): string =>
  `${value.width} × ${value.height}`;

export const formatCharacterRoleAttackCooldown = (
  value: CharacterRole['attackCooldown']
): string =>
  value.miss === undefined
    ? `命中 ${formatCharacterRoleNumber(value.hit)} 秒`
    : `未命中 ${formatCharacterRoleNumber(value.miss)} 秒 / 命中 ${formatCharacterRoleNumber(value.hit)} 秒`;
