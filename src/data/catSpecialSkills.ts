import { SpecialSkillDefinition } from './types';

export const getCatSpecialSkillImageUrl = (name: string): string => {
  return `/images/catSpecialSkills/${encodeURIComponent(name)}.png`;
};

const catSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    name: '应急治疗',
    cooldown: 60,
    description: '危急关头！猫咪恢复一定Hp，并获得短暂的加速效果。',
    detailedDescription: '危急关头！猫咪恢复50点Hp，并获得短暂的加速效果。',
  },
  急速翻滚: {
    name: '急速翻滚',
    cooldown: 60,
    description: '猫咪快追，向前翻滚一段距离，并获得短暂的加速效果。释放后可在短时间内再释放一次。',
  },
  长爪一击: {
    name: '长爪一击',
    cooldown: 50,
    description: '猫咪伸长手臂，下次爪刀攻击距离大幅度提升。若爪刀没有命中，返还一定爪刀CD。',
  },
  '我生气了！': {
    name: '我生气了！',
    aliases: ['红温'],
    cooldown: 70,
    description: '猫咪生气了，短时间内可以频繁使用爪刀攻击。',
    detailedDescription: '猫咪生气了，短时间内爪刀CD变为正常爪刀CD的30%。',
  },
  全垒打: {
    name: '全垒打',
    cooldown: 50,
    description:
      '猫咪发挥出色的击球技巧！下次爪刀距离提升，可击飞道具，成功击飞将短时间内大幅度提升移速和攻击力。若爪刀没有命中，返还一定爪刀CD。',
  },
  勇气爪击: {
    name: '勇气爪击',
    cooldown: 35,
    description:
      '猫咪鼓起勇气，下次爪刀距离提升，命中敌人后，将减少50%自己主动和武器技能的CD。若爪刀没有命中，返还一定爪刀CD。',
  },
  蓄力重击: {
    name: '蓄力重击',
    aliases: ['蓄重'],
    cooldown: 60,
    description: '爆发吧！猫咪蓄力一段时间后，攻击前方造成大量伤害。',
  },
  绝地反击: {
    name: '绝地反击',
    aliases: ['霸体', '解控'],
    cooldown: 90,
    description: '在绝境发起反击吧！若处于眩晕状态时，解除受到的眩晕，否则将短时免疫控制效果。',
  },
};

const catSpecialSkillsWithImages = Object.fromEntries(
  Object.entries(catSpecialSkillDefinitions).map(([skillName, skill]) => [
    skillName,
    {
      ...skill,
      factionId: 'cat' as const,
      imageUrl: getCatSpecialSkillImageUrl(skillName),
    },
  ])
);

export default catSpecialSkillsWithImages;
