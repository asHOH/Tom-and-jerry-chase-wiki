import { AssetManager } from '../lib/assetManager';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition, PartialCharacterDefinition } from './types';

const catCharacterDefinitions: Record<string, CharacterDefinition | PartialCharacterDefinition> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  汤姆: {
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家',

    maxHp: 255,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.25,
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
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
      {
        name: '蓄力重击',
        description: '',
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
          '手型枪水平飞出、飞回，对[命中](飞出、飞回过程均可命中；包括因遇到护盾而提前返回的情况；至多只能抓回并眩晕一只老鼠)的老鼠造成[15点伤害](受攻击力加成)、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，[额外给予70点伤害](可能会产生2-3次伤害，具体成因不详，疑似与墙壁厚度及高低差有关)。眩晕对比例鼠和虚弱的老鼠也生效。手型枪遇到护盾老鼠时，将打破护盾并提前返回。',
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
        detailedDescription:
          '挥锅对命中的老鼠造成15点伤害、5秒失明和55%救援减速；煎蛋也会对命中的老鼠造成15点伤害、5秒失明和55%救援减速；被锅命中的老鼠落地后受到30点伤害，并眩晕1秒。三段伤害均受攻击力加成。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=172.85',
        skillLevels: [
          {
            level: 1,
            description: '',
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
    counters: [
      {
        id: '尼宝',
        description: '汤姆的平底锅可以把尼宝拍飞，打断其救援',
        isMinor: false,
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
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
      {
        name: '全垒打',
        description: '',
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
        canMoveWhileUsing: true,
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
            detailedDescription: '虚弱后更快起身、无敌时间更长。',
          },
          {
            level: 2,
            description: '投掷道具造成额外伤害，造成伤害后将回复Hp，同时提高移速，持续5秒。',
            detailedDescription:
              '投掷道具造成25点额外伤害，造成伤害后将回复Hp，同时提高移速，持续5秒。',
          },
          {
            level: 3,
            description: '爪刀有30%概率直接造成虚弱；技能和道具造成的控制时间增加1秒。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '泰菲',
        description: '布奇的爪刀可以秒泰菲。',
        isMinor: false,
      },
      {
        id: '侦探泰菲',
        description: '布奇的爪刀可以秒侦探泰菲。',
        isMinor: false,
      },
      {
        id: '恶魔泰菲',
        description: '布奇的爪刀可以秒恶魔泰菲。',
        isMinor: false,
      },
      {
        id: '罗宾汉泰菲',
        description: '布奇的爪刀可以秒罗宾汉泰菲。',
        isMinor: false,
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
    clawKnifeCdUnhit: 3.5,
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
        weapon: 2,
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
        description: '这个卡组更偏向娱乐。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '待补充',
      },
    ],
    counters: [
      {
        id: '尼宝',
        description: '托普斯的捕虫网可以直接抓取灵活跳跃后霸体的尼宝，使尼宝很难救人。',
        isMinor: false,
      },
      {
        id: '表演者•杰瑞',
        description: '托普斯的捕虫网可以直接抓取梦幻舞步状态下的表演者•杰瑞。',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
      {
        name: '我生气了！',
        description: '',
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
    clawKnifeCdUnhit: 4.55,
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
        weapon: 1,
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
    specialSkills: [
      {
        name: '蓄力重击',
        description: '',
      },
    ],
    skills: [
      {
        name: '瞬移闪击',
        type: 'active',
        aliases: ['闪现'],
        description: '向前移动一段距离。如果附近有老鼠，可以瞬移到老鼠身后，范围在小地图显示。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可被打断',
        cueRange: '全图可见',
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
              '提高瞬移范围；瞬移到[交互中](包括推奶酪、救队友、在捕鼠夹上挣扎、吃蛋糕，喝牛奶，喝饮料、开纸箱、技能前摇、开关门、推车、推斧头、摇钟、调药水、开监控、采花、摇三角铁、进机械鼠、自起特技)的老鼠身后时，对其造成[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            detailedDescription:
              '提高瞬移范围；瞬移到[交互中](包括推奶酪、救队友、在捕鼠夹上挣扎、吃蛋糕，喝牛奶，喝饮料、开纸箱、技能前摇、开关门、推车、推斧头、摇钟、调药水、开监控、采花、摇三角铁、进机械鼠、自起特技)的老鼠身后时，对其造成2秒[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            cooldown: 8,
          },
        ],
      },
      {
        name: '垃圾桶',
        type: 'weapon1',
        description:
          '放置垃圾桶阻挡老鼠的道路，垃圾桶在受到4次攻击后会摧毁。垃圾桶的异味会使老鼠受到减速和伤害。由此造成伤害时会减少爪刀CD。',
        detailedDescription:
          '放置垃圾桶阻挡老鼠的道路，垃圾桶在受到4次攻击后会摧毁。垃圾桶的异味会使老鼠受到减速和伤害。每造成1次伤害会降低0.6秒爪刀CD，每秒只生效一次。垃圾桶不会对倒地的老鼠造成伤害并降低爪刀CD，在垃圾桶范围内倒地并起身的老鼠不会受到垃圾桶的伤害，但重新进入垃圾桶范围仍会受到伤害。',
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
          '从垃圾桶中倒出咸鱼，鼠方踩到后会受到小幅全属性减益。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD、减少爪刀CD，并回复Hp。瞬移闪击将优先追踪带有咸鱼效果的敌方；手中有老鼠时，则优先追踪最近的咸鱼。',
        detailedDescription:
          '从垃圾桶中倒出咸鱼并标记在小地图上，咸鱼持续一分钟，鼠方踩到后会受咸鱼影响，持续20秒，期间推速降低40%，救援、治疗速度降低33%，移速降低10%，跳跃高度降低（未测），同时暴露小地图位置。可通过吃蛋糕、喝牛奶、喝饮料、特技-治疗、牛仔弹琴来解除。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD，爪刀CD减少至1.9s，并以50/s恢复Hp，持续1s。瞬移闪击将优先追踪带有咸鱼效果的敌方，并大幅提高追踪范围；手中有老鼠时，则优先追踪最近的咸鱼。',
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
            description: '受咸鱼影响的老鼠无法对莱特宁造成眩晕。',
            cooldown: 8,
            detailedDescription: '受咸鱼影响的老鼠无法对莱特宁造成眩晕、且无法自然恢复Hp。',
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

  /* ----------------------------------- 牛仔汤姆 ----------------------------------- */
  牛仔汤姆: {
    description:
      '牛仔汤姆身手敏捷、深藏不露，擅长使用绳索御牛，热爱自由的他，在草原上过着与世无争的生活。',
    maxHp: 225,
    hpRecovery: 2.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '牛的干扰、弹弓的射程及被动的加持使牛汤拥有较强的攻击性。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '翻盘',
        isMinor: false,
        description: '技能的控制抓取与2、3级被动的加持使牛汤拥有极强的翻盘能力。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        isMinor: false,
        description: '压制力随着等级的提高呈现质的飞跃（6 7 8 10级）。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '防守',
        isMinor: false,
        description:
          '斗牛可清理道具并对地方眩晕，2级被动可减少技能CD，在防守时拥有较高的伤害和续航。',
        additionalDescription: '',
        weapon: 2,
      },
    ],
    skillAllocations: [
      {
        id: '鞭子（控制）',
        pattern: '120211200',
        weaponType: 'weapon1',
        description: '以技能的控制和1级被动的快爪刀为主要进攻手段',
      },
      {
        id: '鞭子（高伤）',
        pattern: '120001122',
        weaponType: 'weapon1',
        description: '以3级被动的高伤为主要进攻手段',
      },
      {
        id: '弹弓（常规）',
        pattern: '133030011',
        weaponType: 'weapon1',
        description: '大部分地图常规加点',
      },
      {
        id: '弹弓（牧场）',
        pattern: '303030111',
        weaponType: 'weapon1',
        description: '森林牧场加点，地势平坦，斗牛作用较小',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'S-知识渊博'],
        description: '（鞭子）常规卡组',
      },
      {
        cards: ['S-击晕', 'S-乘胜追击', 'A-细心', 'C-猫是液体'],
        description: '（鞭子）大图及管道图，有需求可以把《细心》换成《皮糙肉厚》',
      },
      {
        cards: ['S-击晕', 'S-知识渊博', 'A-威压', 'B-皮糙肉厚'],
        description:
          '（鞭子）叠层流，对前期节奏处理要求高，有需求可以把《威压》换成《穷追猛打》（转为鞭子打架流）',
      },
      {
        cards: ['S-知识渊博', 'A-熊熊燃烧', 'A-细心', 'A-穷追猛打'],
        description: '（弹弓防守流）常规卡组',
      },
      {
        cards: ['S-知识渊博', 'A-细心', 'A-穷追猛打', 'B-皮糙肉厚', 'B-反侦察'],
        description: '（弹弓防守流）反侦察',
      },
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'A-加大火力', 'A-穷追猛打'],
        description: '（弹弓追击流）常规卡组',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description:
          '（弹弓追击流）打架队，如果同时是管道图，《熊熊燃烧》换成《加大火力》或《心灵手巧》（打强控制队）+《猫是液体》',
      },
    ],
    skills: [
      {
        name: '斗牛',
        type: 'active',
        aliases: ['牛哥'],
        description:
          '释放斗牛，破坏[易碎道具](包括牛仔杰瑞的仙人掌)，并对老鼠造成伤害和[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
        detailedDescription:
          '释放斗牛，破坏[易碎道具](包括牛仔杰瑞的仙人掌)，并对老鼠造成25伤害和1.5秒[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '斗牛持续12秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '斗牛持续时间延长至20秒。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '延长斗牛造成的眩晕时间。',
            cooldown: 18,
            detailedDescription: '斗牛造成的眩晕时间延长至2.9秒。',
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '鞭子',
        type: 'weapon1',
        description:
          '对前方老鼠造成1点伤害和减速。连续命中敌方角色两次后获得1层[增益](上限5层)，永久增加移速和减少爪刀CD。老鼠被累计命中两次后，受到伤害和眩晕效果，眩晕期间可被直接抓取。',
        detailedDescription:
          '前摇0.25s，对前方老鼠造成1点伤害和持续7.9秒的9.5%减速、给自己持续8秒的1%加速和减少2%爪刀CD。连续命中敌方角色两次后获得1层[增益](上限5层)，永久增加3%移速和6%减少爪刀CD。老鼠被累计命中两次后，受到50点伤害和2.4秒眩晕效果，并清除鞭子带来的减益。鞭子眩晕期间可被直接抓取。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 3.5,
          },
          {
            level: 2,
            description: '鞭子命中老鼠后，会使老鼠缓慢减少Hp，同时附带更强的减速效果。',
            cooldown: 3.5,
            detailedDescription: '鞭子命中老鼠后，会使老鼠以3/s失去Hp，同时附带更强的减速效果。',
          },
          {
            level: 3,
            description: '减少CD；使用鞭子额外提升斗牛持续时间。',
            cooldown: 2.5,
            detailedDescription: '减少CD至2.5s；使用鞭子额外提升斗牛1秒持续时间。',
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '仙人掌弹弓',
        type: 'weapon2',
        description: '',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description: '向前发射三颗小仙人掌球，命中时造成伤害和受伤状态、获得老鼠的小地图位置。',
            detailedDescription:
              '向前喇叭形发射三颗小仙人掌球，命中时造成26伤害和受伤状态、获得老鼠的小地图位置4.85秒，同时自身获得持续5.85秒的12%加速。小仙人掌球最多存在1.5秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '7秒内可进行第二次发射，向前更大角度内发射五颗小仙人掌球。',
            cooldown: 18,
            detailedDescription: '7秒内可进行第二次发射，向前更大角度内发射五颗小仙人掌球。',
          },
          {
            level: 3,
            description:
              '7秒内可进行第三次发射，发射一颗大仙人掌球，在碰触实体时爆炸，对周围的敌方造成伤害和眩晕，同时分裂成10颗小仙人掌球飞向不同方向。',
            cooldown: 18,
            detailedDescription:
              '7秒内可进行第三次发射，发射一颗大仙人掌球，在碰触实体时爆炸，对周围的敌方造成(60点伤害](不造成受伤)和3.5秒眩晕，同时分裂成10颗小仙人掌球飞向不同方向。',
          },
        ],
        cancelableAftercast: ['跳跃键', '移动键', '道具键'],
        cooldownTiming: '前摇前',
        aliases: ['加特林'],
        cueRange: '本房间可见',
        canHitInPipe: false,
      },
      {
        name: '游刃有余',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '技能命中老鼠后，降低爪刀CD。',
            detailedDescription: '技能命中老鼠后，降低3秒爪刀CD。',
          },
          {
            level: 2,
            description: '技能额外附加受伤状态；使老鼠进入虚弱状态时，减少主动和武器技能CD。',
            detailedDescription:
              '技能额外附加受伤状态；使老鼠进入虚弱状态时，减少12秒主动和武器技能CD。',
          },
          {
            level: 3,
            description: '爪刀和道具可直接击倒受伤状态的老鼠。',
            detailedDescription: '爪刀和道具击中受伤状态的老鼠，额外附加200点伤害。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '侦探泰菲',
        description: '侦探泰菲的分身会触发牛仔汤姆的2级被动，大幅减少技能CD',
        isMinor: false,
      },
      {
        id: '佩克斯',
        description:
          '牛仔汤姆可用技能控制直接抓取，佩克斯3级被动复活甲和主动技能给予的免疫虚弱基本无效',
        isMinor: true,
      },
      {
        id: '表演者•杰瑞',
        description: '牛仔汤姆的3级被动可以压制表演者•杰瑞。',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '剑客泰菲',
        description:
          '剑客泰菲的头盔可以抵挡牛仔汤姆的攻势，长枪的禁用技能可以大幅削弱牛仔汤姆的攻击力',
        isMinor: false,
      },
      {
        id: '罗宾汉泰菲',
        description:
          '牛仔汤姆缺乏霸体能力，并且机动性较差，可被罗菲连续控制或拉扯。罗菲的高低差爬树和高额恢复还克制弹弓和斗牛的远程消耗。',
        isMinor: false,
      },
      {
        id: '剑客杰瑞',
        description: '（仅限二武）剑客杰瑞的格挡使斗牛立即消失（梗：我不吃牛肉）',
        isMinor: false,
      },
      {
        id: '米可',
        description:
          '米克采访期间免控、有高额减伤，且牛仔汤姆每次释放技能都会被米可叠素材（弹弓会被叠多层）',
        isMinor: false,
      },
      {
        id: '天使杰瑞',
        description:
          '牛汤的弹弓一段命中有三级被动的天杰后，无法使用后两段弹弓，从而强推最后一块奶酪。',
        isMinor: false,
      },
      {
        id: '尼宝',
        description: '尼宝的主动技能免疫控制',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '技能与自身无霸体效果（推荐使用）',
      },
      {
        name: '蓄力重击',
        description: '斗牛撞击及大仙人掌球可造成眩晕效果，与蓄力重击有一定配合',
      },
    ],
    aliases: ['牛汤'],
  },

  /* ----------------------------------- 图多盖洛 ----------------------------------- */
  图多盖洛: {
    description: '拥有惊人美貌的图多盖洛是上东区和知名度最高的千金小姐，他的追求者从纽约排到了巴黎',
    maxHp: 230,
    hpRecovery: 2,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 3.5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '香水有强悍的后期防守强度',
        additionalDescription: '',
        weapon: 1,
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '指甲油的高频率霸体有强大的打架能力',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '后期',
        isMinor: false,
        description: '图多后期有高额伤害和打架能力',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '指甲油和被动的后期强度有一定的翻盘能力',
        additionalDescription: '',
        weapon: 2,
      },
    ],
    skillAllocations: [
      {
        id: '魅力香水',
        pattern: '121221000',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '魅力甲油-无击晕',
        pattern: '133131000',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '无击晕常见配卡。',
      },
      {
        id: '魅力甲油-击晕',
        pattern: '033030111',
        weaponType: 'weapon1',
        description: '击晕流常见配卡',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'S-击晕'],
        description: '指甲油，在前中后期都有较高强度',
      },
      {
        cards: ['S-乘胜追击', 'C-猫是液体', 'S-知识渊博', 'A-熊熊燃烧'],
        description: '指甲油，适合森林牧场，太空堡垒三等管道图',
      },
      {
        cards: ['S-猛攻', 'A-熊熊燃烧', 'A-细心', 'S-知识渊博'],
        description: '指甲油，适合可以布局的图使用，后期拥有更强的防守翻盘能力',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
        description: '香水指甲油通用，常规追击卡组',
      },
      {
        cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'B-皮糙肉厚', 'B-捕鼠夹'],
        description: '香水，香水图多常规防守卡组',
      },
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'S-猛攻', 'B-反侦察'],
        description: '指甲油，双经验卡成型更快，后期更强势',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '通用',
      },
      {
        name: '蓄力重击',
        description: '绑定击晕',
      },
      {
        name: '全垒打',
        description: '高爆发能力',
      },
      {
        name: '我生气了',
        description: '提高输出',
      },
      {
        name: '急速翻滚',
        description: '提高机动性',
      },
    ],
    skills: [
      {
        name: '魅惑之吻',
        type: 'active',
        description:
          '（本角色文案待完善）释放一个飞吻，命中老鼠后，其移动、推奶酪等行为期间会受到持续伤害；受到[控制](包括碎片的僵直)将解除被吻效果；飞吻可被护盾和部分地形阻挡。', // 图多的破盾手段，增强图多的消耗能力
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键', '药水键', '道具键'],
        cancelableAftercast: ['道具键'],
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '吻可以储存两个，被吻命中的老鼠额外受到减速。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '被吻命中的老鼠无法使用技能。',
            cooldown: 15,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '魅力香水',
        type: 'weapon1',
        description: '释放香水区域，香水内老鼠移动、跳跃、攻击、Hp恢复、推速下降。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '释放12次香水区域',
            cooldown: 16,
          },
          {
            level: 2,
            description: '释放次数增加到18次；香水内图多爪刀伤害和频率提升；提高对老鼠的减益效果。',
            cooldown: 16,
          },
          {
            level: 3,
            description: '增强香水内图多获得的增益效果；老鼠在香水内无法使用技能。',
            cooldown: 16,
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放时',
        cueRange: '全图可见',
      },
      {
        name: '魅力甲油',
        type: 'weapon2',
        description: '获得3次甲油强化的爪刀，获得额外爪刀判定范围，命中老鼠将造成少量伤害。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 10,
          },
          {
            level: 2,
            description:
              '强化爪刀命中后回复Hp、增加移速和交互速度，可叠加三层，持续12秒；再次命中重置持续时间。',
            cooldown: 10,
          },
          {
            level: 3,
            description:
              '爪刀命中获得10秒强霸体；强化爪刀第一次命中老鼠时，其下次落地时移动和跳跃受到短暂限制。',
            cooldown: 10,
          },
        ],
      },
      {
        name: '香水美人',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '免疫反向效果，遇到道具香水或武器技能香水获得加速。',
          },
          {
            level: 2,
            description: '爪刀命中额外施加反向；增加甲油额外爪刀判定范围的伤害。',
          },
          {
            level: 3,
            description: '爪刀命中额外使目标在一段时间内持续减少Hp。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '航海士杰瑞',
        description: '图多六级后霸体无视海盗控制；海盗缺乏有效自保手段',
        isMinor: false,
      },
      {
        id: '米可',
        description: '图多大后期点出三级吻，对米可有一定威胁',
        isMinor: true,
      },
      {
        id: '蒙金奇',
        description: '图多大后期点出三级吻，可克制蒙金奇',
        isMinor: true,
      },
    ],
    aliases: ['牢图', '母猫'],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞的烟雾弹克制一切防守猫',
        isMinor: false,
      },
      {
        id: '国王杰瑞',
        description: '图多的甲油缺少破盾手段，被护盾克制',
        isMinor: false,
      },
      {
        id: '剑客泰菲',
        description: '剑客泰菲拥有长时间的群体无敌，克制一切防守猫',
        isMinor: false,
      },
      {
        id: '尼宝',
        description: '尼宝武器技能无视图多的霸体、主动技能可以轻松救人',
        isMinor: false,
      },
      {
        id: '仙女鼠',
        description: '仙女鼠武器技能无视霸体，后期拥有高强度干扰能力',
        isMinor: true,
      },
      {
        id: '米可',
        description: '米可拥有高额减伤，图多打不死',
        isMinor: true,
      },
      {
        id: '玛丽',
        description: '扇子作为有效破局手段，主动技能可以禁用图多的核心爪刀',
        isMinor: true,
      },
      {
        id: '表演者•杰瑞',
        description: '后期高血量且很难被放飞，克制图多的死守',
        isMinor: true,
      },
      {
        id: '天使杰瑞',
        description:
          '当图多吻到有三级雷云的天使杰瑞，天使杰瑞可以通过持续移动并且保持血量的方式，使雷电不断锁定图多',
        isMinor: true,
      },
    ],
  },

  /* ----------------------------------- 侍卫汤姆 ----------------------------------- */
  侍卫汤姆: {
    description: '侍卫汤姆始终守护在皇宫内，负责保护国王的安全。',
    maxHp: 270,
    hpRecovery: 1.67,
    moveSpeed: 745,
    jumpHeight: 420,
    clawKnifeCdHit: 5.5,
    clawKnifeCdUnhit: 2.2,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '翻盘',
        isMinor: false,
        description: '三被动减控免死，三级炮有一定强度，有一定的翻盘能力',
        additionalDescription: '',
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '一被动加速，炮打中后加速，警戒能看到老鼠位置。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        isMinor: false,
        description: '3级炮成型后，侍卫的强度才开始体现',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '3级炮提供的守奶酪以及墙缝能力很强',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '皇家火炮',
        pattern: '122020011',
        weaponType: 'weapon1',
        description:
          '用炮给的盾强上火箭，有3级炮的侍卫在防守奶酪/墙缝/火箭时候比无3级炮有2被的侍卫优势大很多',
        additionaldescription: '先点三级炮还是先点被动取决于炮的准度，老鼠的血量上限以及局势',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '蓄势一击',
        groups: [
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-心灵手巧', 'A-穷追猛打'],
            description: '适合新手入门。',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-心灵手巧', 'A-加大火力'],
            description: '常用卡组。',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-心灵手巧', 'B-皮糙肉厚'],
            description: '打高伤阵容，如剑杰、朵朵。',
          },
        ],
        description: '蓄势一击配合侍卫二级被动可以打死125血血厚老鼠',
        defaultFolded: false,
      },
      {
        cards: ['A-熊熊燃烧', 'A-心灵手巧', 'A-细心', 'A-加大火力', 'C-猫是液体'],
        description: '牧场专用',
      },
      {
        id: '击晕',
        description: '待补充',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-细心', 'C-猫是液体', 'C-狡诈'],
            description: '',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'A-心灵手巧'],
            description: '',
          },
        ],
        defaultFolded: true,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
    ],
    skills: [
      {
        name: '警戒',
        type: 'active',
        videoUrl: 'https://www.bilibili.com/video/BV1JquQzHEyJ?t=61.8',
        aliases: ['瞪', '望', '远视'],
        description:
          '大幅提高视野范围，并警戒房间内所有老鼠。被警戒的老鼠推速下降50%、暴露小地图视野，并清除部分增益。若警戒到老鼠，额外获得加速；若未警戒到，则返还15s冷却。',
        detailedDescription:
          '前摇1.31秒，大幅提高视野范围，并警戒房间内[所有老鼠](距离极远的除外)。被警戒到的老鼠推速下降50%，暴露小地图视野，并清除[部分增益](所有药水；侦探杰瑞、侦探泰菲的隐身；大部分护盾效果，如知识卡、角色技能的护盾（罗菲2被与恶魔传送门的盾不会被消除）；部分无敌效果，如无畏、舍己、国王护盾、莉莉二被；米雪儿小情绪的变大；仙女鼠星星与二被的隐身；红花；太空药水仓的跳跃提升、变大和隐身；熊猫谷药水仓的兴奋；天宫香炉的远视)。若警戒到老鼠，额外获得20%加速；若未警戒到，则返还15s冷却。使用降落伞中的罗宾汉不会被警戒到。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键', '跳跃键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 20,
          },
          {
            level: 3,
            description:
              '警戒到至少两只老鼠时，额外增加爪刀范围\n警戒到至少三只时，额外减少爪刀CD\n警戒到四只时，Hp上限额外增加。',
            cooldown: 20,
            detailedDescription:
              '警戒到至少两只老鼠时，额外增加爪刀范围18.7%\n警戒到至少三只时，额外减少50%爪刀CD\n警戒到四只时，Hp上限额外增加100点',
          },
        ],
        canHitInPipe: true,
      },
      {
        name: '皇家火炮',
        type: 'weapon1',
        videoUrl: 'https://www.bilibili.com/video/BV1JquQzHEyJ?t=129.6',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        description:
          '原地召唤皇家火炮，对附近老鼠造成短暂眩晕和少量伤害，侍卫汤姆获得短暂的两层护盾。火炮存在期间，可以拖动技能键操纵火炮发射，命中时对老鼠造成眩晕和伤害，同时侍卫汤姆获得大幅加速和护盾。',
        detailedDescription:
          '前摇0.684秒，原地召唤皇家火炮，对附近老鼠造成0.93秒眩晕及10点伤害，侍卫汤姆获得两层护盾，持续1.95秒。火炮存在期间，侍卫汤姆可以自由活动，拖动技能键操纵火炮发射，命中时对老鼠造成0.56秒眩晕和50点伤害、移除其[部分增益](隐身、兴奋、远视；天宫图香炉的远视；除了尼宝三级翻滚和魔术师三级卡牌以外的技能与被动隐身)；同时侍卫汤姆加速49%并获得两层护盾，效果持续2.96秒',
        skillLevels: [
          {
            level: 1,
            description: '火炮能射击三次。',
            cooldown: 45,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '火炮能射击七次；对命中的老鼠额外施加短暂减速、禁用其技能和道具键。',
            cooldown: 25,
            detailedDescription:
              '火炮能射击七次；对命中的老鼠额外施加减速、禁用其技能和道具键3.5秒。',
          },
        ],
        cancelableSkill: ['道具键', '跳跃键'],
      },
      {
        name: '随机应变',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1JquQzHEyJ?t=23.8',
        skillLevels: [
          {
            level: 1,
            description: '[附近](半径范围2481内)有老鼠时获得加速。',
            detailedDescription: '[附近](半径范围2481内)有老鼠时加速15%。',
          },
          {
            level: 2,
            description: '当[附近](半径范围1757内)老鼠数量为1或2只时，增加攻击力与爪刀频率。',
            detailedDescription:
              '当[附近](半径范围1757内)老鼠数量为1或2只时，增加25点攻击力，爪刀CD减少25%。',
          },
          {
            level: 3,
            description:
              '[附近](半径范围2057内)大于2只老鼠时，Hp回复速度增加，减少50%受控时间并免死',
            detailedDescription:
              '[附近](半径范围2057内)大于2只老鼠时，Hp回复速度提升至10/s，减少50%受控时间并免死。',
          },
        ],
      },
    ],
    aliases: [],
    counters: [
      {
        id: '泰菲',
        description: '',
        isMinor: false,
      },
      {
        id: '米雪儿',
        description: '',
        isMinor: false,
      },
      {
        id: '侦探杰瑞',
        description: '侍卫汤姆的警戒会导致侦探杰瑞的隐身失效，且降低推速',
        isMinor: false,
      },
      {
        id: '杰瑞',
        description: '',
        isMinor: false,
      },
      {
        id: '恶魔泰菲',
        description: '',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '剑客泰菲',
        description: '',
        isMinor: false,
      },
      {
        id: '罗宾汉泰菲',
        description: '',
        isMinor: false,
      },
      {
        id: '尼宝',
        description: '',
        isMinor: false,
      },
      {
        id: '魔术师',
        description: '',
        isMinor: false,
      },
      {
        id: '航海士杰瑞',
        description: '',
        isMinor: false,
      },
      {
        id: '米可',
        description: '',
        isMinor: false,
      },
    ],
  },

  /* ----------------------------------- 图茨 ----------------------------------- */
  图茨: {
    aliases: ['小黄'],
    description:
      '图茨拥有娇小的身材和靓丽的脸庞，因为被富养，她性格可爱温柔，图茨是汤姆的女朋友之一，广受所有猫和老鼠的喜爱。',
    maxHp: 225,
    hpRecovery: 4.5,
    moveSpeed: 740,
    jumpHeight: 420, // FIXME: 梦回说跟托普斯一样是467.6、其他猫是481.7，但靠谱吗？
    clawKnifeCdHit: 2.5,
    clawKnifeCdUnhit: 2,
    clawKnifeRange: 200,
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
    counters: [
      {
        id: '国王杰瑞',
        description: '图茨的喵喵叫能快速破盾，使国王杰瑞很难单独救人。',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
    ],
    skills: [
      {
        name: '喵喵叫',
        type: 'active',
        description:
          '按住技能键持续喵喵叫，期间可以移动并使用爪刀和特技霸体，附近老鼠不断叠加减速层数，每到五层时造成60点伤害和眩晕。被打断或取消会按比例返还CD。',
        detailedDescription:
          '前摇0.6s，按住技能键持续喵喵叫，期间可以移动并使用爪刀和特技霸体，周围半径1000范围内老鼠不断叠加减速层数，每层减速将使老鼠移速和跳跃速度降低8%，并暴露小地图视野。每到五层时造成60点伤害并眩晕2s，并清空减速层数。被打断或取消会按比例返还CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description: '叠层数频率为[0.5s](最高叠加5层)。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '减少CD；叠层数频率提升至[0.4s](最高可叠6层)。',
            cooldown: 15,
            detailedDescription: '减少CD至15s；叠层数频率提升至[0.4秒](最高可叠6层)。',
          },
          {
            level: 3,
            description: '叠层数频率提升至[0.3s](最高可叠11层)。',
            cooldown: 15,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '防狼锤',
        type: 'weapon1',
        aliases: ['锤子'],
        description: '挥动防狼锤，造成少量伤害和一层减速。',
        detailedDescription:
          '前摇0.3s，后摇0.4s，挥动防狼锤，对前方范围300内的老鼠造成5伤害和一层减速，移动和跳跃速度降低30%（最多降低90%），减速叠至五层时造成60点伤害并眩晕2s。使用时会因惯性向前移动一小段距离，自身受到10伤害。血量低于10时不能使用防狼锤。',
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
            description: '命中额外造成长时间沉默。',
            cooldown: 0.5,
            detailedDescription: '命中额外造成6.9s沉默。',
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 0.1,
            detailedDescription: '减少CD至0.1s。',
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '汽水罐',
        type: 'weapon2',
        description:
          '向任意方向扔出汽水罐。若未命中，达到终点后开始旋转，持续20秒。汽水罐听到喵喵叫将会提高运动速度和半径。命中老鼠或另一个汽水罐时，对小范围内所有老鼠造成少量伤害和冰冻。',
        detailedDescription:
          '前摇0.5s，向任意方向扔出汽水罐，飞行速度1500。若未命中，飞行1.2s后开始旋转，盘旋路线半径250，飞行速度1000，持续20s。喵喵叫范围内盘旋的汽水罐运动速度每秒提升50，半径每秒增加200，喵喵叫结束后速度和半径将逐渐恢复正常。命中时，对半径175范围所有老鼠造成15伤害、[两层喵喵叫减速](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)和3s冰冻。两个汽水罐相撞将产生更大范围的冰爆，对半径350范围内所有老鼠造成造成30伤害、[四层喵喵叫减速](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)和3s冰冻。由于汽水罐而被施加[大于五层减速](如已有4层减速时被汽水罐命中，将达到6层减速)的老鼠，每多出一层都将额外受到一次60点伤害(5层为正常的60伤害，6层总共120伤害，以此类推)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键', '其他技能键'],
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
              '汽水罐自然消失或相撞会形成特殊冰面，鼠滑到会进入[脆弱状态](放下道具，推速降低33%，救援速度降低73%，并暴露小地图位置，持续8s)，图茨滑到则会获得爆发性加速。',
            cooldown: 12,
            detailedDescription:
              '汽水罐自然消失或相撞会形成特殊冰面(最多存在60s，被踩踏3次或持续时间结束后消失)。鼠滑到会进入[脆弱状态](放下道具，推速降低33%，救援速度降低73%，并暴露小地图位置，持续8s)，图茨滑到会获得100%加速，持续3s。',
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 8,
            detailedDescription: '减少CD至8s。',
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
              '小地图不会显示图茨的位置；开关门不会有声音；处于同一房间时，不会使老鼠胆怯。',
            detailedDescription:
              '小地图不会显示图茨的位置，但是老鼠喝远视或图茨手握老鼠时还是会出现在小地图上；开关门不会有声音；处于同一房间时，不会使老鼠胆怯。',
          },
          {
            level: 2,
            description: '血量不满时，可连续挥爪三次，并提高爪刀频率。',
            detailedDescription: '血量不满时，可连续挥爪三次，空刀、实刀CD降低40%。',
          },
          {
            level: 3,
            description: '血量不满时，减少技能CD。',
            detailedDescription: '血量不满时，技能CD减少40%。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 米特 ----------------------------------- */
  米特: {
    description:
      '米特是一只流浪猫，他的尾巴曾在一场流浪猫战争中受过伤，但他十分勇猛，从不会向敌人认输。',
    maxHp: 325,
    hpRecovery: 1,
    moveSpeed: 750,
    jumpHeight: 420,
    clawKnifeCdHit: 5.5,
    clawKnifeCdUnhit: 3.3,
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
    counters: [
      {
        id: '国王杰瑞',
        description: '米特的胡椒粉罐头能快速破盾，使国王杰瑞很难单独救人。',
        isMinor: false,
      },
      {
        id: '泰菲',
        description: '米特在七层野性后能够一刀秒泰菲及其他74点血的老鼠。',
        isMinor: false,
      },
      {
        id: '莱恩',
        description:
          '米特在六层野性后能够一刀秒莱恩，而且米特被变线条猫后，不会掉落胡椒粉，还能减少爪刀CD。然而莱恩也是为数不多可以破胡椒粉守火箭的干扰型角色。',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
      {
        name: '应急治疗',
        description: '',
      },
    ],
    skills: [
      {
        name: '胡椒粉罐头',
        type: 'active',
        description:
          '掏出胡椒粉罐头，自身持续受到轻微伤害，并因此获得“刺激”状态，增加移速和跳跃速度。再次使用技能将投掷胡椒粉、造成伤害并形成胡椒粉烟雾，持续对范围内角色造成伤害。米特在烟雾中也会获得“刺激”状态。',
        detailedDescription:
          '掏出胡椒粉罐头，自身持续受到轻微伤害，并因此获得“刺激”状态，增加移速和跳跃速度。再次使用技能将投掷胡椒粉、造成伤害，落地后破碎并形成胡椒粉烟雾，[持续对范围内角色造成伤害](不会破米特的护盾)、在停止接触后会残留约3秒。米特在烟雾中也会获得“刺激”状态。胡椒粉在掏出后立刻进入CD；CD冷却完成后，若未投掷出胡椒粉，可双击技能，胡椒粉会原地向下扔。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '在手持老鼠时无法使用。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '可以在手持老鼠时使用，老鼠会掉落并眩晕2秒。',
            detailedDescription:
              '可以在手持老鼠时使用，老鼠会掉落并眩晕2秒。掉落2秒后老鼠会被禁用技能并大幅减速。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '持续伤害频率更高。猫咪在“刺激”状态下获得50%减伤并提高绑火箭速度50%。',
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
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，每层野性造成4点额外伤害。在7层野性下绑火箭时会进入6秒强霸体（内置CD：17秒）。',
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

  /* ----------------------------------- 塔拉 ----------------------------------- */
  塔拉: {
    description: '塔拉是西部最美丽的牛仔母猫，她拥有俏丽的脸庞和苗条的身姿，吸引了无数人的目光。',
    maxHp: 250,
    hpRecovery: 2.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 0, //FIXME
    catPositioningTags: [
      {
        tagName: '速通',
        isMinor: false,
        description: '武器技能可甩火箭',
        additionalDescription: '配合熊熊燃烧，7秒火箭可直接甩',
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '要移速有移速，要视野有视野，要霸体有霸体',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '022001112',
        weaponType: 'weapon1',
        description:
          '开局搜刮远视药水，利用远视药水可以不急点二被，优先点出来2级绳索。抓到老鼠尽可能手绑火箭。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
        description: '传统蓄势流，细心可换穷追猛打或加大火力。现版本压力较大建议击晕流。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'A-加大火力'],
        description: '击晕流：现版本主流卡组。加大可换穷追，根据角色地图决定。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
        description: '猫液卡组。',
      },
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '建议地图：游乐场，御门酒店。注意没皮糙容易倒地，造成乘胜层数减少。',
      },
    ],
    specialSkills: [
      {
        name: '蓄力重击',
        description: '',
      },
      {
        name: '绝地反击',
        description: '',
      },
    ],
    skills: [
      {
        name: '西部情谊',
        type: 'active',
        description: '向前施放爱意，造成少量伤害。对男性角色及背对塔拉的角色有更强的效果。',
        detailedDescription:
          '向前施放爱意，造成少量伤害。根据性别和相对塔拉的朝向而产生不同的效果:\n男性背对：增加本技能伤害，并使其一段时间内每隔3秒受到僵直\n男性正对或女性背对：额外给予其短暂减速。\n女性正对：额外给予其短暂加速。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '大幅增加有效范围。',
            cooldown: 10,
          },
        ],
        canHitInPipe: false,
        videoUrl: 'https://nie.v.netease.com/nie/2021/0128/a9211df79cfb9d8e230ad83a90b97a0f.mp4',
      },
      {
        name: '牛仔鞭索',
        type: 'weapon1',
        description:
          '拖动技能，在面前135度的范围内甩出套索，对老鼠造成伤害和减速；再次点击按钮，塔拉将冲向该老鼠位置。当塔拉手中抓有老鼠时，本技能改为扔出老鼠，老鼠碰到火箭直接绑上，但[不减少引线时间](二级被动和知识卡不受影响)。',
        detailedDescription:
          '拖动技能，在面前135度的范围内甩出套索，对老鼠造成伤害和减速；再次点击按钮，塔拉将冲向该老鼠位置。当塔拉手中抓有老鼠时，本技能改为扔出老鼠，期间老鼠无敌、碰到火箭直接绑上，但[不减少引线时间](二级被动和知识卡不受影响)；绳索可以套中机械鼠、护盾，但无伤害。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description: '套索命中附加眩晕并提升塔拉的移速。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '减少CD；将老鼠投掷到火箭上时将回复Hp并获得短暂加速。',
            cooldown: 8,
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        videoUrl: 'https://nie.v.netease.com/nie/2021/0128/e7bb5707361018eab342fdf2b832f510.mp4',
      },
      {
        name: '心思缜密',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '根据场上男性角色的数量提升移速和Hp上限。',
            detailedDescription: '',
          },
          {
            level: 2,
            description: '永久[扩大视野范围](覆盖其他远视效果)；绑或扔火箭额外减少2秒引线时间。',
            detailedDescription: '',
          },
          {
            level: 3,
            description: '攻击男性角色使自己获得短暂的霸体，期间缓慢恢复Hp。',
          },
        ],
        description: '',
      },
    ],
    counteredBy: [
      {
        id: '牛仔杰瑞',
        description: '牛仔一被减控，很克制塔拉，移速高不好抓；必ban角色。',
        isMinor: false,
      },
    ],
  },

  /* ----------------------------------- 剑客汤姆 ----------------------------------- */
  剑客汤姆: {
    description: '拥有超群剑术的大师剑客汤姆，是法国万千少女心中的偶像。',
    aliases: ['剑汤'],
    maxHp: 270,
    attackBoost: 0,
    hpRecovery: 1.5,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 8,
    clawKnifeCdUnhit: 2.64,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动技能以及三被可打出高额伤害。',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: false,
        description: '[武器技能](尤其是二武)拥有极强的守火箭能力。',
        additionalDescription: '二武连无敌也能卷走，克制大多数救人位。',
      },
      {
        tagName: '速通',
        isMinor: false,
        description: '猫方第一的放飞速度。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '后期三被刷新主动技能拥有极高的上限，可能成为翻盘的点。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '剑盾',
        pattern: '101001222',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '剑舞',
        pattern: '101300133',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '老776，管道不重要时用',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '常用',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
        description: '管道重要时用',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '无击晕，新手勿用',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '',
      },
    ],
    skills: [
      {
        name: '骑士连斩',
        type: 'active',
        aliases: ['冲刺'],
        description:
          '向前冲刺，期间无敌，若命中敌方将造成少量伤害、大幅降低其移速和跳跃高度，且可在短时间内使用二段技能[挑飞](无视护盾和部分无敌效果)；若挑飞老鼠，可使用三段技能追踪到老鼠位置进行[连斩](无视护盾、霸体和无敌效果)，使老鼠减少Hp且无法移动，但可以使用技能和交互。快速点击技能键可加速连斩。被连斩的老鼠受到威慑效果，被绑上火箭时，引线将额外减少10s。',
        detailedDescription:
          '向前冲刺2s，期间无敌、移速提升75%，若命中敌方将造成10伤害、使其移速降低25%，跳跃高度降低50%，持续3s。冲刺时遇到正常、虚弱、护盾、霸体和[部分无敌效果](罗宾汉降落伞、剑杰格挡、剑菲冲刺、冰冻保鲜特技、变大)的老鼠均可解锁二段技能挑飞，否则技能进入CD。解锁后可在6s内使用二段技能[挑飞](前摇0.35s，可用道具键、其他技能键取消释放；无视护盾和除罗宾汉杰瑞的降落伞，剑客泰菲的冲刺、变大外的其他无敌效果，但不能挑飞霸体老鼠)，向上挑飞脚下的老鼠，对老鼠造成1.9s眩晕并击飞1s。若挑飞老鼠，可在6s内使用三段技能[追踪到老鼠位置](以2000速度飞向敌方，飞行最大时间0.6s，若发生以下情形将不会释放连斩：超过最大飞行时间，被打断，被墙体、拳头盒子、嫦娥阻挡，老鼠在自己下方（泰菲家族由于模型小，若与剑汤站在同一水平面则无法连斩）)进行[连斩](无视护盾、霸体和无敌效果；期间只会受到天使泰菲反伤和可击中管道中的角色的技能伤害)。连斩持续3.1秒，会使[范围内的老鼠](不包括手中的老鼠)浮空4.2秒、每0.55秒受到10点[真实伤害](无法被护盾、无敌抵消（例外：如果该伤害将导致虚弱，则不会进入虚弱，而是破盾并保留0Hp）)，总共5次。连斩期间老鼠无法移动，但可以使用技能和交互。无法打爆机械鼠。[快速点击可加速连斩](每次点击使连斩持续时间减少0.5s，同时老鼠浮空时间减少0.5s，并且总共至多额外造成两次伤害)。连斩后摇0.8s，可用道具键取消。连斩造成两次伤害后会使老鼠受到[威慑效果](绑上火箭后消失)，被绑上火箭时，引线将额外减少10s。挑飞和连斩[在空中释放](不是跳斩)将直接进入CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: ['道具键', '其他技能键'],
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 28,
          },
          {
            level: 2,
            description: '减少CD；连斩后极大提高绑火箭速度，持续一段时间。',
            cooldown: 18,
            detailedDescription:
              '减少CD至18s；连斩后绑火箭速度提升500%（只需0.29s绑火箭），持续20s。',
          },
          {
            level: 3,
            description: '增加连斩的伤害。',
            detailedDescription:
              '每段连斩伤害增加至13点（慢斩总伤害提高至65，快斩总伤害提高至91）。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '剑盾防御',
        type: 'weapon1',
        description:
          '举起剑，扩大视野并阻挡面朝方向的道具攻击。再次点击技能，可反弹前方飞行中的道具。跳跃和落下将取消防御状态。',
        detailedDescription:
          '举起剑，7.9s内[视野扩大至原来的2倍](但移除其他远视效果)，阻挡面朝方向的道具攻击。再次点击技能，可反弹前方250~750范围内飞行中的道具，无前摇，后摇0.9s，可用道具键取消。跳跃和落下将取消防御状态。若防御期间没有阻挡或反弹任何道具，则在取消时[返还一半CD](实际为CD降低至10s/6s)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: ['道具键*', '道具键'],
        skillLevels: [
          {
            level: 1,
            description: '防御期间，移速降低30%。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD；防御期间不再减速。',
            detailedDescription: '减少CD至12s；防御期间不再减速。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '剑盾防御无时间限制。',
            detailedDescription: '[剑盾防御无时间限制](实际为持续时间延长至16m30s)。',
            cooldown: 12,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '旋刃剑舞',
        type: 'weapon2',
        description:
          '点击技能，释放三段剑舞。一段旋刃突击，旋转着向前突进，并带走[碰到的敌方](无视敌方任何状态)；二段剑刃重击，对附近的敌方造成短暂眩晕；三段剑舞劈砍，对劈砍位置周围的敌方造成伤害、击退和眩晕，命中时将减少骑士连斩的CD。每段分别可与骑士连斩相互衔接释放。',
        detailedDescription:
          '点击技能，释放三段剑舞。一段旋刃突击，前摇0.3s，旋转着向前突进，并带走[碰到的敌方](无视敌方任何状态)；6s内可释放第二段剑刃重击（无视敌方任何状态都可触发连斩），前摇0.1s，后摇0.6s，可用道具键取消，对附近的敌方造成眩晕0.5s；6s内可释放第三段剑舞劈砍，对劈砍位置[附近](范围较小)的敌方造成50伤害、击退和眩晕（劈砍时若不在平台或地面将不会造成效果），命中时将减少8s骑士连斩CD。技能前摇和释放期间无霸体，若[被打断](包括碎片、夹子、眩晕、其他技能键、道具、特技、爪刀等)将直接进入技能CD。\n每段分别可与骑士连斩相互衔接释放：任意技能某段命中可触发两个技能下一段；连招最后使用的技能将进入CD。',
        // 推荐连招：剑舞1-剑舞2-连斩、冲刺-剑舞2-连斩。
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: ['道具键', '其他技能键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '一段和三段攻击额外造成短暂减速；提高二段造成的眩晕时间',
            cooldown: 20,
            detailedDescription:
              '一段和三段攻击额外造成20%减速，持续3.8s；二段造成的眩晕时间提高至0.8s。',
          },
          {
            level: 3,
            description: '减少CD；释放第三段将提高移速一段时间。',
            cooldown: 12,
            detailedDescription: '减少CD至12s；释放第三段将获得12%加速，持续3.4s。',
          },
        ],
        cancelableSkill: ['其他技能键', '道具键'],
        cooldownTiming: '释放后',
      },
      {
        name: '骑士之剑',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '攻击带有剑气，剑气命中的敌方将受到短暂眩晕和少量伤害；剑气命中敌方不会增加爪刀CD。',
            detailedDescription:
              '攻击带有[范围为360~485的剑气](破盾刀的成因)，剑气命中的敌方将受到1.4s眩晕和30伤害；剑气命中敌方不会增加爪刀CD。',
          },
          {
            level: 2,
            description: '剑气命中敌方时，将短暂免疫碎片、大幅加速且不会被减速。',
            detailedDescription: '剑气命中敌方时，将免疫碎片、加速20%且不会被减速，持续9.9s。',
          },
          {
            level: 3,
            description: '剑气命中敌方时重置主动技能的CD。',
            detailedDescription: '剑气命中敌方时[重置主动技能的CD](实际为主动技能CD减少30s)。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 库博 ----------------------------------- */
  库博: {
    description:
      '天堂的站长，拥有能够看穿他人内心的力量。他博学多才，善于思考，同时也是知识的化身。',
    maxHp: 210,
    hpRecovery: 1.5,
    moveSpeed: 735,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 1.65,
    clawKnifeRange: 220,
    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '库博在天堂能看到所有老鼠的位置。可以偷袭，也可以追击自保不强的老鼠。',
        additionalDescription:
          '传送点和猫开局时在各房间的出生点相同，熟记它们的具体位置是追击的关键。',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description:
          '库博能利用天堂强制放飞老鼠，或是快速位移将老鼠绑到难以救援的角落，挽回不利局势。',
        additionalDescription: '',
      },
      {
        tagName: '速通',
        isMinor: true,
        description: '在大图，库博能利用天堂将老鼠绑得非常远，让鼠方疲于奔命。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '白日梦',
        pattern: '1001[01]222',
        weaponType: 'weapon1',
        description:
          'Lv.1天堂和Lv.2被动是库博机动性的核心组成部分；Lv.3被动的高额恢复与Lv.3天堂的减伤均能极大提高库博的生存能力。残血时先点Lv.3被动；满血先点Lv.3天堂。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '乘胜+蓄势',
        description: '以乘胜+蓄势为核心，机动性高，通常以天堂火箭为主要淘汰手段。',
        groups: [
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'S-知识渊博', 'C-猫是液体'],
            description:
              '以乘胜蓄势为核心，利用提供的高移速和高攻击力快速击倒老鼠，绑上天堂火箭巩固优势。不需要猫液时可换为狡诈。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '穷追猛打便于快速展开第一波节奏，皮糙肉厚用于提高自身的身板。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
            description: '携带猫液时的变种。',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '击晕',
        description: '以击晕为核心，灵活性强，通常以地面火箭为主要淘汰手段。',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
            description:
              '以击晕为核心，击倒老鼠后利用天堂将老鼠绑到难以救援的地方，让鼠方疲于奔命。',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description:
              '将细心换为皮糙的变种。如果地图和敌方阵容合适，也可以舍弃穷追猛打换回细心。通常来说，知识卡的优先级为穷追>细心>皮糙肉厚。',
          },
          {
            cards: ['S-击晕', 'A-加大火力', 'A-穷追猛打', 'A-细心', 'C-猫是液体'],
            description:
              '携带猫液时的变种。也可以在此基础上按先前的原则酌情将穷追猛打/细心替换为皮糙肉厚。',
          },
        ],
        defaultFolded: false,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '泛用性较高的特技，用于防范敌方的干扰。',
      },
      {
        name: '蓄力重击',
        description: '搭配击晕或捕鼠夹使用，补充伤害，快速击倒老鼠。',
      },
    ],
    skills: [
      {
        name: '虚幻梦影',
        type: 'active',
        aliases: ['天梯'],
        description:
          '使用时获得加速和间歇性隐身，但靠近老鼠时，对方头顶会有感叹号提示；再次使用进入天堂并留下天梯（最多存在2个）。库博在天堂中持有强霸体，可在天堂天梯获知所有老鼠的位置，并任意选择房间传送；老鼠则通过天堂天梯传送到随机洞口。天堂内有2个天堂火箭，能绑上老鼠的虚影，[拥有强制放飞机制](300秒倒计时，结束时直接淘汰对应老鼠)。虚影被救援时，改为绑上救援者的虚影，救援所需时间较长，救援位置较普通火箭[偏下](如果火箭下有捕鼠夹，会导致踩夹)。已被绑上天堂火箭的老鼠无法进行天堂火箭救援。在对应老鼠被绑上地面火箭或进入墙缝期后，倒计时速度会加快。',
        detailedDescription:
          '本技能分两段：\n第一段：在1.2秒前摇后，获得持续30秒的以下状态：加速7.5%；[每隔5秒获得2.5秒的隐身效果](技能释放时立刻进入2.5秒隐身，隐身结束2.5秒后会再次获得；能被主动技能隐身的侦探泰菲看到；会触发遥控器召唤的机器鼠爆炸；不能被玛丽和表演者杰瑞的主动技能消除)；隐身期间在自身3秒前的位置生成[阴影](即角色脚下的影子，无效果。阴影能被其他人看到)；靠近老鼠1000范围内时，对方头顶会有感叹号提示。获得该状态时使技能同步进入读条，再次点击技能释放第二段。\n第二段：[立刻使技能进入CD](即前摇前立刻使技能进入CD，被打断不返还)。在1.2秒前摇后，传送到天堂，并在自身原位置生成[天梯](判定和交互区域为矩形，会受重力影响而下坠至平台或地面处，之后不受影响；与其他角色、道具、场景物等不产生碰撞；可重叠)（最多存在2个，达到上限则销毁最早生成的1个）。所有角色都可以[与天梯交互并传送到天堂](该交互优先级极低)。\n“天堂”：位于常规地图外的特殊房间，通常只能经由天梯进出。库博在天堂内持有[强霸体](无法免疫强制位移和变身；无特效；获得霸体有一瞬间的延迟，如果进入天堂的瞬间踩中夹子则会被夹住，通常由于在入口处插叉子再在其上放夹子导致)，但无法释放主动技能。天堂入口处有一个特殊天梯，猫咪[与其交互可打开传送面板](显示所有老鼠的位置，可任意选择房间传送；该交互不打断移动)；老鼠与其交互将被传送到随机洞口。天堂内默认生成[2个蛋糕](位于入口处及右侧中部平台处)，2个天堂火箭，[1瓶神秘药水](在以下4处位置中的随机1处生成：1.天堂左侧地板；2.天堂右侧地板——被云层挡住，需走近才能发现；3.天堂右侧中部平台——几乎被列车站标签挡住，需仔细观察；4.天堂右侧顶端平台——可借助右数第2节围栏顶部的平台进行跳跃)。\n“天堂火箭”：放飞倒计时固定为300秒，绑上老鼠时改为绑上对应虚影，老鼠本体会传送到随机洞口；虚影被救援时，改为绑上救援者的虚影；[救援天堂火箭](读条显示为“破坏火箭”)的所需时间固定并且较长，救援位置较普通火箭[偏下](救援时站在地面；如果火箭下有捕鼠夹，会导致踩夹)。已被绑上天堂火箭的老鼠无法进行天堂火箭救援。兔子先生无法对天堂火箭下达救援指令。倒计时结束时，[直接淘汰虚影对应的老鼠](钻入机械鼠中的老鼠也会被放飞；钻入盔甲人或乾坤袋中的老鼠暂时无法被放飞；表演者杰瑞Lv.3被动只在同时也被绑在地面火箭时才触发；天使祝福无法祝福虚影，也无法复活因天堂火箭而被放飞的老鼠)。天堂火箭当虚影对应老鼠被绑上地面火箭时，[地面火箭倒计时停止](倒计时速度归零；仍会因老鼠被绑上火箭而减少引线时间，此时火箭引线时间降为0时也不会起飞；会因挣扎、鼓舞Lv.3等效果而增加读秒)，天堂火箭倒计时速度提高到原先的7倍；进入墙缝期后，天堂火箭倒计时速度提高到原先的2倍；若二者同时触发则取最高值。天堂火箭不受[其他绝大部分机制](会受到鼓舞Lv.3的影响（增加读秒的效果对本体和虚影分别计算，可重复计算，即同时鼓舞虚影和本体则-20秒）；除此之外不受绑火箭或火箭燃烧速度变化的影响，包括自身被动技能Lv.2，知识卡-加大火力/熊熊燃烧，技能-炸药桶/爱之花洒/友情庇护/兔子大表哥/侠义相助/Lv.3沙包拳头/风格骤变Lv.3/共鸣Lv.2/滑步踢/乾坤袋/蓝图/梦中乐园的影响)影响，但会[影响知识卡-穷追猛打](绑上天堂火箭时，穷追猛打效果立刻结束)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '减少CD。技能期间获得额外的攻击增伤。',
            cooldown: 25,
            detailedDescription: '减少CD至25秒。第一段技能的状态持续期间，额外获得25攻击增伤。',
          },
          {
            level: 3,
            description: '技能期间获得减伤。',
            detailedDescription: '第一段技能的状态持续期间，额外获得固定25减伤。',
            cooldown: 25,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '白日梦',
        type: 'weapon1',
        description:
          '在由不同道具组成的愿望中选定并获得1个道具，然后从愿望里去除它。愿望中没有道具时使用技能会失败，需前往天堂补充新愿望。',
        detailedDescription:
          '本技能分两段：\n第一段：头顶前上方浮现气泡框，显示愿望中的1个道具，每秒[按顺序切换](每次使用技能时的道具顺序固定，但下次使用前会被打乱)至下个道具；同时技能进入读条，再次点击或读条结束时释放第二段。\n第二段：立刻获得气泡框中的道具，并在当组愿望中去除1个该道具。\n“愿望”：每次加点时立刻生成或刷新一组愿望。每次进入天堂时，若愿望中没有道具，则生成一组愿望。愿望中没有道具时[使用技能会失败](提示“愿望储量不足，回到天堂将自动补给”，不进入CD)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description:
              '每组愿望由[7种道具](包括：灰色花瓶、蓝白花瓶、小鞭炮、鞭炮束、玩具枪、遥控器、捕鼠夹)中的随机3个不重复道具组成。',
            cooldown: 12,
            detailedDescription:
              '每组愿望由[7种道具](包括：灰色花瓶、蓝白花瓶、小鞭炮、鞭炮束、玩具枪、遥控器、捕鼠夹)中的随机3个不重复道具组成。各道具生成概率相同。',
          },
          {
            level: 2,
            description:
              '每组愿望[额外添加](在原有道具之外添加，不影响其他道具的刷新)1个拍子，总共生成4个道具。',
            cooldown: 12,
          },
          {
            level: 3,
            description:
              '减少CD。新增可生成道具：[拍子](与技能额外添加的拍子分别计数，因此一组愿望可能出现2个拍子)、[金锤子](每场游戏最多通过该技能获得3个金锤子，达到上限则不再生成)。此外每组愿望再[额外添加](在原有道具之外添加，不影响其他道具的刷新)1瓶神秘药水，总共生成5个道具。',
            cooldown: 8,
            detailedDescription:
              '减少CD至8秒。新增可生成道具：[拍子](与技能额外添加的拍子分别计数，因此一组愿望可能出现2个拍子)、[金锤子](每场游戏最多通过该技能获得3个金锤子，达到上限则不再生成)。此外每组愿望再[额外添加](在原有道具之外添加，不影响其他道具的刷新)1瓶神秘药水，总共生成5个道具。拍子生成概率与其他道具相同，金锤子生成概率约为其他道具的1/3。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '全图可见',
      },
      {
        name: '身体素质',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '爪刀范围提高。',
            detailedDescription:
              '[爪刀范围提高至约253](使用了他人数据。目前爪刀范围测试方法较老，有一定误差，仅供参考)。',
          },
          {
            level: 2,
            description: '移速、绑火箭速度和攻击增伤提高。',
            detailedDescription: '移速提高20%，绑火箭速度提高80%，额外获得15攻击增伤。',
          },
          {
            level: 3,
            description: '每秒额外恢复Hp。',
            detailedDescription: '每秒额外恢复20Hp。',
          },
        ],
      },
    ],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description:
          '侦探杰瑞的推奶酪能力十分强大，能让库博的天堂火箭来不及放飞。另外侦探杰瑞的自保强，难以被针对。',
        isMinor: false,
      },
      {
        id: '尼宝',
        description: '尼宝的鱼钩可以在天堂对库博造成控制，并且自保较强而难以让库博抓住破绽。',
        isMinor: false,
      },
      {
        id: '仙女鼠',
        description: '仙女鼠的强制变身能在天堂干扰库博。',
        isMinor: true,
      },
    ],
    counters: [],
  },

  /* ----------------------------------- 凯特 ----------------------------------- */
  凯特: {
    description:
      '她是博学多才的都市美少女，冷静知性，是智慧与美貌并存的化身。她是校园中靓丽的风景线，也是学生眼中博学多识的师长。拥有无限魅力她，其爱慕者多如过江之鲫',
    maxHp: 250,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 4.9,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动被动武器技能都是伤害性技能，在对局中可造成大量伤害',
        additionalDescription:
          '主动技能可以对一条直线内的敌人造成伤害；武器技能可以单独造成伤害或者夹住老鼠，也可以配合主动技能造成多段伤害；一级被动可以对老鼠造成更多伤害',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '二级被动可以减少被控时间；主动技能为范围伤害，打架时命中率高',
        additionalDescription: '三被命中破绽可减少技能CD，进一步提高打架优势',
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '三级追求者出击可造成控制，配合知识就是力量可造成多段控制',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '在墙缝期混战中追求者在小范围内的命中率高，更大概率可造成多倒',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '100112022',
        weaponType: 'weapon1',
        description: '常规加点',
      },
      {
        id: '脆血加点',
        pattern: '100211022',
        weaponType: 'weapon1',
        description: '五级点出知识即力量增加伤害',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '常规卡组，当面对剑杰等高伤老鼠或管道不重要时可携带',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '适合打管道图或者打架能力不高的队伍',
      },
      {
        cards: ['S-乘胜追击', 'A-加大火力', 'A-熊熊燃烧', 'A-穷追猛打'],
        description: '鼠方打架能力较弱且为无管道图',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '通用',
      },
      {
        name: '全垒打',
        description: '配合全垒打的兴奋加速更快地消耗老鼠团队',
      },
    ],
    skills: [
      {
        name: '追求者出击',
        type: 'active',
        aliases: ['舔狗'],
        description:
          '从远处召唤追求者冲至面前；随后再次拖动技能键，使追求者向该方向再度出击，两段均可对触碰的老鼠造成伤害。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 18,
          },
          {
            level: 2,
            description: '追求者速度更快',
            cooldown: 18,
            detailedDescription: '追求者速度更快，一秒就可以冲至身前',
          },
          {
            level: 3,
            description: '追求者额外造成爆炸伤害和控制',
            detailedDescription: '追求者额外造成{25}的爆炸伤害和控制',
            cooldown: 18,
          },
        ],
        canHitInPipe: false,
        cueRange: '本房间可见',
      },
      {
        name: '知识即力量',
        type: 'weapon1',
        description:
          '投掷百科全书造成伤害，落地后书籍打开，5秒后或再次施放技能会让书籍闭合，造成伤害并将老鼠夹住。可以通过交互键捡起书籍并将老鼠直接抓起。当书籍闭合时，周围的追求者会冲向书籍将其捡起并送还凯特，并对触碰到的老鼠造成伤害。',
        detailedDescription:
          '投掷百科全书造成[25伤害](受攻击力加成，但不触发乾坤一掷)，落地后书籍打开，5秒后或再次施放技能会让书籍闭合，造成伤害并[将老鼠夹住](挣脱时间不受夹不住我影响，但受捕鼠夹的影响；不能触发狡诈)。书籍闭合后最多存在10秒，可以通过交互键捡起书籍返还5秒冷却并将老鼠直接抓起。当书籍闭合时，周围的追求者会冲向书籍将其捡起并送还凯特，并对触碰到的老鼠造成伤害。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: ['跳跃键', '道具键'],
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
            description: '被书籍砸中会直接添加破绽；提升书籍开启状态时长。',
            cooldown: 15,
            detailedDescription:
              '被书籍砸中额外添加三层破绽，书籍最长开启状态延长为10秒、存在20秒。',
          },
        ],
        aliases: ['书'],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '骄傲的学霸',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '附近老鼠缓慢获得破绽状态。对老鼠造成伤害时，根据破绽层数造成额外伤害并获得额外经验。',
            detailedDescription:
              '当老鼠出现在视线范围内时，每1.8秒为老鼠添加一层持续10秒的破绽状态，上限5层。对老鼠造成伤害时，每层破绽增加6点伤害和200经验。每层破绽伤害分独立计算。',
          },
          {
            level: 2,
            description:
              '附近老鼠使用技能、投掷道具、从火箭上救下同伴、吃下食物或药水，会获得一层破绽、增加凯特移速、减少被控制时间、加快绑火箭速度。',
            detailedDescription:
              '附近老鼠使用技能、投掷道具、从火箭上救下同伴、吃下食物或药水，会获得一层破绽、增加凯特移速、减少50%被控制时间、加快绑火箭速度至约1秒。减控共持续7秒。',
          },
          {
            level: 3,
            description: '击破破绽会减少凯特所有技能CD。',
            detailedDescription: '击破破绽会减少凯特所有技能CD，每层破绽可减少2秒技能CD。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '航海士杰瑞',
        description: '凯特二级被动减少控制时间，航海士杰瑞难以打出连控',
        isMinor: true,
      },
      {
        id: '剑客杰瑞',
        description:
          '凯特二级被动会导致剑客杰瑞华尔兹剑舞或者格挡无法与剑与苹果形成配合进行二次连控',
        isMinor: true,
      },
      {
        id: '表演者•杰瑞',
        description: '凯特的破绽是二段伤害，可以使表演者杰瑞跳舞结束大幅提前',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '国王杰瑞',
        description: '凯特难以处理国王杰瑞的国王权杖以及国王战旗',
        isMinor: true,
      },
      {
        id: '天使杰瑞',
        description:
          '凯特的技能命中天使杰瑞会造成爪刀与技能被禁，并且雷云范围内会削弱凯特伤害，并会被雷云攻击',
        isMinor: false,
      },
      {
        id: '剑客莉莉',
        description: '难以处理剑客莉莉二级被动强行救人',
        isMinor: true,
      },
      {
        id: '剑客泰菲',
        description: '凯特无法阻止头盔救人',
        isMinor: false,
      },
      {
        id: '米可',
        description: '米可的采访减伤与回血还有霸体让凯特不好击倒米可',
        isMinor: false,
      },
    ],
  },

  /* ----------------------------------- 苏蕊 ---------------------------------- */
  苏蕊: {
    aliases: ['苏三心'],
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
    counters: [
      {
        id: '航海士杰瑞',
        description: '苏蕊在律动时间中免疫航海士杰瑞各个技能的控制效果。',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '急速翻滚',
        description: '',
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
          '回复50Hp，随着音乐舞动，持续40秒。若手中有老鼠，则放下老鼠并使其自主跟随。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为以苏蕊为中心、范围更大的[舞动亮相](CD为5.9秒（未命中）和11.9秒（命中），伤害为70点)。舞动时每隔13秒出现爱心提示，此时点击技能按钮将回复30Hp、提升10%移速和15点攻击力。舞动时接触不在捕鼠夹上的虚弱老鼠或刚被击倒的老鼠，将使其自主跟随苏蕊30秒。在此状态下，老鼠无法主动使用技能、移动等操作，但仍能受到伤害和控制，且遇到火箭会立刻绑上。若老鼠与苏蕊距离较远（如钻管道后），则老鼠会解除跟随。',
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
            detailedDescription: '每次成功点击爱心将[延长舞动时间5秒](总舞动时间至多为60秒)。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '瑜伽球',
        type: 'weapon1',
        description: '扔出瑜伽球并控制它膨胀，膨胀时使老鼠眩晕并弹飞。',
        detailedDescription:
          '扔出瑜伽球。在瑜伽球飞行过程中苏蕊可再次点击技能键使瑜伽球膨胀，当膨胀时接触到敌方老鼠，则会造成30点伤害、1.5秒眩晕并弹飞。可存储2次。',
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

  /* ----------------------------------- 斯飞 ----------------------------------- */
  斯飞: {
    aliases: [],
    description:
      '因为与众不同的花色，斯飞在其他猫的眼里是个十足的怪猫。习惯独来独往的他从不和其他猫交流，独自一人住在城市的最中心，充满了神秘感。夜深人静的时候，他总会拿着一个挂坠，似乎在思念着谁。（猫鼠动画里毛色相似的小猫是他妹妹）',
    maxHp: 225,
    hpRecovery: 2,
    moveSpeed: 780,
    jumpHeight: 420,
    clawKnifeCdHit: 4,
    clawKnifeCdUnhit: 3.1,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '被动的加速使追击老鼠较为轻松',
        additionalDescription: '',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动和武器技能均有伤害和控制，轻松击倒老鼠；被动的感电增强上火箭能力',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '三级武器技能命中刷新CD，有一定翻盘能力',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '新手',
        pattern: '0101[02]221',
        weaponType: 'weapon1',
        description: '初步接触的加点，六级时如果血量健康可以优先点出武器技能',
      },
      {
        id: '熟练',
        pattern: '010202211',
        weaponType: 'weapon1',
        description: '熟练后的推荐加点，要求对武器技能的熟练度',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-暴怒', 'A-熊熊燃烧'],
        description:
          '萌新玩家可快速凑出本卡组度过开荒期，当资源足够或熟练后不推荐。管道图中，《暴怒》可替换为《加大火力》+《猫是液体》。',
      },
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '经典776卡组，击晕依赖玩家选择，略有过时。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-心灵手巧', 'A-加大火力'],
        description:
          '主流卡组，心灵手巧可以使感电效果几乎持续到绑完火箭。可将最后两张换为《穷追猛打》，快速打开前期节奏；如遇打架队则可换为《皮糙肉厚》。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '主流卡组，管道图用。',
      },
    ],
    skills: [
      {
        name: '狂',
        type: 'active',
        aliases: ['牙通牙', '旋转'],
        description: '向前方连续挥爪3次，造成伤害；疾冲状态下，改为向前穿刺，造成伤害和控制。',
        detailedDescription:
          '向前方连续挥爪3次，每次造成30伤害，范围为300。；疾冲状态下或武器技能飞行中，改为向前穿刺，造成60点伤害和1.8秒眩晕。技能可以穿门。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 18,
          },
          {
            level: 2,
            description: '减少CD；技能期间免控。',
            cooldown: 12,
            detailedDescription: '减少CD；技能期间免控。',
          },
          {
            level: 3,
            description: '连续挥爪的伤害提升；穿刺攻击会将老鼠拉至终点位置。',
            detailedDescription: '连续挥爪的伤害提升至每次40；穿刺攻击会将老鼠拉至终点位置。',
            cooldown: 12,
          },
        ],
        cancelableSkill: '无前摇',
        cueRange: '本房间可见',
      },
      {
        name: '猎',
        type: 'weapon1',
        description: '前摇0.45秒，扔出项坠，随后斯飞向项坠飞去，对碰到老鼠造成伤害和短暂眩晕。',
        detailedDescription:
          '前摇0.45秒，扔出项坠，0.75秒后或项坠碰撞到地面/墙壁后，斯飞以2000的速度向项坠飞去，飞行期间对碰到老鼠造成50点普通伤害、10点电击伤害和0.6秒眩晕。释放瞬间如果角色方向改变，将同时改变项坠方向。技能可以穿门。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '飞行结束后8秒内，降低进入疾冲状态所需的奔跑时间和速度。',
            cooldown: 20,
            detailedDescription:
              '飞行结束后8秒内，进入疾冲状态所需的奔跑时间降低至30%、所需的速度降低至基础移速的75%。',
          },
          {
            level: 3,
            description: '飞行期间伤害到敌人将刷新此技能。',
            cooldown: 20,
            detailedDescription: '飞行期间伤害每伤害到一个敌人，减少20秒本技能CD。',
          },
        ],
        canHitInPipe: true,
      },
      {
        name: '迅',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '斯飞以[一定移速](约基础速度90%)奔跑1.5秒后进入疾冲状态：\n1. 提高移动和跳跃速度\n 2.获得迅捷效果，获得加速，无视碎片、反向、失明、烫伤、感电、捕鼠夹\n3. 爪刀强化为向前扑击\n4. 获得感电状态，老鼠触碰到时会受到10点电击伤害并眩晕0.6秒\n当使用爪刀、施放技能或移速降到[一定数值](约为正常疾冲速度75%)时将退出疾冲状态。',
            detailedDescription:
              '斯飞以[一定移速](约基础速度90%)奔跑1.5秒后进入疾冲状态：\n1. 提高移动和跳跃速度\n 2.获得迅捷效果，获得加速，无视碎片、[反向、失明](包括魔术师的黄牌，拿坡里的足球，玛丽的扇子与反向)、烫伤、感电、捕鼠夹\n3. 爪刀强化为以2000速度向前扑击0.15秒\n4. 获得感电状态，身上环绕电流，老鼠触碰到时会受到10点电击伤害并眩晕0.6秒（同目标10秒内不会重复触发）\n当使用爪刀、施放技能或移速降到[一定数值](约为正常疾冲速度75%)以下0.5秒后将退出疾冲状态。',
          },
          {
            level: 2,
            description:
              '退出疾冲状态后，迅捷状态继续保持10秒；迅捷状态额外提升[部分交互速度](绑火箭，放置老鼠夹等)。',
            detailedDescription:
              '退出疾冲状态后，迅捷状态继续保持10秒；迅捷状态额外提升[部分交互速度](绑火箭，放置老鼠夹等)65%。',
          },
          {
            level: 3,
            description: '迅捷状态额外持续恢复Hp。',
            detailedDescription:
              '迅捷状态额外获得30/s的Hp恢复；降低退出疾冲状态的速度至正常疾冲速度的70%。',
          },
        ],
      },
    ],
    counteredBy: [
      {
        id: '航海士杰瑞',
        description: '控制多，能炸火箭',
        isMinor: true,
      },
      {
        id: '尼宝',
        description: '救人很稳，技能能让自己霸体和钩子让你强制位移',
        isMinor: false,
      },
      {
        id: '剑客杰瑞',
        description: '在未点出三级被动的情况下，容易被这位打倒',
        isMinor: true,
      },
      {
        id: '侦探杰瑞',
        description: '不好抓，容易被加快节奏',
        isMinor: true,
      },
      {
        id: '牛仔杰瑞',
        description: '小心仙人掌的控制与减速',
        isMinor: false,
      },
    ],
    counters: [
      {
        id: '魔术师',
        description: '被动免疫魔术师黄色卡牌，同时魔术师缺乏自保和打架能力',
        isMinor: false,
      },
      {
        id: '玛丽',
        description: '被动免疫玛丽的扇子技能，同时玛丽缺乏打架能力',
        isMinor: false,
      },
      {
        id: '侦探泰菲',
        description: '被动能免疫这位的分身干扰',
        isMinor: true,
      },
      {
        id: '剑客莉莉',
        description: '高机动性让莉莉的干扰不起作用',
        isMinor: true,
      },
      {
        id: '仙女鼠',
        description: '被变成大星星也能吃到被动，她的减速可以忽略',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '自身缺乏防御手段（推荐）',
      },
      {
        name: '急速翻滚',
        description: '再次加快速度与机动性',
      },
    ],
  },

  /* ----------------------------------- 追风汤姆 ----------------------------------- */
  追风汤姆: {
    description:
      '因为一场神秘的实验意外而降落于猫鼠五周年特别纪念展的不速之客，天生充满了对蓝天的向往，热爱钻研新奇的发明，脑袋里充满稀奇古怪的创意，立志成为猫咪届第一位飞行员，在汤姆和杰瑞的陪伴下被纪念展的内容所打动，来到这里继续进行新的创意发明。',
    maxHp: 240,
    hpRecovery: 1,
    moveSpeed: 800,
    jumpHeight: 420,
    clawKnifeCdHit: 7,
    clawKnifeCdUnhit: 3.85,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '速通',
        isMinor: false,
        description:
          '追风三级成型，在前期对鼠方的压制力很大。同时追风等级带来的提升很小，越到后期越乏力，因此需要快速减员，尽早赢下比赛',
        additionalDescription: '',
      },
      {
        tagName: '追击',
        isMinor: true,
        description: '飞行时不受常规地形约束且移速快，提供很好的追击手段',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: true,
        description:
          '守火箭能力强，风的大范围、击退和极短CD等特点能轻易拦下前来救援的老鼠，飞行时的碰撞体积可以打断老鼠跳救使其踩夹；风可以吹飞果盘，有一定守墙缝能力',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '稳重流',
        pattern: '210002112',
        weaponType: 'weapon1',
        description: '先点出三级被动，提高上火箭、追击和打架能力',
      },
      {
        id: '激进流',
        pattern: '212112000',
        weaponType: 'weapon1',
        description: '先点出二级武器，提高守火箭能力',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-蓄势一击', 'A-熊熊燃烧', 'C-猫是液体'],
        description:
          '该卡组综合能力强，万金油。在大图效果更佳。缺点是第一波节奏不好拿，而且身板较脆。\n若未解锁21知识点，可舍弃“猫是液体”',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'A-穷追猛打'],
        description:
          '上限高，放飞速度很快，可以应对速推流。建议熟练高时用；非管道图、对面血厚也可用；不建议在酒店、牧场图用。缺点是穷追掉了后机动性较差，身板较脆',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'B-皮糙肉厚'],
        description:
          '推荐在对面选出四干扰的纯打架阵容时使用，地图为太空、熊猫馆等非管道图效果更佳。缺点是机动性始终较差，当地图较大且对面为拉扯阵容时慎用',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'A-心灵手巧'],
        description: '对策卡组。推荐在对面选出双拆(火箭)或多拆阵容时带。缺点同上',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '刚开始练追风建议用这套，下限较高。但不建议在牧场、酒店图带',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'C-猫是液体', 'C-狡诈'],
        description:
          '非常推荐在牧场、酒店图带，一直采花可以弥补移速和续航的不足(新手也适合带)。若有21知识点，可将“狡诈”换为“攻其不备”或“捕鼠夹”',
      },
    ],
    counters: [
      {
        id: '航海士杰瑞',
        description:
          '金币难以命中飞行状态下的追风，且无法对其造成控制，炸药桶可用风推走；但可以组成双拆体系应对追风',
        isMinor: true,
      },
      {
        id: '剑客泰菲',
        description:
          '追风飞行时有碰撞箱，可以顶住前来救援的头盔剑菲，从而拖到头盔时间结束。守高点火箭时效果更佳',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '应急治疗',
        description: '推荐在没带知识卡皮糙肉厚或面对高伤阵容时带',
      },
      {
        name: '绝地反击',
        description: '推荐面对多控阵容时带',
      },
      {
        name: '蓄力重击',
        description:
          '推荐在对面选出魔术师时带，用于秒杀兔子大表哥，防止因为缺伤害导致处理不了兔子举秒飞而无法及时减员',
      },
    ],
    skills: [
      {
        name: '战术机动',
        type: 'active',
        description: 'Lv.0: 仅处于空中时才可释放。进入飞行状态。',
        detailedDescription:
          'Lv.0: 仅处于空中时才可释放。进入飞行状态，移动方式强制切换为[摇杆操作](仅支持四向移动：左上、右上、左下、右下)。“进入飞行状态”无cd，但飞行状态下无法俯冲。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description:
              '解锁俯冲技能。飞行时点击技能可向正前方俯冲、拖动技能可向斜前方俯冲，对碰到的敌方造成短暂眩晕和伤害。长按技能可蓄力，略微提升俯冲效果和距离。',
            cooldown: 8,
            detailedDescription:
              '解锁俯冲技能。飞行时点击技能可向正前方俯冲，拖动技能可向斜前方俯冲，瞄准范围为自身正前方至正下方的90度角，附近有老鼠则会自动瞄向附近的老鼠俯冲。俯冲速度2000；长按技能可蓄力，期间水平移速降至550且不可转向，可点击道具键停止蓄力并保存蓄力效果。点击/蓄力0.5～1秒/蓄力1秒以上，冲刺时间为0.45/0.6/0.75秒，命中敌方造成0.8秒眩晕和35/37.5/40伤害。俯冲期间可使用爪刀、技能和取消飞行。俯冲伤害不受任何伤害加成和减免效果的影响。',
            // 无法命中猫单位
          },
          {
            level: 2,
            description: '提高蓄力期间的移速。',
            cooldown: 8,
            detailedDescription: '蓄力期间水平移速提升至850。',
          },
          {
            level: 3,
            description: '减少俯冲CD，同时略微增加蓄力提升的伤害和眩晕时间',
            cooldown: 5,
            detailedDescription:
              '减少俯冲CD至5秒，点击/蓄力0.5～1.0秒/蓄力1秒以上，伤害提升至35/40/45，眩晕时间提升至0.8/0.9/1.1秒',
          },
        ],
        aliases: ['冲刺', '俯冲'],
        cancelableAftercast: '无后摇',
        cueRange: '本房间可见',
      },
      {
        name: '追风双翼',
        type: 'weapon1',
        description:
          '未处于飞行状态时，向前释放飓风，对敌方造成少量伤害和击退。击退期间对触碰到的[所有单位](包括追风汤姆)造成少量伤害，对敌方额外造成眩晕效果。\n处于飞行状态时，向正下方扔出铁砧，砸中敌方造成少量伤害和短暂眩晕。\n当手中有老鼠时，会优先扔出老鼠并自动绑上碰到的火箭，但会被其他敌方单位阻挡。',
        detailedDescription:
          '未处于飞行状态时，向前释放飓风，前摇0.5秒，后摇0.75秒。飓风速度1000，存在2秒，[可推动沿途的道具和部分场景物](但飓风也会因此减速)，可被墙体阻挡；多个风之间不可叠加。飓风命中敌方将造成20伤害和2秒击退，击退速度为550。击退期间对触碰到的[所有单位](包括追风汤姆)造成35伤害，对敌方额外造成1.5秒眩晕。\n处于飞行状态时，向正下方扔出铁砧(无前后摇)。铁砧下落1.6秒或命中后对附近敌方造成小范围的[18伤害和1.2秒眩晕](老鼠被铁砧眩晕期间及其效果结束后1秒内不会再受到铁砧效果)。铁砧可穿越小平台。\n当手中有老鼠时，会优先[扔出老鼠](扔需要消耗一次技能)，使其回复60血，并自动绑上碰到的火箭，但会被其他敌方单位阻挡；攻击效果等于飓风/铁砧；老鼠在被扔出期间可使用技能、进行交互、免疫伤害（追风的俯冲伤害除外），但不免疫控制。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '可存储2次。',
            cooldown: 9,
          },
          {
            level: 2,
            description: '可存储3次；提高飓风的持续时间。',
            cooldown: 9,
            detailedDescription: '可存储3次；提高飓风的持续时间至3.5秒。',
          },
          {
            level: 3,
            description: '提高铁砧的伤害。',
            cooldown: 9,
            detailedDescription: '提高铁砧的伤害至30。',
          },
        ],
        aliases: ['飓风', '铁砧'],
        cancelableAftercast: ['道具键'],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '全图可见',
      },
      {
        name: '追风状态',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '无任何效果',
          },
          {
            level: 2,
            description: '飞行状态下，Hp恢复略微提升。',
            detailedDescription: '飞行状态下，Hp恢复提升至5/s。',
          },
          {
            level: 3,
            description: '[走地状态下](不处于空中时)，飞行时间的累积速度提升；最大飞行时间增加。',
            detailedDescription:
              '[走地状态下](不处于空中时)，每秒增加1.5秒飞行时间，最多储存15秒。',
          },
        ],
        description:
          'Lv.0: [走地状态下](不处于空中时)，逐渐累积飞行时间。未处于飞行状态时爪刀CD减少。飞行状态下视野增大，可托起其他角色，并提高移速。飞行时[免疫控制](同时不会被米可采访锁定；不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会减少飞行时间。飞行状态可随时退出，但会清空剩余飞行时间。飞行被[强制打断](如被狗抓、被打死)会暂时禁用主动技能。',
        detailedDescription:
          'Lv.0: [走地状态下](不处于空中时)，每秒获得1秒飞行时间，最多储存10秒。未处于飞行状态时爪刀CD减少35%；飞行状态下[视野范围增加55%](覆盖其他远视效果)，可托起其他角色，无视小平台阻挡，并提高移速至水平1015、竖直840。悬停时角色会自动向前以水平350、竖直30的速度下落。飞行时[免疫控制](不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会[减少2秒飞行时间](若此时剩余飞行时间少于2秒，受到伤害时也会受到其对应的控制效果)。飞行状态可随时退出，但会清空剩余飞行时间。“退出飞行状态”这一操作无cd。飞行被[强制打断](如被狗抓、被打死)会使主动技能进入10秒CD。该冷却不可通过吃蛋糕回复。',
      },
    ],
    aliases: ['追汤', '坠机汤姆'],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞推速很快，自保较强，很容易加快游戏节奏，而追风属于前期猫',
        isMinor: true,
      },
      {
        id: '魔术师',
        description: '魔术师带二武刷经验能形成等级压制，而追风缺伤害，难以处理血厚的兔子大表哥。',
        isMinor: true,
      },
      {
        id: '天使杰瑞',
        description:
          '天使杰瑞一被和三被让追风无法快速拿刀，雷云减伤可以放大追风缺伤害的缺点，打团也很强。祝福可以一定程度上反制追风飞行强上火箭，但追风可以通过鞭尸消除祝福',
        isMinor: false,
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
      imageUrl: AssetManager.getCharacterImageUrl(characterId, 'cat'),
      skills: AssetManager.addSkillImageUrls(characterId, character.skills, 'cat'),
    },
  ])
);
