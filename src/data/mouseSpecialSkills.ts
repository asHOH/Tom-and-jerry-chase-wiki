import { SpecialSkill, SpecialSkillDefinition } from './types';

export const getMouseSpecialSkillImageUrl = (name: string): string => {
  return `/images/mouseSpecialSkills/${encodeURIComponent(name)}.png`;
};

const mouseSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    cooldown: 80,
    description: '恢复一定Hp，且移速短暂提高。',
    detailedDescription: '恢复25Hp，且移速提高20%，持续1.15秒。',
  },
  急速翻滚: {
    cooldown: 80,
    description: '向前翻滚一段距离，且移速短暂提高。',
    detailedDescription: '向前翻滚800距离，且移速提高12%，持续2秒。',
  },
  干扰投掷: {
    cooldown: 80,
    description: '下次投掷命中敌方时，造成额外的硬直效果。',
    detailedDescription:
      '在9.9秒内，投掷命中敌方时，造成额外的0.95秒硬直效果（硬直：与眩晕类似，但不会击落道具和老鼠），触发1次后消失。',
  },
  魔术漂浮: {
    cooldown: 60,
    description: '立刻向斜上方进行一次固定数值的跳跃，并在一段时间内小幅度失重。只能在起跳后使用。',
  },
  勇气投掷: {
    cooldown: 50,
    description: '下次投掷命中敌方时，使自己主动和武器技能减少50%的剩余CD。',
    detailedDescription:
      '在9.9秒内，投掷命中敌方时，使自己正在冷却的主动和武器技能减少50%的剩余CD，触发1次后消失。',
  },
  冰冻保鲜: {
    cooldown: 80,
    description: '获得一段时间的无敌和冰冻效果。',
    detailedDescription:
      '获得2.45秒的无敌和冰冻效果（无敌和冰冻分别计时，冰冻时间可被部分减少控制时间的效果减短，但不会被霸体抵消）。',
  },
  绝处逢生: {
    aliases: ['自起'],
    cooldown: 85,
    description: '在短暂前摇后释放技能，等待2.5秒后获得短暂的恢复效果，并解除虚弱和眩晕。',
    detailedDescription:
      '在0.9秒前摇（可被跳跃键打断，不进入CD）后释放技能，等待2.5秒后获得20Hp/秒的恢复效果，持续2.5秒（在第0.5秒时恢复10Hp，第1.5、2.5秒时恢复20Hp），并解除虚弱和眩晕。',
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
