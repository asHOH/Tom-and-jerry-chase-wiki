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
        description: '平底锅，爪刀接二级锅接爪刀轻松打死124血老鼠。',
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
        aliases: ['无敌'],
        description: '解控并进入一段时间的无敌。',
        detailedDescription:
          '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌期间获得12.5%加速，仍会受到[真实伤害](如仙女鼠的一星；但不会因此被击倒)和[位移效果的影响](如尼宝的钩子)。若在莱恩蓝图内受到真实伤害，不免疫变线条猫。绑火箭等交互会被仙女鼠八星打断。无敌结束后会有2秒的10%减速，减速可以被护盾抵消。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '前摇前',
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
        description: '手型枪水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
        detailedDescription:
          '手型枪水平飞出、飞回，对命中的老鼠造成15点伤害、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，额外给予65点伤害。眩晕对比例鼠和虚弱的老鼠也生效。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['跳跃键'],
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=16',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description: '手型枪飞行速度增加。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '汤姆可以直接抓起被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '平底锅',
        type: 'weapon2',
        description: '挥锅攻击老鼠并打出煎蛋，打晕并致盲附近老鼠、降低其救援速度；也能击飞道具。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=172.85',
        skillLevels: [
          {
            level: 1,
            description: '',
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
            description: '汤姆可以直接抓起被平底锅命中、落地后眩晕的老鼠。',
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
            description: '对老鼠造成伤害时，回复Hp并加速。',
            detailedDescription:
              '对老鼠造成伤害时，回复25Hp并获得2.6秒的9.5%加速；若伤害来自爪刀，额外回复25Hp。',
          },
          {
            level: 2,
            description: '手握老鼠时依然可以使用爪刀。',
            detailedDescription:
              '手握老鼠时依然可以使用爪刀，并可触发蓄势、击晕、三级被动等效果，但[不会改变惯性](即不会因为使用爪刀而进入下落状态)。',
          },
          {
            level: 3,
            description: '对老鼠造成伤害时，给予3秒沉默。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 布奇 ----------------------------------- */
  布奇: {
    description: '"流浪猫铁三角"中的老大，从街头流浪逆袭为亿万富豪。',
    aliases: ['黑猫', '黑鼠'],

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
        description: '欢迎指正。',
        additionaldescription: '',
      },
      {
        id: '旋转桶盖',
        pattern: '1[30]330011',
        weaponType: 'weapon2',
        description: '三级时如果血量告急则先点一被。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '待补充',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '待补充',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '待补充',
      },
    ],

    skills: [
      {
        name: '横冲直撞',
        type: 'active',
        aliases: ['冲刺', '冲撞'],
        description: '冲刺一段距离，冲飞道具并对老鼠造成伤害和眩晕。冲刺中可通过方向键控制方向。',
        detailedDescription:
          '冲刺一段距离，冲飞道具并对老鼠造成26点伤害和0.4秒眩晕。冲刺中可通过方向键控制方向。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=4.8',
        skillLevels: [
          {
            level: 1,
            description: '',
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
            detailedDescription: '冲刺更迅速、眩晕延长至1秒；命中老鼠或奶酪时获得5秒30%加速。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '垃圾盖',
        type: 'weapon1',
        description: '伤害并眩晕附近老鼠。',
        detailedDescription: '对附近老鼠造成26伤害并眩晕1.3秒。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=47.5',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 18,
          },
          {
            level: 2,
            description: '增加眩晕时间、命中的老鼠攻击力短暂降低；震碎附近的易碎道具。',
            detailedDescription:
              '眩晕延长至2.4秒、命中的老鼠10秒内攻击力短暂降低固定值100；震碎附近的易碎道具。',
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
        description: '原地释放或扔出旋转桶盖，伤害并眩晕命中的老鼠；自己捡到桶盖会获得6秒减伤。',
        detailedDescription:
          '原地释放或扔出旋转桶盖，对命中的老鼠造成55伤害并眩晕1.5秒；自己捡到桶盖会获得6秒固定减伤30。桶盖拥有较大的惯性。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键'],
        cancelableAftercast: ['跳跃键', '道具键'],
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=71.45',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '增加桶盖飞行速度；自己捡到桶盖额外获得强霸体。',
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
            detailedDescription: '投掷道具造成25点额外伤害。',
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
    aliases: ['托斯', '奶猫'],
    description: '"流浪猫铁三角"的一员，呆萌小灰猫，爱和小老鼠交朋友。',

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
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '待补充',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-长爪', 'B-皮糙肉厚'],
        description: '待补充',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '待补充',
      },
    ],
    counteredBy: [
      {
        id: '尼宝',
        description: '托普斯的捕虫网可以直接抓取灵活跳跃后霸体的尼宝，使尼宝很难救人。',
      },
    ],

    skills: [
      {
        name: '双重猫格',
        type: 'active',
        aliases: ['分身'],
        description:
          '释放分身。分身继承知识卡、免疫碎片和捕鼠夹、提供[小地图视野](包括隐身的老鼠)，但被攻击时受到固定增伤。额外技能按钮可指挥分身出击或跟随。再次使用技能可与分身换位。',
        detailedDescription:
          '释放分身。分身爪刀伤害提升、继承知识卡、免疫碎片和捕鼠夹、爪刀CD减少、提供[小地图视野](包括隐身的老鼠)，但被攻击时受到固定增伤。额外技能按钮可指挥分身出击或跟随（CD：5秒）。再次使用技能可与分身换位。本体获得部分增益时，分身也会获得。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
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
              '减少CD；换位CD减少至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分[控制](不包括斯派克抓取、捕鼠夹、虚弱、仙女鼠8星等)和受到的一半伤害会转移给分身。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '泡泡棒',
        type: 'weapon1',
        description: '吹出泡泡来困住老鼠。泡泡可以被道具砸破。',
        detailedDescription:
          '吹出泡泡来困住老鼠。泡泡可以被道具砸破，也会因困住的老鼠挣扎而破裂。泡泡破裂时会伤害和眩晕周围老鼠；20秒后自然消失。直接释放则泡泡会留在原地，拖动释放则泡泡会缓慢向该方向漂移。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
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
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的)抓到网中；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠若途经火箭则被直接绑上。',
        detailedDescription:
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的)抓到网中，期间老鼠可挣扎挣脱；再次使用技能将老鼠扔出，扔出的老鼠落地后眩晕并再次受到伤害，同时伤害周围的老鼠。扔出的老鼠若途经火箭则被直接绑上。捕虫网可以网住[霸体老鼠](如尼宝的灵活跳跃、表演者·杰瑞的梦幻舞步)，但无法网住[无敌老鼠](如剑客泰菲的头盔、罗宾汉杰瑞的降落伞)。可被一层护盾抵消。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
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
            description: '减少爪刀命中时的爪刀CD至1.6秒。',
          },
          {
            level: 2,
            description: '手中的老鼠挣扎速度降低30%。',
          },
          {
            level: 3,
            description: '击中老鼠时，移除其隐身、远视等大部分增益。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 莱特宁 ---------------------------------- */
  莱特宁: {
    aliases: ['橘猫', '橘鼠'],
    description:
      '"流浪猫铁三角"中的一员。莱特宁是一只橙红色的猫，喜欢与汤姆争夺女主人的宠爱，他移动速度快如闪电，没有任何老鼠能逃脱他的追击。',
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
        id: '垃圾桶',
        pattern: '101212020',
        weaponType: 'weapon1',
        description: '可攻可防。',
      },
      {
        id: '咸鱼',
        pattern: '100311330',
        weaponType: 'weapon2',
        description: '需要很强的意识和思路。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '打架队用。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-心灵手巧', 'A-穷追猛打'],
        description: '无管道用。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
        description: '管道用，若没21知识点可以去掉狡诈。',
      },
      {
        cards: ['S-猛攻', 'A-细心', 'A-穷追猛打', 'B-恐吓', 'B-皮糙肉厚'],
        description: '防守流。',
      },
    ],
    skills: [
      {
        name: '瞬移闪击',
        type: 'active',
        aliases: ['闪现'],
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
        cancelableSkill: ['跳跃键'],
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
        cancelableSkill: ['跳跃键'],
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
            detailedDescription: '基础移速提升20%；跳跃速度提升（未测）。',
          },
          {
            level: 3,
            description: '即使受到减速，移动和跳跃速度也不会低于基础值。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 图茨 ---------------------------------- */
  图茨: {
    aliases: ['小黄'],
    description:
      '图茨拥有娇小的身材和靓丽的脸庞，因为被富养，她性格可爱温柔，图茨是汤姆的女朋友之一，广受所有猫和老鼠的喜爱。',
    maxHp: 255,
    hpRecovery: 3.5,
    moveSpeed: 76,
    jumpHeight: 420,
    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.3,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description:
          '武器技能汽水罐，放在火箭上可以妨碍救援；主动技能喵喵叫大范围伤害搭配汽水可以防守最后一块奶酪',
        additionalDescription: '对打架阵容有很强的反制能力。',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description: '喵喵叫的大范围伤害和控制是有力的进攻手段。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: true,
        description: '喵喵叫的大范围群体伤害和控制在打团时有一定发挥。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '鼠方一旦失误，喵喵叫的大范围群体伤害和控制可以对鼠方造成重创。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '131313000',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
      {
        id: '汽水爪刀流',
        pattern: '131010033',
        weaponType: 'weapon1',
        description: '如果节奏突然断了，5级可以先点被动而不点汽水罐，尝试找节奏。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-细心', 'A-穷追猛打'],
        description:
          '通用卡组，适合碎片多和夹子比较多的大地图，如雪夜古堡全系列，太空堡垒1、2，游轮3等。不推荐用于布局收益不高的地图，如经典之家全系列，游乐场，天宫，酒店，熊猫馆。萌新可以无脑用这套。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description:
          '通用卡组，但是没有细心，比较吃手法，萌新不推荐。适合夹子少、碎片少、布局收益不大的大地图，如经典之家全系列，游乐场，熊猫馆，酒店，天宫。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'A-心灵手巧', 'B-捕鼠夹'],
        description:
          '适合夹子多的图，很克舍己，特定地图很强，如游轮1、2，太空堡垒2、也可以考虑太空堡垒3使用。注意，如果有破局老鼠，要斟酌使用，可改用第一套。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'A-心灵手巧', 'C-猫是液体'],
        description:
          '适合管道多的图，如太空堡垒3、森林牧场。注意太空堡垒3开局建议优先布局，森林牧场开局如果对面不给节奏也尽量布局。如果有大表哥在天宫、游乐场可以斟酌使用。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'A-加大火力', 'B-捕鼠夹'],
        description:
          '这套针对没有奶酪位的阵容。前期快速击倒一个老鼠，快速布夹子在火箭下，发挥防守优势。如果老鼠救不下来就速飞一个；由于带了捕鼠夹，老鼠舍己救下也大概率被夹死，一般也能速飞一个。注意，若求稳则不建议使用。',
      },
    ],
    skills: [
      {
        name: '喵喵叫',
        type: 'active',
        description:
          '按住技能键持续喵喵叫，附近敌方不断叠加减速层数，每到五层时造成60点伤害和眩晕。被打断或取消会按比例返还CD。',
        detailedDescription:
          '按住技能键持续喵喵叫，在此期间可以移动并使用爪刀和特技霸体，附近敌方不断叠加减速层数，并暴露视野。每到五层时造成60点伤害和眩晕。被打断或取消会按比例返还CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description: '叠层数频率为[0.5秒](最高叠加5层)。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '叠层数频率提升至[0.4秒](最高可叠6层)；减少CD',
            cooldown: 15,
          },
          {
            level: 3,
            description: '叠层数频率提升至[0.3秒](最高可叠11层)。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '防狼锤',
        type: 'weapon1',
        aliases: ['锤子'],
        description: '挥动防狼锤，造成少量伤害和一层减速。',
        detailedDescription:
          '锤子范围较小，使用时会因惯性继续向前移动一小段距离，自身受到极少量伤害；命中敌方造成少量伤害和一层减速。血量不足时不能使用锤子。（欢迎纠正和补充）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 0.5,
          },
          {
            level: 2,
            description: '命中敌方额外造成8秒沉默。（时长尚未精确测试）',
            cooldown: 0.5,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 0.1,
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '汽水罐',
        type: 'weapon2',
        description:
          '向任意方向扔出汽水，若未命中，达到终点后开始旋转，持续20秒。命中造成少量伤害和两层减速，冰冻小范围内所有敌人3秒。（欢迎纠正和补充）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description:
              '汽水罐自然消失或相撞会形成特殊冰面。鼠滑到会进入层脆弱状态，降低推速和救援速度，并暴露小地图位置。图茨滑到则会获得3秒爆发性加速。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 8,
          },
        ],
      },
      {
        name: '愤怒的少女',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '小地图不会显示图茨的位置；开关门不会有声音、不会使老鼠胆怯。（欢迎纠正和补充）',
            detailedDescription:
              '小地图不会显示图茨的位置，但是老鼠喝远视或图茨手握老鼠时还是会出现在小地图上；开关门不会有声音；不会使老鼠胆怯。（欢迎纠正和补充）',
          },
          {
            level: 2,
            description: '图茨血量不满时，可连续挥爪三次，并提高爪刀频率',
            detailedDescription: '图茨血量不满时，可连续挥爪三次，并提高爪刀频率',
          },
          {
            level: 3,
            description: '血量不满时，减少技能CD，喵喵叫从15秒变成10秒。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 米特 ----------------------------------- */
  米特: {
    description:
      '米特是一只流浪猫，他的尾巴曾在一场流浪猫战争中受过伤，但它十分勇猛，从不会向敌人认输。',
    maxHp: 325,
    hpRecovery: 1,
    moveSpeed: 750,
    jumpHeight: 420,
    clawKnifeCdHit: 5.4,
    clawKnifeCdUnhit: 3.2,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '胡椒粉和罐头都可用于防守火箭或奶酪，尤其克制舍己救援。',
        additionalDescription: '',
      },
      {
        tagName: '进攻',
        isMinor: true,
        description: '由于胡椒粉和绑火箭霸体的存在，老鼠一旦被抓住很难全身而退。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '10100[12]22',
        weaponType: 'weapon1',
        description:
          '正常7级点三级主动，但如果已经到了最后一块奶酪，可以考虑点饭盒防守。有表哥的阵容建议五级点饭盒。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-击晕', 'S-屈打成招', 'A-穷追猛打', 'A-加大火力'],
        description: '打表哥和幸运车。',
      },
      {
        cards: ['S-击晕', 'S-知识渊博', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '打极端打架队。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'B-皮糙肉厚'],
        description: '传统双烧。',
      },
      {
        cards: ['S-击晕', 'S-乘胜追击', 'B-皮糙肉厚', 'C-猫是液体'],
        description: '打减速队。',
      },
      {
        cards: ['A-穷追猛打', 'B-皮糙肉厚', 'A-加大火力', 'C-猫是液体', 'B-恐吓', 'B-反侦察'],
        description: '死守奶酪。',
      },
    ],
    skills: [
      {
        name: '胡椒粉罐头',
        type: 'active',
        description:
          '掏出胡椒粉罐头，持续对自身造成轻微伤害，米特因此受到“刺激”，增加移速和跳跃速度。再次便用技能将投掷罐头造成伤害。破碎后形成胡椒粉烟雾，持续对范围内角色造成伤害，猫咪在烟雾中会获得“刺激”效果。胡椒粉的效果在停止接触后会残留3秒。胡椒粉罐头在掏出后立刻开始进入CD。',
        detailedDescription:
          '掏出胡椒粉罐头，持续对自身造成轻微伤害，米特因此受到“刺激”，增加移速和跳跃速度。再次便用技能将投掷罐头造成伤害。破碎后形成胡椒粉烟雾，持续对范围内角色造成伤害，猫咪在烟雾中会获得“刺激”效果。胡椒粉的效果在停止接触后会残留3秒。胡椒粉罐头在掏出后立刻开始进入CD。（CD结束后，若未投掷出胡椒粉罐头，可双击技能，胡椒粉会原地向下扔）\n',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description: '可以在手持老鼠时使用，老鼠会掉落并眩晕2秒。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '持续伤害频率更高。猫咪在“刺激”状态下获得减伤50%并提高绑火箭速度50%。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '饭盒陷阱',
        type: 'weapon1',
        description:
          '放下装有食物的饭盒，老鼠踩中或被砸中后，饭盒会爆炸，对附近所有老鼠造成伤害和眩晕，并使其暴露小地图视野、大量减少推速。放置捕鼠夹时，会将其替换成饭盒。可存储两次',
        detailedDescription:
          '放下装有食物的饭盒，老鼠踩中或被投掷物砸中后，饭盒会爆炸，对附近所有老鼠造成伤害和眩晕，并使其暴露小地图视野、大量减少推速，持续10秒。放置捕鼠夹时，会将其替换成饭盒。可存储两次。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description:
              '增加饭盒伤害。爆炸后留下食物，米特触碰后会获得持续Hp恢复效果。大幅提高放置捕鼠夹的效率。', // （连招：击晕接捕鼠夹）
            cooldown: 20,
          },
          {
            level: 3,
            description: '饭盒可存储三次。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '野性迸发',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，根据层数造成额外伤害。在7层野性下绑火箭时会进入6秒强霸体（内置CD：17秒）。',
            detailedDescription:
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，根据层数造成额外伤害。在7层野性下绑火箭时会进入6秒强霸体（内置CD：17秒）。',
          },
          {
            level: 2,
            description:
              '被爪刀命中的老鼠20秒内无法回复生命。此期间被绑上火箭时，需要更多时间才能救下。',
          },
          {
            level: 3,
            description:
              '爪刀命中时，回复伤害等量的生命值；不论是否命中，每消耗一层野性，减少0.3秒爪刀CD。',
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
        description: '律动时间提供增伤和更大的爪刀范围，瑜伽球提供了强力的控制。',
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
      {
        id: '蓄势一击',
        description: '蓄势一击使苏蕊通过球接爪刀可以轻松打死125血老鼠。',
        groups: [
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
            description: '待补充',
          },
          {
            cards: ['S-蓄势一击', 'S-屈打成招', 'A-穷追猛打', 'A-加大火力'],
            description: '待补充',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '待补充',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-攻其不备', 'C-猫是液体'],
            description: '待补充',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '击晕',
        description: '击晕卡组比较适合新手。',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
            description: '待补充',
          },
          {
            cards: ['S-击晕', 'S-屈打成招', 'A-穷追猛打', 'A-加大火力'],
            description: '待补充',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '待补充',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'C-狡诈', 'C-猫是液体'],
            description: '待补充',
          },
        ],
        defaultFolded: true,
      },
      // refer to Tom's livestream replay.
      {
        id: '乘胜追击',
        description: '乘胜卡组有着较高的门槛，但不怕拉扯。',
        groups: [
          {
            cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '待补充',
          },
          {
            cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-越挫越勇'],
            description: '待补充',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-熊熊燃烧', 'C-猫是液体'],
            description: '待补充',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-加大火力', 'B-皮糙肉厚'],
            description: '待补充',
          },
        ],
        defaultFolded: true,
      },
    ],

    skills: [
      {
        name: '律动时间',
        type: 'active',
        aliases: ['跳舞'],
        description:
          '回复Hp，并随着音乐舞动，持续40秒。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为范围更大的[舞动亮相](CD为6秒（未命中）和12秒（命中），伤害为70点)。舞动时每隔13秒出现爱心提示，此时点击技能按钮将回复Hp、提升移速和攻击力。舞动时接触虚弱老鼠将使其自主跟随苏蕊30秒，期间遇到火箭立刻绑上。',
        detailedDescription:
          '回复50Hp，随着音乐舞动，持续40秒。若手中有老鼠，则放下老鼠并使其自主跟随。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为以苏蕊为中心、范围更大的[舞动亮相](CD为6秒（未命中）和12秒（命中），伤害为70点)。舞动时每隔13秒出现爱心提示，此时点击技能按钮将回复30Hp、提升10%移速和15点攻击力。舞动时接触不在捕鼠夹上的虚弱老鼠或刚被击倒的老鼠，将使其自主跟随苏蕊30秒。在此状态下，老鼠无法主动使用技能、移动等操作，但仍能受到伤害和控制，且遇到火箭会立刻绑上。若老鼠与苏蕊距离较远（如钻管道后），则老鼠会解除跟随。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        // 没找到好的技能教学视频
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 40,
          },
          {
            level: 2,
            description: '舞动时受到的伤害减少。',
            detailedDescription: '舞动时固定减伤10点。',
            cooldown: 40,
          },
          {
            level: 3,
            description: '每次成功点击爱心将延长舞动时间。',
            detailedDescription:
              '每次爱心提示出现后成功点击技能按钮将延长舞动时间5秒，总舞动时间变为60秒。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '瑜伽球',
        type: 'weapon1',
        description: '扔出瑜伽球并控制它膨胀，膨胀时使老鼠眩晕并弹飞。',
        detailedDescription:
          '扔出瑜伽球。在瑜伽球飞行过程中苏蕊可再次点击技能键使瑜伽球膨胀，当膨胀时接触到敌方老鼠，则会造成30点伤害、1.5秒眩晕并弹飞，瑜伽球可积累2次使用机会。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
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
            description: '爪刀和舞动亮相命中敌方时将重置瑜伽球的CD。',
            detailedDescription:
              '爪刀和舞动亮相命中敌方时将重置瑜伽球的CD，击中多个敌方将重置多个CD。',
          },
          {
            level: 2,
            description: '虚弱时间减少至2秒。',
            detailedDescription: '虚弱时间减少至2秒，起身时只有100Hp。',
          },
          {
            level: 3,
            description: '易碎道具击中[敌方](含虚弱老鼠)时将重置律动时间的CD。',
            detailedDescription: '易碎道具击中[敌方](含虚弱老鼠)时将重置律动时间的CD。',
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
