import { addSkillImageUrls } from '../lib/skillUtils';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition, PartialCharacterDefinition } from './types';

// Generate image URL based on character ID
export const getCatImageUrl = (characterId: string): string => {
  // support character name editing disallow hard coding existing characters
  return `/images/cats/${characterId}.png`;
};

const catCharacterDefinitions: Record<string, CharacterDefinition | PartialCharacterDefinition> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  汤姆: {
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家',

    maxHp: 255,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.3,
    clawKnifeRange: 300,

    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动技能的无敌有很强的上火箭能力。',
        additionalDescription: '二被+锅 或者 枪+蓄力重击 也能对守火箭的老鼠产生极大威胁。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '无敌提供解控，一被提供续航。',
        additionalDescription: '对打架阵容有很强的反制能力。',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '武器技能的直接抓取提供了一定的翻盘能力',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '手型枪',
        pattern: '121220001',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '平底锅',
        pattern: '131[3300]01',
        weaponType: 'weapon2',
        description: '非常顺风的时候可以考虑先点被动再点锅。',
        additionaldescription: '如果血量告急，也可以考虑先点一被回血。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '平底锅，爪刀接二级锅接爪刀轻松打死124血老鼠',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
        description: '手型枪，适合打无管道图。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '手型枪，适合打管道图。',
      },
    ],

    skills: [
      {
        name: '发怒冲刺',
        type: 'active',
        description: '解控并进入一段时间的无敌。',
        detailedDescription:
          '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌期间获得12.5%加速，仍会受到[真实伤害](如仙女鼠的一星；但不会因此被击倒)和[位移效果的影响](如尼宝的钩子)。若在莱恩蓝图内受到真实伤害，不免疫变线条猫。绑火箭等交互会被仙女鼠八星打断。无敌结束后会有2秒的10%减速，减速可以被护盾抵消。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断，但不返还CD',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=127.35',
        skillLevels: [
          {
            level: 1,
            description: '无敌持续3.8秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '无敌持续6.8秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '无敌期间减少爪刀CD。',
            detailedDescription: '无敌期间减少25%爪刀CD。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '手型枪',
        type: 'weapon1',
        description: '汤姆最爱的捕鼠神器。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '可被跳跃键取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=16',
        skillLevels: [
          {
            level: 1,
            description: '手型枪水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
            detailedDescription:
              '手型枪水平飞出、原路飞回，对命中的老鼠造成15点伤害、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，额外给予65点伤害。眩晕对比例鼠和虚弱的老鼠也生效。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '手型枪飞行速度增加。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '平底锅',
        type: 'weapon2',
        description: '挥锅攻击老鼠并打出煎蛋。',
        // detailedDescription: '挥锅攻击老鼠并打出煎蛋。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摽',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=172.85',
        skillLevels: [
          {
            level: 1,
            description: '打晕并致盲附近老鼠、降低其救援速度；也能击飞道具。',
            detailedDescription:
              '挥锅对命中的老鼠造成15点伤害、5秒失明和55%救援减速；煎蛋也会对命中的老鼠造成15点伤害、5秒失明和55%救援减速；被锅命中的老鼠落地后受到25点伤害，并眩晕1秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '失明延长至7.5秒；锅命中老鼠刷新爪刀CD。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被平底锅命中、落地后眩晕的老鼠。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '捕鼠专家',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=102.4',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成伤害时回复Hp并加速。',
            detailedDescription:
              '对老鼠造成伤害时，回复25Hp并获得2.6秒的9.5%加速；若伤害来自爪刀，额外回复25Hp。',
          },
          {
            level: 2,
            description: '手握老鼠时依然可以攻击',
            detailedDescription:
              '手握老鼠时依然可以攻击，并可触发蓄势、击晕、三被等效果，但不会改变惯性（即不能用二被进行楼梯刀加速）',
          },
          {
            level: 3,
            description: '对老鼠造成伤害时，给予3秒沉默。',
            // detailedDescription: '对老鼠造成伤害时，给予3秒沉默。'
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 布奇 ----------------------------------- */
  布奇: {
    description: '"流浪猫铁三角"中的老大，从街头流浪逆袭为亿万富豪',

    maxHp: 220,
    attackBoost: 25,
    hpRecovery: 2,
    moveSpeed: 750,
    jumpHeight: 420,
    clawKnifeCdHit: 6,
    clawKnifeCdUnhit: 4.8,
    clawKnifeRange: 280,

    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '主动技能可以将奶酪推离洞口；旋转桶盖可以有效守火箭或奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '一被快速起身和三级旋转桶盖的霸体提供了较强的打架能力。',
        additionalDescription: '某种程度上，血量低反而成为了优点。',
      },
    ],

    skillAllocations: [
      {
        id: '垃圾盖',
        pattern: '120001122',
        weaponType: 'weapon1',
        description: '欢迎指正',
        additionaldescription: '',
      },
      {
        id: '旋转桶盖',
        pattern: '1[30]330011',
        weaponType: 'weapon2',
        description: '三级时如果血量告急则先点一被',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
    ],

    skills: [
      {
        name: '横冲直撞',
        type: 'active',
        description: '猛冲一段距离，冲飞道具并对老鼠造成伤害和眩晕。冲刺中可通过方向键改变方向。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=4.8',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成26点伤害和0.4秒眩晕。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '略微减少前摇、冲刺更迅速。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '冲刺更迅速、眩晕延长至1秒；命中老鼠或奶酪时获得短暂加速。',
            detailedDescription: '冲刺更迅速、眩晕延长至1秒；命中老鼠或奶酪时提升30%移速5秒。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '垃圾盖',
        type: 'weapon1',
        description: '小范围AOE。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键取消',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=47.5',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕附近老鼠。',
            detailedDescription: '对附近老鼠造成26伤害并眩晕1.3秒',
            cooldown: 18,
          },
          {
            level: 2,
            description: '增加眩晕时间、命中的老鼠攻击力短暂降低；震碎附近的易碎道具。',
            detailedDescription:
              '眩晕延长至2.4秒、命中的老鼠10秒内攻击力降低100；震碎附近的易碎道具。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '被命中的老鼠救援速度短暂降低。',
            detailedDescription: '被命中的老鼠救援速度短暂降低45%。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '旋转桶盖',
        type: 'weapon2',
        description: '原地释放或扔出几何桶盖。',
        detailedDescription: '原地释放或扔出几何桶盖，轨迹十分独特。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃/道具键打断',
        cancelableAftercast: '可被跳跃/道具键取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=71.45',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕命中的老鼠；自己捡到桶盖会获得6秒减伤。',
            detailedDescription:
              '对命中的老鼠造成55伤害并眩晕1.5秒；自己捡到桶盖会获得6秒固定减伤30。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '增加桶盖飞行速度；自己捡到桶盖会额外获得强霸体。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '力大无穷',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=83.5',
        skillLevels: [
          {
            level: 1,
            description: '虚弱后更快起身、无敌时间更长。',
          },
          {
            level: 2,
            description: '投掷道具造成额外伤害。',
            detailedDescription: '投掷道具造成25额外伤害。',
          },
          {
            level: 3,
            description: '爪刀有30%概率直接造成虚弱；技能和道具造成的控制时间增加1秒。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 托普斯 ---------------------------------- */
  托普斯: {
    description: '"流浪猫铁三角"的一员，呆萌小灰猫，爱和小老鼠交朋友',

    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 780,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.6,
    clawKnifeRange: 220,

    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '分身提供额外的视野和极强的机动性。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: false,
        description: '捕虫网的直接抓取提供了一定的翻盘手段。',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '分身提供反隐和霸体，配合一被和击晕，可以高效守火箭或奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: true,
        description: '通过换位和三级分身提供的霸体反制老鼠的控制。',
        additionalDescription: '但难以应对爆发输出。',
      },
    ],

    skillAllocations: [
      {
        id: '泡泡棒',
        pattern: '011212200',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '捕虫网',
        pattern: '011310033',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
      ['S-击晕', 'A-熊熊燃烧', 'A-长爪', 'B-皮糙肉厚'],
      ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
    ],

    skills: [
      {
        name: '双重猫格',
        type: 'active',
        description:
          '释放分身。分身继承知识卡、免疫碎片和捕鼠夹、提供小地图视野，但被攻击时受到固定增伤。额外技能按钮可指挥分身出击或跟随。再次使用技能可与分身换位。',
        detailedDescription:
          '释放分身。分身爪刀伤害提升、继承知识卡、免疫碎片和捕鼠夹、爪刀CD减少、提供小地图视野（包括隐身的老鼠），但被攻击时受到固定增伤。额外技能按钮可指挥分身出击或跟随（CD：5秒）。再次使用技能可与分身换位。本体获得部分增益时，分身也会获得。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可取消',
        cancelableAftercast: '无后摇',
        // 没找到好的技能教学视频
        skillLevels: [
          {
            level: 1,
            description: '换位CD为15秒；分身在一段时间或被击倒后消失。',
            cooldown: 36,
          },
          {
            level: 2,
            description: '减少CD；换位CD减少至10秒；换位时回复Hp并获得短暂加速和交互速度提升。',
            cooldown: 24,
          },
          {
            level: 3,
            description:
              '减少CD；换位CD减少至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分控制和受到的一半伤害会转移给分身。',
            detailedDescription:
              '减少CD；换位CD减少至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分[控制](不包括斯派克抓取、捕鼠夹、虚弱、仙女鼠8星等)和受到的一半伤害会转移给分身。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '泡泡棒',
        type: 'weapon1',
        description: '吹出泡泡来困住老鼠。',
        detailedDescription:
          '吹出泡泡来困住老鼠。泡泡可以被道具砸破，也会因困住的老鼠挣扎而破裂。泡泡破裂时会伤害和眩晕周围老鼠；20秒后自然消失。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '吹出一个泡泡。',
            detailedDescription:
              '吹出一个泡泡，直接释放则泡泡会留在原地，拖动释放则泡泡会缓慢向该方向漂移。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '每次吹出两个泡泡。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '捕虫网',
        type: 'weapon2',
        description:
          '将面前的一只老鼠抓到网中；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠会被直接绑上途经的火箭。',
        detailedDescription:
          '将面前的一只老鼠抓到网中，期间老鼠可挣扎挣脱（若有多个老鼠在网的范围内，则会网住编号最小的）；再次使用技能将老鼠扔出，扔出的老鼠落地后眩晕并再次受到伤害，同时伤害周围的老鼠。扔出的老鼠会被直接绑上途经的火箭。捕虫网可以网住[霸体老鼠](如尼宝的灵活跳跃、表演者·杰瑞的梦幻舞步)，但无法网住[无敌老鼠](如剑客泰菲的头盔、罗宾汉杰瑞的降落伞)，若老鼠有护盾，则使用捕虫网将会消除一层护盾。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '网住一只老鼠。',
            // detailedDescription: '网住一只老鼠。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大。',
            detailedDescription:
              '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 10,
          },
        ],
      },
      {
        name: '元气满满',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '大幅减少爪刀命中时的爪刀CD至1.6秒。',
          },
          {
            level: 2,
            description: '手中的老鼠挣扎速度降低30%。',
          },
          {
            level: 3,
            description: '击中老鼠时，移除其隐身远视等大部分增益。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 莱特宁 ---------------------------------- */
  莱特宁: {
    description:
      '“流浪猫铁三角”中的一员。莱特宁是一只橙红色的猫，喜欢与汤姆争夺女主人的宠爱，他移动速度快如闪电，没有任何老鼠能逃脱他的追击。',
    maxHp: 260,
    hpRecovery: 3,
    moveSpeed: 775,
    jumpHeight: 420,
    clawKnifeCdHit: 6.5,
    clawKnifeCdUnhit: 4.5,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '主动技能闪现老鼠。',
        additionalDescription: '被动还可以减速老鼠并标记视野',
      },
      {
        tagName: '防守',
        isMinor: false,
        description: '垃圾桶可阻止老鼠推奶酪，且能无缝衔接。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '主动技能的直接抓取有一定翻盘能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '101212020',
        weaponType: 'weapon1',
        description: '待补充',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '待补充',
      },
    ],
    skills: [
      {
        name: '瞬移闪击',
        type: 'active',
        description: '向前移动一段距离。如果附近有老鼠，可以瞬移到老鼠身后。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description: '瞬移后获得8秒“疾如风”状态，提升移速和攻击频率。',
            cooldown: 8,
            detailedDescription: '瞬移后获得8秒“疾如风”状态，加速10%、爪刀CD减半。',
          },
          {
            level: 3,
            description:
              '提高瞬移范围；瞬移到[交互中](包括推奶酪、救队友、在捕鼠夹上挣扎、吃蛋糕，喝牛奶，喝饮料、开纸箱、技能前摇、开关门、推车、推斧头、摇钟、调药水、开监控、采花、摇三角铁、进机器鼠、自起特技)的老鼠身后时，对其造成[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            detailedDescription:
              '提高瞬移范围；瞬移到[交互中](包括推奶酪、救队友、在捕鼠夹上挣扎、吃蛋糕，喝牛奶，喝饮料、开纸箱、技能前摇、开关门、推车、推斧头、摇钟、调药水、开监控、采花、摇三角铁、进机器鼠、自起特技)的老鼠身后时，对其造成2秒[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            cooldown: 8,
          },
        ],
      },
      {
        name: '垃圾桶',
        type: 'weapon1',
        description:
          '放置垃圾桶阻挡老鼠的道路。垃圾桶的异味会使老鼠受到减速和伤害。由此造成伤害时会减少爪刀CD。',
        detailedDescription:
          '放置垃圾桶阻挡老鼠的道路。垃圾桶的异味会使老鼠受到减速和伤害。每造成1次伤害会降低0.6秒爪刀CD，每秒只生效一次。垃圾桶不会对倒地的老鼠造成伤害并降低爪刀CD，在垃圾桶范围内倒地并起身的老鼠不会受到垃圾桶的伤害，但重新进入垃圾桶范围仍会受到伤害。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '垃圾桶持续12秒。',
            detailedDescription:
              '垃圾桶持续12秒，老鼠[进入垃圾桶范围瞬间](包括放置时在范围内和老鼠进入)会受到10伤害，并以5/s持续降低Hp。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '垃圾桶持续时间提高至18秒；提高伤害。',
            cooldown: 18,
            detailedDescription:
              '垃圾桶持续时间提高至18秒；老鼠进入垃圾桶范围瞬间伤害提高至15，持续性伤害提高至8/s。',
          },
          {
            level: 3,
            description: '提高减速效果和伤害。',
            cooldown: 18,
            detailedDescription:
              '提高减速效果；老鼠进入垃圾桶范围瞬间伤害提高至25，持续性伤害提高至12/s。',
          },
        ],
      },
      {
        name: '咸鱼',
        type: 'weapon2',
        description:
          '从垃圾桶中倒出咸鱼，鼠方踩到后会受到小幅全属性减益。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD、减少爪刀CD，并回复Hp。闪电瞬移将优先追踪带有咸鱼效果的敌方，并大幅提高追踪范围。',
        detailedDescription:
          '从垃圾桶中倒出咸鱼并标记在小地图上，咸鱼持续一分钟，鼠方踩到后会受咸鱼影响，持续20秒，期间推速降低40%，救援、治疗速度降低33%，移速降低10%，跳跃高度降低（未测），同时暴露小地图位置。可通过吃蛋糕、喝牛奶、喝饮料、特技-治疗、牛仔弹琴来解除。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD，爪刀CD减少至1.9s，并以50/s恢复Hp，持续1s。闪电瞬移将优先追踪带有咸鱼效果的敌方，并大幅提高追踪范围。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '受咸鱼影响的老鼠无法对莱特宁造成眩晕。手中抓有老鼠时，闪电瞬移优先追踪最近的咸鱼。',
            cooldown: 8,
            detailedDescription:
              '受咸鱼影响的老鼠无法对莱特宁造成眩晕、且无法自然恢复Hp。手中抓有老鼠时，闪电瞬移优先追踪最近的咸鱼。',
          },
          {
            level: 3,
            description: '提高咸鱼腥味的持续时间。',
            cooldown: 8,
            detailedDescription: '咸鱼腥味的持续时间提高至30秒。',
          },
        ],
      },
      {
        name: '穷追不舍',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '对伤害到的老鼠进行标记，使其减速并暴露小地图位置。莱特宁对被标记的老鼠造成额外伤害；击倒时获得额外经验。',
            detailedDescription:
              '对伤害到的老鼠进行标记，使其减速20%并暴露小地图位置，持续15秒。莱特宁对被标记的老鼠造成伤害时，额外造成[15伤害](可被减伤影响)。击倒被标记的老鼠可获得额外经验。',
          },
          {
            level: 2,
            description: '提高基础移动和跳跃速度。',
            detailedDescription: '基础移速提升10%；跳跃速度提升（未测）。',
          },
          {
            level: 3,
            description: '即使受到减速，移动和跳跃速度也不会低于基础值。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 苏蕊 ---------------------------------- */
  苏蕊: {
    description:
      '苏蕊是最受欢迎的啦啦队队长，充满活力的她，脸上时时刻刻都洋溢着灿烂的笑容。她热爱生活，享受美食，认识她的猫和老鼠都会被她吸引。',

    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 7,
    clawKnifeCdUnhit: 5,
    clawKnifeRange: 280,

    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '律动时间的增伤为击倒高Hp老鼠提供了可能，瑜伽球提供了攻击手段。',
        additionalDescription: '',
      },
      {
        tagName: '速通',
        isMinor: false,
        description: '律动时间使多个老鼠跟随提供了在前期杀穿老鼠的可能。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '律动时间使多个老鼠跟随提供了一定的翻盘手段。',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '',
        pattern: '12000122-1',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
      ['S-蓄势一击', 'S-屈打成招', 'A-穷追猛打', 'A-加大火力'],
      ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-攻其不备', 'C-猫是液体'],
    ],

    skills: [
      {
        name: '律动时间',
        type: 'active',
        description:
          '随着音乐舞动，持续40秒。舞动开始时恢复Hp。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为以苏蕊为中心、范围更大的[舞动亮相](CD为6秒（未命中）和12秒（命中），伤害为70点)。舞动时每隔13秒出现爱心提示，此时点击技能按钮将恢复Hp、提升移速和攻击力。舞动时接触虚弱老鼠将使其自主跟随苏蕊30秒，期间遇到火箭会立刻绑上。',
        detailedDescription:
          '随着音乐舞动，持续40秒。舞动开始时恢复50Hp。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为以苏蕊为中心、范围更大的[舞动亮相](CD为6秒（未命中）和12秒（命中），伤害为70点)。移动和跳跃不会中断此技能。舞动时每隔13秒出现爱心提示，此时点击技能按钮将恢复30Hp、提升10%移速和15点攻击力。舞动时接触不在捕鼠夹上的[虚弱老鼠](包括触发知识卡“铁血”的老鼠)将使其自主跟随苏蕊30秒，期间遇到火箭会立刻绑上。在此状态下，老鼠无法主动使用技能、移动等操作。若老鼠与苏蕊距离较远（如钻管道后），则老鼠会解除跟随状态。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可取消',
        cancelableAftercast: '无后摇',
        // 没找到好的技能教学视频
        skillLevels: [
          {
            level: 1,
            description: '进入舞动状态，若手中有老鼠则会放下老鼠并使其自主跟随。',
            cooldown: 40,
          },
          {
            level: 2,
            description: '舞动时受到的伤害减少。',
            detailedDescription: '舞动中固定减伤10点。',
            cooldown: 40,
          },
          {
            level: 3,
            description: '每次爱心提示出现后成功点击技能按钮将延长舞动时间。',
            detailedDescription:
              '每次爱心提示出现后成功点击技能按钮将延长舞动时间5秒，总舞动时间变为60秒。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '瑜伽球',
        type: 'weapon1',
        description: '投掷出瑜伽球并控制它膨胀，膨胀时使老鼠眩晕并弹飞。',
        detailedDescription:
          '苏蕊投掷出瑜伽球，在瑜伽球飞行过程中苏蕊可再次点击技能键使瑜伽球膨胀，当膨胀时接触到敌方老鼠，则会造成30点伤害、1.5秒眩晕并弹飞，瑜伽球可积累2次使用机会。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '扔出一个瑜伽球。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '瑜伽球造成的眩晕时间提升。',
            detailedDescription: '瑜伽球造成的眩晕时间提升至2.5秒。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '少女心',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '爪刀和舞动亮相命中敌方时将重置瑜伽球的冷却时间。',
            detailedDescription:
              '爪刀和舞动亮相命中敌方时将重置瑜伽球的冷却时间，击中多个敌方将重置多个CD。',
          },
          {
            level: 2,
            description: '虚弱时间减少5秒。',
            detailedDescription: '虚弱时间减少至2秒，起身时只有[一半Hp](即100点)。',
          },
          {
            level: 3,
            description: '易碎的投掷道具击中敌方时将重置律动时间的冷却时间。',
            detailedDescription: '易碎的投掷道具击中[敌方](含虚弱老鼠)时将重置律动时间的冷却时间。',
          },
        ],
      },
    ],
  },
};

// Process character definitions to assign IDs and process skills
export const catCharacters = processCharacters(catCharacterDefinitions);

// Generate characters with faction ID and image URLs applied in bulk
export const catCharactersWithImages = Object.fromEntries(
  Object.entries(catCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      factionId: 'cat' as const,
      imageUrl: getCatImageUrl(characterId),
      skills: addSkillImageUrls(characterId, character.skills, 'cat'),
    },
  ])
);
