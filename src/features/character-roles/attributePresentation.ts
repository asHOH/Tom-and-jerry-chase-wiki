type CharacterRoleAttributePresentation = {
  label: string;
  tooltip: string;
  suffix?: string;
  numeric: boolean;
};

const defineCharacterRoleAttributeMeta = <TKey extends string>(
  metadata: Record<TKey, CharacterRoleAttributePresentation>
): Readonly<Record<TKey, CharacterRoleAttributePresentation>> => metadata;

export const CHARACTER_ROLE_ATTRIBUTE_META = defineCharacterRoleAttributeMeta({
  actorType: {
    label: '角色类型',
    tooltip: '角色类型：猫、鼠、特殊角色',
    numeric: false,
  },
  physicsType: {
    label: '物理特质',
    tooltip: '决定角色是否可进行某些交互，以及交互方式',
    numeric: false,
  },
  sex: {
    label: '性别',
    tooltip: '影响局内语音和塔拉等角色的技能效果',
    numeric: false,
  },
  EnglishName: {
    label: '英文名',
    tooltip: '角色的英文译名',
    numeric: false,
  },
  size: {
    label: '体型',
    tooltip: '角色的判定区域大小',
    numeric: false,
  },
  runSpeed: {
    label: '移速',
    tooltip: '横向移动速度；单位：单位长/s',
    suffix: '/s',
    numeric: true,
  },
  jumpSpeed: {
    label: '跳跃速度',
    tooltip: '跳跃的初速度；单位：单位长/s',
    suffix: '/s',
    numeric: true,
  },
  climbSpeed: {
    label: '攀爬速度',
    tooltip: '持续交互攀爬梯子的基础速度；单位：单位长/s',
    suffix: '/s',
    numeric: true,
  },
  visionScale: {
    label: '视野缩放',
    tooltip: '基础视野缩放倍率；数值越大，实际视野越小',
    numeric: true,
  },
  gravity: {
    label: '重力参数',
    tooltip: '受到的重力大小',
    numeric: true,
  },
  maxHp: {
    label: 'Hp上限',
    tooltip: '健康值上限，即“血条”',
    numeric: true,
  },
  hpRecovery: {
    label: 'Hp恢复',
    tooltip: '健康状态下每秒恢复的健康值',
    suffix: 'Hp/s',
    numeric: true,
  },
  attack: {
    label: '攻击力',
    tooltip: '增加对其他角色造成的伤害',
    numeric: true,
  },
  wallDamage: {
    label: '破坏力',
    tooltip: '增加对墙缝造成的伤害',
    numeric: true,
  },
  attackRange: {
    label: '爪刀范围',
    tooltip: '角色的基础攻击范围',
    numeric: true,
  },
  attackCooldown: {
    label: '爪刀CD',
    tooltip: '爪刀的冷却时间（命中/未命中）',
    numeric: true,
  },
  pushCheeseSpeed: {
    label: '推速',
    tooltip: '推奶酪速度；单位：%/s',
    suffix: '%/s',
    numeric: true,
  },
  initialItem: {
    label: '初始道具',
    tooltip: '初始手持的道具',
    numeric: false,
  },
  deformCooldown: {
    label: '变形彩蛋CD',
    tooltip: '部分角色特殊变形彩蛋的触发冷却',
    suffix: 's',
    numeric: true,
  },
  shoppingDelay: {
    label: '购物到货时间',
    tooltip: '角色开始购物至到货所需的时间',
    suffix: 's',
    numeric: true,
  },
});

export type CharacterRoleAttributeKey = keyof typeof CHARACTER_ROLE_ATTRIBUTE_META;

export const CHARACTER_ROLE_ATTRIBUTE_KEYS: readonly CharacterRoleAttributeKey[] = Object.keys(
  CHARACTER_ROLE_ATTRIBUTE_META
) as CharacterRoleAttributeKey[];
