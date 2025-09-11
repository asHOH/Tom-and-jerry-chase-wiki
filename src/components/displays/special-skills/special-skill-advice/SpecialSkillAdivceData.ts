import { FactionId } from '@/data/types';

export type SpecialSkillAdviceDefinition = {
  description?: string;
  detailedDescription?: string;
  isMinor: boolean;
};
export type SpecialSkillAdvice = SpecialSkillAdviceDefinition & {
  name: string;
  factionId: FactionId;
  imageUrl: string;
};

export const getCatSpecialSkillImageUrl = (name: string): string => {
  return `/images/catSpecialSkills/${encodeURIComponent(name)}.png`;
};

export const getMouseSpecialSkillImageUrl = (name: string): string => {
  return `/images/mouseSpecialSkills/${encodeURIComponent(name)}.png`;
};

const catSpecialSkillDefinitions: Record<string, SpecialSkillAdviceDefinition> = {
  蓄力重击: {
    description: '适合大部分猫咪。',
    detailedDescription: '适合绝大多数猫咪，尤其适合缺乏霸体能力的猫咪。用于打架或强绑火箭。',
    isMinor: false,
  },
  绝地反击: {
    description: '适合大部分有控制但缺乏伤害的猫咪。',
    detailedDescription:
      '适合有控制但缺乏伤害的猫咪，可搭配“击晕”提高命中率。用于补充伤害或强行击倒高Hp老鼠。',
    isMinor: false,
  },
  急速翻滚: {
    description: '适合大部分需要额外位移能力的猫咪。',
    detailedDescription: '适合需要额外位移能力的猫咪。用于赶路或追击。',
    isMinor: false,
  },
  全垒打: {
    description: '适合受攻击增伤和移速加成收益较高的猫咪。',
    detailedDescription:
      '适合受攻击增伤和移速加成收益较高的猫咪，这类猫咪通常有受攻击增伤加成的技能。通常用于在自身投出投掷物后将其击飞，以此获得一段时间的攻击增伤和移速，提高爆发能力。推荐有一定熟练度后再使用该特技。',
    isMinor: true,
  },
  '我生气了！': {
    description: '适合少部分爪刀命中率高，或是有其他爪刀CD缩减能力的猫咪。',
    detailedDescription:
      '适合少部分爪刀命中率高，或是有其他爪刀CD缩减能力的猫咪。用于短时间内提高伤害和爆发能力，也可以搭配其他爪刀CD缩减效果将爪刀CD缩减至1秒以内，然后配合“击晕”实现无限控制。',
    isMinor: true,
  },
  应急治疗: {
    description: '适合极少部分需要额外恢复能力的猫咪。',
    detailedDescription:
      '适合极少部分需要额外恢复能力的猫咪。用于提高续航能力，减少吃食物浪费的时间。',
    isMinor: true,
  },
  勇气爪击: {
    description: '几乎没有猫咪携带此特技。',
    isMinor: true,
  },
  长爪一击: {
    description: '几乎没有猫咪携带此特技。',
    isMinor: true,
  },
};
const mouseSpecialSkillDefinitions: Record<string, SpecialSkillAdviceDefinition> = {
  魔术漂浮: {
    description: '适合大部分老鼠。在部分地图有奇效。',
    detailedDescription:
      '适合大部分老鼠。通常用于赶路或逃跑，也可以搭配“舍己”在救援后立刻释放技能避免踩到老鼠夹。此外，夏日游轮、游乐场、森林牧场、御门酒店等地图中的部分地形可通过魔术漂浮进行快速移动，逼迫猫咪绕远路，达到拉扯逃跑的作用。',
    isMinor: false,
  },
  绝处逢生: {
    description: '适合大部分老鼠。',
    detailedDescription:
      '适合大部分老鼠。通常用于在倒地后进行自愈和治疗，此外也可以利用清除控制效果的特性来清理老鼠夹（特技效果触发时会解除被夹住状态）。',
    isMinor: false,
  },
  应急治疗: {
    description: '适合需要额外恢复能力的老鼠。',
    detailedDescription: '适合需要额外恢复能力的老鼠。用于解除受伤和进行治疗。',
    isMinor: false,
  },
  干扰投掷: {
    description: '适合需要牵制猫咪的老鼠。',
    detailedDescription: '适合需要牵制猫咪的老鼠。用于补充控制链或打断敌方的动作。',
    isMinor: false,
  },
  急速翻滚: {
    description: '只适合少部分老鼠。',
    detailedDescription: '只适合少部分老鼠。用于补充位移和躲避技能，或是与部分技能产生联动。',
    isMinor: true,
  },
  冰冻保鲜: {
    description: '只适合少部分老鼠，或用于对抗少数猫咪。',
    detailedDescription:
      '只适合少部分老鼠，或用于对抗少数猫咪。用于规避某些猫咪技能的效果，或是与部分技能产生联动。',
    isMinor: true,
  },
  勇气投掷: {
    description: '只适合极少部分老鼠。',
    detailedDescription: '只适合极少部分老鼠。用于缩短部分技能CD。',
    isMinor: true,
  },
};

const catSpecialSkillsWithImages: Record<string, SpecialSkillAdvice> = Object.fromEntries(
  Object.entries(catSpecialSkillDefinitions).map(([skillName, skill]) => [
    skillName,
    {
      ...skill,
      name: skillName,
      factionId: 'cat' as const,
      imageUrl: getCatSpecialSkillImageUrl(skillName),
    },
  ])
);
const mouseSpecialSkillsWithImages: Record<string, SpecialSkillAdvice> = Object.fromEntries(
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

export const specialSkillsAdvice = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};

export default specialSkillsAdvice;
