import { addSkillImageUrls } from '../lib/skillUtils';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition } from './types';

// Generate image URL based on character ID
const getCatImageUrl = (characterId: string): string => {
  // Check if the image exists, otherwise use a placeholder
  const existingImages = ['汤姆', '布奇', '托普斯', '苏蕊'];

  if (existingImages.includes(characterId)) {
    return `/images/cats/${characterId}.png`;
  } else {
    return `/images/cats/placeholder-cat.png`;
  }
};

const catCharacterDefinitions: Record<string, CharacterDefinition> = {
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
      ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-心灵手巧'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
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
        pattern: '1[30]30011',
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
          '苏蕊随着音乐舞动。舞动开始将恢复一定Hp，免疫部分眩晕效果，爪击将替换为以苏蕊为中心周边更大范围的舞动亮相，冷却时间比爪击更久，舞动时将每隔一段时间在中心出现爱心提示，在爱心提示出现时点击技能按钮将恢复Hp，并获得移动速度和攻击力提升，在舞动过程中与敌方虚弱老鼠接触时，将会使其自主跟随苏蕊，跟随将持续30秒，期间遇到火箭会立刻绑上，舞动会持续较长时间。',
        detailedDescription:
          '舞动开始时将恢复50点生命值。过程中[免疫部分眩晕效果](包括控制道具等大部分老鼠的控制手段，但不免疫大部分NPC的控制)。移动和跳跃不会中断此技能。爪击将替换为以苏蕊为中心、范围更大的[舞动亮相](冷却时间为6秒（未命中老鼠）和12秒（命中老鼠），伤害为70点)。舞动时每隔13秒会在中心出现爱心提示，此时点击技能按钮将恢复30点生命值，并提升10%移动速度和15点攻击力。在舞动过程中，若接触到不在老鼠夹上的[虚弱老鼠](包括触发知识卡“铁血”的老鼠)，该老鼠将自主跟随苏蕊。在此状态下，老鼠无法主动使用技能、移动等操作。若老鼠与苏蕊距离较远（如钻管道后），则老鼠会解除跟随状态。跟随效果持续30秒，期间老鼠遇到火箭会被立刻绑上。舞动总持续时间为40秒。',
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
            description: '爪击和舞动亮相命中敌方时将重置瑜伽球的冷却时间。',
            detailedDescription:
              '爪击和舞动亮相命中敌方时将重置瑜伽球的冷却时间，击中多个敌方将重置多个CD。',
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
