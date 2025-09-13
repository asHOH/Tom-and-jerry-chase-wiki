import { FactionId } from '@/data/types';

export type SpecialSkillAdviceDefinition = {
  description?: string;
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
  绝地反击: {
    description: '适合**绝大部分**猫咪，尤其适合缺乏霸体能力的猫咪。用于打架、解控或强绑火箭。',
  },
  蓄力重击: {
    description:
      '适合**有控制但缺乏伤害**的猫咪，可搭配{击晕}提高命中率。用于补充伤害或强行击倒高Hp老鼠。',
  },
  急速翻滚: {
    description: '适合**需要额外位移能力**的猫咪。用于赶路或追击，提高机动性。',
  },
  全垒打: {
    description:
      '适合**受攻击增伤和移速加成的收益较高**的猫咪。通常用于在自身投出道具后将其击飞，以此获得一段时间的攻击增伤和移速，提高爆发能力。推荐有一定熟练度后再使用该特技。',
  },
  '我生气了！': {
    description:
      '适合**少部分爪刀命中率高，或是有其他爪刀CD缩减能力**的猫咪。用于短时间内提高伤害和爆发能力，或是搭配其他爪刀CD缩减效果将爪刀CD缩减至1秒以内，以配合{击晕}实现连控。',
  },
  应急治疗: {
    description: '适合**极少部分需要额外恢复能力**的猫咪。用于提高续航能力，减少吃食物浪费的时间。',
  },
  勇气爪击: {
    description: '暂无猫咪适配该特技。',
  },
  长爪一击: {
    description: '暂无猫咪适配该特技。',
  },
};
const mouseSpecialSkillDefinitions: Record<string, SpecialSkillAdviceDefinition> = {
  魔术漂浮: {
    description:
      '适合**大部分**老鼠。用于赶路或逃跑，也可以在进行火箭救援后立刻释放特技以避免踩到{老鼠夹}。此外，[部分高低差地形](部分房间下方的地面允许角色自下而上通行，可利用漂浮直接到上方。包括夏日游轮的甲板、御门酒店的休息厅、部分雪夜古堡的活板门等；此外，游乐场的摩天轮和高台滑道、森林牧场的森林等房间也可以利用漂浮快速移动)可通过魔术漂浮进行快速移动，逼迫猫咪绕远路，达到拉扯逃跑的作用。',
  },
  绝处逢生: {
    description:
      '适合**大部分**老鼠。用于在倒地后进行自愈和治疗，也可以利用[清除控制效果的特性](特技效果触发时会解除被夹住状态)来清理{老鼠夹}。',
  },
  干扰投掷: {
    description: '适合**需要干扰或牵制猫咪**的老鼠。用于补充控制或打断动作。',
  },
  应急治疗: {
    description:
      '适合**需要额外恢复能力**的老鼠。用于进行治疗或解除[部分不良状态](包括受伤、香水反向、烟雾失明、莱特宁一被动标记等效果)。',
  },
  急速翻滚: {
    description: '只适合**少部分**老鼠。用于补充位移和躲避技能，或是与部分惯性类技能产生联动。',
  },
  冰冻保鲜: {
    description:
      '只适合**少部分**老鼠，或用于对抗**少部分**猫咪。用于规避某些猫咪技能的效果，或是与部分减控类技能产生联动。',
  },
  勇气投掷: {
    description: '只适合**极少部分**老鼠。用于缩短部分技能CD。',
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
