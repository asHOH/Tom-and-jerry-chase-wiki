import { SpecialSkillDefinition } from './types';

export const getMouseSpecialSkillImageUrl = (name: string): string => {
  return `/images/mouseSpecialSkills/${encodeURIComponent(name)}.png`;
};

const mouseSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    name: '应急治疗',
    cooldown: 80,
    description: '危急关头！老鼠恢复一定Hp，并获得短暂的加速效果。',
    detailedDescription: '危急关头！老鼠恢复25点Hp，并获得短暂的加速效果。',
  },
  急速翻滚: {
    name: '急速翻滚',
    cooldown: 80,
    description: '老鼠快逃，向前翻滚一段距离，并获得短暂的加速效果。',
  },
  干扰投掷: {
    name: '干扰投掷',
    cooldown: 80,
    description: '老鼠观察敌人弱点，下次投掷命中敌人后，会造成额外的硬直效果。',
  },
  魔术漂浮: {
    name: '魔术漂浮',
    cooldown: 60,
    description: '获得魔术师的帮助，在跳跃后使用才可进入漂浮状态。',
  },
  勇气投掷: {
    name: '勇气投掷',
    cooldown: 50,
    description: '老鼠鼓起勇气，下次投掷命中敌人后，将减少50%自己主动和武器技能的CD。',
  },
  冰冻保鲜: {
    name: '冰冻保鲜',
    cooldown: 80,
    description: '将老鼠塞进冰箱，使老鼠短时间内免疫伤害，但无法行动。',
  },
  绝处逢生: {
    name: '绝处逢生',
    aliases: ['自起'],
    cooldown: 85,
    description:
      '在绝境努力求生吧！技能施放的2.5秒后，老鼠将展开自救，持续恢复Hp并解除虚弱和眩晕效果。',
  },
};

const mouseSpecialSkillsWithImages = Object.fromEntries(
  Object.entries(mouseSpecialSkillDefinitions).map(([skillName, skill]) => [
    skillName,
    {
      ...skill,
      factionId: 'mouse' as const,
      imageUrl: getMouseSpecialSkillImageUrl(skillName),
    },
  ])
);

export default mouseSpecialSkillsWithImages;
