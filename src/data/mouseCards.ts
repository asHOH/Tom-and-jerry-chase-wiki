import { Card } from './types';

// Generate image URL based on card rank and name for mouse faction
const getMouseCardImageUrl = (rank: string, name: string): string => {
  return `/images/mouseCards/${rank}-${name}.png`;
};

export const mouseCards: Record<string, Card> = {
  /* ----------------------------------- S级卡 ---------------------------------- */
  '回家': {
    id: '回家',
    rank: 'S',
    cost: 6,
    description: '墙缝出现后立刻解除虚弱和受伤，恢复全部Hp，并额外获得增益。',
    detailedDescription: '为所有爱执着的痛，再痛我也要回家！墙缝出现后立刻解除虚弱和受伤，恢复全部Hp，并额外获得增益。',
    levels: [
      { level: 1, description: '提升移速和跳跃高度。'},
      { level: 2, description: '额外提升Hp恢复。'},
      { level: 3, description: '额外获得2层护盾。'}
    ]
  },

  '护佑': {
    id: '护佑',
    rank: 'S',
    cost: 6,
    description: '出洞时获得特殊护盾。该护盾生效时，免疫碎片、烫伤、烟雾和香水。',
    detailedDescription: '得到仙女鼠护佑的老鼠，出洞进入房间时获得特殊护盾。该护盾生效时，免疫碎片、烫伤、烟雾和香水。',
    levels: [
      { level: 1, description: '护佑持续240秒。'},
      { level: 2, description: '护佑持续270秒。'},
      { level: 3, description: '护佑持续300秒。'}
    ]
  },

  '无畏': {
    id: '无畏',
    rank: 'S',
    cost: 6,
    description: '从火箭上救下队友后，彼此同时获得短暂的无敌并固定增加推速，但此期间无法使用技能和道具；效果结束后陷入短暂的眩晕。(CD: 60秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '无畏持续6秒。'},
      { level: 2, description: '无畏持续6.5秒。'},
      { level: 3, description: '无畏持续7秒。'}
    ]
  },

  '有难同当': {
    id: '有难同当',
    rank: 'S',
    cost: 5,
    description: 'Hp在50%以上时，牺牲自己的Hp为附近队友减伤；牺牲不会致死。',
    detailedDescription: '当自身Hp在50%以上、附近队友受到敌方伤害时，牺牲自己大量Hp来减少部分队友所受伤害，被“牺牲”Hp的一部分会在10秒内缓慢恢复，牺牲者会至少保留一定健康值。“为众人抱薪者，不可使其冻毙于风雪。”',
    levels: [
      { level: 1, description: 'CD：40秒。'},
      { level: 2, description: 'CD：35秒。'},
      { level: 3, description: 'CD：30秒。'}
    ]
  },

  '缴械': {
    id: '缴械',
    rank: 'S',
    cost: 6,
    description: '投掷道具命中猫咪后，使猫咪一段时间内无法使用爪刀。',
    detailedDescription: '投掷道具命中猫咪后，使猫咪一段时间内无法使用爪刀。猫咪被缴械后，30秒内不会再次被缴械。',
    levels: [
      { level: 1, description: '缴械3.5秒。'},
      { level: 2, description: '缴械4秒。'},
      { level: 3, description: '缴械4.5秒。'}
    ]
  },

  '舍己': {
    id: '舍己',
    rank: 'S',
    cost: 5,
    description: '从火箭上救下队友后，与队友互换Hp，并使队友获得短暂的无敌。(CD: 50秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '无敌持续4秒。'},
      { level: 2, description: '无敌持续4.5秒。'},
      { level: 3, description: '无敌持续5秒。'}
    ]
  },

  '铁血': {
    id: '铁血',
    rank: 'S',
    cost: 6,
    description: '即将虚弱时，可以继续行动一段时间，但无法使用技能和道具。(CD: 60秒)',
    detailedDescription: '即将虚弱时，可以继续行动一段时间，但无法使用技能和道具，也无法获得护盾和无敌，随后再进入虚弱。(CD: 60秒)',
    levels: [
      { level: 1, description: '铁血持续4秒。'},
      { level: 2, description: '铁血持续4.5秒。'},
      { level: 3, description: '铁血持续5秒。'}
    ]
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  '冲冠一怒': {
    id: '冲冠一怒',
    rank: 'A',
    cost: 4,
    description: '当同伴被猫咪抓住时，攻击力提升；如果猫咪不在附近，额外提升移动和跳跃速度。',
    detailedDescription: '冲冠一怒！当同伴被猫咪抓住时，攻击力提升15%；如果猫咪不在附近，额外提升移动和跳跃速度。',
    levels: [
      { level: 1, description: '移动和跳跃速度提升18%。'},
      { level: 2, description: '移动和跳跃速度提升19%。'},
      { level: 3, description: '移动和跳跃速度提升20%。'}
    ]
  },

  '团队领袖': {
    id: '团队领袖',
    rank: 'A',
    cost: 5,
    description: '处于健康状态时，自己和附近同伴推速提升。',
    detailedDescription: '处于健康状态时，自己和附近同伴推速提升（效果不可叠加）。',
    levels: [
      { level: 1, description: '推速提升3%。'},
      { level: 2, description: '推速提升4%。'},
      { level: 3, description: '推速提升5%。'}
    ]
  },

  '投手': {
    id: '投手',
    rank: 'A',
    cost: 4,
    description: '投掷道具额外对猫咪造成减速。',
    detailedDescription: '投掷道具额外对猫咪造成减速，最多叠加2层。',
    levels: [
      { level: 1, description: '减速6%。'},
      { level: 2, description: '减速8%。'},
      { level: 3, description: '减速12%。'}
    ]
  },

  '泡泡浴': {
    id: '泡泡浴',
    rank: 'A',
    cost: 4,
    description: '每隔一段时间解除受伤、反向、失明。',
    detailedDescription: '我爱洗澡，皮肤好好！每隔一段时间解除受伤、反向、失明。',
    levels: [
      { level: 1, description: '每隔60秒触发。'},
      { level: 2, description: '每隔55秒触发。'},
      { level: 3, description: '每隔45秒触发。'}
    ]
  },

  '祝愿': {
    id: '祝愿',
    rank: 'A',
    cost: 4,
    description: '自己被放飞时，全体队友回复部分Hp、获得经验，并短暂提升移动和跳跃速度。',
    detailedDescription: '这是心的呼唤，这是爱的奉献！自己被放飞时，全体队友回复部分Hp、获得经验，并短暂提升移动和跳跃速度。',
    levels: [
      { level: 1, description: '队友移动和跳跃速度提升持续10秒。'},
      { level: 2, description: '队友移动和跳跃速度提升持续11秒。'},
      { level: 3, description: '队友移动和跳跃速度提升持续12秒。'}
    ]
  },

  '翩若惊鸿': {
    id: '翩若惊鸿',
    rank: 'A',
    cost: 4,
    description: '经过冰面或冰块命中后获得短暂加速。',
    detailedDescription: '老鼠掌握更酷的技巧，经过冰面或冰块命中后获得短暂加速。“身轻若健燕，潇洒若游龙，翩若惊鸿，婉若游龙。',
    levels: [
      { level: 1, description: '获得小幅加速。'},
      { level: 2, description: '获得中幅加速。'},
      { level: 3, description: '获得大幅加速。'}
    ]
  },

  '逃窜': {
    id: '逃窜',
    rank: 'A',
    cost: 4,
    description: '受到猫咪的攻击后，短暂提升移动、跳跃速度和Hp恢复速度。(CD：35秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '效果持续8秒。'},
      { level: 2, description: '效果持续9秒。'},
      { level: 3, description: '效果持续10秒。'}
    ]
  },

  '闭门羹': {
    id: '闭门羹',
    rank: 'A',
    cost: 4,
    description: '关门后获得短暂加速，并将门附近的猫咪弹开。(CD: 5s)',
    detailedDescription: '用力地关上门，关门后获得短暂加速，并将门附近的猫咪弹开。(CD: 5s)',
    levels: [
      { level: 1, description: '加速持续4.5秒。'},
      { level: 2, description: '加速持续5秒。'},
      { level: 3, description: '加速持续5.5秒。'}
    ]
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  '夹不住我': {
    id: '夹不住我',
    rank: 'B',
    cost: 3,
    description: '增加挣脱捕鼠夹速度；每次挣脱捕鼠夹后，下次挣脱捕鼠夹将会更快，最多叠加3层。',
    detailedDescription: '增加挣脱捕鼠夹速度；每次挣脱捕鼠夹后（自起排夹不算），下次挣脱捕鼠夹将会更快，最多叠加3层。',
    levels: [
      { level: 1, description: '每层提升12%挣脱速度。'},
      { level: 2, description: '每层提升14%挣脱速度。'},
      { level: 3, description: '每层提升16%挣脱速度。'}
    ]
  },

  '孤军奋战': {
    id: '孤军奋战',
    rank: 'B',
    cost: 3,
    description: '猫咪追击时，如果附近没有其他可行动的老鼠，移速提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '移速提升3%。'},
      { level: 2, description: '移速提升4%。'},
      { level: 3, description: '移速提升5%。'}
    ]
  },

  '幸运': {
    id: '幸运',
    rank: 'B',
    cost: 5,
    description: '上火箭后可以从火箭上挣扎下来（每局限1次）。',
    detailedDescription: '幸运的老鼠，上火箭后可以从火箭上挣扎下来（每局限1次）。',
    levels: [
      { level: 1, description: '首次挣扎速度提升10%。'},
      { level: 2, description: '首次挣扎速度提升20%。'},
      { level: 3, description: '首次挣扎速度提升35%。'}
    ]
  },

  '应激反应': {
    id: '应激反应',
    rank: 'B',
    cost: 4,
    description: '处于受伤状态时，移速和跳跃高度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '移速和跳跃高度提升7%。'},
      { level: 2, description: '移速和跳跃高度提升8%。'},
      { level: 3, description: '移速和跳跃高度提升9%。'}
    ]
  },

  '求生欲': {
    id: '求生欲',
    rank: 'B',
    cost: 4,
    description: '当同一房间内没有其他老鼠时，在猫爪和火箭上的挣扎速度提升。',
    detailedDescription: '拥有强烈求生欲的老鼠，当同一房间内没有其他老鼠时，在猫爪和火箭上的挣扎速度提升。',
    levels: [
      { level: 1, description: '挣扎速度提升15%。'},
      { level: 2, description: '挣扎速度提升18%。'},
      { level: 3, description: '挣扎速度提升21%。'}
    ]
  },

  '破墙': {
    id: '破墙',
    rank: 'B',
    cost: 5,
    description: '对墙缝造成的伤害增加。',
    detailedDescription: '破坏力惊人的老鼠，对墙缝造成的伤害增加。（墙缝基础坚固值为100）',
    levels: [
      { level: 1, description: '增伤0.6。'},
      { level: 2, description: '增伤0.8。'},
      { level: 3, description: '增伤1。'}
    ]
  },

  '精准投射': {
    id: '精准投射',
    rank: 'B',
    cost: 4,
    description: '投掷道具击中猫咪后，降低自身技能CD。(CD：5秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '降低2秒技能CD。'},
      { level: 2, description: '降低3秒技能CD。'},
      { level: 3, description: '降低4秒技能CD。'}
    ]
  },

  '绝地反击': {
    id: '绝地反击',
    rank: 'B',
    cost: 3,
    description: 'Hp较低时，提升攻击力。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: 'Hp小于或等于25%时触发。'},
      { level: 2, description: 'Hp小于或等于30%时触发。'},
      { level: 3, description: 'Hp小于或等于35%时触发。'}
    ]
  },

  '追风': {
    id: '追风',
    rank: 'B',
    cost: 4,
    description: '使用道具击中猫后，获得加速。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速5%。'},
      { level: 2, description: '加速7%。'},
      { level: 3, description: '加速10%。'}
    ]
  },

  '逃之夭夭': {
    id: '逃之夭夭',
    rank: 'B',
    cost: 4,
    description: '从火箭上救下队友后，自己和队友获得短暂加速。',
    detailedDescription: '老鼠从火箭上救下队友后连忙逃走，自己和队友获得短暂加速。',
    levels: [
      { level: 1, description: '加速持续5秒。'},
      { level: 2, description: '加速持续6秒。'},
      { level: 3, description: '加速持续7秒。'}
    ]
  },

  '速推': {
    id: '速推',
    rank: 'B',
    cost: 5,
    description: '推速提升。',
    detailedDescription: '得到仙女鼠的魔法加成，推速提升。',
    levels: [
      { level: 1, description: '推速提升3%。'},
      { level: 2, description: '推速提升4%。'},
      { level: 3, description: '推速提升5%。'}
    ]
  },

  '飞跃': {
    id: '飞跃',
    rank: 'B',
    cost: 4,
    description: '跳跃速度提升。',
    detailedDescription: '掌握了身轻如燕的秘法后，跳跃速度提升。',
    levels: [
      { level: 1, description: '跳跃速度提升5%。'},
      { level: 2, description: '跳跃速度提升6%。'},
      { level: 3, description: '跳跃速度提升7%。'}
    ]
  },

  '食物力量': {
    id: '食物力量',
    rank: 'B',
    cost: 3,
    description: '老鼠喝牛奶或吃蛋糕后，永久提升推速，最多叠5层。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每层提升1%推速。'},
      { level: 2, description: '每层提升2%推速。'},
      { level: 3, description: '每层提升3%推速。'}
    ]
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  '不屈': {
    id: '不屈',
    rank: 'C',
    cost: 3,
    description: '每被放飞一名队友，自己的Hp上限、推速、移速得到提高。',
    detailedDescription: '每被放飞一名队友，自己的Hp上限提高15，推速提高10%，移速提高。',
    levels: [
      { level: 1, description: '移速提高5%。'},
      { level: 2, description: '移速提高6%。'},
      { level: 3, description: '移速提高7%。'}
    ]
  },

  '吃货': {
    id: '吃货',
    rank: 'C',
    cost: 3,
    description: '延长从食物中获得的增益。',
    detailedDescription: '这世上唯有美食不可辜负！延长从食物中获得的增益。',
    levels: [
      { level: 1, description: '延长20%。'},
      { level: 2, description: '延长30%。'},
      { level: 3, description: '延长50%。'}
    ]
  },

  '强健': {
    id: '强健',
    rank: 'C',
    cost: 4,
    description: '减少虚弱的持续时间。',
    detailedDescription: '年轻鼠恢复的速度就是快！减少虚弱的持续时间。',
    levels: [
      { level: 1, description: '持续时间减少20%。'},
      { level: 2, description: '持续时间减少25%。'},
      { level: 3, description: '持续时间减少30%。'}
    ]
  },

  '救救我': {
    id: '救救我',
    rank: 'C',
    cost: 3,
    description: '当自己被绑在火箭上时，队友推速下降，但救援速度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '队友救援速度提升30%。'},
      { level: 2, description: '队友救援速度提升35%。'},
      { level: 3, description: '队友救援速度提升40%。'}
    ]
  },

  '相助': {
    id: '相助',
    rank: 'C',
    cost: 4,
    description: '提高自己和附近队友的治疗、救援速度。',
    detailedDescription: '守望相助的老鼠们，提高自己和附近队友的治疗、救援速度。',
    levels: [
      { level: 1, description: '治疗、救援速度提高8%。'},
      { level: 2, description: '治疗、救援速度提高12%。'},
      { level: 3, description: '治疗、救援速度提高16%。'}
    ]
  },

  '美食家': {
    id: '美食家',
    rank: 'C',
    cost: 3,
    description: '每局前几次打开箱子时，必然获得牛奶或蛋糕。',
    detailedDescription: '孤独的美食家每局前几次打开箱子时，必然获得牛奶或蛋糕。',
    levels: [
      { level: 1, description: '每局前2次打开箱子时触发。'},
      { level: 2, description: '每局前3次打开箱子时触发。'},
      { level: 3, description: '每局前4次打开箱子时触发。'}
    ]
  },

  '脱身': {
    id: '脱身',
    rank: 'C',
    cost: 3,
    description: '从猫手里或火箭上挣扎下来时，恢复大量Hp。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '恢复50Hp。'},
      { level: 2, description: '恢复75Hp。'},
      { level: 3, description: '恢复100Hp。'}
    ]
  },

  '门卫': {
    id: '门卫',
    rank: 'C',
    cost: 3,
    description: '提高开门和关门速度。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '开关门速度提高30%。'},
      { level: 2, description: '开关门速度提高40%。'},
      { level: 3, description: '开关门速度提高50%。'}
    ]
  }
};

// Generate cards with faction ID and image URLs applied in bulk
export const mouseCardsWithImages = Object.fromEntries(
  Object.entries(mouseCards).map(([cardId, card]) => [
    cardId,
    {
      ...card,
      factionId: 'mouse' as const,
      imageUrl: getMouseCardImageUrl(card.rank, card.id)
    }
  ])
);
