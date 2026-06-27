import type { Trait } from '@/data/types';

export const characterRelationSpecialSkillTraits: Trait[] = [
  {
    description: '魔术漂浮能躲开布奇的冲撞。',
    group: [
      { name: '布奇', type: 'character' },
      { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '布奇', type: 'character' },
      target: { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '冰冻保鲜可以躲过布奇的一波冲撞。',
    group: [
      { name: '布奇', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '布奇', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '可躲吻或直接消除未3级的吻。',
    group: [
      { name: '图多盖洛', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '图多盖洛', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '绝地反击能暂时免疫朵朵的控制，但免疫不了伤害。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '猫咪会利用绝地反击解除或免疫控制。',
    group: [
      { name: '航海士杰瑞', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '航海士杰瑞', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '猫咪会利用绝地反击解除或免疫控制。',
    group: [
      { name: '剑客杰瑞', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '剑客杰瑞', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description:
      '绝处逢生能破除库博在天堂布置的老鼠夹；此外部分地图中的猫传送点距离鼠洞过远，老鼠有概率利用铁血+绝处逢生逃跑。',
    group: [
      { name: '库博', type: 'character' },
      { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '库博', type: 'character' },
      target: { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '某些猫带此特技在缴械cd期间，可快速破圆和方块，快速接近无自保的莱恩。',
    group: [
      { name: '莱恩', type: 'character' },
      { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '莱恩', type: 'character' },
      target: { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '治疗可以解除Lv.1被动的标记与咸鱼效果。',
    group: [
      { name: '莱特宁', type: 'character' },
      { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '莱特宁', type: 'character' },
      target: { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '罗菲需要近距离接触猫咪才能干扰，一旦猫咪使用绝地反击就很容易形成反打。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '绝地反击能克制大表哥的拳头干扰，不过无法免疫升龙拳的击飞效果。',
    group: [
      { name: '马索尔', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '马索尔', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '绝地反击能免疫眩晕，还会大幅降低冲撞的击退距离',
    group: [
      { name: '蒙金奇', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '蒙金奇', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '绝地反击能免疫米可技能的眩晕，但无法免疫伤害及拍摄效果。',
    group: [
      { name: '米可', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '米可', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '蓄力重击能直接秒掉高减伤米可，不过不太容易命中采访期间的米可。',
    group: [
      { name: '米可', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '米可', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '蓄力重击可以直接击倒魔术师的兔子。',
    group: [
      { name: '魔术师', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '魔术师', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '猫咪会利用绝地反击解除或免疫控制。',
    group: [
      { name: '牛仔杰瑞', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '牛仔杰瑞', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '蓄力重击可以直接击倒高Hp老鼠。',
    group: [
      { name: '牛仔杰瑞', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '牛仔杰瑞', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '应急治疗能解除受伤和恢复Hp，克制牛仔汤姆的远程消耗和2级被动。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '蓄力重击可以直接击倒高Hp老鼠。',
    group: [
      { name: '佩克斯', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '佩克斯', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '干扰投掷可以使斯飞退出疾冲状态。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '炮不能取消后摇，容易被霸体反杀。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '泰菲的圆滚滚可以解控，猫无法用无限爪刀秒掉泰菲',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '泰菲的圆滚滚可以解控，克制猫用击晕接蓄重',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '全垒打赋予猫高伤，克制血量低的泰菲',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '全垒打', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '全垒打', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '蓄力重击可以直接击倒天使泰菲，但在特定情况下庇护会使蓄力重击的伤害受限。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '蓄力重击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '会打断一级飞行。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '冰冻保鲜能暂时躲过喵喵叫的攻击。',
    group: [
      { name: '图茨', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '图茨', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '干扰投掷能中断喵喵叫，此外图茨缺乏霸体能力。',
    group: [
      { name: '图茨', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '图茨', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '冰冻保鲜可躲一波胡萝卜飞镖。',
    group: [
      { name: '兔八哥', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '兔八哥', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '翻滚给的加速可以有效的躲追踪萝卜。',
    group: [
      { name: '兔八哥', type: 'character' },
      { name: '急速翻滚', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '兔八哥', type: 'character' },
      target: { name: '急速翻滚', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '干扰投掷能提高一定的救援能力，但较吃投掷。',
    group: [
      { name: '托普斯', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '托普斯', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '追风汤姆技能伤害低，若没能击倒老鼠则容易让其快速恢复状态。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '追风汤姆技能伤害低，若没能击倒老鼠则容易让其快速恢复状态。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '斯飞疾冲状态带来的感电效果能直接中断漂浮持续',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '斯飞高移速能几乎无视翻滚的位移',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '急速翻滚', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '急速翻滚', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '鲍姆的爆炸一定程度上限制了绝地反击的解控，但如果提前使用则可完全免疫爆炸。',
    group: [
      { name: '鲍姆', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '鲍姆', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '风墙的干扰无法被绝地反击免疫，且莉莉2级被动命中霸体敌方也能触发。',
    group: [
      { name: '剑客莉莉', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '剑客莉莉', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '霸体期间也能变线条猫，让猫不能稳上秒飞',
    group: [
      { name: '莱恩', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '莱恩', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '用塔使猫咪强制位移，防止绑上火箭。',
    group: [
      { name: '拿坡里鼠', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '拿坡里鼠', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '钩子可以勾霸体猫手上的老鼠。',
    group: [
      { name: '尼宝', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '尼宝', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '牛仔汤姆的鞭子能有效的使绝处逢生无效，斗牛和弹弓能给予压制。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '绝处逢生', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '霜月的乾坤袋吞噬无视霸体，滑步踢踢飞火箭也能阻止猫咪绑火箭',
    group: [
      { name: '霜月', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '霜月', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '苏蕊跳舞期间免疫眩晕。',
    group: [
      { name: '苏蕊', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '苏蕊', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '天使杰瑞1级被动能封锁爪刀。',
    group: [
      { name: '天使杰瑞', type: 'character' },
      { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '天使杰瑞', type: 'character' },
      target: { name: '我生气了！', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '容易被卡蓄力重击。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '飞行可以打漂浮，且漂浮中很容易被武器道具瞄准。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '仙女鼠八星变身无视霸体效果。',
    group: [
      { name: '仙女鼠', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '仙女鼠', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '音乐家能快速拆火箭，阻止猫咪霸体绑火箭。不过绝地反击能免疫共鸣眩晕，还是要小心。',
    group: [
      { name: '音乐家杰瑞', type: 'character' },
      { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '音乐家杰瑞', type: 'character' },
      target: { name: '绝地反击', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '追风汤姆飞行期间免疫眩晕。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '干扰投掷', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '追风汤姆机动性很强，漂浮无法拉开距离。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersSpecialSkills',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '魔术漂浮', type: 'specialSkill', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '可一击击倒泰菲类角色，且给的反应时间短。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '全垒打', type: 'specialSkill', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '全垒打', type: 'specialSkill', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '冰冻保鲜的无敌可以抵挡如玉的反击。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '如玉', type: 'character' },
      target: { name: '冰冻保鲜', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '增加血量，防止被胡椒粉击倒',
    group: [
      { name: '米特', type: 'character' },
      { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredBySpecialSkills',
      subject: { name: '米特', type: 'character' },
      target: { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
      isMinor: false,
    },
  },
];
