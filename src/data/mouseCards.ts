import { Card } from './types';

// Generate image URL based on card rank and name for mouse faction
const getMouseCardImageUrl = (rank: string, name: string): string => {
  return `/images/mouseCards/${rank}-${name}.png`;
};

// Extract card data from image filenames
// Based on the existing images in public/images/mouseCards/
export const mouseCards: Record<string, Card> = {
  /* ----------------------------------- S级卡 ---------------------------------- */
  '回家': {
    id: '回家',
    rank: 'S',
    cost: 6,
    description: '为所有爱捣蛋的猫，再痛我也要回家！墙缝出现后立刻解除虚弱和受伤状态，恢复全部健康值，并额外获得某些增益效果。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '额外获得行动能力提升的效果。'},
      { level: 2, description: '额外获得健康恢复能力提升的效果。'},
      { level: 3, description: '额外获得2层护盾的效果。'}
    ]
  },

  '护佑': {
    id: '护佑',
    rank: 'S',
    cost: 6,
    description: '得到仙女鼠护佑的老鼠，出洞进入房间时会瞬时获得护盾值，护盾能抵消一次负面效果。在护盾生效时，还将免疫碎片、烫伤、烟雾和香水的负面效果。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '护佑的持续时间提升至240秒。'},
      { level: 2, description: '护佑的持续时间提升至270秒。'},
      { level: 3, description: '护佑的持续时间提升至300秒。'}
    ]
  },

  '无畏': {
    id: '无畏',
    rank: 'S',
    cost: 6,
    description: '从火箭上救下队友后，彼此同时获得短暂的无敌效果并固定增加奶酪推进值，但此期间无法使用技能和道具，效果结束后陷入短暂的晕眩。(CD: 60秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '无畏的持续时间提高至6秒。'},
      { level: 2, description: '无畏的持续时间提高至6.5秒。'},
      { level: 3, description: '无畏的持续时间提高至7秒。'}
    ]
  },

  '有难同当': {
    id: '有难同当',
    rank: 'S',
    cost: 5,
    description: '当自身血量在50%以上，一定范围内的队友受到敌方伤害时，牺牲自己大量健康值减少部分队友所受伤害，被“牺牲”健康值的一部分会在10秒内缓慢恢复，技能持有者进行“牺牲”时会至少保留一定健康值。“为众人抱薪者，不可使其冻毙于风雪。”',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每隔40秒可以触发一次此技能。'},
      { level: 2, description: '每隔35秒可以触发一次此技能。'},
      { level: 3, description: '每隔30秒可以触发一次此技能。'}
    ]
  },

  '缴械': {
    id: '缴械',
    rank: 'S',
    cost: 6,
    description: '老鼠投掷道具命中敌方猫咪后，使猫咪一段时间内无法进行攻击。猫咪受到此效果影响后，30秒之内不会再次受到影响。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '使猫咪3.5秒内无法攻击。'},
      { level: 2, description: '使猫咪4秒内无法攻击。'},
      { level: 3, description: '使猫咪4.5秒内无法攻击。'}
    ]
  },

  '舍己': {
    id: '舍己',
    rank: 'S',
    cost: 5,
    description: '将队友从火箭上救下后，与队友互换健康值，并使得队友获得短暂的无敌效果。(CD: 50秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '无敌效果持续4秒。'},
      { level: 2, description: '无敌效果持续4.5秒。'},
      { level: 3, description: '无敌效果持续5秒。'}
    ]
  },

  '铁血': {
    id: '铁血',
    rank: 'S',
    cost: 6,
    description: '被猫攻击击至虚弱时，可以继续行动一段时间，在此时间内无法使用技能和道具，也无法获得其他的护盾和无敌效果，随后会进入虚弱状态。(CD: 60秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '受到致命伤害后，可以坚持4秒才虚弱。'},
      { level: 2, description: '受到致命伤害后，可以坚持4.5秒才虚弱。'},
      { level: 3, description: '受到致命伤害后，可以坚持5秒才虚弱。'}
    ]
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  '冲冠一怒': {
    id: '冲冠一怒',
    rank: 'A',
    cost: 4,
    description: '冲冠一怒！当同伴被猫咪抓住时，携带该知识卡的老鼠攻击力提升，周围没有敌方角色时，还会提升自身移动和跳跃能力。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '攻击力提升15%。周围没有敌方角色时，移动和跳跃速度提升18%。'},
      { level: 2, description: '攻击力提升15%。周围没有敌方角色时，移动和跳跃速度提升19%。'},
      { level: 3, description: '攻击力提升15%。周围没有敌方角色时，移动和跳跃速度提升20%。'}
    ]
  },

  '团队领袖': {
    id: '团队领袖',
    rank: 'A',
    cost: 5,
    description: '当自己处于健康状态时，自己和附近同伴推奶酪速度提升（效果不可叠加）。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '推奶酪速度提升3%。'},
      { level: 2, description: '推奶酪速度提升4%。'},
      { level: 3, description: '推奶酪速度提升5%。'}
    ]
  },

  '投手': {
    id: '投手',
    rank: 'A',
    cost: 4,
    description: '投掷道具可以额外对猫咪造成减速效果，最多叠加2层。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每次使猫咪的移动速度降低6%。'},
      { level: 2, description: '每次使猫咪的移动速度降低8%。'},
      { level: 3, description: '每次使猫咪的移动速度降低12%。'}
    ]
  },

  '泡泡浴': {
    id: '泡泡浴',
    rank: 'A',
    cost: 4,
    description: '我爱洗澡，皮肤好好！拥有泡泡浴知识卡的老鼠，每隔一段时间将可以解除受伤、反向、失明的状态。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每隔60秒，解除受伤、反向、失明的效果。'},
      { level: 2, description: '每隔55秒，解除受伤、反向、失明的效果。'},
      { level: 3, description: '每隔45秒，解除受伤、反向、失明的效果。'}
    ]
  },

  '祝愿': {
    id: '祝愿',
    rank: 'A',
    cost: 4,
    description: '这是心的呼唤，这是爱的奉献！在自己被放飞时，全体队友回复部分健康值、获得经验并提升移动速度。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '队友移动、跳跃速度提升持续10秒。'},
      { level: 2, description: '队友移动、跳跃速度提升持续11秒。'},
      { level: 3, description: '队友移动、跳跃速度提升持续12秒。'}
    ]
  },

  '翩若惊鸿': {
    id: '翩若惊鸿',
    rank: 'A',
    cost: 4,
    description: '老鼠掌握更融的技巧，经过冰面或冰块命中后会获得一段时间加速效果。“身轻若健燕，潇洒若游龙，翩若惊鸿，婉若游龙。”',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '获得小幅度加速效果。'},
      { level: 2, description: '获得中幅度加速效果。'},
      { level: 3, description: '获得大幅度加速效果。'}
    ]
  },

  '逃窜': {
    id: '逃窜',
    rank: 'A',
    cost: 4,
    description: '受到猫咪的攻击后，移动、跳跃速度和健康值恢复速度短暂提升。(35秒内不会重复触发)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速效果持续8秒。'},
      { level: 2, description: '加速效果持续9秒。'},
      { level: 3, description: '加速效果持续10秒。'}
    ]
  },

  '闭门羹': {
    id: '闭门羹',
    rank: 'A',
    cost: 4,
    description: '用力的关上门，关门后获得短暂的加速，并可以将门附近的敌方弹开(内置CD: 5s)。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速效果持续4.5秒。'},
      { level: 2, description: '加速效果持续5秒。'},
      { level: 3, description: '加速效果持续5.5秒。'}
    ]
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  '夹不住我': {
    id: '夹不住我',
    rank: 'B',
    cost: 3,
    description: '增加挣脱老鼠夹速度，每次挣脱老鼠夹后，下次挣脱老鼠夹将会更快、最多叠加3层。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每次成功挣脱老鼠夹后，下次挣脱速度提升12%。'},
      { level: 2, description: '每次成功挣脱老鼠夹后，下次挣脱速度提升14%。'},
      { level: 3, description: '每次成功挣脱老鼠夹后，下次挣脱速度提升16%。'}
    ]
  },

  '孤军奋战': {
    id: '孤军奋战',
    rank: 'B',
    cost: 3,
    description: '如果自己附近没有其他可行动的老鼠，则被猫咪追击时，移动能力得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '移动速度提升3%。'},
      { level: 2, description: '移动速度提升4%。'},
      { level: 3, description: '移动速度提升5%。'}
    ]
  },

  '幸运': {
    id: '幸运',
    rank: 'B',
    cost: 5,
    description: '幸运的老鼠，上火箭后第一次挣扎必然可以从火箭上挣扎下来（每局只能触发1次）。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '首次挣扎速率提升10%。'},
      { level: 2, description: '首次挣扎速率提升20%。'},
      { level: 3, description: '首次挣扎速率提升35%。'}
    ]
  },

  '应激反应': {
    id: '应激反应',
    rank: 'B',
    cost: 4,
    description: '处于受伤状态时，移动速度和跳跃高度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '受伤状态下移动速度和跳跃高度提升7%。'},
      { level: 2, description: '受伤状态下移动速度和跳跃高度提升8%。'},
      { level: 3, description: '受伤状态下移动速度和跳跃高度提升9%。'}
    ]
  },

  '求生欲': {
    id: '求生欲',
    rank: 'B',
    cost: 4,
    description: '拥有强烈求生欲的老鼠，当同一房间内没有其他老鼠时，在猫爪和火箭上挣扎的速度提升。',
    // detailedDescription: '',
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
    description: '破坏力惊人的老鼠，对墙缝造成的伤害增加。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每次破坏墙缝时，额外造成墙缝基础坚固值x0.6%的伤害。'},
      { level: 2, description: '每次破坏墙缝时，额外造成墙缝基础坚固值x0.8%的伤害。'},
      { level: 3, description: '每次破坏墙缝时，额外造成墙缝基础坚固值x1%的伤害。'}
    ]
  },

  '精准投射': {
    id: '精准投射',
    rank: 'B',
    cost: 4,
    description: '使用投掷道具击中猫咪后，可以降低自身技能的冷却时间（内置触发CD：5秒）。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '技能冷却时间降低2秒。'},
      { level: 2, description: '技能冷却时间降低3秒。'},
      { level: 3, description: '技能冷却时间降低4秒。'}
    ]
  },

  '绝地反击': {
    id: '绝地反击',
    rank: 'B',
    cost: 3,
    description: '当自己的健康值低于一定比例时，攻击力得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '当自己的健康值小于或等于25%时，攻击力得到提升。'},
      { level: 2, description: '当自己的健康值小于或等于30%时，攻击力得到提升。'},
      { level: 3, description: '当自己的健康值小于或等于35%时，攻击力得到提升。'}
    ]
  },

  '追风': {
    id: '追风',
    rank: 'B',
    cost: 4,
    description: '老鼠使用道具击中猫后，移动时会获得加速效果。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '击中目标后，移动速度提高5%。'},
      { level: 2, description: '击中目标后，移动速度提高7%。'},
      { level: 3, description: '击中目标后，移动速度提高10%。'}
    ]
  },

  '逃之夭夭': {
    id: '逃之夭夭',
    rank: 'B',
    cost: 4,
    description: '老鼠从火箭上救下队友后连忙逃走，自己和队友的移动速度获得短暂提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速效果持续5秒。'},
      { level: 2, description: '加速效果持续6秒。'},
      { level: 3, description: '加速效果持续7秒。'}
    ]
  },

  '速推': {
    id: '速推',
    rank: 'B',
    cost: 5,
    description: '得到仙女鼠的魔法加成，老鼠推奶酪的速度提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '推奶酪速度提升3%。'},
      { level: 2, description: '推奶酪速度提升4%。'},
      { level: 3, description: '推奶酪速度提升5%。'}
    ]
  },

  '飞跃': {
    id: '飞跃',
    rank: 'B',
    cost: 4,
    description: '掌握了身轻如燕的秘法后，老鼠跳跃能力提升。',
    // detailedDescription: '',
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
    description: '老鼠喝牛奶或者吃蛋糕后，推奶酪速度永久提升，最多叠加5层。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '推奶酪速度永久提升1%。'},
      { level: 2, description: '推奶酪速度永久提升2%。'},
      { level: 3, description: '推奶酪速度永久提升3%。'}
    ]
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  '不屈': {
    id: '不屈',
    rank: 'C',
    cost: 3,
    description: '每被放飞一名队友，自己的血量上限、推奶酪速度、移动速度得到提高。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每被放飞一名队友，推奶酪速度提升10%，移动速度提升5%。'},
      { level: 2, description: '每被放飞一名队友，推奶酪速度提升10%，移动速度提升6%。'},
      { level: 3, description: '每被放飞一名队友，推奶酪速度提升10%，移动速度提升7%。'}
    ]
  },

  '吃货': {
    id: '吃货',
    rank: 'C',
    cost: 3,
    description: '这世上唯有美食不可辜负！老鼠从食物中获得的增益效果将会加长。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '吃食物后，获得效果的时间增加20%。'},
      { level: 2, description: '吃食物后，获得效果的时间增加30%。'},
      { level: 3, description: '吃食物后，获得效果的时间增加50%。'}
    ]
  },

  '强健': {
    id: '强健',
    rank: 'C',
    cost: 4,
    description: '年轻鼠恢复的速度就是快！佩戴该知识卡，能减少老鼠虚弱的持续时间。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '虚弱状态持续时间减少20%。'},
      { level: 2, description: '虚弱状态持续时间减少25%。'},
      { level: 3, description: '虚弱状态持续时间减少30%。'}
    ]
  },

  '救救我': {
    id: '救救我',
    rank: 'C',
    cost: 3,
    description: '当自己被绑在火箭上时，队友推奶酪的速度将会下降，但队友救援的速度将会得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '队友的救援速度提升30%。'},
      { level: 2, description: '队友的救援速度提升35%。'},
      { level: 3, description: '队友的救援速度提升40%。'}
    ]
  },

  '相助': {
    id: '相助',
    rank: 'C',
    cost: 4,
    description: '守望相助的老鼠们，使自己和附近队友的治疗和救援的速度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '治疗、救援速度提升8%。'},
      { level: 2, description: '治疗、救援速度提升12%。'},
      { level: 3, description: '治疗、救援速度提升16%。'}
    ]
  },

  '美食家': {
    id: '美食家',
    rank: 'C',
    cost: 3,
    description: '孤独的美食家每局前几次打开箱子时，必然获得牛奶或蛋糕。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每局前2次打开箱子时，必然获得牛奶或蛋糕。'},
      { level: 2, description: '每局前3次打开箱子时，必然获得牛奶或蛋糕。'},
      { level: 3, description: '每局前4次打开箱子时，必然获得牛奶或蛋糕。'}
    ]
  },

  '脱身': {
    id: '脱身',
    rank: 'C',
    cost: 3,
    description: '自己从猫手里或者火箭上挣扎下来，可以恢复大量健康值',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '恢复50健康值。'},
      { level: 2, description: '恢复75健康值。'},
      { level: 3, description: '恢复100健康值。'}
    ]
  },

  '门卫': {
    id: '门卫',
    rank: 'C',
    cost: 3,
    description: '老鼠在使用门时，开门和关门速度提高。',
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
      factionId: 'mouse' as const, // Apply faction ID in bulk
      imageUrl: getMouseCardImageUrl(card.rank, card.id)
    }
  ])
);
