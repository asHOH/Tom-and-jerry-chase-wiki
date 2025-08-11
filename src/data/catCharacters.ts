import { AssetManager } from '../lib/assetManager';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition, PartialCharacterDefinition } from './types';

const catCharacterDefinitions: Record<string, CharacterDefinition | PartialCharacterDefinition> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  汤姆: {
    description:
      '全能男神汤姆，开得了大型演唱会，造得出飞行翅膀，弹琴舞蹈样样精通，除了不会抓老鼠什么都会。',

    maxHp: 255,
    attackBoost: 0,
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
        additionalDescription:
          '手型枪+蓄力重击，或者Lv.2被动+平底锅，都能对守火箭的老鼠产生极大威胁。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '主动技能提供无敌和解控，Lv.1被动提供续航，对打架阵容有很强的反制能力。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '武器技能的直接抓取提供了一定的翻盘能力。',
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
        description: '与主动技能的无敌相互弥补真空期。',
      },
      {
        name: '蓄力重击',
        description: '配合击晕或手型枪使用，一下一个小老鼠。',
      },
      {
        name: '全垒打',
        description:
          '配合平底锅使用，平底锅每一段伤害都能受到全垒打的攻击增伤，瞬间打出爆发伤害。全垒打还能提高移速。',
      },
    ],
    skills: [
      {
        name: '发怒冲刺',
        type: 'active',
        aliases: ['无敌'],
        description: '立刻解除眩晕等控制效果，然后进入一段时间的无敌，无敌结束后短暂降低移速。',
        detailedDescription:
          '立刻[解除眩晕等控制效果](不包括番茄减速等减速效果)，然后进入一段时间的无敌，前摇期间获得[弱霸体](不免疫虚弱和部分变身效果，且会被冰面打断)。无敌期间移速提高12.5%，[免疫大部分道具和技能的负面效果](包括会免疫尼宝-尼宝的朋友造成的眩晕效果（位移不会免疫）；免疫仙女鼠-星星棒的8星变身效果)，但[仍会受到部分特殊技能影响](无法免疫尼宝-尼宝的朋友造成的位移效果（眩晕会免疫）；无法免疫仙女鼠-星星棒的1/2/4/6星的效果（因为它可无视护盾直接造成伤害），若在莱恩蓝图内受到仙女鼠的伤害，会变成线条猫；无法免疫部分改变或创造地形类的技能)和[位移效果的影响](如尼宝的钩子)。无敌结束后降低10%移速，持续2秒，可被护盾抵消。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '前摇前',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=127.35',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '无敌持续3.8秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '无敌持续时间增加。',
            detailedDescription: '无敌持续时间增加到6.8秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '无敌期间爪刀CD减少。',
            detailedDescription: '无敌期间爪刀CD减少25%（即CD变为原来的75%）。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '手型枪',
        type: 'weapon1',
        description: '手型枪水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
        detailedDescription:
          '手型枪水平飞出、飞回，对[命中](飞出、飞回过程均可命中；包括因遇到护盾而提前返回的情况；至多只能抓回并眩晕一只老鼠)的老鼠造成{15}伤害、将其抓回并眩晕2.5秒。如果拉回过程[遇到障碍](包括墙壁、叉子的阻挡，或是某些高低差地形)，则[额外造成70伤害](可能会重复产生2-3次伤害，具体成因不详，疑似与墙壁厚度及高低差有关)。抓回及眩晕效果对变身状态的老鼠和虚弱的老鼠也生效。若手型枪命中的老鼠持有护盾，则打破一层护盾并提前返回。',
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
            description: '可以直接抓起被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '平底锅',
        type: 'weapon2',
        description: '挥锅攻击老鼠并打出煎蛋，打晕并致盲附近老鼠、降低其救援速度；也能击飞道具。',
        detailedDescription:
          '挥舞平底锅，对直接命中的老鼠造成{15}伤害，向斜上方略微击飞对方，并附加5秒[煎蛋失明](特效为一块煎蛋蒙蔽双眼，与常规失明不同)和55%救援减速效果；挥锅时会以固定角度和力度飞出一块煎蛋，煎蛋对命中的老鼠造成{15}点伤害，并附加5秒煎蛋失明和55%救援减速效果；被平底锅直接命中并击飞的老鼠落地后受到{30}伤害，并眩晕1秒。',
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
            description: '煎蛋失明持续时间延长；平底锅如果命中老鼠则会刷新爪刀CD。',
            detailedDescription: '煎蛋失明持续时间延长至7.5秒；平底锅如果命中老鼠则会刷新爪刀CD。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '汤姆可以直接抓起被平底锅击飞落地而眩晕的老鼠。',
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
            description:
              '对老鼠造成伤害时，回复Hp且移速提高一段时间。若由爪刀造成伤害，则回复效果翻倍。',
            detailedDescription:
              '对老鼠造成伤害时，回复25Hp且移速提高9.5%，持续2.6秒；若伤害来自爪刀，则回复效果提高到50Hp。',
          },
          {
            level: 2,
            description: '手握老鼠时依然可以使用爪刀。',
            detailedDescription:
              '手握老鼠时依然可以使用爪刀，但[不会改变惯性](即不会因为使用爪刀而进入下落状态)。',
          },
          {
            level: 3,
            description: '对老鼠造成伤害时，使其一段时间无法使用技能。',
            detailedDescription: '对老鼠造成伤害时，使其3秒内无法使用技能。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '尼宝',
        description: '汤姆的平底锅可以把尼宝拍飞，打断其救援。',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '剑客莉莉',
        description:
          '剑客莉莉的风墙可以阻挡开启无敌的汤姆；剑客莉莉Lv.2被动的护盾持续时间也够长，救援能力足够稳定。',
        isMinor: true,
      },
    ],
  },

  /* ----------------------------------- 布奇 ----------------------------------- */
  布奇: {
    description:
      '"流浪猫铁三角"中的老大。在街头流浪的黑猫布奇，总是喜欢和汤姆争夺千金母猫“图多盖洛”，最终成功逆袭为亿万富豪。',
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
        description: 'Lv.1被动快速起身和Lv.3旋转桶盖的霸体提供了较强的打架能力。',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '垃圾盖',
        pattern: '12000[1122]',
        weaponType: 'weapon1',
        description:
          '利用被动的高伤害和延长控制效果提高攻击能力。点出Lv.3被动后视情况对主动或武器技能进行加点。',
        additionaldescription: '',
      },
      {
        id: '旋转桶盖',
        pattern: '13(0)330011',
        weaponType: 'weapon2',
        description: '三级时可以适当留加点，如果血量告急则先点Lv.1被动。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '利用击晕补充控制链，乘胜追击补充移速，提高追击能力。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '利用穷追猛打刷取经验，为后期打架做准备。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '打管道较多的地图可考虑使用。无21知识量时可去掉狡诈。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-细心', 'A-穷追猛打'],
        description: '利用细心和击晕进行防守。可酌情将穷追猛打替换为其他知识卡。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '补充霸体和解控能力，提高打架能力。',
      },
      {
        name: '急速翻滚',
        description: '提高机动性。',
      },
      {
        name: '全垒打',
        description:
          '在某些需要极高伤害的场合可酌情使用。主动和武器技能都能享受到攻击增伤，配合全垒打打出爆发伤害。全垒打提供的极高移速还能提高主动技能的冲刺距离。',
      },
    ],

    skills: [
      {
        name: '横冲直撞',
        type: 'active',
        aliases: ['冲刺', '冲撞'],
        description:
          '向前冲刺一段时间，撞飞碰到的道具（包括已放入洞口的奶酪），并对撞到的老鼠造成伤害和短暂眩晕。冲刺过程中持有霸体且可通过方向键多次改变冲刺方向，且可以使用爪刀、道具和技能。',
        detailedDescription:
          '[在短暂前摇后开始冲刺](前摇过程中没有霸体)，向前冲刺一段时间，撞飞碰到的道具（包括已放入洞口的奶酪），并对撞到老鼠造成{26}伤害和短暂眩晕。冲刺过程中持有霸体且可通过方向键多次改变冲刺方向，且可以使用爪刀、道具和技能。',
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
            description: '冲刺期间获得加速。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '碰撞到的老鼠会眩晕更长时间；命中老鼠或奶酪时获得短暂加速。',
            detailedDescription: '碰撞到的老鼠眩晕时间延长到1秒；命中老鼠或奶酪时获得5秒30%加速。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '垃圾盖',
        type: 'weapon1',
        description: '对附近老鼠造成伤害和眩晕。',
        detailedDescription: '对附近老鼠造成{26}伤害和1.3秒眩晕。',
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
            description:
              '造成的眩晕时间延长，使被命中的老鼠造成的伤害降低一段时间；[震碎](会产生命中地面后的效果，例如产生碎片等)命中的[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)。',
            detailedDescription:
              '造成的眩晕时间延长到2.4秒、使被命中的老鼠造成的伤害降低100，持续10秒；[震碎](会产生命中地面后的效果，例如产生碎片等)命中的[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '被命中的老鼠救援其他老鼠的速度降低一段时间。',
            detailedDescription: '被命中的老鼠救援其他老鼠的速度降低45%，持续一段时间。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '旋转桶盖',
        type: 'weapon2',
        description:
          '点按原地丢出旋转桶盖，或拖拽技能向指定方向扔出旋转桶盖，伤害并眩晕命中的老鼠；友方再次碰到桶盖会将其拾取，获得一段时间的减伤。',
        detailedDescription:
          '点按原地丢出旋转桶盖，或拖拽技能向指定方向扔出旋转桶盖，对命中的老鼠造成55伤害并眩晕1.5秒；友方再次碰到桶盖会将其拾取，获得持续6秒的减伤。桶盖被投掷时的初速度较快，会被道具和墙壁反弹。',
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
            description: 'CD减少8秒。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '增加桶盖飞行速度；自己捡到桶盖获得[强霸体](免疫虚弱和绝大多数控制效果)。',
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
            description: '虚弱时间大幅降低，起身后的无敌时间大幅增长。',
            detailedDescription:
              '虚弱后的Hp恢复速度极大幅增加，虚弱时间大幅降低，起身后的无敌时间大幅延长。',
          },
          {
            level: 2,
            description:
              '[投掷道具](包括本来没有伤害的果子、香水瓶、胡椒瓶、番茄等)命中敌方时[额外造成伤害](与原伤害分为不同的两段，若原伤害命中在敌方护盾上时则不造成额外伤害)，造成伤害后将回复Hp，同时在一段时间内提高移速。',
            detailedDescription:
              '[投掷道具](包括本来没有伤害的果子、香水瓶、胡椒瓶、番茄等)命中敌方时[额外造成25伤害](与原伤害分为不同的两段，若原伤害命中在敌方护盾上时则不造成额外伤害)，造成伤害后将回复Hp，同时提高移速，持续5秒。',
          },
          {
            level: 3,
            description: '爪刀有一定概率额外造成极高伤害；技能和道具造成的控制时间小幅度增加。',
            detailedDescription: '爪刀有30%概率额外造成200伤害；技能和道具造成的控制时间增加1秒。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '泰菲',
        description: '布奇的爪刀可以秒泰菲，但泰菲可以用圆滚滚逃跑，不会被冲撞到。',
        isMinor: true,
      },
      {
        id: '侦探泰菲',
        description: '布奇的爪刀可以秒侦探泰菲，冲飞洞口的奶酪也能克制侦菲的游击策略。',
        isMinor: false,
      },
      {
        id: '恶魔泰菲',
        description: '布奇的爪刀可以秒恶魔泰菲，冲飞洞口的奶酪也能克制恶菲的游击策略。',
        isMinor: false,
      },
      {
        id: '罗宾汉泰菲',
        description:
          '布奇的爪刀可以秒罗宾汉泰菲，且罗菲在近距离干扰时容易被布奇抓到机会，但罗菲可以远距离拉扯。',
        isMinor: true,
      },
      {
        id: '表演者•杰瑞',
        description:
          '布奇的高攻击和冲刺的高频伤害可以反制表演者•杰瑞的跳舞，高频控制效果有时也能阻止表演者•杰瑞利用被动和铁血强行救援的意图。',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '剑客莉莉',
        description:
          '剑客莉莉的风墙能阻挡冲刺的布奇，Lv.2提供的霸体和武器技能提供的位移也能相对安全地进行救援。',
        isMinor: true,
      },
      {
        id: '尼宝',
        description: '尼宝的翻滚能躲过布奇的攻击，或是安全地进行救援。',
        isMinor: true,
      },
      {
        id: '剑客泰菲',
        description: '剑客泰菲的头盔能反制布奇的防守奶酪能力，或是安全地进行救援。',
        isMinor: false,
      },
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞推奶酪和自保能力强，烟雾弹还能反制布奇的防守奶酪能力。',
        isMinor: false,
      },
    ],
  },

  /* ----------------------------------- 托普斯 ---------------------------------- */
  托普斯: {
    aliases: ['托斯', '奶猫'],
    description:
      '"流浪猫铁三角"中的一员。托普斯是一只呆萌的小灰猫，喜欢和老鼠交朋友，他智商很高，经常捣鼓出一些令人意想不到的发明。',

    maxHp: 200,
    attackBoost: 0,
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
        description: '通过换位和Lv.3分身提供的霸体反制老鼠的控制。',
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
        description:
          '利用击晕配合Lv.1被动提高控制能力，或是配合捕虫网直接抓住老鼠；皮糙肉厚提高分身的生存能力。',
      },
      {
        cards: ['S-击晕', 'S-乘胜追击', 'A-熊熊燃烧'],
        description: '乘胜追击提高机动性，且能更好地配合击晕和Lv.1被动。',
      },
      {
        cards: ['S-击晕', 'S-乘胜追击', 'A-加大火力', 'C-猫是液体'],
        description: '猫是液体在管道图有较强的机动性。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-长爪', 'B-皮糙肉厚'],
        description:
          '托普斯爪刀较短，长爪能极大幅提高爪刀范围，配合击晕、Lv.1被动和“我生气了”特技打出连续控制和爆发伤害，还能刷取经验。但长爪负面效果也很明显，使用时需再三斟酌，因此本卡组较偏向娱乐。',
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
        description: '配合捕虫网或击晕+Lv.1被动，实现反击效果。',
      },
      {
        name: '我生气了！',
        description: '配合击晕和Lv.1被动，形成连续控制，以此造成高额伤害或刷取经验。',
      },
    ],

    skills: [
      {
        name: '双重猫格',
        type: 'active',
        aliases: ['分身'],
        description:
          '释放一个分身。分身爪刀伤害提高，爪刀CD减少，免疫碎片和老鼠夹，且[继承部分知识卡](大多数知识卡均可继承，其中一部分知识卡效果还能和本体叠加（如“捕鼠夹”的伤害和控制时间延长效果可以二次叠加）；但部分特殊知识卡则无法继承或继承后无效果（如“熊熊燃烧”等）)。分身[共享小地图视野](由于人工智能类角色具有能看到隐身角色的特性，因此分身也能在小地图上透视周围隐身的老鼠，但不会主动攻击)，但[受到的伤害增加](包括受到部分环境伤害时)。分身存在期间本体获得额外技能，点击可指挥分身出击或跟随（有CD）。再次使用主动技能可与分身换位（有CD）。本体[获得部分增益时](包括食物、药水效果，以及部分地图道具效果（如太空堡垒-科研舱药水等）)，分身也会获得。',
        detailedDescription:
          '在一段时间的前摇后，释放一个[与自身相貌相同的分身](昵称与Hp显示和自身本体几乎相同)。分身爪刀伤害提高15，爪刀CD减少，免疫碎片和老鼠夹，且[继承部分知识卡](大多数知识卡均可继承，其中一部分知识卡效果还能和本体叠加（如“捕鼠夹”的伤害和控制时间延长效果可以二次叠加）；但部分特殊知识卡则无法继承或继承后无效果（如“熊熊燃烧”等）)。分身[共享小地图视野](由于人工智能类角色具有能看到隐身角色的特性，因此分身也能在小地图上透视周围隐身的老鼠，但不会主动攻击)，但[受到的伤害增加20](包括受到部分环境伤害时)。分身存在期间本体获得额外技能，点击可指挥分身出击或跟随（CD：5秒）。再次使用主动技能可与分身换位（有CD，与技能等级有关，与技能本身的冷却无关）。本体[获得部分增益时](包括食物、药水效果，以及部分地图道具效果（如太空堡垒-科研舱药水等）)，分身也会获得。分身成功释放后，技能本身的CD就开始倒计时；分身被击倒或消失后，技能切换回本来的CD。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '与分身换位CD为15秒；分身存在一段时间或被击倒后消失。',
            cooldown: 36,
          },
          {
            level: 2,
            description:
              '技能本身的CD减少至24秒；换位CD减少至10秒；换位时回复Hp，且移速和交互速度短暂提高。',
            cooldown: 24,
          },
          {
            level: 3,
            description:
              '技能本身的CD减少至20秒；换位CD减少至5秒；分身不会主动消失；如果分身在本体附近，本体受到的[眩晕控制](不包括斯派克抓取、捕鼠夹、虚弱、仙女鼠8星等)和受到的一半伤害会转移给分身。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '泡泡棒',
        type: 'weapon1',
        description:
          '召唤在场景中漂浮的泡泡，[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在一段时间后消失](有老鼠在其内被困住时则不会自然消失)，可以提前被道具砸破。泡泡被砸破或因挣脱破碎时，对周围的老鼠造成伤害和短暂的爆炸眩晕。直接释放技能会吹出留在原地的泡泡，拖动释放技能则使吹出的泡泡向该方向缓慢漂移。',
        detailedDescription:
          '召唤在场景中漂浮的泡泡，[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在20秒后消失](有老鼠在其内被困住时则不会自然消失)，可以提前被道具砸破。泡泡被砸破或因挣脱破碎时，对周围的老鼠造成25伤害和短暂的爆炸眩晕。直接释放技能会吹出留在原地的泡泡，拖动释放技能则使吹出的泡泡向该方向缓慢漂移。',
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
            description: 'CD减少至12秒。',
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
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的，与抓取逻辑相同)抓到网中，期间老鼠可挣扎挣脱；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠[碰到火箭会被直接绑上](不会触发绑火箭立刻-10秒倒计时的效果)。',
        detailedDescription:
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的，与抓取逻辑相同)抓到网中，期间老鼠可挣扎挣脱；再次使用技能将老鼠扔出，扔出的老鼠落地后受到伤害和短暂眩晕，对落点周围的老鼠也造成伤害和短暂眩晕。扔出的老鼠[碰到火箭会被直接绑上](不会触发绑火箭立刻-10秒倒计时的效果)。捕虫网可以网住[霸体老鼠](如尼宝的灵活跳跃、表演者•杰瑞的梦幻舞步)，但无法网住[带有护盾的老鼠](包括常规护盾和无敌类护盾。常规护盾会被破除一层；无敌类护盾则直接免疫，如剑客泰菲的头盔、罗宾汉杰瑞的降落伞)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
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
            description: 'CD减少至10秒。',
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
            description: '[爪刀命中时](注意：命中虚弱的老鼠也算作爪刀命中)，大幅减少爪刀CD。',
            detailedDescription:
              '[爪刀命中时](注意：命中虚弱的老鼠也算作爪刀命中)，[减少爪刀70%的CD](即变为原本爪刀CD的30%，与部分百分比减CD效果乘算叠加)。',
          },
          {
            level: 2,
            description: '手中老鼠的挣扎速度降低。',
            detailedDescription: '手中老鼠的挣扎速度降低30%。',
          },
          {
            level: 3,
            description: '击中老鼠时，[移除其部分增益效果](包括隐身、远视等)。',
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
          '斗牛可清理道具并对敌方眩晕，2级被动可减少技能CD，在防守时拥有较高的伤害和续航。',
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
        id: '鞭子',
        description: '',
        groups: [
          {
            cards: ['S-乘胜追击', 'S-击晕', 'S-知识渊博'],
            description: '常规卡组',
          },
          {
            cards: ['S-击晕', 'S-乘胜追击', 'A-细心', 'C-猫是液体'],
            description: '大图及管道图，有需求可以把{细心}换成{皮糙肉厚}',
          },
          {
            cards: ['S-击晕', 'S-知识渊博', 'A-威压', 'B-皮糙肉厚'],
            description:
              '叠层流，对前期节奏处理要求高，有需求可以把{威压}换成{穷追猛打}（转为鞭子打架流）',
          },
        ],
        defaultFolded: true,
      },
      {
        id: '弹弓防守流',
        description: '',
        groups: [
          {
            cards: ['S-知识渊博', 'A-熊熊燃烧', 'A-细心', 'A-穷追猛打'],
            description: '常规卡组',
          },
          {
            cards: ['S-知识渊博', 'A-细心', 'A-穷追猛打', 'B-皮糙肉厚', 'B-反侦察'],
            description: '反侦察',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '弹弓追击流',
        description: '',
        groups: [
          {
            cards: ['S-乘胜追击', 'S-知识渊博', 'A-加大火力', 'A-穷追猛打'],
            description: '常规卡组',
          },
          {
            cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description:
              '打架队，如果同时是管道图，{熊熊燃烧}换成{加大火力}或{心灵手巧}（打强控制队）+{猫是液体}',
          },
        ],
        defaultFolded: false,
      },
    ],
    skills: [
      {
        name: '斗牛',
        type: 'active',
        aliases: ['牛哥'],
        description:
          '释放斗牛，破坏[易碎道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块/牛仔杰瑞的仙人掌)，并对老鼠造成伤害和[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
        detailedDescription:
          '释放斗牛，破坏[易碎道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块/牛仔杰瑞的仙人掌)，并对老鼠造成25伤害和1.5秒[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
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
              '7秒内可进行第三次发射，发射一颗大仙人掌球，在碰触实体时爆炸，对周围的敌方造成[60点伤害](不造成受伤)和3.5秒眩晕，同时分裂成10颗小仙人掌球飞向不同方向。',
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
          '剑客泰菲的头盔可以抵挡牛仔汤姆的攻势，长枪的禁用技能可以大幅削弱牛仔汤姆的攻击力。',
        isMinor: false,
      },
      {
        id: '恶魔泰菲',
        description:
          '恶魔泰菲小淘气召唤的蓝恶魔能禁用技能，绿恶魔配合Lv.3被动的极高攻击增伤能迅速击倒牛汤，被动提供的恢复与高移速还能化解鞭子或仙人掌弹弓的消耗。',
        isMinor: false,
      },
      {
        id: '魔术师',
        description:
          '魔术师的主动技能获取的红牌可对牛汤造成干扰，在红牌命中后牛汤将无法使用技能，且正在释放前摇中的技能释放将会中断。兔子大表哥能挡住仙人掌弹弓，升至三级的免疫受伤效果还能克制牛汤的Lv.3被动。',
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
        description: '剑客杰瑞的格挡使斗牛立即消失（我不吃牛肉！）。',
        isMinor: false,
      },
      {
        id: '米可',
        description:
          '米可采访期间免控、有高额减伤，且牛仔汤姆每次释放技能都会被米可叠素材（弹弓会被叠多层）',
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
    description: '拥有惊人美貌的图多盖洛是上东区知名度最高的千金小姐，她的追求者从纽约排到了巴黎。',
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
        description: '香水有强悍的后期防守强度。',
        additionalDescription: '',
        weapon: 1,
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '指甲油的高频率霸体有强大的打架能力。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '后期',
        isMinor: false,
        description: '图多后期有高额伤害和打架能力。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '指甲油和被动的后期强度有一定的翻盘能力。',
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
        description: '击晕流常见配卡。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'S-击晕'],
        description: '指甲油，在前中后期都有较高强度。',
      },
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'A-熊熊燃烧', 'C-猫是液体'],
        description: '指甲油，适合森林牧场，太空堡垒三等管道图。',
      },
      {
        cards: ['S-猛攻', 'S-知识渊博', 'A-细心', 'A-熊熊燃烧'],
        description: '指甲油，适合可以布局的图使用，后期拥有更强的防守翻盘能力。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
        description: '香水指甲油通用，常规追击卡组。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'B-皮糙肉厚', 'B-捕鼠夹'],
        description: '香水，香水图多常规防守卡组。',
      },
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'S-猛攻', 'B-反侦察'],
        description: '指甲油，双经验卡成型更快，后期更强势。',
      },
      {
        cards: ['S-击晕', 'S-知识渊博', 'A-熊熊燃烧', 'C-猫是液体'],
        description: '指甲油，小图且玩家自身找节奏能力强可用。',
      },
      {
        cards: ['S-乘胜追击', 'S-屈打成招', 'A-细心', 'A-穷追猛打'],
        description: '香水。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '通用。',
      },
      {
        name: '蓄力重击',
        description: '绑定击晕。',
      },
      {
        name: '全垒打',
        description: '高爆发能力。',
      },
      {
        name: '我生气了！',
        description: '提高输出。',
      },
      {
        name: '急速翻滚',
        description: '提高机动性。',
      },
    ],
    skills: [
      {
        name: '魅惑之吻',
        type: 'active',
        description:
          '释放一个飞吻，释放后将追踪并锁定附近的老鼠，锁定后将全图追踪且不会更换目标，若追踪途中命中其他老鼠将由其他老鼠承担吻效果，命中老鼠后，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害；受到[控制](包括碎片的僵直、夹子)以及虚弱后将解除被吻效果；飞吻可被护盾、无敌、虚弱和部分地形（包括门、厚墙壁、地面等）阻挡。',
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
            description: '吻可以储存两个，被吻命中的老鼠额外受到减速，增加吻对老鼠的伤害。',
            cooldown: 15,
            detailedDescription: '吻可以储存两个，被吻命中的老鼠额外受到减速24.6%。',
          },
          {
            level: 3,
            description: '被吻命中的老鼠无法使用技能，增加吻对老鼠的伤害。',
            cooldown: 15,
            detailedDescription: '被吻命中的老鼠无法使用技能。',
          },
        ],
        cueRange: '全图可见',
        detailedDescription:
          '前摇0.35s，释放一个飞吻，后摇0.8s，释放后将追踪并锁定吻半径1200范围内的老鼠，锁定后将全图追踪且不会更换目标，若追踪途中命中其他老鼠将由其他老鼠承担吻效果，吻最多存在18s，超过18s将自动消失，命中老鼠后，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害；受到[控制](包括碎片的僵直、夹子)以及虚弱后将解除被吻效果；飞吻可被护盾、无敌、虚弱和部分地形（包括门、厚墙壁、地面等）阻挡。\n一级吻伤害：跳跃1.3/次，移动以每秒8.3的伤害匀速扣血，搬动奶酪以每秒15的伤害匀速扣血（朵朵二被伤害减半），现版本推奶酪不扣血。\n二级吻伤害：跳跃1.8/次，移动以每秒9.8的伤害匀速扣血，搬动奶酪以每秒21的伤害匀速扣血（朵朵二被伤害减半），现版本推奶酪不扣血。\n三级吻伤害：跳跃2.3/次，移动以每秒11.3的伤害匀速扣血，搬动奶酪以每秒32的伤害匀速扣血（朵朵二被伤害减半），现版本推奶酪不扣血。',
        aliases: ['吻'],
      },
      {
        name: '魅力香水',
        type: 'weapon1',
        description:
          '释放香水区域，香水内图多将缓慢恢复健康值，香水内老鼠移动、跳跃、攻击、Hp恢复、推速全面下降。释放香水期间爪刀和投掷道具命中敌方时，将在敌方位置生成香水区域，香水区域重叠时持续时间会少量减少。\n香水区域可被鞭炮、海盗炸药桶、泰菲火箭筒炸飞；可被佩克斯弹琴、表哥传送弹飞；可被蒙金奇撞飞；可被霜月滑铲铲飞。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '释放12次香水区域。',
            cooldown: 16,
            detailedDescription: '释放12次香水区域，释放频率为1s/次。',
          },
          {
            level: 2,
            description:
              '提高释放频率，释放次数增加到18次；香水内图多回复、伤害和爪刀频率提升；提高对老鼠的减益效果。',
            cooldown: 16,
            detailedDescription:
              '释放频率提高至0.8s/次，释放次数增加到18次；香水内图多回复额外增加15/s，伤害提高25，爪刀频率提升30%；香水内老鼠移动速度降低55%，跳跃速度降低20%，攻击降低20、Hp恢复降低5、推速降低30%。',
          },
          {
            level: 3,
            description:
              '增强香水内图多获得的增益效果；提高对老鼠的减益效果。香水内爪刀范围获得提升；老鼠在香水内无法使用技能。',
            cooldown: 16,
            detailedDescription:
              '香水内图多回复额外增加20/s，伤害提高50，爪刀频率提升70%；香水内老鼠移动速度降低80%，跳跃速度降低30%，攻击降低30、Hp恢复降低5、推速降低70%。爪刀范围获得提升；老鼠在香水内无法使用技能。',
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放时',
        cueRange: '全图可见',
        aliases: ['香水'],
        detailedDescription:
          '前摇2.36s，技能释放1s后将释放一次香水区域，香水将存在12s，香水内图多回复额外增加10/s，香水内老鼠移动速度降低30%，跳跃速度降低10%，攻击降低10、Hp恢复降低5、推速降低10%。释放香水期间爪刀和投掷道具命中敌方时，将在敌方位置生成香水区域，香水区域重叠时先释放的香水区域持续时间会减少5s。\n香水区域可被鞭炮、海盗炸药桶、泰菲火箭筒炸飞；可被佩克斯弹琴、表哥传送弹飞；可被蒙金奇撞飞；可被霜月滑铲铲飞。',
      },
      {
        name: '魅力甲油',
        type: 'weapon2',
        description:
          '图多盖洛涂上指甲油，在随后的20s或3次爪刀期间提高图多的移动速度，攻击会产生额外爪击区域（对爪刀有关的知识卡、特技也会生效），对敌人触发当前等级的被动效果并减少健康值，使用额外爪击区域命中敌方不会中断魅惑之吻效果，使用额外爪击区域命中带有反向效果的目标将造成额外伤害（近身亦可），使用额外爪击区域命中受到魅惑之吻影响的目标会造成额外伤害。',
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
              '命中敌人时图多盖洛获得持续缓慢治疗效果，根据命中次数获得神采奕奕状态，每层增加移速、跳跃速度和交互速度，可叠加3层。',
            cooldown: 10,
            detailedDescription:
              '命中敌人时图多盖洛回复额外增加8/s，持续10s，根据命中次数获得神采奕奕状态，移动速度和跳跃速度将提高8%/层，交互速度将提高20%/层，可叠加3层，持续12s，再次命中重置持续时间。',
          },
          {
            level: 3,
            description:
              '强化爪刀命中获得强霸体；强化爪刀第一次命中老鼠时，若老鼠在地面将造成[黏性甲油效果](粘滞6.15s，粘滞期间禁用技能、机器鼠，跳跃速度减少为0，掉落手中的道具（能掉落道具和击晕一致）。老鼠可小范围移动，可购买、拾取、投掷道具，不持续向一个方向移动、跳跃不会减少粘滞时间，仅向一个方向持续移动0.5s将提前挣脱)，若老鼠在空中，其下次落地时造成[黏性甲油效果](粘滞6.15s，粘滞期间禁用技能、机器鼠，跳跃速度减少为0，掉落手中的道具（能掉落道具和击晕一致）。老鼠可小范围移动，可购买、拾取、投掷道具，不持续向一个方向移动、跳跃不会减少粘滞时间，仅向一个方向持续移动0.5s将提前挣脱)，后续强化爪刀不会造成此效果。使用额外爪击区域命中受到魅惑之吻影响的目标会造成额外伤害并获得满层神采奕奕状态。',
            cooldown: 10,
            detailedDescription:
              '强化爪刀命中获得10s强霸体；强化爪刀第一次命中老鼠时，若老鼠在地面将造成[黏性甲油效果](粘滞6.15s，粘滞期间禁用技能、机器鼠，跳跃速度减少为0，掉落手中的道具（能掉落道具和击晕一致）。老鼠可小范围移动，可购买、拾取、投掷道具，不持续向一个方向移动、跳跃不会减少粘滞时间，仅向一个方向持续移动0.5s将提前挣脱)，若老鼠在空中，其下次落地时造成[黏性甲油效果](粘滞6.15s，粘滞期间禁用技能、机器鼠，跳跃速度减少为0，掉落手中的道具（能掉落道具和击晕一致）。老鼠可小范围移动，可购买、拾取、投掷道具，不持续向一个方向移动、跳跃不会减少粘滞时间，仅向一个方向持续移动0.5s将提前挣脱)，后续强化爪刀不会造成此效果。使用额外爪击区域命中受到魅惑之吻影响的目标会造成40额外伤害并获得满层神采奕奕状态。',
          },
        ],
        aliases: ['指甲油'],
        cueRange: '全图可见',
        detailedDescription:
          '前摇1s，图多盖洛涂上指甲油，后摇0.18s，在随后的20s或3次爪刀期间提高图多的移动速度10%，攻击会产生额外爪击区域（对爪刀有关的知识卡、特技也会生效），对敌人触发当前等级的被动效果并造成30固定伤害，使用额外爪击区域命中敌方不会中断魅惑之吻效果，使用额外爪击区域命中带有反向效果的目标将造成额外20伤害（近身亦可），使用额外爪击区域命中受到魅惑之吻影响的目标会造成40额外伤害。',
      },
      {
        name: '香水美人',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '免疫反向效果，遇到道具香水或武器技能香水获得加速。',
            detailedDescription: '免疫反向效果，遇到道具香水或武器技能香水获得加速21%。',
          },
          {
            level: 2,
            description:
              '爪刀和拍子命中额外施加反向。若涂有指甲油，则先触发反向并造成额外少量伤害（近身亦可）。',
            detailedDescription:
              '爪刀和拍子命中额外施加反向，持续9.8s。若涂有指甲油，则先触发反向并造成额外20伤害（近身亦可）。',
          },
          {
            level: 3,
            description: '爪刀和拍子命中额外使目标在一段时间内持续减少Hp。',
            detailedDescription:
              '爪刀和拍子命中额外使目标以2.5/s减少健康值，持续19s，0.5s后将再扣除1.25Hp。',
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
        id: '蒙金奇',
        description: '大后期点出三级吻，克制蒙金奇',
        isMinor: true,
      },
      {
        id: '米可',
        description: '大后期点出三级吻，对米可有一定威胁',
        isMinor: true,
      },
    ],
    aliases: ['母猫', '图多', '土豆', '土豆盖洛'],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞的烟雾弹克制一切防守猫',
        isMinor: false,
      },
      {
        id: '国王杰瑞',
        description: '甲油缺少破盾手段，被护盾克制',
        isMinor: false,
      },
      {
        id: '剑客泰菲',
        description: '剑客泰菲拥有长时间的群体无敌，克制甲油和香水防守',
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
        description: '蓄势一击配合侍卫二级被动可以打死125血量的老鼠',
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
      '图茨拥有娇小的身材和靓丽的脸庞，因为被富养，她性格可爱温柔，广受所有猫和老鼠的喜爱。',
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
      '米特是一只流浪猫，他的尾巴曾在一场流浪猫战争中受过伤，但他十分勇猛，从来不会向敌人认输。',
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
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，根据层数造成额外伤害。在7层野性及以上时绑火箭时会进入6秒强霸体（内置CD：17秒）。',
            detailedDescription:
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，每层野性造成4点额外伤害。在7层野性及以上时绑火箭时会进入6秒强霸体（内置CD：17秒）。',
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
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '速通',
        isMinor: false,
        description: '武器技能可甩火箭',
        additionalDescription: '配合熊熊燃烧，7秒火箭可直接甩。',
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '要移速有移速，要视野有视野，要霸体有霸体。',
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
          '前摇0.4s，向前600范围内施放爱意，造成伤害，后摇1s。根据性别和相对塔拉的朝向而产生不同的效果:\n男性背对：造成60伤害并击晕0.4s，之后每隔2.9s受到0.4s击晕，持续6.9s。\n男性正对：造成30伤害，移动速度降低30%，持续4.85s。\n女性背对：造成30伤害，移动速度降低30%，持续4.85秒。\n女性正对：造成30伤害，移动速度增加20%，持续2.8秒。',
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
            description: '大幅减少CD。',
            cooldown: 10,
            detailedDescription: '减少CD至15s。',
          },
          {
            level: 3,
            description: '大幅增加有效范围。',
            cooldown: 10,
            detailedDescription: '有效范围提高至1100。',
          },
        ],
        canHitInPipe: false,
        videoUrl: 'https://nie.v.netease.com/nie/2021/0128/a9211df79cfb9d8e230ad83a90b97a0f.mp4',
      },
      {
        name: '牛仔鞭索',
        type: 'weapon1',
        description:
          '拖动技能，在面前135度的范围内甩出套索，若套中老鼠，对老鼠造成伤害和减速；再次点击按钮，塔拉将冲向该老鼠位置。当塔拉手中抓有老鼠时，本技能改为可向任意方向扔出老鼠，老鼠碰到火箭将直接绑上，但[不减少引线时间](二级被动和知识卡不受影响)；飞行过程中的老鼠在碰到平台，墙壁，拳头盒子，火箭后停止飞行，获得短暂无敌和加速。',
        detailedDescription:
          '前摇0.5s，拖动技能，在面前135度的范围内甩出套索，套索存在时间0.75s，存在时间内最大飞行距离为1750，对套中的老鼠造成30伤害并减速20%；在使用技能2.9秒后若套中老鼠，再次点击按钮塔拉将以1850的速度冲向该老鼠位置，位移期间获得无法选中效果，位移时间最多4.9s，超过时间将会被直接传送至老鼠旁边。当塔拉用技能位移到老鼠旁边时或套中老鼠4.9s后，对老鼠的减速将解除。当塔拉手中抓有老鼠时，本技能改为可向任意方向以2000速度扔出老鼠，期间老鼠无敌，碰到火箭将接绑上，但[不减少引线时间](二级被动和知识卡不受影响)；飞行过程中的老鼠在碰到平台，墙壁，拳头盒子，火箭后停止飞行，获得无敌效果并加速20%，持续2.9s;飞行过程中[受力不停止飞行](包括鞭炮爆炸，电风扇吹风，轮胎击飞等效果。虽然不停止飞行，但仍会受力并可能改变方向)。套索的捆绑效果不会被无敌，护盾，霸体、[机器鼠](不会破坏机器鼠)等效果抵消或免疫，但造成的伤害、减速、眩晕会被抵消或免疫。',
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
            detailedDescription: '套索命中附加2.9s眩晕并提升塔拉的移速18.5%，持续5s。',
          },
          {
            level: 3,
            description: '减少CD；将老鼠投掷到火箭上时将回复Hp并获得短暂加速。',
            cooldown: 8,
            detailedDescription:
              '减少CD至8s；将老鼠投掷到火箭上后Hp回复提升5/s，移动速度提升25%，持续10s。',
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
            detailedDescription:
              '根据场上男性角色的数量移速提升5%/10%/15%/20%，Hp上限提升20/25/30/35。',
          },
          {
            level: 2,
            description:
              '永久[扩大视野范围1.8倍](覆盖其他远视效果)；绑或扔火箭额外减少2秒引线时间。',
            detailedDescription:
              '永久[扩大视野范围1.8倍](覆盖其他远视效果)；绑或扔火箭额外减少2秒引线时间。',
          },
          {
            level: 3,
            description: '攻击男性角色将使自己获得短暂的霸体，期间缓慢恢复Hp。',
            detailedDescription: '攻击男性角色将使自己获得强霸体，Hp回复提升15/s，持续4.75s。',
          },
        ],
        description: '',
      },
    ],
    counteredBy: [
      {
        id: '牛仔杰瑞',
        description: '牛仔杰瑞一被减控、移速高，不好抓。',
        isMinor: false,
      },
    ],
  },
  /* ----------------------------------- 剑客汤姆 ----------------------------------- */
  剑客汤姆: {
    description: '拥有超群剑术的大师剑客汤姆，是法国万千少女心中的偶像。',
    aliases: ['剑汤'],
    maxHp: 270,
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
        cards: ['S-乘胜追击', 'S-击晕', 'A-穷追猛打', 'C-猫是液体'],
        description: '常用，猫是液体可换为其它三费知识卡',
      },
      {
        cards: ['S-乘胜追击', 'S-击晕', 'B-皮糙肉厚', 'C-猫是液体'],
        description: '鼠方高伤害时使用，猫是液体可换为其它三费知识卡',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '无击晕，新手勿用',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '常用，但无乘胜，怕拉扯',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
        description: '管道重要时用',
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
      '天空列车站的站长，拥有能够看穿他人内心的力量。他博学多才，善于思考，同时也是知识的化身。',
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
              '每组愿望由[7种道具](包括：灰花瓶、蓝花瓶、小鞭炮、鞭炮束、玩具枪、遥控器、捕鼠夹)中的随机3个不重复道具组成。',
            cooldown: 12,
            detailedDescription:
              '每组愿望由[7种道具](包括：灰花瓶、蓝花瓶、小鞭炮、鞭炮束、玩具枪、遥控器、捕鼠夹)中的随机3个不重复道具组成。各道具生成概率相同。',
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
      '她是博学多才的都市美少女，冷静知性，是智慧与美貌并存的化身。她是校园中靓丽的风景线，也是学生眼中博学多识的师长。拥有无限魅力她，其爱慕者多如过江之鲫。',
    maxHp: 250,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动被动武器技能都是伤害性技能，在对局中可造成大量伤害。',
        additionalDescription:
          '主动技能可以对一条直线内的敌人造成伤害；武器技能可以单独造成伤害或者夹住老鼠，也可以配合主动技能造成多段伤害；一级被动可以对老鼠造成更多伤害。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '二级被动可以减少被控时间；主动技能为范围伤害，打架时命中率高。',
        additionalDescription: '三被命中破绽可减少技能CD，进一步提高打架优势。',
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '三级追求者出击可造成控制，配合知识就是力量可造成多段控制。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '在墙缝期混战中追求者在小范围内的命中率高，更大概率造成多倒。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '100112022',
        weaponType: 'weapon1',
        description: '常规加点。',
      },
      {
        id: '脆血加点',
        pattern: '100211022',
        weaponType: 'weapon1',
        description: '适合应对血量低的老鼠。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '常规卡组，当面对剑杰等高伤老鼠或管道不重要时可携带',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '适合打管道图或者打架能力不高的队伍。',
      },
      {
        cards: ['S-乘胜追击', 'A-加大火力', 'A-熊熊燃烧', 'A-穷追猛打'],
        description: '鼠方打架能力较弱且为无管道图。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '通用',
      },
      {
        name: '全垒打',
        description: '配合全垒打的兴奋加速更快的消耗老鼠团队',
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
            description: '追求者速度更快。',
            cooldown: 18,
            detailedDescription: '追求者速度更快，一秒就可以冲至身前。',
          },
          {
            level: 3,
            description: '追求者额外造成爆炸伤害和控制。',
            detailedDescription: '追求者额外造成{25}的爆炸伤害和控制。',
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
          '将手中百科全书投掷出去造成伤害，落地后书籍会打开，一定时间后再次施放技能会让书籍闭合，造成伤害并将老鼠夹住。书籍闭合后存在一定时间，凯特可以通过交互键捡起书籍返还部分冷却并将老鼠直接抓在手中。当书籍闭合时，周围的追求者会快速冲向书籍将其捡起并送还凯特。',
        detailedDescription:
          '将手中百科全书投掷出去造成{25}伤害，落地后书籍会打开，5秒后或再次施放技能会让书籍闭合，造成伤害并将老鼠夹住。书籍闭合后最多存在10秒，凯特可以通过交互键捡起书籍返还5秒冷却并将老鼠直接抓在手中。当书籍闭合时，周围的追求者会快速冲向书籍将其捡起并送还凯特。百科全书与夹子有一些[共性与不同](可以触发捕鼠夹，暴怒，穷追猛打，不能触发夹不住我，乾坤一掷，狡诈)。',
        canMoveWhileUsing: true,
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
            description: 'CD降低。',
            cooldown: 15,
            detailedDescription: 'CD降低5秒。',
          },
          {
            level: 3,
            description: '被书籍砸中会直接添加破绽；提升书籍最长开启状态时长。',
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
              '当老鼠出现在视线范围内时，每1.8秒为老鼠添加一层持续10秒的破绽状态，上限5层。对老鼠造成伤害时，每层破绽增加6点伤害和80经验。每层破绽伤害分独立计算。',
          },
          {
            level: 2,
            description:
              '附近老鼠使用技能、投掷道具、从火箭上救下队友、吃下食物或药水，会获得破绽、为凯特增加移速、减少被控制时间、加快绑火箭速度。',
            detailedDescription:
              '附近老鼠使用技能、投掷道具、从火箭上救下队友、吃下食物或药水，会获得一层破绽、为凯特增加移速、减少50%被控制时间、加快绑火箭速度至约1秒，持续7秒。',
          },
          {
            level: 3,
            description: '击破破绽会减少凯特主动和武器技能CD。',
            detailedDescription: '每击破一层破绽都会减少凯特主动和武器技能2秒CD。',
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
      '苏蕊是最受欢迎的啦啦队队长，充满活力的她，脸上时时刻刻都洋溢着灿烂的笑容。她热爱生活，享受美食，认识她的猫和老鼠都会被她吸引，和她成为朋友。',

    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 7,
    clawKnifeCdUnhit: 5,
    clawKnifeRange: 280,
    initialItem: '鞭炮束',

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
    countersKnowledgeCards: [
      { id: '铁血', description: '苏蕊可以使铁血状态的老鼠自主跟随。', isMinor: false },
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
          '回复50Hp，随着音乐舞动，持续40秒。若手中有老鼠，则放下老鼠并使其自主跟随。舞动时[免疫部分眩晕效果](包括控制道具和部分老鼠技能，但不免疫大部分NPC的控制)，爪刀变为以苏蕊为中心、范围更大的[舞动亮相](CD为5.9秒（未命中）和11.9秒（命中），伤害为70点，不受长爪、乘胜追击影响)，苍蝇拍范围也变为以苏蕊为中心，拍抓会使[老鼠](包括触发三级被动后灵体状态的表演者•杰瑞)自主跟随。舞动时每隔13秒出现爱心提示，此时点击技能按钮将回复30Hp、提升10%移速和15点攻击力。舞动时接触不在捕鼠夹上的虚弱老鼠或[刚被击倒的老鼠](包括刚进入知识卡铁血、表演者•杰瑞一级被动、佩克斯三级被动状态的老鼠)，将使其自主跟随。自主跟随持续30秒，在此状态下，老鼠解除并免疫虚弱，无法使用技能和道具、进行交互或主动移动，但仍能受到伤害和[部分控制](不包含冰块、鞭炮、老鼠夹造成的控制)，且遇到火箭会立刻绑上。若老鼠与苏蕊距离较远（如苏蕊钻管道后），则老鼠会提前解除跟随。',
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
        cancelableSkill: ['本技能键'],
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
            description:
              '[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)击中[敌方](含虚弱老鼠、鸭子)时将重置律动时间的CD。',
            detailedDescription:
              '[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)击中[敌方](含虚弱老鼠、鸭子)时将重置律动时间的CD。',
          },
        ],
      },
    ],
  },
  /* ----------------------------------- 天使汤姆 ----------------------------------- */
  天使汤姆: {
    description:
      '天使汤姆乘坐库博的天国火车，从神秘的天堂中而来。身穿纯白色长袍，头戴天使光环的他认为猫和老鼠都应该有快乐的空间，温柔善良的他脸上始终带着一抹浅浅的微笑，手持小竖琴时不时传来悠扬的乐声，让猫猫鼠鼠们忍不住靠近。',
    maxHp: 230,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 8,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '打架',
        isMinor: true,
        description: '伤害高应对高Hp老鼠，Lv.2被动为打架提高霸体和回血。',
        additionalDescription: '对打架阵容有很强的反制能力。',
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '飞行状态速度快，追击能力强。',
        additionalDescription: '新增标签介绍',
      },
      {
        tagName: '速通',
        isMinor: false,
        description: '前期压制力强，很容易抓住机会打多倒。',
        additionalDescription: '新增标签介绍',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description:
          '伤害高，很容易处理124Hp老鼠；Lv.2被动提供霸体以及飞行吸火箭，上火箭能力较强。',
        additionalDescription: '新增标签介绍',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '抓住机会打多倒，飞行快速吸火箭，逆转劣势。',
        additionalDescription: '新增标签介绍',
      },
    ],
    skillAllocations: [
      {
        id: '优先二级被动',
        pattern: '12200[1102]',
        weaponType: 'weapon1',
        description:
          '优先二级被动提供霸体和回血，但容易被断飞行。三个技能的Lv.3提升幅度都较为一般，因此后期加点顺序随意。',
      },
      {
        id: '优先二级飞行',
        pattern: '12210[0012]',
        weaponType: 'weapon1',
        description:
          '霸体会晚一点点出来，手绑火箭能力可能较差，但不容易被干扰断飞行，但吸火箭范围大砍后，长时间飞行可能会罚站。三个技能的Lv.3提升幅度都较为一般，因此后期加点顺序随意。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-屈打成招', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
        description:
          '可以作为入门卡组使用，穷追前期也有更多的压制力，屈打提供更多拦截能力。\n熟悉后可以选择性把穷追换成皮糙应对高伤阵容，也可以穷追换加大提高更多火箭收益。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚', 'A-加大火力', 'B-捕鼠夹'],
        description:
          '面对支援能力快的队伍，屈打收益较低，可以换成其他卡。\n捕鼠夹也可以选择性的换成反侦察，例如夹子比较少的地图。',
      },
      {
        cards: ['A-熊熊燃烧', 'A-细心', 'C-猫是液体', 'B-皮糙肉厚', 'A-加大火力'],
        description: '在牧场天宫等其他管道图使用。',
      },
    ],
    specialSkills: [
      {
        name: '蓄力重击',
        description: '配合飞行爪刀眩晕可以补伤害。',
      },
      {
        name: '绝地反击',
        description: '通用性高，前期过渡至二被，手绑能力提高。',
      },
    ],
    skills: [
      {
        name: '自由翱翔',
        type: 'active',
        aliases: [],
        description:
          '切换摇杆进行飞行。爪刀CD减少、并附带眩晕。\n在飞行时对虚弱的老鼠再次点击技能，可以吸引距离最近的一个火箭并将该老鼠直接绑到火箭上，同时提高燃烧速度25%。\n飞行过程中无法将老鼠抓到手中，当手中有老鼠时，飞行会导致老鼠掉落。',
        detailedDescription:
          '切换摇杆进行飞行，水平方向速度1310，竖直方向600。爪刀CD变为2s/4s、并附带眩晕1.1秒。飞行期间可以穿过部分平台。\n在飞行时对虚弱的老鼠再次点击技能，可以吸引距离最近的一个火箭并将该老鼠直接绑到火箭上，同时提高燃烧速度25%，但没有绑老鼠减10秒的效果。动作前摇0.45秒，后摇0.45秒，吸火箭范围4350。\n飞行过程中无法将老鼠抓到手中，当手中有老鼠时，飞行会导致老鼠掉落。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '移动键', '道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=127.35',
        skillLevels: [
          {
            level: 1,
            description: '飞行持续15秒，受到眩晕和虚弱后将解除飞行状态。',
            cooldown: 16,
            detailedDescription: '飞行持续15秒，受到眩晕和虚弱后将解除飞行状态。',
          },
          {
            level: 2,
            description: '受到眩晕将不会解除飞行状态，眩晕时仍然可以上下飞行。',
            cooldown: 16,
            detailedDescription: '受到眩晕将不会解除飞行状态，眩晕时仍然可以上下飞行。',
          },
          {
            level: 3,
            description: '提高飞行时间至25秒。',
            detailedDescription: '提高飞行时间至25秒。',
            cooldown: 16,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '万有引力',
        type: 'weapon1',
        description:
          '吸引一定范围内的三个[部分类型的易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/香水瓶/冰块)，再次拖拽技能可以瞄准投掷出去。可消耗道具抵挡一部分伤害。',
        detailedDescription:
          '吸引2500范围内最近的三个[部分类型的易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/香水瓶/冰块)在周围围绕，持续30秒，再次拖拽技能可以瞄准投掷出去（被投掷的道具无视部分平台），点按则自动瞄准并投掷，动作前摇0.2秒。受到伤害时，可消耗一个道具使受到的伤害降低20。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*', '移动键'],
        cancelableAftercast: ['跳跃键', '道具键*', '移动键'],
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=16',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
            detailedDescription: '',
          },
          {
            level: 2,
            description: '范围内道具不足时，会自行补充至三个。',
            cooldown: 12,
            detailedDescription:
              '范围内道具不足时，会自行补充至三个。玻璃杯/碗/盘子/扁盘50%，灰花瓶20%，冰块20%，香水瓶10%。',
          },
          {
            level: 3,
            description: '有道具围绕自身时，不会虚弱。',
            cooldown: 12,
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '天使强化',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=102.4',
        skillLevels: [
          {
            level: 1,
            description: '投掷命中后降低其被救援速度。',
            detailedDescription: '投掷命中后降低其被救援速度62.5%，持续60秒。',
          },
          {
            level: 2,
            description: '投掷命中后获得霸体和回血。',
            detailedDescription: '投掷命中后获得弱霸体和50/秒的Hp恢复效果，持续3秒。',
          },
          {
            level: 3,
            description: '一定范围内有敌方投掷道具时，自身移速提高。',
            detailedDescription: '900范围内有敌方投掷道具时，自身移速提高20%，持续8秒。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '剑客莉莉',
        description:
          '天汤飞行，导致投掷物不容易而命中获得二被无敌，同时武器技能投掷也会影响莉莉救援。',
        isMinor: false,
      },
    ],
    attackBoost: 15,
    counteredBy: [
      {
        id: '剑客泰菲',
        description: '头盔强救能力天汤不好处理。',
        isMinor: false,
      },
      {
        id: '牛仔杰瑞',
        description: '两个技能都可以打断飞行，也会消耗天汤道具。',
        isMinor: true,
      },
      {
        id: '马索尔',
        description: '传送救援让天汤的拦截能力大打折扣，同时无畏配合逃之夭夭很容易拉开吸火箭范围。',
        isMinor: true,
      },
      {
        id: '尼宝',
        description: '翻滚救援不好拦截，也能在一定程度上反制放生转身刀。',
        isMinor: true,
      },
      {
        id: '表演者•杰瑞',
        description: '一被配合铁血，即可以强救队友，也可以消耗天汤飞行导致不好吸火箭。',
        isMinor: false,
      },
      {
        id: '莱恩',
        description: '蓝图打断飞行，圆消耗武器道具，且莱恩多缴械。',
        isMinor: true,
      },
      {
        id: '蒙金奇',
        description: '不好处理战车 ，且蒙金奇多干扰投掷和缴械。',
        isMinor: true,
      },
      {
        id: '米可',
        description: '采访容易打断飞行，同时也不好处理采访中的米可',
        isMinor: false,
      },
      {
        id: '霜月',
        description: '滑铲打断飞行且免死。',
        isMinor: false,
      },
    ],
    counteredByKnowledgeCards: [
      {
        id: '缴械',
        description: '被禁爪刀会导致飞行不好接蓄力重击以及其他情况补伤害。',
        isMinor: false,
      },
      {
        id: '铁血',
        description: '铁血强救，同时还能消耗天汤飞行时间导致不好吸火箭。',
        isMinor: false,
      },
      {
        id: '不屈',
        description: '加的血量会导致很多情况差一点伤害，加移速也会导致不好抓人。',
        isMinor: false,
      },
      {
        id: '夹不住我',
        description: '天汤多细心布夹子，夹不住我破夹子。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        id: '魔术漂浮',
        description: '飞行可以打漂浮，且漂浮中很容易被武器道具瞄准。',
        isMinor: true,
      },
      {
        id: '冰冻保鲜',
        description: '容易被卡蓄力重击。',
        isMinor: false,
      },
    ],
    counteredBySpecialSkills: [
      {
        id: '干扰投掷',
        description: '会打断一级飞行。',
        isMinor: false,
      },
    ],
    aliases: ['天汤'],
  },
  /* ----------------------------------- 斯飞 ----------------------------------- */
  斯飞: {
    aliases: [],
    description:
      '因为与众不同的花色，斯飞在其他猫的眼里是个十足的怪猫。习惯独来独往的他从不和其他猫交流，独自一人住在城市的最中心，充满了神秘感。[夜深人静的时候，他总会拿着一个挂坠，似乎在思念着谁](猫鼠动画里毛色相似的小猫是他妹妹)。',
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
        description: '被动的加速使追击老鼠较为轻松。',
        additionalDescription: '',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动和武器技能均有伤害和控制，轻松击倒老鼠；被动的感电增强上火箭能力。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '三级武器技能命中刷新CD，有一定翻盘能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '新手',
        pattern: '0101[02]221',
        weaponType: 'weapon1',
        description: '初步接触的加点，六级时如果血量健康可以优先点出武器技能。',
      },
      {
        id: '熟练',
        pattern: '010202211',
        weaponType: 'weapon1',
        description: '熟练后的推荐加点，要求对武器技能的熟练度。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-暴怒', 'A-熊熊燃烧'],
        description:
          '萌新玩家可快速凑出本卡组度过开荒期，当资源足够或熟练后不推荐。管道图中，"暴怒"可替换为"加大火力"+"猫是液体"。',
      },
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '经典776卡组，击晕依赖玩家选择，略有过时。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-心灵手巧', 'A-加大火力'],
        description:
          '主流卡组，心灵手巧可以使感电效果几乎持续到绑完火箭。可将最后两张换为"穷追猛打"，快速打开前期节奏；如遇打架队则可换为"皮糙肉厚"。',
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
            description: '减少CD；技能期间免疫控制。',
            cooldown: 12,
            detailedDescription: '减少CD；技能期间免疫控制。',
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
          '前摇0.45秒，扔出项坠，0.75秒后或项坠碰撞到地面/墙壁后，斯飞以2000的速度向项坠飞去，飞行期间对碰到老鼠造成50点普通伤害、10点[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)和0.6秒眩晕。释放瞬间如果角色方向改变，将同时改变项坠方向。技能可以穿门。',
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
              '斯飞以[一定移速](约基础速度90%)奔跑1.5秒后进入疾冲状态：\n1. 提高移动和跳跃速度；\n 2.获得迅捷效果，获得加速，无视碎片、反向、失明、烫伤、感电、捕鼠夹；\n3. 爪刀强化为向前扑击；\n4. 触碰到老鼠时对其造成10点[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)并眩晕0.6秒。\n当使用爪刀、施放技能或移速降到[一定数值](约为正常疾冲速度75%)时将退出疾冲状态。',
            detailedDescription:
              '斯飞以[一定移速](约基础速度90%)奔跑1.5秒后进入疾冲状态：\n1. 提高移动和跳跃速度；\n 2.获得迅捷效果，获得加速，无视碎片、[反向、失明](包括魔术师的黄牌，拿坡里的足球，玛丽的扇子与反向)、烫伤、感电、捕鼠夹；\n3. 爪刀强化为以2000速度向前扑击0.15秒；\n4. 触碰到老鼠时对其造成10点[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)并眩晕0.6秒，同目标10秒内不会重复触发。\n当使用爪刀、施放技能或移速降到[一定数值](约为正常疾冲速度75%)以下0.5秒后将退出疾冲状态。',
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
        description: '航海士杰瑞不仅控制多，还能炸火箭。',
        isMinor: true,
      },
      {
        id: '尼宝',
        description: '尼宝救人很稳，技能能让自身霸体和钩子让猫强制位移。',
        isMinor: false,
      },
      {
        id: '剑客杰瑞',
        description: '剑客杰瑞伤害高，容易击倒未点出三级被动的斯飞。',
        isMinor: true,
      },
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞推速很快，自保较强，很容易加快游戏节奏。',
        isMinor: true,
      },
      {
        id: '牛仔杰瑞',
        description: '斯飞须格外小心牛杰仙人掌的控制与减速。',
        isMinor: false,
      },
    ],
    counters: [
      {
        id: '魔术师',
        description: '斯飞的被动免疫魔术师黄色卡牌，同时魔术师缺乏自保和打架能力。',
        isMinor: false,
      },
      {
        id: '玛丽',
        description: '斯飞的被动免疫玛丽的扇子技能，同时玛丽缺乏打架能力。',
        isMinor: false,
      },
      {
        id: '侦探泰菲',
        description: '斯飞的被动能免疫击倒侦探泰菲的分身带来的失明效果。',
        isMinor: true,
      },
      {
        id: '剑客莉莉',
        description: '斯飞的高机动性让莉莉的干扰不起作用。',
        isMinor: true,
      },
      {
        id: '仙女鼠',
        description: '斯飞变成大星星也能吃到被动，仙女鼠的减速可以忽略。',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        id: '投手',
        description: '投手的高额减速很容易使斯飞退出疾冲状态。',
        isMinor: false,
      },
    ],
    counteredBySpecialSkills: [
      {
        id: '干扰投掷',
        description: '干扰投掷可以使斯飞退出疾冲状态。',
        isMinor: false,
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

  /* ----------------------------------- 恶魔汤姆 ----------------------------------- */
  恶魔汤姆: {
    description:
      '恶魔汤姆驾驶着列车从深渊呼啸而来。他通体火红，脑袋上有一对略显狡黠的小触角，手持三叉戟的他一直鼓动着汤姆在老鼠面前找回场子。狡黠的恶魔汤姆身边还有一群忠诚的仆从，他们会不遗余力地完成主人的任何指令。',
    maxHp: 200,
    hpRecovery: 1.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 8,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '列车可用于守奶酪和火箭，并且列车可以为恶魔汤姆提供护盾效果。',
        additionalDescription: '',
        weapon: 1,
      },
      {
        tagName: '后期',
        isMinor: false,
        description: '由于适配越挫越勇，恶魔汤姆在后期强度与前期有较大差距。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '通用加点',
        pattern: '1220(2)0011',
        weaponType: 'weapon1',
        description:
          '三级火车技能真空期比二级火车真空期长，视情况考虑是否留点，不需要时可先跳过该加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '贡献者推荐',
        description: '卡组提供者-无敌猫虎大王wy(现猫榜第32名)',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'A-加大火力'],
            description: '御门酒店使用，对面高伤阵容换成越挫。',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'A-穷追猛打'],
            description: '常规地图使用。',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-越挫越勇', 'A-穷追猛打'],
            description: '常规地图，对面高伤阵容时使用。',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
            description: '森林牧场使用，对面高伤阵容则把皮糙换成越挫。',
          },
        ],
        defaultFolded: false,
      },
    ],
    specialSkills: [
      {
        name: '我生气了！',
        description: '二级火车撞飞敌人后短时间内爪刀冷却减少，搭配我生气了可实现爪刀几乎无冷却。',
      },
      {
        name: '蓄力重击',
        description: '造成控制的手段较多，可趁使用重击。',
      },
    ],
    skills: [
      {
        name: '狂欢时刻',
        type: 'active',
        aliases: ['打碟'],
        description:
          '[获得霸体，持续10s](该霸体免疫绝大部分控制效果，但不免疫虚弱)。技能期间对附近的敌人造成持续伤害和减速，且敌人头顶会出现舞步指令，若未按照头顶提示的方向移动则会受到伤害和眩晕。',
        detailedDescription:
          '[获得霸体，持续10s](该霸体免疫绝大部分控制效果，包括仙女鼠八星的变身效果，但不免疫虚弱。技能期间被莱恩变身为线条猫时，技能不中断)。技能期间对附近的敌人造成持续伤害和减速，且敌人头顶会出现舞步指令，若未按照头顶提示的方向移动则会受到伤害和眩晕。技能释放期间同步进入读条，释放完毕后才会进入冷却。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
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
            description: '持续伤害提升，舞步指令更加频繁。',
            cooldown: 30,
          },
          {
            level: 3,
            description: 'CD降低10s。',
            detailedDescription: 'CD降低10s。',
            cooldown: 20,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '迷乱列车',
        type: 'weapon1',
        description:
          '召唤列车沿固定轨道冲撞，对被撞击的敌人施加伤害，眩晕和击退效果。冲撞完成后重新生成下一段列车，重复数次。',
        detailedDescription:
          '召唤列车沿固定轨道冲撞，对被撞击的敌人施加50伤害，并造成眩晕和击退效果。冲撞完成后重新生成下一段列车，重复数次。被冲撞过的老鼠短时间内获得冲撞免疫效果，期间免疫列车冲撞带来的伤害和控制，但被撞击仍会造成小幅度位移。\n注：列车前摇释放完毕后进入技能冷却，列车冲撞结束后，技能剩余冷却时间为技能真空期。1级真空期约10秒，2级真空期约2s，3级真空期约6s。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '列车共冲撞3次。',
            cooldown: 20,
            detailedDescription: '列车共冲撞3次，共持续约10s。',
          },
          {
            level: 2,
            description:
              '释放列车成功后给予一层护盾，列车冲撞次数提升至5次，列车经过恶魔汤姆会使恶魔汤姆获得一层护盾，撞击老鼠会使恶魔汤姆爪刀CD固定降低。',
            cooldown: 20,
            detailedDescription:
              '释放列车成功后给予一层护盾。列车冲撞次数提升至5次，共持续约18s。列车经过恶魔汤姆会使恶魔汤姆获得一层护盾。撞击老鼠会使恶魔汤姆[爪刀CD固定降低3.5秒](空刀CD由命中时的CD乘角色内置的空刀返还CD比例得到。对于恶魔汤姆来说，2级列车减少爪刀CD后，空刀冷却约2.2s，命中敌方冷却约4.5s)。',
          },
          {
            level: 3,
            description: '同时召唤两段列车冲撞，但列车冲撞次数降低为4次。',
            cooldown: 20,
            detailedDescription: '同时召唤两段列车冲撞，但列车冲撞次数降低为4次。共持续约14s。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '感同身受',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '恶魔汤姆对处于异常状态的敌人造成额外伤害，可叠加。',
            detailedDescription:
              '恶魔汤姆对处于[异常状态](包括眩晕，反向，失明，冰冻，感电，爆炸，狂欢时刻的特殊减速)的敌人造成的伤害额外提高5，且可叠加。',
          },
          {
            level: 2,
            description:
              '恶魔汤姆附近的敌人每隔一段时间受到一个随机异常状态，并且会将自身异常状态扩散给队友。',
            detailedDescription:
              '恶魔汤姆附近500范围内的老鼠每隔5秒受到一个随机[异常状态](3秒反向；3秒失明；2.1秒爆炸眩晕和1点伤害；2.3秒冰冻眩晕和1点伤害)，并且会将自身异常状态扩散给队友。爆炸和冰冻异常状态只有在每15秒时才会触发，且必然触发。该技能效果可被大部分护盾效果免疫或抵消。',
          },
          {
            level: 3,
            description: 'Lv.2被动触发时，自身根据周围陷入异常状态的敌人数量获得额外增益。',
            detailedDescription:
              'Lv.2被动触发时，自身根据周围陷入异常状态的老鼠数量获得持续5秒的额外增益：\n1只：移速增加20%，HP恢复增加2.5/s；\n2只：在1只的基础上，视野范围约提高至原先的3.58倍；\n3只：在2只的基础上，获得一层护盾；\n4只：在3只的基础上，获得100攻击增伤。',
          },
        ],
        description:
          '恶魔汤姆绑火箭拥有特殊机制：第一段为[恶魔汤姆对其仆从小恶魔施加指令](可被道具键打断)，约1.2s，第二段为小恶魔将老鼠绑上火箭的过程，约1.7s，期间老鼠[脱离恶魔汤姆本体](不会因恶魔汤姆眩晕或挣扎进度条充满而挣脱，但如果火箭在此期间被毁则不会被绑上)。',
        detailedDescription:
          '恶魔汤姆绑火箭拥有特殊机制：第一段为[恶魔汤姆对其仆从小恶魔施加指令](可被道具键打断)，约1.2s，第二段为小恶魔将老鼠绑上火箭的过程，约1.7s，期间老鼠[脱离恶魔汤姆本体](不会因恶魔汤姆眩晕或挣扎进度条充满而挣脱，但如果火箭在此期间被毁则不会被绑上)。',
      },
    ],
    counters: [
      {
        id: '牛仔杰瑞',
        description: '列车克制霸体角色，且恶魔汤姆技能免控以及列车给予护盾，牛仔杰瑞很难刷出霸体',
        isMinor: false,
      },
      {
        id: '米可',
        description: '恶魔汤姆技能免控，列车冲撞会给予其护盾，列车克制霸体角色',
        isMinor: false,
      },
      {
        id: '国王杰瑞',
        description: '恶魔汤姆主流特技我生气了和列车克制国王小盾，降低国王容错',
        isMinor: true,
      },
      {
        id: '罗宾汉泰菲',
        description: '圆球会被恶魔汤姆护盾抵消，列车克制霸体角色',
        isMinor: false,
      },
      {
        id: '表演者•杰瑞',
        description: '列车克制霸体角色，表演者跳舞期间易被火车连撞',
        isMinor: false,
      },
    ],
    aliases: ['恶汤', '红薯'],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description: '速推克制恶魔汤姆死守，三级烟雾弹禁用技能',
        isMinor: false,
      },
      {
        id: '剑客泰菲',
        description: '头盔掩护队友强推奶酪，长枪禁用技能',
        isMinor: false,
      },
    ],
  },

  /* ----------------------------------- 追风汤姆 ----------------------------------- */
  追风汤姆: {
    description:
      '因为一场神秘的实验意外而降落于猫鼠五周年特别纪念展的不速之客，天生充满了对蓝天的向往，热爱钻研新奇的发明，脑袋里充满稀奇古怪的创意，立志成为猫咪界第一位飞行员，在汤姆和杰瑞的陪伴下被纪念展的内容所打动，来到这里继续进行新的创意发明。',
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
          '追风三级成型，在前期对鼠方的压制力很大。同时追风等级提升很小，因此需要快速减员，尽早赢下比赛。',
        additionalDescription: '',
      },
      {
        tagName: '追击',
        isMinor: true,
        description: '飞行时不受常规地形约束且移速快，提供很好的追击手段。',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: true,
        description:
          '守火箭能力强，风的范围大，易命中并击退前来救援的老鼠，且CD短；飞行时自身的碰撞箱可以打断老鼠跳救使其踩夹；风可以吹飞果盘，有一定守墙缝能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '稳重流',
        pattern: '210002112',
        weaponType: 'weapon1',
        description: '先点出三级被动，提高上火箭、追击和打架能力。',
      },
      {
        id: '激进流',
        pattern: '212112000',
        weaponType: 'weapon1',
        description: '先点出二级武器，提高守火箭能力。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '蓄势一击',
        description: '蓄势一击上限更高，拿刀快，可以提高拿节奏能力',
        defaultFolded: false,
        groups: [
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
            description:
              '推荐新手带，下限较高。开局提前布局放夹子，可以有效克制知识卡-幸运，同时提高守火箭能力。对面选出多个破夹能力强的角色时慎用',
          },
          {
            cards: ['S-蓄势一击', 'S-屈打成招', 'A-熊熊燃烧', 'C-猫是液体'],
            description:
              '上限很高。屈打方便拦截救人和换绑，可以做到一波杀穿，管道图效果更佳。缺点是血脆，易断节奏；同时下限很低，推荐熟练度高的带',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'B-皮糙肉厚'],
            description: '上限极高，适用地图和阵容最广，万金油卡组。但不推荐在牧场、酒店图带',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'C-猫是液体', 'C-狡诈'],
            description:
              '牧场、酒店图带这套。一直采花可以弥补移速和续航的不足(亦可将“加大火力”替换为“细心”)。若有21知识点，可将“狡诈”换为“攻其不备”或“捕鼠夹”',
          },
          {
            cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'A-穷追猛打'],
            description: '推荐在游乐场及部分非管道大图带，方便开节奏保下限，面对打架队慎用',
          },
        ],
      },
      {
        id: '击晕',
        description: '击晕适合新手，容错高，守火箭能力更强',
        defaultFolded: true,
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
            description:
              '推荐新手带，下限较高。开局提前布局放夹子，可以有效克制知识卡-幸运，同时提高守火箭能力。对面选出多个破夹能力强的角色时慎用',
          },
          {
            cards: ['S-击晕', 'S-屈打成招', 'A-熊熊燃烧', 'C-猫是液体'],
            description:
              '上限很高。屈打方便拦截救人和换绑，可以做到一波杀穿，管道图效果更佳。缺点是血脆，易断节奏；同时下限很低，推荐熟练度高的带',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'B-皮糙肉厚'],
            description: '上限极高，适用地图和阵容最广，万金油卡组。但不推荐在牧场、酒店图带',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'C-猫是液体', 'C-狡诈'],
            description:
              '牧场、酒店图带这套。一直采花可以弥补移速和续航的不足(亦可将“加大火力”替换为“细心”)。若有21知识点，可将“狡诈”换为“攻其不备”或“捕鼠夹”',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'A-穷追猛打'],
            description: '推荐在游乐场及部分非管道大图带，方便开节奏保下限，面对打架队慎用',
          },
        ],
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
      {
        id: '米可',
        description: '追风的飞行霸体无视米可采访的弱化和叠素材，可以蓄势一刀打死',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '应急治疗',
        description: '推荐在没带知识卡皮糙肉厚或面对高伤阵容时带。',
      },
      {
        name: '绝地反击',
        description: '推荐面对多控阵容时带。',
      },
      {
        name: '蓄力重击',
        description:
          '推荐在对面选出魔术师时带，用于秒杀兔子大表哥，防止因为缺伤害导致处理不了兔子举秒飞而无法及时减员。',
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
          '未处于飞行状态时，向前释放飓风，前摇0.5秒，后摇0.75秒。飓风速度1000，存在2秒，[可推动沿途的道具和部分场景物](但飓风也会因此减速)，可被墙体阻挡；多个风之间不可叠加。飓风命中敌方将造成20伤害和2秒击退，击退速度为550。击退期间对触碰到的[所有单位](包括追风汤姆)造成35伤害，对敌方额外造成1.5秒眩晕。\n处于飞行状态时，向正下方扔出铁砧(无前后摇)。铁砧下落1.6秒或命中后对附近敌方造成小范围的[18伤害和1.2秒眩晕](老鼠被铁砧眩晕期间及其效果结束后1秒内不会再受到铁砧效果)。铁砧可穿越小平台。\n当手中有老鼠时，会优先[扔出老鼠](扔需要消耗一次技能)，使其回复60血，并自动绑上碰到的火箭，但会被其他敌方单位阻挡；攻击效果等于飓风/铁砧；老鼠在被扔出期间可使用技能和道具、进行交互、免疫伤害（追风的俯冲伤害除外），但不免疫控制。',
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
            description: '无任何效果。',
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
          'Lv.0: [走地状态下](不处于空中时，即不包括处于跳跃，坠落等状态中)，逐渐累积飞行时间。未处于飞行状态时爪刀CD减少。飞行状态下视野增大，可托起其他角色，并提高移速。飞行时[免疫控制](同时不会被米可采访锁定；不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会减少飞行时间。飞行状态可随时退出，但会清空剩余飞行时间。飞行被[强制打断](如被狗抓、被打死)会暂时禁用主动技能。',
        detailedDescription:
          'Lv.0: [走地状态下](不处于空中时，即不包括处于跳跃，坠落等状态中)，每秒获得1秒飞行时间，最多储存10秒。未处于飞行状态时爪刀CD减少35%；飞行状态下[视野范围增加55%](覆盖其他远视效果)，可托起其他角色，无视小平台阻挡，并提高移速至水平1015、竖直840。悬停时角色会自动向前以水平350、竖直30的速度下落。飞行时[免疫控制](不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会[减少2秒飞行时间](若此时剩余飞行时间少于2秒，受到伤害时也会受到其对应的控制效果)。飞行状态可随时退出，但会清空剩余飞行时间。“退出飞行状态”这一操作无cd。飞行被[强制打断](如被狗抓、被打死)会使主动技能进入10秒CD。该冷却不可通过吃蛋糕回复。',
      },
    ],
    aliases: ['追汤', '坠机汤姆'],
    counteredBy: [
      {
        id: '梦游杰瑞',
        description: '梦游杰瑞受击后的滑行碰撞可以秒破追风飞行，而且蓄势一刀秒不掉，推得也快。',
        isMinor: true,
      },
      {
        id: '魔术师',
        description: '魔术师带二武刷经验能形成等级压制；同时追风缺伤害，难以处理血厚的兔子大表哥。',
        isMinor: false,
      },
      {
        id: '天使杰瑞',
        description:
          '天使杰瑞一被和三被让追风无法快速拿刀，雷云减伤可以放大追风缺伤害的缺点，打团也很强。祝福可以一定程度上反制追风飞行强上火箭，但追风可以通过鞭尸消除祝福',
        isMinor: false,
      },
      {
        id: '牛仔杰瑞',
        description: '一被提升自保能力，二级琴和二被进一步提升自保并且具有副推副救能力',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        id: '不屈',
        description: '不屈增加的额外血量增大了追风打倒老鼠的难度',
        isMinor: true,
      },
    ],
  },

  /* ----------------------------------- 如玉 ----------------------------------- */
  如玉: {
    description:
      '畅音阁的当家旦角如玉，身段灵动优雅，唱腔娴熟婉转，在多年苦练后，终于如愿在戏台上展现自己的风姿。作为一只猫，优秀的柔韧性，使得如玉的青旦角色身姿优雅，更将水袖与扇子舞动的如天外来仙。极佳的弹跳能力，更是帮助她的刀马旦角色在戏台上下翻飞，如同一位除暴安良的侠女。怀揣着心中的正义与对金城的眷恋，如玉手中常持一杆花枪。尽管没有法力，可她依旧尝试保卫自己的家园，守护金城的和平和安定。',
    maxHp: 210,
    hpRecovery: 3.5,
    moveSpeed: 780,
    jumpHeight: 420,
    clawKnifeCdHit: 3,
    clawKnifeCdUnhit: 3,
    clawKnifeRange: 270,
    initialItem: '鞭炮束',
    catPositioningTags: [
      {
        tagName: '打架',
        isMinor: false,
        description: '主动技能提供解控，被动技能提供免疫眩晕和延迟虚弱，使如玉有很强的打架能力。',
        additionalDescription:
          '爪刀会被当作技能，不怕缴械，但很怕封锁技能类的干扰。另外注意“花枪反击”期间没有霸体，可能被敌方中断。',
      },
      {
        tagName: '进攻',
        isMinor: true,
        description: '技能和特殊爪刀均能造成伤害。手中有老鼠时也能攻击。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '主点掷枪',
        pattern: '120220(0)11',
        weaponType: 'weapon1',
        description:
          '被动技能“戏剧转折”提供的“坚毅”效果能免疫眩晕并延迟虚弱，是如玉的核心。掷花枪升级能大幅减少CD，提高主动进攻的能力。被动技能Lv.3会提高进入“坚毅”状态的回血量，可能不利于快速触发“坚毅”状态，应视情况决定加点与否。',
      },
      {
        id: '主点被动',
        pattern: '1200(0)2211',
        weaponType: 'weapon1',
        description: '提前加点被动技能能更早享受到免疫眩晕的效果，但一定程度上降低了攻击能力。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-暴怒', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
        description:
          '常规卡组。如玉被动提供的“坚毅”状态使她无需虚弱即可享受暴怒效果，暴怒提供的可观攻击增伤又能让如玉更容易造成敌方虚弱，从而退出“坚毅”状态，适配性不错。',
      },
      {
        cards: ['S-暴怒', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '常规卡组变种。猫是液体在管道图十分灵活。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '增强如玉的打架能力。',
      },
      {
        name: '我生气了！',
        description: '大幅缩短特殊爪刀CD，可配合跳跃劈枪造成大量伤害。',
      },
    ],
    skills: [
      {
        name: '舞花枪',
        type: 'active',
        aliases: [],
        description:
          '舞起花枪，持续5秒，期间免疫碎片、可移动跳跃但无法交互，每隔一段时间对碰触的老鼠造成伤害和可叠加的减速，最高叠加4层。技能期间受到来自老鼠的伤害时，可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其触发“花枪反击”。技能开启1秒内受击会立刻自动反击。\n\n“花枪反击”：立刻解除控制，结束技能并减少主动技能4秒CD，并对前方大范围进行一次扫击，造成伤害和[眩晕](该眩晕期间保持惯性)；若目标距离较远，则会传送到对方身后扫击。若老鼠[因扫击伤害虚弱](包括进入“铁血”等状态)，且扫击方向上有火箭，则会将其击飞到火箭上。',
        detailedDescription:
          '舞起花枪，持续5秒，期间免疫碎片、可移动跳跃但无法交互，每隔一段时间对碰触的老鼠造成8伤害和可叠加的减速，最高叠加4层。技能期间受到来自老鼠的伤害时，可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其触发“花枪反击”。技能开启1秒内受击会立刻自动反击。\n\n“花枪反击”：立刻解除控制，结束技能并减少主动技能4秒CD，[若目标距离较近](处于以如玉模型中心为圆心，半径约500的圆内)，则直接对[前方600范围内](高度约与自身平齐，范围较大)进行一次[前摇0.3秒，后摇0.6秒](前后摇无法主动取消，且动作期间无法转向、移动、跳跃)的扫击，对所有命中的目标造成{65}伤害和1.9秒[眩晕](该眩晕期间保持惯性)；[若目标距离较远](不处于以如玉模型中心为圆心，半径约500的圆内)，则会[传送到对方头顶并在0.3秒后落下](释放技能时立刻传送到目标头顶高约250的位置并失重，0.3秒后落下。前后摇无法主动取消，动作期间无法转向、移动、跳跃)，然后对[前方600范围内](高度约与自身平齐，范围较大)进行一次[前摇0.4秒，后摇0.55秒](前后摇无法主动取消，且动作期间无法移动跳跃)的扫击，对所有命中的目标造成{65}伤害和1.9秒[眩晕](该眩晕期间保持惯性)。若任意老鼠[因扫击伤害虚弱](包括进入“铁血”等状态)，且[扫击方向上有火箭](以老鼠为半圆的圆心，半径约800的半圆内有空置火箭，且中间无平台阻挡)，则会[将其击飞到火箭上](将其向火箭方向上直线击飞，击飞期间失重，碰到火箭时自动绑上并点燃，正常触发绑火箭的-10秒引线效果及相关知识卡。该效果的瞄准有一定问题，距离火箭过近时可能会出现向上击飞而未击飞到火箭上的情况)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cooldownTiming: '前摇前',
        skillLevels: [
          {
            level: 1,
            description: '每0.8秒造成一次伤害。（注：游戏内描述有误）',
            cooldown: 12,
            detailedDescription:
              '技能释放时立刻造成一次伤害，随后每0.8秒造成一次伤害，共7次。（注：游戏内关于伤害频率的描述有误）',
          },
          {
            level: 2,
            description: '改为每0.5秒造成一次伤害。',
            cooldown: 12,
            detailedDescription: '改为每0.5秒造成一次伤害，共10次。',
          },
          {
            level: 3,
            description:
              '减速叠加到第4层时清空，并使目标受到眩晕和伤害，但眩晕期间免疫舞花枪的效果。',
            detailedDescription:
              '减速叠加到第4层时清空，并使目标受到2.4秒眩晕和{10}伤害，但眩晕期间免疫舞花枪的效果。',
            cooldown: 12,
          },
        ],
        cueRange: '本房间可见',
        cancelableAftercast: ['其他技能键'],
      },
      {
        name: '掷花枪',
        type: 'weapon1',
        description:
          '向任意指定方向掷出旋转的花枪，对碰到的老鼠造成少量伤害。花枪飞行一段时间后或再次点击技能时折返回如玉身边，[折返时也会造成伤害](老鼠进入花枪范围至离开前只会受到一次伤害，因此折返开始时恰好处于花枪范围内的老鼠不会受到二次伤害)，若折返时命中花枪折返前命中过的目标，可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其触发“花枪反击”。\n\n“花枪反击”：立刻解除控制，减少主动技能4秒CD，并对前方大范围进行一次扫击，造成伤害和[眩晕](该眩晕期间保持惯性)；若目标距离较远，则会传送到对方身后扫击。若老鼠[因扫击伤害虚弱](包括进入“铁血”等状态)，且扫击方向上有火箭，则会将其击飞到火箭上。',
        detailedDescription:
          '[向任意指定方向掷出旋转的花枪](花枪沿直线飞行，飞行速度约1900)，对[碰到](碰撞面积为圆形，半径约150)的老鼠造成5伤害。花枪飞行1.1秒后或在1秒内再次技能时[折返回如玉身边](改为向如玉方向飞行，碰到如玉或累计飞行8.1秒后消失)，[折返时也会造成5伤害](老鼠进入花枪范围至离开前只会受到一次伤害，因此折返开始时恰好处于花枪范围内的老鼠不会受到二次伤害)，若折返时命中花枪折返前命中过的目标，可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其触发“花枪反击”。\n\n“花枪反击”：立刻解除控制，结束技能并减少主动技能4秒CD，[若目标距离较近](处于以如玉模型中心为圆心，半径约500的圆内)，则直接对[前方600范围内](高度约与自身平齐，范围较大)进行一次[前摇0.3秒，后摇0.6秒](前后摇无法主动取消，且动作期间无法转向、移动、跳跃)的扫击，对所有命中的目标造成{65}伤害和1.9秒[眩晕](该眩晕期间保持惯性)；[若目标距离较远](不处于以如玉模型中心为圆心，半径约500的圆内)，则会[传送到对方头顶并在0.3秒后落下](释放技能时立刻传送到目标头顶高约250的位置并失重，0.3秒后落下。前后摇无法主动取消，动作期间无法转向、移动、跳跃)，然后对[前方600范围内](高度约与自身平齐，范围较大)进行一次[前摇0.4秒，后摇0.55秒](前后摇无法主动取消，且动作期间无法移动跳跃)的扫击，对所有命中的目标造成{65}伤害和1.9秒[眩晕](该眩晕期间保持惯性)。若任意老鼠[因扫击伤害虚弱](包括进入“铁血”等状态)，且[扫击方向上有火箭](以老鼠为半圆的圆心，半径约800的半圆内有空置火箭，且中间无平台阻挡)，则会[将其击飞到火箭上](将其向火箭方向上直线击飞，击飞期间失重，碰到火箭时自动绑上并点燃，正常触发绑火箭的-10秒引线效果及相关知识卡。该效果的瞄准有一定问题，距离火箭过近时可能会出现向上击飞而未击飞到火箭上的情况)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '<无内容>',
            cooldown: 15,
          },
          {
            level: 2,
            description: '冷却时间降低。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '可储存2次。',
            cooldown: 10,
          },
        ],
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '戏剧转折',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '[因其他原因虚弱时](即：不因本技能提供的“坚毅”导致虚弱时)改为进入“坚毅”状态：立即解除控制并回复Hp、移速小幅度提高、免疫眩晕和虚弱，期间成功对任意敌方造成虚弱则提前解除该状态。“坚毅”状态正常结束时，如玉进入虚弱。',
            detailedDescription:
              '[因其他原因虚弱时](即：不因本技能提供的“坚毅”导致虚弱时)[改为进入12秒“坚毅”状态](仍会触发以虚弱为判定条件的效果，如鼠方的击倒敌方获得金钱效果及终结赏金，和知识卡-越挫越勇，暴怒，乘胜追击（失去层数）等)：立即解除控制并回复100Hp、移速提高15%、免疫眩晕和虚弱，期间成功对任意敌方造成虚弱则提前解除该状态。“坚毅”状态正常结束时，如玉进入虚弱。',
          },
          {
            level: 2,
            description:
              '[使如玉Hp归零](包括通过攻击使如玉Hp恰好为零，但未进入“坚毅”状态的情况)的敌方[在30秒内无法对如玉造成眩晕和虚弱](老鼠被抓起时提前解除该状态)。',
            detailedDescription:
              '[使如玉Hp归零](包括通过攻击使如玉Hp恰好为零，但未进入“坚毅”状态的情况)的敌方[在30秒内无法对如玉造成眩晕和虚弱](老鼠被抓起时提前解除该状态)。',
          },
          {
            level: 3,
            description:
              '“坚毅”会回复更多Hp，且对敌方造成眩晕即可解除该状态。Lv.2效果的持续时间改为60秒。',
            detailedDescription:
              '“坚毅”改为回复200Hp，且对敌方造成眩晕即可解除该状态。Lv.2效果的持续时间改为60秒。',
          },
        ],
        description:
          '如玉从商店购买道具所需的时间较长。\n\n如玉拥有两种特殊爪刀，特殊爪刀[与技能类似](可在手中有老鼠时释放；可移动释放，但释放期间不能转向；可用道具键取消前后摇，但会进入CD；可打断需要其他技能键才能打断的技能；不会因缴械被封锁)，[无法触发常规爪刀效果](无法直接抓起被拍子控制的老鼠，无法为知识卡-乘胜追击叠加层数，无法破坏莱恩-蘸水笔创造的方块)，[无法受到大部分爪刀相关效果加成](无法受到知识卡-击晕、猛攻、蓄势一击、长爪；特技-全垒打，长爪一击，勇气爪刀影响)，但[CD与爪刀相同](可被影响爪刀CD的效果影响，如变身药水及特技-“我生气了！”)，且[不会被无法释放技能的效果封锁](该特点与共研服测试期间不同，注意多加留意；特殊爪刀也不会因缴械被封锁)。[两种特殊爪刀共用CD](共用爪刀CD，释放跳跃劈枪时会重置前刺回马枪的状态)。\n1.前刺回马枪：在地面时释放，分为2段：前刺枪对身前敌方造成少量伤害，命中非虚弱敌方时获得加速；回马枪对身后敌方造成少量伤害，击退对方一小段距离，若命中[被前刺枪命中过的非虚弱目标](指被同一轮前刺回马枪的第一段命中过的目标，包括初次命中时处于虚弱状态的目标，或是再次命中时持有护盾的目标（对方会先被回马枪击破一层护盾，然后再受到额外伤害，额外伤害也可破盾）)，则额外造成极高伤害和[短暂的强控制状态](该状态实际效果与眩晕类似，但角色头顶并未出现“眩晕”图标；动作与击退类似，但击退距离为0，且会中断回马枪原本的击退效果)。\n2.跳跃劈枪：在空中时释放，对身前大范围内的敌方造成伤害，命中非虚弱敌方时获得加速。',
        detailedDescription:
          '如玉从商店购买道具所需的时间较长（需要4秒）。\n\n如玉无法释放常规爪刀，但拥有两种特殊爪刀，特殊爪刀[与技能类似](可在手中有老鼠时释放；可移动释放，但释放期间不能转向；可用道具键取消前后摇，但会进入CD；可打断需要其他技能键才能打断的技能；不会因缴械被封锁)，[无法触发常规爪刀效果](无法直接抓起被拍子控制的老鼠，无法为知识卡-乘胜追击叠加层数，无法破坏莱恩-蘸水笔创造的方块)，[无法受到大部分爪刀相关效果加成](无法受到知识卡-击晕、猛攻、蓄势一击、长爪；特技-全垒打，长爪一击，勇气爪刀影响)，但[CD与爪刀相同](可被影响爪刀CD的效果影响，如变身药水及特技-“我生气了！”)，且[不会被无法释放技能的效果封锁](该特点与共研服测试期间不同，注意多加留意；特殊爪刀也不会因缴械被封锁)。[两种特殊爪刀共用CD](共用爪刀CD，释放跳跃劈枪时会重置前刺回马枪的状态)。\n1.前刺回马枪：在地面时释放，分为2段：前刺枪——[前摇0.35秒，后摇0.1秒](可移动释放，可被道具键取消前后摇（取消前摇会直接进入CD）)，对身前约450范围内的敌方造成{30}伤害，命中非虚弱敌方时获得30%加速，持续3秒；回马枪——[前摇0.35秒，后摇0.35秒](可移动释放，不可空中释放，可被道具键取消前后摇（取消前摇会直接进入CD）)，对身后约450范围内的敌方造成{30}伤害，击退对方约100距离，若命中[被前刺枪命中过的非虚弱目标](指被同一轮前刺回马枪的第一段命中过的目标，包括初次命中时处于虚弱状态的目标，或是再次命中时持有护盾的目标（对方会先被回马枪击破一层护盾，然后再受到额外伤害，额外伤害也可破盾）)，则额外造成{110}伤害和[0.5秒强控制状态](该状态实际效果与眩晕类似，但角色头顶并未出现“眩晕”图标；动作与击退类似，但击退距离为0，且会中断回马枪原本的击退效果)。\n2.跳跃劈枪：在空中时释放，[前摇0.1秒，后摇0.45秒](可移动释放，可被移动、跳跃、道具键取消前后摇（取消前摇会直接进入CD）)，对身前[约500范围内](500指横向判定范围。该攻击的纵向判定范围远大于常规爪刀)的敌方造成{55}伤害，命中非虚弱敌方时获得30%加速，持续3秒。',
      },
    ],
    counters: [
      {
        id: '杰瑞',
        description:
          '杰瑞的鸟哨能触发如玉的“花枪反击”，大铁锤又需要近身才能命中，再加上自身自保相对较差，容易成为如玉的突破口。',
        isMinor: true,
      },
      {
        id: '剑客杰瑞',
        description: '剑客杰瑞极高的伤害反而更容易触发如玉被动技能的“坚毅”效果。',
        isMinor: true,
      },
      {
        id: '剑客泰菲',
        description:
          '剑客泰菲开启头盔时有较高惯性，能被回马枪戳飞很远的距离；长枪和冲刺可触发“花枪反击”，但勇气释放过程中的长枪有禁用技能效果，能稍微反制如玉的反击。',
        isMinor: true,
      },
      {
        id: '玛丽',
        description: '玛丽的主动技能无法封锁如玉的爪刀，折扇还能触发如玉的花枪反击。',
        isMinor: true,
      },
      {
        id: '米可',
        description:
          '米可极高的伤害反而更容易触发如玉被动技能的“坚毅”效果，并且如玉的前刺回马枪同时命中时能造成高达170点的基础伤害，前期能稍微反制米可的减伤，但后期不容易击倒米可。',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞推奶酪速度快，并且自保和破局能力强。',
        isMinor: false,
      },
      {
        id: '牛仔杰瑞',
        description: '牛仔杰瑞的两个技能都不会触发如玉主动技能的“花枪反击”，自身还有一定自保能力。',
        isMinor: true,
      },
      {
        id: '魔术师',
        description:
          '魔术师的红牌封锁技能使如玉无法释放花枪反击，黄蓝牌造成无伤害的控制也能克制如玉。',
        isMinor: true,
      },
      {
        id: '莱恩',
        description:
          '如玉的爪刀无法破除莱恩的方块，但莱恩用三角或圆命中开启主动技能的如玉仍可触发其花枪反击。',
        isMinor: true,
      },
      {
        id: '天使泰菲',
        description: '如玉无法用拍子直接抓起天使泰菲。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        id: '缴械',
        description: '如玉完全免疫缴械效果，不要试图用缴械对抗如玉。',
        isMinor: false,
      },
      {
        id: '护佑',
        description: '如玉的掷花枪能破除护佑。',
        isMinor: true,
      },
      {
        id: '回家',
        description: '如玉的掷花枪能比较轻松地破除回家的护盾。',
        isMinor: true,
      },
      {
        id: '绝地反击',
        description: '绝地反击反而更容易触发如玉被动的“坚毅”效果。',
        isMinor: true,
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
