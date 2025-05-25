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
    description: '击败老鼠后获得强力增益效果',
    detailedDescription: '击败老鼠后，获得移动速度和攻击力大幅提升，持续一段时间',
    levels: [
      {
        level: 1,
        description: '击败老鼠后移速提升30%，持续8秒',
        detailedDescription: '击败老鼠后移动速度提升30%，攻击力提升15%，持续8秒'
      },
      {
        level: 2,
        description: '击败老鼠后移速提升35%，持续10秒',
        detailedDescription: '击败老鼠后移动速度提升35%，攻击力提升20%，持续10秒'
      },
      {
        level: 3,
        description: '击败老鼠后移速提升40%，持续12秒',
        detailedDescription: '击败老鼠后移动速度提升40%，攻击力提升25%，持续12秒'
      }
    ]
  },

  '乾坤一掷': {
    id: '乾坤一掷',
    rank: 'S',
    cost: 6,
    description: '投掷道具造成额外伤害和控制效果',
    detailedDescription: '投掷道具时造成范围伤害，并对命中的老鼠施加减速效果',
    levels: [
      {
        level: 1,
        description: '投掷道具伤害提升50%，减速3秒',
        detailedDescription: '投掷道具伤害提升50%，命中老鼠减速30%持续3秒'
      },
      {
        level: 2,
        description: '投掷道具伤害提升60%，减速4秒',
        detailedDescription: '投掷道具伤害提升60%，命中老鼠减速35%持续4秒'
      },
      {
        level: 3,
        description: '投掷道具伤害提升70%，减速5秒',
        detailedDescription: '投掷道具伤害提升70%，命中老鼠减速40%持续5秒'
      }
    ]
  },

  '击晕': {
    id: '击晕',
    rank: 'S',
    cost: 7,
    description: '攻击有概率造成眩晕效果',
    detailedDescription: '普通攻击和技能攻击都有一定概率使老鼠眩晕',
    levels: [
      {
        level: 1,
        description: '攻击有15%概率眩晕1.5秒',
        detailedDescription: '普通攻击和技能攻击有15%概率使老鼠眩晕1.5秒'
      },
      {
        level: 2,
        description: '攻击有18%概率眩晕1.8秒',
        detailedDescription: '普通攻击和技能攻击有18%概率使老鼠眩晕1.8秒'
      },
      {
        level: 3,
        description: '攻击有20%概率眩晕2秒',
        detailedDescription: '普通攻击和技能攻击有20%概率使老鼠眩晕2秒'
      }
    ]
  },

  '屈打成招': {
    id: '屈打成招',
    rank: 'S',
    cost: 6,
    description: '携带老鼠时获得额外能力',
    detailedDescription: '携带老鼠时移动速度不减少，并且可以使用技能',
    levels: [
      {
        level: 1,
        description: '携带老鼠时移速不减少',
        detailedDescription: '携带老鼠时移动速度不减少，可以正常使用主动技能'
      },
      {
        level: 2,
        description: '携带老鼠时移速不减少，技能CD减少10%',
        detailedDescription: '携带老鼠时移动速度不减少，可以正常使用主动技能，技能冷却时间减少10%'
      },
      {
        level: 3,
        description: '携带老鼠时移速不减少，技能CD减少15%',
        detailedDescription: '携带老鼠时移动速度不减少，可以正常使用主动技能，技能冷却时间减少15%'
      }
    ]
  },

  '暴怒': {
    id: '暴怒',
    rank: 'S',
    cost: 6,
    description: '生命值较低时获得强力增益',
    detailedDescription: '当生命值低于一定比例时，获得攻击力和移动速度大幅提升',
    levels: [
      {
        level: 1,
        description: '生命值低于40%时攻击力和移速提升25%',
        detailedDescription: '当生命值低于40%时，攻击力和移动速度提升25%'
      },
      {
        level: 2,
        description: '生命值低于45%时攻击力和移速提升30%',
        detailedDescription: '当生命值低于45%时，攻击力和移动速度提升30%'
      },
      {
        level: 3,
        description: '生命值低于50%时攻击力和移速提升35%',
        detailedDescription: '当生命值低于50%时，攻击力和移动速度提升35%'
      }
    ]
  },

  '猛攻': {
    id: '猛攻',

    rank: 'S',
    cost: 5,
    description: '连续攻击同一目标时伤害递增',
    detailedDescription: '连续攻击同一老鼠时，每次攻击伤害都会递增',
    levels: [
      {
        level: 1,
        description: '连续攻击同一目标，每次伤害递增10%，最多叠加3层',
        detailedDescription: '连续攻击同一老鼠时，每次攻击伤害递增10%，最多叠加3层，持续5秒'
      },
      {
        level: 2,
        description: '连续攻击同一目标，每次伤害递增12%，最多叠加4层',
        detailedDescription: '连续攻击同一老鼠时，每次攻击伤害递增12%，最多叠加4层，持续6秒'
      },
      {
        level: 3,
        description: '连续攻击同一目标，每次伤害递增15%，最多叠加5层',
        detailedDescription: '连续攻击同一老鼠时，每次攻击伤害递增15%，最多叠加5层，持续7秒'
      }
    ]
  },

  '知识渊博': {
    id: '知识渊博',

    rank: 'S',
    cost: 6,
    description: '技能冷却时间大幅减少',
    detailedDescription: '所有技能的冷却时间都会大幅减少，让你能更频繁地使用技能',
    levels: [
      {
        level: 1,
        description: '所有技能冷却时间减少20%',
        detailedDescription: '所有主动技能和武器技能的冷却时间减少20%'
      },
      {
        level: 2,
        description: '所有技能冷却时间减少25%',
        detailedDescription: '所有主动技能和武器技能的冷却时间减少25%'
      },
      {
        level: 3,
        description: '所有技能冷却时间减少30%',
        detailedDescription: '所有主动技能和武器技能的冷却时间减少30%'
      }
    ]
  },

  '蓄势一击': {
    id: '蓄势一击',

    rank: 'S',
    cost: 6,
    description: '长时间蓄力后的攻击造成巨额伤害',
    detailedDescription: '蓄力一定时间后，下一次攻击将造成巨额伤害并附带特殊效果',
    levels: [
      {
        level: 1,
        description: '蓄力3秒后下次攻击伤害提升100%',
        detailedDescription: '蓄力3秒后，下一次攻击伤害提升100%并造成1秒眩晕'
      },
      {
        level: 2,
        description: '蓄力2.5秒后下次攻击伤害提升120%',
        detailedDescription: '蓄力2.5秒后，下一次攻击伤害提升120%并造成1.2秒眩晕'
      },
      {
        level: 3,
        description: '蓄力2秒后下次攻击伤害提升150%',
        detailedDescription: '蓄力2秒后，下一次攻击伤害提升150%并造成1.5秒眩晕'
      }
    ]
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  '加大火力': {
    id: '加大火力',

    rank: 'A',
    cost: 4,
    description: '攻击力大幅提升',
    detailedDescription: '永久性提升攻击力，让你的每次攻击都更有威胁',
    levels: [
      {
        level: 1,
        description: '攻击力提升20%',
        detailedDescription: '所有攻击的伤害提升20%'
      },
      {
        level: 2,
        description: '攻击力提升25%',
        detailedDescription: '所有攻击的伤害提升25%'
      },
      {
        level: 3,
        description: '攻击力提升30%',
        detailedDescription: '所有攻击的伤害提升30%'
      }
    ]
  },

  '威压': {
    id: '威压',

    rank: 'A',
    cost: 4,
    description: '降低附近老鼠的移动速度',
    detailedDescription: '被动降低一定范围内老鼠的移动速度和跳跃能力',
    levels: [
      {
        level: 1,
        description: '附近老鼠移速降低15%',
        detailedDescription: '300范围内的老鼠移动速度降低15%，跳跃高度降低10%'
      },
      {
        level: 2,
        description: '附近老鼠移速降低18%',
        detailedDescription: '350范围内的老鼠移动速度降低18%，跳跃高度降低12%'
      },
      {
        level: 3,
        description: '附近老鼠移速降低20%',
        detailedDescription: '400范围内的老鼠移动速度降低20%，跳跃高度降低15%'
      }
    ]
  },

  '心灵手巧': {
    id: '心灵手巧',

    rank: 'A',
    cost: 4,
    description: '使用道具的效果增强',
    detailedDescription: '使用道具时获得额外效果，并且道具使用速度更快',
    levels: [
      {
        level: 1,
        description: '道具效果提升25%，使用速度提升20%',
        detailedDescription: '道具伤害和控制效果提升25%，使用动作速度提升20%'
      },
      {
        level: 2,
        description: '道具效果提升30%，使用速度提升25%',
        detailedDescription: '道具伤害和控制效果提升30%，使用动作速度提升25%'
      },
      {
        level: 3,
        description: '道具效果提升35%，使用速度提升30%',
        detailedDescription: '道具伤害和控制效果提升35%，使用动作速度提升30%'
      }
    ]
  },

  '熊熊燃烧': {
    id: '熊熊燃烧',

    rank: 'A',
    cost: 6,
    description: '攻击附带燃烧效果',
    detailedDescription: '攻击命中老鼠时，会对其施加持续燃烧伤害',
    levels: [
      {
        level: 1,
        description: '攻击附带燃烧，每秒造成5点伤害，持续3秒',
        detailedDescription: '攻击命中老鼠时附带燃烧效果，每秒造成5点伤害，持续3秒'
      },
      {
        level: 2,
        description: '攻击附带燃烧，每秒造成6点伤害，持续4秒',
        detailedDescription: '攻击命中老鼠时附带燃烧效果，每秒造成6点伤害，持续4秒'
      },
      {
        level: 3,
        description: '攻击附带燃烧，每秒造成8点伤害，持续5秒',
        detailedDescription: '攻击命中老鼠时附带燃烧效果，每秒造成8点伤害，持续5秒'
      }
    ]
  },

  '穷追猛打': {
    id: '穷追猛打',

    rank: 'A',
    cost: 4,
    description: '对受伤老鼠造成额外伤害',
    detailedDescription: '对生命值不满的老鼠造成额外伤害，生命值越低伤害越高',
    levels: [
      {
        level: 1,
        description: '对受伤老鼠额外造成15%伤害',
        detailedDescription: '对生命值低于100%的老鼠额外造成15%伤害'
      },
      {
        level: 2,
        description: '对受伤老鼠额外造成20%伤害',
        detailedDescription: '对生命值低于100%的老鼠额外造成20%伤害'
      },
      {
        level: 3,
        description: '对受伤老鼠额外造成25%伤害',
        detailedDescription: '对生命值低于100%的老鼠额外造成25%伤害'
      }
    ]
  },

  '细心': {
    id: '细心',

    rank: 'A',
    cost: 4,
    description: '提升侦查能力和视野范围',
    detailedDescription: '增加视野范围，并且能更容易发现隐藏的老鼠',
    levels: [
      {
        level: 1,
        description: '视野范围提升20%，侦查能力提升',
        detailedDescription: '视野范围提升20%，能更快发现草丛中的老鼠'
      },
      {
        level: 2,
        description: '视野范围提升25%，侦查能力提升',
        detailedDescription: '视野范围提升25%，能更快发现草丛中的老鼠，并显示老鼠足迹'
      },
      {
        level: 3,
        description: '视野范围提升30%，侦查能力提升',
        detailedDescription: '视野范围提升30%，能更快发现草丛中的老鼠，显示老鼠足迹和方向'
      }
    ]
  },

  '越挫越勇': {
    id: '越挫越勇',

    rank: 'A',
    cost: 4,
    description: '受到伤害后获得短暂增益',
    detailedDescription: '每次受到伤害后，获得移动速度和攻击力的短暂提升',
    levels: [
      {
        level: 1,
        description: '受伤后移速和攻击力提升20%，持续3秒',
        detailedDescription: '每次受到伤害后，移动速度和攻击力提升20%，持续3秒'
      },
      {
        level: 2,
        description: '受伤后移速和攻击力提升25%，持续4秒',
        detailedDescription: '每次受到伤害后，移动速度和攻击力提升25%，持续4秒'
      },
      {
        level: 3,
        description: '受伤后移速和攻击力提升30%，持续5秒',
        detailedDescription: '每次受到伤害后，移动速度和攻击力提升30%，持续5秒'
      }
    ]
  },

  '铜墙': {
    id: '铜墙',

    rank: 'A',
    cost: 6,
    description: '大幅提升防御能力',
    detailedDescription: '减少受到的伤害，并且对控制效果有一定抗性',
    levels: [
      {
        level: 1,
        description: '受到伤害减少15%，控制时间减少20%',
        detailedDescription: '受到的所有伤害减少15%，眩晕和减速等控制效果时间减少20%'
      },
      {
        level: 2,
        description: '受到伤害减少18%，控制时间减少25%',
        detailedDescription: '受到的所有伤害减少18%，眩晕和减速等控制效果时间减少25%'
      },
      {
        level: 3,
        description: '受到伤害减少20%，控制时间减少30%',
        detailedDescription: '受到的所有伤害减少20%，眩晕和减速等控制效果时间减少30%'
      }
    ]
  },

  '长爪': {
    id: '长爪',

    rank: 'A',
    cost: 4,
    description: '增加攻击范围',
    detailedDescription: '增加普通攻击和爪刀攻击的范围，让你更容易命中老鼠',
    levels: [
      {
        level: 1,
        description: '攻击范围增加20%',
        detailedDescription: '普通攻击和爪刀攻击的范围增加20%'
      },
      {
        level: 2,
        description: '攻击范围增加25%',
        detailedDescription: '普通攻击和爪刀攻击的范围增加25%'
      },
      {
        level: 3,
        description: '攻击范围增加30%',
        detailedDescription: '普通攻击和爪刀攻击的范围增加30%'
      }
    ]
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  '严防死守': {
    id: '严防死守',

    rank: 'B',
    cost: 4,
    description: '提升防御能力和生命值',
    detailedDescription: '增加最大生命值并减少受到的伤害',
    levels: [
      {
        level: 1,
        description: '最大生命值提升15%，受到伤害减少8%',
        detailedDescription: '最大生命值提升15%，受到的所有伤害减少8%'
      },
      {
        level: 2,
        description: '最大生命值提升18%，受到伤害减少10%',
        detailedDescription: '最大生命值提升18%，受到的所有伤害减少10%'
      },
      {
        level: 3,
        description: '最大生命值提升20%，受到伤害减少12%',
        detailedDescription: '最大生命值提升20%，受到的所有伤害减少12%'
      }
    ]
  },

  '减速警告': {
    id: '减速警告',

    rank: 'B',
    cost: 4,
    description: '攻击附带减速效果',
    detailedDescription: '攻击命中老鼠时会降低其移动速度',
    levels: [
      {
        level: 1,
        description: '攻击使老鼠减速25%，持续2秒',
        detailedDescription: '攻击命中老鼠时使其移动速度降低25%，持续2秒'
      },
      {
        level: 2,
        description: '攻击使老鼠减速30%，持续2.5秒',
        detailedDescription: '攻击命中老鼠时使其移动速度降低30%，持续2.5秒'
      },
      {
        level: 3,
        description: '攻击使老鼠减速35%，持续3秒',
        detailedDescription: '攻击命中老鼠时使其移动速度降低35%，持续3秒'
      }
    ]
  },

  '反侦察': {
    id: '反侦察',

    rank: 'B',
    cost: 3,
    description: '降低被老鼠发现的概率',
    detailedDescription: '减少脚步声和视觉暴露，更难被老鼠察觉',
    levels: [
      {
        level: 1,
        description: '脚步声降低40%，视觉暴露范围减少20%',
        detailedDescription: '脚步声音量降低40%，被老鼠发现的视觉范围减少20%'
      },
      {
        level: 2,
        description: '脚步声降低50%，视觉暴露范围减少25%',
        detailedDescription: '脚步声音量降低50%，被老鼠发现的视觉范围减少25%'
      },
      {
        level: 3,
        description: '脚步声降低60%，视觉暴露范围减少30%',
        detailedDescription: '脚步声音量降低60%，被老鼠发现的视觉范围减少30%'
      }
    ]
  },

  '守株待鼠': {
    id: '守株待鼠',

    rank: 'B',
    cost: 3,
    description: '静止时获得增益效果',
    detailedDescription: '保持静止不动时获得攻击力和侦查能力提升',
    levels: [
      {
        level: 1,
        description: '静止3秒后攻击力提升20%，视野范围提升15%',
        detailedDescription: '保持静止3秒后，攻击力提升20%，视野范围提升15%'
      },
      {
        level: 2,
        description: '静止2.5秒后攻击力提升25%，视野范围提升18%',
        detailedDescription: '保持静止2.5秒后，攻击力提升25%，视野范围提升18%'
      },
      {
        level: 3,
        description: '静止2秒后攻击力提升30%，视野范围提升20%',
        detailedDescription: '保持静止2秒后，攻击力提升30%，视野范围提升20%'
      }
    ]
  },

  '寻踪': {
    id: '寻踪',

    rank: 'B',
    cost: 3,
    description: '能够追踪老鼠的足迹',
    detailedDescription: '显示老鼠留下的足迹痕迹，持续一段时间',
    levels: [
      {
        level: 1,
        description: '显示老鼠足迹，持续8秒',
        detailedDescription: '显示老鼠在地面留下的足迹痕迹，持续8秒'
      },
      {
        level: 2,
        description: '显示老鼠足迹，持续10秒',
        detailedDescription: '显示老鼠在地面留下的足迹痕迹，持续10秒'
      },
      {
        level: 3,
        description: '显示老鼠足迹，持续12秒',
        detailedDescription: '显示老鼠在地面留下的足迹痕迹，持续12秒'
      }
    ]
  },

  '恐吓': {
    id: '恐吓',

    rank: 'B',
    cost: 4,
    description: '降低附近老鼠的战斗能力',
    detailedDescription: '被动降低附近老鼠的攻击力和移动速度',
    levels: [
      {
        level: 1,
        description: '附近老鼠攻击力和移速降低12%',
        detailedDescription: '300范围内的老鼠攻击力和移动速度降低12%'
      },
      {
        level: 2,
        description: '附近老鼠攻击力和移速降低15%',
        detailedDescription: '350范围内的老鼠攻击力和移动速度降低15%'
      },
      {
        level: 3,
        description: '附近老鼠攻击力和移速降低18%',
        detailedDescription: '400范围内的老鼠攻击力和移动速度降低18%'
      }
    ]
  },

  '捕鼠夹': {
    id: '捕鼠夹',

    rank: 'B',
    cost: 3,
    description: '放置陷阱捕捉老鼠',
    detailedDescription: '在地面放置捕鼠夹，踩中的老鼠会被困住并受到伤害',
    levels: [
      {
        level: 1,
        description: '放置捕鼠夹，困住老鼠2秒并造成中等伤害',
        detailedDescription: '放置一个捕鼠夹，踩中的老鼠被困住2秒并受到中等伤害'
      },
      {
        level: 2,
        description: '放置捕鼠夹，困住老鼠2.5秒并造成较高伤害',
        detailedDescription: '放置一个捕鼠夹，踩中的老鼠被困住2.5秒并受到较高伤害'
      },
      {
        level: 3,
        description: '放置捕鼠夹，困住老鼠3秒并造成高伤害',
        detailedDescription: '放置一个捕鼠夹，踩中的老鼠被困住3秒并受到高伤害'
      }
    ]
  },

  '攻其不备': {
    id: '攻其不备',

    rank: 'B',
    cost: 3,
    description: '背后攻击造成额外伤害',
    detailedDescription: '从老鼠背后发起的攻击会造成额外伤害和控制效果',
    levels: [
      {
        level: 1,
        description: '背后攻击额外造成40%伤害',
        detailedDescription: '从老鼠背后发起的攻击额外造成40%伤害并有30%概率造成眩晕'
      },
      {
        level: 2,
        description: '背后攻击额外造成50%伤害',
        detailedDescription: '从老鼠背后发起的攻击额外造成50%伤害并有35%概率造成眩晕'
      },
      {
        level: 3,
        description: '背后攻击额外造成60%伤害',
        detailedDescription: '从老鼠背后发起的攻击额外造成60%伤害并有40%概率造成眩晕'
      }
    ]
  },

  '斗志昂扬': {
    id: '斗志昂扬',

    rank: 'B',
    cost: 3,
    description: '击败老鼠后恢复生命值',
    detailedDescription: '每次击败老鼠后恢复一定生命值并获得短暂增益',
    levels: [
      {
        level: 1,
        description: '击败老鼠后恢复25%生命值',
        detailedDescription: '击败老鼠后恢复25%最大生命值并获得3秒移速提升'
      },
      {
        level: 2,
        description: '击败老鼠后恢复30%生命值',
        detailedDescription: '击败老鼠后恢复30%最大生命值并获得4秒移速提升'
      },
      {
        level: 3,
        description: '击败老鼠后恢复35%生命值',
        detailedDescription: '击败老鼠后恢复35%最大生命值并获得5秒移速提升'
      }
    ]
  },

  '皮糙肉厚': {
    id: '皮糙肉厚',

    rank: 'B',
    cost: 4,
    description: '减少受到的控制效果',
    detailedDescription: '对眩晕、减速等控制效果有抗性',
    levels: [
      {
        level: 1,
        description: '控制效果时间减少30%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少30%'
      },
      {
        level: 2,
        description: '控制效果时间减少35%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少35%'
      },
      {
        level: 3,
        description: '控制效果时间减少40%',
        detailedDescription: '眩晕、减速、恐惧等控制效果时间减少40%'
      }
    ]
  },

  '观察员': {
    id: '观察员',

    rank: 'B',
    cost: 3,
    description: '提升侦查和追踪能力',
    detailedDescription: '增加视野范围并能更快发现隐藏的老鼠',
    levels: [
      {
        level: 1,
        description: '视野范围提升15%，发现隐藏老鼠速度提升30%',
        detailedDescription: '视野范围提升15%，发现草丛中老鼠的速度提升30%'
      },
      {
        level: 2,
        description: '视野范围提升18%，发现隐藏老鼠速度提升40%',
        detailedDescription: '视野范围提升18%，发现草丛中老鼠的速度提升40%'
      },
      {
        level: 3,
        description: '视野范围提升20%，发现隐藏老鼠速度提升50%',
        detailedDescription: '视野范围提升20%，发现草丛中老鼠的速度提升50%'
      }
    ]
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  '巡逻戒备': {
    id: '巡逻戒备',

    rank: 'C',
    cost: 3,
    description: '移动时提升侦查能力',
    detailedDescription: '移动状态下能更容易发现附近的老鼠',
    levels: [
      {
        level: 1,
        description: '移动时侦查范围提升20%',
        detailedDescription: '移动状态下侦查范围提升20%，更容易发现附近老鼠'
      },
      {
        level: 2,
        description: '移动时侦查范围提升25%',
        detailedDescription: '移动状态下侦查范围提升25%，更容易发现附近老鼠'
      },
      {
        level: 3,
        description: '移动时侦查范围提升30%',
        detailedDescription: '移动状态下侦查范围提升30%，更容易发现附近老鼠'
      }
    ]
  },

  '春风得意': {
    id: '春风得意',

    rank: 'C',
    cost: 4,
    description: '连续成功后获得增益',
    detailedDescription: '连续击中老鼠后获得移动速度提升',
    levels: [
      {
        level: 1,
        description: '连续击中2次后移速提升15%，持续5秒',
        detailedDescription: '连续击中老鼠2次后，移动速度提升15%，持续5秒'
      },
      {
        level: 2,
        description: '连续击中2次后移速提升18%，持续6秒',
        detailedDescription: '连续击中老鼠2次后，移动速度提升18%，持续6秒'
      },
      {
        level: 3,
        description: '连续击中2次后移速提升20%，持续7秒',
        detailedDescription: '连续击中老鼠2次后，移动速度提升20%，持续7秒'
      }
    ]
  },

  '气势如牛': {
    id: '气势如牛',

    rank: 'C',
    cost: 3,
    description: '冲刺攻击造成额外伤害',
    detailedDescription: '冲刺状态下的攻击会造成额外伤害',
    levels: [
      {
        level: 1,
        description: '冲刺攻击额外造成25%伤害',
        detailedDescription: '冲刺状态下的攻击额外造成25%伤害'
      },
      {
        level: 2,
        description: '冲刺攻击额外造成30%伤害',
        detailedDescription: '冲刺状态下的攻击额外造成30%伤害'
      },
      {
        level: 3,
        description: '冲刺攻击额外造成35%伤害',
        detailedDescription: '冲刺状态下的攻击额外造成35%伤害'
      }
    ]
  },

  '狡诈': {
    id: '狡诈',

    rank: 'C',
    cost: 2,
    description: '技能冷却时间减少',
    detailedDescription: '所有技能的冷却时间都会减少',
    levels: [
      {
        level: 1,
        description: '技能冷却时间减少10%',
        detailedDescription: '所有主动技能的冷却时间减少10%'
      },
      {
        level: 2,
        description: '技能冷却时间减少12%',
        detailedDescription: '所有主动技能的冷却时间减少12%'
      },
      {
        level: 3,
        description: '技能冷却时间减少15%',
        detailedDescription: '所有主动技能的冷却时间减少15%'
      }
    ]
  },

  '猫是液体': {
    id: '猫是液体',

    rank: 'C',
    cost: 2,
    description: '提升移动灵活性',
    detailedDescription: '增加移动速度并减少转向时的速度损失',
    levels: [
      {
        level: 1,
        description: '移动速度提升8%，转向速度损失减少50%',
        detailedDescription: '移动速度提升8%，转向时的速度损失减少50%'
      },
      {
        level: 2,
        description: '移动速度提升10%，转向速度损失减少60%',
        detailedDescription: '移动速度提升10%，转向时的速度损失减少60%'
      },
      {
        level: 3,
        description: '移动速度提升12%，转向速度损失减少70%',
        detailedDescription: '移动速度提升12%，转向时的速度损失减少70%'
      }
    ]
  },

  '都是朋友': {
    id: '都是朋友',

    rank: 'C',
    cost: 3,
    description: '减少对老鼠造成的恐惧效果',
    detailedDescription: '降低自身的威胁感，老鼠更不容易察觉到危险',
    levels: [
      {
        level: 1,
        description: '老鼠发现你的距离减少15%',
        detailedDescription: '老鼠发现你的距离减少15%，更容易接近老鼠'
      },
      {
        level: 2,
        description: '老鼠发现你的距离减少18%',
        detailedDescription: '老鼠发现你的距离减少18%，更容易接近老鼠'
      },
      {
        level: 3,
        description: '老鼠发现你的距离减少20%',
        detailedDescription: '老鼠发现你的距离减少20%，更容易接近老鼠'
      }
    ]
  },

  '铁手': {
    id: '铁手',

    rank: 'C',
    cost: 4,
    description: '提升抓取和携带能力',
    detailedDescription: '抓取老鼠更容易，携带老鼠时受到的阻碍更少',
    levels: [
      {
        level: 1,
        description: '抓取成功率提升20%，携带时移速损失减少30%',
        detailedDescription: '抓取老鼠的成功率提升20%，携带老鼠时移速损失减少30%'
      },
      {
        level: 2,
        description: '抓取成功率提升25%，携带时移速损失减少35%',
        detailedDescription: '抓取老鼠的成功率提升25%，携带老鼠时移速损失减少35%'
      },
      {
        level: 3,
        description: '抓取成功率提升30%，携带时移速损失减少40%',
        detailedDescription: '抓取老鼠的成功率提升30%，携带老鼠时移速损失减少40%'
      }
    ]
  },

  '震慑': {
    id: '震慑',

    rank: 'C',
    cost: 3,
    description: '出现时对附近老鼠造成短暂影响',
    detailedDescription: '突然出现在老鼠附近时会造成短暂的恐惧效果',
    levels: [
      {
        level: 1,
        description: '出现时附近老鼠移速降低20%，持续2秒',
        detailedDescription: '突然出现在老鼠200范围内时，使其移速降低20%，持续2秒'
      },
      {
        level: 2,
        description: '出现时附近老鼠移速降低25%，持续2.5秒',
        detailedDescription: '突然出现在老鼠250范围内时，使其移速降低25%，持续2.5秒'
      },
      {
        level: 3,
        description: '出现时附近老鼠移速降低30%，持续3秒',
        detailedDescription: '突然出现在老鼠300范围内时，使其移速降低30%，持续3秒'
      }
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
