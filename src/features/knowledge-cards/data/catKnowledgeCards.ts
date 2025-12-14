import { Card } from '@/data/types';

// Generate image URL based on card rank and id for cat faction
const getCatCardImageUrl = (rank: string, id: string): string => {
  return `/images/catCards/${rank}-${id}.png`;
};

export const catKnowledgeCards: Record<string, Card> = {
  /* ----------------------------------- S级卡 ---------------------------------- */
  乘胜追击: {
    id: '乘胜追击',
    rank: 'S',
    cost: 7,
    description:
      '爪刀命中老鼠或使老鼠进入虚弱时，提升2.5%移速和2%爪刀频率，可**叠加**。猫咪进入虚弱状态移除当前一半层数。',
    detailedDescription:
      '爪刀命中非虚弱老鼠或使老鼠进入虚弱时，提升2.5%移速和2%爪刀频率，可**叠加**（每层加成间独立乘算）。猫咪进入虚弱状态移除当前一半层数。（与{苏蕊}+{蓄势一击}有特殊互动关系，详见二者界面）',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '最多叠加**5**层。' },
      { level: 2, description: '最多叠加**6**层。' },
      { level: 3, description: '最多叠加**7**层。' },
    ],
    priority: '提升明显',
  },

  乾坤一掷: {
    id: '乾坤一掷',
    rank: 'S',
    cost: 6,
    description:
      '保持60%Hp以上**一段时间**后进入乾坤一掷状态，提高移速和投掷物伤害。Hp低于60%后移除该状态。',
    detailedDescription:
      '保持60%Hp以上**一段时间**后进入乾坤一掷状态，加速10%，投掷物伤害增加30点。Hp低于60%后移除该状态。“待吾择良辰回首，今朝一掷定乾坤！”',
    levels: [
      { level: 1, description: '保持**20**秒后进入乾坤一掷。' },
      { level: 2, description: '保持**19**秒后进入乾坤一掷。' },
      { level: 3, description: '保持**18**秒后进入乾坤一掷。' },
    ],
    priority: '几乎无提升',
  },

  击晕: {
    id: '击晕',
    rank: 'S',
    cost: 7,
    description: '爪刀对老鼠造成**短暂**的眩晕。',
    detailedDescription: '猫咪掌握了独特的攻击手法，爪刀对老鼠造成伤害后，附加**短暂**的眩晕。',
    levels: [
      { level: 1, description: '击晕**0.8**秒。' },
      { level: 2, description: '击晕**0.9**秒。' },
      { level: 3, description: '击晕**1.0**秒。' },
    ],
    priority: '提升明显',
  },

  屈打成招: {
    id: '屈打成招',
    rank: 'S',
    cost: 6,
    description: '手持老鼠或将老鼠绑在火箭上时，获得**其他老鼠**的小地图位置。',
    detailedDescription:
      '逼问意志不坚定的老鼠，你将得到对方队友的位置信息！手持老鼠或将老鼠绑在火箭上时，获得**其他老鼠**的小地图位置。',
    levels: [
      { level: 1, description: '获得**1只**老鼠的位置。' },
      { level: 2, description: '获得**2只**老鼠的位置。' },
      { level: 3, description: '获得**3只**老鼠的位置。' },
    ],
    priority: '3级质变',
  },

  暴怒: {
    id: '暴怒',
    rank: 'S',
    cost: 6,
    description:
      '墙缝**即将**被破开时，猫咪进入暴怒状态，攻击力增加50，但技能CD延长50%。虚弱起身后也会获得10秒暴怒状态。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '墙缝被破坏**30%**后触发。' },
      { level: 2, description: '墙缝被破坏**25%**后触发。' },
      { level: 3, description: '墙缝被破坏**20%**后触发。' },
    ],
    priority: '几乎无提升',
  },

  知识渊博: {
    id: '知识渊博',
    rank: 'S',
    cost: 6,
    description: '提升初始经验，同时**提升**经验自然增速。',
    detailedDescription:
      '知识渊博的猫咪，天生拥有更多的经验。提升1000初始经验，同时**提升**经验自然增速。',
    levels: [
      { level: 1, description: '提升经验自然增速**40%**。' },
      { level: 2, description: '提升经验自然增速**70%**。' },
      { level: 3, description: '提升经验自然增速**100%**。' },
    ],
    priority: '提升明显',
  },

  蓄势一击: {
    id: '蓄势一击',
    rank: 'S',
    cost: 6,
    description:
      '每隔**一段时间**，获得蓄势一击状态，下次爪刀附带额外伤害。被老鼠眩晕或硬直会移除该状态。虚弱起身或角色升级后立刻获得该状态。',
    detailedDescription:
      '每一次的潜伏，都是为了今后的爆发。每隔**一段时间**，获得蓄势一击状态，下次爪刀附带[额外伤害](视为两段伤害，但若第一段伤害被护盾抵挡则不会造成第二段伤害；伤害类型与爪刀不同，不会触发霜月Lv.3被动等效果，但有一个例外——当苏蕊同时携带蓄势+乘胜，且开启律动时间时，舞动亮相+蓄势一击的效果若同时触发，则会额外叠加一层乘胜追击效果)，[基础伤害为50](会受其他来源的攻击增伤等效果影响，因此在绝大多数情况下伤害与爪刀相同，但对于苏蕊-律动时间等会改变爪刀基础伤害数据的技能，其蓄势基础伤害仍为50)，携带{长爪}时改为[0](且改为不受攻击增伤等效果影响)。被老鼠眩晕或硬直会移除该状态。虚弱起身或角色升级后立刻获得该状态。',
    levels: [
      { level: 1, description: '每隔**14**秒，获得蓄势一击状态。' },
      { level: 2, description: '每隔**13**秒，获得蓄势一击状态。' },
      { level: 3, description: '每隔**12**秒，获得蓄势一击状态。' },
    ],
    priority: '提升较小',
  },

  猛攻: {
    id: '猛攻',
    rank: 'S',
    cost: 5,
    description: '猫咪的爪刀和拍子攻击能**短暂**禁用老鼠的技能和道具，并掉落手中道具。',
    detailedDescription:
      '猫咪的爪刀和拍子攻击能**短暂**禁用老鼠的技能和道具，并掉落手中道具。{图多盖洛}-{魅力甲油}的额外爪刀区域也可以触发该效果。',
    levels: [
      { level: 1, description: '猛攻效果持续**5**秒。' },
      { level: 2, description: '猛攻效果持续**6**秒。' },
      { level: 3, description: '猛攻效果持续**7**秒。' },
    ],
    priority: '提升明显',
  },

  /* ----------------------------------- A级卡 ---------------------------------- */
  加大火力: {
    id: '加大火力',
    rank: 'A',
    cost: 4,
    description:
      '火箭燃烧速度变得**更快**！在绑有老鼠的火箭附近击倒老鼠，会额外减少火箭5秒燃烧时间(CD：20秒)。',
    detailedDescription:
      '点燃火箭吧！火箭燃烧速度变得**更快**！在绑有老鼠的火箭半径1100范围内击倒老鼠，会额外减少火箭5秒燃烧时间(CD：20秒，[火箭上的不同老鼠独立](减燃烧效果生效目标为火箭上的老鼠，生效后20秒内不会对该老鼠重复生效；不同老鼠的CD互相独立))。',
    levels: [
      { level: 1, description: '火箭燃烧速度提升**12%**。' },
      { level: 2, description: '火箭燃烧速度提升**13%**。' },
      { level: 3, description: '火箭燃烧速度提升**14%**。' },
    ],
    priority: '几乎无提升',
  },

  威压: {
    id: '威压',
    rank: 'A',
    cost: 4,
    description: '**减速**附近老鼠，并在使用技能后一段时间内造成更强的减速。',
    detailedDescription:
      '给附近的老鼠带来强大的压迫感，**减速**半径825范围内的老鼠，并在使用技能后5秒内将减速效果提高为18%。',
    levels: [
      { level: 1, description: '附近老鼠减速**6%**。' },
      { level: 2, description: '附近老鼠减速**7%**。' },
      { level: 3, description: '附近老鼠减速**8%**。' },
    ],
    priority: '提升较小',
  },

  心灵手巧: {
    id: '心灵手巧',
    rank: 'A',
    cost: 4,
    description: '布置捕鼠夹、绑火箭、修复火箭时，**提升**交互速度。',
    detailedDescription:
      '那些笨手笨脚的老鼠！心灵手巧的猫咪在布置捕鼠夹、绑火箭、修复火箭时，**提升**交互速度。',
    levels: [
      { level: 1, description: '提升**26%**。' },
      { level: 2, description: '提升**28%**。' },
      { level: 3, description: '提升**30%**。' },
    ],
    priority: '几乎无提升',
  },

  熊熊燃烧: {
    id: '熊熊燃烧',
    rank: 'A',
    cost: 6,
    description: '每次将老鼠绑上火箭后，火箭引信会立刻额外燃烧掉**一截**。',
    detailedDescription: '燃烧我的引信！每次将老鼠绑上火箭后，火箭引信会立刻额外燃烧掉**一截**。',
    levels: [
      { level: 1, description: '引信额外减少**3**秒。' },
      { level: 2, description: '引信额外减少**4**秒。' },
      { level: 3, description: '引信额外减少**5**秒。' },
    ],
    priority: '提升明显',
  },

  穷追猛打: {
    id: '穷追猛打',
    rank: 'A',
    cost: 4,
    description:
      '穷追不舍状态给予猫攻击和速度**强化**效果，该状态在成功将老鼠绑上火箭或累计击倒8次老鼠时移除。',
    detailedDescription:
      '必胜的信念让猫都燃起来了，穷追不舍状态给予猫攻击和速度**强化**效果，该状态在成功将老鼠绑上火箭或累计击倒8次老鼠时移除。“追寻的路上不乏激情，但成功后空虚往往随之而来，火总会熄灭的，捉老鼠如此，猫生亦是如此。”',
    levels: [
      { level: 1, description: '攻击力提升**30**，加速**3.5%**。' },
      { level: 2, description: '攻击力提升**40**，加速**5.5%**。' },
      { level: 3, description: '攻击力提升**50**，加速**8.5%**。' },
    ],
    priority: '3级质变',
  },

  细心: {
    id: '细心',
    rank: 'A',
    cost: 4,
    description: '免疫捕鼠夹和[碎片](踩到碎片仍然会导致碎片消失)，但**小幅**减速。',
    detailedDescription:
      '细心的猫咪能够有效地躲避捕鼠夹和[碎片](踩到碎片仍然会导致碎片消失)，但**小幅**减速。',
    levels: [
      { level: 1, description: '减速**7%**。' },
      { level: 2, description: '减速**6.5%**。' },
      { level: 3, description: '减速**6%**。' },
    ],
    priority: '提升较小',
  },

  越挫越勇: {
    id: '越挫越勇',
    rank: 'A',
    cost: 4,
    description: '每次进入虚弱状态，永久提升Hp上限、Hp恢复速度和移速，可**叠加**。',
    detailedDescription:
      '每次进入虚弱状态，Hp上限永久提升25，Hp恢复速度提升1.5/秒，移速提升1.5%，可**叠加**（每层移速加成间独立乘算，其他加成为加算）。',
    levels: [
      { level: 1, description: '最多叠加**3**层。' },
      { level: 2, description: '最多叠加**4**层。' },
      { level: 3, description: '最多叠加**5**层。' },
    ],
    priority: '几乎无提升',
  },

  铜墙: {
    id: '铜墙',
    rank: 'A',
    cost: 6,
    description: '**提升**墙缝的坚固程度。',
    detailedDescription: '自从猫咪学会了给墙面打补丁，墙缝的坚固程度得到**提升**。',
    levels: [
      { level: 1, description: '墙缝出现时，每只存活老鼠提升**10%**墙缝坚固程度。' },
      { level: 2, description: '墙缝出现时，每只存活老鼠提升**11%**墙缝坚固程度。' },
      { level: 3, description: '墙缝出现时，每只存活老鼠提升**12%**墙缝坚固程度。' },
    ],
    priority: '提升较小',
  },

  长爪: {
    id: '长爪',
    rank: 'A',
    cost: 4,
    description:
      '爪刀范围**大幅**提高，但爪刀伤害固定为25点，不受任何攻击力加成。使用拍子只造成控制而不造成伤害。',
    detailedDescription:
      '爪刀范围**大幅**提高，但爪刀伤害固定为25点，不受任何攻击力加成，也不受[老鼠](包括胖呆呆)的减伤。[二段伤害](如凯特、米特、牛汤被动)仍能正常触发。使用拍子只造成控制而不造成伤害。爪刀范围不受任何[其他加成](拍子、变身药水、技能等)影响。',
    levels: [
      { level: 1, description: '爪刀范围提高**64%**。' },
      { level: 2, description: '爪刀范围提高**73%**。' },
      { level: 3, description: '爪刀范围提高**82%**。' },
    ],
    priority: '提升较小',
  },

  /* ----------------------------------- B级卡 ---------------------------------- */
  严防死守: {
    id: '严防死守',
    rank: 'B',
    cost: 4,
    description: '火箭附近老鼠越多，救援速度越**慢**。',
    levels: [
      { level: 1, description: '每只老鼠降低**11%**救援速度。' },
      { level: 2, description: '每只老鼠降低**18%**救援速度。' },
      { level: 3, description: '每只老鼠降低**25%**救援速度。' },
    ],
    priority: '提升明显',
  },

  减速警告: {
    id: '减速警告',
    rank: 'B',
    cost: 4,
    description: '猫咪的爪刀使老鼠**减速**。',
    detailedDescription: '猫咪的爪刀使老鼠**减速**，老鼠解除受伤时将同时解除减速效果。',
    levels: [
      { level: 1, description: '减速**5%**。' },
      { level: 2, description: '减速**6%**。' },
      { level: 3, description: '减速**7%**。' },
    ],
    priority: '本身无用',
  },

  反侦察: {
    id: '反侦察',
    rank: 'B',
    cost: 3,
    description: '猫咪破坏机器鼠可以获得**更多**经验',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '额外获得**400**经验。' },
      { level: 2, description: '额外获得**500**经验。' },
      { level: 3, description: '额外获得**600**经验。' },
    ],
    priority: '提升明显',
  },

  守株待鼠: {
    id: '守株待鼠',
    rank: 'B',
    cost: 3,
    description: '当老鼠被绑在火箭上时，其他老鼠的投掷伤害**降低**固定值。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '投掷伤害降低**10**。' },
      { level: 2, description: '投掷伤害降低**15**。' },
      { level: 3, description: '投掷伤害降低**20**。' },
    ],
    priority: '提升明显',
  },

  寻踪: {
    id: '寻踪',
    rank: 'B',
    cost: 3,
    description: '猫咪可以从小地图看到虚弱老鼠的位置。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '最多看到**2**只老鼠。' },
      { level: 2, description: '最多看到**3**只老鼠。' },
      { level: 3, description: '最多看到**4**只老鼠。' },
    ],
    priority: '几乎无提升',
  },

  恐吓: {
    id: '恐吓',
    rank: 'B',
    cost: 4,
    description: '爪刀使老鼠在**一段时间**内推速大幅下降。',
    detailedDescription:
      '爪刀对老鼠造成恐吓，使老鼠在**一段时间**内推速下降60%。\n注：由于{全局推奶酪加速}的效果，老鼠会在奶酪期最后1分30秒时免疫恐吓。',
    levels: [
      { level: 1, description: '恐吓效果持续**30**秒。' },
      { level: 2, description: '恐吓效果持续**45**秒。' },
      { level: 3, description: '恐吓效果持续**60**秒。' },
    ],
    priority: '3级质变',
  },

  捕鼠夹: {
    id: '捕鼠夹',
    rank: 'B',
    cost: 3,
    description: '老鼠踩中捕鼠夹时会受到伤害，且**更难**挣脱。',
    detailedDescription: '布置更强力的捕鼠夹，老鼠踩中捕鼠夹时会受到30伤害，且**更难**挣脱。',
    levels: [
      { level: 1, description: '老鼠挣脱捕鼠夹的速度降低**10%**。' },
      { level: 2, description: '老鼠挣脱捕鼠夹的速度降低**15%**。' },
      { level: 3, description: '老鼠挣脱捕鼠夹的速度降低**20%**。' },
    ],
    priority: '提升明显',
  },

  攻其不备: {
    id: '攻其不备',
    rank: 'B',
    cost: 3,
    description: '当老鼠在推奶酪且猫咪附近没有老鼠时，获得**加速**。',
    detailedDescription:
      '当老鼠在推奶酪且猫咪附近900范围内没有老鼠时，猫咪试图快速接近老鼠，获得**加速**。',
    levels: [
      { level: 1, description: '加速**18%**。' },
      { level: 2, description: '加速**19%**。' },
      { level: 3, description: '加速**20%**。' },
    ],
    priority: '几乎无提升',
  },

  斗志昂扬: {
    id: '斗志昂扬',
    rank: 'B',
    cost: 3,
    description: '**减少**爪刀CD。',
    detailedDescription: '信心满满的猫咪，可以**更快捷**地挥爪攻击。',
    levels: [
      { level: 1, description: '爪刀CD减少**5%**。' },
      { level: 2, description: '爪刀CD减少**6%**。' },
      { level: 3, description: '爪刀CD减少**7%**。' },
    ],
    priority: '提升较小',
  },

  皮糙肉厚: {
    id: '皮糙肉厚',
    rank: 'B',
    cost: 4,
    description: '猫咪受到老鼠造成的伤害后，短暂获得**固定减伤**，但至少仍会受到15%伤害。',
    detailedDescription:
      '老鼠虐我千百遍，我待老鼠如初恋！皮糙肉厚的猫咪受到老鼠造成的伤害后，4秒内获得**固定减伤**，但至少仍会受到15%伤害。',
    levels: [
      { level: 1, description: '获得**20**固定减伤。' },
      { level: 2, description: '获得**25**固定减伤。' },
      { level: 3, description: '获得**30**固定减伤。' },
    ],
    priority: '提升明显',
  },

  观察员: {
    id: '观察员',
    rank: 'B',
    cost: 3,
    description: '游戏开始后**一段时间**内，猫咪可以看到所有机器鼠的位置。',
    detailedDescription:
      '猫咪通过监控设备得知机器鼠的动向。游戏开始后**一段时间**内，猫咪可以看到所有机器鼠的位置。',
    levels: [
      { level: 1, description: '持续到游戏开始后**20**秒。' },
      { level: 2, description: '持续到游戏开始后**25**秒。' },
      { level: 3, description: '持续到游戏开始后**30**秒。' },
    ],
    priority: '本身无用',
  },

  /* ----------------------------------- C级卡 ---------------------------------- */
  巡逻戒备: {
    id: '巡逻戒备',
    rank: 'C',
    cost: 3,
    description: '**降低**附近老鼠推速。',
    detailedDescription: '四处巡逻的猫咪，会**降低**附近1100范围内老鼠的推速。',
    levels: [
      { level: 1, description: '降低**10%**。' },
      { level: 2, description: '降低**20%**。' },
      { level: 3, description: '降低**30%**。' },
    ],
    priority: '提升明显',
  },

  春风得意: {
    id: '春风得意',
    rank: 'C',
    cost: 4,
    description: '手握老鼠时，**提升**移动、跳跃速度，并免疫捕鼠夹和碎片。',
    detailedDescription:
      '终于抓住了一只小老鼠！手握老鼠时，**提升**移动、跳跃速度，并免疫捕鼠夹和碎片。',
    levels: [
      { level: 1, description: '移动、跳跃速度提升**5%**。' },
      { level: 2, description: '移动、跳跃速度提升**6%**。' },
      { level: 3, description: '移动、跳跃速度提升**7%**。' },
    ],
    priority: '几乎无提升',
  },

  气势如牛: {
    id: '气势如牛',
    rank: 'C',
    cost: 3,
    description: '墙缝出现后，移动、跳跃速度**短暂**提升。',
    detailedDescription:
      '最后的关头！墙缝出现后，愤怒的猫咪鼓起气势，移动、跳跃速度**短暂**提升30%。',
    levels: [
      { level: 1, description: '效果持续**10**秒。' },
      { level: 2, description: '效果持续**15**秒。' },
      { level: 3, description: '效果持续**20**秒。' },
    ],
    priority: '本身无用',
  },

  狡诈: {
    id: '狡诈',
    rank: 'C',
    cost: 2,
    description: '当老鼠踩中捕鼠夹后，猫咪获得**短暂**的加速。',
    detailedDescription: '当老鼠踩中捕鼠夹后，猫咪获得**短暂**的20%移速加成。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '加速持续**6**秒。' },
      { level: 2, description: '加速持续**7**秒。' },
      { level: 3, description: '加速持续**8**秒。' },
    ],
    priority: '提升较小',
  },

  猫是液体: {
    id: '猫是液体',
    rank: 'C',
    cost: 2,
    description: '猫咪能够**更快**、更频繁地穿过管道，并且[不用“排队”](不会显示“管道使用中”)。',
    detailedDescription:
      '猫咪使自己身体变得更柔软，能够**更快**、更频繁地穿过管道，并且[不用“排队”](不会显示“管道使用中”)。',
    levels: [
      { level: 1, description: '钻管道速度提升**60%**。' },
      { level: 2, description: '钻管道速度提升**65%**。' },
      { level: 3, description: '钻管道速度提升**70%**。' },
    ],
    priority: '提升较小',
  },

  都是朋友: {
    id: '都是朋友',
    rank: 'C',
    cost: 3,
    description:
      '猫咪不会再受到斯派克的攻击，但靠近斯派克时，**略微**减速。此外，免疫女主人的眩晕效果。',
    detailedDescription:
      '猫咪与斯派克成为塑料朋友后，不会再受到斯派克的攻击，但附近1050范围内有斯派克时，**略微**减速。此外，免疫女主人的眩晕效果。',
    levels: [
      { level: 1, description: '靠近斯派克时减速**5%**。' },
      { level: 2, description: '靠近斯派克时减速**4%**。' },
      { level: 3, description: '靠近斯派克时减速**3%**。' },
    ],
    priority: '提升较小',
  },

  铁手: {
    id: '铁手',
    rank: 'C',
    cost: 4,
    description: '**降低**猫咪手中老鼠的挣扎的速度。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '降低**4%**。' },
      { level: 2, description: '降低**6%**。' },
      { level: 3, description: '降低**10%**。' },
    ],
    priority: '本身无用',
  },

  震慑: {
    id: '震慑',
    rank: 'C',
    cost: 3,
    description: '老鼠被绑在火箭上时，鼠方推速**降低**。',
    // detailedDescription: '',
    levels: [
      { level: 1, description: '降低**8%**。' },
      { level: 2, description: '降低**12%**。' },
      { level: 3, description: '降低**16%**。' },
    ],
    priority: '本身无用',
  },
};

// Generate cards with faction ID and image URLs applied in bulk
export const catCardsWithImages = Object.fromEntries(
  Object.entries(catKnowledgeCards).map(([cardId, card]) => [
    cardId,
    {
      ...card,
      factionId: 'cat' as const,
      imageUrl: getCatCardImageUrl(card.rank, card.id),
    },
  ])
);
