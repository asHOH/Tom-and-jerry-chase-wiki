import { Card } from './types';

// Generate image URL based on card rank and id for cat faction
const getCatCardImageUrl = (rank: string, id: string): string => {
  return `/images/catCards/${rank}-${id}.png`;
};

// Extract card data from image filenames
// Based on the existing images in public/images/catCards/
export const catCards: Record<string, Card> = {
  /* ----------------------------------- S级卡 ---------------------------------- */
  '乘胜追击': {
    id: '乘胜追击',
    rank: 'S',
    cost: 7,
    description: '每当猫咪抓中老鼠或使老鼠进入虚弱状态时，将提升自己2%移动速度和2%攻击频率，效果可以叠加。猫咪进入虚弱状态移除当前一半层数。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '效果最多叠加5层。'},
      { level: 2, description: '效果最多叠加6层。'},
      { level: 3, description: '效果最多叠加7层。'}
    ]
  },

  '乾坤一掷': {
    id: '乾坤一掷',
    rank: 'S',
    cost: 6,
    description: '保持健康值60%以上一段时间可进入乾坤一掷状态，提高移动速度和投掷物伤害，健康值低于阈值后移除该状态。“待吾择良辰回首，今朝一掷定乾坤！”',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '保持60%健康值以上20秒后获得乾坤一掷效果。'},
      { level: 2, description: '保持60%健康值以上19秒后获得乾坤一掷效果。'},
      { level: 3, description: '保持60%健康值以上18秒后获得乾坤一掷效果。'}
    ]
  },

  '击晕': {
    id: '击晕',
    rank: 'S',
    cost: 7,
    description: '猫咪掌握了独特的攻击手法，能对攻击到的老鼠造成短暂的眩晕。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '击晕时间增加至0.8秒。'},
      { level: 2, description: '击晕时间增加至0.9秒。'},
      { level: 3, description: '击晕时间增加至1.0秒。'}
    ]
  },

  '屈打成招': {
    id: '屈打成招',
    rank: 'S',
    cost: 6,
    description: '逼问意志不坚定的老鼠，你将得到对方队友的位置信息！手持老鼠或将老鼠绑在火箭上时，猫咪能获得其他老鼠的位置。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '可以审问出1只老鼠的行踪。'},
      { level: 2, description: '可以审问出2只老鼠的行踪。'},
      { level: 3, description: '可以审问出3只老鼠的行踪。'}
    ]
  },

  '暴怒': {
    id: '暴怒',
    rank: 'S',
    cost: 6,
    description: '墙缝即将被破开时，猫咪进入暴怒状态，攻击力增加50，但技能会增加50%的间隙。虚弱起身后台也会获得10秒的暴怒状态。', // Note: "后台" in "虚弱起身后台" might be a typo/OCR error from the image, possibly intended as "后也".
    // detailedDescription: '',
    levels: [
      { level: 1, description: '墙缝被破坏30%后触发。'},
      { level: 2, description: '墙缝被破坏25%后触发。'},
      { level: 3, description: '墙缝被破坏20%后触发。'}
    ]
  },

  '猛攻': {
    id: '猛攻',
    rank: 'S',
    cost: 5,
    description: '猫咪的攻击使老鼠在短时间内无法使用技能、武器和道具，并掉落手中的道具。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '被击中的老鼠，5秒内无法使用技能、武器和道具。'},
      { level: 2, description: '被击中的老鼠，6秒内无法使用技能、武器和道具。'},
      { level: 3, description: '被击中的老鼠，7秒内无法使用技能、武器和道具。'}
    ]
  },

  '知识渊博': {
    id: '知识渊博',
    rank: 'S',
    cost: 6,
    description: '知识渊博的猫咪，天生拥有更多的经验，同时自然经验增长的速度也获得提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '提升初始经验，小幅提升自然经验增长速度。'},
      { level: 2, description: '提升初始经验，中幅提升自然经验增长速度。'},
      { level: 3, description: '提升初始经验，大幅提升自然经验增长速度。'}
    ]
  },

  '蓄势一击': {
    id: '蓄势一击',
    rank: 'S',
    cost: 6,
    description: '每一次的潜伏，都是为了今后的爆发。如果猫咪一段时间内没有进行过普通攻击，也没有受到来自敌方的眩晕和硬直效果的影响，则下一次爪击将附带额外伤害。从虚弱状态恢复或升级后立刻刷新蓄力一击状态。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每隔14秒，会获得一次蓄力攻击的效果。'},
      { level: 2, description: '每隔13秒，会获得一次蓄力攻击的效果。'},
      { level: 3, description: '每隔12秒，会获得一次蓄力攻击的效果。'}
    ]
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  '加大火力': {
    id: '加大火力',
    rank: 'A',
    cost: 4,
    description: '点燃火箭吧！猫咪将老鼠绑上火箭后，使火箭燃烧的速度变得更快！在拥有老鼠火箭附近击倒老鼠，会额外减少火箭5秒燃烧时间（20秒内不会复触发）。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '火箭引线燃烧速度提升12%。'},
      { level: 2, description: '火箭引线燃烧速度提升13%。'},
      { level: 3, description: '火箭引线燃烧速度提升14%。'}
    ]
  },

  '威压': {
    id: '威压',
    rank: 'A',
    cost: 4,
    description: '给附近的老鼠带来强大的压迫感，使得老鼠移动速度降低，在使用技能后一段时间内造成更强的减速效果。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '附近老鼠移动速度降低6%。'},
      { level: 2, description: '附近老鼠移动速度降低7%。'},
      { level: 3, description: '附近老鼠移动速度降低8%。'}
    ]
  },

  '心灵手巧': {
    id: '心灵手巧',
    rank: 'A',
    cost: 4,
    description: '那些笨手笨脚的老鼠！心灵手巧的猫咪在布置捕鼠夹、绑火箭、修复火箭时，交互速度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '交互速度提升26%。'},
      { level: 2, description: '交互速度提升28%。'},
      { level: 3, description: '交互速度提升30%。'}
    ]
  },

  '熊熊燃烧': {
    id: '熊熊燃烧',
    rank: 'A',
    cost: 6,
    description: '燃烧我的引信！每次将老鼠绑上火箭后，火箭引信将会立刻燃烧掉一截。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每次将老鼠绑上火箭后，火箭的引信会额外缩短3秒。'},
      { level: 2, description: '每次将老鼠绑上火箭后，火箭的引信会额外缩短4秒。'},
      { level: 3, description: '每次将老鼠绑上火箭后，火箭的引信会额外缩短5秒。'}
    ]
  },

  '穷追猛打': {
    id: '穷追猛打',
    rank: 'A',
    cost: 4,
    description: '必胜的信念让猫都燃起来了，穷追不舍的状态下将给予猫攻击和速度强化效果，该状态会在将老鼠绑上火箭或累计击倒3次老鼠时移除。“追寻的路上不乏激情，但成功后空虚往往随之而来，火总会熄灭的，捉老鼠如此，猫生亦是如此。”',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '获得小幅度强化效果。'},
      { level: 2, description: '获得中幅度强化效果。'},
      { level: 3, description: '获得大幅度强化效果。'}
    ]
  },

  '细心': {
    id: '细心',
    rank: 'A',
    cost: 4,
    description: '细心的猫咪能够有效地躲避老鼠夹和碎片，但移动速度会小幅度降低。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '移动速度降低7%。'},
      { level: 2, description: '移动速度降低6.5%。'},
      { level: 3, description: '移动速度降低6%。'}
    ]
  },

  '越挫越勇': {
    id: '越挫越勇',
    rank: 'A',
    cost: 4,
    description: '每当猫咪进入虚弱状态，健康值上限、健康值恢复速度和移动速度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '效果最多叠加3层。'},
      { level: 2, description: '效果最多叠加4层。'},
      { level: 3, description: '效果最多叠加5层。'}
    ]
  },

  '铜墙': {
    id: '铜墙',
    rank: 'A',
    cost: 6,
    description: '自从猫咪学会了给墙面打补丁，墙缝的坚固程度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '墙缝出现时，场上每有一只老鼠存活，墙缝的坚固程度将提升10%。'},
      { level: 2, description: '墙缝出现时，场上每有一只老鼠存活，墙缝的坚固程度将提升11%。'},
      { level: 3, description: '墙缝出现时，场上每有一只老鼠存活，墙缝的坚固程度将提升12%。'}
    ]
  },

  '长爪': {
    id: '长爪',
    rank: 'A',
    cost: 4,
    description: '攻击范围大幅增强，但普通攻击伤害固定为25点，不受任何攻击力增加影响。使用拍子时只能造成效果而不能造成伤害。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '攻击范围提高64%。'},
      { level: 2, description: '攻击范围提高73%。'},
      { level: 3, description: '攻击范围提高82%。'}
    ]
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  '严防死守': {
    id: '严防死守',
    rank: 'B',
    cost: 4,
    description: '猫咪在火箭旁严防死守，火箭附近老鼠越多，使得救援速度越慢。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每只老鼠使救援的速度降低11%。'},
      { level: 2, description: '每只老鼠使救援的速度降低18%。'},
      { level: 3, description: '每只老鼠使救援的速度降低25%。'}
    ]
  },

  '减速警告': {
    id: '减速警告',
    rank: 'B',
    cost: 4,
    description: '猫咪挥爪攻击使老鼠的移动速度降低，老鼠解除受伤状态时同时解除减速效果。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '降低老鼠5%的移动速度。'},
      { level: 2, description: '降低老鼠6%的移动速度。'},
      { level: 3, description: '降低老鼠7%的移动速度。'}
    ]
  },

  '反侦察': {
    id: '反侦察',
    rank: 'B',
    cost: 3,
    description: '猫咪破坏机器鼠可以获得更多的经验',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '额外获得400经验。'},
      { level: 2, description: '额外获得500经验。'},
      { level: 3, description: '额外获得600经验。'}
    ]
  },

  '守株待鼠': {
    id: '守株待鼠',
    rank: 'B',
    cost: 3,
    description: '当敌方老鼠被绑在火箭上时，敌方老鼠的投掷伤害降低。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '敌方老鼠的投掷伤害小幅度降低。'},
      { level: 2, description: '敌方老鼠的投掷伤害中幅度降低。'},
      { level: 3, description: '敌方老鼠的投掷伤害大幅度降低。'}
    ]
  },

  '寻踪': {
    id: '寻踪',
    rank: 'B',
    cost: 3,
    description: '猫咪始终可以从小地图发现虚弱老鼠的位置。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '最多看到2只老鼠位置。'},
      { level: 2, description: '最多看到3只老鼠位置。'},
      { level: 3, description: '最多看到4只老鼠位置。'}
    ]
  },

  '恐吓': {
    id: '恐吓',
    rank: 'B',
    cost: 4,
    description: '猫咪的攻击对老鼠造成恐吓，老鼠在一段时间内推奶酪的速度大幅下降。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '恐吓造成恐吓的时间延长至30秒。'},
      { level: 2, description: '恐吓造成恐吓的时间延长至45秒。'},
      { level: 3, description: '恐吓造成恐吓的时间延长至60秒。'}
    ]
  },

  '捕鼠夹': {
    id: '捕鼠夹',
    rank: 'B',
    cost: 3,
    description: '布置更为强力的捕鼠夹，老鼠踩中捕鼠夹时会受到伤害，并且需要更长时间挣脱。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '老鼠挣脱夹子的速度降低10%。'},
      { level: 2, description: '老鼠挣脱夹子的速度降低15%。'},
      { level: 3, description: '老鼠挣脱夹子的速度降低20%。'}
    ]
  },

  '攻其不备': {
    id: '攻其不备',
    rank: 'B',
    cost: 3,
    description: '当老鼠在推奶酪且猫咪周围没有敌方角色时，猫咪试图快速接近老鼠，移动速度得到提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '周围没有敌方角色时，移动速度提升18%。'},
      { level: 2, description: '周围没有敌方角色时，移动速度提升19%。'},
      { level: 3, description: '周围没有敌方角色时，移动速度提升20%。'}
    ]
  },

  '斗志昂扬': {
    id: '斗志昂扬',
    rank: 'B',
    cost: 3,
    description: '信心满满的猫咪，可以更快捷地挥爪攻击。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '攻击间隔降低5%。'},
      { level: 2, description: '攻击间隔降低6%。'},
      { level: 3, description: '攻击间隔降低7%。'}
    ]
  },

  '皮糙肉厚': {
    id: '皮糙肉厚',
    rank: 'B',
    cost: 4,
    description: '老鼠虐我千百遍，我待老鼠如初恋！皮糙肉厚的猫咪受到敌方造成的伤害后，4s内防御力上升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '每次受到的伤害降低20。'},
      { level: 2, description: '每次受到的伤害降低25。'},
      { level: 3, description: '每次受到的伤害降低30。'}
    ]
  },

  '观察员': {
    id: '观察员',
    rank: 'B',
    cost: 3,
    description: '猫咪通过监控设备得知机器鼠的动向',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '游戏开始后20秒内，猫咪可以看到所有机器鼠的位置。'},
      { level: 2, description: '游戏开始后25秒内，猫咪可以看到所有机器鼠的位置。'},
      { level: 3, description: '游戏开始后30秒内，猫咪可以看到所有机器鼠的位置。'}
    ]
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  '巡逻戒备': {
    id: '巡逻戒备',
    rank: 'C',
    cost: 3,
    description: '四处巡逻的猫咪，会降低附近老鼠们推奶酪的速度。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '附近老鼠推奶酪的效率降低10%。'},
      { level: 2, description: '附近老鼠推奶酪的效率降低20%。'},
      { level: 3, description: '附近老鼠推奶酪的效率降低30%。'}
    ]
  },

  '春风得意': {
    id: '春风得意',
    rank: 'C',
    cost: 4,
    description: '终于抓住了一只小老鼠！当猫咪捉住老鼠时，自身的移动速度将得到提升，免疫老鼠夹和碎片。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '移动、跳跃速度提升5%。'},
      { level: 2, description: '移动、跳跃速度提升6%。'},
      { level: 3, description: '移动、跳跃速度提升7%。'}
    ]
  },

  '气势如牛': {
    id: '气势如牛',
    rank: 'C',
    cost: 3,
    description: '最后的关头！墙缝出现后，愤怒的猫咪鼓起气势，移动和跳跃速度得到短暂的提升。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速效果持续10秒。'},
      { level: 2, description: '加速效果持续15秒。'},
      { level: 3, description: '加速效果持续20秒。'}
    ]
  },

  '狡诈': {
    id: '狡诈',
    rank: 'C',
    cost: 2,
    description: '当老鼠踩中老鼠夹后，猫咪会获得短暂的加速。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速效果持续6秒。'},
      { level: 2, description: '加速效果持续7秒。'},
      { level: 3, description: '加速效果持续8秒。'}
    ]
  },

  '猫是液体': {
    id: '猫是液体',
    rank: 'C',
    cost: 2,
    description: '猫咪使自己身体变得更柔软，能够更敏捷、更频繁地穿过管道。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '钻管道的速度提升60%。'},
      { level: 2, description: '钻管道的速度提升65%。'},
      { level: 3, description: '钻管道的速度提升70%。'}
    ]
  },

  '都是朋友': {
    id: '都是朋友',
    rank: 'C',
    cost: 3,
    description: '猫咪与斯派克成为塑料朋友后，不会再受到斯派克的攻击，但最近斯派克时，猫咪的移动速度会略微降低。此外，猫咪可以免疫主人的眩晕效果',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '最近斯派克时会降低6%的移动速度。'},
      { level: 2, description: '最近斯派克时会降低4%的移动速度。'},
      { level: 3, description: '最近斯派克时会降低3%的移动速度。'}
    ]
  },

  '铁手': {
    id: '铁手',
    rank: 'C',
    cost: 4,
    description: '被猫咪抓在爪中的老鼠，挣扎的速度将会减慢。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '老鼠挣扎速度降低4%。'},
      { level: 2, description: '老鼠挣扎速度降低6%。'},
      { level: 3, description: '老鼠挣扎速度降低10%。'}
    ]
  },

  '震慑': {
    id: '震慑',
    rank: 'C',
    cost: 3,
    description: '当猫咪将老鼠绑在火箭上时，鼠方推奶酪的速度下降。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '老鼠推奶酪速度降低8%。'},
      { level: 2, description: '老鼠推奶酪速度降低12%。'},
      { level: 3, description: '老鼠推奶酪速度降低16%。'}
    ]
  }
};

// Generate cards with faction ID and image URLs applied in bulk
export const catCardsWithImages = Object.fromEntries(
  Object.entries(catCards).map(([cardId, card]) => [
    cardId,
    {
      ...card,
      factionId: 'cat' as const, // Apply faction ID in bulk
      imageUrl: getCatCardImageUrl(card.rank, card.id)
    }
  ])
);
