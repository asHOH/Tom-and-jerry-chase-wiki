import { AssetManager } from '@/lib/assetManager';
import {
  CardGroupType,
  type CharacterDefinition,
  type PartialCharacterDefinition,
} from '@/data/types';
import { processCharacters } from '@/features/characters/utils/skillId';

const catCharacterDefinitions = {
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
    gender: 'male',
    EnglishName: 'Tom',
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '{主动技能}的无敌有很强的上火箭能力。',
        additionalDescription:
          '{手型枪}+{蓄力重击}，或者{2级被动}+{平底锅}，都能对守火箭的老鼠产生极大威胁。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '{主动技能}提供无敌和解控，{1级被动}提供续航，对打架阵容有很强的反制能力。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '{手型枪}和{平底锅}的直接抓取提供了一定的翻盘能力。',
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
        additionaldescription: '如果血量告急，也可以考虑先点1级被动回血。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description:
          '经典776锅汤，适用于大部分情况。{击晕}爪刀接一级锅可击倒99血老鼠，接二级锅接爪刀轻松打死124Hp老鼠且有效干扰鼠方救援，配合三级锅还可以直接抓取；{乘胜追击}弥补机动性不足的缺点；{熊熊燃烧}增加绑火箭收益。但开局不好找节奏，需要多注意这个问题。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
        description:
          '手型枪，适合打无管道图。{穷追猛打}解决开局不好找节奏的问题，{乘胜追击}弥补机动性不足的缺点，{加大火力}进一步提高火箭收益。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '手型枪，应对管道图。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '与{主动技能}的无敌相互弥补真空期。',
      },
      {
        name: '蓄力重击',
        description: '配合{击晕}或手型枪使用，一下一只老鼠。',
      },
      {
        name: '全垒打',
        description: '配合平底锅使用，平底锅每一段伤害都能受到全垒打的攻击增伤，瞬间打出爆发伤害。',
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
        cueRange: '随距离远近变化',
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
        description:
          '释放{手型枪(衍生物)}水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。如果拉回过程[遇到障碍](包括墙壁、叉子的阻挡，或是某些高低差地形)，则额外造成高额伤害。',
        detailedDescription:
          '释放{手型枪(衍生物)}水平飞出、飞回，对[命中](飞出、飞回过程均可命中；包括因遇到护盾而提前返回的情况；至多只能抓回并眩晕一只老鼠)的老鼠造成{15*,可致伤}伤害、[将其抓回并眩晕2.5秒](本技能造成伤害与造成眩晕的时机不同，所以即便该老鼠因该次伤害而进入"铁血"状态，也仍会受到后续的拉回和眩晕影响)。如果拉回过程[遇到障碍](包括墙壁、叉子的阻挡，或是某些高低差地形)，则[额外](单次手枪可能重复产生2-3次伤害，具体成因不详，疑似与墙壁厚度及高低差有关)造成{70*,不受来源影响,不可致伤}伤害。抓回及眩晕效果对变身状态的老鼠和虚弱的老鼠也生效。若手型枪命中的老鼠持有护盾，则打破一层护盾并提前返回。',
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
            description: '可以{直接抓起}被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '平底锅',
        type: 'weapon2',
        description:
          '挥锅攻击，打晕并致盲附近老鼠、降低其救援速度，同时会打出{煎蛋}，也能击飞道具。',
        detailedDescription:
          '挥舞平底锅，对直接命中的老鼠造成{15*,不可致伤}伤害，向斜上方略微击飞对方，并附加5秒{失明}（[有特殊显示特效](特效为一块煎蛋蒙蔽双眼，与常规失明不同)）和55%救援减速效果；被平底锅直接命中并击飞的老鼠[落地](若该角色被老鼠夹夹住，则需挣脱后才会判定落地)后受到{30*,不可致伤}伤害，并眩晕1秒。\n挥锅同时会以固定角度和力度飞出一块{煎蛋}，煎蛋对命中的老鼠造成{15*,可致伤}点伤害，并附加5秒{失明}（[有特殊显示特效](特效为一块煎蛋蒙蔽双眼，与常规失明不同)）和55%救援减速效果。\n挥锅命中部分道具/衍生物（无论其是否已被投掷）时，会将其以“被汤姆投掷”的状态击飞。', //todo:add 会被击回的道具列表
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
            description: '煎蛋失明持续时间延长；平底锅命中老鼠时会刷新爪刀CD。',
            detailedDescription:
              '煎蛋失明持续时间延长至7.5秒；平底锅击飞老鼠，或{煎蛋}命中老鼠（均包括虚弱等状态下的老鼠）时，刷新爪刀CD。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '汤姆可以{直接抓起}被平底锅击飞落地而眩晕的老鼠。',
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
            description: '对敌方造成伤害时，移速提高一段时间。手握老鼠时依然可以使用爪刀。',
            detailedDescription:
              '对敌方造成伤害时，移速提高9.5%，持续2.6秒。手握老鼠时依然可以使用爪刀，但[不会改变惯性](即不会因为使用爪刀而进入下落状态)。',
          },
          {
            level: 2,
            description: '对敌方造成伤害时，获得回复并减少主动技能CD。',
            detailedDescription: '对敌方造成伤害时，回复25Hp并减少主动技能3秒CD。',
          },
          {
            level: 3,
            description: '对敌方造成伤害时，使其一段时间无法使用技能，并掉落手中的道具。',
            detailedDescription: '对敌方造成伤害时，使其3秒内无法使用技能，并掉落手中的道具。',
          },
        ],
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
    gender: 'male',
    EnglishName: 'Butch',
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '{主动技能}可以将奶酪推离洞口；旋转桶盖可以有效守火箭或奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '{1级被动}快速起身和{3级旋转桶盖}的霸体提供了较强的打架能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '垃圾盖',
        pattern: '12000[1122]',
        weaponType: 'weapon1',
        description: '利用被动的高伤害和延长控制效果提高攻击能力。点出{3级被动}后视情况进行加点。',
        additionaldescription: '',
      },
      {
        id: '旋转桶盖',
        pattern: '13(0)330011',
        weaponType: 'weapon2',
        description: '三级时可以适当留加点，如果血量告急则先点{1级被动}。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description:
          '利用{穷追猛打}刷取经验的同时在前期打出多倒以及叠加乘胜，为中后期追击和打架做准备。{熊熊燃烧}提高火箭燃烧效率，{皮糙肉厚}应对伤害较高的阵容，在管道图可以考虑替换为{猫是液体}{狡诈}；而拆火箭阵容可以考虑换为{心灵手巧}；伤害过高的阵容可以考虑{越挫越勇}。',
      },
      {
        cards: ['S-乘胜追击', 'S-屈打成招', 'A-熊熊燃烧', 'C-猫是液体'],
        description:
          '牧场或者酒店这种有七色花以及经典一小图，可以考虑不要{穷追猛打}，同时携带{屈打成招}提高拦截能力，{猫是液体}在牧场配合{屈打成招}利用好来拉扯老鼠，酒店管道利用率低可以考虑换{狡诈}。',
      },
      {
        cards: ['S-乘胜追击', 'S-知识渊博', 'A-加大火力', 'A-穷追猛打'],
        description:
          '娱乐性较高。{知识渊博}加快等级的提升，{加大火力}提高火箭燃烧效率。{知识渊博}也可以换为{暴怒}或者{乾坤一掷}，但均为娱乐卡组。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '补充霸体和解控能力，提高打架能力。',
      },
      {
        name: '全垒打',
        description:
          '在需要高伤害的场合可酌情使用。主动和武器技能都能享受全垒打的攻击增伤；全垒打提供的移速还能提高{主动技能}的冲刺距离。',
      },
    ],
    skills: [
      {
        name: '横冲直撞',
        type: 'active',
        aliases: ['冲刺', '冲撞'],
        description:
          '向前冲刺，冲刺期间加速并免疫控制效果，且撞飞碰到的道具（包括已放入{老鼠洞}的{奶酪}），并对撞到的老鼠造成伤害和短暂{眩晕}。冲刺过程中持有霸体且可通过方向键多次改变冲刺方向，也可以使用爪刀、道具和技能。',
        detailedDescription:
          '向前冲刺，冲刺持续1.2秒，期间加速并免疫控制效果，且撞飞碰到的道具（包括已放入{老鼠洞}的{奶酪}），并对撞到老鼠造成{1*,可致伤}伤害和0.5秒{眩晕}。冲刺过程中持有霸体且可通过方向键多次改变冲刺方向，也可以使用爪刀、道具和技能。',
        aftercast: 0.2,
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        videoUrl: 'https://www.bilibili.com/video/BV1Eg41147Eo?t=4.8',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '冲刺期间获得90%加速。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '冲刺期间获得更高加速。',
            detailedDescription: '冲刺期间改为获得110%加速。',
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
        detailedDescription: '对附近老鼠造成{1*,可致伤}伤害和1.3秒眩晕。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '不可取消',
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
          '拖拽技能向指定方向、或点按原地扔出{旋转桶盖(衍生物)}，伤害并眩晕命中的敌方；友方再次碰到桶盖时将其拾取，使自身受到的伤害降低一段时间。',
        detailedDescription:
          '拖拽技能向指定方向、或点按原地扔出{旋转桶盖(衍生物)}，对命中的敌方造成{30*,不可致伤}伤害并{眩晕}1.5秒；友方再次碰到桶盖时将其拾取，使自身受到的伤害降低20，持续6秒。桶盖被投掷时的初速度较快，会被道具和墙壁反弹。',
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
            description: '命中敌方时减少本技能6秒CD（每次施放至多生效1次）。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '桶盖飞行速度增加；捡到桶盖会获得[霸体](免疫虚弱和绝大多数控制效果)。',
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
            description: '虚弱时间大幅降低，虚弱期间Hp恢复速度大幅增加，起身后的无敌时间延长。',
            detailedDescription:
              '虚弱时间降低至3.8秒，且[虚弱期间的Hp恢复速度增加至100Hp/秒](该效果保证了绝大多数情况下布奇将以满Hp状态起身)，虚弱结束后的无敌时间延长。',
          },
          {
            level: 2,
            description:
              '造成伤害后将回复Hp，同时短暂提高移速；{投掷道具}命中敌方时额外附加一段伤害。',
            detailedDescription:
              '对敌方造成伤害后将回复Hp，同时提高移速，持续5秒；{投掷道具}命中敌方时，[额外](与原伤害分为不同的两段；先结算该伤害，后结算道具本身效果)对其造成{25*,不受来源影响}伤害（道具命中护盾时不造成额外伤害）。',
          },
          {
            level: 3,
            description:
              '爪刀有一定概率额外造成极高伤害，[若同时命中多只老鼠则只会触发一次](该特性源自用户补充，暂未进行进一步测试)；技能和部分道具造成的控制时间增加1秒。',
            detailedDescription:
              '爪刀有30%概率[额外](与原伤害分为不同的两段)造成{200*,无来源}伤害（原爪刀命中护盾时不造成额外伤害），[若同时命中多只老鼠则只会触发一次](该特性源自用户补充，暂未进行进一步测试)；技能和部分道具对敌方造成的控制时间增加1秒。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 托普斯 ----------------------------------- */
  托普斯: {
    aliases: ['托斯', '奶猫', '仓鼠', '哈基米'],
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
    gender: 'male',
    EnglishName: 'Topsy',
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
        description: '分身提供反隐和霸体，配合1级被动和击晕，可以高效守火箭或奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: true,
        description: '通过换位和{3级主动}提供的霸体反制老鼠的控制。',
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
          '利用{击晕}配合{1级被动}提高控制能力，或是配合{捕虫网}直接抓住老鼠；{皮糙肉厚}提高分身的生存能力，{穷追猛打}提高前期找节奏能力。',
      },
      {
        cards: ['S-击晕', 'S-乘胜追击', 'A-熊熊燃烧'],
        description:
          '{乘胜追击}提高机动性，且能更好地配合{击晕}和{1级被动}。但缺少{皮糙肉厚}的减伤和{穷追猛打}的前期找节奏能力，所以需要更多的注意分身的状态，同时推荐在有七色花的地图使用，弥补前期缺少找节奏能力的问题。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-长爪', 'B-皮糙肉厚'],
        description:
          '托普斯爪刀较短，{长爪}能极大幅提高爪刀范围，配合{击晕}、{1级被动}和{我生气了！}打出连续控制和爆发伤害，还能刷取经验。但{长爪}负面效果也很明显，使用时需再三斟酌，因此本卡组较偏向娱乐。',
      },
      {
        cards: ['S-击晕', 'A-加大火力', 'A-穷追猛打', 'B-皮糙肉厚', 'C-猫是液体'],
        description: '推荐在管道图使用，{加大火力}弥补火箭燃烧效率不足的问题。',
      },
    ],

    specialSkills: [
      {
        name: '绝地反击',
        description: '配合捕虫网或击晕+{1级被动}，实现反击效果。', // FIXME： 这里改成{1级被动}会产生bug，不过不严重，不影响使用，下次有空修
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
        aliases: ['分身', '弟弟'],
        description:
          '释放一个{托普斯分身}。分身爪刀伤害提高，爪刀CD减少，免疫碎片和老鼠夹，且[继承部分知识卡](大多数知识卡均可继承，其中一部分知识卡效果还能和本体叠加（如“捕鼠夹”的伤害和控制时间延长效果可以二次叠加）；但部分特殊知识卡则无法继承或继承后无效果（如“熊熊燃烧”等）)。分身[共享小地图视野](由于人工智能类角色具有能看到隐身角色的特性，因此分身也能在小地图上透视周围隐身的老鼠，但不会主动攻击)，但[受到的伤害增加](包括受到部分环境伤害时)。本体[获得部分增益时](包括食物、药水效果，以及部分地图道具效果（如太空堡垒-科研舱药水等）)，分身也会获得。\n\n分身存在期间本体获得额外技能，点击可指挥分身出击或跟随（有CD）。\n再次使用主动技能可与分身换位（有[单独CD](与技能原本的CD无关；不受增加/缩减冷却的效果影响)）。',
        detailedDescription:
          '释放一个{托普斯分身}，其[与自身相貌相同](装扮、昵称、Hp条显示的方式和本体完全一致)。分身爪刀伤害提高15，爪刀CD减少至3.2秒，免疫碎片和老鼠夹，且[继承部分知识卡](大多数知识卡均可继承，其中一部分知识卡效果还能和本体叠加（如“捕鼠夹”的伤害和控制时间延长效果可以二次叠加）；但部分特殊知识卡则无法继承或继承后无效果（如“熊熊燃烧”等）)。分身[共享小地图视野](由于人工智能类角色具有能看到隐身角色的特性，因此分身也能在小地图上透视周围隐身的老鼠，但不会主动攻击)，但[受到的伤害增加20](包括受到部分环境伤害时)。本体[获得部分增益时](包括食物、药水效果，以及部分地图道具效果（如太空堡垒-科研舱药水等）)，分身也会获得。\n\n分身存在期间本体获得额外技能，点击可指挥分身出击或跟随（CD：5秒）\n出击：根据本体朝向前进，遇到障碍物会尝试跳跃过去，失败则原路返回。\n跟随：向本体跟随。\n\n分身存在期间再次使用主动技能可与分身换位（有[单独CD](与技能原本的CD无关；不受增加/缩减冷却的效果影响)，与技能等级有关）。\n\n分身成功释放后，技能本身的CD就开始倒计时；分身被击倒或消失后，技能切换回本来的CD。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '与分身换位CD为15秒；分身存在30秒或被击倒后消失。',
            cooldown: 36,
          },
          {
            level: 2,
            description: '换位CD减少至10秒；换位时回复Hp，且移速和交互速度提高，持续6秒。',
            detailedDescription:
              '换位CD减少至10秒；换位时，本体和分身均回复50Hp，且移速提高20%、交互速度提高25%，持续6秒。',
            cooldown: 24,
          },
          {
            level: 3,
            description:
              '换位CD减少至5秒；分身不会主动消失；如果分身在本体附近，本体受到的[眩晕控制](包括大部分眩晕，另外还能免疫尼宝的鱼钩；不包括其它控制，如斯派克抓取、捕鼠夹、虚弱、仙女鼠8星等)和受到的一半伤害会转移给分身。',
            cooldown: 20,
          },
        ],
        forecast: 2.2,
        aftercast: 0,
      },
      {
        name: '泡泡棒',
        type: 'weapon1',
        description:
          '召唤在场景中漂浮的{泡泡}，[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在一段时间后消失](有老鼠在其内被困住时则不会自然消失)，可被道具砸破。破碎时，对周围造成伤害和{爆炸}眩晕。\n直接释放技能会吹出留在原地的泡泡，拖动释放技能则使吹出的泡泡向该方向缓慢漂移。',
        detailedDescription:
          '召唤在场景中漂浮的{泡泡}，[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在20秒后消失](有老鼠在其内被困住时则不会自然消失)，可以提前被道具砸破。泡泡被砸破或因挣脱破碎时，对周围的老鼠造成{25*,无来源}伤害和1.5秒{爆炸}眩晕。直接释放技能会吹出留在原地的泡泡，拖动释放技能则使吹出的泡泡向该方向缓慢漂移。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '',
            cooldown: 12,
          },
          {
            level: 3,
            description: '每次吹出两个泡泡。',
            cooldown: 12,
          },
        ],
        aftercast: 0,
      },
      {
        name: '捕虫网',
        type: 'weapon2',
        description:
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的（编号详见角色头像），与抓取逻辑相同)抓到网中，期间老鼠可挣扎挣脱；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠[碰到火箭会被直接绑上](不会触发绑火箭立刻-10秒倒计时的效果)。',
        detailedDescription:
          '将面前的[一只老鼠](若有多个老鼠在网的范围内，则会网住编号最小的（编号详见角色头像），与抓取逻辑相同)抓到网中，期间老鼠可挣扎挣脱；再次使用技能将老鼠扔出，扔出的老鼠落地后受到伤害和短暂眩晕，对落点周围的老鼠也造成伤害和短暂眩晕。扔出的老鼠[碰到火箭会被直接绑上](不会触发绑火箭立刻-10秒倒计时的效果)。捕虫网可以网住[霸体老鼠](如尼宝的灵活跳跃、表演者•杰瑞的梦幻舞步)，但无法网住[带有护盾的老鼠](包括常规护盾和无敌类护盾。常规护盾会被破除一层；无敌类护盾则直接免疫，如剑客泰菲的头盔、罗宾汉杰瑞的降落伞)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
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
            description: '',
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

  /* ----------------------------------- 莱特宁 ----------------------------------- */
  莱特宁: {
    aliases: ['橘猫', '橘鼠'],
    description:
      '"流浪猫铁三角"中的一员。莱特宁是一只橙红色的猫，喜欢与汤姆争夺女主人的宠爱，他移动速度快如闪电，没有任何老鼠能逃脱他的追击。',
    maxHp: 260,
    attackBoost: 0,
    hpRecovery: 3,
    moveSpeed: 775,
    jumpHeight: 420,
    clawKnifeCdHit: 6.5,
    clawKnifeCdUnhit: 4.55,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Lightning',
    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '{主动技能}闪现老鼠。',
        additionalDescription: '{1级被动}还可以减速老鼠并标记视野。',
      },
      {
        tagName: '防守',
        isMinor: false,
        weapon: 1,
        description: '{垃圾桶}可阻止老鼠推奶酪，且能无缝衔接。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '{主动技能}的直接抓取有一定翻盘能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '垃圾桶',
        pattern: '101212020',
        weaponType: 'weapon1',
        description: '可攻可守。',
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
        description: '管道用，若没21知识点可以去掉{狡诈}。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
        description: '主布局，防守。',
      },
      {
        cards: ['S-猛攻', 'A-细心', 'A-穷追猛打', 'B-恐吓', 'B-皮糙肉厚'],
        description: '防守流。',
      },
    ],
    specialSkills: [
      {
        name: '蓄力重击',
        description: '弥补缺伤害的短板。',
      },
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
    ],
    skills: [
      {
        name: '瞬移闪击',
        type: 'active',
        aliases: ['闪现'],
        description:
          '向前传送一段距离。如果附近有[老鼠](处于隐身状态的老鼠除外)，改为传送到老鼠身后，该范围会在小地图显示。',
        detailedDescription:
          '[向前传送1450距离](若有墙壁等障碍物阻挡，则改为传送到障碍物面前)。如果附近有[老鼠](处于隐身状态的老鼠除外)，改为传送到老鼠身后，该范围会在小地图显示。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        forecast: 0.7,
        aftercast: 0,
        cancelableSkill: '不可主动打断',
        cueRange: '全图可见',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description: '瞬移后获得8秒“疾如风”状态（移速提高、爪刀CD减少）。',
            cooldown: 8,
            detailedDescription: '瞬移后获得8秒“疾如风”状态（移速提高10%、爪刀CD减少50%）。',
          },
          {
            level: 3,
            description:
              '提高瞬移范围；瞬移到[交互中](包括绝大多数前摇、后摇、交互等动作)的老鼠身后时，对其造成[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            detailedDescription:
              '提高瞬移范围；瞬移到[交互中](包括绝大多数前摇、后摇、交互等动作，部分列举如下：推奶酪、救队友、在捕鼠夹上挣扎、吃蛋糕，喝牛奶，喝饮料、开纸箱、技能前摇、开关门、推车、推斧头、摇钟、调药水、开监控、采花、摇三角铁、进机器鼠、自起特技)的老鼠身后时，对其造成2秒[眩晕](可被霸体或消耗一层护盾抵挡)，期间可直接抓起。',
            cooldown: 8,
          },
        ],
      },
      {
        name: '垃圾桶',
        type: 'weapon1',
        description:
          '放置{垃圾桶(衍生物)}阻挡道路，可被推动且被猫推动时的力度更大，可被爪刀打飞，受到4次攻击后会摧毁。垃圾桶的异味会使老鼠受到减速和伤害。由此造成伤害时会减少爪刀CD，每秒只生效一次。垃圾桶造成的伤害不会使老鼠虚弱。',
        detailedDescription:
          '放置{垃圾桶(衍生物)}阻挡道路，可被推动且被猫推动时的力度更大，可被爪刀打飞，受到4次攻击后会摧毁。垃圾桶的异味会使老鼠受到减速和伤害。每造成1次伤害时会减少爪刀CD，每秒只生效一次。垃圾桶造成的伤害不会使老鼠虚弱，但仍会持续减少爪刀CD。垃圾桶不会对已虚弱的老鼠造成伤害，也不会因此降低爪刀CD，在垃圾桶范围内倒地并起身的老鼠不会受到垃圾桶的伤害，但重新进入垃圾桶范围仍会受到伤害。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '垃圾桶持续12秒。',
            detailedDescription:
              '垃圾桶持续12秒，老鼠进入垃圾桶范围时会受到{10*,固定,不可致伤}伤害，随后每秒受到{5*,固定,不可致伤}伤害。',
            cooldown: 18,
          },
          {
            level: 2,
            description:
              '垃圾桶持续时间提高至18秒；提高伤害。垃圾桶会对Hp降至最低的老鼠造成1秒眩晕，每5秒触发一次。',
            cooldown: 18,
            detailedDescription:
              '垃圾桶持续时间提高至18秒；进入垃圾桶范围改为造成{15*,固定,不可致伤}伤害，后续改为每秒受到{8*,固定,不可致伤}伤害。垃圾桶会对Hp降至最低的老鼠造成1秒眩晕，每5秒触发一次。',
          },
          {
            level: 3,
            description: '提高减速效果和伤害。',
            cooldown: 18,
            detailedDescription:
              '提高减速效果；进入垃圾桶范围改为造成{25*,固定,不可致伤}伤害，后续改为每秒受到{12*,固定,不可致伤}伤害。',
          },
        ],
      },
      {
        name: '咸鱼',
        type: 'weapon2',
        description:
          '从垃圾桶中倒出{咸鱼(衍生物)}，鼠方踩到后会受到小幅全属性减益。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD、减少爪刀CD，并回复Hp。瞬移闪击将优先追踪带有咸鱼效果的敌方；手中有老鼠时，则优先追踪最近的咸鱼。\n使用技能后一段时间内，可通过二段技能投掷一条{咸鱼-投射物}，命中老鼠产生与咸鱼相同的效果，命中其它物体则会直接消失。\n本技能在未加点时也会进行冷却。',
        detailedDescription:
          '从垃圾桶中倒出{咸鱼(衍生物)}并标记在小地图上，咸鱼持续一分钟，鼠方踩到后会受咸鱼影响，持续20秒，期间推速降低40%，救援、治疗速度降低33%，移速降低10%，跳跃高度降低（未测），同时暴露小地图位置。可通过吃{蛋糕}、喝{牛奶}、喝饮料、{应急治疗}、{2级牛仔吉他}来解除。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD，爪刀CD减少至1.9秒，并获得50Hp/秒的恢复效果，持续1秒。瞬移闪击将优先追踪带有咸鱼效果的敌方，并大幅提高追踪范围；手中有老鼠时，则优先追踪最近的咸鱼。\n使用技能后一段时间内，可通过二段技能投掷一条{咸鱼-投射物}，命中老鼠产生与咸鱼相同的效果，命中其它物体则会直接消失。\n本技能在未加点时也会进行冷却。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        forecast: 0.63,
        aftercast: 0,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
            charges: 2,
          },
          {
            level: 2,
            description: '受咸鱼影响的老鼠无法对莱特宁造成眩晕。',
            cooldown: 8,
            charges: 2,
            detailedDescription: '受咸鱼影响的老鼠无法对莱特宁造成眩晕、且无法自然恢复Hp。',
          },
          {
            level: 3,
            description: '提高咸鱼腥味的持续时间。',
            cooldown: 8,
            charges: 2,
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
              '对伤害到的老鼠进行标记，使其减速20%并暴露小地图位置，持续15秒。莱特宁对被标记的老鼠造成伤害时，[额外造成15伤害](可被减伤影响)。击倒被标记的老鼠可获得额外400经验。',
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
    aliases: ['牛汤', '牛肉汤', '牛唐'],
    description:
      '牛仔汤姆身手敏捷、深藏不露，擅长使用绳索御牛，热爱自由的他，在草原上过着与世无争的生活。',
    maxHp: 225,
    attackBoost: 0,
    hpRecovery: 2.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Cowboy Tom',
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
        description: '压制力随着等级的提高呈现质的飞升（6 7 8 10级）。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '防守',
        isMinor: false,
        description:
          '斗牛可清理道具并对敌方眩晕，2级被动可减少技能CD，在防守时拥有较高的伤害和续航。弹弓的攻击范围很大，鞭子能够打掉老鼠手中道具。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '新增标签介绍',
        additionalDescription: '鞭子带来的移速提高与爪刀CD缩短有助于牛仔汤姆持续追击',
        weapon: 1,
      },
    ],
    skillAllocations: [
      {
        id: '鞭子（控制）',
        pattern: '120021120',
        weaponType: 'weapon1',
        description: '以技能的控制和1级被动的快爪刀为主要进攻手段',
      },
      {
        id: '鞭子（高伤）',
        pattern: '120002112',
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
      {
        id: '弹弓（速通/顺风）',
        pattern: '313131000',
        weaponType: 'weapon1',
        description:
          '三级斗牛更长的眩晕，能让猫咪更好地利用直接抓起的机制，便于频繁实施双挂，有利于在找到节奏后施加压力、促进敌方减员',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '鞭子',
        description: '',
        groups: [
          {
            cards: ['S-击晕', 'S-知识渊博', 'S-乘胜追击'],
            description: '常规卡组。',
          },
          {
            cards: ['S-击晕', 'S-知识渊博', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '敌方攻击性不大时可使用。',
          },
          {
            cards: ['S-击晕', 'S-乾坤一掷', 'B-皮糙肉厚', 'A-穷追猛打'],
            description: '',
          },
        ],
        defaultFolded: false,
        detailedDescription: '<无内容>',
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
        detailedDescription: '<无内容>',
      },
      {
        id: '弹弓追击流',
        description: '',
        groups: [
          {
            cards: ['S-乘胜追击', 'S-知识渊博', 'A-加大火力', 'A-穷追猛打'],
            description: '适合鼠方伤害低控制少的阵容',
          },
          {
            cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description:
              '打架队，如果同时是管道图，{熊熊燃烧}换成{加大火力}或{心灵手巧}（打强控制队）+{猫是液体}',
          },
        ],
        defaultFolded: false,
      },
      {
        cards: ['S-猛攻', 'A-越挫越勇', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体'],
        description: '遇到有米可的打架队时使用',
      },
    ],
    skills: [
      {
        name: '斗牛',
        type: 'active',
        aliases: ['牛哥'],
        description:
          '释放{斗牛(衍生物)}，斗牛会来回冲撞，破坏[部分道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)，并对老鼠造成伤害和[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。最多同时召唤2头斗牛。',
        detailedDescription:
          '释放{斗牛(衍生物)}，斗牛会来回冲撞，破坏[部分道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)，并对老鼠造成{25*,不受来源影响,不可致伤}伤害和1.5秒{眩晕}（内置CD：4秒），被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。每个牛仔汤姆最多同时召唤2头斗牛，超过时最先生成的斗牛会消失。',
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
        aftercast: 0,
      },
      {
        name: '鞭子',
        type: 'weapon1',
        description:
          '挥舞鞭子，对面前敌方角色造成极低伤害并减速一段时间，命中时使自身加速并减少爪刀CD一段时间。两种加成均可叠加，叠加到第2层时清除，对敌方造成伤害和{眩晕}（老鼠处于该眩晕下可被{直接抓起}）/使自身获得永久加成（可叠加3层）。\n鞭子也会破坏[易碎道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/番茄，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)。\n使用技能时还能使场上的{斗牛(衍生物)}加速。。',
        detailedDescription:
          '挥舞鞭子，对面前敌方角色造成{1*,不受来源影响,不可致伤}伤害和持续7.9秒的9.5%减速，命中时使自身加速并减少爪刀CD一段时间，持续8秒。两种加成均可叠加，叠加到第2层时清除，对敌方造成{40*,不受来源影响,不可致伤}伤害和2.4秒{眩晕}（老鼠处于该眩晕下可被{直接抓起}）/使自身获得永久加成（可叠加3层）。\n鞭子也会能破坏[易碎道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/番茄，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)。\n使用技能时还能使场上的{斗牛(衍生物)}加速。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['跳跃键', '道具键'],
        aftercast: -1,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 3.5,
          },
          {
            level: 2,
            description:
              '鞭子命中老鼠后，会使老鼠缓慢减少Hp，同时使移速降低的效果增强，持续一段时间。',
            cooldown: 3.5,
            detailedDescription:
              '鞭子命中老鼠后，会使老鼠每秒受到{3*,不受来源影响,不可致伤}伤害，同时使移速降低的效果增强到10%，持续7.9秒。',
          },
          {
            level: 3,
            description: '使用鞭子额外提升{斗牛(衍生物)}持续时间。',
            cooldown: 2.5,
            detailedDescription: '使用鞭子额外提升{斗牛(衍生物)}1秒持续时间。',
          },
        ],
        cueRange: '全图可见',
        forecast: 0.25,
      },
      {
        name: '仙人掌弹弓',
        type: 'weapon2',
        description: '',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        skillLevels: [
          {
            level: 1,
            description: '向前发射三颗{小仙人掌球}，命中时造成伤害、并获得老鼠的小地图位置。',
            detailedDescription:
              '向前喇叭形发射三颗{小仙人掌球}，命中时造成{26*,不受来源影响,可致伤}伤害、获得老鼠的小地图位置4.85秒，同时自身获得持续5.85秒的12%加速。小仙人掌球最多存在1.5秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '7秒内可进行第二次发射，向前更大角度内发射五颗{小仙人掌球}。',
            cooldown: 18,
            detailedDescription: '7秒内可进行第二次发射，向前更大角度内发射五颗{小仙人掌球}。',
          },
          {
            level: 3,
            description:
              '7秒内可进行第三次发射，发射一颗{大仙人掌球}，在碰触实体时爆炸，对周围的敌方造成伤害和眩晕，同时分裂成10颗{小仙人掌球}飞向不同方向。',
            cooldown: 18,
            detailedDescription:
              '7秒内可进行第三次发射，发射一颗{大仙人掌球}，在碰触实体时爆炸，对周围的敌方造成{60*,不受来源影响,不可致伤}伤害和3.5秒眩晕，同时分裂成10颗{小仙人掌球}飞向不同方向。',
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
            description: '技能额外附加{受伤}。使老鼠进入虚弱状态时，减少{主动技能}和{武器技能}CD。',
            detailedDescription:
              '主动和武器技能造成的伤害改为可以使目标{受伤}。使老鼠进入虚弱状态时（若对方携带{铁血}，则为铁血效果触发时），减少12秒{主动技能}和{武器技能}CD。',
          },
          {
            level: 3,
            description: '爪刀和道具可直接击倒{受伤}的老鼠。',
            detailedDescription:
              '爪刀和道具击中{受伤}的老鼠时，[额外](与原伤害分为不同的两段)造成{200*}伤害。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
      {
        name: '蓄力重击',
        description: '斗牛撞击及大仙人掌球可造成眩晕效果，与蓄力重击有一定配合。',
      },
    ],
  },

  /* ----------------------------------- 图多盖洛 ----------------------------------- */
  图多盖洛: {
    description: '拥有惊人美貌的图多盖洛是上东区知名度最高的千金小姐，她的追求者从纽约排到了巴黎。',
    maxHp: 230,
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 3.5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    gender: 'female',
    EnglishName: 'Toodles Galore',
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
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
        description: '香水指甲油通用，常规追击卡组。',
        contributor: 'gezi',
      },
      {
        id: '魅力香水专用',
        description: '',
        groups: [
          {
            cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'B-皮糙肉厚', 'B-捕鼠夹'],
            description: '香水图多常规防守卡组。',
            contributor: 'gezi',
          },
          {
            cards: ['S-乘胜追击', 'S-屈打成招', 'A-细心', 'A-穷追猛打'],
            contributor: 'gezi',
          },
          {
            cards: ['A-熊熊燃烧', 'A-穷追猛打', 'A-细心', 'B-捕鼠夹', 'C-巡逻戒备'],
            description: '20知识量卡组。',
            contributor: 'gezi',
          },
        ],
        defaultFolded: true,
      },
      {
        id: '魅力甲油专用',
        description: '',
        groups: [
          {
            cards: ['S-乘胜追击', 'S-知识渊博', 'S-击晕'],
            description: '在前中后期都有较高强度。',
            contributor: 'gezi',
          },
          {
            cards: ['S-乘胜追击', 'S-知识渊博', 'A-熊熊燃烧', 'C-猫是液体'],
            description: '适合森林牧场，太空堡垒三等管道图。',
            contributor: 'gezi',
          },
          {
            cards: ['S-猛攻', 'S-知识渊博', 'A-细心', 'A-熊熊燃烧'],
            description: '适合可以布局的图使用，后期拥有更强的防守翻盘能力。',
            contributor: 'gezi',
          },
          {
            cards: ['S-乘胜追击', 'S-知识渊博', 'S-猛攻', 'B-反侦察'],
            description: '双经验卡成型更快，后期更强势。',
            contributor: 'gezi',
          },
          {
            cards: ['S-击晕', 'S-知识渊博', 'A-熊熊燃烧', 'C-猫是液体'],
            description: '小图且玩家自身找节奏能力强可用。',
            contributor: 'gezi',
          },
        ],
        defaultFolded: true,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '通用特技。',
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
          '释放一个{飞吻}，可存在一段时间，会锁定并追踪附近的老鼠，命中老鼠后施加永久存在的“吻痕”，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害，只有受到其他[伤害或部分控制效果](包括爪刀攻击（指甲油外刀除外）、碎片的僵直、夹子、虚弱、部分变身效果（包括变身饮料效果）等，不包括香水反向、烟雾失明、场景物-轮胎造成的击退等)才能解除。',
        detailedDescription:
          '释放一个{飞吻}，最多存在18秒，超过18秒将自动消失。飞吻将锁定半径1200范围内的老鼠，锁定后将全图追踪且不会更换目标，若追踪途中命中其他老鼠将由其他老鼠承担吻效果；飞吻可被[护盾](会消耗护盾)、无敌、虚弱抵消，也可被[部分地形](包括门、厚墙壁、地面等)阻挡。\n飞吻命中老鼠后，对其施加“吻痕”状态（有特殊特效，{隐身(状态)}时也会显示），该状态永久存在，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害，通常只有受到其他[伤害或部分控制效果](包括爪刀攻击（指甲油外刀除外）、碎片的僵直、夹子、虚弱、部分变身效果（包括变身饮料效果）等，不包括香水反向、烟雾失明、场景物-轮胎造成的击退等)才能解除。\n{2级牛仔吉他}可解除吻痕状态，{2级机械身躯}可令吻痕伤害减半。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键', '药水键', '道具键'],
        cancelableAftercast: ['道具键'],
        forecast: 0.35,
        aftercast: 0.8,
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '吻痕期间，老鼠每次跳跃受到{1.3*,不受来源影响,不可致伤}伤害，移动期间以折合8.3Hp/秒的速度受到伤害（{0.55*,不受来源影响,不可致伤}/[次](该数值通过米可主动技能进行测段数，逆推计算获得。其他伤害数据参考了过往玩家的测量结果，可根据该方法测量或通过该数据推算得到单次伤害值)），搬奶酪时以折合15Hp/秒的速度受到伤害（[不包括推奶酪](此处游戏原文中的会受伤害操作包括推奶酪，但实际不包括)，下同）。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '被吻命中的老鼠额外受到减速，增加吻对老鼠的伤害。',
            cooldown: 15,
            charges: 2,
            detailedDescription:
              '吻痕期间，老鼠移速降低24.6%；伤害改为每次跳跃受到{1.8*,不受来源影响,不可致伤}伤害，移动期间以折合9.8Hp/秒的速度受到伤害，搬动奶酪以折合21Hp/秒的速度受到伤害。',
          },
          {
            level: 3,
            description: '被吻命中的老鼠无法使用技能，进一步增加吻对老鼠的伤害。',
            cooldown: 15,
            charges: 2,
            detailedDescription:
              '吻痕期间，老鼠无法使用技能；伤害改为每次跳跃受到{2.3*,不受来源影响,不可致伤}伤害，移动期间以折合11.3Hp/秒的速度受到伤害，搬动奶酪以折合32Hp/秒的速度受到伤害。',
          },
        ],
        cueRange: '全图可见',
        aliases: ['吻'],
      },
      {
        name: '魅力香水',
        type: 'weapon1',
        description:
          '喷洒香水，随后一段时间内，间歇性在自身位置释放{香水区域}，爪刀和投掷道具命中敌方也会生成{香水区域}。图多盖洛在该区域内获得增益，敌方则受到负面状态。\n香水区域重叠时会降低持续时间。\n香水区域可被部分受力效果影响而弹飞。',
        detailedDescription:
          '喷洒香水，使香气环绕自身（有特殊特效，{隐身(状态)}时也会显示），持续一段时间，期间间歇性在自身位置释放{香水区域}，爪刀和投掷道具命中敌方时在敌方位置生成{香水区域}。图多盖洛在香水区域内获得增益，敌方接触则受到负面状态。\n香水区域重叠时会降低持续时间。\n\n香水区域可被部分受力效果影响而弹飞。\n可影响香水区域的效果：{小鞭炮}、{鞭炮束}、{火药桶}、{火箭炮}的爆炸；{魔音贯耳}的弹飞道具效果；{闪亮营救}传送落地触发的弹飞道具效果；{勇往直前}的撞飞道具效果；{滑步踢}的踢飞道具效果。另外{2级视觉干扰器}可以短暂免疫香水效果。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        forecast: 2.36,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description:
              '图多盖洛在香水内将缓慢恢复健康值；敌方在香水内的移速、跳跃速度、推速、造成的伤害、Hp自然恢复速度下降。',
            cooldown: 16,
            detailedDescription:
              '香水自然释放频率为1秒/次（单次技能共能自然释放12次）。\n图多盖洛在香水内获得10Hp/秒的恢复效果；敌方在香水内移速降低30%，跳跃速度降低10%，推速降低10%，[造成的伤害降低10](最低为0)，[Hp自然恢复速度降低5/秒](最低为0，只对基础属性中的自然恢复一项生效，对因其他途径获得的恢复效果无效)。',
          },
          {
            level: 2,
            description:
              '提高香水释放次数和释放状态持续时间。图多盖洛获得的恢复效果增强，且额外提高攻击增伤、减少爪刀CD；对敌方的减益数值增强。',
            cooldown: 16,
            detailedDescription:
              '香水自然释放频率提高至0.8秒/次（自然释放次数增加到18次）。\n图多盖洛在香水内获得的恢复效果改为15Hp/秒，且攻击增伤提高25，爪刀CD减少30%；敌方在香水区域内移速改为降低55%，跳跃速度改为降低20%，推速改为降低30%，[造成的伤害改为降低20](最低为0)。',
          },
          {
            level: 3,
            description:
              '图多盖洛获得的所有增益效果数值全面增强，且额外提高爪刀范围；对敌方减益数值进一步增强，且使其无法使用技能。',
            cooldown: 16,
            detailedDescription:
              '图多盖洛在香水内获得的恢复效果改为20Hp/秒，攻击增伤改为提高50，爪刀CD改为减少70%，且爪刀范围提高到300；敌方在香水区域内移速改为降低80%，跳跃速度改为降低30%，推速改为降低70%，[造成的伤害改为降低30](最低为0)，且无法使用技能。',
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放时',
        cueRange: '全图可见',
        aliases: ['香水'],
      },
      {
        name: '魅力甲油',
        type: 'weapon2',
        description:
          '涂上指甲油，持续20秒，会在使用3次爪刀后提前结束。期间加速，且爪击会产生额外攻击区域（可生效部分知识卡），对敌方触发当前等级的被动效果并造成额外伤害；爪击命中{反向}的目标、或使用额外爪击区域命中处于[“吻痕”状态](详见主动技能)下的目标会造成额外伤害，且后者不会中断吻痕。',
        detailedDescription:
          '涂上指甲油，持续20秒，会在使用3次爪刀后提前结束。期间加速10%，且爪击会产生额外爪击区域（可生效部分知识卡），对敌方触发当前等级的被动效果并造成{30*,不受来源影响,不可致伤}伤害；[爪击](包括常规与额外爪击区域)命中{反向}的目标[额外](与原伤害分为不同的两段)造成{20*,不受来源影响,不可致伤}伤害（与{2级被动}有联动：命中目标时，会先对目标施加反向，随后再造成额外伤害）；额外爪击区域命中处于[“吻痕”状态](详见主动技能)下的目标[额外](与原伤害分为不同的两段)造成{40*,不受来源影响,不可致伤}伤害，且不会中断吻痕。\n\n额外爪击区域与相关知识卡/特技的结算关系：\n{猛攻}、{减速警告}：会对额外爪击区域命中的老鼠触发效果。\n{击晕}：会对额外爪击区域命中的老鼠触发效果（该效果先于吻痕额外伤害结算，会因此中断“吻痕”导致无法享受额外伤害）。\n{乘胜追击}：额外爪击区域命中也会积攒层数。\n{蓄势一击}：对额外爪击区域无效。\n{长爪}：额外爪击区域范围和伤害不变，且不会对已被常规爪击区域造成伤害的目标重复造成伤害。额外爪击区域范围和伤害不变。\n{长爪一击}、{勇气爪击}、{全垒打}：额外爪击区域范围和伤害不变，且不会对已被常规爪击区域造成伤害的目标重复造成伤害，无法触发全垒打的击飞道具效果和勇气爪击的减技能CD效果。当常规爪刀区域未命中但额外爪击区域命中目标时，仍触发爪刀CD返还效果。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        forecast: 1,
        aftercast: 0.18,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 10,
          },
          {
            level: 2,
            description:
              '甲油期间，爪刀命中获得恢复状态（不可叠加）和神采奕奕状态（每层增加移速、跳跃速度和交互速度，可叠加3层）。',
            cooldown: 10,
            detailedDescription:
              '甲油期间，爪刀[命中敌方](包括处于护盾、霸体、虚弱等状态下的敌方)敌人时图多盖洛获得每秒恢复8Hp的恢复状态，持续10秒；同时获得神采奕奕状态，移动速度和跳跃速度将提高8%/层，交互速度将提高20%/层，可叠加3层，持续12秒，再次命中重置持续时间。',
          },
          {
            level: 3,
            description:
              '本技能恢复状态持续期间免疫控制；使用技能后的首个爪刀会将命中的老鼠黏在地面上（需保持向一个方向移动才能挣脱），使用额外爪击区域命中处于[“吻痕”状态](详见主动技能)的目标会获得满层神采奕奕状态。',
            cooldown: 10,
            detailedDescription:
              '处于因本技能2级效果而获得的恢复状态持续期间时，免疫控制；使用技能后的首个爪刀命中老鼠时，若老鼠在地面，将直接造成[黏性甲油状态](粘滞6.15s，粘滞期间禁用技能、机器鼠，跳跃速度减少为0，掉落手中的道具（能掉落道具和击晕一致）。老鼠可小范围移动，可购买、拾取、投掷道具，不持续向一个方向移动、跳跃不会减少粘滞时间，仅向一个方向持续移动0.5s将提前挣脱)，若老鼠在空中，其下次[落地](若该角色被老鼠夹夹住，则需挣脱后才会判定落地)时受到该状态；使用额外爪击区域命中处于[“吻痕”状态](详见主动技能)的目标会获得满层神采奕奕状态。',
          },
        ],
        aliases: ['指甲油'],
        cueRange: '全图可见',
      },
      {
        name: '香水美人',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '受“香水”影响时，获得加速。',
            detailedDescription:
              '受到{香水瓶}/{香水烟雾}影响时不再反向，并获得21%加速。在{香水区域}内也会获得21%加速。',
          },
          {
            level: 2,
            description: '爪刀和{苍蝇拍}命中额外施加{反向}。',
            detailedDescription:
              '爪刀和{苍蝇拍}命中额外施加{反向}，持续9.8秒。（与{魅力甲油}有联动：命中目标时，会先对目标施加反向，随后再造成额外伤害）',
          },
          {
            level: 3,
            description: '爪刀和{苍蝇拍}命中额外使目标在一段时间内持续减少Hp。',
            detailedDescription:
              '爪刀和{苍蝇拍}命中额外使目标每秒受到{2.5*,不受来源影响,不可致伤}伤害，持续19秒；在第19.5秒再受到{1.25*,不受来源影响,不可致伤}伤害。',
          },
        ],
      },
    ],

    aliases: ['母猫', '图多', '土豆', '土豆盖洛'],
  },
  /* ----------------------------------- 侍卫汤姆 ----------------------------------- */
  侍卫汤姆: {
    description: '侍卫汤姆始终守护在皇宫内，负责保护国王的安全。',
    maxHp: 270,
    attackBoost: 0,
    hpRecovery: 1.67,
    moveSpeed: 745,
    jumpHeight: 420,
    clawKnifeCdHit: 5.5,
    clawKnifeCdUnhit: 2.2,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Guard Tom',
    catPositioningTags: [
      {
        tagName: '翻盘',
        isMinor: false,
        description: '3级被动减控免死，3级炮有一定强度，有一定的翻盘能力',
        additionalDescription: '',
      },
      {
        tagName: '追击',
        isMinor: false,
        description: '1级被动加速，炮打中后加速，警戒能看到老鼠位置。',
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
        description: '蓄势一击配合侍卫二级被动可以打死125血量的老鼠。',
        defaultFolded: false,
      },
      {
        cards: ['A-熊熊燃烧', 'A-心灵手巧', 'A-细心', 'A-加大火力', 'C-猫是液体'],
        description: '牧场专用。',
      },
      {
        id: '击晕',
        description: '',
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
        description: '通用特技。',
      },
    ],
    skills: [
      {
        name: '警戒',
        type: 'active',
        videoUrl: 'https://www.bilibili.com/video/BV1JquQzHEyJ?t=61.8',
        aliases: ['瞪', '望', '远视'],
        description:
          '大幅提高视野范围，并警戒房间内所有老鼠。被警戒的老鼠推速下降50%、暴露小地图视野，并清除部分增益。若警戒到老鼠，额外获得加速；若未警戒到，则返还15秒CD。',
        detailedDescription:
          '提高视野范围至原先的3.7倍，并警戒房间内[所有老鼠](距离极远的除外)，持续25秒。被警戒到的老鼠推速下降50%，暴露小地图视野，并清除[部分增益](所有药水；侦探杰瑞、侦探泰菲的隐身；大部分护盾效果，如知识卡、角色技能的护盾（罗菲2被与恶魔传送门的盾不会被消除）；部分无敌效果，如无畏、舍己、国王护盾、莉莉2级被动；米雪儿小情绪的变大；仙女鼠星星与2级被动的隐身；红花；太空药水仓的跳跃提升、变大和隐身；熊猫谷药水仓的兴奋；天宫香炉的远视)。若警戒到老鼠，额外获得20%加速；若未警戒到，则返还15秒CD。使用降落伞中的罗宾汉不会被警戒到。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键', '跳跃键'],
        cancelableAftercast: '无后摇',
        forecast: 1.31,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description:
              '警戒到至少两只老鼠时，增加爪刀范围；\n警戒到至少三只时，减少爪刀CD；\n警戒到四只时，增加Hp上限。',
            detailedDescription:
              '警戒到至少两只老鼠时，爪刀范围增加18.7%；\n警戒到至少三只时，爪刀CD减少50%；\n警戒到四只时，Hp上限额外增加100点。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '只要警戒到老鼠就会获得全部档次的增益。',
            cooldown: 25,
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
        cancelableSkill: ['道具键', '跳跃键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        forecast: 0.9,
        description:
          '原地召唤{皇家火炮(衍生物)}，并对附近老鼠造成少量伤害和短暂眩晕，自身获得短暂的两层{护盾}。火炮存在25秒或发射数次后消失，消失后技能进入CD。火炮存在期间，可以拖动技能键远程操纵火炮发射{炮弹}，命中时对老鼠造成伤害和眩晕，同时侍卫汤姆获得短暂大幅加速和护盾状态。',
        detailedDescription:
          '原地召唤{皇家火炮(衍生物)}，并对附近老鼠造成{10*,不受来源影响,不可致伤}伤害和0.93秒眩晕，自身获得两层{护盾}，护盾持续1.95秒。火炮存在25秒或发射数次后消失，消失后技能进入CD。火炮存在期间，侍卫汤姆可以自由活动，拖动技能键远程操纵火炮发射{炮弹}（发射前摇0.5秒，后摇0.5秒），命中时对老鼠造成{50*,不受来源影响,可致伤}伤害和0.56秒眩晕、移除其[部分增益](隐身、兴奋、远视；天宫图香炉的远视；除了尼宝三级翻滚和魔术师三级卡牌以外的技能与被动隐身)；同时侍卫汤姆加速49%并获得两层护盾，状态持续2.96秒。',
        skillLevels: [
          {
            level: 1,
            description: '火炮能射击三次。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '',
            cooldown: 25,
          },
          {
            level: 3,
            description: '火炮能射击七次；使命中的老鼠减速、并禁用技能和道具键一段时间。',
            cooldown: 25,
            detailedDescription: '火炮能射击七次；使命中的老鼠减速40%、并禁用技能和道具键3.5秒。',
          },
        ],
      },
      {
        name: '随机应变',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1JquQzHEyJ?t=23.8',
        skillLevels: [
          {
            level: 1,
            description: '附近大范围内有老鼠时获得加速。',
            detailedDescription: '以自身为中心，半径范围2481内有老鼠时，自身移速增加15%。',
          },
          {
            level: 2,
            description: '附近中等范围内老鼠数量为1或2只时，增加攻击力与爪刀频率。',
            detailedDescription:
              '以自身为中心，半径范围1757内老鼠数量为1或2只时，自身增加25点攻击力，爪刀CD减少25%。',
          },
          {
            level: 3,
            description:
              '附近较大范围内有大于2只老鼠时，自身Hp恢复速度增加，减少50%受控时间并免疫{虚弱}。',
            detailedDescription:
              '以自身为中心，半径范围2057内有大于2只老鼠时，自身Hp回复速度提升至10/秒，减少50%受控时间并免疫{虚弱}。',
          },
        ],
      },
    ],
    aliases: [],
  },

  /* ----------------------------------- 图茨 ----------------------------------- */
  图茨: {
    aliases: ['小黄'],
    description:
      '图茨拥有娇小的身材和靓丽的脸庞，因为被富养，她性格可爱温柔，广受所有猫和老鼠的喜爱。',
    maxHp: 225,
    attackBoost: 0,
    hpRecovery: 4.5,
    moveSpeed: 740,
    jumpHeight: 420, // FIXME: 梦回说跟托普斯一样是467.6、其他猫是481.7，但靠谱吗？
    clawKnifeCdHit: 2.5,
    clawKnifeCdUnhit: 2,
    clawKnifeRange: 200,
    gender: 'female',
    EnglishName: 'Toots',
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description:
          '{汽水罐}放在火箭上可以妨碍救援；{喵喵叫}大范围伤害搭配汽水可以防守最后一块奶酪',
        additionalDescription: '对打架阵容有很强的反制能力。',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description: '{喵喵叫}的大范围伤害和控制是有力的进攻手段。',
        additionalDescription: '',
      },
      {
        tagName: '打架',
        isMinor: true,
        description: '{喵喵叫}的大范围群体伤害和控制在打团时有一定发挥。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '鼠方一旦失误，{喵喵叫}的大范围群体伤害和控制可以对鼠方造成重创。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '防狼锤',
        pattern: '121210002',
        weaponType: 'weapon1',
        description: '防狼锤综合强度较低，仅在需要利用其2级的禁用技能和道具效果时才推荐使用。',
        additionaldescription: '',
      },
      {
        id: '汽水罐常规加点',
        pattern: '131313000',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
      {
        id: '汽水罐爪刀流',
        pattern: '131010033',
        weaponType: 'weapon1',
        description: '如果节奏突然断了，5级可以先点{1级被动}而不点汽水罐，尝试找节奏。',
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

    specialSkills: [
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
    ],
    skills: [
      {
        name: '喵喵叫',
        type: 'active',
        description:
          '按住技能键持续地喵喵叫，对附近的老鼠持续施加“喵喵攻击”状态，叠加到第五层时造成伤害和眩晕，并清空层数。技能期间可以移动，也可以使用爪刀和《绝地反击(特技)》；松开技能键可提前取消技能；被打断或提前取消技能会按比例返还CD。',
        detailedDescription:
          '按住技能键持续地喵喵叫，至多3秒，期间对周围半径1000范围内的老鼠持续施加“喵喵攻击”状态。技能期间可以通过按住方向键不松开的方式移动，也可以正常使用爪刀和《绝地反击(特技)》，松开技能键可提前取消技能；被打断或提前取消技能会按比例返还CD。\n\n“喵喵攻击”状态：持续2.9秒，可叠加并刷新剩余时间。使老鼠移速和跳跃速度降低8%，并暴露小地图视野；由**喵喵叫**将“喵喵攻击”状态叠加到第五层时，对目标造成{60*,可致伤}伤害并眩晕2秒，然后清空减速层数。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可主动打断',
        forecast: 0.6,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '施加减速的频率为0.5秒（单次技能期间共计可叠加5次）。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '施加减速的频率提升。',
            cooldown: 15,
            detailedDescription: '施加减速的频率提升至0.4秒（单次技能期间共计可叠加6次）。',
          },
          {
            level: 3,
            description: '施加减速的频率进一步提升。',
            detailedDescription: '施加减速的频率进一步提升至0.3秒（单次技能期间共计可叠加11次）。',
            cooldown: 15,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '防狼锤',
        type: 'weapon1',
        aliases: ['锤子'],
        description:
          '挥动防狼锤，对面前目标造成少量伤害和大幅度减速，并对其施加“喵喵攻击”状态，叠加到第五层时造成伤害和眩晕，并清空层数。使用该技能时，自身也会受到少量伤害。',
        detailedDescription:
          '挥动防狼锤，对前方300范围内的老鼠造成{5*,不受来源影响,可致伤}伤害，并对其施加“喵喵攻击”状态和“防狼锤额外减速”状态，但自身也会受到{10*,固定,无视护盾}伤害（且会[向前移动一小段距离](与挥锤动作配合。移动距离极短，几乎不可见)）。Hp低于10时不能使用本技能。\n\n“喵喵攻击”状态：持续2.9秒，可叠加并刷新剩余时间。使老鼠移速和跳跃速度降低8%，并暴露小地图视野；由**防狼锤**将“喵喵攻击”状态叠加到第五层时，对目标造成{60*,不受来源影响,可致伤}伤害并眩晕2秒，然后清空减速层数。\n“防狼锤额外减速”状态：持续6.9秒，移速和跳跃高度大幅降低。', //原有描述：防狼锤减速：使老鼠移速和跳跃速度降低30%（最多降低90%），并暴露小地图视野；防狼锤减速叠加到第五层时对其造成{60}伤害并眩晕2秒，然后清空减速层数。喵喵叫减速和防狼锤减速之间的层数互通，效果类似，但数值有差异。
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        forecast: 0.3,
        aftercast: 0.4,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 0.5,
          },
          {
            level: 2,
            description: '防狼锤命中时，使目标在一段时间内无法使用技能和道具。',
            cooldown: 0.5,
            detailedDescription:
              '“防狼锤额外减速”新增禁用[技能](包括主动、武器技能和特技等)和道具的效果。',
          },
          {
            level: 3,
            description: '',
            cooldown: 0.1,
            detailedDescription: '',
          },
        ],
        canHitInPipe: true,
      },
      {
        name: '汽水罐',
        type: 'weapon2',
        description:
          '向任意方向扔出{汽水罐(衍生物)}，汽水罐直线行进到终点后改为做旋转运动，持续20秒。盘旋的汽水罐在喵喵叫范围内时将会提高运动速度和半径。汽水罐命中老鼠或另一个汽水罐时，对小范围内所有老鼠造成少量伤害和{冰冻}。',
        detailedDescription:
          '向任意方向扔出{汽水罐(衍生物)}，汽水罐基础飞行速度1500，直线飞行1.2秒后改为做旋转运动，盘旋路线半径250，飞行速度1000，持续20秒。盘旋的汽水罐在喵喵叫范围内时运动速度每秒提升50，半径每秒增加200，喵喵叫结束后速度和半径将逐渐恢复正常。汽水罐直接命中老鼠时，对[半径175范围所有老鼠](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)造成{15*,不受来源影响,不可致伤}伤害、3秒{冰冻}和两层“喵喵攻击”状态；两个汽水罐相撞将产生更大范围的冰爆，对[半径350范围内所有老鼠](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)造成{30*,不受来源影响,不可致伤}伤害、3秒{冰冻}和四层“喵喵攻击”状态。\n\n“喵喵攻击”状态：持续2.9秒，可叠加并刷新剩余时间。使老鼠移速和跳跃速度降低8%，并暴露小地图视野；由**汽水罐**将“喵喵攻击”状态叠加到第五层时，对目标造成{60*,不可致伤}伤害并眩晕2秒，然后清空减速层数。[由汽水罐而被施加大于五层“喵喵攻击”状态](例如在已有四层减速时被汽水罐命中，因此达到六层减速)的老鼠，[每超出一层都将额外受到](例如五层为正常的60伤害，六层总共120伤害，以此类推)一次伤害。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键', '其他技能键'],
        cancelableAftercast: ['道具键'],
        forecast: 0.5,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '汽水罐自然消失或相撞会形成{汽水冰面}，该冰面最多存在60秒，被踩踏3次或持续时间结束后消失，图茨踩上特殊冰面时不会中断喵喵叫，鼠滑到会进入[脆弱状态](立刻掉落手中的道具，且推速和救援队友的速度降低，并暴露小地图位置，持续8秒)，图茨滑到则会获得爆发式加速。',
            cooldown: 8,
            detailedDescription:
              '汽水罐自然消失或相撞会形成{汽水冰面}，该冰面最多存在60秒，被踩踏3次或持续时间结束后消失，图茨踩上特殊冰面时不会中断喵喵叫，鼠滑到会进入[脆弱状态](立刻掉落手中的道具，且推速降低33%，救援队友速度降低73%，并暴露小地图位置，持续8秒)，图茨滑到则会使移速提高100%，持续3秒。',
          },
          {
            level: 3,
            description: '',
            cooldown: 8,
            charges: 2,
            detailedDescription: '',
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
              '[隐藏自身在小地图上的位置](不会因被老鼠看到而出现在小地图上)；开关门不会有声音；处于同一房间时，不会使老鼠胆怯。',
            detailedDescription:
              '[隐藏自身在小地图上的位置](不会因被老鼠看到而出现在小地图上，但是老鼠喝远视饮料或图茨手握老鼠时还是会出现在小地图上)；开关门不会有声音；处于同一房间时，不会使老鼠胆怯。',
          },
          {
            level: 2,
            description: 'Hp未满时，爪刀CD减少，且可连续挥爪三次。',
            detailedDescription:
              '当前Hp低于Hp上限时，爪刀CD减少40%，且在连续空刀三次后才会进入空刀CD。',
          },
          {
            level: 3,
            description: 'Hp未满时，{主动技能}和{武器技能}CD减少。',
            detailedDescription: '当前Hp低于Hp上限时，{主动技能}和{武器技能}CD减少40%。',
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
    attackBoost: 0,
    hpRecovery: 5,
    moveSpeed: 750,
    jumpHeight: 420,
    clawKnifeCdHit: 5.5,
    clawKnifeCdUnhit: 3.3,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Meathead',
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
        description: '对抗马索尔或是由多名携带幸运的老鼠组成的车队。',
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

    specialSkills: [
      {
        name: '绝地反击',
        description: '通用特技。',
      },
      {
        name: '应急治疗',
        description: '提高续航，防止被胡椒粉毒死。',
      },
    ],
    skills: [
      {
        name: '胡椒粉罐头',
        type: 'active',
        description:
          '掏出{胡椒粉罐头}，自身持续受到轻微伤害，并因此获得“刺激”状态，增加移速和跳跃高度。再次使用技能将投掷胡椒粉、造成伤害并形成{胡椒罐头烟雾}，持续对范围内角色造成伤害。米特在烟雾中也会获得“刺激”状态。',
        detailedDescription:
          '掏出{胡椒粉罐头}，自身持续受到轻微伤害，并因此获得“刺激”状态，移速和跳跃高度提高20%。再次使用技能将投掷胡椒粉、直接命中会造成{30*,可致伤}伤害，命中或落地后破碎并形成{胡椒罐头烟雾}，持续20秒，每秒对范围内角色造成{5*,不受来源影响,不可致伤}伤害（对米特自身的伤害改为{5*,不受来源影响,无视护盾}）、该状态在停止接触后会残留约3秒。米特在烟雾中也会获得“刺激”状态。\n胡椒粉在掏出后立刻进入CD；技能冷却完成后，若未投掷出胡椒粉，可[双击技能](分别执行投掷胡椒粉→掏出胡椒粉操作，利用掏胡椒粉前摇打断投掷后摇)，胡椒粉会原地向下扔。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '无法在手持老鼠时使用。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '可以在手持老鼠时使用：老鼠会掉落并眩晕2秒。',
            detailedDescription:
              '可以在手持老鼠时使用：老鼠会掉落并眩晕2秒，随后会被禁用技能并大幅减速。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '持续伤害频率更高。米特在“刺激”状态下获得50%减伤并提高绑火箭速度50%。',
            detailedDescription:
              '持续伤害频率提高至0.5秒/次。米特在“刺激”状态下获得50%减伤并提高绑火箭速度50%。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '饭盒陷阱',
        type: 'weapon1',
        description:
          '放下装有食物的{饭盒}，被老鼠踩中或被砸中后，饭盒会爆炸，对附近所有老鼠造成伤害和眩晕，并使其暴露小地图视野、大量减少推速。',
        detailedDescription:
          '放下装有食物的{饭盒}，被老鼠踩中或被投掷物砸中后，饭盒会爆炸，对附近所有老鼠造成{50*,可致伤}伤害和2秒眩晕，并使其暴露小地图视野、减少37%推速，持续10秒。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '使用{老鼠夹}时，改为放置{饭盒}。',
            cooldown: 17,
            charges: 2,
          },
          {
            level: 2,
            description:
              '增加饭盒伤害。爆炸后留下{食物(衍生物)}，米特触碰后会获得持续Hp恢复效果。大幅提高使用{老鼠夹}的速度。', // （连招：击晕接捕鼠夹）
            detailedDescription:
              '增加饭盒伤害。爆炸后留下{食物(衍生物)}，米特触碰后会获得持续Hp恢复效果。使用{老鼠夹}的速度提高至原先的400%。',
            cooldown: 17,
            charges: 2,
          },
          {
            level: 3,
            description: '',
            cooldown: 17,
            charges: 3,
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
              '每次受到伤害获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，根据层数造成额外伤害。\n在7层野性及以上时，绑火箭会获得6秒强霸体（内置CD：17秒）。',
            detailedDescription:
              '每次[受到伤害](实际伤害值需大于0。例：胡椒粉对自身造成伤害可以获得“野性”，但如果该伤害被固定减伤减免至0则不获得野性)获得1层“野性”状态，持续15秒，最多叠加10层。每层野性略微提升Hp恢复。使用爪刀时消耗全部野性，若[成功对目标造成伤害](不包括被护盾等状态抵挡的情况)，[额外](与原伤害分为不同的两段，后于原伤害结算)对其造成{0*,不受来源影响}伤害（每消耗1层野性使基础伤害提升4，上限40）。\n持有7层及以上的“野性”时，开始绑火箭时会获得6秒强霸体（内置CD：17秒）。',
          },
          {
            level: 2,
            description:
              '被爪刀命中的老鼠20秒内无法回复Hp。此期间被绑上火箭时，需要更多时间才能救下。',
            detailedDescription:
              '被爪刀命中的老鼠20秒内无法回复Hp。此期间被绑上火箭时，队友救援该角色的速度降低50%。',
          },
          {
            level: 3,
            description:
              '爪刀命中时，回复伤害等量的Hp；不论是否命中，每消耗一层野性，减少0.3秒爪刀CD。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 塔拉 ----------------------------------- */
  塔拉: {
    description: '塔拉是西部最美丽的牛仔母猫，她拥有俏丽的脸庞和苗条的身姿，吸引了无数人的目光。',
    maxHp: 250,
    attackBoost: 0,
    hpRecovery: 2.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 300,
    gender: 'female',
    EnglishName: 'Tara',
    catPositioningTags: [
      {
        tagName: '速通',
        isMinor: false,
        description: '{武器技能}可甩火箭',
        additionalDescription: '配合熊熊燃烧，9秒火箭可直接甩。',
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
        id: '常规加点',
        pattern: '022001112',
        weaponType: 'weapon1',
        description:
          '开局搜刮远视药水，利用远视药水可以不急点2级被动，优先点出来2级绳索。抓到老鼠尽可能手绑火箭。',
      },
      {
        id: '二武加点',
        pattern: '030103311',
        weaponType: 'weapon1',
        description: '二武常规加点',
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
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
        description: '击晕布局流，适合夹多的地图',
      },
    ],
    specialSkills: [
      {
        name: '蓄力重击',
        description: '配合击晕或套索，提高伤害。',
      },
      {
        name: '绝地反击',
        description: '通用特技。',
      },
    ],
    skills: [
      {
        name: '西部情谊',
        type: 'active',
        description:
          '向前施放爱意，根据命中角色的性别和朝向造成不同的伤害和控制效果，对男性和背对塔拉的角色效果更强。',
        detailedDescription:
          '向正前方600范围内施放爱意，根据命中角色的性别和相对塔拉的朝向而产生不同的效果:\n男性背对：对其造成{60*,不可致伤}伤害并眩晕0.4秒，之后每隔2.9秒受到0.4秒眩晕，该状态共持续6.9秒。\n男性正对：对其造成{30*,不可致伤}伤害，且使其移速减少30%，持续4.85秒。\n女性背对：对其造成{30*,不可致伤}伤害，且使其移速减少30%，持续4.85秒。\n女性正对：对其造成{30*,不可致伤}伤害，但使其移速增加20%，持续2.8秒。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        // cancelableAftercast: '', //FIXME
        forecast: 0.4,
        aftercast: 1,
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '',
            cooldown: 10,
            detailedDescription: '',
          },
          {
            level: 3,
            description: '大幅增加生效范围。',
            cooldown: 10,
            detailedDescription: '生效范围提高至1100。',
          },
        ],
        canHitInPipe: false,
        videoUrl: 'https://nie.v.netease.com/nie/2021/0128/a9211df79cfb9d8e230ad83a90b97a0f.mp4',
      },
      {
        name: '牛仔鞭索',
        type: 'weapon1',
        description:
          '拖动技能选择面前135度范围内的一个方向，松开时甩出{套索}，若套中老鼠，对老鼠造成伤害和减速；再次点击按钮使塔拉位移向该老鼠位置。当塔拉手中抓有老鼠时，本技能改为可向任意方向扔出老鼠，老鼠碰到火箭将直接绑上，但[不减少引线时间](Lv.2被动和知识卡仍能触发)；飞行过程中的老鼠在碰到平台，墙壁，拳头盒子，火箭后停止飞行，然后获得短暂无敌和加速。',
        detailedDescription:
          '拖动技能选择面前135度范围内的一个方向，松开技能键时甩出{套索}，套索存在时间0.75秒，存在时间内最大飞行距离为1750，对套中的老鼠造成{30*,可致伤}伤害并减速20%；在使用技能后进入2.9秒技能读条（若未套中老鼠则提前结束读条），套中老鼠后可再次点击技能，塔拉将[以1850的速度位移向该老鼠位置](位移期间获得无法选中效果，位移时间最多4.9秒，超过时间将会被直接传送至老鼠旁边)。当塔拉用技能位移到老鼠旁边时或套中老鼠4.9秒后，解除[套索效果](包括老鼠受到的减速效果，以及塔拉与老鼠之间连接的套绳贴图效果)。当塔拉手中抓有老鼠时，本技能改为可向任意方向以2000速度扔出老鼠，期间老鼠无敌，碰到火箭将直接绑上，但[不减少引线时间](Lv.2被动和知识卡仍能触发)；飞行过程中的老鼠在碰到平台，墙壁，拳头盒子，火箭后停止飞行，获得无敌效果并加速20%，持续2.9秒;飞行过程中[受力不停止飞行](包括鞭炮爆炸，电风扇吹风，轮胎击飞等效果。虽然不停止飞行，但仍会受力并可能改变方向)。套索的捆绑效果不会被无敌，护盾，霸体、[机器鼠](不会破坏机器鼠)等效果抵消或免疫，但造成的伤害、减速、眩晕会被抵消或免疫。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        forecast: 0.5,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description: '套索命中敌方时，对其造成眩晕，并提高塔拉的移速。',
            cooldown: 12,
            detailedDescription:
              '套索命中敌方时，[对其造成2.9秒眩晕](本技能造成伤害与造成眩晕的时机不同，所以即便该老鼠因该次伤害而进入"铁血"状态，也仍会受到后续的眩晕影响)，并使塔拉的移速提高18.5%，持续5秒。',
          },
          {
            level: 3,
            description: '将老鼠投掷到火箭上时，恢复Hp并获得加速。',
            cooldown: 8,
            detailedDescription:
              '将老鼠投掷到火箭上时，获得5Hp/秒的恢复状态，且移速提高25%，持续10秒。',
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        videoUrl: 'https://nie.v.netease.com/nie/2021/0128/e7bb5707361018eab342fdf2b832f510.mp4',
      },
      {
        name: '牛仔的礼物',
        type: 'weapon2',
        description:
          '向指定位置发射仙人球。同种仙人球之间会产生连线，被角色触碰后产生效果。不同种类仙人球的持续时间和最大连线距离不同。\n\n各仙人球效果如下：\n1. {爆炸仙人球}：连线被碰触后爆炸消失，同时使一定范围内的：敌方男性角色——被点燃，持续受到伤害并{暴露位置}（有内置CD）；塔拉——提高攻击增伤。\n2. {闪电仙人球}：连线被碰触后，若碰触者为：敌方男性角色——受到固定伤害，减速并降低救援速度；塔拉——移速增加，主动技能和爪刀的CD缩短，持续期间无法重复获得。\n3. {弹簧仙人球}：连线被敌方男性角色碰触后，将其{牵引}至连线中点，随后受到{眩晕}，过程期间{完全失重}；在{虚弱}时被牵引碰到{火箭}会直接绑上。',
        detailedDescription:
          '塔拉可通过外置轮盘切换仙人球种类（共3种，默认为“爆炸仙人球”）；拖动技能键选择以自身为中心半径约2200范围内的一个位置，松开时向该位置发射一个仙人球，点按技能键直接向原地发射仙人球。\n仙人球运动速度为2000；到达目标位置后，若一定范围内有未连线的同种仙人球，则[与其产生连线](有时会立刻连线，有时则有短暂延迟，具体成因暂不明确)并重置存在时间。连线可被任意角色触碰，但只会对敌方男性角色或塔拉产生效果。未连线的仙人球无法触碰。不同种类仙人球的持续时间和最大连线距离不同。仙人球从被发射时就开始计算存在时间。\n拖动技能键时，若预释放位置周围有可连线的同种仙人球，会有黄色虚线圆形UI进行提示。存在多个仙人球时，只会显示一个提示圈，且最终会[随机](可能存在确定的选取逻辑，待进一步测试。已知该逻辑不为单纯的“剩余持续时间”或“连线长度”)与其中一个仙人球连线，可能并非提示圈中的仙人球。\n\n各仙人球效果如下：\n1. {爆炸仙人球}：最大连线距离650，存在时间为12秒，连线被碰触后爆炸并提前消失，同时对以两仙人球连线为中轴、向两侧各延伸约500距离形成的矩形范围内的角色产生效果：敌方男性角色——被点燃，期间每秒受到{5*,不受来源影响,不可致伤}伤害并{暴露位置}，持续19.9秒（共计造成19次伤害；被点燃时同步获得49.9秒“点燃免疫”状态，期间不会再次被点燃）；塔拉——攻击增伤提高20，持续11.9秒。\n2. {闪电仙人球}：最大连线距离1200，存在时间为10秒，连线被碰触后，对碰触者产生影响：敌方男性角色——受到{10*,固定,不可致伤}伤害，随后移速降低10%，[救援队友速度降低25%](即救援队友所需时间提高33%，由0.96秒提高至1.27秒)，持续5秒；塔拉——移速提高21.5%，并使主动技能CD缩短至原先的40%，[爪刀CD更改](同类状态只能生效一个，因此该状态会被“变身饮料”效果覆盖)为2秒(未命中)/2.5秒(命中)，持续12秒（获得该状态时不会影响已处于CD中的主动技能/爪刀的当次CD，持续期间再次触碰连线不重置持续时间）。\n3. {弹簧仙人球}：最大连线距离2000，存在时间为16秒，连线被方男性角色碰触后，将其以约1300/秒的速度{牵引}向连线中点，到达目标位置或碰触部分平台后再对其造成0.9秒{眩晕}（被牵引时同步获得8.5秒“免疫弹簧”状态，期间不会再次被弹簧仙人球牵引；牵引及眩晕过程期间{完全失重}），牵引过程中若该角色处于{虚弱}状态，则在碰到{火箭}时会被[直接绑上](正常触发绑火箭-10秒、自身2级被动、熊熊燃烧等效果)。该仙人球对塔拉无效果。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
            charges: 6,
          },
          {
            level: 2,
            description: '',
            cooldown: 8,
            charges: 5,
          },
          {
            level: 3,
            description: '',
            cooldown: 8,
            charges: 10,
          },
        ],
        canHitInPipe: false,
        cooldownTiming: '释放时',
      },
      {
        name: '心思缜密',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '根据场上男性角色的数量提高移速和Hp上限。',
            detailedDescription:
              '场上存在1/2/3/4+名男性角色时，自身移速提高8%/16%/24%/32%，Hp上限提高20/25/30/35。',
          },
          {
            level: 2,
            description:
              '永久[扩大视野范围1.8倍](覆盖其他远视效果)；[将老鼠绑上火箭](包括用套索丢上火箭的情况)使燃烧倒计时立刻减少3.5秒。',
            detailedDescription:
              '永久[扩大视野范围1.8倍](覆盖其他远视效果)；[将老鼠绑上火箭](包括用套索丢上火箭的情况)使燃烧倒计时立刻减少3.5秒。',
          },
          {
            level: 3,
            description: '攻击男性角色将使自己获得{霸体}和Hp恢复状态。',
            detailedDescription:
              '[攻击男性角色](包括使用爪刀/道具/技能命中敌方男性角色的情况（爆炸仙人球的持续伤害除外）；不包括命中处于护盾/虚弱等状态下的角色的情况)将使自己获得{霸体}（会免疫控制、伤害和虚弱）和15Hp/秒的恢复状态，持续4.75秒。',
          },
        ],
        description: '',
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
    clawKnifeCdHit: 6,
    clawKnifeCdUnhit: 2,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Musketeer Tom',
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '{主动技能}以及{3级被动}可打出高额伤害。',
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
        description: '后期{3级被动}刷新{主动技能}拥有极高的上限，可能成为翻盘的点。',
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
        description: '弥补缺霸体的短板。',
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
          '向前冲刺2s，期间无敌、移速提升75%，若命中敌方将造成{10*,可致伤}伤害、使其移速降低25%，跳跃高度降低50%，持续3s。冲刺时遇到正常、虚弱、护盾、霸体和[部分无敌效果](罗宾汉降落伞、剑杰格挡、剑菲冲刺、冰冻保鲜特技、变大)的老鼠均可解锁二段技能挑飞，否则技能进入CD。解锁后可在6s内使用二段技能[挑飞](前摇0.35s，可用道具键、其他技能键取消释放；无视护盾和除罗宾汉杰瑞的降落伞、剑客泰菲的冲刺、变大外的其他无敌效果，但不能挑飞霸体老鼠)，向上挑飞脚下的老鼠，对老鼠造成1.9s眩晕并击飞1s。若挑飞老鼠，可在6s内使用三段技能[追踪到老鼠位置](以2000速度飞向敌方，飞行最大时间0.6s，若发生以下情形将不会释放连斩：超过最大飞行时间，被打断，被墙体、拳头盒子、嫦娥阻挡，老鼠在自己下方（泰菲家族由于模型小，若与剑汤站在同一水平面则无法连斩）)进行[连斩](无视护盾、霸体和无敌效果；期间只会受到天使泰菲反伤和可击中管道中的角色的技能伤害)。连斩持续3.1秒，会使[范围内的老鼠](不包括手中的老鼠)浮空4.2秒、每0.55秒受到{10*,不受目标影响,无视护盾,不可致伤}伤害，总共5次。连斩期间老鼠无法移动，但可以使用技能和交互。无法打爆机器鼠。[快速点击可加速连斩](每次点击使连斩持续时间减少0.5s，同时老鼠浮空时间减少0.5s，并且总共至多额外造成两次伤害)。连斩后摇0.8s，可用道具键取消。连斩造成两次伤害后会使老鼠受到[威慑效果](绑上火箭后消失)，被绑上火箭时，引线将额外减少10s。挑飞和连斩[在空中释放](不是跳放)将直接进入CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        forecast: 0,
        aftercast: 0,
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
            description: '连斩后极大提高绑火箭速度，持续一段时间。',
            cooldown: 18,
            detailedDescription: '连斩后绑火箭速度提升500%（只需0.29s绑火箭），持续20s。',
          },
          {
            level: 3,
            description: '增加连斩的伤害。',
            detailedDescription:
              '每段连斩改为造成{13*,不受目标影响,无视护盾,不可致伤}伤害（慢斩总伤害提高至65，快斩总伤害提高至91）。',
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
        forecast: 0,
        aftercast: 0.9,
        skillLevels: [
          {
            level: 1,
            description: '防御期间，移速降低30%。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '防御期间不再减速。',
            detailedDescription: '防御期间不再减速。',
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
          '点击技能，释放三段剑舞。一段旋刃突击，前摇0.3s，旋转着向前突进，并带走[碰到的敌方](无视敌方任何状态)；6s内可释放第二段剑刃重击（无视敌方任何状态都可触发连斩），前摇0.1s，后摇0.6s，可用道具键取消，对附近的敌方造成眩晕0.5s；6s内可释放第三段剑舞劈砍，对劈砍位置[附近](范围较小)的敌方造成{50*,不可致伤}伤害、击退和眩晕（劈砍时若不在平台或地面将不会造成效果），命中时将减少8s骑士连斩CD。技能前摇和释放期间无霸体，若[被打断](包括碎片、夹子、眩晕、其他技能键、道具、特技、爪刀等)将直接进入技能CD。\n每段分别可与骑士连斩相互衔接释放：任意技能某段命中可触发两个技能下一段；连招最后使用的技能将进入CD。',
        // 推荐连招：剑舞1-剑舞2-连斩、冲刺-剑舞2-连斩。
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['其他技能键', '道具键'],
        cancelableAftercast: ['道具键', '其他技能键'],
        forecast: 0.3,
        cooldownTiming: '释放后',
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
            description: '释放第三段将提高移速一段时间。',
            cooldown: 12,
            detailedDescription: '释放第三段将获得12%加速，持续3.4s。',
          },
        ],
      },
      {
        name: '骑士之剑',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '爪刀带有剑气，剑气命中的敌方将受到少量伤害和短暂眩晕；剑气不视作爪刀。',
            detailedDescription:
              '爪刀会在距自身前方360~485的范围内产生“剑气”，被剑气命中的敌方将受到{30*,可致伤}伤害和1.4秒{眩晕}；剑气不会命中[已被当次常规爪击区域造成伤害的目标](若当次爪刀被“护盾”等状态抵挡，则剑气仍可命中目标，可借助该特质达到一刀击破一层护盾+造成一次伤害的效果，该技巧被称为“破盾刀”)；剑气不视作爪刀，命中敌方不会视作爪刀命中，也无法触发爪刀相关知识卡和特技；爪刀范围增大时，剑气位置不变。',
          },
          {
            level: 2,
            description: '剑气命中时，移速增加，期间免疫碎片且不受减速影响。',
            detailedDescription:
              '剑气[命中敌方](注意：剑气不会命中“已被当次常规爪击区域造成伤害的目标”)时，移速增加20%，期间免疫碎片且[不受减速影响](仍会正常受到减速相关状态，但免疫其中降低移速的效果)，持续9.9秒。',
          },
          {
            level: 3,
            description: '剑气命中时，重置{主动技能}CD。',
            detailedDescription:
              '剑气[命中敌方](注意：剑气不会命中“已被当次常规爪击区域造成伤害的目标”)时，{主动技能}的CD减少30秒。',
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
    attackBoost: 0,
    hpRecovery: 1.5,
    moveSpeed: 735,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 1.65,
    clawKnifeRange: 220,
    gender: 'male',
    EnglishName: 'Cooper',
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
        id: '常规加点',
        pattern: '1001[01]222',
        weaponType: 'weapon1',
        description:
          '{1级主动}和{2级被动}是库博机动性的核心组成部分；{3级被动}的高额恢复与{3级主动}的减伤均能极大提高库博的生存能力。残血时先点{3级被动}；满血先点{3级主动}。',
        additionaldescription: '',
      },
      {
        id: '优先2级主动',
        pattern: '101002221',
        weaponType: 'weapon1',
        description:
          '{3级被动}的高额回复能够给库博带来不错的生存能力，所以优先点出；{2级被动}和{2级主动}能够给库博带来不错的伤害加成，对主动需求较高优先点出{2级主动}，对交互速度和更快的移速需求较高则优先点出{2级被动}。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '蓄势一击',
        description: '以乘胜+蓄势为核心，以天堂火箭为主要淘汰手段。',
        groups: [
          {
            cards: [
              'S-乘胜追击',
              'S-蓄势一击',
              'S-知识渊博',
              [CardGroupType.Or, 'C-猫是液体', 'C-狡诈'],
            ],
            description:
              '以{乘胜追击}{蓄势一击}为核心，利用提供的高移速和高攻击力快速击倒老鼠，绑上天堂火箭巩固优势。不需要{猫是液体}时可换为{狡诈}。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-穷追猛打', 'B-皮糙肉厚'],
            description: '{穷追猛打}便于快速展开第一波节奏，{皮糙肉厚}用于提高自身的身板。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
            description: '携带{猫是液体}时的变种。',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '击晕',
        description: '以乘胜+击晕为核心，灵活性强，以天堂火箭为主要淘汰手段。',
        groups: [
          {
            cards: ['S-击晕', 'S-乘胜追击', 'S-知识渊博'],
            description:
              '目前较为通用的卡组，以{击晕}为核心，{乘胜追击}提高机动性，{知识渊博}能让库博更早进入强势期。',
          },
          {
            cards: ['S-击晕', 'S-乘胜追击', 'A-穷追猛打', 'C-猫是液体'],
            description:
              '较老的卡组，将{知识渊博}用{穷追猛打}和{猫是液体}替代，前期更方便找节奏，适用于一些管道图。',
          },
          {
            cards: ['S-击晕', 'S-乘胜追击', 'A-穷追猛打', 'B-捕鼠夹'],
            description:
              '携带{捕鼠夹}时的变种。在天堂口放夹老鼠几乎必踩，{捕鼠夹}能够增加老鼠挣脱的时间拖延换天堂火箭的节奏。',
          },
        ],
        defaultFolded: false,
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
      {
        name: '蓄力重击',
        description: '搭配击晕或捕鼠夹使用，补充伤害。',
      },
    ],
    skills: [
      {
        name: '虚幻梦影',
        type: 'active',
        aliases: ['天梯'],
        description:
          '使用时获得加速和间歇性隐身，但靠近老鼠时，对方头顶会有感叹号提示；再次使用进入天堂并留下{天空扶梯}（最多存在2个）。库博在天堂中持有强霸体，可在天堂内的{天空扶梯}获知所有老鼠的位置，并任意选择房间传送；老鼠则可通过其传送到随机洞口。天堂内有2个{天堂火箭}，能绑上老鼠的虚影，[拥有强制放飞机制](270秒倒计时，结束时直接淘汰对应老鼠)。虚影被救援时，改为绑上救援者的虚影，救援所需时间较长，救援位置较普通火箭[偏下](如果火箭下有捕鼠夹，会导致踩夹)。已被绑上天堂火箭的老鼠无法进行天堂火箭救援。在对应老鼠被绑上地面火箭或进入墙缝期后，倒计时速度会加快。',
        detailedDescription:
          '本技能分两段：\n第一段：在1.2秒前摇后，获得持续30秒的以下状态：加速7.5%；[每隔7秒获得3.5秒的隐身效果](技能释放时立刻进入隐身，隐身结束3.5秒后会再次获得；能被主动技能隐身的侦探泰菲看到；会触发遥控器召唤的机器鼠爆炸；不能被玛丽和表演者杰瑞的主动技能消除)；隐身期间在自身3秒前的位置生成[阴影](即角色脚下的影子，无效果。阴影能被其他人看到)；靠近老鼠1000范围内时，对方头顶会有感叹号提示。本段技能进入前摇后，不会因进入{禁用技能}状态而释放失败。技能释放完毕进入状态时使技能同步进入读条，再次点击技能释放第二段。\n第二段：[立刻使技能进入CD](即前摇前立刻使技能进入CD，被打断不返还)。在1.2秒前摇后，传送到天堂，并在自身原位置生成{天空扶梯}（最多存在2个，达到上限则销毁最早生成的1个）。所有角色都可以[与天梯交互并传送到天堂](该交互优先级极低)。\n“天堂”：位于常规地图外的特殊房间，通常只能经由天梯进出。库博在天堂内持有[强霸体](无法免疫强制位移和变身；无特效；获得霸体有一瞬间的延迟，如果进入天堂的瞬间踩中夹子则会被夹住，通常由于在入口处插叉子再在其上放夹子导致)，但无法释放主动技能。天堂入口处有一个特殊天梯，猫咪与其交互可[打开传送面板](显示所有老鼠的位置，可任意选择房间传送；该交互不打断移动)；老鼠与其交互将被传送到随机洞口。天堂内默认生成[2个蛋糕](位于入口处及右侧中部平台处)，2个天堂火箭，[1瓶神秘药水](在以下4处位置中的随机1处生成：1.天堂左侧地板；2.天堂右侧地板——被云层挡住，需走近才能发现；3.天堂右侧中部平台——几乎被列车站标签挡住，需仔细观察；4.天堂右侧顶端平台——可借助右数第2节围栏顶部的平台进行跳跃)。\n{天堂火箭}：放飞倒计时固定为270秒，绑上老鼠时改为绑上对应虚影，老鼠本体会传送到随机洞口；虚影被救援时，改为绑上救援者的虚影；[救援天堂火箭](读条显示为“破坏火箭”)的所需时间固定并且较长，救援位置较普通火箭[偏下](救援时站在地面；如果火箭下有捕鼠夹，会导致踩夹)。已被绑上天堂火箭的老鼠无法进行天堂火箭救援。兔子先生无法对天堂火箭下达救援指令。倒计时结束时，[直接淘汰虚影对应的老鼠](钻入机器鼠中的老鼠也会被放飞；钻入盔甲人或乾坤袋中的老鼠暂时无法被放飞；表演者杰瑞Lv.3被动只在同时也被绑在地面火箭时才触发；天使祝福无法祝福虚影，也无法复活因天堂火箭而被放飞的老鼠)。天堂火箭当虚影对应老鼠被绑上地面火箭时，[地面火箭倒计时停止](倒计时速度归零；仍会因老鼠被绑上火箭而减少引线时间，此时火箭引线时间降为0时也不会起飞；会因挣扎、鼓舞Lv.3等效果而增加读秒)，天堂火箭倒计时速度大幅提高；进入墙缝期后，天堂火箭倒计时速度提高到原先的2倍；若二者同时触发则取最高值。天堂火箭不受[其他绝大部分机制](会受到鼓舞Lv.3的影响（增加读秒的效果对本体和虚影分别计算，可重复计算，即同时鼓舞虚影和本体则-20秒）；除此之外不受绑火箭或火箭燃烧速度变化的影响，包括自身被动技能Lv.2，知识卡-加大火力/熊熊燃烧，技能-炸药桶/爱之花洒/友情庇护/兔子大表哥/侠义相助/Lv.3沙包拳头/风格骤变Lv.3/共鸣Lv.2/滑步踢/乾坤袋/蓝图/梦中乐园的影响)影响，但会影响{穷追猛打}(绑上天堂火箭时，穷追猛打效果立刻结束)。',
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
            description: '技能期间获得额外的攻击增伤。',
            cooldown: 25,
            detailedDescription: '第一段技能的状态持续期间，额外获得攻击增伤。',
          },
          {
            level: 3,
            description: '技能期间获得减伤。',
            detailedDescription: '第一段技能的状态持续期间，额外获得固定25减伤。',
            cooldown: 25,
          },
        ],
        cueRange: '全图可见',
        forecast: 1.2,
        aftercast: 0,
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
            description: '每组愿望由随机3个不重复道具组成。',
            cooldown: 12,
            detailedDescription:
              '每组愿望由{灰花瓶}、{蓝花瓶}、{小鞭炮}、{鞭炮束}、{玩具枪}、{遥控器}、{老鼠夹}中的随机3个不重复道具组成，各道具生成概率权重相同。',
          },
          {
            level: 2,
            description: '每组愿望改为4个道具，其中必然包含1个{苍蝇拍}。',
            detailedDescription: '每组愿望固定生成1个{苍蝇拍}，随后抽取其它道具，总共生成4个道具。',
            cooldown: 12,
          },
          {
            level: 3,
            description:
              '每组愿望改为5个道具，其中必然包含1个{苍蝇拍}与1瓶{神秘饮料}，且有概率出现{金锤子}（全局限3把）与额外的{苍蝇拍}。',
            cooldown: 8,
            detailedDescription:
              '每组愿望固定生成1个{苍蝇拍}与1瓶{神秘饮料}，随后在原有7种道具与{苍蝇拍}（可与原苍蝇拍重复）、{金锤子}（每局至多3把）中随机抽取3个不重复道具，总共生成5个道具。\n除金锤子外的8种道具生成概率权重相同，金锤子的权重约为其它单一道具的1/3，且局内累计通过该技能获得3把金锤子后权重降至0。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '全图可见',
        forecast: 0,
        aftercast: 0,
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
  },

  /* ----------------------------------- 凯特 ----------------------------------- */
  凯特: {
    description:
      '她是博学多才的都市美少女，冷静知性，是智慧与美貌并存的化身。她是校园中靓丽的风景线，也是学生眼中博学多识的师长。拥有无限魅力她，其爱慕者多如过江之鲫。',
    maxHp: 250,
    attackBoost: 0,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.5,
    clawKnifeRange: 300,
    gender: 'female',
    EnglishName: 'Kate',
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动被动武器技能都是伤害性技能，在对局中可造成大量伤害。',
        additionalDescription:
          '{主动技能}可以对一条直线内的敌人造成伤害；{武器技能}可以单独造成伤害或者夹住老鼠，也可以配合{主动技能}造成多段伤害；{1级被动}可以对老鼠造成更多伤害。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '{2级被动}可以减少被控时间；{主动技能}为范围伤害，打架时命中率高。',
        additionalDescription: '{3级被动}命中破绽可减少技能CD，进一步提高打架优势。',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '在墙缝期混战中{主动技能}在小范围内的命中率高，更大概率造成多倒。',
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
        description: '弥补缺霸体的短板。',
      },
      {
        name: '全垒打',
        description: '两个技能都能享受攻击力加成，大幅提高伤害。',
      },
    ],
    skills: [
      {
        name: '追求者出击',
        type: 'active',
        aliases: ['舔狗'],
        description:
          '召唤{追求者}从远处冲至面前，对触碰的敌方造成伤害；随后可使追求者向指定方向再度出击。\n当{百科全书}在凯特附近闭合时，追求者会快速冲向书籍将其捡起并送还凯特。',
        detailedDescription:
          '从远处召唤{追求者}冲至面前距离200的位置，[随后](当凯特本身位置不变时，追求者将在后摇结束后0.2秒停下)停下并原地待命。追求者的出击速度为2000/秒，被召唤后可存在15秒，运动期间会对触碰的敌方造成[一定伤害](与技能等级相关)，待命期间则不造成伤害。\n追求者被召唤后，技能同步进入15秒读条，但初始禁用，在追求者结束首次冲刺0.63秒后解禁。释放二段技能将使追求者向[指定方向](点按技能键为凯特面朝方向，拖动技能键则为指向方向)再度出击，直至飞出场外（该操作有0.35秒前摇与0.35秒后摇，均可被道具键取消）。\n当场上存在待命状态的追求者时，若{百科全书}闭合时与凯特距离小于1650，则追求者会冲向书籍、将其捡起并回到凯特身边，此时凯特可通过交互键拾取书籍。若被追求者拾取的书籍上有老鼠，则追求者在消失/因二段技能出击时会放下该老鼠（该老鼠会直接解除被书籍夹住状态）。\n追求者在非待命状态下无法执行主动出击指令（包括拾取书籍/二段技能出击）。\n{追求者}可以被{滑步踢}等技能击飞，若放任不管将径直飞出场外，可通过执行主动出击指令来中断该移动。',
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
            detailedDescription: '追求者的伤害为{30*,可致伤}。',
          },
          {
            level: 2,
            description:
              '[无任何效果](游戏内原文为“追求者的速度更快”，但实测速度并未发现显著变化)。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '追求者会造成更高伤害和额外的{爆炸}眩晕。',
            detailedDescription: '追求者改为对命中目标造成{50*,可致伤}伤害和2秒{爆炸}眩晕。',
            cooldown: 18,
          },
        ],
        canHitInPipe: false,
        cueRange: '本房间可见',
        videoUrl: 'https://b23.tv/uBonj7M',
      },
      {
        name: '知识即力量',
        type: 'weapon1',
        description:
          '投掷{百科全书}，命中时造成伤害；落地后书籍会打开，一段时间后或再次施放技能会让书籍闭合，造成伤害并将老鼠夹住。书籍闭合后存在一定时间，凯特可以通过交互键捡起书籍，返还部分CD、回复一定Hp、提高绑火箭和放置{老鼠夹}的速度、将被夹住的老鼠{直接抓起}在手中。\n当书籍在凯特附近闭合时，{追求者}会快速冲向书籍将其捡起并送还凯特。',
        detailedDescription:
          '向[指定方向](点按技能键为凯特面朝方向，拖动技能键则为指向方向)投掷{百科全书}。书籍以1500/秒的速度飞行，对直接命中的敌方造成{30*,可致伤}伤害；书籍碰触[其它物体](包括平台、地面、墙壁、角色等)后会打开，[一定时间](与技能等级相关)或施放二段技能后闭合，对位于上方的敌方老鼠造成{30*,可致伤}伤害并将老鼠夹住（夹住10秒后自动挣脱；也可通过手动挣扎12次来提前挣脱，大约需3.8秒）；书籍闭合后技能进入CD。书籍闭合后存在10秒。\n凯特可通过交互捡起闭合的书籍，随后减少本技能5秒CD、回复自身50Hp、使绑火箭及放置{老鼠夹}的[交互速度提高约100%](绑火箭时间1.73秒→0.87秒，放置鼠夹时间1.53秒→0.73秒)（持续14.9秒）、将被夹住的老鼠{直接抓起}在手中。（该交互动作不影响角色行动）\n当场上存在待命状态的{追求者}时，若书籍闭合时与凯特距离小于1650，则{追求者}会冲向书籍、将其捡起并回到凯特身边，此时凯特可通过交互键拾取书籍。若被追求者拾取的书籍上有老鼠，则追求者在消失/主动出击时会放下该老鼠（该老鼠会直接解除被书籍夹住状态）。\n二段技能初始禁用，在书籍完全展开（即在碰触其它物体的0.63秒后）解禁。\n本技能前摇期间可照常移动、跳跃，可被投掷道具或使用技能的前摇打断；后摇期间无法移动及释放技能，可以跳跃但不取消后摇，可用道具键取消后摇。\n\n书籍的命中老鼠逻辑与道具类似：碰触物体后再次碰撞敌方仍可造成伤害，只在自身完全静止后才会结束伤害判定。书籍无法触发{乾坤一掷}。\n书籍与{老鼠夹}不同，无法触发相关知识卡（包括{捕鼠夹}、{夹不住我}、{狡诈}等），其挣脱速度也不会受“挣脱老鼠夹速度”的影响。若老鼠因被书籍夹中而触发{铁血}效果，会立即挣脱书籍。若书籍闭合时有多只老鼠处于判定范围内，只会命中[角色编号](该编号可在头像栏查看)最小的一只。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['本技能键', '其他技能键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '书籍完全展开5秒后会自动闭合。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '',
            cooldown: 15,
          },
          {
            level: 3,
            description: '被书籍砸中会被添加3层“破绽”；书籍自动闭合的时间延后。',
            cooldown: 15,
            detailedDescription:
              '被书籍[直接砸中](即在书籍未碰触其它物体的情况下被率先砸中)的敌方会被添加3层“破绽”；书籍自动闭合的时间延后至10秒。（注：[老鼠挣脱所需时间不变](游戏内原文为“夹住老鼠的时间获得提升”，但老鼠挣脱所需时间实际上无变化)）',
          },
        ],
        aliases: ['书', '书籍'],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
        forecast: 0.3,
        aftercast: 0.2,
        videoUrl: 'https://b23.tv/uBonj7M',
      },
      {
        name: '骄傲的学霸',
        type: 'passive',
        description:
          '凯特能为敌方添加“破绽”状态，持续10秒，可叠加5层。对敌方造成伤害时，击破“破绽”造成额外伤害并获得额外经验。',
        detailedDescription:
          '凯特可通过本技能或{3级武器}为敌方添加“破绽”状态，持续10秒，可叠加5层（会在敌方头顶显示当前层数），重复获得刷新持续时间，达到上限后仍可继续获得。\n[学习本技能后](未学习本技能也可通过3级武器技能为敌方添加“破绽”，但无法将其击破)，由凯特对敌方造成伤害时，击破敌方全部“破绽”层数，每击破一层破绽就对其造成{6*}伤害并使凯特获得100经验。\n“破绽”不会对{虚弱}、{隐身(状态)}等状态下的敌方施加。',
        skillLevels: [
          {
            level: 1,
            description: '持续为附近敌方添加“破绽”状态。',
            detailedDescription:
              '以凯特为中心、半径约1750的圆形范围内，所有敌方[每1.8秒](游戏内原文为1.5秒，有误)获得一层“破绽”状态。',
          },
          {
            level: 2,
            description:
              '敌方使用技能、投掷道具、从火箭上救下队友时，会获得“破绽”，且使凯特增加移速、减少被控制时间（包括虚弱）、加快绑火箭速度。',
            detailedDescription:
              '1级被动生效范围内，未{隐身(状态)}的敌方使用技能、投掷道具、从火箭上救下队友时，会获得1层“破绽”，且使凯特移速增加19.5％、受到的眩晕等控制减少50%（对{猫虚弱}改为固定减少2秒）、[绑火箭速度提高92%](绑火箭时间1.73秒→0.9秒)，该加成持续7.9秒，重复获得可刷新持续时间。', //原：移速增加16.5%
          },
          {
            level: 3,
            description: '击破破绽会减少技能CD。',
            detailedDescription: '每击破一层破绽都会减少{主动技能}和{武器技能}2秒CD。',
          },
        ],
        videoUrl: 'https://b23.tv/uBonj7M',
      },
    ],
  },

  /* ----------------------------------- 苏蕊 ----------------------------------- */
  苏蕊: {
    aliases: ['苏三心'],
    description:
      '苏蕊是最受欢迎的啦啦队队长，充满活力的她，脸上时时刻刻都洋溢着灿烂的笑容。她热爱生活，享受美食，认识她的猫和老鼠都会被她吸引，和她成为朋友。',
    maxHp: 200,
    attackBoost: 0,
    hpRecovery: 2.5,
    moveSpeed: 770,
    jumpHeight: 420,
    clawKnifeCdHit: 7,
    clawKnifeCdUnhit: 5,
    specialClawKnifeCdHit: 12,
    specialClawKnifeCdUnhit: 6,
    clawKnifeRange: 280,
    initialItem: '鞭炮束',
    gender: 'female',
    EnglishName: 'Zuri',
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
        id: '常规加点',
        pattern: '12000122-1',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '蓄势一击',
        description: '{蓄势一击}使苏蕊通过球接爪刀可以轻松打死125Hp老鼠。',
        groups: [
          {
            cards: [
              'S-蓄势一击',
              'A-穷追猛打',
              [CardGroupType.Or, 'S-屈打成招', 'A-熊熊燃烧'],
              [
                CardGroupType.Or,
                'A-加大火力',
                'A-细心',
                'B-皮糙肉厚',
                [CardGroupType.And, 'B-攻其不备', 'C-猫是液体'],
              ],
            ],
            description:
              '以{蓄势一击}为主的卡组，可用于大部分情况，{穷追猛打}开局找节奏，{蓄势一击}补伤害。{熊熊燃烧}提高火箭燃烧效率，也可以替换为{屈打成招}，牺牲火箭燃烧效率换取更强的拦截能力，也能提供滚雪球能力，但容错较低，一方面可能导致火箭燃烧太慢拖慢节奏，另一方面鼠方支援快或者两边支援会让{屈打成招}效果大打折扣。剩下4/5费可以选择性的换{加大火力}进一步提高火箭燃烧效率；换{皮糙肉厚}应对高频伤害的阵容；换{猫是液体}应对管道较多的地图；若是习惯{细心}也可以换上。',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '击晕',
        description:
          '{击晕}卡组比较适合新手，还能提供一定干扰。但可能会出现跳舞爪刀伤害不够的情况，需要更多的衔接瑜伽球和道具，且跳舞爪刀cd较长。',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'A-加大火力'],
            description: '{熊熊燃烧}提高火箭燃烧效率。剩余4费仍然可以根据个人情况自由选择。',
          },
          {
            cards: ['S-击晕', 'S-屈打成招', 'A-穷追猛打', 'A-加大火力'],
            description: '{屈打成招}替换{熊熊燃烧}，优劣同上。',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'C-狡诈', 'C-猫是液体'],
            description: '{猫是液体}应对管道较多的地图。',
          },
        ],
        defaultFolded: true,
      },
      {
        id: '乘胜追击',
        description:
          '{乘胜追击}卡组有着较高的门槛，但不怕拉扯。不过一方面既有缺伤害的问题，另一方面也有控制缺少的问题。同时苏蕊血量低，容易造成层数大量流失，所以并不太推荐萌新使用。',
        groups: [
          {
            cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
            description:
              '{乘胜追击}提高机动性，{穷追猛打}开局找节奏，{熊熊燃烧}提高火箭燃烧效率。剩下费用自由选择，同上。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-熊熊燃烧', 'C-猫是液体'],
            description:
              '{乘胜追击}加{蓄势一击}，解决单一{乘胜追击}缺少伤害的问题，但没有{穷追猛打}，开局不太好找节奏，对于猫方找节奏能力有一定要求。比较推荐有七色花或者其他有增益的地图使用。',
          },
          {
            cards: ['S-乘胜追击', 'S-蓄势一击', 'A-加大火力', 'B-皮糙肉厚'],
            description:
              '{加大火力}替换{熊熊燃烧}，随后{乘胜追击}和{蓄势一击}一起携带，这样还能再带一张4费卡。但同上一样需要更多找节奏能力。',
          },
        ],
        defaultFolded: true,
      },
    ],

    specialSkills: [
      {
        name: '急速翻滚',
        description:
          '主动技能全程霸体，所以对于特技霸体的需求较低。翻滚能弥补机动性不足的短板，也能用于快速控位出刀。',
      },
    ],
    skills: [
      {
        name: '律动时间',
        type: 'active',
        aliases: ['跳舞'],
        description:
          '苏蕊开始舞动，持续40秒。舞动开始时立刻回复Hp，放下手中老鼠并使其自主跟随。舞动期间免疫敌方老鼠的绝大部分控制，以及冰块和鞭炮的控制，爪刀变为“舞动亮相”。舞动时每13秒出现爱心提示，期间点击技能按钮将回复Hp且移速和攻击增伤提高，爱心消失后开始冷却。舞动时接触虚弱老鼠将使其自主跟随苏蕊30秒，期间遇到火箭立刻绑上。\n“舞动亮相”：CD大幅增加，但伤害提高，且范围改为[以苏蕊为中心的圆形区域](半径相比普通爪刀的攻击距离有所增加)。{苍蝇拍}范围和效果也随之改变。',
        detailedDescription:
          '苏蕊开始舞动，持续40秒。舞动开始时立刻回复50Hp，若手中有老鼠，则放下老鼠并使其自主跟随。舞动期间免疫敌方老鼠的绝大部分控制，以及冰块和鞭炮的控制，爪刀变为“舞动亮相”。舞动时每13秒出现爱心提示，持续3秒，[提示期间点击技能按钮](类似技能，处于交互、被控制等状态时无法点击；若提示期间未及时点击按钮则爱心提示破碎，不会获得增益效果)将回复30Hp、移速提高10%、攻击增伤提高15，爱心消失后开始冷却。舞动时接触虚弱老鼠（被{打开的老鼠夹}夹住的老鼠除外）或[刚被击倒的老鼠](包括刚进入知识卡铁血、表演者•杰瑞一级被动、佩克斯三级被动状态的老鼠)，将使其自主跟随30秒，在此状态下老鼠不受控制地跟随苏蕊，期间解除并免疫虚弱、无法使用技能和道具、无法自主移动和交互、无法对技能加点，但仍能受到伤害和[部分控制效果](不包含冰块、鞭炮、老鼠夹造成的控制)，且遇到火箭会[立刻绑上](会触发绑火箭-10秒的机制)。老鼠跟随期间与苏蕊距离较远时，会立即传送到苏蕊身边；但若[老鼠与苏蕊距离极远](通常仅在苏蕊因其它效果而传送时才会出现此情况，例如钻管道)，则老鼠会提前解除跟随。\n“舞动亮相”：与爪刀类似，但[CD改为{:specialClawKnifeCdUnhit}秒（未命中）和{:specialClawKnifeCdHit}秒（命中）](未命中CD本质上是命中CD返还一定百分比后的结果，对于苏蕊来说是返还50%；无视其他改变CD的效果（包括变身饮料改变基础CD的效果，及乘胜追击等百分比减少CD的效果）)，伤害变为{70*,可致伤}，范围改为[以苏蕊为中心的圆形区域](半径相比普通爪刀的攻击距离有所增加)，且{长爪}失效；如果携带了{乘胜追击}和{蓄势一击}且[造成了蓄势一击的伤害效果](若敌方受到蓄势伤害/亮相攻击伤害后就进入了虚弱状态，则不算作造成效果)，则会[在原本的基础上额外叠加一层乘胜效果](即使爪刀命中多名老鼠，也只会额外叠加一层)。{苍蝇拍}范围也随之改变，且直接抓起时的效果改为[使老鼠立刻自主跟随](包括触发三级被动后灵体状态的表演者•杰瑞)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 40,
          },
          {
            level: 2,
            description: '舞动时受到的伤害减少。',
            detailedDescription: '舞动时受到的伤害降低10。',
            cooldown: 40,
          },
          {
            level: 3,
            description: '每次成功点击爱心将延长舞动时间。',
            detailedDescription: '每次成功点击爱心将[延长舞动时间5秒](总舞动时间至多为60秒)。',
            cooldown: 40,
          },
        ],
        forecast: 0,
        aftercast: 0,
      },
      {
        name: '瑜伽球',
        type: 'weapon1',
        description:
          '扔出{瑜伽球(衍生物)}，落地后沿指定方向滑动。再次使用技能使其膨胀，膨胀的瞬间对周围的敌方造成伤害和{眩晕}，并弹飞对方。',
        detailedDescription:
          '扔出{瑜伽球(衍生物)}，同时技能进入读条，；瑜伽球落地后沿指定方向滑动，期间苏蕊可再次点击技能键使其膨胀，膨胀的瞬间对周围的敌方造成{30*,不受来源影响,可致伤}伤害和[一定时间](与技能等级有关)的{眩晕}，[眩晕期间对方会被弹飞](弹飞距离取决于眩晕时间)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['本技能键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '瑜伽球的眩晕持续时间为1.5秒。',
            cooldown: 20,
            charges: 2,
          },
          {
            level: 2,
            description: '',
            cooldown: 15,
            charges: 2,
          },
          {
            level: 3,
            description: '瑜伽球造成的眩晕持续时间提升。',
            detailedDescription: '瑜伽球造成的眩晕持续时间提升至2.5秒。',
            cooldown: 15,
            charges: 2,
          },
        ],
      },
      {
        name: '少女心',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '爪刀或舞动亮相命中敌方时将重置{武器技能}CD。',
            detailedDescription:
              '爪刀或舞动亮相命中敌方时将重置{武器技能}CD，击中多个敌方可重复触发该效果。',
          },
          {
            level: 2,
            description: '虚弱时间减少至2秒。',
            detailedDescription:
              '[虚弱时间减少至2秒](但通常起身时只有100Hp。这是因为虚弱本质上会附带高额Hp恢复，该恢复时间被减短了)。',
          },
          {
            level: 3,
            description:
              '[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)击中[目标](包括老鼠，虚弱老鼠，大鸭子NPC等)时将重置{主动技能}CD。',
            detailedDescription:
              '[易碎道具](玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块)击中[目标](包括老鼠，虚弱老鼠，大鸭子NPC等)时将减少{主动技能}100秒CD。',
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
    attackBoost: 15,
    hpRecovery: 3.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 8,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Angel Tom',
    catPositioningTags: [
      {
        tagName: '打架',
        isMinor: true,
        description: '伤害高应对高Hp老鼠，{2级被动}为打架提高霸体和回血。',
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
          '伤害高，很容易处理124Hp老鼠；{2级被动}提供霸体以及飞行吸火箭，上火箭能力较强。',
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
        description: '配合飞行爪刀眩晕补伤害。',
      },
      {
        name: '绝地反击',
        description: '用于前期过渡至2级被动，手绑能力提高。',
      },
    ],
    skills: [
      {
        name: '自由翱翔',
        type: 'active',
        aliases: [],
        description:
          '开始{飞行}，期间爪刀CD减少、并附带眩晕。\n在飞行时对虚弱的老鼠再次释放，可以吸引距离最近的一个火箭并将该老鼠直接绑到火箭上，同时提高燃烧速度25%。\n飞行过程中无法将老鼠抓到手中，当手中有老鼠时，飞行会导致老鼠掉落。',
        detailedDescription:
          '开始{飞行}，期间{完全失重}，水平方向基础速度变为1310/秒，竖直方向为600/秒，强制切换到摇杆操作，可以穿过部分平台，[爪刀CD更改](同类状态只能生效一个，因此该状态会被“变身饮料”效果覆盖)为2秒(未命中)/4秒(命中)、并附带1.1秒{眩晕}。\n飞行期间技能同步进入读条，可在身边有{虚弱}老鼠时再次使用技能，吸引以天使汤姆为中心、半径4350范围内最靠近的一个火箭到该老鼠位置，并将其直接绑到火箭上，使当次火箭燃烧速度提高25%，但没有绑老鼠减10秒的效果。（吸取动作前摇0.45秒，后摇0.45秒，可保持移动，可被转向打断，无法使用技能、道具；无法在周围没有[合适目标](包括虚弱老鼠或可吸取的火箭，其中缺少火箭会提示“范围内没有可吸取的火箭”)时释放；[可对正在钻管道的老鼠释放](火箭将生成在老鼠钻管道前消失的位置)；若前摇结束后范围内已没有虚弱老鼠则无效）\n飞行期间可以看到所有火箭位置，且靠近虚弱老鼠时会在小地图上出现特殊UI，用于指示可吸取火箭的范围。\n飞行过程中无法将老鼠抓到手中，当手中有老鼠时，飞行会导致老鼠掉落。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '移动键', '道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=127.35',
        skillLevels: [
          {
            level: 1,
            description: '飞行持续15秒，受到{眩晕}或虚弱后将解除飞行状态。',
            cooldown: 16,
            detailedDescription:
              '飞行持续15秒，受到{眩晕}（包括使用管道造成的眩晕）或{猫虚弱}后将解除飞行状态。',
          },
          {
            level: 2,
            description: '受到{眩晕}将不会解除飞行状态（眩晕时仍然可以上下飞行）。',
            cooldown: 16,
            detailedDescription: '受到{眩晕}将不会解除飞行状态（眩晕时仍然可以上下飞行）。',
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
          '吸引一定范围内的三个[指定类型的道具](玻璃杯/碗/盘子/扁盘/灰花瓶/香水瓶/冰块)，再次拖拽技能可以瞄准投掷出去，也可自动消耗道具抵挡一部分伤害。',
        detailedDescription:
          '吸引2500范围内最近的三个指定类型的道具在周围围绕，持续30秒，再次拖拽技能可以瞄准投掷出去，点按则自动瞄准并投掷。（动作前摇0.2秒，可移动，可被转向/跳跃打断，无法使用道具）\n受到伤害时，将自动消耗一个道具使受到的伤害降低20。\n被投掷的道具无视部分平台，但也无法触发{乾坤一掷}。\n\n可吸取道具包括：{玻璃杯}、{碗}、{盘子}、{扁盘}、{灰花瓶}、{香水瓶}、{冰块}。',
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
              '范围内道具不足时，会自行补充至三个。\n补充概率参考：玻璃杯/碗/盘子/扁盘50%，灰花瓶20%，冰块20%，香水瓶10%。',
          },
          {
            level: 3,
            description: '有道具围绕自身时，免疫{猫虚弱}。',
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
            detailedDescription: '投掷命中后获得弱霸体和50Hp/秒的恢复状态，持续3秒。',
          },
          {
            level: 3,
            description: '一定范围内有敌方投掷道具时，自身移速提高。',
            detailedDescription: '900范围内有敌方投掷道具时，自身移速提高20%，持续8秒。',
          },
        ],
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
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 780,
    jumpHeight: 420,
    clawKnifeCdHit: 4,
    clawKnifeCdUnhit: 3.1,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Syrus',
    catPositioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '{1级被动}和{2级被动}的加速使追击老鼠较为轻松。',
        additionalDescription: '',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description:
          '{主动技能}和{武器技能}均有伤害和控制，轻松击倒老鼠；{1级被动}的感电增强上火箭能力。',
        additionalDescription: '',
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '{3级武器}命中刷新CD，有一定翻盘能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '新手',
        pattern: '0101[02]221',
        weaponType: 'weapon1',
        description: '初步接触的加点，六级时如果血量健康可以优先点出{武器技能}。',
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
      {
        cards: ['S-乘胜追击', 'S-屈打成招', 'S-乾坤一掷', 'C-猫是液体'],
        description:
          '可以一定程度上反制减速，但是可能会牺牲放飞速度，建议有一定基本功再考虑带{屈打成招}，若不适应可换为{熊熊燃烧}。',
      },
    ],
    skills: [
      {
        name: '狂',
        type: 'active',
        aliases: ['牙通牙', '旋转'],
        description:
          '向前方连续挥爪3次，造成伤害；疾冲状态下，改为向前穿刺，造成伤害和{眩晕}，穿刺期间免疫控制。',
        detailedDescription:
          '常规：向前方连续挥爪3次，前摇分别为0.3、0.4、0.6秒，每次命中敌方均造成[一定伤害](与技能等级有关)，范围均为300。（无法在空中释放；技能期间无法移动、跳跃、交互、使用道具或其它技能）\n疾冲状态下或{武器技能}飞行中：[以1560的速度](在武器技能飞行期间释放时，自身被牵引速度不变)向前穿刺0.45秒，命中敌方造成{60*,不可致伤}伤害和1.8秒{眩晕}，穿刺期间免疫控制。（可以在空中释放；技能期间无法转向、跳跃、交互、使用道具或其它技能；技能判定范围较大，可以隔门造成伤害）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: '无后摇',
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description: '每次挥爪造成{30*,不可致伤}伤害。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '挥爪期间免疫控制。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '连续挥爪的伤害提升；穿刺攻击会将老鼠拉至终点位置。',
            detailedDescription:
              '每次挥爪改为造成{40*,不可致伤}伤害；穿刺攻击会将老鼠拉至终点位置。',
            cooldown: 12,
          },
        ],
        cueRange: '本房间可见',
        aftercast: 0,
      },
      {
        name: '猎',
        type: 'weapon1',
        description: '扔出{项坠}，随后斯飞向项坠飞去，对碰到的老鼠造成伤害和短暂{电击}眩晕。',
        detailedDescription:
          '扔出{项坠}，0.75秒后或项坠碰撞到地面/墙壁后，斯飞以3120的速度向项坠飞去，飞行期间对碰到的老鼠造成{50*,电击,不可致伤}伤害和0.6秒{电击}眩晕（对{电免疫}期间的目标照常造成伤害和电击，但不触发{感电}）。释放瞬间如果角色方向改变，将同时改变项坠方向。技能判定范围较大，可以隔门造成伤害。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        canHitInPipe: true,
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
        forecast: 0.45,
      },
      {
        name: '迅',
        type: 'passive',
        description:
          '斯飞能进入“疾冲”姿态，该姿态下获得“迅捷”状态。\n“疾冲”姿态： 触碰到老鼠时对其造成[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)和0.6秒{电击}眩晕（同目标有内置CD）；爪刀强化为扑击；{主动技能}变为穿刺攻击。使用爪刀、施放技能或移速降到[一定阈值](约为正常疾冲速度75%)以下后将退出疾冲姿态。\n“迅捷”状态：获得加速，无视{碎片}、{反向}、{失明}、烫伤、{感电}、{打开的老鼠夹}。',
        detailedDescription:
          '斯飞能进入“疾冲”姿态，该姿态下获得“迅捷”状态。\n“疾冲”姿态： 触碰到老鼠时对其造成{10*,电击,不受来源影响,不可致伤}伤害和0.6秒{电击}眩晕（对{电免疫}期间的目标照常造成伤害和电击，但不触发{感电}），同目标10秒内不会重复触发；爪刀强化为以2000速度向前扑击0.15秒；{主动技能}变为穿刺攻击。使用爪刀、施放技能或移速降到[一定阈值](约为正常疾冲速度75%)以下0.5秒后将退出疾冲姿态。\n“迅捷”状态：获得加速，无视{碎片}、[部分](包括魔术师的黄牌，拿坡里的足球，玛丽的扇子与反向；不包括侦探泰菲的两种分身){反向}及{失明}状态、烫伤、{感电}、{打开的老鼠夹}。（获得迅捷状态不会同时清除身上负面状态）',
        skillLevels: [
          {
            level: 1,
            description:
              '斯飞以[一定移速](约基础速度90%)奔跑1.5秒后进入疾冲姿态。退出疾冲姿态时也会失去迅捷状态。',
          },
          {
            level: 2,
            description:
              '退出疾冲姿态后，迅捷状态继续保持10秒；迅捷状态额外提升[部分交互速度](绑火箭，放置老鼠夹等)。',
            detailedDescription:
              '退出疾冲姿态后，迅捷状态继续保持10秒；迅捷状态额外提升[部分交互速度](绑火箭，放置老鼠夹等)65%。',
          },
          {
            level: 3,
            description: '迅捷状态额外持续恢复Hp，退出疾冲状态的速度阈值降低。',
            detailedDescription:
              '迅捷状态额外获得30Hp/秒的恢复；退出疾冲状态的速度阈值降低至正常疾冲速度的70%。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
      {
        name: '急速翻滚',
        description: '进一步提高速度与机动性。',
      },
    ],
  },
  /* ----------------------------------- 恶魔汤姆 ----------------------------------- */
  恶魔汤姆: {
    description:
      '恶魔汤姆驾驶着列车从深渊呼啸而来。他通体火红，脑袋上有一对略显狡黠的小触角，手持三叉戟的他一直鼓动着汤姆在老鼠面前找回场子。狡黠的恶魔汤姆身边还有一群忠诚的仆从，他们会不遗余力地完成主人的任何指令。',
    maxHp: 200,
    attackBoost: 0,
    hpRecovery: 1.5,
    moveSpeed: 760,
    jumpHeight: 420,
    clawKnifeCdHit: 6,
    clawKnifeCdUnhit: 3,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Devil Tom',
    catPositioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '列车可用于守奶酪和火箭，并且列车可以为恶魔汤姆提供护盾效果。',
        additionalDescription: '',
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
          '（恶魔汤姆于20260402有一次改版，本加点可能已过时）三级火车技能真空期比二级火车真空期长，视情况考虑是否留点，不需要时可先跳过该加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-知识渊博', 'S-乘胜追击', 'A-熊熊燃烧', 'C-猫是液体'],
        description: '管道图。',
        contributor: 'shuxiao',
      },
      {
        cards: ['B-皮糙肉厚', 'S-知识渊博', 'A-穷追猛打', 'A-熊熊燃烧'],
        description: '打架队。',
        contributor: 'shuxiao',
      },
      {
        cards: ['S-知识渊博', 'A-加大火力', 'A-细心', 'B-皮糙肉厚', 'B-捕鼠夹'],
        description: '死守。',
        contributor: 'shuxiao',
      },
      {
        id: '旧卡组',
        description: '恶魔汤姆在20260402有一次大幅度改版，这些卡组为改版前的推荐卡组。',
        groups: [
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'A-加大火力'],
            description: '御门酒店使用，对面高伤阵容换成越挫。',
            contributor: 'wudimaohudawang',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'A-穷追猛打'],
            description: '常规地图使用。',
            contributor: 'wudimaohudawang',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'A-越挫越勇', 'A-穷追猛打'],
            description: '常规地图，对面高伤阵容时使用。',
            contributor: 'wudimaohudawang',
          },
          {
            cards: ['S-击晕', 'A-熊熊燃烧', 'B-皮糙肉厚', 'C-猫是液体', 'C-狡诈'],
            description: '森林牧场使用，对面高伤阵容则把皮糙换成越挫。',
            contributor: 'wudimaohudawang',
          },
          {
            cards: ['S-击晕', 'A-加大火力', 'A-越挫越勇', 'A-穷追猛打'],
            description: '19费常规卡组，穷追开节奏。',
          },
        ],
        defaultFolded: true,
      },
    ],
    specialSkills: [
      {
        name: '全垒打',
        description: '全垒打可以提供额外的攻击力加成和移速加成。',
      },
      {
        name: '绝地反击',
        description: '绝地反击可以提高恶魔汤姆对控制效果的容错。',
      },
    ],
    skills: [
      {
        name: '狂欢时刻',
        type: 'active',
        aliases: ['打碟'],
        description:
          '开始狂欢，移速增加、免疫部分控制状态（不包括虚弱），持续9.9秒。技能期间对附近的敌方持续造成伤害和减速。恶魔汤姆头顶会依次出现2条舞步指令（向左移动/向右移动/跳跃），正确执行全部指令会随机获得{护盾}/恢复/{增伤}状态中的一种，并强化{武器技能}。',
        detailedDescription:
          '开始狂欢，移速增加11%、免疫[部分控制状态](包括眩晕、仙女鼠八星的变身，但不包括虚弱、减速、反向、尼宝鱼钩拽取等。技能期间被莱恩变身为线条猫时，技能不中断)，持续9.9秒。技能期间，自身350范围内的敌方进入“被迫狂欢”状态（可被{护盾}免疫），移速降低15%、每秒受到[一定伤害](与技能等级有关)，[持续到狂欢结束或离开该范围](该状态本身也有9.9秒的持续时间，等同于狂欢持续时间，因此通常无意义)。\n\n狂欢进行到第2秒时，恶魔汤姆会获得一条舞步指令（向左移动/向右移动/跳跃），正确执行该指令后会在2秒后再次获得一条指令，全部执行正确后会随机获得持续7.9秒的增益状态（从以下三项中抽取一个：1层{护盾}；回复80Hp并获得9Hp/秒的恢复状态，总计回复152Hp；25{增伤}），同时获得持续19.9秒的“列车狂欢”状态（期间{武器技能}会一次性召唤2条{轨道}&{列车}）。\n舞步指令出现前有2秒预警期，期间角色头顶会出现黄色感叹号。每条指令有2秒执行期，期间未执行/执行错误指令均会判定为失败。角色“保持移动”不会视作执行指令，而“开始移动”、“转向”、“跳跃”会被视作执行指令。{反向}期间，指令以角色实际移动方向为判定标准（例如“向左移动”指令需角色向左移动，实际为按向右移动键）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '每次造成{5*,不受来源影响,不可致伤}伤害。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '持续伤害提升。',
            detailedDescription: '改为每次造成{8*,不受来源影响,不可致伤}伤害。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '',
            detailedDescription: '',
            cooldown: 20,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '迷乱列车',
        type: 'weapon1',
        description:
          '在指定位置生成{轨道}，随后会有{列车}沿轨道冲撞，对被撞击的敌方施加伤害，眩晕和击退效果，同一目标短时间内被列车命中两次后会受到{易伤}状态（期间不会重复获得）。\n被{主动技能}强化期间，本技能会一次性召唤2条轨道&列车。',
        detailedDescription:
          '[在自身650范围内选取一个位置](点按技能键为自身位置，拖动技能键则为指定位置；实际释放位置会根据前摇后自身的位置发生相对变化)生成{轨道}，轨道需0.9秒完全生成，会向恶魔汤姆面朝方向伸展，角度在水平、水平偏斜上/斜下27°三者内随机；轨道开始生成的第0.3秒时召唤{列车}，沿轨道进行持续0.95秒的冲撞，对被撞击的敌方造成{45*,不受来源影响,不可致伤}伤害、1秒{眩晕}及[小幅度](具体距离取决于眩晕时间，方向取决于列车撞击方向){击退}，同一目标在眩晕期间不会重复被命中、短时间内被列车命中两次后额外获得使受到的伤害提高50的{易伤}状态，持续8秒（持续期间不会再次获得，对当次伤害不生效）。\n“列车狂欢”期间，本技能会一次性召唤2条角度不相同的轨道&列车。\n技能动作不会被跳跃中断；期间可以使用爪刀攻击；可以拾取道具/饮用饮料但会使技能失效（仍执行完整技能动作，不消耗储存次数）。\n\n列车的贴图长度约1200，但实际伤害判定范围略小于贴图范围；列车的实际有效冲击范围约为从技能释放处始，向两侧各延伸3000；轨道的贴图中点与技能释放位置并不重合；列车贴图相较于轨道贴图偏上，且冲撞起始端会超出轨道贴图一段距离。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        forecast: 0.6,
        cancelableSkill: ['本技能键', '药水键'],
        aftercast: 0.15,
        cancelableAftercast: ['本技能键', '药水键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
            charges: 3,
            detailedDescription: '',
          },
          {
            level: 2,
            description:
              '释放列车成功后给予自身一层{护盾}，持续5秒。列车经过恶魔汤姆时会刷新该护盾。',
            cooldown: 8,
            charges: 3,
          },
          {
            level: 3,
            description: '',
            cooldown: 8,
            charges: 5,
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
            description: '恶魔汤姆对处于部分异常状态的敌人造成的伤害提高，可叠加。',
            detailedDescription:
              '恶魔汤姆对处于{眩晕}、{冰冻}、{爆炸}、{反向}、{失明}、{感电}、“被迫狂欢”（详见{主动技能}）状态下的敌人造成的伤害额外提高5，可叠加。（注意：伤害提高效果仅作用于会被{增伤}影响的伤害）',
          },
          {
            level: 2,
            description:
              '每隔一段时间对周围敌方造成{反向}或{失明}，每第3次触发该效果时改为{冰冻}眩晕或{爆炸}眩晕；随后将该状态扩散给敌方周围的队友。',
            detailedDescription:
              '每隔5秒进行一次判定：若自身附近500范围内存在敌方，则对该范围内所有敌方随机造成3秒{反向}或3秒{失明}，每第3次触发该效果时改为造成{1*,不受来源影响,不可致伤}伤害以及2.3秒{冰冻}眩晕或2.1秒{爆炸}眩晕；随后会使所有目标各自250范围内的队友也受到相同状态。\n本技能效果会被大部分护盾免疫和抵消。',
          },
          {
            level: 3,
            description: '{2级被动}触发时，自身根据周围陷入异常状态的敌方数量获得额外增益。',
            detailedDescription:
              '{2级被动}触发时，自身根据周围陷入异常状态的敌方数量获得额外增益，持续5秒：\n1个及以上：加速20%，获得2.5Hp/秒的恢复状态；\n2个及以上：视野范围提高至原先的约3.58倍；\n3个及以上：获得一层护盾；\n4个及以上：获得100{增伤}。',
          },
        ],
        description:
          '恶魔汤姆绑火箭拥有特殊机制：第一段为[恶魔汤姆对其仆从小恶魔施加指令](可被道具键打断)，约1.2秒，第二段为小恶魔将老鼠绑上火箭，约1.7秒，期间老鼠[脱离恶魔汤姆本体](不会因恶魔汤姆眩晕或挣扎进度条充满而挣脱，但如果火箭在此期间被毁则不会被绑上，且恶魔汤姆在此期间无法抓取其他老鼠)。',
        detailedDescription:
          '恶魔汤姆绑火箭拥有特殊机制：第一段为[恶魔汤姆对其仆从小恶魔施加指令](可被道具键打断)，约1.2秒，第二段为小恶魔将老鼠绑上火箭，约1.7秒，期间老鼠[脱离恶魔汤姆本体](不会因恶魔汤姆眩晕或挣扎进度条充满而挣脱，但如果火箭在此期间被毁则不会被绑上，且恶魔汤姆在此期间无法抓取其他老鼠)。',
      },
    ],

    aliases: ['恶汤', '红薯'],
  },
  /* ----------------------------------- 兔八哥 ----------------------------------- */
  兔八哥: {
    description:
      '身为一只疯狂又理智的免子，免八哥在每个紧要关头都能凭借自己的勇气和智慧战胜对手，获得胜利。闲暇之余的他，一边啃着造型和口味都堪称完美的胡萝卜，一边到处挖洞为自己寻找满意的小窝。',
    maxHp: 200,
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 800,
    jumpHeight: 420,
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 2.5,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Bugs Bunny',
    catPositioningTags: [
      {
        tagName: '后期',
        isMinor: true,
        description: '9级时拥有三级洞和三级萝卜，冷却短爆发强续航强所以兔子后期较为强势。',
        additionalDescription: '',
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '三级洞或者三级萝卜的防守能力较强',
        additionalDescription: '现版本防守能力不错但还是有角色可以克制。',
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '不管是洞还是萝卜打架、续航能力都很强',
        additionalDescription: '你知道这意味着宣战！',
      },
    ],
    skillAllocations: [
      {
        id: '主点萝卜',
        pattern: '200122011',
        weaponType: 'weapon1',
        description: '兔子现在主流加点之一，什么卡组都可使用',
      },
      {
        id: '主点钻地',
        pattern: '200111220',
        weaponType: 'weapon1',
        description:
          '兔子主流加点之一，可以无脑拿也可看情况拿，但在对面打架能力强时非常推荐使用，当对面前期就爱打架可以5级点二级洞6级点三级洞。不过在对面有霜月加蒙金奇或者卡组是776时不推荐使用。',
      },
      {
        id: '主点被动',
        pattern: '200102211',
        weaponType: 'weapon1',
        description: '推荐搭配 击晕+乘胜追击+熊熊燃烧 卡组使用。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-反侦察'],
        description: '无21点知识量时的卡组。',
      },
      {
        cards: ['S-击晕', 'A-加大火力', 'C-猫是液体', 'A-细心', 'B-捕鼠夹'],
        description: '推荐在森林牧场使用。有21后可以把捕鼠夹换成心灵手巧。',
      },
      {
        cards: ['A-熊熊燃烧', 'S-乘胜追击', 'S-击晕'],
        description: '仅推荐在御门酒店使用。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'A-心灵手巧'],
        description: '在御门酒店或者阵容与地图都好找节奏时可使用。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-加大火力', 'A-穷追猛打'],
        description: '对面拦截能力不强时使用。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-心灵手巧', 'A-穷追猛打'],
        description: '对面拦截能力强时使用。',
      },
      {
        cards: ['S-击晕', 'A-加大火力', 'A-细心', 'A-穷追猛打', 'C-猫是液体'],
        description: '古堡3的卡组（经典之家也可酌情使用）。',
      },
    ],
    /*旧卡组：{
        cards: ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
        description: '经典的776卡组。',
      },
      {
        cards: ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'A-细心'],
        description: '21知识量卡组。{细心}可根据需要换为{加大火力}或{心灵手巧}。',
      },
      {
        cards: ['S-击晕', 'A-加大火力', 'A-穷追猛打', 'A-细心', 'C-猫是液体'],
        description: '带{猫是液体}的21知识量卡组。',
      },
      {
        cards: ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
        description: '适合管道较多的图。',
      },
      {
        cards: ['S-乘胜追击', 'S-击晕', 'A-加大火力', 'C-猫是液体'],
        description: '适合森林牧场。',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
        description: '打100Hp的老鼠多且控制较差的阵容。',
      },*/
    specialSkills: [
      {
        name: '绝地反击',
        description: '弥补缺霸体的短板。',
      },
      {
        name: '蓄力重击',
        description: '对面有魔术师时可以酌情使用',
      },
    ],
    skills: [
      {
        name: '狡兔三窟',
        type: 'active',
        aliases: ['钻地'],
        description:
          '兔八哥[尝试钻入地面](若所处平面空间不足将无法钻地，改为在原地留下2个洞穴，技能仍然进入读条，但同时也直接进入CD)，原地留下{洞穴}并在地下行进（可穿越{木门}），期间持续恢复Hp，碰撞敌方造成伤害及{眩晕}和{击飞}但减少钻地时间，时间结束或再次使用技能时钻出，移速增加且原地留下{洞穴}。敌方触碰洞穴会受到伤害和{眩晕}，随后洞穴消失。地下行进期间有概率全程{反向}。“胜利”状态可增加地下行进时间和降低迷路概率。',
        detailedDescription:
          '兔八哥跳起并尝试钻入地面。使用技能后，[若技能不在读条期间](读条与冷却互相独立。本技能可能因“未成功钻地/在钻地期间因受力而意外中止”而出现“技能未使用但已在读条”的情况)，则进入(10+“胜利”状态层数×5)秒读条；读条结束时，[若技能不在冷却期间](读条与冷却互相独立。本技能可能因 未成功钻地/在钻地期间因受力而意外中止 而出现“技能同时在冷却和读条”的情况)，则会进入CD。\n钻地：原地留下一个{洞穴}；立即清除{隐身}；若自身处于水平平台/地面上，且不位于边缘，则开始在所处平台/地面进行“地下行进”，反之则跳过行进过程立即“钻出”。\n地下行进：行进开始时，有(20%-“胜利”状态层数×4%)的概率进入{反向}，持续至本次行进结束；行进期间，自身模型暂时被替换为“地洞”贴图，隐藏昵称和Hp条，不会受到伤害，不会被大多数道具/技能命中，但仍会被受力类效果影响且会中断行进；行进时速度固定且额外持续恢复Hp（数值与技能等级有关），但只能在[所处平台/地面的范围内](可活动范围与边缘存在一定距离，行进期间无法过于靠近边缘，会被阻挡)左右移动，可穿越关闭的{木门}，可正常购买道具、可使用“胡萝卜飞镖”与“美味胡萝卜”（详见{武器技能}），无法进行跳跃、交互，无法使用道具、饮料、“巨大胡萝卜”（详见{武器技能}）；行进过程中每隔1秒进行一次判定，对此时自身接触的所有敌方造成{25*,不受来源影响,不可致伤}伤害、0.7秒{击飞}和1.5秒{眩晕}，同目标3秒内只触发一次，每成功攻击到一个敌方就使技能读条减少3秒；技能读条结束时/再次使用技能时/被受力效果影响时，钻出地面。\n钻出：原地留下一个{洞穴}；移速增加15%，持续9.9秒；技能立即进入CD（[不会主动中止读条](因“读条结束/再次使用技能”而钻出时，会自然中止读条；而因“未成功钻地/在钻地期间因受力而意外中止”导致钻出时，就可能出现“技能未使用但已在读条”或“技能同时在冷却和读条”的情况)）。\n洞穴：持续11.5秒（出现的第1秒没有贴图），敌方触碰洞穴时会受到{25*,不受来源影响,不可致伤}伤害和1.5秒{眩晕}，随后洞穴消失。\n\n部分可影响“钻地”状态的受力效果列举：{小鞭炮}、{鞭炮束}、{比萨斜塔(技能)}、{2级滑步踢}。', //原描述：“再次使用技能会提前钻出地面，若上方有老鼠将造成40伤害”。未测到该伤害，暂时移除相关描述。
        forecast: 0.5,
        aftercast: 1,
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '钻地行进速度固定为800，每秒额外恢复10Hp。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '钻出后，获得{减伤}且绑火箭速度提高。',
            detailedDescription:
              '从洞中钻出后，受到的伤害减少50%、[绑火箭速度提高55%](1.75秒→1.13秒)，持续10秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '钻地行进速度更快，持续恢复更多Hp。',
            detailedDescription: '钻地行进速度提高至1120，改为每秒额外恢复20Hp。',
            cooldown: 10,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '胡萝卜',
        type: 'weapon1',
        description:
          '从三种形态的胡萝卜中选择一种，其效果和CD各不相同。\n\n[1.胡萝卜飞镖](可移动释放，可空中释放，前摇可被道具键打断，后摇为动画后摇)\n可连续释放3次。投掷{胡萝卜飞镖(衍生物)}造成伤害并减速，并自动锁定附近的宣战目标发射额外的{胡萝卜飞镖-追踪}，可消耗1层“胜利”额外投掷1根普通飞镖。\n\n[2.美味胡萝卜](可移动释放，可空中释放，前摇可被药水键、本技能键、其他技能键、捡起道具、使用有使用过程的道具打断，不可取消后摇)\n拿出胡萝卜吃掉，回复一定Hp，并获得恢复和加速，可消耗1层“胜利”提高回复量并获得{增伤}，且减少{主动技能}的CD。\n\n[3.巨型胡萝卜](不可移动释放，不可空中释放，前摇可被道具键打断，不可取消后摇)\n将{巨型胡萝卜(衍生物)}插入地面，造成范围伤害和{眩晕}，随后降低附近老鼠移速和推奶酪速度且阻碍奶酪推进，老鼠可通过交互吃掉巨型胡萝卜。可消耗1层“胜利”提高伤害并将奶酪冲出洞口（最后一块奶酪只能被冲出一次）。',
        detailedDescription:
          '兔八哥可以通过轮盘选择不同的胡萝卜（默认为“胡萝卜飞镖”），每种胡萝卜的效果和CD各不相同，使用任意胡萝卜将[统一进入该胡萝卜的CD](该技能在进入时的CD数值固定为对应胡萝卜的数值，不会受到更改CD的效果影响，但CD期间仍可受到加快/减慢CD的效果影响)。\n\n1.胡萝卜飞镖\n特性：可移动释放，可空中释放；前摇0.35秒、可被道具键打断；后摇0.2秒、不影响行动。[该技能可连续释放3次](只有释放最后一次时才会进入胡萝卜飞镖的CD，每次冷却完毕后会将飞镖数补至3发)。\n作用：选中自身前方90°范围内的一个方向，投掷{胡萝卜飞镖(衍生物)}，并自动锁定自身半径10000范围内的每个宣战目标发射一枚额外的{胡萝卜飞镖-追踪}。普通胡萝卜飞镖飞行速度2000/秒，可穿墙，命中目标造成{40*,不受来源影响,可致伤}伤害并使其移速降低20%，持续2.6秒；追踪胡萝卜飞镖飞行速度1750/秒，不受重力影响，当目标不与飞行轨迹处于同一直线时，会以100°/秒的速度绕半径350的圆弧调整飞行方向，可穿墙，追击3秒后消失，命中造成{40*,不受来源影响,不可致伤}伤害。存在“胜利”时消耗1层并在0.65秒后向同一方向再投掷1根普通胡萝卜飞镖。\n\n2.美味胡萝卜\n特性：可移动释放，可空中释放；前摇0.5秒、可被药水键、本技能键、其他技能键、捡起道具、使用(有使用过程的)道具打断；后摇0.25秒、不可主动取消。\n作用：拿出胡萝卜吃掉，回复100Hp，获得4Hp/秒的恢复且移速提升20%，持续10秒。存在“胜利”时自动消耗1层，额外回复20Hp并减少狡免三窟剩余CD的20%，后续恢复期间额外获得15{增伤}。\n\n3.巨型胡萝卜\n特性：不可移动释放，不可空中释放；前摇0.35秒、可被道具键打断；后摇0.2秒、不可主动取消。\n作用：在前方放置{巨型胡萝卜(衍生物)}，巨型胡萝卜存在9秒，生成时对命中的敌方造成{25*,不受来源影响,不可致伤}伤害和1.6秒{眩晕}，以巨型胡萝卜为中心周围450×350范围内的敌方移速降低10%，推速降低15%，在洞口附近时[敌方无法进行推奶酪交互](会提示"有物体遮挡"；已经在进行的推奶酪交互不会中断)，老鼠可以通过交互吃掉巨型胡萝卜，吃掉巨型胡萝卜共需2秒。存在“胜利”时，将消耗1层状态[额外](与原伤害分为不同的两段，且后于原伤害结算)造成{50*,不受来源影响,不可致伤}伤害并[将奶酪冲出洞口](将已丢入洞口但暂未推入的奶酪以固定角度和初速度弹出，但会保留该洞口的推入进度)（最后一块奶酪只能被冲出一次）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        // cancelableAftercast: '无后摇', // FIXME
        forecast: 0.35,
        aftercast: 0.2,
        skillLevels: [
          {
            level: 1,
            description: '初始CD：\n胡萝卜飞镖：15秒；\n美味胡萝卜：12秒；\n巨型胡萝卜：20秒。',
            cooldown: 0,
          },
          {
            level: 2,
            description: 'CD缩短至：\n胡萝卜飞镖：10秒；\n美味胡萝卜：8秒；\n巨型胡萝卜：15秒。',
            cooldown: 0,
          },
          {
            level: 3,
            description:
              '追加新的效果：\n胡萝卜飞镖：消耗“胜利”时投掷数量提升1个。\n美味胡萝卜：食用后增加交互速度并重置爪刀CD。\n巨型胡萝卜：减少奶酪进度，但不会低于0。',
            cooldown: 0,
            detailedDescription:
              '追加新的效果：\n胡萝卜飞镖：消耗“胜利”时在投掷第二个胡萝卜飞镖0.5秒后向同一方向再投掷1根胡萝卜飞镖。\n美味胡萝卜：食用后增加交互速度50%，持续10秒，重置爪刀CD。\n巨型胡萝卜：减少奶酪现有进度的10%，但不会低于0。',
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '我，兔八哥',
        type: 'passive',
        description:
          '兔八哥可在特定条件下对敌方施加“宣战”状态，或使自身获得“胜利”状态。\n["宣战"](可被护盾免疫，不消耗层数)：使目标{暴露位置}，持续10秒；附近有宣战目标时，自身移速提高，解除并免疫{反向}和{失明}；目标在状态期间虚弱时，自身获得3层“胜利”；持续期间无法再次宣战。\n"胜利"：提升Hp上跟，可叠加5层，在虚弱后失去一半层数。"胜利"还能强化其他技能。',
        detailedDescription:
          '兔八哥可在特定条件下对敌方施加“宣战”状态，或使自身获得“胜利”状态。\n["宣战"](可被护盾免疫，不消耗层数)：使目标{暴露位置}，持续10秒；以兔八哥自身为中心1300×250范围内有被宣战的目标时，自身移速提高22%，解除并免疫部分{反向}和{失明}状态（特效与效果和{牛奶}类似，但并无Hp恢复）；目标在"宣战"持续期间[进入虚弱](某些免死效果实际为先进入虚弱后解除并触发效果（例如知识卡-铁血本质是解除虚弱并在数秒后再度虚弱），这类效果触发时有可能会多次触发获得“胜利”的效果（例如击倒被宣战的有铁血的老鼠将获得3×2层“胜利”状态）)时，自身会获得3层“胜利”状态；“宣战”状态持续期间不会再次被宣战。\n"胜利"：每层“胜利”状态将提升20Hp上跟，最多叠加5层，在虚弱后失去一半层数（向上取整）。"胜利"还能强化其他技能。\n\n本技能在未加点时，兔八哥通过技能对敌方造成伤害也会对其“宣战”，但只有加点后才能触发该宣战的相关效果（包括暴露视野、靠近加速、击倒获得“胜利”等）。',
        skillLevels: [
          {
            level: 1,
            description: '兔八哥通过技能对敌方造成伤害，或受到来自敌方的伤害时，对其"宣战"。',
          },
          {
            level: 2,
            description:
              '每隔一段时间，兔八哥[完全闪避](使该投掷物接触自身碰撞箱时视作未接触，继续进行飞行；离开自身碰撞箱后恢复正常判定)下一次[投掷攻击](无法免疫知识卡和技能附带异常状态)。闪避成功获得一层“胜利”状态。',
            detailedDescription:
              '每隔12秒，兔八哥[完全闪避](使该投掷物接触自身碰撞箱时视作未接触，继续进行飞行；离开自身碰撞箱后恢复正常判定)下一次[投掷攻击](无法免疫知识卡和技能附带异常状态)。闪避成功获得一层“胜利”状态，闪避不会打断交互，自身眩晕时也可触发闪避效果。\n能闪避的道具：除{电风扇}/{小鞭炮}/{鞭炮束}外的所有投掷道具；{果子}、{子弹}，{激光}，{鸟哨鞭炮}，{金币(衍生物)}，{火箭炮}，{红色卡牌}，{黄色卡牌}，{蓝色卡牌}，{战矛}，{小电球}、{大电球}、{电池}，{乾坤袋-投射物(衍生物)}，{定身符}、{金币符}，{蓝图-投射物(衍生物)}。\n通常误认为能闪避实则不能的道具：{长枪}，{弓箭}/{蓄力箭}，{闪耀足球}，{剑气}，{星星}。',
          },
          {
            level: 3,
            description:
              '免八哥会观察附近的目标，观察3秒后根据其当前状态造成不同效果，至少满足一项时额外对其"宣战"：\n1.在推奶酪：降低推速；\n2.手持道具：掉落并禁用道具；\n3.在移动：降低移速。\n\n可同时生效，观察同一目标有内置CD。',
            detailedDescription:
              '免八哥会观察以自身为中心，长1700宽250的矩形范围内的目标，[累计观察3秒后](在观察期间敌方离开判定范围，倒计时将会暂停，若离开5秒后还未重新进入判定范围，则本次观察被打断，可立刻进行下一次观察)会对其“问候”，根据目标当前状态造成不同效果，若满足至少一项则同时会对目标“宣战”：\n目标在推奶酪：推速降低15%，持续5秒；\n目标有手持道具：掉落手中道具，并禁用道具键5秒；\n目标在移动中：移速降低15%，持续5秒。\n\n满足多种情况时同时生效，同一目标被“问候”后15秒内不会再次被观察。',
          },
        ],
      },
    ],

    aliases: ['兔子', '兔bug'],
  },

  /* ----------------------------------- 追风汤姆 ----------------------------------- */
  追风汤姆: {
    description:
      '因为一场神秘的实验意外而降落于猫鼠五周年特别纪念展的不速之客，天生充满了对蓝天的向往，热爱钻研新奇的发明，脑袋里充满稀奇古怪的创意，立志成为猫咪界第一位飞行员，在汤姆和杰瑞的陪伴下被纪念展的内容所打动，来到这里继续进行新的创意发明。',
    maxHp: 240,
    attackBoost: 0,
    hpRecovery: 1,
    moveSpeed: 800,
    jumpHeight: 420,
    clawKnifeCdHit: 7,
    clawKnifeCdUnhit: 3.85,
    clawKnifeRange: 300,
    gender: 'male',
    EnglishName: 'Wind Chaser Tom',
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
          '守火箭能力强，风的范围大，易命中并击退前来救援的老鼠，且CD短；飞行时自身的碰撞箱可以打断老鼠跳救使其踩夹。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '最优',
        pattern: '212000211',
        weaponType: 'weapon1',
        description:
          '先点出2级武器，提高守火箭能力；3级被动提高容错和赶路能力；3级武器增加的伤害可以稍微削减不屈增加的血量带来的反制能力',
      },
      {
        id: '适合萌新',
        pattern: '122112000',
        weaponType: 'weapon1',
        description:
          '点出2级武器之后，点出3级俯冲。俯冲的自动索敌对萌新比较友好，而且3级时减少CD，大大提高容错率。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-蓄势一击', 'S-屈打成招', 'A-熊熊燃烧', 'C-猫是液体'],
        description:
          '上限极高。{屈打成招}用于拦截救人和换绑进行拉扯，不怕隐身救援，找节奏能力很强，管道图效果更佳。缺点是续航较差，容错率极低，对熟练度要求很高。',
        contributor: 'rumengif',
      },
      {
        cards: [[CardGroupType.Or, 'S-击晕', 'S-蓄势一击'], 'A-熊熊燃烧', 'A-细心', 'B-皮糙肉厚'],
        description:
          '有{击晕}{蓄势一击}两个变种，下限较高。开局提前布局放夹子，可以有效克制{幸运}，同时提高守火箭能力。对面选出多个破夹能力强的角色时慎用。',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'B-皮糙肉厚'],
        description: '适用地图和阵容最广，万金油卡组，上限也不错。但不推荐在牧场、酒店图带。',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'C-猫是液体', 'C-狡诈'],
        description:
          '牧场、酒店图推荐带这套。一直采花可以弥补移速和续航的不足(亦可将{加大火力}替换为{细心}，对面有高伤或角色莱恩则换为{皮糙肉厚})。管道较多的图也适合。若有21知识点，可将{狡诈}换为{攻其不备}或{捕鼠夹}。',
      },
      {
        cards: ['S-蓄势一击', 'A-熊熊燃烧', 'A-加大火力', 'A-穷追猛打'],
        description: '推荐在游乐场及部分非管道大图带，方便开节奏保下限，面对打架队慎用。',
      },
    ],

    specialSkills: [
      {
        name: '绝地反击',
        description: '适用于一般情况，用于残血强绑。',
      },
      {
        name: '蓄力重击',
        description:
          '推荐在对面选出魔术师时带，用于秒杀兔子大表哥，防止因为缺伤害导致处理不了兔子举秒飞而无法及时减员。',
      },
      {
        name: '应急治疗',
        description: '推荐新手带，保下限。',
      },
    ],
    skills: [
      {
        name: '战术机动',
        type: 'active',
        description: 'Lv.0: 仅处于空中时才可释放。进入{飞行}状态。',
        detailedDescription:
          'Lv.0: 仅处于空中时才可释放。进入{飞行}状态，移动方式强制切换为[摇杆操作](仅支持四向移动：左上、右上、左下、右下)。“进入飞行状态”无cd，但飞行状态下无法俯冲。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        aliases: ['冲刺', '俯冲'],
        cueRange: '本房间可见',
        skillLevels: [
          {
            level: 1,
            description:
              '解锁俯冲技能。飞行时点击技能可向正前方俯冲、拖动技能可向斜前方俯冲，对碰到的敌方造成短暂{眩晕}和伤害。长按技能可蓄力，略微提升俯冲效果和距离。',
            cooldown: 8,
            detailedDescription:
              '解锁俯冲技能。飞行时点击技能可向正前方俯冲，拖动技能可向斜前方俯冲，瞄准范围为自身正前方至正下方的90度角，附近有老鼠则会自动瞄向附近的老鼠俯冲。俯冲速度2000；长按技能可蓄力，期间水平移速降至550且不可转向，可点击道具键停止蓄力并保存蓄力效果。点击/蓄力0.5～1秒/蓄力1秒以上，冲刺时间为0.45/0.6/0.75秒，命中老鼠造成0.8秒{眩晕}和{35*,固定,不可致伤}/{37.5*,固定,不可致伤}/{40*,固定,不可致伤}伤害。俯冲期间可使用爪刀、技能和取消飞行。',
          },
          {
            level: 2,
            description: '提高蓄力期间的移速。',
            cooldown: 8,
            detailedDescription: '蓄力期间水平移速提升至850。',
          },
          {
            level: 3,
            description: '略微增加蓄力提升的伤害和{眩晕}时间',
            cooldown: 5,
            detailedDescription:
              '点击/蓄力0.5～1.0秒/蓄力1秒以上，伤害提升至{35*,固定,不可致伤}/{40*,固定,不可致伤}/{45*,固定,不可致伤}，{眩晕}时间提升至0.8/0.9/1.1秒',
          },
        ],
        videoUrl: 'https://b23.tv/LoKzcZf',
        forecast: 0,
        aftercast: 0,
      },
      {
        name: '追风双翼',
        type: 'weapon1',
        description:
          '未处于飞行状态时，向前释放{飓风}，对敌方造成伤害和{击退}。击退期间对触碰到的[敌方单位](过去版本曾经也会对追风汤姆本身造成伤害，现已修复)造成伤害和{眩晕}。\n处于飞行状态时，向正下方扔出{铁砧}，砸中敌方造成伤害和{眩晕}。\n当手中有老鼠时，会同时扔出老鼠并自动绑上碰到的火箭，但会被其他敌方单位阻挡。',
        detailedDescription:
          '未处于飞行状态时，向前释放{飓风}，前摇0.5秒，后摇0.75秒。飓风速度1000，存在2秒，[可推动沿途的道具和部分场景物](但飓风也会因此减速)，可被墙体阻挡，多个飓风也会互相挤压碰撞。飓风命中敌方将消失并对对方造成{20*,不可致伤}伤害和2秒{击退}，击退速度为550。被击退期间对触碰到的[敌方单位](过去版本曾经也会对追风汤姆本身造成伤害，现已修复)造成{35*,不可致伤}伤害和1.5秒{眩晕}。若同时撞击多个敌方单位，则均会受到飓风效果。飓风会被部分可被攻击的[中立生物](如森林牧场的鸭爸爸、鸭妈妈)阻挡。\n处于飞行状态时，向正下方扔出{铁砧}（无前后摇）。铁砧下落1.6秒或命中后将消失并对附近小范围敌方造成[一定伤害](与技能等级相关)和1.2秒{眩晕}（老鼠被铁砧眩晕期间及其效果结束后1秒内不会再受到铁砧效果）。铁砧可穿越平台，会被部分可被攻击的[中立生物](如森林牧场的鸭爸爸、鸭妈妈)阻挡。\n\n当手中有老鼠时，会[一同扔出老鼠](该操作会正常消耗一次技能)，老鼠将回复60Hp且随着被扔出的飓风/铁砧一同移动，自动绑上碰到的火箭；当该飓风/铁砧命中敌方或部分可被攻击的[中立生物](如森林牧场的鸭爸爸、鸭妈妈)后，被带走的老鼠才能正常行动；若以铁砧的形式扔出老鼠，则在铁砧命中或提前结束时同样会给予老鼠铁砧效果；老鼠在被扔出期间可使用技能和道具及进行交互，[免疫大多数伤害](追风的俯冲伤害、猫携带知识卡-长爪造成的普攻伤害除外)但不免疫控制，且[不可逃离](无法离开该范围，部分技能效果或被狗抓除外)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '铁砧造成{18*,固定,不可致伤}伤害。',
            cooldown: 9,
            charges: 2,
          },
          {
            level: 2,
            description: '提高飓风的持续时间。',
            cooldown: 9,
            detailedDescription: '提高飓风的持续时间至3.5秒。',
            charges: 3,
          },
          {
            level: 3,
            description: '提高铁砧的伤害。',
            cooldown: 9,
            detailedDescription: '铁砧改为造成{30*,固定,不可致伤}伤害。',
            charges: 3,
          },
        ],
        aliases: ['飓风', '铁砧'],
        cancelableAftercast: ['道具键'],
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '全图可见',
        forecast: 0.5,
        aftercast: 0.75,
        videoUrl: 'https://b23.tv/LoKzcZf',
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
          'Lv.0: [走地状态下](不处于空中时，即不包括处于跳跃，坠落等状态中)，逐渐累积飞行时间。未处于飞行状态时爪刀CD减少。飞行状态下视野增大，可托起其他角色，并提高移速。飞行时[免疫控制](同时不会被米可采访锁定；不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会减少飞行时间。飞行状态可随时退出，但会清空剩余飞行时间。飞行被[强制打断](如被变形、被打死)会暂时禁用{主动技能}。',
        detailedDescription:
          'Lv.0: [走地状态下](不处于空中时，即不包括处于跳跃，坠落等状态中)，每秒获得1秒飞行时间，最多储存10秒。未处于飞行状态时爪刀CD减少35%；飞行状态下[视野范围增加55%](覆盖其他大部分远视效果，但可以和天宫-香炉远视效果叠加)，[可托起鼠单位](机器鼠、乾坤袋除外)，无视小平台阻挡，并提高移速至水平1015、竖直840。悬停时角色会自动向前以水平350、竖直30的速度下落。飞行时[免疫控制](不免疫虚弱)，但无法拾取道具、使用商店或进行交互（抓起老鼠除外）；受到伤害会减少2秒飞行时间。飞行状态可随时退出，但会清空剩余飞行时间。“退出飞行状态”这一操作无cd。飞行被[强制打断](如被变形、被打死)会使{主动技能}进入10秒CD。该CD不可通过吃蛋糕回复。',
        videoUrl: 'https://b23.tv/LoKzcZf',
      },
    ],
    aliases: ['猫头鹰', '追汤', '坠机汤姆', '蝙蝠'],
  },

  /* ----------------------------------- 如玉 ----------------------------------- */
  如玉: {
    description:
      '畅音阁的当家旦角如玉，身段灵动优雅，唱腔娴熟婉转，在多年苦练后，终于如愿在戏台上展现自己的风姿。作为一只猫，优秀的柔韧性，使得如玉的青旦角色身姿优雅，更将水袖与扇子舞动的如天外来仙。极佳的弹跳能力，更是帮助她的刀马旦角色在戏台上下翻飞，如同一位除暴安良的侠女。怀揣着心中的正义与对金城的眷恋，如玉手中常持一杆花枪。尽管没有法力，可她依旧尝试保卫自己的家园，守护金城的和平和安定。',
    maxHp: 185,
    attackBoost: 10,
    hpRecovery: 3.5,
    moveSpeed: 780,
    jumpHeight: 420,
    clawKnifeCdHit: 4,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 270,
    initialItem: '鞭炮束',
    gender: 'female',
    EnglishName: 'Jade',
    catPositioningTags: [
      {
        tagName: '打架',
        isMinor: false,
        description: '{主动技能}提供解控，被动技能提供免疫眩晕和延迟虚弱，使如玉有很强的打架能力。',
        additionalDescription:
          '注意“舞花枪"期间没有霸体，可被敌方禁用技能类效果封锁而无法释放反击；"花枪反击"落地时没有霸体，可能被敌方道具或技能打断。',
      },
      {
        tagName: '进攻',
        isMinor: false,
        description:
          '技能和特殊爪刀均能造成伤害，前刺回马枪同时命中更是能造成极高额伤害。手中有老鼠时也能攻击。此外自身还拥有10攻击增伤。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '主点掷枪',
        pattern: '120220(0)11',
        weaponType: 'weapon1',
        description:
          '被动技能“戏剧转折”提供的“坚毅”效果能免疫眩晕并延迟虚弱，是如玉的核心。掷花枪升级能大幅减少CD，提高主动进攻的能力。{3级被动}会提高进入“坚毅”状态的回血量，可能不利于连续触发“坚毅”状态或{暴怒}，可视情况决定加点与否。',
      },
      {
        id: '主点被动',
        pattern: '120022(0)11',
        weaponType: 'weapon1',
        description:
          '提前加点被动技能能更早享受到免疫眩晕及{2级被动}的反击效果，提高被动打架能力，但一定程度上降低了主动进攻能力。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-暴怒', 'A-熊熊燃烧', 'A-穷追猛打', 'B-反侦察', 'C-猫是液体'],
        description:
          '在管道多的地图中可以使用。如玉较难找节奏，可以等机器鼠出洞后再选择房间，带{反侦察}打爆一只机器鼠后立刻升级，防止因缺少被动而导致找不到节奏。',
        contributor: 'xiaotian',
      },
      {
        cards: ['S-乘胜追击', 'S-暴怒', 'A-熊熊燃烧', [CardGroupType.Or, 'C-猫是液体', 'C-狡诈']],
        description:
          '推荐在森林牧场使用。也可把{猫是液体}换为{狡诈}，在御门酒店使用。{乘胜追击}增加移速，防止被拉扯。本卡组缺点在于开局节奏不好找，不过在森林牧场中可以采七色花弥补这点。',
        contributor: 'xiaotian',
      },
      {
        cards: ['S-暴怒', 'A-熊熊燃烧', 'A-细心', 'B-捕鼠夹', 'C-狡诈'],
        description: '推荐在夏日游轮I或II，以及太空堡垒中使用。',
        contributor: 'xiaotian',
      },
      {
        cards: [
          'S-暴怒',
          'A-熊熊燃烧',
          'A-穷追猛打',
          [CardGroupType.Or, 'A-加大火力', 'A-细心', 'A-心灵手巧'],
        ],
        description:
          '如玉的基础卡组。如玉被动提供的“坚毅”状态使她无需虚弱即可享受{暴怒}效果，{暴怒}提供的可观攻击增伤又能让如玉更容易造成敌方虚弱，从而退出“坚毅”状态，适配性不错。可根据需要将{加大火力}换为其他知识卡，例如{细心}或{心灵手巧}。',
      },
    ],
    specialSkills: [
      {
        name: '绝地反击',
        description: '增强如玉的打架和绑火箭能力。',
      },
      { name: '急速翻滚', description: '增强如玉的机动性。' },
      {
        name: '我生气了！',
        description: '大幅缩短特殊爪刀CD，配合跳跃劈枪的超大攻击范围能产生不错的效果。',
      },
    ],
    skills: [
      {
        name: '舞花枪',
        type: 'active',
        aliases: [],
        description:
          '舞起花枪，提高移速并免疫{碎片}、但无法交互；间歇性对碰触的敌方造成伤害和[命中状态](该状态可叠加且特效与“减速”相同，但敌方移速实际无变化；游戏内原文中提到可对敌方造成“可叠加的减速”，亦有误)；受到来自敌方的伤害时，可触发“花枪反击”，若在技能释放1秒内受击会立刻自动反击。\n\n“花枪反击”：解除控制，减少{主动技能}CD，然后进行一次扫击，造成伤害和{眩晕}；若目标距离较远，则会{传送(状态)}到对方身后扫击。敌方因此虚弱时，会尝试将其击飞到附近的火箭上。',
        detailedDescription:
          '舞起花枪，持续5秒；使用技能瞬间如玉获得30%的加速，持续3.2秒；舞枪期间免疫碎片、可移动跳跃但无法交互，每隔一段时间对碰触的敌方造成{8*,不受来源影响,不可致伤}伤害和1层[“花枪命中”状态](其特效与“减速”相同，但敌方移速实际无变化；游戏内原文中提到可对敌方造成“可叠加的减速”，亦有误)（无减速效果），该状态持续2.9秒且最高叠加4层。技能期间受到来自敌方的伤害时，可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其触发“花枪反击”。技能开启1秒内受击会立刻自动反击。\n\n“花枪反击”：立刻解除控制，结束技能并减少{主动技能}4秒CD；[若目标距离较近](处于以如玉模型中心为圆心，半径约500的圆内)，则直接对[前方600范围内](高度约与自身平齐，范围较大)进行一次扫击，对所有命中的目标造成{40*,不可致伤}和1.9秒{眩晕}，该扫击前摇0.3秒，后摇0.6秒，无法主动取消；[若目标距离较远](不处于以如玉模型中心为圆心，半径约500的圆内)，则会{传送}到目标正上方高约250处，并在0.3秒后再度{传送}到目标身后，然后对[前方600范围内](高度约与自身平齐，范围较大)进行一次扫击，对所有命中的目标造成{40*,不可致伤}伤害和1.9秒{眩晕}，该扫击前摇0.4秒，后摇0.55秒，无法主动取消。（传送前后摇期间无法主动取消动作，但失重落地的瞬间可以通过爪刀强制中止技能，这会吞掉技能的伤害和控制效果；扫击期间不可移动，但可通过方向键转向）\n[任意敌方](包括在特定模式下的“敌方猫咪”，不过对猫咪只有击飞而没有绑火箭效果)[因扫击伤害虚弱](包括进入“铁血”等状态)，且[扫击方向上有火箭](以如玉为半圆的圆心，半径约800的半圆内有空置火箭)时，则会[将其向火箭方向击飞](将其向火箭方向上直线击飞，击飞期间失重；该效果的瞄准有一定问题，可能出现多只虚弱敌方向同一个火箭方向扫击的情况，并且距离火箭过近时可能会出现向上击飞而未击飞到火箭上的情况)，碰到火箭时[自动绑上](正常触发绑火箭的-10秒引线效果及相关知识卡)。花枪反击可命中管道中的敌方。\n特别地，如果一次性击飞多只敌方但路径上有且只有一个火箭，没有被绑上火箭的敌方会在一段时间内做匀速直线运动，直到受到阻挡。该特性可用于在天宫、森林牧场等地图防守时流放敌方。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        forecast: 0,
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '[每0.8秒](游戏内原文为“每秒”，与实际情况不符)造成一次伤害。',
            cooldown: 12,
            detailedDescription:
              '技能释放时立刻造成一次伤害，随后[每0.8秒](游戏内原文为“每秒”，与实际情况不符)造成一次伤害，共7次。',
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
              '命中状态叠加到第4层时清空，并使目标受到{眩晕}和伤害，该眩晕期间免疫舞花枪的效果。',
            detailedDescription:
              '“花枪命中”状态每叠加到第4层时清空，并使目标受到2.4秒{眩晕}和{20*,不可致伤}伤害，但该眩晕期间不会受到来自舞花枪的伤害和“花枪命中”状态。',
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
          '掷出{花枪}，花枪飞行期间如玉移速增加；花枪会对碰到的敌方造成伤害；一段时间或再次使用技能时折返，命中折返前命中过的目标时，如玉可对其发动“花枪反击”。\n\n“花枪反击”：解除控制，减少{主动技能}CD，然后进行一次扫击，造成伤害和{眩晕}；若目标距离较远，则会{传送(状态)}到对方身后扫击。敌方因此虚弱时，会尝试将其击飞到附近的火箭上。',
        detailedDescription:
          '如玉向[指定方向](点按释放为面朝方向且略微偏上，拖动释放为指向方向)掷出{花枪}，同时技能进入1.5秒读条；花枪飞行期间如玉移速增加20%，[持续到花枪返回](当同时有多柄花枪被掷出时，任意一柄花枪返回都会结束该加速)；花枪沿直线飞行，飞行速度约1900，对[碰到](碰撞面积为圆形，半径约150)的敌方造成{5*,不受来源影响,不可致伤}伤害和{15*,无视护盾,不受来源影响,不可致伤}伤害；花枪飞行1.7秒或读条期间再次使用技能时[折返回如玉身边](改为向如玉方向飞行，碰到如玉或累计飞行8.1秒后消失)，折返期间[碰到](碰撞面积为圆形，半径约150；敌方进入花枪范围至离开前只会受到一次伤害，因此折返开始时恰好处于花枪范围内的敌方不会受到二次伤害)敌方也会造成同等伤害，且当花枪折返[命中](包括命中持有护盾、无敌，或是虚弱的目标，甚至包括火箭起飞时待复活的目标———这会导致如玉瞬移到对方的复活位置进行花枪反击)折返前命中过的目标时，如玉可在1.6秒内点按["花枪反击"键](该按键位置和大小可进行调整)对其发动“花枪反击”。\n\n“花枪反击”：立刻解除控制，结束技能并减少{主动技能}4秒CD；[若目标距离较近](处于以如玉模型中心为圆心，半径约500的圆内)，则直接对[前方600范围内](高度约与自身平齐，范围较大)进行一次扫击，对所有命中的目标造成{40*,不可致伤}和1.9秒{眩晕}，该扫击前摇0.3秒，后摇0.6秒，无法主动取消；[若目标距离较远](不处于以如玉模型中心为圆心，半径约500的圆内)，则会{传送}到目标正上方高约250处，并在0.3秒后再度{传送}到目标身后，然后对[前方600范围内](高度约与自身平齐，范围较大)进行一次扫击，对所有命中的目标造成{40*,不可致伤}伤害和1.9秒{眩晕}，该扫击前摇0.4秒，后摇0.55秒，无法主动取消。（传送前后摇期间无法主动取消动作，但失重落地的瞬间可以通过爪刀强制中止技能，这会吞掉技能的伤害和控制效果；扫击期间不可移动，但可通过方向键转向）\n[任意敌方](包括在特定模式下的“敌方猫咪”，不过对猫咪只有击飞而没有绑火箭效果)[因扫击伤害虚弱](包括进入“铁血”等状态)，且[扫击方向上有火箭](以如玉为半圆的圆心，半径约800的半圆内有空置火箭)时，则会[将其向火箭方向击飞](将其向火箭方向上直线击飞，击飞期间失重；该效果的瞄准有一定问题，可能出现多只虚弱敌方向同一个火箭方向扫击的情况，并且距离火箭过近时可能会出现向上击飞而未击飞到火箭上的情况)，碰到火箭时[自动绑上](正常触发绑火箭的-10秒引线效果及相关知识卡)。花枪反击可命中管道中的敌方。\n特别地，如果一次性击飞多只敌方但路径上有且只有一个火箭，没有被绑上火箭的敌方会在一段时间内做匀速直线运动，直到受到阻挡。该特性可用于在天宫、森林牧场等地图防守时流放敌方。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键'],
        cancelableAftercast: ['道具键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '',
            cooldown: 10,
          },
          {
            level: 3,
            description: '',
            charges: 2,
            cooldown: 10,
          },
        ],
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '戏剧转折',
        type: 'passive',
        description:
          '如玉只能使用特殊爪刀：可在手中有老鼠时释放，[无法直接抓起老鼠](即无法抓起被拍子控制的老鼠)，[不受爪刀相关效果影响](无法受到知识卡-击晕、猛攻、蓄势一击、长爪；特技-全垒打，长爪一击，勇气爪刀影响，无法为知识卡-乘胜追击叠加层数；不受缴械及其它禁用爪刀效果影响)，两种爪刀共用CD。\n1.前刺回马枪：在地面时释放，分为2段：前刺枪对身前敌方造成伤害，命中时获得加速；回马枪对身后敌方造成伤害和{击退}，若两枪命中相同目标，则改为造成{眩晕}并[额外](与原伤害分为不同的两段，且后于原伤害结算)造成极高伤害。\n2.跳跃劈枪：在空中时释放，对身前大范围内的敌方造成伤害，命中时获得加速。',
        detailedDescription:
          '如玉无法释放常规爪刀，但拥有两种特殊爪刀，特殊爪刀可在手中有老鼠时释放，[无法触发常规爪刀效果](无法直接抓起被拍子控制的老鼠，无法破坏莱恩-蘸水笔创造的方块)，[不受爪刀相关效果影响](无法受到知识卡-击晕、猛攻、蓄势一击、长爪；特技-全垒打，长爪一击，勇气爪刀影响，无法为知识卡-乘胜追击叠加层数；不受缴械及其它禁用爪刀效果影响)，[CD计算规则与爪刀相同](可被影响爪刀CD的效果影响，如变身药水及特技-“我生气了！”)，且[不会被封锁](既不会被“禁用爪刀”相关状态禁用，也不会被“禁用技能”相关状态禁用)；[可移动释放](但释放期间不能转向)；[可用道具键取消前后摇](但会进入CD)；可打断{主动技能}；[两种特殊爪刀共用CD](共用爪刀CD，释放跳跃劈枪时会重置前刺回马枪的状态)。\n\n1.前刺回马枪：[在地面时可释放](可利用“跳放”技巧进行空中释放，详见机制相关文章)，分为2段：\n前刺枪（[前摇0.35秒，后摇0.1秒](可移动释放，可被道具键取消前后摇（取消前摇会直接进入CD）)）：对身前约450范围内的敌方造成{35*,可致伤}伤害，命中非虚弱敌方时获得30%加速，持续3秒；\n回马枪（[前摇0.35秒，后摇0.35秒](可移动释放，不可空中释放，可被道具键取消前后摇（取消前摇会直接进入CD）)）：对身后约450范围内的敌方造成{35*,可致伤}伤害，并{击退}对方约100距离，若命中[被前刺枪命中过的目标](指被同一轮前刺回马枪的第一段命中过的目标，包括初次命中时处于虚弱状态的目标，或是再次命中时持有护盾的目标，但不包括再次命中时已虚弱的目标)，则[额外](与原伤害分为不同的两段，且后于原伤害结算)造成{100*,可致伤}伤害和0.5秒{眩晕}（[与常规眩晕略有区别](该状态实际效果与眩晕类似，但角色头顶并未出现“眩晕”图标；动作与击退类似，但击退距离为0，且会中断回马枪原本的击退效果)），且不再造成{击退}。\n\n2.跳跃劈枪（[前摇0.1秒，后摇0.45秒](可移动释放，可被移动、跳跃、道具键取消前后摇（取消前摇会直接进入CD）)）：在空中时可释放，对身前[约500范围内](500指横向判定范围。该攻击的纵向判定范围远大于常规爪刀)的敌方造成{55*,可致伤}伤害，命中非虚弱敌方时获得30%加速，持续3秒。跳跃劈枪有概率出现丢伤害bug（出现命中判定但不造成伤害），[触发条件暂不明确](根据目前的触发情况来看，可能与“过快地取消后摇”和/或“目标与如玉距离过远”有关)。\n\n如玉从商店购买道具所需的时间较长（需要4秒）。',
        skillLevels: [
          {
            level: 1,
            description:
              '被[击倒](即即将进入虚弱时)时改为进入10秒“坚毅”状态：解除并免疫控制、回复Hp、移速提高；状态结束时进入{猫虚弱}，击倒敌方则提前解除状态并避免后续虚弱。',
            detailedDescription:
              '[因其他原因虚弱时](即：不因本技能提供的“坚毅”导致虚弱时)[改为进入10秒“坚毅”状态](仍会触发以虚弱为判定条件的效果，如鼠方的击倒敌方获得金钱效果及终结赏金，和知识卡-越挫越勇，暴怒，乘胜追击（失去层数）等)：立即解除控制并回复100Hp、移速提高15%、免疫{眩晕}和{猫虚弱}，期间成功对任意敌方造成虚弱则提前解除该状态。“坚毅”状态正常结束时，如玉进入{猫虚弱}。',
          },
          {
            level: 2,
            description:
              '[使如玉Hp归零](包括通过攻击使如玉Hp恰好为零，但未进入“坚毅”状态的情况)的敌方在30秒内无法对如玉造成{眩晕}和{猫虚弱}。如玉在{眩晕}期间受到敌方攻击可触发“花枪反击”。',
            detailedDescription:
              '[使如玉Hp归零](包括通过攻击使如玉Hp恰好为零，但未进入“坚毅”状态的情况)的敌方在30秒内无法对如玉造成{眩晕}和{猫虚弱}（敌方被抓起时提前解除该状态）。如玉在{眩晕}期间再次受到敌方攻击可触发“花枪反击”。',
          },
          {
            level: 3,
            description:
              '“坚毅”会回复更多Hp，且对敌方造成{眩晕}即可解除。{2级被动}效果的持续时间改为60秒。',
            detailedDescription:
              '“坚毅”改为回复200Hp，且对敌方造成{眩晕}即可解除。{2级被动}效果的持续时间改为60秒。',
          },
        ],
      },
    ],
  },
} as const satisfies Readonly<Record<string, CharacterDefinition | PartialCharacterDefinition>>;

// Process character definitions to assign IDs and process skills
const catCharacters = processCharacters(catCharacterDefinitions);

const catsWithLongStorePurchaseTime = new Set(['如玉', '苏蕊', '斯飞']);

// Generate characters with faction ID and image URLs applied in bulk
export const catCharactersWithImages = Object.fromEntries(
  Object.entries(catCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      factionId: 'cat' as const,
      storePurchaseTime:
        character.storePurchaseTime ?? (catsWithLongStorePurchaseTime.has(characterId) ? 4.1 : 2.6),
      imageUrl: AssetManager.getCharacterImageUrl(characterId, 'cat'),
      skills: AssetManager.addSkillImageUrls(characterId, character.skills, 'cat'),
    },
  ])
);
