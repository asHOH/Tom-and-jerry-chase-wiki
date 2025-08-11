import { SpecialSkill, SpecialSkillDefinition } from './types';

export const getCatSpecialSkillImageUrl = (name: string): string => {
  return `/images/catSpecialSkills/${encodeURIComponent(name)}.png`;
};

const catSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    cooldown: 60,
    description: '恢复一定Hp，且移速短暂提高。',
    detailedDescription: '恢复75Hp，且移速提高20%，持续1.5秒。',
  },
  急速翻滚: {
    cooldown: 60,
    description: '向前翻滚一段距离，且移速短暂提高。释放后可在短时间内再释放一次。',
    detailedDescription:
      '向前翻滚1000距离，且移速提高18%，持续2秒。释放后可在9.9秒内再释放一次，第二次释放后才进入CD。',
  },
  长爪一击: {
    cooldown: 50,
    description: '下次爪刀攻击距离大幅度提升，若爪刀没有命中，则返还一定爪刀CD。',
    detailedDescription: '使9.9秒内的下次爪刀攻击距离提升50%，若爪刀没有命中，则返还80%爪刀CD。',
  },
  '我生气了！': {
    aliases: ['红温'],
    cooldown: 70,
    description: '一段时间内爪刀CD大幅减少。',
    detailedDescription: '10秒内爪刀CD减少70%（即：变为正常爪刀CD的30%）。',
  },
  全垒打: {
    cooldown: 50,
    description:
      '下次爪刀攻击距离提升，可击飞道具，成功击飞道具时将在短时间内使自身移速和攻击增伤提高，并刷新爪刀CD。若爪刀没有命中，则返还一定爪刀CD。',
    detailedDescription:
      '使9.9秒内的下次爪刀攻击距离提升35%，可击飞道具，成功击飞道具时将在9.9秒内使自身移速提高30%，攻击增伤提高25，并刷新爪刀CD。若爪刀没有命中，则返还80%爪刀CD。',
  },
  勇气爪击: {
    cooldown: 35,
    description:
      '下次爪刀攻击距离提升，命中敌方时，使自己主动和武器技能减少50%的剩余CD。若爪刀没有命中，则返还一定爪刀CD。',
    detailedDescription:
      '使9.9秒内的下次爪刀攻击距离提升35%，命中敌方时，使自己正在冷却的主动和武器技能减少50%的剩余CD。若爪刀没有命中，则返还80%爪刀CD。',
  },
  蓄力重击: {
    aliases: ['蓄重'],
    cooldown: 60,
    description: '蓄力一段时间，然后对前方一定范围内的敌方角色造成极大伤害。',
    detailedDescription: '蓄力0.9秒，然后对前方330范围内的敌方角色造成1000伤害。',
  },
  绝地反击: {
    aliases: ['霸体', '解控'],
    cooldown: 90,
    description: '处于眩晕状态时解除受到的眩晕，否则将获得霸体。',
    detailedDescription: '处于眩晕状态时解除受到的眩晕，否则将获得2.45秒霸体。',
  },
};

const catSpecialSkillsWithImages: Record<string, SpecialSkill> = Object.fromEntries(
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

export default catSpecialSkillsWithImages;
