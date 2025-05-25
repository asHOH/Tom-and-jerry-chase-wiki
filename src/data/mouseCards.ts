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
    description: '瞬间传送到安全区域',
    detailedDescription: '立即传送到最近的老鼠洞，并获得短暂的无敌时间',
    levels: [
      {
        level: 1,
        description: '传送到最近老鼠洞，获得2秒无敌',
        detailedDescription: '瞬间传送到最近的老鼠洞，获得2秒无敌时间，冷却60秒'
      },
      {
        level: 2,
        description: '传送到最近老鼠洞，获得2.5秒无敌',
        detailedDescription: '瞬间传送到最近的老鼠洞，获得2.5秒无敌时间，冷却50秒'
      },
      {
        level: 3,
        description: '传送到最近老鼠洞，获得3秒无敌',
        detailedDescription: '瞬间传送到最近的老鼠洞，获得3秒无敌时间，冷却40秒'
      }
    ]
  },

  '护佑': {
    id: '护佑',
    rank: 'S',
    cost: 6,
    description: '为队友提供强力保护',
    detailedDescription: '为附近的队友提供伤害减免和控制免疫效果',
    levels: [
      {
        level: 1,
        description: '附近队友受到伤害减少30%，持续8秒',
        detailedDescription: '300范围内的队友受到伤害减少30%，免疫控制效果，持续8秒'
      },
      {
        level: 2,
        description: '附近队友受到伤害减少35%，持续10秒',
        detailedDescription: '350范围内的队友受到伤害减少35%，免疫控制效果，持续10秒'
      },
      {
        level: 3,
        description: '附近队友受到伤害减少40%，持续12秒',
        detailedDescription: '400范围内的队友受到伤害减少40%，免疫控制效果，持续12秒'
      }
    ]
  },

  '无畏': {
    id: '无畏',

    rank: 'S',
    cost: 6,
    description: '免疫恐惧和控制效果',
    detailedDescription: '获得对所有负面状态的免疫，并且移动速度大幅提升',
    levels: [
      {
        level: 1,
        description: '免疫所有控制效果，移速提升40%，持续6秒',
        detailedDescription: '免疫眩晕、减速、恐惧等所有控制效果，移动速度提升40%，持续6秒'
      },
      {
        level: 2,
        description: '免疫所有控制效果，移速提升45%，持续8秒',
        detailedDescription: '免疫眩晕、减速、恐惧等所有控制效果，移动速度提升45%，持续8秒'
      },
      {
        level: 3,
        description: '免疫所有控制效果，移速提升50%，持续10秒',
        detailedDescription: '免疫眩晕、减速、恐惧等所有控制效果，移动速度提升50%，持续10秒'
      }
    ]
  },

  '有难同当': {
    id: '有难同当',

    rank: 'S',
    cost: 5,
    description: '分担队友受到的伤害',
    detailedDescription: '当队友受到伤害时，你会承担一部分伤害，但总伤害会减少',
    levels: [
      {
        level: 1,
        description: '承担队友30%伤害，总伤害减少20%',
        detailedDescription: '当附近队友受到伤害时，你承担30%伤害，但总伤害减少20%'
      },
      {
        level: 2,
        description: '承担队友35%伤害，总伤害减少25%',
        detailedDescription: '当附近队友受到伤害时，你承担35%伤害，但总伤害减少25%'
      },
      {
        level: 3,
        description: '承担队友40%伤害，总伤害减少30%',
        detailedDescription: '当附近队友受到伤害时，你承担40%伤害，但总伤害减少30%'
      }
    ]
  },

  '缴械': {
    id: '缴械',

    rank: 'S',
    cost: 6,
    description: '使猫无法使用道具',
    detailedDescription: '对猫施加缴械效果，使其无法使用道具和部分技能',
    levels: [
      {
        level: 1,
        description: '使猫无法使用道具3秒',
        detailedDescription: '对目标猫施加缴械效果，无法使用道具和武器技能，持续3秒'
      },
      {
        level: 2,
        description: '使猫无法使用道具4秒',
        detailedDescription: '对目标猫施加缴械效果，无法使用道具和武器技能，持续4秒'
      },
      {
        level: 3,
        description: '使猫无法使用道具5秒',
        detailedDescription: '对目标猫施加缴械效果，无法使用道具和武器技能，持续5秒'
      }
    ]
  },

  '舍己': {
    id: '舍己',

    rank: 'S',
    cost: 5,
    description: '牺牲自己拯救队友',
    detailedDescription: '消耗自己的生命值来治疗和保护队友',
    levels: [
      {
        level: 1,
        description: '消耗50%生命值，队友回复满血并获得5秒无敌',
        detailedDescription: '消耗自己50%当前生命值，使所有队友回复满血并获得5秒无敌时间'
      },
      {
        level: 2,
        description: '消耗40%生命值，队友回复满血并获得6秒无敌',
        detailedDescription: '消耗自己40%当前生命值，使所有队友回复满血并获得6秒无敌时间'
      },
      {
        level: 3,
        description: '消耗30%生命值，队友回复满血并获得7秒无敌',
        detailedDescription: '消耗自己30%当前生命值，使所有队友回复满血并获得7秒无敌时间'
      }
    ]
  },

  '铁血': {
    id: '铁血',

    rank: 'S',
    cost: 6,
    description: '生命值越低战斗力越强',
    detailedDescription: '当生命值较低时，获得移动速度、攻击力和防御力的大幅提升',
    levels: [
      {
        level: 1,
        description: '生命值低于30%时，全属性提升50%',
        detailedDescription: '当生命值低于30%时，移动速度、攻击力、防御力全部提升50%'
      },
      {
        level: 2,
        description: '生命值低于40%时，全属性提升60%',
        detailedDescription: '当生命值低于40%时，移动速度、攻击力、防御力全部提升60%'
      },
      {
        level: 3,
        description: '生命值低于50%时，全属性提升70%',
        detailedDescription: '当生命值低于50%时，移动速度、攻击力、防御力全部提升70%'
      }
    ]
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  '冲冠一怒': {
    id: '冲冠一怒',

    rank: 'A',
    cost: 4,
    description: '队友被击败后获得强力增益',
    detailedDescription: '当有队友被击败时，获得移动速度和攻击力的大幅提升',
    levels: [
      {
        level: 1,
        description: '队友被击败后移速和攻击力提升40%，持续15秒',
        detailedDescription: '每当有队友被击败时，移动速度和攻击力提升40%，持续15秒'
      },
      {
        level: 2,
        description: '队友被击败后移速和攻击力提升45%，持续18秒',
        detailedDescription: '每当有队友被击败时，移动速度和攻击力提升45%，持续18秒'
      },
      {
        level: 3,
        description: '队友被击败后移速和攻击力提升50%，持续20秒',
        detailedDescription: '每当有队友被击败时，移动速度和攻击力提升50%，持续20秒'
      }
    ]
  },

  '团队领袖': {
    id: '团队领袖',

    rank: 'A',
    cost: 5,
    description: '为附近队友提供属性加成',
    detailedDescription: '被动为一定范围内的队友提供移动速度和生命恢复加成',
    levels: [
      {
        level: 1,
        description: '附近队友移速提升15%，生命恢复提升50%',
        detailedDescription: '300范围内的队友移动速度提升15%，生命恢复速度提升50%'
      },
      {
        level: 2,
        description: '附近队友移速提升18%，生命恢复提升60%',
        detailedDescription: '350范围内的队友移动速度提升18%，生命恢复速度提升60%'
      },
      {
        level: 3,
        description: '附近队友移速提升20%，生命恢复提升70%',
        detailedDescription: '400范围内的队友移动速度提升20%，生命恢复速度提升70%'
      }
    ]
  },

  '投手': {
    id: '投手',

    rank: 'A',
    cost: 4,
    description: '投掷道具的效果增强',
    detailedDescription: '投掷道具时造成更多伤害，并且有概率造成额外效果',
    levels: [
      {
        level: 1,
        description: '投掷伤害提升30%，20%概率造成眩晕',
        detailedDescription: '投掷道具伤害提升30%，20%概率对猫造成1秒眩晕'
      },
      {
        level: 2,
        description: '投掷伤害提升35%，25%概率造成眩晕',
        detailedDescription: '投掷道具伤害提升35%，25%概率对猫造成1.2秒眩晕'
      },
      {
        level: 3,
        description: '投掷伤害提升40%，30%概率造成眩晕',
        detailedDescription: '投掷道具伤害提升40%，30%概率对猫造成1.5秒眩晕'
      }
    ]
  },

  '泡泡浴': {
    id: '泡泡浴',

    rank: 'A',
    cost: 4,
    description: '清除负面状态并获得保护',
    detailedDescription: '立即清除所有负面状态并获得短暂的状态免疫',
    levels: [
      {
        level: 1,
        description: '清除负面状态，获得3秒状态免疫',
        detailedDescription: '立即清除所有负面状态，获得3秒内免疫新的负面状态'
      },
      {
        level: 2,
        description: '清除负面状态，获得4秒状态免疫',
        detailedDescription: '立即清除所有负面状态，获得4秒内免疫新的负面状态'
      },
      {
        level: 3,
        description: '清除负面状态，获得5秒状态免疫',
        detailedDescription: '立即清除所有负面状态，获得5秒内免疫新的负面状态'
      }
    ]
  },

  '祝愿': {
    id: '祝愿',

    rank: 'A',
    cost: 4,
    description: '为队友提供持续治疗',
    detailedDescription: '为附近队友提供持续的生命恢复效果',
    levels: [
      {
        level: 1,
        description: '附近队友每秒恢复3点生命值，持续10秒',
        detailedDescription: '300范围内的队友每秒恢复3点生命值，持续10秒'
      },
      {
        level: 2,
        description: '附近队友每秒恢复4点生命值，持续12秒',
        detailedDescription: '350范围内的队友每秒恢复4点生命值，持续12秒'
      },
      {
        level: 3,
        description: '附近队友每秒恢复5点生命值，持续15秒',
        detailedDescription: '400范围内的队友每秒恢复5点生命值，持续15秒'
      }
    ]
  },

  '翩若惊鸿': {
    id: '翩若惊鸿',

    rank: 'A',
    cost: 4,
    description: '大幅提升移动速度和跳跃能力',
    detailedDescription: '获得极高的移动速度和跳跃高度提升',
    levels: [
      {
        level: 1,
        description: '移动速度提升35%，跳跃高度提升30%，持续8秒',
        detailedDescription: '移动速度提升35%，跳跃高度提升30%，持续8秒'
      },
      {
        level: 2,
        description: '移动速度提升40%，跳跃高度提升35%，持续10秒',
        detailedDescription: '移动速度提升40%，跳跃高度提升35%，持续10秒'
      },
      {
        level: 3,
        description: '移动速度提升45%，跳跃高度提升40%，持续12秒',
        detailedDescription: '移动速度提升45%，跳跃高度提升40%，持续12秒'
      }
    ]
  },

  '逃窜': {
    id: '逃窜',

    rank: 'A',
    cost: 4,
    description: '受到攻击后获得爆发性移速',
    detailedDescription: '受到伤害时立即获得极高的移动速度提升',
    levels: [
      {
        level: 1,
        description: '受伤后移速提升60%，持续4秒',
        detailedDescription: '受到伤害后立即获得60%移动速度提升，持续4秒'
      },
      {
        level: 2,
        description: '受伤后移速提升70%，持续5秒',
        detailedDescription: '受到伤害后立即获得70%移动速度提升，持续5秒'
      },
      {
        level: 3,
        description: '受伤后移速提升80%，持续6秒',
        detailedDescription: '受到伤害后立即获得80%移动速度提升，持续6秒'
      }
    ]
  },

  '闭门羹': {
    id: '闭门羹',

    rank: 'A',
    cost: 4,
    description: '阻挡猫的追击路径',
    detailedDescription: '在身后创造临时障碍物，阻挡猫的前进',
    levels: [
      {
        level: 1,
        description: '创造障碍物，持续6秒',
        detailedDescription: '在身后创造一个障碍物，阻挡猫的前进，持续6秒'
      },
      {
        level: 2,
        description: '创造障碍物，持续8秒',
        detailedDescription: '在身后创造一个障碍物，阻挡猫的前进，持续8秒'
      },
      {
        level: 3,
        description: '创造障碍物，持续10秒',
        detailedDescription: '在身后创造一个障碍物，阻挡猫的前进，持续10秒'
      }
    ]
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  '夹不住我': {
    id: '夹不住我',

    rank: 'B',
    cost: 3,
    description: '对陷阱和控制效果有抗性',
    detailedDescription: '减少被捕鼠夹等陷阱控制的时间',
    levels: [
      {
        level: 1,
        description: '陷阱控制时间减少40%',
        detailedDescription: '被捕鼠夹等陷阱控制的时间减少40%'
      },
      {
        level: 2,
        description: '陷阱控制时间减少50%',
        detailedDescription: '被捕鼠夹等陷阱控制的时间减少50%'
      },
      {
        level: 3,
        description: '陷阱控制时间减少60%',
        detailedDescription: '被捕鼠夹等陷阱控制的时间减少60%'
      }
    ]
  },

  '孤军奋战': {
    id: '孤军奋战',

    rank: 'B',
    cost: 3,
    description: '独自行动时获得增益',
    detailedDescription: '当附近没有队友时获得各项属性提升',
    levels: [
      {
        level: 1,
        description: '独自时移速和攻击力提升20%',
        detailedDescription: '附近500范围内没有队友时，移速和攻击力提升20%'
      },
      {
        level: 2,
        description: '独自时移速和攻击力提升25%',
        detailedDescription: '附近500范围内没有队友时，移速和攻击力提升25%'
      },
      {
        level: 3,
        description: '独自时移速和攻击力提升30%',
        detailedDescription: '附近500范围内没有队友时，移速和攻击力提升30%'
      }
    ]
  },

  '幸运': {
    id: '幸运',

    rank: 'B',
    cost: 5,
    description: '有概率避免致命伤害',
    detailedDescription: '受到致命伤害时有一定概率保留1点生命值',
    levels: [
      {
        level: 1,
        description: '15%概率避免致命伤害',
        detailedDescription: '受到致命伤害时15%概率保留1点生命值，每局限制1次'
      },
      {
        level: 2,
        description: '20%概率避免致命伤害',
        detailedDescription: '受到致命伤害时20%概率保留1点生命值，每局限制1次'
      },
      {
        level: 3,
        description: '25%概率避免致命伤害',
        detailedDescription: '受到致命伤害时25%概率保留1点生命值，每局限制1次'
      }
    ]
  },

  '应激反应': {
    id: '应激反应',

    rank: 'B',
    cost: 4,
    description: '生命值较低时获得增益',
    detailedDescription: '当生命值较低时获得移动速度和反应能力提升',
    levels: [
      {
        level: 1,
        description: '生命值低于40%时移速提升25%',
        detailedDescription: '当生命值低于40%时，移动速度提升25%，跳跃高度提升20%'
      },
      {
        level: 2,
        description: '生命值低于45%时移速提升30%',
        detailedDescription: '当生命值低于45%时，移动速度提升30%，跳跃高度提升25%'
      },
      {
        level: 3,
        description: '生命值低于50%时移速提升35%',
        detailedDescription: '当生命值低于50%时，移动速度提升35%，跳跃高度提升30%'
      }
    ]
  },

  '求生欲': {
    id: '求生欲',

    rank: 'B',
    cost: 4,
    description: '被抓住时更容易挣脱',
    detailedDescription: '被猫抓住时挣脱速度更快，挣脱成功率更高',
    levels: [
      {
        level: 1,
        description: '挣脱速度提升30%，成功率提升20%',
        detailedDescription: '被抓住时挣脱速度提升30%，挣脱成功率提升20%'
      },
      {
        level: 2,
        description: '挣脱速度提升35%，成功率提升25%',
        detailedDescription: '被抓住时挣脱速度提升35%，挣脱成功率提升25%'
      },
      {
        level: 3,
        description: '挣脱速度提升40%，成功率提升30%',
        detailedDescription: '被抓住时挣脱速度提升40%，挣脱成功率提升30%'
      }
    ]
  },

  '破墙': {
    id: '破墙',

    rank: 'B',
    cost: 5,
    description: '提升破坏墙缝的效率',
    detailedDescription: '破坏墙缝的速度更快，造成的伤害更高',
    levels: [
      {
        level: 1,
        description: '破墙速度提升25%，伤害提升20%',
        detailedDescription: '破坏墙缝的速度提升25%，对墙缝造成的伤害提升20%'
      },
      {
        level: 2,
        description: '破墙速度提升30%，伤害提升25%',
        detailedDescription: '破坏墙缝的速度提升30%，对墙缝造成的伤害提升25%'
      },
      {
        level: 3,
        description: '破墙速度提升35%，伤害提升30%',
        detailedDescription: '破坏墙缝的速度提升35%，对墙缝造成的伤害提升30%'
      }
    ]
  },

  '精准投射': {
    id: '精准投射',

    rank: 'B',
    cost: 4,
    description: '提升投掷道具的准确性',
    detailedDescription: '投掷道具时准确性更高，飞行速度更快',
    levels: [
      {
        level: 1,
        description: '投掷准确性提升30%，飞行速度提升20%',
        detailedDescription: '投掷道具的准确性提升30%，飞行速度提升20%'
      },
      {
        level: 2,
        description: '投掷准确性提升35%，飞行速度提升25%',
        detailedDescription: '投掷道具的准确性提升35%，飞行速度提升25%'
      },
      {
        level: 3,
        description: '投掷准确性提升40%，飞行速度提升30%',
        detailedDescription: '投掷道具的准确性提升40%，飞行速度提升30%'
      }
    ]
  },

  '绝地反击': {
    id: '绝地反击',

    rank: 'B',
    cost: 3,
    description: '队友被击败时获得强化',
    detailedDescription: '当有队友被击败时，获得攻击力和移动速度提升',
    levels: [
      {
        level: 1,
        description: '队友被击败后攻击力和移速提升30%，持续10秒',
        detailedDescription: '每当有队友被击败时，攻击力和移动速度提升30%，持续10秒'
      },
      {
        level: 2,
        description: '队友被击败后攻击力和移速提升35%，持续12秒',
        detailedDescription: '每当有队友被击败时，攻击力和移动速度提升35%，持续12秒'
      },
      {
        level: 3,
        description: '队友被击败后攻击力和移速提升40%，持续15秒',
        detailedDescription: '每当有队友被击败时，攻击力和移动速度提升40%，持续15秒'
      }
    ]
  },

  '追风': {
    id: '追风',

    rank: 'B',
    cost: 4,
    description: '连续移动时速度递增',
    detailedDescription: '持续移动时移动速度会逐渐提升',
    levels: [
      {
        level: 1,
        description: '连续移动3秒后移速提升20%',
        detailedDescription: '连续移动3秒后，移动速度提升20%，最多叠加2层'
      },
      {
        level: 2,
        description: '连续移动2.5秒后移速提升25%',
        detailedDescription: '连续移动2.5秒后，移动速度提升25%，最多叠加2层'
      },
      {
        level: 3,
        description: '连续移动2秒后移速提升30%',
        detailedDescription: '连续移动2秒后，移动速度提升30%，最多叠加2层'
      }
    ]
  },

  '逃之夭夭': {
    id: '逃之夭夭',

    rank: 'B',
    cost: 4,
    description: '脱离战斗后快速恢复',
    detailedDescription: '脱离猫的视线后快速恢复生命值',
    levels: [
      {
        level: 1,
        description: '脱离战斗3秒后每秒恢复5%生命值',
        detailedDescription: '脱离猫的视线3秒后，每秒恢复5%最大生命值'
      },
      {
        level: 2,
        description: '脱离战斗2.5秒后每秒恢复6%生命值',
        detailedDescription: '脱离猫的视线2.5秒后，每秒恢复6%最大生命值'
      },
      {
        level: 3,
        description: '脱离战斗2秒后每秒恢复7%生命值',
        detailedDescription: '脱离猫的视线2秒后，每秒恢复7%最大生命值'
      }
    ]
  },

  '速推': {
    id: '速推',

    rank: 'B',
    cost: 5,
    description: '提升推奶酪的速度',
    detailedDescription: '推奶酪时速度更快，受到的阻碍更少',
    levels: [
      {
        level: 1,
        description: '推奶酪速度提升25%',
        detailedDescription: '推奶酪的速度提升25%，推奶酪时移速损失减少20%'
      },
      {
        level: 2,
        description: '推奶酪速度提升30%',
        detailedDescription: '推奶酪的速度提升30%，推奶酪时移速损失减少25%'
      },
      {
        level: 3,
        description: '推奶酪速度提升35%',
        detailedDescription: '推奶酪的速度提升35%，推奶酪时移速损失减少30%'
      }
    ]
  },

  '飞跃': {
    id: '飞跃',

    rank: 'B',
    cost: 4,
    description: '大幅提升跳跃能力',
    detailedDescription: '跳跃高度和距离都会大幅提升',
    levels: [
      {
        level: 1,
        description: '跳跃高度和距离提升30%',
        detailedDescription: '跳跃高度和跳跃距离都提升30%'
      },
      {
        level: 2,
        description: '跳跃高度和距离提升35%',
        detailedDescription: '跳跃高度和跳跃距离都提升35%'
      },
      {
        level: 3,
        description: '跳跃高度和距离提升40%',
        detailedDescription: '跳跃高度和跳跃距离都提升40%'
      }
    ]
  },

  '食物力量': {
    id: '食物力量',

    rank: 'B',
    cost: 3,
    description: '食用食物时获得额外效果',
    detailedDescription: '食用食物时不仅恢复生命值，还会获得临时增益',
    levels: [
      {
        level: 1,
        description: '食用食物后额外获得5秒移速提升20%',
        detailedDescription: '食用食物后除了恢复生命值，还获得5秒移动速度提升20%'
      },
      {
        level: 2,
        description: '食用食物后额外获得6秒移速提升25%',
        detailedDescription: '食用食物后除了恢复生命值，还获得6秒移动速度提升25%'
      },
      {
        level: 3,
        description: '食用食物后额外获得7秒移速提升30%',
        detailedDescription: '食用食物后除了恢复生命值，还获得7秒移动速度提升30%'
      }
    ]
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  '不屈': {
    id: '不屈',

    rank: 'C',
    cost: 3,
    description: '减少受到的控制效果时间',
    detailedDescription: '对眩晕、减速等控制效果有一定抗性',
    levels: [
      {
        level: 1,
        description: '控制效果时间减少20%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少20%'
      },
      {
        level: 2,
        description: '控制效果时间减少25%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少25%'
      },
      {
        level: 3,
        description: '控制效果时间减少30%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少30%'
      }
    ]
  },

  '吃货': {
    id: '吃货',

    rank: 'C',
    cost: 3,
    description: '食用食物的效果增强',
    detailedDescription: '食用食物时恢复更多生命值',
    levels: [
      {
        level: 1,
        description: '食物恢复效果提升30%',
        detailedDescription: '食用食物时恢复的生命值提升30%'
      },
      {
        level: 2,
        description: '食物恢复效果提升35%',
        detailedDescription: '食用食物时恢复的生命值提升35%'
      },
      {
        level: 3,
        description: '食物恢复效果提升40%',
        detailedDescription: '食用食物时恢复的生命值提升40%'
      }
    ]
  },

  '强健': {
    id: '强健',

    rank: 'C',
    cost: 4,
    description: '提升最大生命值',
    detailedDescription: '增加生命值上限，提升生存能力',
    levels: [
      {
        level: 1,
        description: '最大生命值提升15%',
        detailedDescription: '最大生命值提升15%'
      },
      {
        level: 2,
        description: '最大生命值提升18%',
        detailedDescription: '最大生命值提升18%'
      },
      {
        level: 3,
        description: '最大生命值提升20%',
        detailedDescription: '最大生命值提升20%'
      }
    ]
  },

  '救救我': {
    id: '救救我',

    rank: 'C',
    cost: 3,
    description: '被击败时队友获得增益',
    detailedDescription: '被击败时为附近队友提供短暂的能力提升',
    levels: [
      {
        level: 1,
        description: '被击败时附近队友移速提升25%，持续5秒',
        detailedDescription: '被击败时300范围内的队友移动速度提升25%，持续5秒'
      },
      {
        level: 2,
        description: '被击败时附近队友移速提升30%，持续6秒',
        detailedDescription: '被击败时350范围内的队友移动速度提升30%，持续6秒'
      },
      {
        level: 3,
        description: '被击败时附近队友移速提升35%，持续7秒',
        detailedDescription: '被击败时400范围内的队友移动速度提升35%，持续7秒'
      }
    ]
  },

  '相助': {
    id: '相助',

    rank: 'C',
    cost: 4,
    description: '救援队友的效率提升',
    detailedDescription: '救援被击败队友的速度更快',
    levels: [
      {
        level: 1,
        description: '救援速度提升30%',
        detailedDescription: '救援被击败队友的速度提升30%'
      },
      {
        level: 2,
        description: '救援速度提升35%',
        detailedDescription: '救援被击败队友的速度提升35%'
      },
      {
        level: 3,
        description: '救援速度提升40%',
        detailedDescription: '救援被击败队友的速度提升40%'
      }
    ]
  },

  '美食家': {
    id: '美食家',

    rank: 'C',
    cost: 3,
    description: '食用食物的速度更快',
    detailedDescription: '食用食物时动作更快，不容易被打断',
    levels: [
      {
        level: 1,
        description: '食用食物速度提升40%',
        detailedDescription: '食用食物的动作速度提升40%'
      },
      {
        level: 2,
        description: '食用食物速度提升50%',
        detailedDescription: '食用食物的动作速度提升50%'
      },
      {
        level: 3,
        description: '食用食物速度提升60%',
        detailedDescription: '食用食物的动作速度提升60%'
      }
    ]
  },

  '脱身': {
    id: '脱身',

    rank: 'C',
    cost: 3,
    description: '受到攻击后短暂提升移速',
    detailedDescription: '受到伤害时获得短暂的移动速度提升',
    levels: [
      {
        level: 1,
        description: '受伤后移速提升30%，持续2秒',
        detailedDescription: '受到伤害后移动速度提升30%，持续2秒'
      },
      {
        level: 2,
        description: '受伤后移速提升35%，持续2.5秒',
        detailedDescription: '受到伤害后移动速度提升35%，持续2.5秒'
      },
      {
        level: 3,
        description: '受伤后移速提升40%，持续3秒',
        detailedDescription: '受到伤害后移动速度提升40%，持续3秒'
      }
    ]
  },

  '门卫': {
    id: '门卫',

    rank: 'C',
    cost: 3,
    description: '在老鼠洞附近时获得增益',
    detailedDescription: '靠近老鼠洞时获得防御和恢复能力提升',
    levels: [
      {
        level: 1,
        description: '老鼠洞附近受到伤害减少20%，生命恢复提升50%',
        detailedDescription: '在老鼠洞300范围内时，受到伤害减少20%，生命恢复速度提升50%'
      },
      {
        level: 2,
        description: '老鼠洞附近受到伤害减少25%，生命恢复提升60%',
        detailedDescription: '在老鼠洞350范围内时，受到伤害减少25%，生命恢复速度提升60%'
      },
      {
        level: 3,
        description: '老鼠洞附近受到伤害减少30%，生命恢复提升70%',
        detailedDescription: '在老鼠洞400范围内时，受到伤害减少30%，生命恢复速度提升70%'
      }
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
