import type { Trait } from '@/data/types';

export const characterRelationKnowledgeCardTraits: Trait[] = [
  {
    description: '缴械禁用爪刀，影响关键时刻的衔接。',
    group: [
      { name: '布奇', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '布奇', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description:
      '守株待鼠对道具基础伤害的固定减伤会抵消小绿恶魔的伤害，使伤害为零，导致不触发恶菲的三被增伤。彻底失去伤害',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '守株待鼠', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '守株待鼠', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description:
      '恶菲的伤害形式为单段伤害，且触发次数极多，皮糙肉厚的减伤幅度在恶菲+100的三被增伤面前完全不够看，脆皮猫带了皮糙照样被秒。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description:
      '朝圣者泰菲处于圆球状态时获得猛攻效果期间无法撞击敌方，同时也无法主动取消圆球状态。',
    group: [
      { name: '朝圣者泰菲', type: 'character' },
      { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '朝圣者泰菲', type: 'character' },
      target: { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '侍卫汤姆的警戒可以清除回家的护盾',
    group: [
      { name: '侍卫汤姆', type: 'character' },
      { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '侍卫汤姆', type: 'character' },
      target: { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '侍卫汤姆的警戒可以清除护佑的护盾',
    group: [
      { name: '侍卫汤姆', type: 'character' },
      { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '侍卫汤姆', type: 'character' },
      target: { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '侍卫汤姆的警戒可以清除无畏的无敌',
    group: [
      { name: '侍卫汤姆', type: 'character' },
      { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '侍卫汤姆', type: 'character' },
      target: { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '侍卫汤姆的警戒可以清除舍己的无敌',
    group: [
      { name: '侍卫汤姆', type: 'character' },
      { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '侍卫汤姆', type: 'character' },
      target: { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '使充能道具掉落。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '使全面失去输出能力。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '头盔几乎无视救援时长的增加。',
    group: [
      { name: '剑客泰菲', type: 'character' },
      { name: '严防死守', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '剑客泰菲', type: 'character' },
      target: { name: '严防死守', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '幸运可以让老鼠主动下火箭一次，能断库博的节奏，这对库博来说是致命的。',
    group: [
      { name: '库博', type: 'character' },
      { name: '幸运', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '库博', type: 'character' },
      target: { name: '幸运', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '护佑克制莱特宁在游戏前期的追击能力。',
    group: [
      { name: '莱特宁', type: 'character' },
      { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '莱特宁', type: 'character' },
      target: { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '莱特宁依赖爪刀造成伤害，缴械几乎削弱了莱特宁一半的进攻能力。',
    group: [
      { name: '莱特宁', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '莱特宁', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '用击晕可以抓住机会一套秒罗宾汉。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '猛攻能让乘坐战车的蒙金奇无法脱离，失去干扰能力的同时还可能被战车炸死。',
    group: [
      { name: '蒙金奇', type: 'character' },
      { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '蒙金奇', type: 'character' },
      target: { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '猛攻能阻止米可曝光和回溯，且米可的霸体无法抵御猛攻的效果。',
    group: [
      { name: '米可', type: 'character' },
      { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '米可', type: 'character' },
      target: { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '大幅度降低足球和披萨饼的伤害。',
    group: [
      { name: '拿坡里鼠', type: 'character' },
      { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '拿坡里鼠', type: 'character' },
      target: { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '在墙缝出现的时候让老鼠获得大量增益，让牛仔汤姆的墙缝期较为难打',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description:
      '缴械会使携带鞭子的牛仔汤姆前中期的输出能力降低。携带弹弓的牛汤则相对没那么怕缴械。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '当被斗牛在离牛仔汤姆较远距离击倒后能快速起身。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '强健', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '强健', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description:
      '老鼠被放飞时能解除其他老鼠的受伤状态和回复其他老鼠血量，对牛仔汤姆的进攻造成干扰。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '祝愿', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '祝愿', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '缴械能使斯飞的输出短时间大幅降低。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '使老鼠具有反打斯飞的可能。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '绝地反击', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '绝地反击', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '投手的高额减速很容易使斯飞退出疾冲状态。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '投手', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '投手', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '能够提高斯飞袭击时的存活率',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '有难同当', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '有难同当', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '苏蕊攻击手段较为单一，跳舞爪刀cd长，主要输出又依赖跳舞蓄势爪刀。',
    group: [
      { name: '苏蕊', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '苏蕊', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '皮糙肉厚减伤导致绝反炮菲无法发挥伤害高的优势。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description:
      '有乾坤一掷加持下的猫扔一个基础伤害为50的道具就可以秒掉泰菲，但带乾坤一掷的猫很少，所以克制不明显。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '乾坤一掷', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '乾坤一掷', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '加的血量会导致很多情况差一点伤害，加移速也会导致不好抓人。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '不屈', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '不屈', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '天汤多细心布夹子，夹不住我破夹子。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '夹不住我', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '夹不住我', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '被禁爪刀会导致飞行不好接蓄力重击以及其他情况补伤害。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '铁血强救，同时还能消耗天汤飞行时间导致不好吸火箭。',
    group: [
      { name: '天使汤姆', type: 'character' },
      { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '天使汤姆', type: 'character' },
      target: { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '恢复和加速效果可以躲避一波追击。',
    group: [
      { name: '兔八哥', type: 'character' },
      { name: '逃窜', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '兔八哥', type: 'character' },
      target: { name: '逃窜', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '缴械禁用爪刀，可能导致有的情况下托普斯不好衔接。',
    group: [
      { name: '托普斯', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '托普斯', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description:
      '在猫不会卡救援接爪刀的情况下，携带救救我可以强换下来，但没有的情况下是不可以的。同时救救我也能为救援提高更多容错。',
    group: [
      { name: '托普斯', type: 'character' },
      { name: '救救我', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '托普斯', type: 'character' },
      target: { name: '救救我', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '皮糙肉厚减伤导致音乐家的多段伤害大幅减少。',
    group: [
      { name: '音乐家杰瑞', type: 'character' },
      { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '音乐家杰瑞', type: 'character' },
      target: { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '击晕知识卡可以在音乐家杰瑞未点三级位移的时候打断位移',
    group: [
      { name: '音乐家杰瑞', type: 'character' },
      { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '音乐家杰瑞', type: 'character' },
      target: { name: '击晕', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description:
      '不屈增加的额外血量和移速增大了追汤打倒老鼠的难度，加的推速使老鼠发育更快并更易来到后期。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '不屈', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '不屈', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '祝愿提供经验可以使老鼠快速发育到后期，放大追汤成长性差的缺点。',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '祝愿', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '祝愿', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '猛攻可以禁用泰菲的圆滚滚，导致泰菲无法使用圆滚滚解控',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '猛攻', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '泰菲血量低，前期三级自保较弱，容易被伤害高的穷追猫针对',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '穷追猛打', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '穷追猛打', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '泰菲机动性差，基础速度不高，没队友干扰的情况下容易被速度高的乘胜猫追杀',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '乘胜追击', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '乘胜追击', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '暴怒赋予猫长时间高伤，克制血量低的泰菲',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '暴怒', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '暴怒', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '单次输出高，可无视减伤输出。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '皮糙肉厚', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '',
    group: [
      { name: '天使杰瑞', type: 'character' },
      { name: '蓄势一击', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '天使杰瑞', type: 'character' },
      target: { name: '蓄势一击', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: true,
    },
  },
  {
    description: '3级被动使蓄势加伤无法正常打出，且会对猫自己造成控制。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '蓄势一击', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '蓄势一击', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: 'Lv.2被动受伤清除控制效果，包括夹子；捕鼠夹的伤害会立刻触发该效果，直接清理夹子。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '捕鼠夹', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '捕鼠夹', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description:
      '携带长爪的猫咪使用拍子不会造成伤害，不会触发香甜梦境的解控和位移，如果被拍中将可以直接抓起来。',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '长爪', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '长爪', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description:
      '有3级被动的表演者杰瑞如同烫手的山芋。强占视野，主动踩破夹子，贴在猫身边，不好打死，抓到了启新火箭不值。上老火箭浪费秒飞，10秒铁血强推强救，复活体不怕减员',
    group: [
      { name: '表演者•杰瑞', type: 'character' },
      { name: '熊熊燃烧', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '表演者•杰瑞', type: 'character' },
      target: { name: '熊熊燃烧', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description:
      '圆形快速破盾，方形实体阻挡，蓝图粉笔猫无视霸体，制造炸药桶摧毁火箭，使猫咪上火箭十分困难。',
    group: [
      { name: '莱恩', type: 'character' },
      { name: '铁手', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '莱恩', type: 'character' },
      target: { name: '铁手', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description:
      '运用高尔夫球使用不会被消耗的机制，使用毛线球将多个高尔夫体串联，最后将线引到墙缝上反复移动。使在拉线的过程中被带动的高尔夫球每次都会撞击在墙缝上，对墙缝造成伤害：\n正如开头所说，由于高尔夫球不会被消耗，墙缝将会反复受到高尔夫球撞击一次的伤害。使得墙缝快速被打破。',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '铜墙', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '铜墙', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '有毛线球独特的推奶酪机制，在香甜梦境，隐身或护盾可以强推奶酪进洞破局',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '恐吓', type: 'knowledgeCard', factionId: 'cat' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '恐吓', type: 'knowledgeCard', factionId: 'cat' },
      isMinor: false,
    },
  },
  {
    description: '老鼠舍己救人后一般为空血，若无特殊技能，将会被胡椒粉直接击倒。',
    group: [
      { name: '米特', type: 'character' },
      { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '米特', type: 'character' },
      target: { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '牛仔汤姆的攻击很容易波及并打破护佑',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '牛仔汤姆的技能控制很足，同时也能直接抓起老鼠。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '如玉的掷花枪能破除护佑。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '如玉的掷花枪能比较轻松地破除回家的护盾。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '回家', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '如玉完全免疫缴械效果，不要试图用缴械对抗如玉。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '缴械', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '掷花枪能轻易击倒无畏后摇眩晕的老鼠。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '队友救完人后如果血量非常低，如玉可以直接使用掷花枪将队友造成伤害触发虚弱或铁血。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '舍己', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description:
      '如玉触发反击将老鼠打飞时，可以无视铁血效果直接打上火箭。老鼠被打上火箭后，铁血效果正常触发，铁血生效期间队友实施救援后效果无法终止，会正常进入虚弱。',
    group: [
      { name: '如玉', type: 'character' },
      { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '如玉', type: 'character' },
      target: { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '斯飞身上环绕的电流能直接破掉护佑。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '护佑', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '处于无畏状态下的老鼠不容易逃脱斯飞的追击。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '在斯飞面前这张卡生效不明显',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '孤军奋战', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '孤军奋战', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '苏蕊可以使铁血状态的老鼠自主跟随。',
    group: [
      { name: '苏蕊', type: 'character' },
      { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '苏蕊', type: 'character' },
      target: { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
  {
    description: '托普斯的一级被动和网能有效拦截铁血强换。',
    group: [
      { name: '托普斯', type: 'character' },
      { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'countersKnowledgeCards',
      subject: { name: '托普斯', type: 'character' },
      target: { name: '铁血', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: true,
    },
  },
  {
    description: '大幅度提高老鼠救人后逃离能力。I',
    group: [
      { name: '米特', type: 'character' },
      { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
    ],
    relation: {
      kind: 'counteredByKnowledgeCards',
      subject: { name: '米特', type: 'character' },
      target: { name: '无畏', type: 'knowledgeCard', factionId: 'mouse' },
      isMinor: false,
    },
  },
];
