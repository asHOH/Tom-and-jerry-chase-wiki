import type { ActorProfile, ActorType, PhysicsType } from './schema';

const ACTOR_TYPE_LABELS: Readonly<Record<ActorType, string>> = {
  mouse: '老鼠',
  cat: '猫咪',
  special: '特殊',
};

const PHYSICS_TYPE_LABELS: Readonly<Record<PhysicsType, string>> = {
  mouse: '鼠',
  cat: '猫',
  special: '特殊',
};

const SEX_LABELS: Readonly<Record<ActorProfile['sex'], string>> = {
  male: '男性',
  female: '女性',
  none: '无性别',
};

export const formatActorAttributeNumber = (value: number): string => String(value);

export const formatActorType = (value: ActorType): string => ACTOR_TYPE_LABELS[value];

export const formatActorPhysicsType = (value: PhysicsType): string => PHYSICS_TYPE_LABELS[value];

export const formatActorSex = (value: ActorProfile['sex']): string => SEX_LABELS[value];

export const formatActorSize = (value: ActorProfile['size']): string =>
  `${value.width} × ${value.height}`;

export const formatActorAttackCooldown = (value: ActorProfile['attackCooldown']): string =>
  value.miss === undefined
    ? `命中 ${formatActorAttributeNumber(value.hit)} s`
    : `未命中 ${formatActorAttributeNumber(value.miss)} s / 命中 ${formatActorAttributeNumber(value.hit)} s`;
