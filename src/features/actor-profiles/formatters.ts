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

const PHYSICS_BODY_NAME_LABELS: Readonly<Record<string, string>> = {
  tom: '“汤姆”',
  topsy: '“托普斯”',
  jerry: '“杰瑞”',
  tuffy: '“泰菲”',
  '2v6dog': '“斯派克”',
  '2v6bianshenxingxing': '“仙女星”',
  jiroutuzi: '“兔子大表哥”',
  big_chungus: '“兔霸哥”',
  baby_elephant: '“小象”',
  Duck: '“小黄鸭”',
  nianshou: '“年兽”',
  doghouse: '“斯派克之家”',
  conmouse: '“机器鼠”',
  mecha_tom: '“机甲汤姆”',
  xiaoXiongmao: '“熊猫”',
  '2v6chaojibianshenxingxing': '“超级仙女星”',
  hold_agent_fanner: '“电风扇”',
  kuijia: '“盔甲人”',
  muscle_jerry: '“肌肉杰瑞”',
  muscle_tom: '“肌肉汤姆”',
  qiankundai: '“胖呆呆”',
  mamaDuck: '“鸭妈妈”',
  dadDuck: '“鸭爸爸”',
};

export const formatActorAttributeNumber = (value: number): string => String(value);

export const formatActorType = (value: ActorType): string => ACTOR_TYPE_LABELS[value];

export const formatActorPhysicsType = (value: PhysicsType): string => PHYSICS_TYPE_LABELS[value];

export const formatActorPhysicsBodyName = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : (PHYSICS_BODY_NAME_LABELS[value] ?? value);

export const formatActorSex = (value: ActorProfile['sex']): string => SEX_LABELS[value];

export const formatActorSize = (value: ActorProfile['size']): string =>
  `${value.width} × ${value.height}`;

export const formatActorAttackCooldown = (value: ActorProfile['attackCooldown']): string =>
  value.miss === undefined
    ? `命中 ${formatActorAttributeNumber(value.hit)} s`
    : `未命中 ${formatActorAttributeNumber(value.miss)} s / 命中 ${formatActorAttributeNumber(value.hit)} s`;
