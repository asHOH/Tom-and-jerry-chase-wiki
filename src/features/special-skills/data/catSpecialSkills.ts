import { SpecialSkill, SpecialSkillDefinition } from '@/data/types';

const getCatSpecialSkillImageUrl = (name: string): string => {
  return `/images/catSpecialSkills/${encodeURIComponent(name)}.png`;
};

const catSpecialSkillDefinitions: Record<string, SpecialSkillDefinition> = {
  应急治疗: {
    cooldown: 60,
    description: '回复Hp，且短暂加速。',
    detailedDescription: '回复75Hp，且加速20%，持续1.5秒。',
    adviceDescription: '适合**极少数需要额外恢复能力**的猫咪。用于提高续航。',
  },
  急速翻滚: {
    cooldown: 60,
    description: '向前翻滚一段距离，且短暂加速。释放后可在短时间内再次释放。',
    detailedDescription:
      '向前翻滚1000距离，且移速提高18%，持续2秒。释放后可在9.9秒内再次释放。第二次释放后或第一次释放后的9.9秒后才进入CD。',
    adviceDescription: '适合**需要额外位移能力**的猫咪。用于赶路或追击，提高机动性。',
  },
  长爪一击: {
    cooldown: 50,
    description: '下次爪刀攻击距离大幅度提升。若爪刀未命中，则返还一定爪刀CD。',
    detailedDescription: '使9.9秒内的下次爪刀攻击距离提升50%。若爪刀未命中，则返还80%爪刀CD。',
    adviceDescription: '暂无猫咪适配该特技。',
  },
  '我生气了！': {
    aliases: ['红温'],
    cooldown: 70,
    description: '一段时间内爪刀CD大幅减少。',
    detailedDescription: '10秒内爪刀CD减少70%（即变为正常爪刀CD的30%）。',
    adviceDescription:
      '适合**爪刀命中率高，或有其他爪刀CD缩减能力**的猫咪。用于提高伤害并提供爆发能力，或搭配其他爪刀CD缩减效果将爪刀CD缩减至1秒以内，以配合{击晕}实现连控。',
  },
  全垒打: {
    cooldown: 50,
    description:
      '下次爪刀攻击距离提升，可击飞道具；若成功击飞道具，将刷新爪刀CD，并在短时间内提高自身移速和攻击增伤。若爪刀未命中，则返还一定爪刀CD。',
    detailedDescription:
      '使9.9秒内的下次爪刀攻击距离提升35%，可击飞部分道具；若成功击飞道具，将刷新爪刀CD，并在9.9秒内使自身加速30%，攻击增伤提高25。若爪刀未命中，则返还80%爪刀CD。\n\n可命中道具：{盘子}/{扁盘}/{玻璃杯}/{碗}/{高尔夫球}/{香水瓶}/{胡椒瓶}/{番茄}/{灰花瓶}/{蓝花瓶}。',
    adviceDescription:
      '适合**受攻击增伤和加速的收益较高**的猫咪。通常用于在自身投出道具后将其击飞，提高伤害并提供爆发能力。推荐有一定熟练度后再使用该特技。',
  },
  勇气爪击: {
    cooldown: 35,
    description:
      '下次爪刀攻击距离提升，命中敌方时，自己主动和武器技能的剩余CD减半。若爪刀未命中，则返还一定爪刀CD。',
    detailedDescription:
      '使9.9秒内的下次爪刀攻击距离提升35%，命中敌方时，自己主动和武器技能的剩余CD减半。若爪刀未命中，则返还80%爪刀CD。',
    adviceDescription: '暂无猫咪适配该特技。',
  },
  蓄力重击: {
    aliases: ['蓄重'],
    cooldown: 60,
    description: '蓄力一段时间后，对前方一定范围内的敌方造成极大伤害。',
    detailedDescription: '蓄力0.9秒后，对前方330范围内的敌方造成1000伤害。',
    adviceDescription:
      '适合**有控制但缺乏伤害**的猫咪。可搭配{击晕}提高命中率。用于补伤害或击倒高Hp老鼠。',
  },
  绝地反击: {
    aliases: ['霸体', '解控'],
    cooldown: 90,
    description: '处于眩晕状态时可用，解除受到的眩晕；否则获得霸体（免疫虚弱）。',
    detailedDescription: '处于眩晕状态时可用，解除受到的眩晕；否则获得2.45秒霸体（免疫虚弱）。',
    adviceDescription:
      '适合**绝大部分**猫咪，尤其适合缺乏霸体能力的猫咪。用于打架、解控或强绑火箭。',
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
