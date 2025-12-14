import { Card } from '@/data/types';

// Generate image URL based on card rank and name for mouse faction
const getMouseCardImageUrl = (rank: string, name: string): string => {
  return `/images/mouseCards/${rank}-${name}.png`;
};

export const mouseKnowledgeCards: Record<string, Card> = {
  /* ----------------------------------- S级卡 ---------------------------------- */
  回家: {
    id: '回家',
    rank: 'S',
    cost: 6,
    description: '墙缝出现后立刻解除虚弱和受伤，回满Hp，并额外获得**增益**。',
    detailedDescription:
      '为所有爱执着的痛，再痛我也要回家！墙缝出现后立刻解除虚弱和受伤，回复200Hp，并额外获得**增益**。',
    levels: [
      {
        level: 1,
        description: '额外**略微加速**。',
        detailedDescription: '额外**加速3.5%**。',
      },
      {
        level: 2,
        description: '再额外**提升Hp恢复速度**。',
        detailedDescription:
          '再额外**获得2.5Hp/秒的恢复效果**（该效果与基础Hp恢复不同，不会因受伤而失效）。',
      },
      {
        level: 3,
        description: '再额外**获得2层护盾**。',
        detailedDescription:
          '再额外**获得2层护盾**（该护盾与护佑或护盾药水效果不同，持续时间无限，但会被碎片消耗）。',
      },
    ],
    priority: '3级质变',
  },

  护佑: {
    id: '护佑',
    rank: 'S',
    cost: 6,
    description: '出洞时获得特殊护盾，持续**较长**时间。该护盾生效时，免疫碎片、烫伤、烟雾和香水。',
    detailedDescription:
      '得到仙女鼠护佑的老鼠，出洞进入房间时获得特殊护盾，持续**较长**时间。该护盾生效时，免疫碎片、烫伤、烟雾和香水。',
    levels: [
      { level: 1, description: '护佑持续**240**秒。' },
      { level: 2, description: '护佑持续**270**秒。' },
      { level: 3, description: '护佑持续**300**秒。' },
    ],
    priority: '几乎无提升',
  },

  无畏: {
    id: '无畏',
    rank: 'S',
    cost: 6,
    description:
      '从火箭上救下队友后，彼此同时获得**短暂**的无敌并固定增加推速，但此期间无法使用技能和道具；效果结束后陷入短暂的眩晕。(CD: 60秒)',
    detailedDescription:
      '从火箭上救下队友后，彼此同时获得**短暂**的无敌并[固定增加推速2.5%/秒](该类效果不受其他任何百分比推速增/减效果影响，独立结算)，但此期间无法使用技能和道具；效果结束后眩晕1.2秒。(CD: 60秒)',
    levels: [
      { level: 1, description: '无畏持续**6**秒。' },
      { level: 2, description: '无畏持续**6.5**秒。' },
      { level: 3, description: '无畏持续**7**秒。' },
    ],
    priority: '提升较小',
  },

  有难同当: {
    id: '有难同当',
    rank: 'S',
    cost: 5,
    description: 'Hp在一半以上时，[牺牲自己的Hp](不会致死)为附近队友减伤。有内置**CD**。',
    detailedDescription:
      '当自身Hp超过Hp上限的一半，且半径1150范围内队友受到猫咪伤害时，队友受到的伤害减免为原来的30%，然后该伤害每有5点，自身失去剩余Hp的3%（至少保留10Hp）。之后10秒内，逐渐恢复失去Hp的50%。有内置**CD**。“为众人抱薪者，不可使其冻毙于风雪。”',
    levels: [
      { level: 1, description: 'CD：**40**秒。' },
      { level: 2, description: 'CD：**35**秒。' },
      { level: 3, description: 'CD：**30**秒。' },
    ],
    priority: '提升较小',
  },

  缴械: {
    id: '缴械',
    rank: 'S',
    cost: 6,
    description: '投掷道具命中猫咪后，使猫咪**一段时间**内无法使用爪刀。',
    detailedDescription:
      '投掷道具命中猫咪后，使猫咪**一段时间**内无法使用爪刀。猫咪被缴械后，30秒内不会再次被缴械。',
    levels: [
      { level: 1, description: '缴械持续**3.5**秒。' },
      { level: 2, description: '缴械持续**4**秒。' },
      { level: 3, description: '缴械持续**4.5**秒。' },
    ],
    priority: '提升明显',
  },

  舍己: {
    id: '舍己',
    rank: 'S',
    cost: 5,
    description: '从火箭上救下队友后，与队友互换Hp，并给予队友**短暂**的无敌。(CD: 50秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '无敌持续**4**秒。' },
      { level: 2, description: '无敌持续**4.5**秒。' },
      { level: 3, description: '无敌持续**5**秒。' },
    ],
    priority: '提升明显',
  },

  铁血: {
    id: '铁血',
    rank: 'S',
    cost: 6,
    description: '即将虚弱时，可以继续行动**一段时间**，但无法使用技能和道具。(CD: 60秒)',
    detailedDescription:
      '即将虚弱时，可以继续行动**一段时间**，但无法使用技能和道具，也无法获得护盾和无敌，随后再进入虚弱。(CD: 60秒)',
    levels: [
      { level: 1, description: '铁血持续**4**秒。' },
      { level: 2, description: '铁血持续**4.5**秒。' },
      { level: 3, description: '铁血持续**5**秒。' },
    ],
    priority: '提升明显',
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  冲冠一怒: {
    id: '冲冠一怒',
    rank: 'A',
    cost: 4,
    description: '当队友被猫咪抓住时，攻击力提升；如果猫咪不在附近，额外**提升**移动和跳跃速度。',
    detailedDescription:
      '当队友被猫咪抓住时，[角色基础攻击增伤提升15%](该效果只对角色基础属性中的“攻击增伤”生效，对道具/技能的基础伤害，以及其他来源的攻击增伤均不生效，因此实际加成极低)；如果猫咪不在自身半径1100范围内，额外**提升**移动和跳跃速度。',
    levels: [
      { level: 1, description: '移动和跳跃速度提升**18%**。' },
      { level: 2, description: '移动和跳跃速度提升**19%**。' },
      { level: 3, description: '移动和跳跃速度提升**20%**。' },
    ],
    priority: '几乎无提升',
  },

  团队领袖: {
    id: '团队领袖',
    rank: 'A',
    cost: 5,
    description: '处于健康状态时，自己和附近队友推速**提升**。（效果不可叠加）',
    detailedDescription:
      '处于健康状态时，自己和半径1700范围内队友推速**提升**（多张团队领袖的效果不可叠加）。',
    levels: [
      { level: 1, description: '推速提升**3%**。' },
      { level: 2, description: '推速提升**4%**。' },
      { level: 3, description: '推速提升**5%**。' },
    ],
    priority: '提升明显',
  },

  投手: {
    id: '投手',
    rank: 'A',
    cost: 4,
    description: '投掷道具额外**减速**猫咪。',
    detailedDescription: '投掷道具额外**减速**猫咪，持续5秒，最多叠加2层（每层效果间独立乘算）。',
    levels: [
      { level: 1, description: '减速**6%**。' },
      { level: 2, description: '减速**8%**。' },
      { level: 3, description: '减速**12%**。' },
    ],
    priority: '提升明显',
  },

  泡泡浴: {
    id: '泡泡浴',
    rank: 'A',
    cost: 4,
    description: '每隔**一段时间**解除受伤、反向、失明。',
    detailedDescription: '我爱洗澡，皮肤好好！每隔**一段时间**解除受伤、反向、失明。',
    levels: [
      { level: 1, description: '每隔**60**秒触发。' },
      { level: 2, description: '每隔**55**秒触发。' },
      { level: 3, description: '每隔**45**秒触发。' },
    ],
    priority: '提升明显',
  },

  祝愿: {
    id: '祝愿',
    rank: 'A',
    cost: 4,
    description: '自己被放飞时，全体队友回复部分Hp、获得经验，并**短暂**提升移动和跳跃速度。',
    detailedDescription:
      '这是心的呼唤，这是爱的奉献！自己[被放飞](部分复活类效果触发时依然算作被放飞，此时复活体因被击倒而放飞时不再触发祝愿效果)时，全体队友回复50Hp、平分2500经验，并**短暂**提升14%移动和跳跃速度。',
    levels: [
      { level: 1, description: '队友移动和跳跃速度提升持续**10**秒。' },
      { level: 2, description: '队友移动和跳跃速度提升持续**11**秒。' },
      { level: 3, description: '队友移动和跳跃速度提升持续**12**秒。' },
    ],
    priority: '几乎无提升',
  },

  翩若惊鸿: {
    id: '翩若惊鸿',
    rank: 'A',
    cost: 4,
    description: '经过冰面或冰块命中后获得短暂**加速**。',
    detailedDescription:
      '老鼠掌握更酷的技巧，经过冰面或冰块命中后获得5秒**加速**。“身轻若健燕，潇洒若游龙，翩若惊鸿，婉若游龙。”',
    levels: [
      { level: 1, description: '加速**10%**。' },
      { level: 2, description: '加速**15%**。' },
      { level: 3, description: '加速**20%**。' },
    ],
    priority: '提升明显',
  },

  逃窜: {
    id: '逃窜',
    rank: 'A',
    cost: 4,
    description: '受到猫咪的攻击后，**短暂**提升移动、跳跃速度和Hp恢复速度。(CD：35秒)',
    detailedDescription:
      '受到猫咪的攻击后，**短暂**提升移动、跳跃速度20%，并[获得2Hp/秒的恢复效果](该效果与角色基础Hp恢复不同，不会因受伤效果而失效)。(CD：35秒)',
    levels: [
      { level: 1, description: '效果持续**8**秒。' },
      { level: 2, description: '效果持续**9**秒。' },
      { level: 3, description: '效果持续**10**秒。' },
    ],
    priority: '提升较小',
  },

  闭门羹: {
    id: '闭门羹',
    rank: 'A',
    cost: 4,
    description: '关门后获得**短暂**加速，并眩晕门附近的猫咪。(CD: 5秒)',
    detailedDescription:
      '用力地关上门，关门后**短暂**加速50%，对门附近的猫咪造成1.5秒[眩晕](不掉落道具和老鼠)。(CD: 5秒)',
    levels: [
      { level: 1, description: '加速持续**4.5**秒。' },
      { level: 2, description: '加速持续**5**秒。' },
      { level: 3, description: '加速持续**5.5**秒。' },
    ],
    priority: '提升明显',
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  夹不住我: {
    id: '夹不住我',
    rank: 'B',
    cost: 3,
    description:
      '增加挣脱捕鼠夹速度；每次[挣脱捕鼠夹](自起排夹不计)后，下次挣脱捕鼠夹将会**更快**，最多叠加3层。',
    levels: [
      { level: 1, description: '每层提升**12%**挣脱速度。' },
      { level: 2, description: '每层提升**14%**挣脱速度。' },
      { level: 3, description: '每层提升**16%**挣脱速度。' },
    ],
    priority: '提升较小',
  },

  孤军奋战: {
    id: '孤军奋战',
    rank: 'B',
    cost: 3,
    description: '被猫咪追击时，如果附近没有其他可行动的老鼠，获得**加速**。',
    detailedDescription: '周围550范围内有猫咪时，如果该范围内没有其他可行动的老鼠，获得**加速**。',
    levels: [
      { level: 1, description: '加速**3%**。' },
      { level: 2, description: '加速**4%**。' },
      { level: 3, description: '加速**5%**。' },
    ],
    priority: '提升明显',
  },

  幸运: {
    id: '幸运',
    rank: 'B',
    cost: 5,
    description: '上火箭后可以从火箭上挣扎下来，每局限1次；墙缝期不可触发。',
    detailedDescription: '幸运的老鼠，上火箭后可以从火箭上挣扎下来，每局限1次；墙缝期不可触发。',
    levels: [
      { level: 1, description: '首次挣扎速度提升**10%**。' },
      { level: 2, description: '首次挣扎速度提升**20%**。' },
      { level: 3, description: '首次挣扎速度提升**35%**。' },
    ],
    priority: '提升明显',
  },

  应激反应: {
    id: '应激反应',
    rank: 'B',
    cost: 4,
    description: '受伤状态下，**提升**移速和跳跃高度。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '提升**7%**。' },
      { level: 2, description: '提升**8%**。' },
      { level: 3, description: '提升**9%**。' },
    ],
    priority: '提升较小',
  },

  求生欲: {
    id: '求生欲',
    rank: 'B',
    cost: 4,
    description: '当同一房间内没有其他老鼠时，在猫爪和火箭上的挣扎速度**提升**。',
    detailedDescription:
      '拥有强烈求生欲的老鼠，当同一房间内没有其他老鼠时，在猫爪和火箭上的挣扎速度**提升**。',
    levels: [
      { level: 1, description: '挣扎速度提升**15%**。' },
      { level: 2, description: '挣扎速度提升**18%**。' },
      { level: 3, description: '挣扎速度提升**21%**。' },
    ],
    priority: '提升明显',
  },

  破墙: {
    id: '破墙',
    rank: 'B',
    cost: 5,
    description: '对墙缝造成的伤害**增加**。',
    detailedDescription:
      '破坏力惊人的老鼠，对墙缝造成的伤害**增加**。（墙缝基础坚固值为100；果盘只触发第一颗）',
    levels: [
      { level: 1, description: '增伤**0.6**。' },
      { level: 2, description: '增伤**0.8**。' },
      { level: 3, description: '增伤**1**。' },
    ],
    priority: '提升明显',
  },

  精准投射: {
    id: '精准投射',
    rank: 'B',
    cost: 4,
    description: '投掷道具击中猫咪后，**降低**自身技能CD。(CD：5秒)',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '降低**2**秒CD。' },
      { level: 2, description: '降低**3**秒CD。' },
      { level: 3, description: '降低**4**秒CD。' },
    ],
    priority: '3级质变',
  },

  绝地反击: {
    id: '绝地反击',
    rank: 'B',
    cost: 3,
    description: 'Hp**较低**时，提升攻击增伤。',
    detailedDescription: 'Hp**较低**时，攻击增伤提升25点。',
    levels: [
      { level: 1, description: 'Hp不高于**25%**时触发。' },
      { level: 2, description: 'Hp不高于**30%**时触发。' },
      { level: 3, description: 'Hp不高于**35%**时触发。' },
    ],
    priority: '3级质变',
  },

  追风: {
    id: '追风',
    rank: 'B',
    cost: 4,
    description: '使用道具击中猫后，获得短暂**加速**。',
    detailedDescription: '使用道具击中猫后，获得3秒**加速**。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速**5%**。' },
      { level: 2, description: '加速**7%**。' },
      { level: 3, description: '加速**10%**。' },
    ],
    priority: '本身无用',
  },

  逃之夭夭: {
    id: '逃之夭夭',
    rank: 'B',
    cost: 4,
    description: '从火箭上救下队友后，彼此获得**短暂**加速。',
    detailedDescription: '老鼠从火箭上救下队友后连忙逃走，彼此**短暂**提高22%移速。',
    levels: [
      { level: 1, description: '加速持续**5**秒。' },
      { level: 2, description: '加速持续**6**秒。' },
      { level: 3, description: '加速持续**7**秒。' },
    ],
    priority: '提升明显',
  },

  速推: {
    id: '速推',
    rank: 'B',
    cost: 5,
    description: '推速**提升**。',
    detailedDescription: '得到仙女鼠的魔法加成，推速**提升**。',
    levels: [
      { level: 1, description: '提升**3%**。' },
      { level: 2, description: '提升**4%**。' },
      { level: 3, description: '提升**5%**。' },
    ],
    priority: '本身无用',
  },

  飞跃: {
    id: '飞跃',
    rank: 'B',
    cost: 4,
    description: '跳跃速度**提升**。',
    detailedDescription: '掌握了身轻如燕的秘法后，跳跃速度**提升**。',
    levels: [
      { level: 1, description: '跳跃速度提升**5%**。' },
      { level: 2, description: '跳跃速度提升**6%**。' },
      { level: 3, description: '跳跃速度提升**7%**。' },
    ],
    priority: '提升明显',
  },

  食物力量: {
    id: '食物力量',
    rank: 'B',
    cost: 3,
    description: '老鼠喝牛奶或吃蛋糕后，永久**提升**推速，最多叠加5层。',
    levels: [
      { level: 1, description: '每层提升**1%**推速。' },
      { level: 2, description: '每层提升**2%**推速。' },
      { level: 3, description: '每层提升**3%**推速。' },
    ],
    priority: '提升明显',
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  不屈: {
    id: '不屈',
    rank: 'C',
    cost: 3,
    description: '每被放飞一名队友，自己的Hp上限、推速、**移速**得到提升。最多叠加3层。',
    detailedDescription:
      '每被放飞一名队友，自己的Hp上限提高12，推速提升10%，**移速**提升。最多叠加3层（每层移速和推速加成间独立乘算，其他加成为加算）。',
    levels: [
      { level: 1, description: '移速提升**5%**。' },
      { level: 2, description: '移速提升**6%**。' },
      { level: 3, description: '移速提升**7%**。' },
    ],
    priority: '提升明显',
  },

  吃货: {
    id: '吃货',
    rank: 'C',
    cost: 3,
    description: '**延长**牛奶的增益。',
    detailedDescription: '这世上唯有美食不可辜负！**延长**牛奶和天宫仙丹的增益。',
    levels: [
      { level: 1, description: '延长**20%**。' },
      { level: 2, description: '延长**30%**。' },
      { level: 3, description: '延长**50%**。' },
    ],
    priority: '提升明显',
  },

  强健: {
    id: '强健',
    rank: 'C',
    cost: 4,
    description: '**减少**虚弱时间。',
    detailedDescription: '年轻鼠恢复的速度就是快！**减少**虚弱时间。',
    levels: [
      { level: 1, description: '减少**20%**。' },
      { level: 2, description: '减少**25%**。' },
      { level: 3, description: '减少**30%**。' },
    ],
    priority: '提升明显',
  },

  救救我: {
    id: '救救我',
    rank: 'C',
    cost: 3,
    description: '当自己被绑在火箭上时，队友推速下降，但救援速度**提升**。',
    detailedDescription: '当自己被绑在火箭上时，队友推速下降10%，但救援速度**提升**。',
    levels: [
      { level: 1, description: '提升**30%**。' },
      { level: 2, description: '提升**35%**。' },
      { level: 3, description: '提升**40%**。' },
    ],
    priority: '提升明显',
  },

  相助: {
    id: '相助',
    rank: 'C',
    cost: 4,
    description: '**提高**自己和附近队友的治疗、救援速度。',
    detailedDescription: '守望相助的老鼠们，**提升**自己和附近队友的治疗、救援速度。',
    levels: [
      { level: 1, description: '提升**8%**。' },
      { level: 2, description: '提升**12%**。' },
      { level: 3, description: '提升**16%**。' },
    ],
    priority: '本身无用',
  },

  美食家: {
    id: '美食家',
    rank: 'C',
    cost: 3,
    description: '每局**前几次**打开箱子时，必然开出牛奶或蛋糕。',
    detailedDescription: '孤独的美食家每局**前几次**打开箱子时，必然开出牛奶或蛋糕。',
    levels: [
      { level: 1, description: '每局**前2次**打开箱子时触发。' },
      { level: 2, description: '每局**前3次**打开箱子时触发。' },
      { level: 3, description: '每局**前4次**打开箱子时触发。' },
    ],
    priority: '本身无用',
  },

  脱身: {
    id: '脱身',
    rank: 'C',
    cost: 3,
    description: '从猫手里或火箭上挣扎下来时，恢复**大量Hp**。',
    levels: [
      { level: 1, description: '恢复**50Hp**。' },
      { level: 2, description: '恢复**75Hp**。' },
      { level: 3, description: '恢复**100Hp**。' },
    ],
    priority: '提升明显',
  },

  门卫: {
    id: '门卫',
    rank: 'C',
    cost: 3,
    description: '**提高**开门和关门速度。',
    levels: [
      { level: 1, description: '开关门速度提高**30%**。' },
      { level: 2, description: '开关门速度提高**40%**。' },
      { level: 3, description: '开关门速度提高**50%**。' },
    ],
    priority: '本身无用',
  },
};

// Generate cards with faction ID and image URLs applied in bulk
export const mouseCardsWithImages = Object.fromEntries(
  Object.entries(mouseKnowledgeCards).map(([cardId, card]) => [
    cardId,
    {
      ...card,
      factionId: 'mouse' as const,
      imageUrl: getMouseCardImageUrl(card.rank, card.id),
    },
  ])
);
