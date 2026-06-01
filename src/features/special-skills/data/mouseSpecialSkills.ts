import { SpecialSkill, SpecialSkillDefinition } from '@/data/types';

const getMouseSpecialSkillImageUrl = (name: string): string => {
  return `/images/mouseSpecialSkills/${encodeURIComponent(name)}.png`;
};

const mouseSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    cooldown: 80,
    description: '回复Hp并解除部分负面效果，且短暂加速。',
    detailedDescription:
      '回复25Hp，解除[部分不良状态](包括受伤、香水反向、烟雾失明、莱特宁1级被动标记等效果)，且加速20%，持续1.15秒。',
    adviceDescription: '适合**难以被快速击杀或需要额外恢复能力**的老鼠。用于增加续航。',
  },
  急速翻滚: {
    cooldown: 80,
    description: '向前翻滚一段距离，且短暂加速。',
    detailedDescription: '向前翻滚800距离，且加速12%，持续2秒。',
    adviceDescription: '只适合**少数**老鼠。用于补充位移和躲避技能，或与惯性类技能联动。',
  },
  干扰投掷: {
    cooldown: 80,
    description: '下次投掷命中敌方时，额外造成硬直效果。',
    detailedDescription:
      '在9.9秒内，投掷命中敌方时，额外造成0.95秒硬直效果（硬直：与眩晕类似，但不会击落道具和老鼠），触发1次后消失。',
    adviceDescription:
      '适合**需要干扰或牵制猫咪**的老鼠，或用于**对策部分怕干扰的猫咪**。用于破盾、补充控制或打断技能。',
  },
  魔术漂浮: {
    cooldown: 60,
    description: '只能在起跳后使用。立刻向斜上方进行一次固定数值的跳跃，并在一段时间内小幅失重。',
    adviceDescription:
      '适合**大部分**老鼠。用于赶路或逃跑，也可以在进行火箭救援后立刻释放特技以避免踩到{老鼠夹}。此外，[部分高低差地形](部分房间下方的地面允许角色自下而上通行，可利用漂浮直接到上方。包括夏日游轮的甲板、御门酒店的休息厅、部分雪夜古堡的活板门等；此外，游乐场的摩天轮和高台滑道、森林牧场的森林等房间也可以利用漂浮快速移动)可通过魔术漂浮快速移动，逼迫猫咪绕远路，达到拉扯逃跑的作用。',
  },
  勇气投掷: {
    cooldown: 50,
    description: '下次投掷命中敌方时，自己主动和武器技能的剩余CD减半。',
    detailedDescription:
      '在9.9秒内，投掷命中敌方时，自己正在冷却的主动和武器技能的剩余CD减半。触发1次后消失。',
    adviceDescription: '只适合**极少数**老鼠。用于缩短技能CD。',
  },
  冰冻保鲜: {
    aliases: ['冰箱'],
    cooldown: 75,
    description:
      '获得一段时间的冰冻和无敌效果。可再次点击技能提前结束该效果；任何方式结束技能都会失去无敌效果。',
    detailedDescription:
      '获得2.95秒冰冻和无敌效果（可被部分减少控制时间的效果减短，但不会被免控或霸体等效果抵消）。可再次点击技能提前结束该效果；任何方式结束技能都会失去无敌效果。',
    adviceDescription:
      '只适合**少数**老鼠，或用于**对策少数猫咪**。用于规避猫咪的攻击，或与解控类技能联动。',
  },
  绝处逢生: {
    aliases: ['自起'],
    cooldown: 85,
    description:
      '可在虚弱状态下使用。在短暂前摇后释放技能，等待2.5秒后解除虚弱和眩晕，并获得短暂的恢复效果。',
    detailedDescription:
      '可在虚弱状态下使用。在0.9秒前摇（可被跳跃键打断，不进入CD）后释放技能，等待2.5秒后解除虚弱和眩晕，并获得20Hp/秒的恢复效果，持续2.5秒（在第0.5秒时恢复10Hp，第1.5、2.5秒时恢复20Hp）。',
    adviceDescription:
      '适合**大部分**老鼠。用于在倒地后自愈，也可利用[清除控制效果的特性](特技效果触发时会解除被夹住状态)来清理{老鼠夹}。',
  },
};

const mouseSpecialSkillsWithImages: Record<string, SpecialSkill> = Object.fromEntries(
  Object.entries(mouseSpecialSkillDefinitions).map(([skillName, skill]) => [
    skillName,
    {
      ...skill,
      name: skillName,
      factionId: 'mouse' as const,
      imageUrl: getMouseSpecialSkillImageUrl(skillName),
    },
  ])
);

export default mouseSpecialSkillsWithImages;
