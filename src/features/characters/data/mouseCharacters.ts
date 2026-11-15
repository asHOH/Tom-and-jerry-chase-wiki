import { AssetManager } from '@/lib/assetManager';
import { CardGroupType, type CharacterDefinition } from '@/data/types';
import { processCharacters } from '@/features/characters/utils/skillId';

const mouseCharacterDefinitions = {
  /* ----------------------------------- 杰瑞 ----------------------------------- */
  杰瑞: {
    aliases: ['撅瑞'],
    description: '一只古灵精怪的小老鼠，总喜欢戏弄汤姆，和汤姆是一对欢喜冤家。',
    EnglishName: 'Jerry',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 4,
        description: '推速快。',
        additionalDescription: '此外还有被动提供推速加成和搬奶酪速度。',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '鼓舞为队友提供增益、处理二手火箭；鸟哨限制猫的走位。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '大铁锤',
        pattern: '0[12]112200',
        weaponType: 'weapon1',
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先2级被动。',
        additionaldescription: '',
      },
      {
        id: '鸟哨',
        pattern: '0[13]113300',
        weaponType: 'weapon2',
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先2级被动。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '有救援卡，此外逃窜擅长对抗携带击晕的猫咪。',
      },
      {
        cards: ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
        description: '无救援卡，需要及时与队友沟通，尽量避免救援。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'S-回家', 'C-救救我'],
        description: '用于打防守猫。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '鼓舞',
        type: 'active',
        description: '增加自身和附近队友的移速和跳跃高度。',
        detailedDescription:
          '为自身900范围内的所有友方（含自身）施加对应等级的鼓舞状态。不同等级的鼓舞状态[可以叠加](不同等级技能施加的状态为不同名称的状态，且彼此不会互相覆盖)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        forecast: 0.5,
        aftercast: 1,
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=66.5',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '鼓舞使角色移速增加15%、跳跃能力增加30%，持续5秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '鼓舞额外回复Hp。',
            detailedDescription: '鼓舞额外回复25Hp。',
            cooldown: 18,
          },
          {
            level: 3,
            description:
              '鼓舞额外解除受伤状态。可以对被绑上火箭的老鼠鼓舞，改为延长对应火箭的放飞倒计时。',
            detailedDescription:
              '鼓舞额外解除受伤状态。[可以对被绑上火箭的老鼠鼓舞，改为延长对应火箭的放飞倒计时10秒](与库博天堂火箭的互动关系：鼓舞天堂火箭上的虚影或虚影对应的本体都可以增加天堂火箭的放飞倒计时，若同时鼓舞二者则效果翻倍；若队友被绑上地面火箭，鼓舞时也会增加地面火箭的倒计时)。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '大铁锤',
        aliases: ['锤子'],
        type: 'weapon1',
        description: '举起大铁锤，对面前的敌方造成眩晕。',
        detailedDescription:
          '举起大铁锤砸下，对自身前方260范围内的所有敌方造成持续2.5秒的{眩晕}（会掉落道具和老鼠）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        // 事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '不可取消',
        forecast: 0.8,
        aftercast: 0.6,
        canHitInPipe: true,
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=104.4',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '大铁锤额外造成伤害，且每次命中敌方时永久提升自身推速，可叠加。',
            detailedDescription:
              '大铁锤额外造成{50*}伤害，且每次[命中敌方时](包括命中虚弱、霸体或无敌的猫咪时)会使自身推速[永久](实际为持续1000秒)提高10%，最多叠加五层。',
            cooldown: 16,
          },
          {
            level: 3,
            description: '眩晕时间延长。',
            detailedDescription: '眩晕时间延长至3.5秒。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '鸟哨',
        type: 'weapon2',
        description:
          '吹响鸟哨召唤{鸟哨金丝雀}。金丝雀将来回盘旋一段时间，持续向下投掷{鸟哨鞭炮}，命中敌方时造成伤害和眩晕，但敌方受其控制后将短暂免疫其他{鸟哨鞭炮}一段时间。{鸟哨鞭炮}掉落一定距离后也会[自行爆炸](不造成任何效果)。',
        detailedDescription:
          '吹响鸟哨，召唤{鸟哨金丝雀}[飞到吹响鸟哨的位置](金丝雀会由地图左上角飞到目标位置，因此距离地图左上角越近，到达速度越快)。金丝雀会[在一定范围内来回盘旋](金丝雀可穿墙)，每隔一段时间会向下方垂直投掷一枚{鸟哨鞭炮}，命中敌方时造成{55*,不受来源影响}伤害和2秒眩晕，且可触发[投掷效果](指的是以投掷命中为条件的效果，包括知识卡-缴械/精准投射/投手/追风，特技-干扰投掷/勇气投掷)；被命中的敌方若因此被眩晕，则在眩晕期间及眩晕结束后1秒内免疫{鸟哨鞭炮}；{鸟哨鞭炮}掉落一定距离后也会[自行爆炸](不造成任何效果)。金丝雀轰炸一段时间后自行飞离。[同一房间内最多只能有1只由鸟哨召唤的金丝雀](以吹响鸟哨的位置判定金丝雀所属房间，即使之后金丝雀穿越墙壁飞入其他房间也不会改变所属位置。金丝雀在飞到与飞离目标位置的过程中仍然算作存在于该房间内。与金丝雀NPC分开计数)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        forecast: 1,
        aftercast: 1,
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=125.5',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '金丝雀存在12秒，每隔0.8秒投掷一次鞭炮，单次技能期间总共投掷15±1次。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '缩短金丝雀的投掷间隔。',
            detailedDescription: '缩短金丝雀的投掷间隔至0.75秒，单次技能期间总共投掷17±1次。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '进一步缩短金丝雀的投掷间隔。',
            detailedDescription: '进一步缩短金丝雀的投掷间隔至0.6秒，单次技能期间总共投掷20±1次。',
            cooldown: 24,
          },
        ],
      },
      {
        name: '奶酪好手',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=36',
        skillLevels: [
          {
            level: 1,
            description: '推速增加。',
            detailedDescription:
              '[推速增加30%](所有百分比推速加成之间均为乘算关系，包括游戏自带的百分比推速增减)。',
          },
          {
            level: 2,
            description: '搬运{奶酪}时，移速和跳跃高度大幅增加，同时视野不再降低。',
            detailedDescription:
              '搬运{奶酪}时，[改为](实际效果为将“搬起大奶酪减速-1”状态提供的移速&跳跃能力降低倍率改为新倍率，原有效果不再生效；该状态附带的其它效果不改变，照常生效)移速提升8%、跳跃能力提升8%。',
          },
          {
            level: 3,
            description:
              '每当奶酪被推进或墙缝首次被破坏到一定程度时，解除虚弱和受伤、回复Hp、且移速短暂提高。',
            detailedDescription:
              '每当奶酪被推进或墙缝首次被破坏到80%、60%、40%、20%、0%时，回复25Hp并解除{鼠虚弱}和{受伤}，随后移速提高20%，持续3秒。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '与大铁锤搭配，提高命中率，并且可以骗猫不使用霸体而救人（取决于猫的意识）。',
      },
      {
        name: '魔术漂浮',
        description: '所有技能均可主动中断漂浮，灵活性高。',
      },
    ],
  },

  /* ----------------------------------- 侦探杰瑞 ----------------------------------- */
  侦探杰瑞: {
    aliases: ['侦杰'],
    description:
      '谨慎机警的侦探杰瑞，来自19世纪末的英国，为了更快地抓到凶手，他极善于隐藏自己的踪迹。',

    EnglishName: 'Detective Jerry',

    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 4,
        description: '基础推速与{侦探泰菲}并列第一。若携带烟雾弹则能进一步提高团队推速。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        weapon: 2,
        description: '干扰器能提供短暂的群体隐身，而且前摇较短。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        weapon: 1,
        description:
          '烟雾弹的禁用技能和巨额推速加成能使鼠方快速地推完最后一块奶酪，克制大多数守奶酪的猫咪。',
        additionalDescription:
          '墙缝期时，烟雾弹也有着很强的干扰能力，尤其是阻止猫咪修墙。长时间的隐身也为烟雾弹的释放提供了保障。',
      },
      {
        tagName: '救援',
        level: 2,
        description: '主动技能的隐身效果可以方便救援，但是在火箭下有老鼠夹时侦探杰瑞难以应对。',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '烟雾弹',
        pattern: '12[12]21000',
        weaponType: 'weapon1',
        description:
          '四级时通常先点{2级烟雾弹}；如果猫在附近或不清楚猫的位置，则可点{2级隐身}保证生存。',
        additionaldescription: '',
      },
      {
        id: '视觉干扰器',
        pattern: '131313000',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
        description: '生存能力较强的卡组，可以较为安全地推奶酪和砸墙，推进游戏进程。',
      },
      {
        cards: ['S-铁血', 'S-舍己', [CardGroupType.Or, 'S-回家', 'S-护佑'], 'C-救救我'],
        description: '舍己流派卡组。可视情况和习惯选择回家或护佑。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '舍己流派卡组，拉扯和消耗能力比前套卡组稍强。',
      },
    ],

    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '隐身',
        type: 'active',
        description: '进入隐身状态，期间获得加速。',
        detailedDescription:
          '获得对应等级的隐身状态并清除部分{反向}和{失明}状态；本技能隐身期间移速提高15%。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        forecast: 1.9,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '隐身期间使用道具或交互会显形。',
            detailedDescription: '隐身持续6秒；期间使用道具或交互会显形。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '隐身持续更久；期间使用道具和交互不会显形。',
            detailedDescription: '隐身持续12秒；期间使用道具和交互不会显形。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '隐身持续更久；隐身状态下持续恢复Hp。',
            detailedDescription:
              '隐身持续15秒。\n自身处于由本技能或{隐身饮料}导致的隐身状态时，每秒恢复3.3Hp。', //FIXME: not sure about the recovery rate
            cooldown: 20,
          },
        ],
      },
      {
        name: '烟雾弹',
        type: 'weapon1',
        description:
          '引爆烟雾弹产生{烟雾}遮挡猫的视野。在烟雾中猫咪[无法查看小地图](此效果可被一层护盾抵消)。',
        detailedDescription:
          '引爆烟雾弹产生直径1650的{烟雾}遮挡猫的视野。在烟雾中猫咪[无法查看小地图](此效果可被一层护盾抵消)。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        forecast: 0.5,
        aftercast: 1.5,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '烟雾持续4.8秒。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '友方在烟雾内提升移速、跳跃高度和推速。',
            detailedDescription: '友方在烟雾内加速30%，跳跃速度提升20%，推速固定提升5.75%/秒。',
            cooldown: 35,
          },
          {
            level: 3,
            description: '烟雾持续时间延长；敌方在烟雾内降低移速、跳跃高度，且禁用技能与道具。',
            detailedDescription:
              '烟雾持续时间延长至6.5秒；敌方在烟雾内减速20%、跳跃高度降低约12.5%，且禁用技能与道具。',
            cooldown: 35,
          },
        ],
      },
      {
        name: '视觉干扰器',
        type: 'weapon2',
        description: '投掷{干扰器}，落地后使范围内的老鼠短暂隐身。',
        detailedDescription:
          '投掷{干扰器}，落地或碰到墙壁后使范围内的老鼠隐身3.5秒。[干扰器在技能触发后会持续存在1秒](仅有贴图作用)。',
        forecast: 0.3,
        canMoveWhileUsing: true,
        canUseInAir: true,
        // cancelableSkill: '不确定是否可被打断', // FIXME
        cancelableAftercast: '无后摇',
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '除移动和跳跃外的交互行为会显形。',
            cooldown: 20,
            charges: 2,
          },
          {
            level: 2,
            description:
              '交互行为不会显形；持续期间解除并免疫{香水瓶}、{香水烟雾}、{胡椒瓶}、{胡椒烟雾}、{香水区域}效果。',
            cooldown: 20,
            charges: 2,
          },
          {
            level: 3,
            description: '持续期间额外获得加速。',
            detailedDescription: '持续期间额外加速20%。',
            cooldown: 20,
            charges: 2,
          },
        ],
      },
      {
        name: '胆小如鼠',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '每隔一段时间，可在小地图上看到敌方的位置。',
            detailedDescription:
              '每隔45秒，使敌方获得{暴露位置}状态，持续3秒。升级该技能时直接进入CD，不触发效果。',
          },
          {
            level: 2,
            description: '搬运奶酪时，对敌方隐藏自身和奶酪在小地图上的位置。',
            detailedDescription:
              '搬运奶酪时，使自身获得{隐藏位置}状态（该状态同时也会隐藏自身所搬运奶酪的位置）。',
          },
          {
            level: 3,
            description: '附近有猫咪时，移速和跳跃高度提升，但推速下降。',
            detailedDescription:
              '自身半径1200范围内有敌方角色时，自身移速提高10%，跳跃能力提高5%，但推速下降30%。',
          },
        ],
      },
    ],
    specialSkills: [
      { name: '绝处逢生', description: '绝处逢生配合隐身能有效提高生存能力，还能用来清理夹子。' },
    ],
  },

  /* ----------------------------------- 罗宾汉杰瑞 ----------------------------------- */
  罗宾汉杰瑞: {
    description: '来自12世纪英国的侠盗罗宾汉，身手敏捷，快迅如风，拥有在空中二段跳的能力。',
    EnglishName: 'Robin Hood Jerry',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 2,
        description: '罗宾汉推速较快，自身灵活性也高，可作为队伍副推位。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 4,
        description: '二段跳的全图支援非常强力。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 2,
        description: '罗宾汉速度很快且非常灵活，后期猫咪很难追上他。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '降落伞',
        pattern: '12[12]12000',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '降落伞（剑汤）',
        pattern: '1200[12][12]0',
        weaponType: 'weapon1',
        description:
          '打剑汤推荐加点。罗宾汉杰瑞{2级被动}可解除{骑士连斩}的控制效果，随后可接{降落伞}免疫伤害。',
      },
      {
        id: '登山飞镐',
        pattern: '13[13][13]000',
        weaponType: 'weapon2',
        description: '视情况决定主动和武器技能的加点先后。',
        additionaldescription: '',
      },
      {
        id: '登山飞镐（牛汤）',
        pattern: '13300[13]10',
        weaponType: 'weapon1',
        description: '打牛汤推荐加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '回家',
        groups: [
          {
            cards: ['S-舍己', 'S-铁血', 'S-回家', 'C-救救我'],
            description: '阵容缺砸墙位时使用，回家提升墙缝期综合能力',
          },
        ],
        description: '阵容缺砸墙位时使用，回家提升墙缝期综合能力',
        defaultFolded: false,
        detailedDescription: '',
      },
      {
        id: '强自保',
        groups: [
          {
            cards: [
              'S-舍己',
              'S-铁血',
              [CardGroupType.Or, 'A-逃窜', 'B-应激反应', 'B-夹不住我'],
              'C-不屈',
              'C-救救我',
            ],
            description:
              '经典的自卫流卡组，逃窜、不屈可大大增强其自保能力。知识量不足将逃窜换为应激反应或夹不住我。',
          },
          {
            cards: [
              'B-幸运',
              'S-铁血',
              [CardGroupType.Or, 'A-逃窜', 'B-应激反应', 'B-夹不住我', 'B-求生欲'],
              'C-不屈',
              [CardGroupType.Or, 'C-救救我', 'C-脱身'],
            ],
            description:
              '以幸运为核心的自私流。应用场景如队友过于不靠谱，想刷个人胜利；队内已有稳救位；队友实力较强，不需要救援等',
          },
          {
            cards: [
              'S-舍己',
              'S-铁血',
              'C-救救我',
              'B-飞跃',
              [CardGroupType.Or, 'C-不屈', 'B-夹不住我'],
            ],
            description: '有飞跃可以跳上更多点位。可将不屈换为别的知识卡。',
          },
          {
            cards: ['S-铁血', 'S-舍己', 'C-救救我', 'C-不屈', 'B-夹不住我'],
            description: '20知识量平替卡组，不屈、夹不住我可换为别的知识卡。',
          },
        ],
        description: '',
        defaultFolded: false,
        detailedDescription: '',
      },
      {
        id: '无畏',
        groups: [
          {
            cards: [
              'S-无畏',
              'S-铁血',
              [
                CardGroupType.Or,
                'A-逃窜',
                'B-逃之夭夭',
                [CardGroupType.And, [CardGroupType.Or, 'B-应激反应', 'B-夹不住我'], 'C-不屈'],
              ],
              'C-救救我',
            ],
            description: '必带无畏-铁血-救救我，剩下知识量可依据自身喜好携带自保卡。',
          },
        ],
        description: '',
        defaultFolded: true,
        detailedDescription:
          '打防守猫或者新手罗宾专用。由于无畏能给自己提供无敌，使用此套卡组推荐先升2级降落伞，救人时先开伞，利用2级伞给的救援加速救人。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
      { items: ['盘子', '灰花瓶', '牛奶', '香水瓶'], description: '增强墙缝期的续航能力。' },
    ],
    skills: [
      {
        name: '二段跳',
        type: 'active',
        description: '全体队友短暂获得加速和二段跳状态。',
        detailedDescription:
          '[尝试](部分状态（如虚弱）下的队友会免疫本技能施加的状态)为所有队友施加对应等级的二段跳状态，该状态下角色移速提高10%，可跳跃次数提升至2（可在空中[进行1次额外跳跃](从上一次接触平台/地面起，至多进行2次跳跃，再次接触平台/地面时重置)）。\n不同等级的二段跳状态[可以叠加](不同等级技能施加的状态为不同名称的状态，且彼此不会互相覆盖)，但只有移速加成效果能叠加生效。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '二段跳持续4秒。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '二段跳持续时间更长。',
            cooldown: 25,
            detailedDescription: '二段跳持续时间延长至6.5秒。',
          },
          {
            level: 3,
            description: '二段跳期间还能提高跳跃高度，且自身获得三段跳。',
            cooldown: 25,
            detailedDescription:
              '二段跳状态额外获得{跳跃能力}+100。\n自身[处于本技能导致的二段跳状态时](包括因任意罗宾汉杰瑞的任意等级技能而获得的二段跳状态)，可跳跃次数{改为}3。',
          },
        ],
        cooldownTiming: '释放时',
      },
      {
        name: '降落伞',
        type: 'weapon1',
        description: '打开降落伞降落，无视平台，期间无敌。可随时跳跃取消；若落地则进入后摇。',
        detailedDescription:
          '打开降落伞，[将自身竖直方向的速度重置为向上的100](因此会向上飘一小段距离)，并获得使重力加速度变为1000/秒²的{失重}状态；降落期间无视所有平台，且获得绝对霸体状态(期间免疫所有新增效果，包括攻击、眩晕、技能效果(如牛汤的牛、布奇的桶盖、图多的吻、自身的二段跳)、特技效果(如冰保、治疗)、药水效果(如与雪梨连线时雪梨喝隐身所带来的隐身))，接触地面后进入0.65秒不可取消的后摇；降落过程中可随时[进行1次额外跳跃](该跳跃属于技能效果，额外跳跃不受跳跃次数的限制，但仍记为一次跳跃（例如在二段跳情况下可通过普通跳跃+降落伞跳跃进行二段跳，但此时无法再通过二段跳效果进行三段跳；反之若通过普通跳跃+二段跳跳跃进行二段跳，那仍可通过降落伞效果进行三段跳）)，开枪或使用{绝处逢生}也可终止技能。使用{魔术漂浮}会使降落伞无法被取消。使用{玩具枪}会强制结束降落伞，即使已经使用{魔术漂浮}。', //包括绝大多数负面和正面效果，如二段跳，干扰器隐身；部分“接触地面时”延迟触发的效果除外，如平底锅的落地伤害和眩晕、Lv.3魅力甲油的使敌方粘在地板上的效果
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '不可取消',
        forecast: 0,
        aftercast: 0.32,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 10,
            detailedDescription: '',
          },
          {
            level: 2,
            description: '离开降落伞后，短暂提高移速和救援速度。',
            cooldown: 10,
            detailedDescription: '降落伞状态结束后，移速和救援速度提高35%，持续3秒。',
          },
          {
            level: 3,
            description: '',
            cooldown: 5,
          },
        ],
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '登山飞镐',
        type: 'weapon2',
        description:
          '只有在[接触平台](包括已接触但未站立在其上的平台)或墙壁时才能使用飞镐。\n对平台释放：[尝试翻越并悬挂在平台下方](只要平台不贴地即可翻越，但未必能挂住)。悬挂期间可快速[左右移动](若超过平台范围则掉落)，同时逐渐叠加[全面加速](移速、跳跃速度、救援速度、推速)状态；受到眩晕将掉落；可点击特殊技能或跳跃取消悬挂；跳跃取消将短暂免疫碎片和老鼠夹。\n对墙壁释放：短暂悬挂在墙壁上。悬挂期间可手持道具和喝饮料，但手上的奶酪会掉落。',
        detailedDescription:
          '只有在[接触可翻越平台](包括已接触但未站立在其上的平台——以这种方式触发则不会有翻越平台的过渡时间)或竖直墙壁时才能使用飞镐。\n对平台释放：[尝试翻越到并悬挂在平台下方](只要平台不贴地即可翻越，但未必能挂住)，持续一段时间。悬挂期间可快速[左右移动](若超过平台范围则掉落)，可使用二段跳和除{魔术漂浮}以外的特技；同时[每1.5秒](进入悬挂状态时立刻触发，此后每1.5秒再触发一次)增加一层全面加速状态（移速提高10%、跳跃速度提高18%、救援速度提高11.5%、推速提高25%，持续3.75秒。除跳跃加成外的其余加成均可乘算叠加，最多叠加数层）；悬挂期间可点击特殊技能或跳跃取消悬挂；跳跃取消将获得免疫碎片和老鼠夹的效果，且救援速度提高6%，持续2.9秒；受到眩晕将掉落；悬挂有0.15秒后摇，若使用道具键解除后摇，或[无法进行悬挂](当两个平台距离过近时，会导致悬挂在第一个平台下时被第二个平台挤压，这种情况无法悬挂)，则会[直接解除技能](根据平台的穿越所需时间，可能出现穿越平台或仍在平台上方两种结果)，不进行悬挂，仍会触发获得全面加速效果及Lv.2的回复效果。\n对墙壁释放：悬挂在墙壁上，持续2秒，无后摇。悬挂期间可手持道具和喝饮料；如果手上有奶酪，则奶酪会掉落；获得变身效果和使用机器鼠会结束悬挂。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        skillLevels: [
          {
            level: 1,
            description: '全面加速状态最多叠加3层。',
            detailedDescription: '在平台下悬挂的最长时间为10秒。全面加速状态最多叠加3层。',
            cooldown: 15,
            charges: 3,
          },
          {
            level: 2,
            description: '对平台释放技能时回复Hp。',
            detailedDescription: '对平台释放技能时回复25Hp；在平台下悬挂的最长时间延长至15秒。',
            cooldown: 8,
            charges: 3,
          },
          {
            level: 3,
            description:
              '技能期间{免控}，且不会因受到伤害而打断技能。全面加速状态改为最多叠加5层。',
            detailedDescription:
              '技能期间{免控}（但也会免疫隐身饮料的效果），且[不会因受到伤害而打断技能](但是可以被某些角色技能造成的效果打断如：牛仔汤姆的牛、大型仙人掌，莱特宁的垃圾桶，追风汤姆的追风双翼、战术机动，汤姆的平底锅等)。全面加速状态改为最多叠加5层。',
            cooldown: 8,
            charges: 3,
          },
        ],
        aliases: ['废稿'],
        cancelableSkill: '无前摇',
        cancelableAftercast: ['道具键*'],
        forecast: 0,
        canHitInPipe: false,
        cueRange: '本房间可见',
        cooldownTiming: '释放时',
      },
      {
        name: '身轻如燕',
        type: 'passive',
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '跳跃高度提高。',
            detailedDescription: '跳跃能力+50。在降落伞期间点出一被会使一被整局失效。',
          },
          {
            level: 2,
            description:
              '受到敌方攻击后，[解除先前的控制](包括老鼠夹导致的控制，不包括虚弱)并短暂加速。',
            detailedDescription:
              '受到来自敌方的伤害后，[尝试](部分状态（如虚弱）下会免疫本技能施加的状态，导致技能失效)解除自身受到的{眩晕}状态，随后移速和跳跃能力各提升20%，持续3秒。',
          },
          {
            level: 3,
            description: '在敌方附近时，CD倒计时加快。',
            detailedDescription:
              '附近900范围内有敌方角色时，自身主动和武器技能CD倒计时速度[提高30%](效果触发时，技能键上CD的显示值不变，但减少1单位CD所需的实际时间缩短)。',
          },
        ],
      },
    ],
    aliases: ['罗杰'],

    specialSkills: [
      {
        name: '绝处逢生',
        description: '高机动性可以拉远用自起。',
      },
      {
        name: '应急治疗',
        description: '被追的过程可以用治疗增加容错。',
      },
      {
        name: '魔术漂浮',
        description: '配合降落伞和二段跳进一步拉开距离，便于拉扯和逃离。',
      },
    ],

    counterTags: ['拉扯'],
  },

  /* ----------------------------------- 航海士杰瑞 ----------------------------------- */
  航海士杰瑞: {
    aliases: ['海盗杰瑞'],
    description:
      '公海上向往自由的航海士杰瑞，是最强大的航海家，他浑身充满野性，常年与火炮打交道的他，善于破坏火箭。',

    EnglishName: 'Pirate Jerry',

    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '金币和火药桶能有效拦截猫咪上火箭、抓队友。',
        additionalDescription: '火炮也能连控猫咪，1级被动的减速配合{投手}可以让很多猫追不上老鼠。',
      },
      {
        tagName: '砸墙',
        level: 4,
        description: '拥有高额的基础破墙数值，3级被动进一步增强破坏墙缝能力。',
        additionalDescription: '火药桶也能对墙缝造成巨大破坏。',
      },
      {
        tagName: '救援',
        level: 2,
        description: '使用金币砸晕猫咪或用火药桶炸毁火箭后即可救下。',
        additionalDescription: '怕霸体猫、怕拦截，依赖药水。',
      },
    ],

    skillAllocations: [
      {
        id: '火药桶',
        pattern: '121221000',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
      {
        id: '舰艇火炮',
        pattern: '133131000',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
      {
        id: '主点被动控制',
        pattern: '12001[10]22',
        weaponType: 'weapon1',
        description: '适合单双排，先点二被自保，若7级进墙缝期先点三被破墙',
      },
      {
        id: '主点被动炸火箭',
        pattern: '12002(2)011',
        weaponType: 'weapon1',
        description:
          '适合单双排，先点二被自保，若7级进墙缝期先点三被破墙，若玩几何桶不建议点三级桶',
      },
    ],

    knowledgeCardGroups: [
      {
        cards: [
          'S-舍己',
          'S-铁血',
          'C-救救我',
          [
            CardGroupType.Or,
            'S-缴械',
            [CardGroupType.And, 'A-投手', 'C-不屈'],
            [CardGroupType.And, 'B-飞跃', 'B-绝地反击'],
            [CardGroupType.And, 'B-求生欲', 'C-脱身'],
          ],
        ],
        description:
          '《缴械》打苏蕊、侍卫等单刀型猫咪。《投手》打怕减速的猫咪，和1级被动叠加后能让猫咪难以追上老鼠。第三套卡组为各项能力较为均衡的卡组。求生欲和脱身配合{2级被动}达到快速挣扎的效果，适合中低端局自保，但上限较低，且较为依赖地图和敌方角色。',
      },
    ],

    skills: [
      {
        name: '飞翔金币',
        type: 'active',
        videoUrl: 'https://www.bilibili.com/video/BV1PUcYzXE8J/?t=78',
        description:
          '拿出一枚{金币(衍生物)}（能穿过大部分平台，命中敌方造成{眩晕}，被命中的敌方短暂免疫该道具效果）。获得金币时会替换并掉落手中的其他道具。',
        detailedDescription:
          '拿出一枚{金币(衍生物)}（能穿过大部分平台，命中敌方造成2秒{眩晕}，但被命中的敌方[在眩晕期间及眩晕结束后1秒内](若眩晕被敌方护盾、霸体、无敌等效果免疫，则不会触发后续免疫效果)免疫该道具效果）。获得金币时会替换并掉落手中的其他道具，金币不会因虚弱而从手中掉落。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        forecast: 1.2,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '',
            cooldown: 15,
          },
          {
            level: 3,
            description: '金币命中敌方会连续造成两段伤害和眩晕。',
            detailedDescription:
              '金币命中敌方会造成一段{35*}伤害和一段{40*}伤害，各自单独结算，均可造成眩晕或击破护盾等。',
            cooldown: 15,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '火药桶',
        type: 'weapon1',
        videoUrl: 'https://www.bilibili.com/video/BV1PUcYzXE8J/?t=106',
        aliases: ['桶', '炸药桶'],
        description:
          '放置{火药桶(衍生物)}，延迟数秒后爆炸，对周围造成伤害和眩晕，对墙缝造成伤害，并炸毁范围内的火箭，因此救下老鼠时可以触发相关知识卡，但不获得相关局内金币。猫咪可以通过交互拆除火药桶，老鼠可以通过交互推动火药桶。火药桶被部分道具命中时缩短引爆时间。',
        detailedDescription:
          '放置{火药桶(衍生物)}，延迟[数秒](与技能等级有关)后爆炸，对周围造成[不分敌我的伤害](与技能等级有关；对其他角色（包括敌方和队友，不包括自身）的伤害会受攻击增伤的影响)和眩晕，对墙缝造成{_20*}伤害，并{炸毁}[范围内](火药桶的下端判定相对较大)的火箭，因此救下老鼠时可以触发相关知识卡，但不获得相关局内金币。猫咪可以[通过交互拆除火药桶](动作时长1秒)，老鼠可以通过交互推动火药桶。火药桶被其他道具（如金币、所有易碎道具、火炮发射出的老鼠等）命中时，引爆时间缩短5秒。\n火药桶与其他道具的互动关系：[火药桶可被{小鞭炮}或{鞭炮束}炸飞](在鞭炮能炸到的范围内，鞭炮距离火药桶越近，火药桶被炸飞而获得的速度越慢)，在火药桶左侧的鞭炮会使火药桶呈抛物线飞出，右侧的鞭炮会使火药桶水平滑行。使用特定道具斜向下45°打击桶外侧可使桶产生横向加速，其中{扁盘}与{盘子}产生的加速较大，约为{玻璃杯}的两倍。未引爆的鞭炮也可以使桶位移，且不会缩短引线。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
        forecast: 1,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '火药桶引爆时间为8秒，被炸毁的火箭65秒后自动修复。',
            detailedDescription:
              '火药桶引爆时间为8秒，引爆造成不分敌我的{1*}伤害（伤害来源为航海士杰瑞，对自身造成的伤害改为{1*,不受来源影响}）与1.4秒眩晕；被炸毁的火箭65秒后自动修复。',
            cooldown: 45,
          },
          {
            level: 2,
            description: '爆炸伤害提高。',
            detailedDescription:
              '爆炸对角色的伤害提升至{25*}（伤害来源为航海士杰瑞，对自身造成的伤害改为{25*,不受来源影响}）。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '引爆时间缩短至3秒；爆炸伤害进一步提高；被炸毁的火箭不再自动修复。',
            detailedDescription:
              '引爆时间缩短至3秒；爆炸对角色的伤害提升至{50*}（伤害来源为航海士杰瑞，对自身造成的伤害改为{50*,不受来源影响}）；被炸毁的火箭不再自动修复。',
            cooldown: 30,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '舰艇火炮',
        type: 'weapon2',
        videoUrl: 'https://www.bilibili.com/video/BV1PUcYzXE8J/?t=145',
        aliases: ['炮', '海盗火炮'],
        description:
          '放置{火炮}，火炮会存在一段时间，期间老鼠可通过交互键进入火炮，通过投掷键发射自身，对碰到的敌方造成伤害与眩晕，碰到绑在火箭上的队友时自动救援。火炮内不会被投掷道具及部分技能命中。火炮会对所有角色展示在小地图上。',
        detailedDescription:
          '放置{火炮}，火炮会存在[一段时间](与技能等级相关)，期间老鼠可通过交互键进入火炮（交互动作时长1秒），通过拖拽投掷键选择方向发射自身，无视部分平台阻挡，期间可投掷、拾取道具和进行[部分交互](钻管道、关门等)，碰到敌方或[部分物体](包括墙缝泡泡，雪夜古堡卧室国王，天宫嫦娥等)会[反弹](速度不变，方向遵循反射定律，碰撞角色时的反射面固定为竖直面)，若为敌方则对其造成{50*}伤害（[伤害来源为被发射者](需注意：实际伤害受被发射者的攻击增/减伤影响，而非航海士杰瑞的)）与1.5秒眩晕，碰到绑在火箭上的队友时自动进行救援交互，碰到地面或跳跃时结束被发射状态。火炮内不会被投掷道具及部分技能命中。若火炮内老鼠进入虚弱，则火炮会提前消失。同一房间最多出现两个火炮。火炮会对所有角色展示在小地图上。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        // cancelableSkill: '不确定是否可被打断', // FIXME
        // cancelableAftercast: '不确定是否可取消后摇', // FIXME
        forecast: 0.7,
        aftercast: 0.3,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '火炮持续15秒。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '火炮持续时间延长。',
            detailedDescription: '火炮持续时间延长至25秒。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '',
            cooldown: 15,
          },
        ],
      },
      {
        name: '无坚不摧',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1PUcYzXE8J/?t=39',
        skillLevels: [
          {
            level: 1,
            description: '投掷道具命中猫咪时，额外造成短暂的减速。',
            detailedDescription:
              '投掷道具命中敌方时，使其移速降低20%，跳跃能力降低10%，持续3.5秒。',
          },
          {
            level: 2,
            description: '挣扎速度变快；挣脱后获得短暂的护盾和加速效果。',
            detailedDescription:
              '[挣扎速度提升50%](即通常情况下挣扎时间缩短为13.33秒)；挣脱后获得一层护盾，护盾存在期间移速增加15%，护盾持续5秒。',
          },
          {
            level: 3,
            description: '墙缝增伤增加。',
            detailedDescription: '{破坏力}增加1.3。',
          },
        ],
      },
    ],
    specialSkills: [
      { name: '绝处逢生', description: '铁血拉距快速起身。' },
      { name: '干扰投掷', description: '提高干扰能力。' },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '便于购买道具，伤害、减速与眩晕猫咪。',
      },
    ],
  },

  /* ----------------------------------- 国王杰瑞 ----------------------------------- */
  国王杰瑞: {
    description:
      '国王杰瑞是玩具国的王，他胸怀天下，对自己的子民良善，但对破坏国家安定的野猫毫不留情。',
    EnglishName: 'King Jerry',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description: '{主动技能}是救援的强力手段。',
        additionalDescription:
          '护盾瞬发、权杖无敌、战旗秒救，开局就拥有一定救援能力，成型后更难被拦截。',
      },
      {
        tagName: '辅助',
        level: 4,
        description: '一武团队无敌，二武多种团队增益。',
        additionalDescription:
          '权杖可以给范围内的队友施加群体无敌，是接应与抗伤的好手段；战旗集视野、输出、破局、自保等多种强效团队增益于一体，拥有极高的上限。',
      },
      {
        tagName: '砸墙',
        level: 4,
        weapon: 2,
        description: '攻击战旗可以提供强大的团队破坏墙缝能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '国王权杖',
        pattern: '121212000',
        weaponType: 'weapon1',
        description: '如果作为副救或是需要补推，可以四级先点被动。',
        additionaldescription: '',
      },
      {
        id: '国王战旗',
        pattern: '313131000',
        weaponType: 'weapon2',
        description: '情况紧急时，可以六级先点三级小盾，但尽量保证墙缝期能出三级战旗。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-无畏', 'B-逃之夭夭', 'C-救救我'],
        description:
          '无畏流派卡组，操作简单，但被救下的队友难以逃跑。推荐新手使用，也可用于对抗图多盖洛、米特等猫咪。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '舍己流派卡组。逃窜不屈可提高自身自保能力。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '缴械可对猫咪进行干扰，进而保护队友或安全地进行火箭救援。',
      },
    ],

    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],

    skills: [
      {
        name: '威严光盾',
        aliases: ['小盾'],
        type: 'active',
        description: '短暂获得一层护盾。',
        detailedDescription:
          '获得1层护盾，持续5秒；并[清除部分技能状态](清除由垃圾桶导致的臭气持续伤害、牛皮鞭导致的减速、感同身受导致的反向与失明、记录美好瞬间导致的被拍摄状态)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=5.2',
        skillLevels: [
          {
            level: 1,
            description: '短暂获得一层护盾。',
            detailedDescription: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '护盾持续期间获得加速。',
            detailedDescription: '护盾持续期间获得10%加速。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '改为获得两层护盾。',
            detailedDescription: '改为获得2层护盾；护盾持续期间获得20%加速。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '国王权杖',
        aliases: ['大盾'],
        type: 'weapon1',
        description: '给予附近友方短暂的无敌。',
        detailedDescription:
          '使半径450范围内的友方（含自身）获得2.8秒的{无敌}状态，并[清除部分技能状态](清除由垃圾桶导致的臭气持续伤害、牛皮鞭导致的减速、感同身受导致的反向与失明、记录美好瞬间导致的被拍摄状态)。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        forecast: 0.9,
        aftercast: 1,
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=81.9',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '扩大技能生效范围。',
            detailedDescription: '技能生效半径扩大至700。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '增加无敌的持续时间。',
            detailedDescription: '无敌的持续时间延长至3.8秒。',
            cooldown: 30,
          },
        ],
      },
      {
        name: '国王战旗',
        type: 'weapon2',
        description:
          '召唤战旗，为碰触的友方提供增益。战旗被碰触若干次后将获得强化。同一时间只能存在一面战旗。\n{攻击战旗}：提高攻击增伤（强化：额外获得墙缝增伤、免疫受伤）\n{救援战旗}：提高救援速度。（强化：改为[获得瞬息救援能力](碰触火箭直接救援成功)）\n{守护战旗}：解除虚弱；Hp较低时将缓慢恢复Hp并加速（强化：改为解除虚弱并获得一层护盾）\n{感知战旗}：对猫隐藏小地图位置（强化：额外显示猫的位置）\n{灵巧战旗}：提高跳跃高度（强化：额外获得[二段跳](从上一次接触平台/地面起，至多进行2次跳跃，再次接触平台/地面时重置。多个额外跳跃效果取次数最高的生效)）。',
        detailedDescription:
          '在身前略高于地面的位置召唤战旗，为碰触的友方老鼠提供增益，战旗存在15秒。战旗被碰触若干次后获得强化。战旗具有重力，无碰撞体积，会因受力而移动。同一时间只能存在一面战旗。获得战旗效果后的15秒内无法再次获得同等级的效果。机器鼠不会继承战旗的增益效果。\n{攻击战旗}：增加35攻击增伤，持续10秒（强化：额外增加2点墙缝增伤、免疫受伤）\n{救援战旗}：提高100%救援速度，持续5秒（强化：改为[获得瞬息救援能力](碰触火箭直接救援成功)，持续5秒。以该方式救下队友不计入赛后的数据统计）\n{守护战旗}：解除虚弱；Hp低于30%时，以7.5/s的速度恢复Hp，加速25%，并解除反向、失明、受伤等异常状态，持续2秒（强化：改为解除虚弱并获得一层护盾，持续4秒。）\n{感知战旗}：对猫隐藏小地图位置，持续10秒（强化：额外显示5秒猫的位置）\n{灵巧战旗}：提高50%跳跃高度，持续5秒（强化：额外获得[二段跳状态](从上一次接触平台/地面起，至多进行2次跳跃，再次接触平台/地面时重置。多个额外跳跃效果取次数最高的生效)）。', // 感知战旗可以感知所有敌方单位
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['道具键*'],
        forecast: 0.9,
        aftercast: 0.5,
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=100.25',
        skillLevels: [
          {
            level: 1,
            description: '战旗被碰触两次后获得强化。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '战旗被碰触一次后即获得强化。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '战旗被召唤时即为强化状态。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '闪电救援',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '如果存活的队友都处于健康状态，则自己的推速提升。',
            detailedDescription: '如果存活的队友都处于健康状态，则自己的推速提升30%。',
          },
          {
            level: 2,
            description: '提升救援速度。',
            detailedDescription: '救援速度提升30%。',
          },
          {
            level: 3,
            description: '从火箭上救下队友后，彼此移速短暂提升。',
            detailedDescription: '从火箭上救下队友后，彼此移速各提高15%，持续3秒。',
          },
        ],
      },
    ],
    specialSkills: [{ name: '绝处逢生', description: '通用特技。' }],
  },

  /* ----------------------------------- 剑客杰瑞 ----------------------------------- */
  剑客杰瑞: {
    description:
      '来自法国的剑客杰瑞，是顶级的剑术大师，他常常冲锋陷阵在最前，是所有老鼠敬仰的英雄。',
    EnglishName: 'Mouseketeer Jerry',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '拥有极高的输出和武器的控制，技能提供续航。',
        additionalDescription:
          '高等级时可在打出大量伤害的同时控制猫数秒；双武器均可与{干扰投掷}配合。',
      },
      {
        tagName: '后期',
        level: 2,
        weapon: 1,
        description:
          '高等级{剑舞华尔兹}能先手打出控制，配合{主动技能}更能造成连续控制；{3级被动}提供极高Hp加成。',
        additionalDescription: '',
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '道具起手，衔接武器技能打出连控。',
      },
      {
        name: '冰冻保鲜',
        description: '使用冰冻保鲜配格挡，既可拖格挡CD，在冰保结束后也可以使用格挡反击',
      },
    ],
    skillAllocations: [
      {
        id: '剑舞华尔兹',
        pattern: '20212[1100]',
        weaponType: 'weapon1',
        description: '对于难以被有效输出干扰的猫，出于自保可八级点出{3级被动}。',
        additionaldescription: '',
      },
      {
        id: '常规格挡',
        pattern: '303131100',
        weaponType: 'weapon2',
        description: '常规加点。对于不怕灌伤的猫，可以十级再点{3级格挡之剑}。',
        additionaldescription: '',
      },
      {
        id: '自保格挡',
        pattern: '303100113',
        weaponType: 'weapon2',
        description: '用于打缺乏伤害的猫，偏自保，建议配合卡组3使用。',
      },
      {
        id: '剑舞（弃被动）',
        pattern: '122121000',
        weaponType: 'weapon1',
        description: '主点苹果和剑，弥补剑舞CD长的缺点，以便随时有霸体加速增强自保',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: [
          'S-铁血',
          'S-舍己',
          'C-救救我',
          [
            CardGroupType.Or,
            [CardGroupType.And, 'A-投手', 'B-绝地反击'],
            [CardGroupType.And, 'B-精准投射', 'B-绝地反击'],
            [CardGroupType.And, 'A-逃窜', 'C-不屈'],
            [CardGroupType.And, 'B-绝地反击', 'C-不屈'],
          ],
        ],
        description:
          '《投手》+《绝地反击》为双武器通用卡组，{投手}可换{应激反应}，有效输出的同时保证自保。《精准投射》+《绝地反击》为二武常用卡组，配合控制与{干扰投掷}，随时拥有反杀能力，上限极高。《逃窜》+{不屈}用于对抗不怕剑杰干扰的猫，偏自保，{逃窜}可换{应激反应}。若无21知识点则带最后一套{绝地反击}+{不屈}。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '剑与苹果',
        type: 'active',
        description:
          '切碎并吃掉苹果，解除[部分不良状态](包括失明、反向等效果，不包括受伤)、减少武器技能CD、恢复或回复Hp。',
        detailedDescription:
          '切碎并吃掉苹果，解除[部分不良状态](包括部分反向、失明，穷追不舍的标记减速，牛皮鞭的减速)、减少武器技能CD、恢复或回复Hp。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '武器技能CD减少10秒；获得短暂的Hp恢复效果。',
            detailedDescription: '武器技能CD减少10秒；获得10Hp/秒的恢复效果，持续5秒。',
            cooldown: 10,
          },
          {
            level: 2,
            description: '武器技能CD减少20秒；改为立刻回复Hp。',
            detailedDescription: '武器技能CD减少20秒；改为立刻回复50Hp。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '武器技能CD减少40秒；额外在一段时间内提升攻击增伤。',
            detailedDescription:
              '武器技能CD减少40秒；状态期间使{攻击力}+15，且持续时间延长至15秒。',
            cooldown: 10,
          },
        ],
        cooldownTiming: '释放后',
        canHitInPipe: false,
        forecast: 1.1,
        aftercast: 0,
      },
      {
        name: '剑舞华尔兹',
        type: 'weapon1',
        description: '使用三段剑舞近身攻击，造成伤害；前两段额外造成减速，第三段额外造成眩晕。',
        detailedDescription:
          '剑客杰瑞施放三段攻击，对猫造成不同的攻击效果。前两段会对前方200、后方50范围内的敌方造成伤害，并降低移速和跳跃能力，持续数秒；第三段会对前方200、后方70范围内的敌方造成伤害，并使其眩晕数秒（会掉落道具和老鼠）。\n开始释放技能后的10秒内可以再次点击技能释放下一段，否则进入CD。',

        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
            detailedDescription:
              '第一段：造成{5*}伤害并降低30%移速和15%跳跃能力，持续2秒。\n第二段：造成{5*}伤害并降低50%移速和25%跳跃能力，持续2.5秒。\n第三段：造成{5*}伤害并使其眩晕3秒。',
          },
          {
            level: 2,
            description: '挥剑时免疫控制效果；挥剑后短暂提升移速和跳跃高度。',
            cooldown: 30,
            detailedDescription:
              '技能前摇期间获得霸体效果，技能造成的跳跃能力降低效果提升，施放完成后自身获得增益。\n第一段：跳跃能力改为降低17.5%；释放后自身提升10%移速和5%跳跃能力，持续3秒；\n第二段：跳跃能力改为降低27.5%；释放后自身提升20%移速和10%跳跃能力，持续4秒；\n第三段，自身提升30%移速和15%跳跃能力，持续5秒。',
          },
          {
            level: 3,
            description: '第一段剑舞额外造成短暂眩晕。',
            cooldown: 30,
            detailedDescription:
              '第一段：对敌方额外造成2秒眩晕，且跳跃能力改为降低20%。\n第二段：对敌方跳跃能力改为降低30%。',
          },
        ],

        parts: [
          {
            cueRange: '无音效',
            forecast: 0.35,
            aftercast: 0,
            canUseInAir: true,
            canHitInPipe: false,
            cooldownTiming: '释放后',
            cancelableSkill: '不可主动打断',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
          {
            cueRange: '无音效',
            forecast: 0.35,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: '不可主动打断',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
          {
            cueRange: '无音效',
            forecast: 0.6,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: '不可主动打断',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '格挡之剑',
        type: 'weapon2',
        description:
          '举剑格挡，期间无敌。受爪刀攻击后反击，也可再次点击技能键主动攻击，造成伤害和眩晕。反击后，技能键短暂替换为翻滚。',
        detailedDescription:
          '原地进入1.4秒的格挡状态，该阶段下自身无法移动、获得{无敌}、使撞击自身的{斗牛}消失。受到爪刀攻击时进入反击阶段，0.4秒前摇后对猫造成伤害和1.8秒眩晕。反击也可通过再次点击技能键主动释放，对前方224、后方128范围内的敌方造成同等效果。\n反击释放后，1.2秒内技能键被替换为翻滚。翻滚阶段下，[向前以1120/秒的速度滚动0.9秒](可通过跳跃键打断)。翻滚开始或1.2秒未翻滚后，技能进入cd。被动触发的格挡反击[无视距离且必定命中](包括管道中的猫咪)、触发后自身回复25Hp并减少7秒本技能CD。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '无前摇',
        cancelableAftercast: ['道具键*', '跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '反击造成{15*}伤害。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '',
            detailedDescription: '',
            cooldown: 7,
          },
          {
            level: 3,
            description: '增加反击伤害。',
            detailedDescription: '反击改为造成{30*}伤害。',
            cooldown: 7,
          },
        ],
        canHitInPipe: false,
        forecast: 0,
      },
      {
        name: '越战越勇',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '攻击力提升。\n对猫的技能和道具累计命中5次后，下次救援火箭的交互速度提升100%。',
            detailedDescription:
              '攻击力+10。\n对猫的技能和道具累计命中5次后，下次救援火箭的交互速度提升100%（与火箭交互时生效，生效后消耗，无时间限制）。',
          },
          {
            level: 2,
            description: '减少虚弱时间。',
            detailedDescription: '自身受到的{鼠虚弱}状态持续时间降低至原本的0.6倍。',
          },
          {
            level: 3,
            description: '提升Hp上限。',
            detailedDescription: '提升50点Hp上限。',
          },
        ],
      },
    ],
    aliases: ['剑杰', '剑客杰猫'],
  },

  /* ----------------------------------- 泰菲 ----------------------------------- */
  泰菲: {
    description:
      '可爱的小婴儿泰菲，总是将自己吃得圆滚滚的，他非常依赖叔叔杰瑞，火箭筒是他最爱的玩具。',
    EnglishName: 'Tuffy',
    mousePositioningTags: [
      {
        tagName: '破局',
        level: 4,
        weapon: 1,
        description:
          '{火箭炮}能炸开{老鼠夹}和{叉子}，破坏猫的布局；对战低伤猫可以利用Lv.2{茁壮成长}赋予的{弱霸体}和减伤强行推奶酪',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 3,
        description:
          '{火箭炮}和{感应雷}可以提供可观的砸墙伤害；Lv.3{茁壮成长}免疫{鞭炮(组合)}和{墙缝泡泡}的伤害和爆炸眩晕，可辅助砸墙。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 3,
        description: '推速较快，Lv.2{茁壮成长}推奶酪有{弱霸体}和减伤，适合做主推或副推',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        level: 3,
        description:
          '{火箭炮}可以出其不意地对猫造成干扰，{感应雷}可以进行威慑，逼迫猫离开感应雷追踪爆炸范围或交技能进行防御，减少队友溜猫的压力；{圆滚滚}大大增加泰菲的容错率\n（缺点是两个武器CD都较长，圆滚滚真空期内容易被击倒）',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '多在单排无稳救阵容中体现，{冰冻保鲜}或{绝处逢生}配合{圆滚滚}可以大幅增加泰菲的容错，抵挡攻击，再加上{感应雷}威慑，操作得当能够实现稳定救援，可作为替补救援位\n(缺点是怕高伤和霸体)',
        additionalDescription:
          '缺点是怕高伤，怕猫的防御、攻击、控制手段多，冰冻保鲜、绝处逢生CD较长',
      },
      {
        tagName: '后期',
        level: 1,
        description: '后期有一定强度',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '火箭筒（主战）',
        pattern: '12122[1000]',
        weaponType: 'weapon1',
        description:
          '弃被动加点，推荐打高伤猫或非防守猫时用。7级视情况加点，如果已进入或快进入墙缝期就先点Lv.3{圆滚滚}（墙缝期Lv.1,Lv.2{茁壮成长}的作用不如Lv.3{圆滚滚}的移速加成），如果还远未到墙缝期就一直点出Lv.3{茁壮成长}（墙缝期Lv.3{茁壮成长}免疫爆炸伤害和眩晕的作用大于Lv.3{圆滚滚}），Lv.3{圆滚滚}留到最后点。',
      },
      {
        id: '火箭筒（自保）',
        pattern: '121000221',
        weaponType: 'weapon1',
        description:
          '主被动加点，推荐打低伤猫或防守猫时用。先点出Lv.2{圆滚滚}再点满{茁壮成长}，增强自保能力，在最后一块奶酪时减少推奶酪压力',
      },
      {
        id: '感应雷',
        pattern: '131300[30]1',
        weaponType: 'weapon1',
        description:
          '8级看个人喜好加点，Lv.3{隐形感应雷}可以提高对墙缝的伤害，Lv3{茁壮成长}可以免疫爆炸伤害和{爆炸眩晕(状态)}，在墙缝期都有很大作用',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '20知识量卡组',
        groups: [
          {
            cards: ['S-舍己', 'S-铁血', 'C-救救我', 'B-应激反应', 'C-不屈'],
            description:
              '生存卡组。{应激反应}在受伤时提高逃跑能力，在有高低差的地形可以配合Lv.2{圆滚滚}迅速与猫拉开垂直距离；{不屈}增加缺员后的续航',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
            description:
              '平扰卡组，用来打依赖瓜刀或有{无敌(状态)}{霸体}枝能的猫。秦菲的{火箭筒}无法取消后接，{缴械}可以在一定程度上防止霸体卡后摇反杂。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'S-护佑', 'C-救救我'],
            description: '生存卡组。{护佑}用于前期三级自保',
          },
        ],
        description: '待补充',
        defaultFolded: false,
        detailedDescription: '适合未解锁21知识量时作为过渡使用',
      },
      {
        id: '21知识量卡组',
        groups: [
          {
            cards: [
              'S-舍己',
              'S-铁血',
              'C-救救我',
              'A-逃窜',
              [CardGroupType.Or, 'B-应激反应', 'C-不屈'],
            ],
            description:
              '以{逃窜}为中心卡的生存卡组。用于牵制救援充足的阵容。{不屈}和{逃窜}配合Lv.2{茁壮成长}，被追击时速度快，Hp恢复快，续航稳定，增加容错，也可以把{不屈}换成{应激反应}，被针对时获得更高的逃跑能力。',
          },
          {
            cards: [
              'S-舍己',
              'S-铁血',
              'C-救救我',
              'A-投手',
              [CardGroupType.Or, 'B-孤军奋战', 'C-不屈'],
            ],
            description:
              '以{投手}为中心卡的干扰、牵制卡组。{投手}能被**{火箭炮}**触发，{投手}赋予猫的减速能增加{感应雷}命中率，配合{孤军奋战}的加速利于与猫拉开距离。也可以把{孤军奋战}换成{不屈}增加缺员后的续航。',
          },
          {
            cards: [
              'S-舍己',
              'S-铁血',
              'C-救救我',
              'A-闭门羹',
              [CardGroupType.Or, 'C-不屈', 'B-应激反应'],
            ],
            description:
              '以{闭门羹}为中心卡的牵制卡组，**仅可在门图使用**，相对适合感应雷。{闭门羹}配合{感应雷}可以将猫强行控在门口，{闭门羹}配合{应激反应}可产生爆发速度迅速逃跑或跑向下一个门继续牵制。也可以把{应激反应}换成{不屈}增加缺员后的续航。该卡组也十分适合对战**{苏蕊}**，（苏蕊的跳舞无法免疫{闭门羹}产生的眩晕，且苏蕊大多不带乘胜，翻滚真空期情况下很难追上速度爆发的泰菲）',
          },
        ],
        description: '待补充',
        defaultFolded: false,
        detailedDescription: '解锁21知识量后使用，具有更高上限',
      },
      {
        id: '无铁血卡组',
        groups: [
          {
            cards: ['S-舍己', 'C-救救我', 'A-逃窜', 'B-应激反应', 'C-不屈', 'B-孤军奋战'],
            description:
              '生存卡组。将{逃窜}、{应激反应}、{不屈}、{孤军奋战}这几张可以提高移速的卡一起配上，被追击时可以获得极大的爆发速度，利于逃跑',
          },
          {
            cards: ['S-舍己', 'C-救救我', 'A-闭门羹', 'B-应激反应', 'C-不屈', 'B-孤军奋战'],
            description:
              '牵制、生存卡组，仅可在门图使用，相对适合{感应雷}。{闭门羹}配合{感应雷}可以将猫强行控在门口。{闭门羹}配合{应激反应}、{孤军奋战}、{不屈}可产生爆发速度迅速逃跑或跑向下一个门继续牵制。该卡组也十分适合对战**{苏蕊}**，（苏蕊的跳舞无法免疫{闭门羹}产生的眩晕，且苏蕊大多不带乘胜，翻滚真空期情况下很难追上速度爆发的泰菲）',
          },
          {
            cards: ['S-舍己', 'C-救救我', 'A-投手', 'S-缴械', 'B-应激反应'],
            description:
              '牵制、干扰卡组。{投手}和{缴械}能被{火箭炮}触发，{投手}赋予猫的减速能增加{感应雷}命中率，配合{应激反应}利于与猫拉开距离。',
          },
        ],
        description: '待补充',
        defaultFolded: false,
        detailedDescription:
          '高风险卡组，**建议四排时带**，绝对不能在队伍存在**{仙女鼠}**、**{玛丽}**、**{米雪儿}**时使用，否则会导致被击倒时队友无法及时扶起。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '蛋糕', '灰花瓶', '隐身饮料'],
        description:
          '干扰、救援方案。{胡椒瓶}、{灰花瓶}既能用于释放原地瞬爆火箭炮，又可以对猫造成一定程度的干扰；{蛋糕}可用于减{火箭筒}、{隐形感应雷}的CD，减少关键时刻武器还在CD中的风险；{隐身饮料}用于关键时刻买给队友或自己来救援。',
      },
    ],
    skills: [
      {
        name: '圆滚滚',
        type: 'active',
        description:
          '向前滚动一段距离，滚动期间{禁用道具}且无法调整移动方向，可通过跳跃取消滚动。\n技能可以在{眩晕}时释放，并解除自身的眩晕，但会略微延长技能CD。',
        detailedDescription:
          '以高于基础值的[固定速度](不受泰菲本身所处的加/减速状态的影响)向前滚动一段时间。\n      滚动期间**{禁用道具}**且**无法调整移动方向**，可通过跳跃取消滚动。\n      技能可以在**{眩晕}**状态下使用，解除该眩晕，**但当次CD增加6s**。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        videoUrl: 'https://www.bilibili.com/video/BV158Kr6xEzn/?t=0',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '以1000/s的固定速度向前滚动1.2s。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '滚动时暂时获得{无敌}；滚动后短暂提升{跳跃能力}。',
            detailedDescription:
              '滚动期间获得**{无敌(状态)}**；滚动终止时无敌状态立即消失，自身{跳跃能力}提升30%，持续1s。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '滚得更快更远。',
            detailedDescription: '滚动时间延长至1.5s；滚动速度提高至1200/s。',
            cooldown: 12,
          },
        ],
        cueRange: '全图可见',
        aliases: ['滚动'],
      },
      {
        name: '火箭筒',
        type: 'weapon1',
        description:
          '发射一枚{火箭炮}，直接命中敌方造成一段伤害，接触敌方/墙缝/墙壁/平台/其他道具后爆炸，对小范围内敌方和墙缝再次造成一段伤害和{爆炸眩晕(状态)}。爆炸可以{击飞}道具。',
        detailedDescription:
          '在身前70、上方80发射一枚碰撞体积约为101×49矩形的{火箭炮}，发射后自身受到后坐力作用，向后移动极小距离。\n      火箭炮沿[抛物线y=-(3/12800)×²](以火箭炮初始位置为坐标原点)做平抛运动，在水平方向以1600/s的速度做匀速直线运动，在竖直方向以-1200/s²的加速度做匀加速直线运动。\n      火箭炮直接命中敌方时造成一段伤害，对猫造成20%减速，持续2.5秒，且可触发[投掷效果](指的是以投掷命中为条件的效果，包括知识卡-缴械/精准投射/投手/追风，特技-干扰投掷/勇气投掷)；火箭炮直接命中墙缝时对墙缝造成4.5伤害(泰菲自身破坏增伤0.5+火箭炮基础破坏伤害4)。\n      火箭炮碰撞敌方角色/墙壁/平台/地面/部分{道具}/部分{衍生物}后会被销毁并瞬间爆炸，对480×480矩形范围内的敌方额外造成伤害和{爆炸眩晕(状态)}，击飞部分道具/衍生物。爆炸也会对范围内墙缝额外[造成3.5伤害](泰菲自身破坏增伤0.5+爆炸冲击波基础伤害3)，**并有50%概率再额外造成5伤害**。\n      **先结算直接命中伤害，后结算爆炸伤害**。',

        videoUrl: 'https://www.bilibili.com/video/BV158Kr6xEzn/?t=75',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '火箭炮直接命中造成{50*}伤害。\n       火箭炮爆炸造成{15*}伤害和1.5s{爆炸眩晕(状态)}。',
            cooldown: 30,
            charges: 1,
          },
          {
            level: 2,
            description: '爆炸的伤害和眩晕时间得到提升。',
            detailedDescription: '爆炸伤害提升至{30*}。\n       爆炸眩晕时间延长至2.1s。',
            cooldown: 30,
            charges: 1,
          },
          {
            level: 3,
            description: '',
            detailedDescription: '',
            charges: 2,
            cooldown: 30,
          },
        ],
        aliases: ['炮', '大炮'],

        parts: [
          {
            cueRange: '全图可见',
            forecast: 0.67,
            aftercast: 0.77,
            canUseInAir: true,
            canHitInPipe: false,
            cancelableSkill: '不可主动打断',
            canMoveWhileUsing: true,
            cancelableAftercast: '不可取消',
          },
        ],
      },
      {
        name: '隐形感应雷',
        aliases: ['地雷', '感应雷'],
        type: 'weapon2',
        description:
          '放下{感应雷}，感应雷短时间后会{隐身(状态)}。感应雷在敌方靠近时解除隐身，并在倒计时1.5秒后飞向敌方并爆炸，造成一段伤害和{爆炸眩晕(状态)}。',
        detailedDescription:
          '放下{感应雷}，感应雷在1s后{隐身(状态)}，30s后自然销毁。\n      感应雷被道具击中后会开始1.5s预警，后原地爆炸\n      感应雷爆炸会对以感应雷为中心256×256的矩形范围内的敌方造成伤害和{爆炸眩晕(状态)}，[并击飞范围内所有角色](老鼠受到的力是猫的3倍)。感应雷爆炸后也会对在其爆炸范围内的墙缝造成一定伤害。\n     非隐身状态的敌方进入以感应雷为中心约610×389的矩形感应区时，感应雷会解除隐身，并开启1.5s预警，后以约3840/s的速度飞向首位触发者，追踪0.5s后爆炸或者追踪成功立即爆炸。地雷飞行时会与道具碰撞，并击飞道具，**将被碰撞道具的速度强行修改为3840/s**。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        forecast: 0.2,
        aftercast: 0,
        videoUrl: 'https://www.bilibili.com/video/BV158Kr6xEzn/?t=218',
        skillLevels: [
          {
            level: 1,
            description: '感应雷不会击落敌方手中的老鼠和道具。',
            detailedDescription:
              '**感应雷不可击落敌方手中的老鼠和道具**。\n       感应雷爆炸对敌方的伤害为{50*}，对墙缝的伤害为{_5*}。',
            cooldown: 22,
            charges: 1,
          },
          {
            level: 2,
            description: '感应雷可击落敌方手中的老鼠和道具。',
            detailedDescription: '**感应雷可击落敌方手中的老鼠和道具**。',
            cooldown: 22,
            charges: 2,
          },
          {
            level: 3,
            description: '感应雷对敌方和墙缝的伤害得到提升。',
            detailedDescription: '感应雷对敌方的伤害提升至{80*}，对墙缝的伤害提升至{_15*}。',
            cooldown: 22,
            charges: 2,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '茁壮成长',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV158Kr6xEzn/?t=324',
        skillLevels: [
          {
            level: 1,
            description: '吃{食物（组合）}更快；{牛奶}加速生效期间，暂时提升25Hp上限。',
            detailedDescription:
              '吃{食物(组合)}速度提升3%。\n       {牛奶}或{仙丹}加速状态生效[期间](对应状态结束时同步解除加成)，Hp上限提高25。（{蛋糕}也具备[类似效果](蛋糕减CD效果期间也会使Hp上限提高25，且与牛奶或仙丹的状态各自独立结算。但现版本蛋糕状态仅持续0.1秒，因此该效果不易察觉)）',
          },
          {
            level: 2,
            description:
              '可以持续缓慢恢复Hp（{受伤}、被{抓起}也触发）；吃{食物（组合）}速度进一步提升；推奶酪时不会因受到可致{眩晕}的攻击而被打断；并在搬奶酪、推奶酪、火箭救援时额外获得短暂的健康值缓慢恢复和减伤。',
            detailedDescription:
              '吃{食物(组合)}速度提升20%。\n       **自身不处于{牛奶}或{仙丹}加速状态生效期间时**，每秒额外恢复2.5Hp（{受伤}或被{抓起}期间也生效）。\n       在搬奶酪、推奶酪、火箭救援[期间](终止交互立即清除)，{受击减伤}+23%，每秒额外恢复0.2Hp；在推奶酪[期间](终止推奶酪时立即清除)，还会额外获得{霸体(状态)}。',
          },
          {
            level: 3,
            description: '免疫部分爆炸伤害和{爆炸眩晕(状态)}；吃{食物（组合）}速度再次提升。',
            detailedDescription:
              '吃{食物(组合)}速度提升44%。\n       可免疫{小鞭炮}、{鞭炮束}、{炸药堆}、{火药桶}、{猫咪泡泡}、{墙缝泡泡}、Lv.2{感同身受}产生的{爆炸眩晕(状态)}及伤害。',
          },
        ],
        description: '吃{食物(组合)}速度逐渐提高，并在一定条件下获得其它增益效果',
        detailedDescription: '逐渐增加吃{食物(组合)}速度，并在一定条件下获得其他增益效果。',
      },
    ],

    specialSkills: [
      {
        name: '魔术漂浮',
        description:
          '{魔术漂浮}可以用来卡视野或骗攻击。增强泰菲的机动性，在空中开启魔术漂浮再使用{火箭筒}可以有效避免火箭筒在前摇时被猫打断释放；在空中的时候使用{隐形感应雷}再点漂浮可以防止猫卡落点；感应雷爆炸能助推漂浮实现漂升',
      },
      {
        name: '绝处逢生',
        description:
          '可以在队伍无稳救时带，用于硬抗控制伤害，对战相对来说于控多伤少的猫（如{追风汤姆}）时带，{绝处逢生}的解控和回血配合{圆滚滚}的解控和无敌一共可以免疫两次硬控，并补充损失的Hp。',
      },
      {
        name: '应急治疗',
        description:
          '打{米特}时携带。救火箭上的队友后秒点Lv.2{圆滚滚}再点{应急治疗}，可以防止残血被{胡椒罐头烟雾}收割。配合Lv.2{茁壮成长}使用效果很好',
      },
      {
        name: '干扰投掷',
        description:
          '适合新手带，{干扰投掷}可作为先手控制衔接{火箭筒}，提高{火箭炮}命中率（注意不要手快点出无影炮）。也可以先放{隐形感应雷}再迅速用干扰投掷控住猫，大大增加{感应雷}命中率，用于打机动性高、速度快导致炮和地雷不易命中的猫。',
      },
      {
        name: '冰冻保鲜',
        description:
          '通用特技，用于硬抗控制伤害，对战相对控少伤多且伤害持续的猫（如兔八哥、布奇、如玉）时带，{冰冻保鲜}和Lv.2{圆滚滚}的双重{无敌(状态)}可以抵挡绝大部分的灌伤和控制，并且能随时取消释放，防止被卡时间',
      },
    ],

    aliases: [],

    characterRelationOverrides: {
      米特: {
        kind: 'counterEachOther',
        isMinor: true,
        description:
          '泰菲可以用{圆滚滚}解控配合{应急治疗}或{冰冻保鲜}，避免米特利用{胡椒粉}刷尸；米特的攻击手段少，很难卡圆滚滚真空期将泰菲击倒。米特的{野性迸发}积累到一定层数时爪刀伤害高，容易压制Hp低的泰菲；泰菲的{火箭炮}和Lv.2{感应雷}可以击落米特的{胡椒粉罐头}，会协助米特刷尸。',
      },
    },
  },
  /* ----------------------------------- 剑客泰菲 ----------------------------------- */
  剑客泰菲: {
    aliases: ['剑菲'],
    description: '剑客泰菲虽然平时惹祸不断，但在学剑之余，他勤加练习掌握了操控盔甲人的技巧。',
    EnglishName: 'Mouseketeer Tuffy',
    mousePositioningTags: [
      {
        tagName: '救援',
        weapon: 1,
        level: 4,
        description: '头盔的长时间防御使得剑客泰菲具有十分优秀的救援能力。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description:
          '头盔的全体无敌可支持强推，后期也能用无敌砸墙。长枪可以带走夹子，也可以携带队友绕后进攻（如船长室）。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        weapon: 2,
        level: 4,
        description: '携带剑客长枪的剑客泰菲具有较强的机动性和干扰能力。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 4,
        description:
          '2级及以上且有勇气的长枪可以解除队友和自己的受伤和虚弱效果，也可以带着队友转移。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '后期',
        level: 2,
        description: '后期6级8级带来的减少cd和护盾的质变能对长枪剑菲带来很强的后期作战能力。',
        additionalDescription: '',
        weapon: 2,
      },
    ],
    skillAllocations: [
      {
        id: '头盔',
        pattern: '212020011',
        weaponType: 'weapon1',
        description: '',
      },
      {
        id: '剑客长枪',
        pattern: '313030011',
        weaponType: 'weapon2',
        description: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'B-飞跃', 'B-绝地反击'],
        description:
          '适合头盔的机动性卡组。飞跃提升机动性，绝地反击在救下人后极大提高容错率。若未解锁21知识点可舍弃绝地反击。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'B-绝地反击', 'B-精准投射'],
        description:
          '适合长枪的高伤卡组。对低血量猫对策卡，精准投射可连控。若未解锁21知识点可舍弃绝地反击。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-飞跃', 'C-救救我', 'C-不屈'],
        description:
          '{不屈}大大弥补残局下只要一露面就极易被死追而难以脱身的缺点，同时因为加成的额外移速也使得在救人或墙缝期出现难以靠近的情况下可以更远位置开头盔，或是砸墙情况下也因为高移速可以快速离场的原因可以多砸一会不用特别提前离开墙缝，大大增加了机动性与自保能力',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '勇气冲刺',
        type: 'active',
        description:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间暂时$解禁$text-green-700 dark:text-green-300#。\n向前冲刺，并恢复少量勇气。途经敌方会对其造成伤害，但消耗一定的勇气。',
        detailedDescription:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间暂时$解禁$text-green-700 dark:text-green-300#。\n以150%的移速向前冲刺0.7秒，并恢复6点勇气；冲刺时免疫大多数状态；冲刺途经敌方会对其造成{15*}伤害（[*](*注意：勇气释放期间自带攻击力+15，会对该伤害进行加成)），但消耗20点勇气。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: ['移动键', '跳跃键', '道具键*', '药水键', '本技能键', '其他技能键'], // FIXME
        forecast: 0.2,
        aftercast: 0.3, // FIXME
        cooldownTiming: '释放后',
        cancelableSkill: '不可主动打断',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 1.5,
          },
          {
            level: 2,
            description: '冲刺将造成减速；连续命中5次后，清空减速并造成额外伤害和眩晕。',
            cooldown: 1.5,
            detailedDescription:
              '冲刺命中敌方将额外使其移速降低5%，持续5秒，可叠加5层。叠加至5层后清空，对目标造成{25*}伤害（[*](*注意：勇气释放期间自带攻击力+15，会对该伤害进行加成)）和3秒眩晕。',
          },
          {
            level: 3,
            description: '所需命中次数减少到3次。',
            cooldown: 1.5,
            detailedDescription: '减速改为叠加到第3层时清空并触发对应效果。',
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '头盔',
        type: 'weapon1',
        description:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间暂时$解禁$text-green-700 dark:text-green-300#。\n举起{头盔(衍生物)}保护自己和队友，自身获得{无敌}，但惯性显著增大且禁用部分交互；被头盔保护的队友获得{无敌}但{禁用技能}；受到攻击及救下队友均会减少头盔持续时间。',
        detailedDescription:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间暂时$解禁$text-green-700 dark:text-green-300#。\n举起{头盔(衍生物)}保护自己和队友。举起头盔时解除[部分状态](由隐身饮料获得的隐身；由莱特宁-垃圾桶导致的臭气状态；由恶魔汤姆-感同身受2级效果导致的各类控制状态)，期间{无敌}但[行动能力降低](惯性显著增大，等效导致移速约降低3.5%、跳跃能力约降低15%)且只能进行[部分交互](只能进行以下交互：火箭救援、开/关木门、开盒子、使用果盘、使用冰箱/烤箱/炸药堆/唱片机/暖气片/小推车/大钟/长柄斧/厨房挡板、出洞、逃走、开金洞、开上锁的门)；处于头盔范围内的队友获得{无敌}并解除[部分状态](由莱特宁-垃圾桶导致的臭气状态；由恶魔汤姆-感同身受2级效果导致的各类控制状态)，但{禁用技能}。\n头盔[受到攻击](包括爪刀、道具、技能、来自友方的伤害)会减少0.5秒持续时间；成功救下队友时剩余持续时间减半。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可主动打断',
        forecast: 1.5,
        aftercast: 0,
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '头盔持续7.8s。',
            cooldown: 15,

            detailedDescription: '头盔持续8秒。',
          },
          {
            level: 2,
            description: '延长头盔的持续时间。',
            cooldown: 15,
            detailedDescription: '延长头盔的持续时间至13秒。',
          },
          {
            level: 3,
            description: '头盔可以更灵活地移动。',
            cooldown: 15,

            detailedDescription:
              '头盔可以[更灵活地移动](受惯性影响降低，移速和跳跃能力相比之前略微回升)。',
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '剑客长枪',
        type: 'weapon2',
        description:
          '点击技能开始蓄力，期间获得远视，再次拖动技能投掷长枪。根据蓄力时间提高速度。碰到墙壁、地面等障碍时消失。\n长枪会对触碰的敌方造成伤害和减速。投掷后短时间内可再次点击技能瞬移并$挂载$font-bold#到长枪尾部跟随飞行。长枪碰到其它[友方角色](包括猫咪角色)或$可挂载道具$font-bold#时也会将其自动$挂载$font-bold#，至多同时各携带1个。\n长枪上的老鼠进行任何操作都将离开长枪。',
        detailedDescription:
          '点按技能开始蓄力，蓄力期间视野扩大54%但清除由饮料提供的远视状态；再次拖动技能向指定方向投掷{长枪}。蓄力时间越长，长枪速度越快。蓄力至最大值需0.8秒。\n长枪受到的重力显著低于其它物件；在空中会缓慢旋转，最大存在时间为10秒，在碰到墙壁、地面等障碍物时提前消失。\n长枪会对触碰到的敌方造成伤害和负面状态。\n\n长枪投掷后的2秒内解锁二段技能，释放后剑客泰菲将瞬移并$挂载$font-bold#至长枪尾部跟随飞行；长枪碰到其它[友方角色](包括猫咪角色)或$可挂载道具$font-bold#时也会将其自动$挂载$font-bold#，至多同时携带1名其它友方角色与1个道具。\n被$挂载$font-bold#的剑客泰菲及友方角色进行[任何操作](包括松开/按下移动键、跳跃键、道具键、药水键（需要有药水）、技能键和特技键（包括未冷却完成和被禁用的技能；不包括被动技能的图标）、技能加点（包括被动加点）、交互键、进机器鼠键、商店购买道具（仅松开时；若上枪前已经开始购买，那么在长枪上购买完毕不会导致离开长枪）)都将离开长枪，受到眩晕或虚弱会强制离开；剑客泰菲自身被挂载期间受到其它状态，或恰好有平台可落脚时，也会自动脱离长枪。\n被$挂载$font-bold#的投掷道具在碰撞敌方时会自动对敌方造成伤害（等同于被投掷）。\n长枪消失、或被投掷2秒后、或自己上枪后，技能进入CD。\n（$本技能无法在准备间使用$text-blue-700 dark:text-blue-300#）\n\n$可挂载道具$font-bold#：{玻璃杯}、{碗}、{盘子}、{扁盘}、{灰花瓶}、{蓝花瓶}、{香水瓶}、{胡椒瓶}、{高尔夫球}、{打开的老鼠夹}。',

        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '长枪初始速度为320/秒，每1%蓄力将使速度提高3.2/秒。\n命中敌方造成{50*,不可攻击泡泡}伤害，并使其移速降低20%，持续2.5秒。',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '速度大幅提高，蓄力超过60%时会对敌方造成额外控制效果。\n勇气释放期间，长枪命中敌方时使其掉落道具并禁用技能，挂载友方时解除其受伤和虚弱。',
            cooldown: 8,
            detailedDescription:
              '长枪初始速度提高至640/秒，每1%蓄力将使速度提高4.8/秒。\n蓄力进度≥60%但≤100%时，命中敌方改为造成{50*,不可攻击泡泡}伤害和3秒{眩晕}；蓄力进度=100%时，改为造成{75*,不受来源影响,不可攻击泡泡}伤害和3秒眩晕。\n在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间，长枪命中敌方时将使其掉落手中道具并禁用技能5秒，挂载友方时解除其受伤和鼠虚弱状态。',
          },
          {
            level: 3,
            description: '在勇气释放过程中，本技能CD减半。',
            detailedDescription:
              '在[勇气释放](详见剑客泰菲被动技能“勇者无惧”)期间，则本技能进入CD时，返还一半CD。',
            cooldown: 8,
          },
        ],

        parts: [
          {
            cueRange: '本房间可见',
            forecast: 0.15,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
            canMoveWhileUsing: false,
            cancelableAftercast: '无后摇',
          },
          {
            forecast: 0,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: '无前摇',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '勇者无惧',
        type: 'passive',
        description:
          '剑客泰菲天生具备$勇气值$font-bold#机制。\n$勇气积累$font-bold#：持续恢复勇气，无法使用主动和第一武器技能，不会被{斯派克}锁定和抓取。勇气值积累到上限后，转入$勇气释放$font-bold#状态。\n$勇气释放$font-bold#：攻击力增加，每秒消耗3点勇气。勇气值归零后，转入$勇气积累$font-bold#状态。\n\n剑客泰菲能在[获取大部分状态](有关具体触发范围和数值，可查阅各状态的详细介绍栏)时得到额外的勇气值。',
        detailedDescription:
          '剑客泰菲天生具备$勇气值$font-bold#机制。勇气值上限为150点。\n$勇气积累$font-bold#：每秒恢复5点勇气，无法使用主动和第一武器技能，不会被{斯派克}锁定和抓取。勇气值积累到上限后，清除自身持有的[由道具造成的](即由香水瓶或胡椒瓶造成的)反向和失明状态，随后转入$勇气释放$font-bold#状态。\n$勇气释放$font-bold#：攻击力+15，每秒消耗3点勇气。勇气值归零后，转入$勇气积累$font-bold#状态。\n\n除自然增长外，剑客泰菲也能在[获取大部分状态](有关具体触发范围和数值，可查阅各状态的详细介绍栏)时得到额外的勇气值。',
        skillLevels: [
          {
            level: 1,
            description: '勇气值积累的速度提升50%。',
          },
          {
            level: 2,
            description: '勇气值消耗的速度降低20%。',
          },
          {
            level: 3,
            description: '每当勇气值达到最高时，解除受伤状态，并获得一层护盾。',
            detailedDescription:
              '每当勇气值达到上限时，解除[部分状态](包括：受伤；由道具造成的反向和失明；由莱特宁-垃圾桶导致的臭气状态；由恶魔汤姆-感同身受2级效果导致的各类控制状态)，并获得一层持续10秒的护盾。（已有则刷新持续时间）',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '魔术漂浮',
        description: '补充后期头盔高点救人能力和自保，也可为长枪拉开身位蓄力。',
      },
      {
        name: '绝处逢生',
        description: '能在头盔内回复大量生命，也可提高长枪的低下限。',
      },
      {
        name: '干扰投掷',
        description: '和长枪形成连控。',
      },
    ],
  },
  /* ----------------------------------- 牛仔杰瑞 ----------------------------------- */
  牛仔杰瑞: {
    description:
      '牛仔杰瑞拥有很高的音乐天赋，擅长使用吉他鸣奏，热爱自由的他，在草原上过着与世无争的生活。',
    EnglishName: 'Cowboy Jerry',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 2,
        description: '基础推速中上，二级琴加推速。',
        additionalDescription: '二级琴加速后推速达到5.5%每秒，且琴真空期只有5秒。',
      },
      {
        tagName: '干扰',
        level: 4,
        description: '仙人掌和琴的干扰频率高，效果也不错。',
        additionalDescription:
          '但牛仔杰瑞的干扰能力比较偏后期，同时大部分也不是强控，无法直接把老鼠从猫手上救下来。',
      },
      {
        tagName: '后期',
        level: 4,
        description: '后期生存能力和干扰能力大幅提升',
        additionalDescription:
          '高等级牛仔杰瑞可以更加频繁的干扰，从而触发更多霸体，也可以给猫提供更多负面状态。',
      },
    ],
    skillAllocations: [
      {
        id: '一般情况',
        pattern: '022110021',
        weaponType: 'weapon1',
        description: '优先二级琴补推，随后出仙人掌加强干扰能力，再点3级被动加强整体眩晕能力。',
      },
      {
        id: '主琴主被',
        pattern: '022002111',
        weaponType: 'weapon1',
        description: '应对不怕仙人掌的猫，例如汤姆、牛汤',
      },
      {
        id: '主仙人掌',
        pattern: '011210022',
        weaponType: 'weapon1',
        description:
          '应对怕减速的猫，例如斯飞；应对蓄势猫，例如塔拉；火箭下仙人掌方便守火箭，例如米特。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'S-回家', 'C-救救我'],
        contributor: 'qiuyumianmian',
        description: '1级被动免疫碎片，防止回家护盾被碎片打破，进一步提高后期生存能力。',
      },
      {
        cards: [
          'S-舍己',
          'S-铁血',
          'C-救救我',
          [
            CardGroupType.Or,
            'S-缴械',
            [CardGroupType.And, 'A-投手', 'C-不屈'],
            [CardGroupType.And, 'A-逃窜', 'C-不屈'],
          ],
        ],
        description:
          '{缴械}应对依赖爪刀的猫，例如苏蕊，天汤，托普斯。投手应对依赖乘胜追击的猫，例如斯飞，前期就可以有很好的减速效果。逃窜提高容错，加血在部分情况下可以抗住天汤三次伤害，在被牛汤弹弓打中时也方便跑路。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'C-救救我', 'C-不屈'],
        description:
          '破夹专用，也是一个性价比较好的20点卡组。有21点后剩下费用也可以根据情况搭配别的。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '仙人掌',
        type: 'active',
        description:
          '在前方放置{大仙人掌}，被[任意猫咪](即包括敌我双方的猫角色)踩中后使其受到[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)、减速和持续伤害，同时仙人掌消失。\n大仙人掌被[任意老鼠](即包括敌我双方的鼠角色)踩踏数次后也会消失。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: '不可取消',
        forecast: 0.65,
        skillLevels: [
          {
            level: 1,
            description: '大仙人掌被鼠方踩踏2次后会消失。',
            detailedDescription:
              '猫咪踩中仙人掌会受到1.2秒[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)，随后受到以下状态：移速降低15%、跳跃能力降低5%、每秒受到{7.5*,无来源,不受来源影响,无视护盾}伤害，[持续3秒](只造成两次伤害)。\n仙人掌被鼠方踩中2次后也会消失。',
            cooldown: 18,
          },
          {
            level: 2,
            description:
              '减速和伤害效果加强，且消失后分裂为3个效果稍弱的{小仙人掌}。大仙人掌改为被鼠方踩踏1次就消失并分裂；小仙人掌不会因鼠方踩踏而消失。',
            cooldown: 18,
            charges: 2,
            detailedDescription:
              '大仙人掌改为被鼠方踩中1次后就消失；造成的移速降低提升至20%，伤害提升至10，[持续时间延长至5秒](只造成四次伤害)。\n大仙人掌消失后会生成3个{小仙人掌}，猫咪踩中受到0.8秒的[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)，随后受到以下状态：移速降低15%、跳跃能力降低5%，每秒受到{7.5*,无来源,不受来源影响,无视护盾}伤害，[持续3秒](只造成两次伤害)；同一目标3秒内不会重复触发；减速最多叠加3层。\n小仙人掌的减速与持续伤害与大仙人掌独立计算，同时小仙人掌继承大仙人掌的持续时间；小仙人掌不会因鼠方踩踏而消失。',
          },
          {
            level: 3,
            description: '大仙人掌效果进一步提升。',
            cooldown: 18,
            charges: 2,
            detailedDescription:
              '大仙人掌造成的[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)提升至2.2秒且会使敌方掉落手中道具；造成的移速降低提升至25%，[持续时间延长至7秒](只造成六次伤害)。',
          },
        ],
        cueRange: '全图可见',

        detailedDescription:
          '在前方放置{大仙人掌}，持续90秒；被[任意猫咪](即包括敌我双方的猫角色)踩中后会消失，同时使其先受到[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)，随后受到减速及持续伤害；同一目标3秒内不会重复触发；减速最多叠加3层。\n大仙人掌被[任意老鼠](即包括敌我双方的鼠角色)踩踏数次后也会消失。',
      },
      {
        name: '牛仔吉他',
        type: 'weapon1',
        description:
          '开始弹琴，环绕自身产生琴声区域，敌方进入区域会受到短暂[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)，在该区域内会受到可叠加的减速。\n可原地释放或左右拖动释放。拖动释放时，技能期间会向拖动方向移动。',
        detailedDescription:
          '开始弹琴，环绕自身产生琴声区域，敌方进入琴声区域的瞬间会陷入1秒[硬直](硬直本质上为不掉落道具和老鼠的眩晕状态)（离开范围后可再次触发），在范围内每停留0.5秒会受到一次以下状态：移速降低5%，持续5.5秒，可叠加4层。\n弹琴可通过跳跃键、移动键、道具键*主动结束释放；可空中释放但会立刻结束弹琴；最多持续弹奏5秒。\n可点按技能键原地释放，或拖动技能键向左/右侧释放。拖动释放时，技能期间会向拖动方向移动，期间保留惯性。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        canHitInPipe: false,
        forecast: 0.9,
        aftercast: 0.8,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description:
              '提升音乐的范围。弹奏结束后解除部分负面状态并获得移速、跳跃能力、Hp恢复和推速加成。',
            cooldown: 15,
            detailedDescription:
              '提升音乐的范围。弹奏结束后获得以下状态：立即解除{受伤}、{反向}、{失明}、{吻痕}；移速和跳跃能力提高15%，Hp恢复速度提高1.5/秒，推速提高1.5%/秒，持续10秒。',
          },
          {
            level: 3,
            description: '猫咪持续听到音乐会陷入眩晕（有内置CD）。',
            cooldown: 15,
            detailedDescription:
              '琴声减速叠加至4层后清除，并使敌方眩晕1.5秒（不掉落道具和老鼠）；该眩晕结束后，敌方在10秒内免疫本技能导致的眩晕。',
          },
        ],
        cancelableAftercast: ['跳跃键', '移动键', '道具键*'],
        cueRange: '本房间可见',
        cancelableSkill: ['跳跃键'],
        cooldownTiming: '释放时',
      },
      {
        name: '西部风情',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '免疫{碎片}、烫伤和[冰箱减速](不包括后续的眩晕)；缩短受到的眩晕时长。',
            detailedDescription:
              '免疫[“踩碎片”](由碎片或仙人掌树造成)、[“烫伤”](由烤箱、暖气片、灶台、碎酒瓶或炼丹炉造成)、[“冰箱减速”](由冰箱造成；不包括其后续的眩晕)；受到的眩晕类状态的持续时间缩短35%。',
          },
          {
            level: 2,
            description: '技能造成控制效果后获得{霸体}，并提升救援速度。',
            detailedDescription:
              '{主动技能}或{武器技能}[对敌方造成眩晕](实际判定条件为敌方成功受到以下状态之一：仙人掌扎脚（含全部3种同名状态），小仙人掌扎脚，令人烦躁的音乐（仅包括同名状态1和4，即会造成眩晕的两种状态）)时，自身获得以下状态：{霸体}，救援速度提升35%，持续5秒。',
          },
          {
            level: 3,
            description: '技能控制时间延长50%。',
            detailedDescription:
              '[使敌方受到](技能一旦点出就直接作用于场上敌方，因此所有友方牛仔杰瑞均可享受该效果)来自牛仔杰瑞{主动技能}或{武器技能}造成的[眩晕状态](生效范围：仙人掌扎脚（含全部3种同名状态），小仙人掌扎脚，令人烦躁的音乐（仅包括同名状态1和4，即会造成眩晕的两种状态）)的持续时间延长50%。',
          },
        ],
      },
    ],
    aliases: ['牛杰'],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '仙人掌和琴都可以主动取消漂浮',
      },
      {
        name: '干扰投掷',
        description: '增强干扰能力',
      },
    ],
  },

  /* ----------------------------------- 恶魔杰瑞 ----------------------------------- */
  恶魔杰瑞: {
    description: '他是来自神秘之地的恶魔杰瑞，拥有不凡的力量。',
    EnglishName: 'Devil Jerry',
    mousePositioningTags: [
      {
        tagName: '后期',
        level: 4,
        description: '在后期，{3级被动}和{地狱裂隙}的护盾能提供极强的存活能力。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '{1级被动}增加推速，但整体推速并不突出。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '{地狱裂隙}的护盾、加速和传送，配合{3级被动}，有效提高救人成功率，后期可作为替补救人位。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '{恶魔之门}可提供多种增益，并且可以强制传送猫咪和帮助队友逃生。',
        additionalDescription: '辅助效果在车队中明显，单排效果较小。',
      },
      {
        tagName: '破局',
        level: 4,
        description:
          '{恶魔之门}可将猫咪直接传送走，阻止其防守奶酪或墙缝；{3级被动}和{地狱裂隙}的护盾也能提供强推最后一块奶酪的能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '地狱裂隙流',
        pattern: '011001222',
        weaponType: 'weapon1',
        description: '传送被动流，若墙缝期7级则点{三叉戟}。',
      },
      {
        id: '三叉戟流',
        pattern: '022001112',
        weaponType: 'weapon1',
        description: '地狱门被动流，以流放门玩法为主，对传送点位记忆和操作要求较高。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '秋雨绵绵推荐',
        description:
          '“恶杰定位很不清晰，可推可救可牵制，最大的优点就是后期自保。推荐和天杰打幸运体系，一直推奶酪，用{幸运}自救，没跑掉就给{天使祝福}，后期都是生存强的老鼠。”',
        groups: [
          {
            cards: ['S-舍己', 'A-逃窜', 'A-泡泡浴', 'C-不屈', 'C-救救我'],
            description: '后期生存卡组。由于无{铁血}，前期尽量不要撞猫。',
            contributor: 'qiuyumianmian',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-救救我', 'C-不屈'],
            description: '常规卡组。',
            contributor: 'qiuyumianmian',
          },
          {
            cards: ['S-舍己', 'A-逃窜', 'B-幸运', 'C-脱身', 'C-不屈'],
            description: '幸运体系卡组。',
            contributor: 'qiuyumianmian',
          },
          {
            cards: ['S-舍己', 'A-逃窜', 'A-泡泡浴', 'B-破墙', 'C-不屈'],
            description: '对抗图茨使用。由于无{铁血}，前期尽量不要撞猫。',
            contributor: 'qiuyumianmian',
          },
          {
            cards: ['S-无畏', 'S-铁血', 'S-缴械', 'C-救救我'],
            description: '针对米特图多。',
            contributor: 'qiuyumianmian',
          },
        ],
        defaultFolded: false,
      },
    ],

    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '地狱裂隙',
        type: 'active',
        description:
          '标记一个{地狱裂隙(衍生物)}，随后一段时间内再次使用技能标记一处新的裂隙并传送回上一个地狱裂隙，传送后获得短暂加速。',
        detailedDescription:
          '标记一个{地狱裂隙(衍生物)}，同时在12秒内解锁二段技能，期间再次使用技能将标记一处新的地狱裂隙并传送回上一个地狱裂隙，传送后移速提高20%，跳跃能力提高10%，持续3秒。',

        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '传送后额外获得一层护盾。',
            cooldown: 10,
            detailedDescription: '传送后额外获得一层护盾；护盾和加速持续时间延长至4秒。',
          },
          {
            level: 3,
            description: '技能持续时间延长，传送后额外获得两层护盾。',
            cooldown: 10,
            detailedDescription:
              '二段技能持续时间延长至14秒；传送后额外获得两层护盾；护盾和加速持续时间延长至5秒。',
          },
        ],

        parts: [
          {
            cueRange: '全图可见',
            forecast: 0.9,
            aftercast: 0,
            canUseInAir: false,
            cooldownTiming: '释放后',
            cancelableSkill: ['跳跃键'],
            canMoveWhileUsing: false,
            cancelableAftercast: '无后摇',
          },
          {
            cueRange: '全图可见',
            forecast: 1.45,
            aftercast: 0,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
            canMoveWhileUsing: false,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '三叉戟',
        aliases: ['传送门', '流放门'],
        type: 'weapon1',
        description:
          '召唤一个{恶魔之门}，随后一段时间内再次使用技能召唤另一个恶魔之门，存在一段时间后消失。\n友方可与恶魔之门交互，被传送并获得一种随机增益（随距离提升增益持续时间）；敌方碰到传送门后会被强制传送（短时间内不会重复触发）；[处于被投掷状态的道具](被投掷且速度未降为0的道具)碰到传送门也会被传送。[进行传送](包括投掷物传送，友方主动传送，敌方强制传送)会减少传送门的存在时间。',
        detailedDescription:
          '召唤一个{恶魔之门}，同时在一段时间内解锁二段技能，期间再次使用将召唤另一个{恶魔之门}，存在一段时间后消失。\n\n友方可与恶魔之门交互，交互前摇0.9秒，交互后被传送并[随机获得以下8种增益状态中的一种](已有增益时免疫其它增益；重复获得相同增益时刷新持续时间)，其持续时间随传送距离增大（最低15秒，最高45秒）：\n1：$技巧（主动）$text-blue-700 dark:text-blue-300 font-bold#：立即回复25Hp，随后主动技能CD减少70%；\n2：$技巧（武器）$text-blue-700 dark:text-blue-300 font-bold#：立即回复25Hp，随后武器技能CD减少70%；\n3：$专注$text-yellow-700 dark:text-yellow-300 font-bold#：立即回复25Hp，随后推速提高100%；\n4：$兴奋$text-red-700 dark:text-red-300 font-bold#：立即回复25Hp，随后攻击力提升50；\n5：$护盾$text-green-700 dark:text-green-300 font-bold#：立即回复25Hp，随后获得一层护盾；\n6：$远视$text-blue-700 dark:text-blue-300 font-bold#：立即回复25Hp，随后视野范围扩大33%；\n7：$隐身$text-purple-700 dark:text-purple-300 font-bold#：立即回复25Hp，随后获得隐身；\n8：$康复$text-green-700 dark:text-green-300 font-bold#：立即回复100Hp并解除部分{受伤}、{反向}及{失明}状态，随后移速提高20%，跳跃能力提高40%，每秒恢复5Hp。\n\n敌方碰到恶魔之门后会被强制传送，随后10秒内不会再次被传送。\n[处于被投掷状态的道具](被投掷且速度未降为0的道具)碰到恶魔之门也会被传送。\n\n[进行传送](包括投掷物传送，友方主动传送，敌方强制传送)会减少恶魔之门3秒存在时间（[自身首次和第二次传送例外](恶魔杰瑞与他的队友利用召唤的第一个传送门传送不减少存在时间，仅在使用第二个门传送时会减少存在时间)）。',

        // cancelableAftercast: '' // FIXME

        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '二段技能可用时间为9秒；恶魔之门存在时间为18秒。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '二段技能可用时间延长；恶魔之门存在时间延长；敌方被传送后受到额外伤害。',
            detailedDescription:
              '二段技能可用时间延长至12秒；恶魔之门存在时间延长至30秒；敌方被传送后受到{60*,无来源,不受来源影响}伤害。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '友方穿过传送门获得的增益最低持续时间延长。',
            cooldown: 25,
            detailedDescription: '友方穿过恶魔之门获得的增益最低持续时间延长至25秒。',
          },
        ],

        parts: [
          {
            cueRange: '全图可见',
            forecast: 2.2,
            aftercast: 0.2,
            canUseInAir: false,
            canHitInPipe: false,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
            canMoveWhileUsing: false,
          },
          {
            cueRange: '全图可见',
            forecast: 2.2,
            aftercast: 0.2,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
          },
        ],
      },
      {
        name: '捣蛋鬼',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '靠近队友时，自身增加移速、跳跃高度和推速。',
            detailedDescription: '半径750范围内有队友时，自身移速和跳跃能力提高20%，推速提高60%。',
          },
          {
            level: 2,
            description: '降低附近敌方的移速和跳跃高度。',
            detailedDescription: '半径650范围内的敌方移速降低13%，跳跃能力降低8%。',
          },
          {
            level: 3,
            description:
              '受到来自敌方的伤害后，免疫下次受到的[部分状态](也包括部分增益状态)，触发一次后消失。',
            detailedDescription:
              '受到来自敌方的伤害后，免疫下次受到的[部分状态](实际效果为免疫一次隶属于“分组8”的状态，该分组包含了大多数减益及少数增益状态)，触发后消失。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '可回血可解除虚弱，适配大多数情况。',
      },
      {
        name: '应急治疗',
        description: '应对高机动性猫时使用，增加容错',
      },
    ],
    aliases: ['恶杰'],
  },
  /* ----------------------------------- 恶魔泰菲 ----------------------------------- */
  恶魔泰菲: {
    aliases: ['恶菲'],
    description:
      '迷人又危险的小恶魔泰菲！为了帮助玩具城的国王杰瑞，恶魔泰菲挺身而出，将霸占玩具国的邪恶猫咪团的猫咪们耍得团团转，成功拯救了玩具国的子民们。',
    EnglishName: 'Devil Tuffy',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 4,
        description: '本身推速不慢，且在经典之家、古堡一二、天宫有很强的搬奶酪能力。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 4,
        description:
          '一武复制果盘道具，主动也能吸附道具快速砸墙，二武三级可直接对墙缝造成固伤和易伤，但对泡泡无效。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        level: 2,
        weapon: 2,
        description:
          '蓝色小淘气减速猫咪、红色小淘气与猫咪拉开距离，绿色小淘气后期有爆发伤害，拥有很强的干扰能力。',
        additionalDescription:
          '但恶魔泰菲自身使用红/蓝色小淘气会失去被动层数，且二武的破墙能力弱于一武。',
      },
    ],
    skillAllocations: [
      {
        id: '恶魔之角',
        pattern: '01020[12][12]',
        weaponType: 'weapon1',
        description: '',
      },
      {
        id: '小淘气1',
        pattern: '01[03]03311',
        weaponType: 'weapon2',
        description: '传统破墙流',
      },
      {
        id: '小淘气2',
        pattern: '01[30]01133',
        weaponType: 'weapon2',
        description: '爆伤瞬秒流，舍弃破墙能力打极致伤害',
      },
      {
        id: '小淘气3',
        pattern: '03010[1133]',
        weaponType: 'weapon1',
        description: '小图奶酪位置较好时的加点，7级后取舍同上',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-回家', 'C-救救我'],
        description:
          '适合一武，墙缝期高容错，几乎能保证打出五层护盾。对意识要求较高（需要活到墙缝期才能发挥作用）',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'A-投手', 'C-不屈'],
        description:
          '适合二武。投手提高牵制能力，不屈提高后期容错。适合打以斯飞为代表的非单刀且较为依赖移速的猫咪。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description:
          '无21点知识量时的卡组。缴械配合蓝色小淘气让猫变白板，但蓝恶魔只有3秒限制，高端局依旧不好救人。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'C-救救我', 'C-不屈', 'B-夹不住我'],
        description:
          '适合打米特这类防守猫。卡组不够用时可以拆掉这套卡，打米特用舍己、不屈，特技带治疗。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-幸运', 'C-救救我'],
        description: '幸运卡组。车队可以救救我换不屈，舍己换回家。',
      },
      {
        cards: ['S-回家', 'S-缴械', 'S-舍己', 'C-救救我'],
        description: '专门打苏蕊的卡组，舍弃铁血。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '恶菲打如玉/兔八哥等依赖技能输出且非首刀控制一套秒类猫咪时的首选卡组',
      },
    ],

    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
      {
        items: ['鞭炮束', '蓝花瓶', '果盘', '隐身饮料'],
        description: '破墙',
      },
    ],
    skills: [
      {
        name: '意念控制',
        type: 'active',
        description:
          '吸附周围数个$可吸附道具$font-bold#跟随自身，根据吸附数量提高移速；再次使用技能可将其掷出。',
        detailedDescription:
          '尝试吸附以自身为中心的640*480的矩形范围内的至多数个$可吸附道具$font-bold#，优先吸附靠近自身的道具。\n成功吸附道具后会使该道具跟随自身，且每吸附一个道具会使自身移速提高3.5%；吸附道具后解锁二段技能，拖动技能将所有正在吸附的道具向指定方向投掷；吸附道具期间自身受到眩晕，或吸附达到最长时间后，道具会原地掉落。\n若点击技能时范围内没有可吸附道具，将提示“附近没有可利用的道具”（不进入CD）。\n\n$可吸附道具$font-bold#：\n1. 常规投掷物：{盘子}、{玻璃杯}、{碗}、{扁盘}、{灰花瓶}、{蓝花瓶}、{香水瓶}、{胡椒瓶}、{番茄}、{叉子}、{高尔夫球}、{冰块}、（未点燃的）{小鞭炮}、（未点燃的）{鞭炮束}；\n2. [非常规投掷物类道具](该项实际为白名单制。牛奶、蛋糕、遥控器、手枪、老鼠夹、礼物等道具不在该名单中，因此无法吸附)：{奶酪}、{果盘}、{冰桶}、{小推车}；\n3. [与上述内容类似的部分衍生物](该项实际为黑名单制。以下项目处于本技能黑名单中：子弹，鸟哨鞭炮、烟雾（侦探杰瑞-烟雾弹）、煎蛋、金币、手型枪、火箭炮、炮弹（侍卫汤姆-皇家火炮）、干扰器、小仙人掌球、大仙人掌球、套索、花束、闪耀足球、魔镜经验蛋糕。随版本更新，本名单不排除有变动的可能)：{果子}、{蓝色小淘气}、{红色小淘气}、{绿色小淘气}等。',

        skillLevels: [
          {
            level: 1,
            description: '至多吸附1个道具；至多吸附15秒。',
            cooldown: 9,
            detailedDescription: '至多吸附1个道具；至多吸附15秒。',
          },
          {
            level: 2,
            description: '至多吸附2个道具；至多吸附30秒。',
            cooldown: 7,
            detailedDescription: '至多吸附2个道具；至多吸附30秒。',
          },
          {
            level: 3,
            description: '至多吸附3个道具。',
            cooldown: 5,
            detailedDescription: '至多吸附3个道具。',
          },
        ],

        parts: [
          {
            cueRange: '全图可见',
            canUseInAir: true,
            cancelableSkill: '不可主动打断',
            canMoveWhileUsing: false,
            cancelableAftercast: '不可取消',
          },
          {
            canUseInAir: true,
            cooldownTiming: '释放时',
            canMoveWhileUsing: true,
          },
        ],
      },
      {
        name: '恶魔之角',
        type: 'weapon1',
        description: '复制面前的数个$可复制道具$font-bold#。',
        detailedDescription:
          '尝试复制自身前方长352、高160范围内的至多数个$可复制道具$font-bold#，优先复制靠近自身的道具。\n若点击技能时范围内没有可复制道具，将提示“附近没有可利用的道具”（不进入CD）。\n\n$可复制道具$font-bold#：\n1. 常规投掷物：{盘子}、{玻璃杯}、{碗}、{扁盘}、{灰花瓶}、{蓝花瓶}、{香水瓶}、{胡椒瓶}、{番茄}、{叉子}、{高尔夫球}、{冰块}、{小鞭炮}、{鞭炮束}；\n2. [非常规投掷物类道具](该项实际为白名单制。奶酪、冰桶、小推车等道具不在该名单中，因此无法复制)：{果盘}、{老鼠夹}、{遥控器}、{大纸盒}、{小纸盒}、{牛奶}、{蛋糕}、{玩具枪}、{礼物}；\n3. [与上述内容类似的部分衍生物](该项实际为黑名单制。以下项目处于本技能黑名单中：子弹，鸟哨鞭炮、烟雾（侦探杰瑞-烟雾弹）、煎蛋、金币、手型枪、火箭炮、炮弹（侍卫汤姆-皇家火炮）、干扰器、小仙人掌球、大仙人掌球、套索、花束、闪耀足球、魔镜经验蛋糕、$长枪、电池、蓝图-投掷物$font-bold#（加粗部分为与主动技能名单不同的部分）。随版本更新，本名单不排除有变动的可能)：{果子}、{火药桶(衍生物)}、{藤蔓纸盒}等。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '不可取消',
        cueRange: '全图可见',
        skillLevels: [
          {
            level: 1,
            description: '至多复制1个道具。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '',
            cooldown: 25,
          },
          {
            level: 3,
            description: '至多复制2个道具。',
            cooldown: 25,
          },
        ],
      },
      {
        name: '小淘气',
        type: 'weapon2',
        description:
          '释放{飞行的小淘气}追踪并转化附近的至多5个$可转化道具$font-bold#。\n[部分易碎道具](玻璃杯/碗/盘子/扁盘)变成{蓝色小淘气}：被投掷后留在原地、自动索敌，命中时造成伤害并使敌方3秒内禁用技能与道具；\n[部分控制道具](灰花瓶/蓝花瓶/冰块)变成{红色小淘气}：被投掷后沿直线飞行，命中时造成少量伤害，并将敌方向当前背对方向击退一段距离；\n{高尔夫球}变成{绿色小淘气}：大部分物理性质与高尔夫球相同，但伤害更低、弹性更大、命中敌方不会消耗黑暗印记。\n此外，小淘气还可以影响小淘气还可以影响{老鼠夹}和{奶酪}：老鼠夹受影响会立刻打开；奶酪受影响后，搬运和被投掷时的速度更快。\n所有小淘气道具均可以被猫鼠双方使用。',
        detailedDescription:
          '尝试锁定自身半径640范围内至多5个$可转化道具$font-bold#，释放[对应颜色](对于老鼠夹和奶酪，会放出绿色的飞行小淘气)的{飞行的小淘气}分别追踪并转化这些道具。\n若点击技能时范围内没有可转化道具，将提示“附近没有可利用的道具”（不进入CD）。\n\n$可转化道具$font-bold#：\n1. {玻璃杯}、{碗}、{盘子}、{扁盘}：变成{蓝色小淘气}——被投掷后留在原地，范围内出现[未隐身的](隐身的敌方不会被蓝色小淘气索敌，且可正常将其拾取)敌方时自动飞向对方，命中敌方时造成{20*}伤害（[伤害来源为投掷者](被不同角色投掷时伤害可能不同)）且禁用技能与道具3秒；状态持续期间免疫本状态。处于等待索敌状态的蓝色小淘气速度为0，因此可[被再次拾取](包括被隐身的敌方拾取)。\n2. {灰花瓶}、{蓝花瓶}、{冰块}：变成{红色小淘气}——被投掷后沿直线飞行，命中敌方时造成{20*}伤害（[伤害来源为投掷者](被不同角色投掷时伤害可能不同)），并将敌方向当前背对方向击退一段距离，击退期间无法进行移动等操作。\n3. {高尔夫球}：变成{绿色小淘气}——其大部分物理性质与高尔夫球相同，但命中敌方/墙缝时仅造成{10*}伤害/{_1*}伤害（[伤害来源均为投掷者](被不同角色投掷时伤害可能不同)），有比高尔夫球更大的弹性，命中敌方不会消耗黑暗印记。\n4. {老鼠夹}：变为{打开的老鼠夹}。\n5. {奶酪}：变为特殊奶酪——附带额外的环绕特效；被搬起时改为使搬运者移速提高5%，跳跃能力提高15%；被投掷时的速度提高。\n\n所有小淘气道具均可以正常被猫鼠双方使用。',
        forecast: 1.5,
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        cueRange: '全图可见',
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
            description: '小淘气可以选中墙缝为目标：持续对墙缝造成伤害，并使墙缝受到的伤害增加。',
            cooldown: 10,

            detailedDescription:
              '小淘气可以选中墙缝为目标，使其：每秒减少2.35Hp，受到攻击后额外减少0.3Hp，持续7秒。',
          },
        ],
      },
      {
        name: '黑暗印记',
        type: 'passive',
        description:
          '加点后，恶魔泰菲可以积攒黑暗印记。印记每隔一段时间自行增长1层，被攻击时立刻增长1层，[投掷命中敌方时](绿色小淘气除外)移除1层。',
        detailedDescription:
          '对本技能进行加点后，赋予恶魔泰菲积攒黑暗印记的能力。印记每隔20秒自行增长1层，被爪刀、[投掷物](包括无伤害的投掷物，如香水瓶等)攻击时立刻增长1层，[投掷命中敌方时](包括无伤害的投掷物，如香水瓶等；不包括绿色小淘气)移除1层。',
        skillLevels: [
          {
            level: 1,
            description: '黑暗印记上限为1层。拥有至少一层印记时，移速和跳跃高度提高。',
            detailedDescription:
              '黑暗印记上限为1层。拥有至少一层印记时，移速提升10%，跳跃能力提升20%。',
          },
          {
            level: 2,
            description: '印记上限增加到2层；拥有至少两层印记时，持续恢复Hp。',
            detailedDescription: '印记上限增加到2层；拥有至少两层印记时，获得5Hp/秒的恢复。',
          },
          {
            level: 3,
            description: '印记上限增加到3层；拥有三层印记时，攻击力大幅提高。',
            detailedDescription: '印记上限增加到3层；拥有三层印记时，攻击力+100。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '绝处逢生',
        description: '用于自保或破坏老鼠夹，有一定救援能力。',
      },
      {
        name: '急速翻滚',
        description: '传统配法，增加机动性，但不适合救人。',
      },
    ],
  },

  /* ----------------------------------- 雪梨 ----------------------------------- */
  雪梨: {
    description: '雪梨是温柔可爱的女孩子，她喜欢一切漂亮美好的东西。',
    EnglishName: 'Cherie',
    mousePositioningTags: [
      {
        tagName: '辅助',
        level: 4,
        description: '可为队友回复Hp、远程治疗。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 4,
        description:
          '花洒能持续对道具施加推力，可通过让高尔夫球在墙缝与花洒右侧水流之间来回弹射进行破墙。',
        additionalDescription: '该操作通常要站在墙缝的左边，并且要把控距离，因此需要一定的熟练度。',
        weapon: 1,
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '花洒搭配精准投掷可以无限浇灭火箭；花束或爱心之吻远程治疗，救下队友后双方均有较高Hp。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '基础推速相对较高，适合推奶酪。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '花洒辅助救援',
        pattern: '2(0)1010212',
        weaponType: 'weapon1',
        description: '可保留加点，被追时点被动回血',
        additionaldescription: '',
      },
      {
        id: '花束',
        pattern: '3(0)13[10]013',
        weaponType: 'weapon2',
        description: '灵活加点',
        additionaldescription: '',
      },
      {
        id: '自保加点',
        pattern: '10020[12][12]',
        weaponType: 'weapon1',
        description: '优先点出三级被动',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'C-不屈', 'C-救救我', 'B-精准投射'],
        description: '花洒卡组，精准投射可刷新花洒CD，持续浇灭火箭。无21点知识点可去掉不屈。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-不屈', 'C-救救我', [CardGroupType.Or, 'A-逃窜', 'A-闭门羹']],
        description:
          '花束卡组，一般情况下带{逃窜}，有{门}的地图可以考虑带{闭门羹}。无21点知识点可去掉{不屈}。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'C-救救我', 'C-不屈', 'B-绝地反击'],
        description: '辅助救援卡组。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '爱心之吻',
        type: 'active',
        description:
          '释放{爱心之吻(衍生物)}追踪最近的队友，其被爱心触碰后与雪梨建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#，持续恢复Hp；友好关系持续一段时间后，同伴解除受伤并额外获得$全面强化$text-purple-700 dark:text-purple-300 font-bold#，直到友好关系中断。\n友好关系期间，雪梨可进行至多一次$远程治疗$text-green-700 dark:text-green-300 font-bold#，且共享自身受到的隐身。',
        detailedDescription:
          '释放{爱心之吻(衍生物)}，会自动追踪周围半径1760内距离最近的[友方玩家角色](包括火箭上的队友和机器鼠，但不会与机器鼠建立友好关系)，并以650/秒的速度向对方飞去。对方被爱心触碰0.2秒后，与雪梨建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#。爱心之吻最多存在20秒，超时未命中友方将自动消失。\n若点击技能时自身1760范围内没有友方玩家角色，将提示“附近无适合的队友，无法使用”（不进入CD）；若释放后周围暂时没有可追踪目标，爱心之吻将原地等待并自动追踪下一个进入范围的友方玩家角色。\n\n$友好关系$text-blue-700 dark:text-blue-300 font-bold#：生成一根[连线](会随距离产生透明度变化，用于提示雪梨与对方的距离；当对方隐身时，连线也会进入隐身)链接雪梨与该友方角色，当双方距离超过2400时将断裂并解除关系。建立关系期间，雪梨会获得额外技能$爱心治疗$text-green-700 dark:text-green-300 font-bold#，且自身获得隐身状态时会使对方获得相同状态。与雪梨建立友好关系的队友每秒获得一层$永结同心$text-purple-700 dark:text-purple-300 font-bold#状态。\n· 解除友好关系的方式*：1、再次使用本技能；2、使用{花束}被其他队友接到；3、其中一方被猫咪或斯派克抓住，或进机器鼠；4、双方距离超过2400。\n\n$爱心治疗$text-green-700 dark:text-green-300 font-bold#：属于额外技能。使用后与对方远程进行一次[治疗交互](与近身的治疗交互相同；享受自身被动增益。若处于鼠虚弱时建立友好关系，该技能不会被禁用)，交互中断会进入5秒CD。（$成功治疗后或友好关系解除后失去本技能$text-red-700 dark:text-red-300#）\n\n$永结同心$text-purple-700 dark:text-purple-300 font-bold#：每次获得时立即回复2.5Hp，可叠加20层，叠加至上限后清空并获得$爱情的勇气$text-purple-700 dark:text-purple-300 font-bold#状态。（$友好关系解除后清除本状态$text-red-700 dark:text-red-300#）\n$爱情的勇气$text-purple-700 dark:text-purple-300 font-bold#：立即解除受伤，随后移速提高10%，跳跃能力提高5%，攻击力+15，Hp上限+25，恢复速度提高2.5Hp/秒，推速提高30%，免疫永结同心及由道具造成的反向和失明。（$友好关系解除后清除本状态$text-red-700 dark:text-red-300#）',
        canMoveWhileUsing: false,
        canUseInAir: false,
        forecast: 1,
        aftercast: 0.5,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 18,
          },
          {
            level: 2,
            description:
              '$友好关系$text-blue-700 dark:text-blue-300 font-bold#建立时立即回复Hp，并使对方在Hp大于一半时不会被{直接抓起}；后续提供的Hp恢复提升并可解除受伤。',
            cooldown: 14,
            detailedDescription:
              '建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#时，对方立即回复25Hp；关系存续期间，对方Hp比例≥50%时不会被{直接抓起}；$永结同心$text-purple-700 dark:text-purple-300 font-bold#提供的回复改为5Hp，并会解除受伤；$爱情的勇气$text-purple-700 dark:text-purple-300 font-bold#提供的Hp恢复提升至5Hp/秒。',
          },
          {
            level: 3,
            description:
              '$全面强化$text-purple-700 dark:text-purple-300 font-bold#所需时间缩短，且能额外回复Hp并提高Hp上限。',
            cooldown: 10,
            detailedDescription:
              '$永结同心$text-purple-700 dark:text-purple-300 font-bold#叠加层数减少至10层；$爱情的勇气$text-purple-700 dark:text-purple-300 font-bold#提供的Hp上限改为+50，且获得时立即回复25Hp。',
          },
        ],
        cancelableSkill: ['道具键*'],
        canHitInPipe: false,
        cancelableAftercast: ['道具键*'],
        cueRange: '全图可见',
      },
      {
        name: '爱之花洒',
        aliases: [],
        type: 'weapon1',
        description:
          '在地面放置{花洒}，存在一段时间后消失。持续恢复友方Hp，减速敌方，持续对敌方和道具产生推力，浇灭{小鞭炮}/{鞭炮束}，熄灭{火箭}。',
        detailedDescription:
          '在地面放置{花洒}，花洒存在一段时间后消失。花洒会产生$水流范围$text-blue-700 dark:text-blue-300 font-bold#，初始方向为双向，每个方向范围约为175。老鼠可通过交互[改变水流方向](前摇1秒，顺序为双向→右→左)。\n友方进入$水流范围$text-blue-700 dark:text-blue-300 font-bold#时，立即解除由道具造成的反向和失明；位于范围内时，恢复速度提高10Hp/秒（对雪梨自身效果提高至15Hp/秒）。\n敌方位于$水流范围$text-blue-700 dark:text-blue-300 font-bold#内时，移速降低30%，跳跃能力降低20%。\n此外，水流会[对敌方和道具产生推力](双头花洒和右花洒的力向右，左花洒的力向左；敌方受力的移速为25；道具受力较大)，并浇灭范围内已点燃的{小鞭炮}/{鞭炮束}，熄灭{火箭}（猫咪将老鼠绑上花洒范围内的火箭时，不会减少引线长度；花洒存在期间，猫咪无法进行点燃火箭交互）。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        forecast: 0.5,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '花洒存在5秒。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '花洒持续时间延长。',
            cooldown: 12,
            detailedDescription: '花洒持续时间延长至7.5秒。',
          },
          {
            level: 3,
            description: '单向水流范围变大。',
            cooldown: 12,
            detailedDescription: '单向水流范围提升至约500，双向不变。',
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '爱心花束',
        type: 'weapon2',
        description:
          '投掷{花束}，命中友方回复Hp，并弹向最近的另一个友方。\n若在已建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#时首先命中该友方，则双方再次回复Hp，且各获得一个一次性传送技能，使用后[向对方飞去](点击技能后立刻飞向同伴，期间无敌且无法被命中；友好关系解除时该技能同步失效)。\n若在已建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#时首先命中另一位友方，则中止并建立新的友好关系，且照常获得回复和传送技能。',
        detailedDescription:
          '投掷{花束}，其被投掷速度为650，不与平台碰撞，但会被地板、墙壁等障碍阻挡，存在5秒后消失。\n花束命中友方时，使其获得$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#状态；若附近半径1250内还有其他友方，将失重并以2000的速度弹向最近的友方，命中后使其也获得$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#；最多弹射3次。\n若自身已与首先命中的友方建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#，则双方再次获得$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#，同时各获得一个$传送$text-green-700 dark:text-green-300 font-bold#技能。\n若自身未与首先命中的友方建立$友好关系$text-blue-700 dark:text-blue-300 font-bold#，但自身此时已与另一位友方建立此关系，则中止并建立新的友好关系，且照常获得$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#和$传送$text-green-700 dark:text-green-300 font-bold#。\n\n$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#：回复50Hp。\n$传送$text-green-700 dark:text-green-300 font-bold#：属于额外技能。使用后立刻以1750速度飞向对方，传送期间{无敌}且无法被任何道具、技能命中。（$使用后或友好关系解除后失去本技能$text-red-700 dark:text-red-300#）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        forecast: 0.3,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 10,
          },
          {
            level: 2,
            description: '可额外减少主动技能CD；传送相遇后额外减少双方武器技能CD。',
            detailedDescription:
              '$捧花恢复$text-purple-700 dark:text-purple-300 font-bold#额外使主动技能当前冷却减少30%；$传送$text-green-700 dark:text-green-300 font-bold#相遇后额外使双方回复50Hp且武器技能当前冷却减少30%。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '',
            cooldown: 8,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '温柔体贴',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '定期解除受伤并回复Hp。治疗友方速度大幅提高。',
            detailedDescription:
              '获得自愈状态：[立即](该效果会在进行技能加点的瞬间触发)回复25Hp并解除受伤和由道具造成的反向及失明，在15秒后失去并再次获得本状态。\n治疗队友的速度提升至原本的5倍（约0.35秒）。',
          },
          {
            level: 2,
            description: '治疗队友后，使其Hp全部恢复。',
            detailedDescription: '治疗友方老鼠后，使其额外回复200Hp。',
          },
          {
            level: 3,
            description:
              '治疗友方老鼠后，彼此短暂大幅提升移动和跳跃，并在后续一段时间内持续恢复Hp和提升属性。',
            detailedDescription:
              '治疗友方老鼠后，使雪梨和被治疗的友方老鼠移速和跳跃能力提升100%，持续0.5秒；同时移速和跳跃能力提高10%，恢复速度提高2.5Hp/秒，持续60秒。',
          },
        ],
      },
    ],
    specialSkills: [],
  },

  /* ----------------------------------- 天使杰瑞 ----------------------------------- */
  天使杰瑞: {
    description: '拥有一颗善良之心的天使，总会在汤姆遇上危险的时候，对他施以援手。',
    EnglishName: 'Angel Jerry',
    mousePositioningTags: [
      {
        tagName: '辅助',
        level: 4,
        description:
          '独一无二的复活机制，会给猫很大的压力；\n弓箭可为队友回血，制造护盾，秒扶虚弱的队友（三级），套爱神羁绊（见技能介绍），可通过道具取消后摇来快速连打两箭，从而迅速触发爱神标记相关效果。',
        additionalDescription:
          '虽然复活体尽量不会再去参与救人但是仍然可以保证奶酪进度，还能废掉一个秒飞，有不错的辅助能力。\n三级弓箭秒扶可以从猫手底下抢人，同一高度直接点按就能命中倒地队友。',

        weapon: 1,
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '推速较高，有一定自保。',
        additionalDescription: '本身牵制、救人能力不突出，无秒飞火箭时一般当奶酪位。',
      },
      {
        tagName: '破局',
        level: 2,
        description: '雷云的减伤和控制可以用于强推最后一块奶酪。',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '干扰',
        level: 2,
        description:
          '弓箭可以远距离进行控制干扰；雷云可以降低敌方的移速和伤害，还能对敌方造成伤害和控制；被动可以暂时封锁敌方的爪刀或技能。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 2,
        description:
          '天使杰瑞后期的生存能力有质的飞跃，被动的禁用爪刀和技能以及{武器技能}的高频控制也让猫咪非常头疼。',
        additionalDescription: '需注意：某些拥有霸体的猫反而能将天使杰瑞作为突破口。',
      },
    ],
    skillAllocations: [
      {
        id: '丘比特之箭',
        pattern: '1221[12]000',
        weaponType: 'weapon1',
        description:
          '（2026.4.8改版之后的加点）开局先给[救人位/牵制位](目测最容易替飞的)挂上祝福，六级时若场上有秒飞或已经有复活体则优先加点祝福（有复活体之后一定要先给队友挂上第二个祝福），否则点弓箭。打托普斯可开局舍弃弓箭优先点出一被。',
        additionaldescription: '',
      },
      {
        id: '止戈雷云',
        pattern: '3(0)[13]30011',
        weaponType: 'weapon2',
        description:
          '（天使杰瑞于20260402有一次改版，本加点可能已过时）加点灵活，开局队友暴毙、刷二手火箭则优先祝福，否则被动。后期打部分[技能输出猫](如牛仔汤姆)可以优先点出{3级被动}。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '旧卡组',
        description: '天使杰瑞在20260402有一次大幅度改版，这些卡组为改版前的推荐卡组。',
        groups: [
          {
            cards: ['S-舍己', 'A-逃窜', 'C-救救我', 'C-不屈', 'S-铁血'],
            description:
              '适合新手游玩的卡组，{不屈}是天使的核心（队友被放飞时就产生增益，而不是被淘汰时），{逃窜}增加续航能力。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'A-祝愿', 'C-救救我', 'C-不屈'],
            description:
              '日常使用，需要注意高端局猫可能会优先送走天使，因此通过{祝愿}保下限，卖自己也能有稳定收益。',
          },
          {
            cards: ['S-无畏', 'S-铁血', 'B-绝地反击', 'C-救救我', 'C-不屈'],
            description: '防守类猫对策卡组。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'C-不屈', 'C-救救我'],
            description:
              '20知识量用的卡组，{夹不住我}可替换为其他3知识量的知识卡，如{孤军奋战}等。',
          },
          {
            cards: ['C-不屈', 'C-救救我', 'A-逃窜', 'A-泡泡浴', 'B-夹不住我', 'A-祝愿'],
            description:
              '四排车队可用不死流卡组，务必保证队友知道你没有{铁血}且不用你救人。单排极不建议使用。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'C-救救我', 'A-逃窜', 'B-应激反应'],
            description:
              '（改版后卡组）强化自保的卡组，弥补新版天使自保差的缺陷。20知识量可把{逃窜}换成{不屈}。',
          },
        ],
        defaultFolded: false,
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '天使祝福',
        type: 'active',
        description:
          '选定一位队友，给予其$祝福$text-purple-700 dark:text-purple-300 font-bold#状态，直至其被放飞或自身更换目标。\n被$祝福$text-purple-700 dark:text-purple-300 font-bold#的队友被放飞不会立刻淘汰，而是在[复活点](只与地图有关，每个地图都有固定点位)以$复活体$text-yellow-700 dark:text-yellow-300 font-bold#的形式返回游戏。复活体会持续暴露位置，且一旦Hp≤0或被抓起将立刻淘汰。\n有复活人数上限。',
        detailedDescription:
          '通过外置轮盘选择一位其他友方老鼠角色（未选定则为距离最近的目标），点击目标头像后开始吟唱，随后给予其$祝福$text-purple-700 dark:text-purple-300 font-bold#状态，直至其被放飞或自身更换目标。\n\n$祝福$text-purple-700 dark:text-purple-300 font-bold#：头上出现光圈；被放飞不会立刻淘汰，而是在[复活点](只与地图有关，每个地图都有固定点位)以$复活体$text-yellow-700 dark:text-yellow-300 font-bold#的形式返回游戏，且初始回复50Hp。\n有复活人数上限。达到上限后不会继续生效复活。\n$复活体$text-yellow-700 dark:text-yellow-300 font-bold#：持续{暴露位置}，且一旦Hp≤0或被抓起将立刻淘汰。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        skillLevels: [
          {
            level: 1,
            description: '每局最多复活1名队友。',
            cooldown: 60,
          },
          {
            level: 2,
            description: '前摇结束后获得护盾并回复少量Hp。',
            cooldown: 60,
            detailedDescription:
              '吟唱前摇结束后回复34Hp，清除[部分状态](由道具造成的反向、失明；由恶魔汤姆-感同身受2级效果施加的负面状态)并获得1层护盾，持续3秒。',
          },
          {
            level: 3,
            description: '每局改为最多复活2名队友。',
            cooldown: 60,
          },
        ],
        aliases: ['复活'],
        canHitInPipe: true,
        cooldownTiming: '前摇前',
        aftercast: 1.9,
        forecast: 1.1,
        cueRange: '全图可见',
      },
      {
        name: '丘比特之箭',
        aliases: ['弓箭'],
        type: 'weapon1',
        description:
          '向面前射出一发{弓箭}，命中友方回复Hp，命中敌方造成伤害和减速。\n长按技能可调整发射角度，且可蓄力并改为射出{蓄力箭}，提升命中效果且命中敌方可造成眩晕（一段时间内不重复触发）。\n$弓箭$font-bold#命中任意目标后，或$蓄力箭$font-bold#命中友方目标后，为目标添加$爱神标记$text-purple-700 dark:text-purple-300 font-bold#状态，持续5秒。当场上存在两个$爱神标记$text-purple-700 dark:text-purple-300 font-bold#时，标记解除并使双方根据阵营触发效果：\n· 均为友方：获得1层护盾。\n· 均为敌方：造成伤害和眩晕。\n· 一敌一友：一段时间内对彼此造成的伤害变为等额回复。',
        detailedDescription:
          '点按技能水平射出一发{弓箭}。长按技能可在水平方向±30°范围内调整发射角度，并在0.3秒后开始蓄力，蓄力至少1秒（蓄力条约≥2/3）后会改为射出{蓄力箭}；前摇或蓄力期间取消释放也会消耗技能储存次数，但返还当前最大CD的一半；蓄力无最大时间限制。\n（技能前后摇期间$可以移动$text-green-700 dark:text-green-300#，蓄力期间$无法移动或转向$text-red-700 dark:text-red-300#。若在蓄力射出弓箭时按住与瞄准方向相反的方向键，则会向反方向射出弓箭）\n\n$弓箭$font-bold#：以约1300/秒的速度沿直线飞行，无视地形，至多飞行5秒。命中友方为其回复25Hp，并添加$爱神标记$text-purple-700 dark:text-purple-300 font-bold#（持续5秒）；命中敌方造成{25*}伤害，使其移速降低20%（持续1.5秒），并添加$爱神标记$text-purple-700 dark:text-purple-300 font-bold#（持续5秒）。\n$蓄力箭$font-bold#：沿抛物线飞行，无视地形，命中友方为其回复50Hp，并添加$爱神标记$text-purple-700 dark:text-purple-300 font-bold#（持续5秒）；命中敌方造成{50*}伤害和1.5秒{眩晕}，但使敌方在20秒内免疫由$蓄力箭$font-bold#及$爱神标记$text-purple-700 dark:text-purple-300 font-bold#造成的伤害及眩晕。\n\n$爱神标记$text-purple-700 dark:text-purple-300 font-bold#：当场上存在2个$爱神标记$text-purple-700 dark:text-purple-300 font-bold#时，标记解除并根据阵营触发效果：\n· 不同友方：各自获得1层持续3秒的{护盾}。\n· 同一友方：获得1层持续5秒的{护盾}。\n· 均为敌方：各自额外造成{40*}伤害和1.5秒{眩晕}。\n· 一敌一友：双方获得$爱神羁绊$text-purple-700 dark:text-purple-300 font-bold#状态，持续10秒。\n$爱神羁绊$text-purple-700 dark:text-purple-300 font-bold#：对彼此造成的伤害改为等额回复。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
            charges: 2,
          },
          {
            level: 2,
            description: '',
            detailedDescription: '',
            cooldown: 9,
            charges: 2,
          },
          {
            level: 3,
            description:
              '友方同时持有2个$爱神标记$text-purple-700 dark:text-purple-300 font-bold#时还可解除其虚弱状态。',
            cooldown: 9,
            charges: 4,
          },
        ],

        aftercast: 0.5,
        forecast: 0.1,
      },
      {
        name: '止戈雷云',
        type: 'weapon2',
        description:
          '召唤两朵{雷云}，持续15秒。雷云内敌方移速和攻击力降低，且做出[攻击行为](爪刀、道具、技能)后会被$雷击$text-yellow-700 dark:text-yellow-300 font-bold#，造成[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加，可叠加)。',
        detailedDescription:
          '在[自身上方的左右两侧](位于自身上方480、左右两侧各距离288处)各召唤一朵{雷云}，持续15秒。\n敌方在$雷云$font-bold#范围内时，移速降低25%，攻击力-10，且做出[攻击行为](如使用爪刀，道具，技能等)时会被标记为$失格者$text-yellow-700 dark:text-yellow-300 font-bold#。\n\n$失格者$text-yellow-700 dark:text-yellow-300 font-bold#：立即受到$雷击$text-yellow-700 dark:text-yellow-300 font-bold#，并在3秒后再次受到$雷击$text-yellow-700 dark:text-yellow-300 font-bold#。失格者持续3秒，持续期间不会重复获得。\n$雷击$text-yellow-700 dark:text-yellow-300 font-bold#：目标角色头顶出现感叹号标志，持续1.2秒；被锁定1.5秒后在其被锁定的位置降下$落雷$font-bold#，若敌方被$落雷$font-bold#直接击中或在其存在期间触碰，则会受到以下状态：受到{20*,电击}伤害，移速降低15%，持续0.7秒，状态结束后1秒内免疫该状态。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        forecast: 0.65,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '$雷击$text-yellow-700 dark:text-yellow-300 font-bold#附带眩晕。',
            detailedDescription:
              '$雷击$text-yellow-700 dark:text-yellow-300 font-bold#将造成眩晕（该眩晕期间会{保持速度}），但不再造成减速。',
            cooldown: 30,
          },
          {
            level: 3,
            description:
              '雷云会主动攻击范围内敌方。\n敌方伤害天使杰瑞也会遭到$雷击$text-yellow-700 dark:text-yellow-300 font-bold#（无论雷云是否存在）。',
            detailedDescription:
              '敌方在$雷云$font-bold#内每5秒会自动被$雷击$text-yellow-700 dark:text-yellow-300 font-bold#，离开雷云5秒后重置计时。\n敌方对天使杰瑞造成伤害时，也会被标记为$失格者$text-yellow-700 dark:text-yellow-300 font-bold#（无论雷云是否存在）。\n（两朵$雷云$font-bold#以及$失格者$text-yellow-700 dark:text-yellow-300 font-bold#的雷击判定互不干扰，可同时触发）',
            cooldown: 30,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '神之惩戒',
        type: 'passive',
        description: '',
        skillLevels: [
          {
            level: 1,
            description: '受到敌方伤害后，使其短时间内{禁止攻击}（有内置CD）。',
            detailedDescription: '受到来自敌方的伤害后，使其{禁止攻击}，持续2.5秒。（CD：10秒）',
          },
          {
            level: 2,
            description: '附近敌方的攻击和技能CD增加。',
            detailedDescription:
              '自身半径800范围内的敌方的攻击冷却增加10%、主动和武器技能CD增加10%。',
          },
          {
            level: 3,
            description: '受到敌方伤害后，使其短时间内{禁用技能}（有内置CD）。',
            detailedDescription:
              '受到来自敌方的伤害后，使其{禁用技能}，持续2.5秒。（CD：10秒，与本技能1级效果分别结算）',
          },
        ],

        detailedDescription:
          '天使杰瑞可以对敌方造成各类负面状态，但这些状态均可被敌方的护盾、无敌、霸体等状态免疫（且不消耗护盾层数）。',
      },
    ],
    specialSkills: [
      {
        name: '应急治疗',
        description:
          '天使杰瑞被动需要受伤触发，利用应急治疗提高续航。另外天使杰瑞基础恢复速度快，解除受伤后能快速回满Hp。',
      },
      { name: '绝处逢生', description: '集自救恢复解控于一体，在各场合均有发挥。' },
    ],
  },

  /* ----------------------------------- 天使泰菲 ----------------------------------- */
  天使泰菲: {
    description: '在王位争夺战中，泰菲化身为天使泰菲，用他的善良感动了汤姆，成功救下了国王杰瑞。',
    EnglishName: 'Angel Tuffy',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description:
          '{友情庇护}提供伪霸体并且免疫老鼠夹，救援能力十分突出，可以担任队伍的救人核心。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 2,
        description: '{友情庇护}能在猫缺乏输出手段的情况下强推最后一块奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 2,
        description: '{天使翅膀}和{友情庇护}提供的自保十分强大，能够适应多种极端情况下的对局环境。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '自身推速较快，可以担任队伍的副推位。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '庇护加点',
        pattern: '121212000',
        weaponType: 'weapon1',
        description: '在应对高伤猫时可考虑使用，但续航偏低，容错空间不高。',
      },
      {
        id: '常规加点',
        pattern: '1221[12]000',
        weaponType: 'weapon1',
        description: '最正常的加点，优先保证续航。遇到控制多的猫可以优先点出三级翅膀。',
      },
      {
        id: '机动加点',
        pattern: '120121200',
        weaponType: 'weapon1',
        description:
          '此加点用于增加前期移速，在怜悯值清零状态下使用一级翅膀获得的怜悯值刚好满足一被的触发条件。在应对高移速猫的情况下偶有奇效。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '天使泰菲的机动性较低，推荐佩戴提升移速的知识卡提高容错',
        groups: [
          {
            cards: ['S-舍己', 'C-救救我', 'S-缴械', 'S-铁血'],
            description: '用于针对托普斯，苏蕊，图多盖洛等角色',
          },
          {
            cards: ['S-无畏', 'S-铁血', 'C-不屈', 'C-救救我', 'B-应激反应'],
            description: '仅推荐用于应对米特，若只有20知识点把不屈应激反应替换为逃窜',
          },
        ],
        description: '用于针对托普斯，苏蕊，图多盖洛等角色',
        defaultFolded: false,
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '21知识点通用知识卡，可按个人喜好将不屈换为应激反应',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-救救我', 'C-不屈', 'B-应激反应'],
        description: '20知识点的通用卡组，在应对任何情况都能上场',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '友情庇护',
        type: 'active',
        description:
          '展开光盾，范围内友方（含自身）所受部分伤害将被转移并以怜悯值抵挡，受到的眩晕控制延迟到离开光盾后结算，不会被{打开的老鼠夹}夹住；范围内火箭减缓燃烧速度、倒计时自然归零时暂时不放飞。\n光盾生效期间无法使用此技能，无法回复且持续消耗怜悯值，耗尽后光盾消失。怜悯值为空时无法使用此技能。\n本技能有后摇动作，但不影响角色行动。',
        detailedDescription:
          '以自身为中心，展开[半径为450的圆形光盾](当自身处于变身等改变体型的状态下时，光盾的特效大小会发生变化)，范围内友方（含自身）获得一定比例的{伤害转移}状态（期间受到的伤害不会超过自身Hp上限；所受部分伤害将被转移至天使泰菲，天使泰菲将消耗怜悯值抵挡此伤害，每1%怜悯值可抵挡0.9伤害）和延迟眩晕状态（不会被{打开的老鼠夹}夹住（已夹住时不解除）；免疫受到的眩晕类控制，但会记录该状态期间受到的最后一个眩晕控制，该状态结束时结算该控制），离开该范围或该范围消失时解除上述状态；范围内的火箭减缓燃烧速度、倒计时归零时暂时不放飞（对[秒飞火箭](因绑上老鼠立刻减少倒计时而导致倒计时归零的火箭)不生效）。\n光盾生效期间无法使用此技能，无法回复且每秒消耗5.3%怜悯值，耗尽后光盾消失。怜悯值为空时无法使用此技能。\n本技能有后摇动作，但不影响角色行动。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '伤害转移比例为30%。火箭在范围内减少20%的燃烧速度。',
            cooldown: 5,
          },
          {
            level: 2,
            description: '伤害转移比例增加到50%，火箭在范围内改为减少50%的燃烧速度。',
            cooldown: 5,
          },
          {
            level: 3,
            description:
              '开启庇护后天使泰菲获得6秒的{免疫虚弱}状态，但该状态将在光盾消失时立即结束。',
            cooldown: 5,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '天使翅膀',
        type: 'weapon1',
        description:
          '展开天使翅膀，期间持续恢复怜悯值（若已满或处于主动技能光盾生效期间，则改为恢复Hp）。技能期间仅一次，受到有来源的伤害时，对伤害来源“反弹”一次伤害。\n本技能有后摇动作，但不影响角色行动。',
        detailedDescription:
          '展开天使翅膀，持续5.9秒，期间持续恢复怜悯值（若已满或处于主动技能光盾生效期间，则改为每秒恢复5点Hp）。技能期间仅一次，受到有来源的伤害时，对伤害来源“反弹”一次伤害。\n本技能有后摇动作，但不影响角色行动。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放时',
        canHitInPipe: false,
        cueRange: '全图可见',
        skillLevels: [
          {
            level: 1,
            description: '翅膀存在期间每秒恢复13%怜悯值。',
            detailedDescription: '翅膀存在期间每秒恢复13%怜悯值。反弹会造成{15*}伤害。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '改为每秒恢复20%怜悯值。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '反弹伤害提高。技能可在被眩晕期间释放，解除眩晕但清空怜悯值。',
            detailedDescription:
              '反弹改为造成{25*}伤害。技能可在被眩晕期间释放，解除眩晕但清空怜悯值。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '怜悯之心',
        type: 'passive',
        description:
          '天使泰菲拥有怜悯值充能条。怜悯值初始为满，且[无法](原有增长速度为1.5%/s，已改版)自然增长，仅可通过武器技能增加。怜悯值可供主动技能消耗，或供被动技能提供加成。', //在同一房间的队友受到伤害时增加（每1伤害增加0.7%怜悯值），也
        skillLevels: [
          {
            level: 1,
            description: '怜悯值低于80%时，移速增加。',
            detailedDescription: '怜悯值低于80%时，移速增加12%。',
          },
          {
            level: 2,
            description: '怜悯值高于20%且自身未{受伤}时，持续恢复Hp。',
            detailedDescription: '怜悯值高于20%且自身未{受伤}时，每秒{恢复}2.5Hp。',
          },
          {
            level: 3,
            description: '怜悯值高于40%时，Hp上限提高（不会因此同步回复Hp）。',
            detailedDescription: '怜悯值高于40%时，{Hp上限提高}50（不会因此同步回复Hp）。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '增强自保，或用于抵消结算的眩晕效果。',
      },
      {
        name: '应急治疗',
        description: '配合减伤提高生存能力。在骗刀、骗技能后舍己救人并使用此特技会有奇效。',
      },
    ],

    aliases: ['天菲', '天妃'],
  },

  /* ----------------------------------- 魔术师 ----------------------------------- */
  魔术师: {
    aliases: ['二表哥'],
    counterTags: ['拉扯'],
    description:
      '魔术师是杰瑞的表哥之一，他出身高贵，动作优雅，是一位不折不扣的绅士，他拥有强大的魔法能力，能够将猫玩弄于股掌之间。',
    EnglishName: 'Magician',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 2,
        description: '兔子可以安全地运送和推入奶酪，而兔子大表哥可以提高魔术师的推速。',
        additionalDescription:
          '兔子的推速并不占优，不过可以通过反复拉扯来创造推奶酪机会。{1级兔子大表哥}增加的推速数值较低，但额外推速不受其他状态影响的特点也能规避前期队友上火箭导致的推速降低，且如果队友被放飞则自身推速会有质的飞跃。',
      },
      {
        tagName: '干扰',
        level: 4,
        description: '卡牌和兔子大表哥可以干扰猫咪。',
        additionalDescription:
          '卡牌可以超远程支援，且控制时间长，但并非硬性控制，实际使用时更偏向于用它创造更多的拉扯机会。',
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '兔子先生[可以进行火箭救援](通常需携带“无畏”知识卡，否则可能无法进行有效救援)；兔子大表哥[可以阻止秒飞火箭起飞](需要魔术师在附近，实战时需抉择)，还能大幅增加自身的救援速度。',
        additionalDescription: '兔子先生救援时建议搭配红牌干扰，提高稳定性。',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '分别点出Lv.1的主动、武器、被动技能后，可以向兔子大表哥投掷卡牌以刷取经验。',
        additionalDescription: '吃蛋糕可减少被动和{主动技能}的CD，可以用这个方法提高刷经验效率。',
        weapon: 2,
      },
      {
        tagName: '破局',
        level: 2,
        description:
          '兔子先生可以强行对最后一块奶酪进行攻坚，哪怕被击倒也可以通过升级技能、吃蛋糕、[卡牌命中](需有Lv.1被动)等方式减少CD，快速召唤下一只兔子进行攻坚。红色卡牌暂时性的封锁技能，能克制部分以技能为主的防守猫。\n兔子大表哥失去队友后变强，弥补了局势上减员的劣势',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '兔子先生',
        pattern: '210(2)(2)1100',
        weaponType: 'weapon1',
        description:
          '升级兔子先生时会召回兔子并使技能CD归零，可以用于恢复其Hp，因此推荐在需要时才加点。',
        additionaldescription: '',
      },
      {
        id: '兔子大表哥',
        pattern: '3101100',
        weaponType: 'weapon2',
        description: '兔子大表哥会在队友被放飞时自动升级，无法主动升级。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '投掷、干扰',
        description:
          '通过缴械、精准投射、投手等投掷命中类知识卡，增强卡牌干扰和远程支援，但需要一定的投掷准度。注意：卡牌命中兔子大表哥时，上述知识卡不生效。',
        groups: [
          {
            cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
            description: '缴械封爪刀，红牌封技能，二者结合能封锁猫咪大部分攻击能力，达到干扰效果。',
          },
          {
            cards: ['S-铁血', 'S-缴械', 'B-夹不住我', 'C-不屈', 'C-救救我'],
            description: '兼具干扰与自保能力，夹不住我用于破局。',
          },
          {
            cards: ['S-铁血', 'S-缴械', 'A-投手', 'C-救救我'],
            description:
              '擅长针对部分害怕减速的猫，但容错较低，需要较高的投掷准度，一旦卡牌未命中则很有可能反被敌方抓住破绽击倒。',
          },
          {
            cards: ['S-铁血', 'A-投手', 'B-精准投射', 'C-不屈', 'C-救救我'],
            description: '需要极高投掷准度，实战价值有限，仅推荐想要挑战自我的玩家使用。',
          },
          {
            cards: ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
            description: '红牌+投手=斯飞走不动路',
          },
        ],
        defaultFolded: true,
      },
      {
        id: '兔子先生无畏救援',
        description:
          '绑定一武器兔子先生。兔子先生救援时能够继承无畏，可以用于破局或辅助救援，但不推荐承担主要救援位。注意：兔子先生无法继承舍己/逃之夭夭。',
        groups: [
          {
            cards: ['S-铁血', 'S-无畏', 'S-缴械', 'C-救救我'],
            description: '兼具救援与干扰能力。无畏辅助救援，缴械封锁爪刀。',
          },
          {
            cards: ['S-铁血', 'S-无畏', 'B-精准投射', 'C-救救我'],
            description:
              '前套卡组知识量不足时，以精准投射替代缴械产生的卡组，也可酌情换为投手、幸运、不屈、夹不住我等知识卡。',
          },
        ],
        defaultFolded: false,
      },
      {
        id: '自保',
        description: '以自保为主的卡组，只要活着就能进行干扰和拉扯。',
        groups: [
          {
            cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
            description:
              '泛用性较高的自保卡组，进可舍己救人、逃窜自保，退可在双人残局时用不屈拉扯，伺机破墙翻盘。如果队伍中没有救人位，可以将逃窜换成逃之夭夭。',
          },
          {
            cards: ['S-铁血', 'A-祝愿', 'B-幸运', 'C-不屈', 'C-脱身'],
            description:
              '幸运体系卡组，[适合对抗库博等机动性强但防守能力弱的猫咪](这类猫咪可以将老鼠绑到极远的位置，利用老鼠救援的时间差击倒其他老鼠，令鼠方疲于奔命。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'B-幸运', 'C-脱身'],
            description: '魔术师自保较强，二武兔子大表哥也能协助其幸运挣脱后的撤退。',
          },
        ],
        defaultFolded: true,
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '奇思妙想',
        aliases: ['卡牌', '魔术卡牌', '牌'],
        type: 'active',
        description:
          '从{红色卡牌}、{黄色卡牌}、{蓝色卡牌}中选取一张，将其作为投掷物拾取。卡牌投掷命中敌方时令其强制传送一小段距离、改变朝向、并禁用技能/急速反向/失重漂浮一段时间。',
        detailedDescription:
          '魔术师变出一张随机颜色卡牌，同时技能进入5秒读条，期间[每0.5秒按红-黄-蓝的顺序切换卡色](若切换时魔术师正在交互中，则不会切换)；再次点击技能/用道具键投出卡牌/5秒读条结束后，固定卡色且技能进入CD。\n卡牌属于投掷物，被投掷的初速度固定为2000，可穿越所有墙体，命中猫咪时可以正常触发{投掷命中效果}。卡牌也会命中{兔子大表哥(衍生物)}/森林牧场大鸭子，但[不触发卡牌效果](不会触发卡牌本身的效果，也不会触发以投掷命中为条件的效果，但可触发Lv.1被动)。猫咪受卡牌效果影响期间，免疫其他卡牌效果。魔术师虚弱时，卡牌不会从手中掉落。卡牌被丢弃时，将直接被移除。\n卡牌效果如下：\n{红色卡牌}：使目标向卡牌飞行方向传送80距离且改变角色朝向并掉落手中道具，6秒内禁用技能且减速18.5%。\n{黄色卡牌}：使目标向卡牌飞行方向传送80距离且改变角色朝向，[每2秒获得1.5秒反向，反向期间移速提高150%](免疫“香水反向”的技能（如图多Lv.1被动）也不免疫该效果；免疫“反向”的技能（如斯飞被动）可以免疫该效果但不会增加移速)，持续7秒。\n{蓝色卡牌}：使目标向卡牌飞行方向传送80距离且改变角色朝向，获得8秒失重状态，且可在空中无限跳跃，每次跳跃会略微增加向上漂浮的速度。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
        forecast: 1.5,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '',
            cooldown: 18,
          },
          {
            level: 3,
            description: '卡牌命中时为自身提供恢复/隐身/加速效果，命中兔子大表哥时额外减少CD。',
            detailedDescription:
              '卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，自身根据卡色获得效果：\n红色：获得7Hp/秒的恢复状态，持续5秒；\n黄色：获得{隐身}状态，持续5秒；\n蓝色：移速增加30%，持续3秒。\n卡牌命中兔子大表哥时，本技能当前剩余CD减少30%。',
            cooldown: 18,
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '全图可见',
      },
      {
        name: '兔子先生',
        type: 'weapon1',
        description:
          '召唤{兔子先生(衍生物)}，可下达救援、搬奶酪、推奶酪、拾取、投掷、治疗或跟随指令。兔子继承魔术师的部分效果。',
        detailedDescription:
          '{兔子先生(衍生物)}不在场时，在1.9秒前摇后召唤兔子先生；其在场时，技能按键变为释放指令：在0.9秒前摇后，选取[以魔术师为中心，半径1150范围内的一个目标](优先选择优先级高的目标；优先级相同时，选择直线距离近的目标)下达指令；无CD、可移动释放但不可取消前摇。\n指令按优先级从高到低排列如下：\n1.火箭救援-对被绑上火箭的老鼠下达指令：兔子会救援该老鼠。\n2.搬奶酪-对奶酪下达指令：兔子[放下道具并搬起该奶酪](若兔子手中已有另一块奶酪，则不会放下它)。\n3.推奶酪-对[可交互的洞口](有未推入奶酪的洞口，或兔子手持奶酪时的空洞口)下达指令：兔子会[与其交互](兔子手中有奶酪时，他会朝该洞口投掷；洞口有未推入奶酪时，他会开始推奶酪)。\n4.治疗-对虚弱且未处于控制状态中的老鼠下达指令：兔子会治疗该老鼠。\n5.投掷-兔子手中有[投掷道具](不包括奶酪)时，对猫咪/墙缝/小黄鸭下达指令：兔子会近距离对其[连续投掷/使用道具](兔子投掷道具时，如果所在位置有其他道具，他会一并拾取并投掷/使用，直到没有道具可被拾取；兔子可通过这种方式拾取以下特殊道具：冰块/小鞭炮/鞭炮束/玩具枪/遥控器/冰桶/鞭炮堆/药水/电风扇。其中兔子拾取药水后不会使用，而是在一小段时间后原地放下；兔子会以2000的初速度投掷电风扇)。\n6.拾取-对[易碎道具](包括：玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/番茄)或高尔夫球下达指令：兔子放下其他道具，并拾取该道具。\n7.跟随-无其他目标时下达指令：无效果。\n\n兔子先生的属性：\nHp上限110，Hp恢复2.5但同时拥有2Hp/秒的{恢复}效果（二者可叠加），移速820，跳跃550，攻击增伤20，推速1.6%/s，墙缝增伤2。\n兔子先生的特性：\n1.常态：免疫碎片、捕鼠夹、直接抓起和斯派克抓起。搬运奶酪时不会减速，且可[进行交互](如：开门，拔叉子，火箭救援等)。当自身Hp<0/魔术师被抓起或被淘汰时，自身退场并使技能进入CD。在场时会继承魔术师的[“无畏”知识卡](但改为被救者和魔术师获得无畏效果)、[部分食物和药水效果](仅对由常规道具获得的牛奶恢复/蛋糕恢复/隐身/护盾效果生效，不包括远视/兴奋/变大/技能效果/地图道具效果)。其它判断逻辑[与老鼠类似](如：被猫咪攻击时，对方会获得经验；受推速加成；可被治疗)。\n2.指令执行逻辑：指令下达后将[一直生效](只要指令目标满足指令下达时的所需条件，兔子就会执行对应指令)，直到下一条指令被下达。魔术师下达[新指令](与当前指令目标不同或类型不同)/兔子退场时，兔子将传送到魔术师身边；魔术师下达[相同指令](与当前指令目标和类型均相同)时，[指令失效](兔子继续执行当前指令，不会传送到魔术师身边)。当兔子[无事可做](当前指令指定的行为执行完毕，或执行跟随指令)且与魔术师距离超过360/一段时间内未进行交互和移动时，他将跑向魔术师。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
        forecast: 1.9,
        cooldownTiming: '释放后',
        videoUrl: 'https://www.bilibili.com/video/BV1Qd4y1W7fg/?t=88',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 70,
          },
          {
            level: 2,
            description: '提高兔子的Hp上限。升级时召回兔子并重置CD。',
            detailedDescription: '兔子Hp上限增加40。升级时召回兔子并使CD归零。',
            cooldown: 40,
          },
          {
            level: 3,
            description:
              '兔子的推速、攻击和墙缝增伤提升，在场时提高魔术师的移速、推速和Hp恢复升级时召回兔子并重置CD。',
            detailedDescription:
              '兔子的推速提高75%，攻击增伤提高30，墙缝增伤提高3；其在场时使魔术师移速提高10%，[推速提高3.75%/s](固定值加成，不受其他推奶酪百分比加/减速影响)，并[获得1.67Hp/s的恢复](该状态在受伤时也生效)。升级时召回兔子并使CD归零。',
            cooldown: 40,
          },
        ],
        cueRange: '全图可见',
        aliases: ['小兔子'],
      },
      {
        name: '兔子大表哥',
        type: 'weapon2',
        description:
          '召唤{兔子大表哥(衍生物)}，可下达举火箭、指卧撑或保镖指令。兔表哥被卡牌命中时会储存该效果，并在通过技能出拳命中猫咪时对其附加。魔术师虚弱时也可释放本技能。技能在其他老鼠被淘汰时自动升级，但无法主动升级。',
        detailedDescription:
          '{兔子大表哥(衍生物)}不在场时，在[1.9秒前摇](不可移动释放，可被跳跃键或道具键*打断)后[召唤兔子大表哥](兔子大表哥登场时会进行4.5秒的肌肉展示动作，可被移动打断)；其在场时，可拖动技能按键至半径750以内的目标[下达指令](每次下达指令+30表现分，至多+300分，最短间隔5秒)。\n指令按优先级从高到低排列如下：\n1.举火箭-对火箭下达指令：兔子大表哥传送至该火箭位置并将其举起，使其判定和交互位置上移175距离，并且[不再因倒计时归零起飞](仍会因经典之家炸药堆爆炸起飞)，此时[改变部分技能与火箭的互动关系](沙包拳头无法打灭火箭；滑步踢无法踢飞火箭，乾坤袋无法吞火箭；喜剧之王Lv.2无法使表演者•杰瑞从火箭上挣脱，若在举火箭前挣脱则贴图出错)，[其余技能不变](天使祝福、Lv.3鼓舞可正常对火箭上的老鼠生效；火药桶、Lv.2共鸣可正常拆火箭；爱之花洒可浇灭火箭，但释放位置需上移；友情庇护范围内/风格骤变Lv.3范围内/蓝图内的火箭起飞速度会放缓)。单次最多执行60秒。[火箭位置随兔子大表哥移动](兔子大表哥举火箭期间因道具或技能而位移时，火箭的交互和判定位置会一同移动；兔子大表哥放下火箭时，火箭会传送回原位)。指令期间对其他火箭[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n2.指卧撑-对地面下达指令：兔子大表哥传送至该处并开始做指卧撑，以自身中轴线距地175处为端点，向面朝方向生成一个[长度为125的平台](该平台可与道具产生碰撞；生成时会托起与其位置重合的物件，并挤开位于其边缘的物件；该平台贴图位置：兔子大表哥的头顶到腰部)，该平台具有弹性。该状态下兔子大表哥左右各距离80的范围内存在猫咪时，他会[向面朝方向持续出拳](不影响平台及自身实际位置，不会转身)。单次最多执行10秒。指令期间对其他地面位置下达指令时，剩余时间会被继承。[只能选取平台为目标](可选取斜面平台为目标，但无法选取场景组件（如吊灯）上的平面为目标；某些地板（如太空堡垒I的武器舱地板）视作场景组件，但下方通常有平台，可尝试将指令释放位置下移)。\n3.保镖-无其他可选目标时下达指令：兔子大表哥[跟随魔术师](当兔子大表哥与魔术师距离超过360时,他将跑向魔术师)。该状态下兔子大表哥被卡牌命中且魔术师周围1000距离内存在猫咪时，他会传送到该猫咪位置并出拳；兔子大表哥或魔术师被各自距离400内的猫咪攻击时，他会[在靠近猫咪时向其出拳](如果猫咪距离较近，则会直接跑向对方并出拳；如果距离较远或在进行别的动作，则暂时不出拳，而是之后路过猫咪时顺便出拳)；魔术师虚弱且与兔子大表哥距离小于100时，兔子大表哥会在0.5秒前摇后将魔术师踹飞1150距离，动作后摇0.4秒。\n有关“储存卡牌”及“出拳”的信息如下：\n1.储存卡牌：兔子大表哥[可被卡牌命中](卡牌不会击中其他魔术师的兔子大表哥)并[储存该卡牌](兔子大表哥身上会出现所储存卡牌的特效，但他不会受到卡牌效果)60秒，三种卡牌独立计时，受到已有的卡牌时重置其计时。\n2.出拳：在0.5秒前摇后，对面前距离300内的猫咪造成70%的减速效果，持续1.7秒；出拳[命中猫咪](每次命中+100表现分，至多+1000分)时，会[对其施加储存的其中一种卡牌效果](施加优先级为黄-红-蓝；卡牌效果中的传送方向改为与出拳方向相同；只触发卡牌效果，不会触发Lv.1被动)，并[消耗对应卡牌的储存](单次攻击命中多个目标时，会依次为目标附加不同的卡牌效果，直到储存耗尽；命中已有卡牌效果的猫咪时，也会消耗储存，但不产生效果；未命中目标时，不会消耗储存)。出拳有2.6秒内置CD，所有指令共用。\n\n兔子大表哥的属性：\nHp上限150，Hp恢复3/s，移速820，跳跃550。\n兔子大表哥的特性：\n1.常规：[免疫眩晕等控制状态](但不免疫反向、虚弱和森林牧场三角铁等控制效果)。魔术师被放飞时，兔子大表哥会直接退场；魔术师进洞时，其会在魔术师最后的位置原地待命。其它判断逻辑[与友方猫咪相同或类似](如：具有伤害保护；Hp<0时，会虚弱6.9秒且每秒恢复50Hp，并使击杀者获得金钱。\n2.指令执行逻辑：兔子大表哥[默认执行保镖指令](兔子大表哥被召唤时/执行的指令中断时，他会自动执行保镖指令)。[魔术师在场](不包括被猫抓起期间)且兔子大表哥与魔术师的距离超过1600时，他会中断当前指令并传送到魔术师身边；魔术师被绑上火箭时，他会自动[对魔术师所在的火箭执行举火箭指令](若该火箭为秒飞火箭，则不执行指令；多个火箭重叠时，兔子大表哥会优先举起剩余秒数更少的火箭，即使魔术师本体并不在这个火箭上。)；[自身或魔术师虚弱时会中断当前指令](若魔术师虚弱时与兔子距离较近，则有概率不中断指令，触发原因不详)。兔子大表哥执行指令时的朝向与收到指令时的朝向一致。兔子大表哥在[执行动作](包括：出场时的肌肉展示；出拳前摇；踹飞魔术师的前后摇；Lv.2挥舞火箭攻击的前摇与后摇；虚弱倒地期间)期间[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n\n技能特性：\n魔术师虚弱时也可释放本技能。\n本技能在1/2只老鼠[被淘汰](若老鼠因技能复活，则复活体被淘汰时才算真正被淘汰；在“圣诞大作战”中只有友方老鼠被放飞时才会升至2级，且无法升至3级)时自动升至Lv.2/Lv.3，但无法主动升级。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description: '魔术师推速和救援速度提高（被动生效，无需兔子大表哥在场，下同）。',
            detailedDescription:
              '魔术师[推速固定提高3%/秒](固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高30%（被动生效，无需兔子大表哥在场，下同）。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '魔术师推速和救援速度进一步提高。\n兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且举火箭期间会自动攻击。',
            detailedDescription:
              '改为使魔术师[推速固定提高6%/秒](固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高50%。\n兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且获得新能力：举火箭期间，受到猫咪伤害时或身旁100范围内有猫咪时，兔子大表哥在0.7秒前摇后[挥舞火箭](不影响火箭判定与交互位置)与出拳不同，不会对目标施加卡牌效果），向身侧击退100距离并向上击飞250距离，并减速70%，持续1.7秒，攻击后摇0.5秒。',
            cooldown: 5,
          },
          {
            level: 3,
            description:
              '魔术师免疫{受伤}，且极大提高推速和救援速度。\n兔子大表哥[改变外观](原皮贴图：戴上魔术帽，穿上条纹马甲)，新增主动出拳指令，出拳可以对墙缝造成伤害。',
            detailedDescription:
              '魔术师免疫{受伤}。改为使魔术师[推速固定提高18.75%/秒](该加成为固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高150%。\n兔子大表哥[改变外观](原皮贴图：戴上魔术帽，穿上条纹马甲)，新增指令：[主动出拳-对猫咪或墙缝下达指令](该指令优先级高于指卧撑，低于举火箭)：兔子大表哥传送到目标位置并立即出拳，[该指令出拳有10秒内置CD](内置CD期间释放该指令则兔子传送后不会出拳，但技能仍进入CD；释放其他指令时该内置CD归零)。[出拳](包括：指卧撑出拳，保镖状态出拳和主动出拳)可以对墙缝造成{_17*,无法攻击泡泡}伤害。',
            cooldown: 5,
          },
        ],
        cueRange: '全图可见',
        aliases: ['大兔子', '兔表哥', '蛋白兔'],
      },
      {
        name: '魔术戏法',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '卡牌命中时，手中会出现一张新卡牌（有内置CD）；还会减少所有技能CD并获得经验。',
            detailedDescription:
              '{主动技能}的卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，触发以下效果：减少{主动技能}与{武器技能}CD各10秒；获得两次（400/己方存活人数）点经验；若魔术师未手持道具，则随机获得一张{红色卡牌}/{黄色卡牌}/{蓝色卡牌}（[30秒内不会重复触发](吃蛋糕可减少该CD)）。',
          },
          {
            level: 2,
            description:
              '卡牌命中后，自身投掷的下一个[道具](包括：玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块/番茄/叉子)命中猫咪时对其附加卡牌效果。',
            detailedDescription:
              '{主动技能}的卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，尝试为魔术师[手持的道具](若卡牌命中时魔术师手中有道具，则为此道具；反之为下一个道具。不包括各类饮料)附加以下效果：被魔术师投掷命中[其他角色](包括猫咪和被冰块误伤的其他老鼠，不包括兔子大表哥等)时，额外[为该角色附加卡牌效果](卡色取决于上一次命中的卡牌；只触发卡牌效果，不会触发Lv.1被动)。该效果持续到成功触发或[命中有护盾的目标](只消耗一层护盾且不触发卡牌效果)或[魔术师获得下一张卡牌](被该技能影响的道具被放下/被装入蓝花瓶中时，效果依然存在；魔术师获得新卡牌时，上一个被该技能影响的道具的效果会被清除)。若该道具无法被附加该效果，则无事发生。\n\n可被附加该效果的道具：{盘子}/{扁盘}/{玻璃杯}/{碗}/{叉子}/{高尔夫球}/{香水瓶}/{胡椒瓶}/{番茄}/{冰块}/{灰花瓶}/{蓝花瓶}/{小淘气（组合）}。',
          },
          {
            level: 3,
            description:
              '受到致命伤害时，有低概率消耗手中的魔术卡牌或[易碎道具](包括：玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶/冰块/番茄)，然后免疫当次伤害。',
            detailedDescription:
              '当魔术师[即将进入虚弱状态](有关铁血：即将触发铁血前以及铁血效果结束时均会进行一次判定。其它类似效果同理)时，若手持部分可消耗道具，则有35%的概率消耗该道具并[免疫这次虚弱](仍会受到伤害和其他效果，如受伤、减速和眩晕等)。该被动有180秒的内置CD。\n\n可供消耗的道具：{红色卡牌}/{黄色卡牌}/{蓝色卡牌}/{盘子}/{扁盘}/{玻璃杯}/{碗}/{香水瓶}/{胡椒瓶}/{番茄}/{冰块}/{灰花瓶}/{蓝花瓶}/{蓝色小淘气}/{红色小淘气}。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '绝处逢生',
        description: '配合兔子大表哥快速起身逃离。',
      },
      {
        name: '干扰投掷',
        description: '配合魔术卡牌提高干扰能力。',
      },
    ],
  },

  /* ----------------------------------- 佩克斯 ----------------------------------- */
  佩克斯: {
    aliases: ['舅舅'],
    description:
      '头戴黑色牛仔帽，穿着亮闪闪高皮靴的佩克斯，踏着精准的乐点，手持玫瑰木吉他，在属于他的舞台上舞动、歌唱、奔跑，让人无限怀念那属于西部的浪漫与自由。',
    EnglishName: 'Pecos',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 3,
        description: '魔音有眩晕远击退高伤害。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description:
          '魔音可弹开[绝大多数猫的布局](捕鼠夹、兔八哥萝卜、图多香水等)，琴可为队友加推速。',
        additionalDescription: '三级琴可比肩烟雾弹。',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '2级被动和琴可为队友加推速和回复Hp。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description: '高Hp，可弹开夹子，有免虚和复活甲，舍己救援后可接琴。',
        additionalDescription: '小心[直接抓取](拍子、斗牛、三级枪等)',
      },
      {
        tagName: '后期',
        level: 2,
        description: '后期3级被动和3级武器容错高',
        additionalDescription: '但部分直接抓取技能可无视免疫虚弱和复活甲',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '基础推速较慢，但是被动可加推速',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '干扰',
        pattern: '0110(0)2221',
        weaponType: 'weapon1',
        description:
          '6级后留加点升3级被动，铁血期间可点出3级被动，三级魔音眩晕时间长但击退少，根据需要自己加点。',
      },
      {
        id: '打架队',
        pattern: '02202(0)111',
        weaponType: 'weapon1',
        description: '队友干扰能力较强但推速较慢时，可以考虑做辅助位主点琴加推速。（注意配合）',
      },
      {
        id: '优先被动',
        pattern: '12100(0)221',
        weaponType: 'weapon1',
        description: '5级如果不着急推奶酪可选。',
      },
      {
        id: '优先武器',
        pattern: '1212002(0)1',
        weaponType: 'weapon1',
        description: '着急推奶酪/队友推速慢/车队配合时可选，但3级被动会稍晚出。（注意配合）',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description:
          '适合很多角色的卡组，局内发挥很稳定。{逃窜}和{不屈}能弥补佩克斯移速的不足，与佩克斯的高Hp上限与高恢复能力相得益彰。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'B-绝地反击', 'C-救救我'],
        description: '常用卡组。干扰能力强。对战{斯飞}或{如玉}时可将{绝地反击}换为{不屈}。',
      },
      {
        cards: ['S-缴械', 'S-铁血', 'S-舍己', 'C-救救我'],
        description: '{缴械}卡组。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '魔音贯耳',
        type: 'active',
        description: '发出声波，击退琴头方向的猫咪。前摇期间可以移动和跳跃。',
        detailedDescription: '发出声波，击退琴头方向的猫咪2400单位距离。前摇期间可以移动和跳跃。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: ['道具键*', '跳跃键'],
        forecast: 0.75,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '额外造成伤害和眩晕。',
            detailedDescription:
              '额外造成{80*}伤害并使敌方眩晕2.5秒。目标自身移速越快，击退距离越长。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '可击落道具和老鼠。',
            detailedDescription:
              '技能命中可以击落猫手中道具和老鼠。对于有速度的目标，击退距离进一步增加。',
            cooldown: 15,
          },
        ],
        canHitInPipe: false,
        cancelableSkill: ['道具键*', '药水键', '本技能键', '其他技能键'],
        cooldownTiming: '释放后',
      },
      {
        name: '最佳表演',
        type: 'weapon1',
        description: '持续演奏吉他，范围内的友方持续恢复Hp、敌方被减速并受到少量伤害。',
        detailedDescription:
          '持续演奏吉他2.6秒，弹奏范围为半径750的圆，友方进入范围后0.35、0.75、1.15、1.55、1.95、2.35秒回复10Hp。猫咪减速22%，并在进入范围后0.35、0.75、1.15、1.55秒叠加一次（覆盖原有效果），此后不再叠加；在进入范围1.95、2.35秒后再施加一次[4级减速效果](减速77%)。减速效果持续0.8秒，敌方进入范围后1.4秒、2.4秒将分别受到少量伤害。\n{护盾}等状态可抵消吉他相关负面状态；已进入相关负面状态后，后续获得护盾等状态也不会解除。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['道具键*', '跳跃键'],
        forecast: 0.35,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 22,
            detailedDescription: '吉他每次对敌方造成{10*,不受来源影响,无视护盾,无视伤害保护}伤害。',
          },
          {
            level: 2,
            description: '演奏使友方恢复更多Hp、额外提高推速。',
            cooldown: 22,
            detailedDescription: '每次回复量从10Hp提升至15Hp，额外固定增加7%/s推速。',
          },
          {
            level: 3,
            description:
              '[完整听完演奏的老鼠](包括自己)在7秒内免疫虚弱。对敌方造成的伤害略微提高。',
            cooldown: 22,
            detailedDescription:
              '推速增益将在进入范围后0.35、0.75、1.15、1.55、1.95、2.35秒叠加一次（会覆盖原有效果），持续0.8秒。队友和自身停留在范围内2.4秒后，将在7秒内免疫虚弱。获得该效果时将清除推速增益。\n吉他改为每次对敌方造成{12.5*,不受来源影响,无视护盾,无视伤害保护}伤害。',
          },
        ],
      },
      {
        name: '老牛仔',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '每分钟鼠方全体获得佩克斯赠与的额外经验值，每次获得的经验值逐渐提升。',
            detailedDescription:
              '每分钟鼠方全体获得佩克斯赠与的额外经验值，每次获得的经验值逐渐提升（经验为平分的总经验，首次为800，随后每次比之前增加200，单次经验量上限1600）。',
          },
          {
            level: 2,
            description: '附近有队友时，提升周围[所有队友](包括自己)的移速、跳跃高度和推速。',
            detailedDescription:
              '以自身为半径2350范围内有队友时，周围[所有队友](包括自己)的移速提高6%、跳跃高度提高6%、推速提高6%。',
          },
          {
            level: 3,
            description:
              '进入虚弱状态时，直接回满Hp，同时获得短暂的无敌效果（每局限1次）；佩克斯从火箭上救下队友可以刷新此效果（每局限1次）。',
            detailedDescription:
              '进入虚弱状态时，立即解除虚弱并回复200Hp，同时获得短暂的无敌效果（CD：15分钟，可通过吃蛋糕减少），佩克斯从火箭上救下队友可以刷新此效果（每局限1次）。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '干扰投掷能提高佩克斯的干扰能力，还能让主动技能更容易命中敌方。',
      },
      { name: '绝处逢生', description: '通用特技。' },
    ],
  },
  /* ----------------------------------- 拿坡里鼠 ----------------------------------- */
  拿坡里鼠: {
    description:
      '拿坡里鼠来自意大利，他是一只喜爱吃各种意大利美食的小老鼠，他生活在一个热闹的街道上，平时最喜欢打抱不平、帮助弱小，他是汤姆和杰瑞的好朋友。',
    EnglishName: 'Topo',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '斜塔封路，足球和饼都有一定的干扰能力。',
        additionalDescription: '此外还有被动提供推速加成和搬奶酪速度。',
      },
      {
        tagName: '奶酪',
        level: 2,
        weapon: 2,
        description: '本身推速较快，且可以通过食物力量进一步加速。',
        additionalDescription: '多见于打架队',
      },
    ],
    skillAllocations: [
      {
        id: '意式披萨',
        pattern: '121212000',
        weaponType: 'weapon1',
        description: '饼不吃等级，考虑自保即可。',
      },
      {
        id: '世界波',
        pattern: '133031100',
        weaponType: 'weapon1',
        description: '自保和干扰均衡发展。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'C-救救我', 'S-缴械', 'S-回家'],
        description: '打苏蕊卡组。',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'S-舍己', 'S-缴械'],
        description: '常规卡组。',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'S-舍己', 'B-食物力量', 'A-投手'],
        description: '21知识点卡组，也可以针对斯飞，布奇等依赖移速的猫。',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'S-舍己', 'B-飞跃', 'B-绝地反击'],
        description: '21知识点卡组，能提升拿坡里的自保，使拿坡里变得更全能。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '牛奶'],
        description:
          '通用配置，冰块花瓶用来干扰，牛奶用来配合二级世界波增加逃跑速度；可以将胡椒粉换为砸墙数值相同的香水瓶，也可以换成盘子去弥补伤害和触发世界波眩晕',
      },
    ],
    skills: [
      {
        name: '比萨斜塔',
        type: 'active',
        description: '召唤并弹出{斜塔}，弹飞碰到的敌方。斜塔与墙壁和地板类似，会阻挡道路。',
        detailedDescription:
          '召唤并弹出{斜塔}。斜塔出现时弹飞碰到的敌方，使其[以850的速度被击退，并眩晕1.5秒](正常情况下最终位移距离1275，若弹飞过程中眩晕结束则停止弹飞。可破盾，可击飞跳舞中的苏蕊)。[斜塔与墙壁和地板类似，塔顶可站立，塔身会阻挡道路](朝右的斜塔允许鼠方从右往左通过；空中释放时概率出现无法站立的“飘塔”)。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: ['跳跃键', '道具键*'],
        forecast: 0.5,
        aftercast: 0.4,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '斜塔存在3.5秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '',
            cooldown: 12,
          },
          {
            level: 3,
            description: '增加斜塔的存在时间。',
            cooldown: 12,
            detailedDescription: '增加斜塔的存在时间至6秒。',
          },
        ],
        canHitInPipe: false,
        cueRange: '全图可见',
      },
      {
        name: '意式披萨',
        aliases: ['披萨饼', '大饼'],
        type: 'weapon1',
        description:
          '召唤{披萨}，老鼠可通过交互键骑乘并一同移动，滚动的披萨撞到敌方时破碎，对撞到的敌方和在披萨上驾驶的老鼠造成伤害和[眩晕](可掉落道具和老鼠)，并生成{披萨块}，老鼠碰到后会缓慢恢复Hp。披萨块存在一定时间后消失；披萨存在一定时间后也会自然破碎，但不生成披萨块。\n静止的披萨不会与敌方产生碰撞。',
        detailedDescription:
          '召唤{披萨}，老鼠[可通过交互键骑乘](动作前摇1秒)并一同移动，但期间移速降低2.5%，跳跃高度降低70%，且路过与披萨高度相同的平台时会强制解除交互；滚动的披萨撞到敌方时破碎，对撞到的敌方和碰撞时未脱离披萨饼的老鼠造成{25*}伤害和一段时间的眩晕（伤害来源为拿坡里鼠，对拿坡里鼠造成的伤害变为{25*,不受来源影响}），碰撞后生成{披萨块}，老鼠碰到后会获得5Hp/秒的恢复效果，持续10秒。披萨块存在5秒后消失；披萨饼存在30秒后也会自然破碎，但不生成披萨块。\n[披萨块的生成数量取决于撞到多少敌人](例：1级时撞到两个敌人分裂两块披萨块)。\n静止的披萨不会与敌方产生碰撞。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        canHitInPipe: false,
        forecast: 1.4,
        skillLevels: [
          {
            level: 1,
            description: '披萨饼破碎后基础生成1个披萨块。',
            detailedDescription: '披萨饼碰撞会造成1.9秒眩晕，破碎后基础生成1个披萨块。',
            cooldown: 20,
          },
          {
            level: 2,
            description:
              '披萨饼造成的眩晕时间延长，破碎后生成披萨块的数量提高到3个。披萨块可以解除一些不良状态。',
            detailedDescription:
              '披萨饼造成的眩晕时间延长到2.9秒，破碎后生成披萨块的数量提高到3个。披萨块可以解除受伤，失明，反向效果。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '受披萨饼眩晕的角色大幅减少视野。',
            cooldown: 20,
            detailedDescription:
              '受披萨饼眩晕的角色减少视野至原来的50%，持续5秒。（当前Lv.3效果有bug，并不增加救援速度，与游戏内描述不符）',
          },
        ],
        cancelableAftercast: '无后摇',
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '世界波',
        type: 'weapon2',
        description:
          '开始蓄力，期间无法移动、[完全失重](完全不会因受到重力而向下坠落。若该状态下受到其他受力效果（如鞭炮爆炸等），则会以固定速度进行位移)且增大视野；随后可踢出{闪耀足球}，命中敌方时造成“强光耀眼”状态（受到伤害，并且{失明}，降低交互速度，再次受到来自拿坡里鼠的伤害会眩晕2秒（眩晕有8秒内置CD））。足球存在时间与蓄力时间有关。足球可以反复弹跳。',
        detailedDescription:
          '[点击技能开始蓄力](蓄满力需1.7秒，此后最多保持蓄力状态3.5秒，到达时间后强制施放技能)，蓄力期间无法移动、[完全失重](完全不会因受到重力而向下坠落。若该状态下受到其他受力效果（如鞭炮爆炸等），则会以固定速度进行位移)且视野扩大43%。松开技能键或一段时间后结束蓄力，踢出{闪耀足球}，命中敌方时造成“强光耀眼”状态（受到{30*,不受来源影响}伤害；{失明}；降低[部分交互](绑普通/5V5火箭、放老鼠夹、拔叉子)25%交互速度；期间再次受来自拿坡里鼠的伤害会眩晕2秒（8秒内不会重复触发）），持续8秒。[有效蓄力时间越长，足球存在时间越长](有效蓄力时长最长1.7秒，足球持续时间和速度由蓄力时间阶段性决定，并非线性关系)。足球碰到道具/墙壁/地板后会被反弹，可以反复弹跳。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '开始蓄力时，自动吸取并吃掉周围的一个食物。',
            detailedDescription:
              '开始蓄力时，自动[吸取](使对应道具消失，动画表现为被拿坡里鼠卷走)半径640范围内的1个{蛋糕}或{牛奶}，并在1秒后获得其效果。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '踢出足球时会立刻对以自身为中心的矩形范围内所有敌方造成“强光耀眼”状态。',
            detailedDescription: '踢出足球时会立刻对半径640范围内所有敌方造成“强光耀眼”状态。',
            cooldown: 15,
          },
        ],
        aliases: ['足球'],
        canHitInPipe: false,
        cueRange: '本房间可见',
      },
      {
        name: '侠义相助',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '吃食物、喝饮料、碰触披萨块可以减少{主动技能}与{武器技能}的CD。',
            detailedDescription:
              '获得{蛋糕}或{牛奶}状态时，减少{主动技能}与{武器技能}10秒CD；获得任意{饮料}状态时，减少20秒CD；获得{披萨块}状态时，减少3秒CD。',
          },
          {
            level: 2,
            description: '被绑上火箭时，火箭燃烧速度减少，被队友救援的速度增加。',
            detailedDescription: '被绑上火箭时，火箭燃烧速度减少20%，被队友救援的速度增加20%。',
          },
          {
            level: 3,
            description: '技能命中猫咪后，救援队友的速度增加。',
            detailedDescription: '技能命中猫咪后，救援队友的速度增加80%，持续6秒。',
          },
        ],
        description: '',
        detailedDescription: '',
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '配合技能空造塔或利用足球卡滞空。',
      },
      {
        name: '干扰投掷',
        description: '道具配合三级球连控。',
      },
    ],
    aliases: ['小拿'],
  },
  /* ----------------------------------- 侦探泰菲 ----------------------------------- */
  侦探泰菲: {
    aliases: ['侦菲'],
    description:
      '侦探泰菲最擅长分析各类疑难问题和数据测算，在日常的探案中，侦探泰菲是侦探杰瑞最有力的助手!',
    EnglishName: 'Detective Tuffy',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 4,
        description:
          '基础推速与侦探杰瑞并列第一。另外后期可以用{3级主动}的换位进行超远程搬运奶酪。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '主动技能的隐身效果可以方便救援，但是在火箭下有老鼠夹时侦探泰菲难以应对，需等待6级点出3级隐身后，才能舍己换位躲夹救人。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 2,
        description:
          '主动技能到了三级可以舍己换位救人，或是低状态时直接换位跑路；三级被动站着不动就能回血。到了后期自保会很强悍。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '101012220',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '如有自保或回血需要，可以在8级先点出{3级被动}。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '常用，可拉扯。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        aliases: ['隐身'],
        name: '分身大师',
        type: 'active',
        description:
          '自身进入隐身状态，同时召唤1个{侦探泰菲分身}，分身会自由走动，被敌方击倒时使其短暂失明。',
        detailedDescription:
          '自身进入隐身状态，持续一段时间；同时召唤1个{侦探泰菲分身}，存在6.9秒，被敌方击倒时使其失明1.75秒，但不会破盾或减少护盾时间。\n分身大师分身特性：Hp上限为25并[按比例继承本体Hp](如本体Hp为24，分身Hp将为8.33)、继承角色Hp恢复速度、不继承本体状态和知识卡、免疫捕鼠夹；Hp归零或持续时间结束时将原地消失；会在地图内四处走动，可能会钻管道；若半径800范围内出现猫咪，分身会尝试远离之。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '隐身状态下除喝药水和移动跳跃外的任何动作都将导致显形。',
            detailedDescription:
              '隐身持续4.8秒；隐身状态下除喝药水和移动跳跃外的任何动作都将导致显形。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '隐身期间获得远视，且使用道具和交互不再显形。',
            detailedDescription:
              '隐身期间[扩大视野2.78倍](覆盖其他视野提升效果)，且使用道具和进行交互不再显形。',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '分身持续时间延长。分身存在期间，可以再次点击技能键与分身换位（CD：8秒）。',
            detailedDescription:
              '分身存在时间延长至11.9秒。分身存在期间，可以再次点击技能键与分身换位（CD：8秒），但爬梯子、被眩晕时无法换位。',
            cooldown: 15,
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '追踪饮料',
        type: 'weapon1',
        description:
          '拿出饮料杯朝地上倾倒，留下{饮料印记}，持续25秒。一旦印记与猫咪处在同一个房间，印记会召唤1个[模拟自己或队友外形](只包括存活的鼠方队友)的{饮料分身}。分身被敌方击倒时使其短暂失明。存在{侦探泰菲分身}或{饮料分身}时，印记不会召唤新的分身；使用分身大师将使饮料分身立即消失。',
        detailedDescription:
          '拿出饮料杯朝地上倾倒，留下{饮料印记}，持续25秒。一旦印记与猫咪处在同一个房间，印记会召唤1个[模拟自己或队友外形](只包括存活的鼠方队友)的{饮料分身}，持续较长时间。分身被敌方击倒时使其失明1.75秒，但不会破盾或减少护盾时间。当场上存在[由自身召唤](即不包括其他侦探泰菲召唤的分身)的{侦探泰菲分身}或{饮料分身}时，印记不会召唤新的分身；使用分身大师将使饮料分身立即消失。\n饮料分身特性：Hp上限为角色Hp上限减49并[按比例继承本体Hp](如124血的剑杰Hp为24，召唤出的分身Hp将为15)，若同房间内出现出现猫咪将跑向最近的道具/果盘/冰桶处，若半径800范围内出现猫咪将使用相应道具进行攻击。', // FIXME: 玩具枪也会用吗？“被击倒”是Hp归零还是要小于0？
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: '无后摇',
        forecast: 1.3,
        skillLevels: [
          {
            level: 1,
            description:
              '[猫咪](不论是否隐身)靠近印记时，侦探泰菲移速、跳跃速度提升。若饮料召唤出分身，将立即结束此状态。',
            detailedDescription:
              '饮料分身存在9.9秒。[猫咪](不论是否隐身)进入印记半径1250范围内时，侦探泰菲加速20%、跳跃速度提升20%，持续20秒。若饮料召唤出分身，将立即结束此状态。',
            cooldown: 22,
          },
          {
            level: 2,
            description:
              '[猫咪](不论是否隐身)靠近印记时，对所有友方暴露小地图视野。若饮料召唤出分身，将立即结束此状态。',
            cooldown: 22,
            detailedDescription:
              '[猫咪](不论是否隐身)进入印记半径1250范围内时，对所有友方暴露小地图视野25秒。若饮料召唤出分身，将立即结束此状态。',
          },
          {
            level: 3,
            description: '分身存在时间延长。',
            detailedDescription: '分身存在时间延长至20秒。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '暗中观察',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '隐身期间，移速和跳跃速度提升，并可以看到隐身的猫咪。',
            detailedDescription: '隐身期间，加速10%，跳跃速度提升5%，并可以看到隐身的猫咪。',
          },
          {
            level: 2,
            description: '隐身期间持续恢复Hp。',
            detailedDescription: '隐身期间，以5/s持续恢复Hp。',
          },
          {
            level: 3,
            description:
              '保持静止2秒后将进入隐身状态，并获得减伤。附近的猫咪时可以[感知](状态栏显示【警觉】：附近似乎有躲起来的侦探泰菲)到自己在该状态隐身。',
            detailedDescription:
              '保持静止2秒后将进入隐身状态，并获得50%减伤。一旦移动、跳跃、使用道具键、进行交互、被眩晕则会脱离此状态，强制位移、被击倒不会。半径1000范围内的猫咪可以[感知](状态栏显示【警觉】：附近似乎有躲起来的侦探泰菲)到自己在该状态隐身。',
          },
        ],
      },
    ],
    specialSkills: [
      { name: '绝处逢生', description: '绝处逢生和隐身搭配能大幅提高生存能力，还能用来清理夹子。' },
    ],
  },

  /* ---------------------------------- 剑客莉莉 ---------------------------------- */
  剑客莉莉: {
    aliases: ['剑莉', '莉莉'],
    description:
      '来自法国第一女剑客莉莉，她的剑招低调不失气势，华丽而不失潇洒，她是坏人们最害怕的敌人。',
    EnglishName: 'Mouseketeer Lilli',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description:
          '{2级被动}提供短暂无敌，可提前生成剑气幻影，救下队友后立刻传送，达成无伤救援。',
        additionalDescription: '稳救不稳走，依赖隐身；被{捕虫网}和各种强制位移技能克制。',
      },
      {
        tagName: '干扰',
        level: 2,
        description:
          '风墙可以困住或阻挡猫咪；剑气命中敌方有高额减速；自身攻击增伤也较高，适合投掷道具干扰。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '{2级主动}的风墙可以让队友快速起身，避免被抓。',
        additionalDescription:
          '若有需要，也可以尝试用剑气命中[队友](甚至包括虚弱的队友)，让其获得位移能力。但老鼠模型小，剑气很难命中。',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '02(0)111022',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
        description: '常规卡组，逃之夭夭和不屈提供较强的机动性。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '常规卡组，护佑提高前期救援能力。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '用缴械对抗依赖爪刀的猫。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
        description: '幸运体系卡组，减少队伍救援次数，防止拖累游戏节奏。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
      {
        items: ['盘子', '玻璃杯', '冰块', '灰花瓶'],
        description: '平衡扰和救援能力。',
      },
    ],
    skills: [
      {
        name: '御风剑舞',
        type: 'active',
        aliases: ['风墙'],
        description:
          '创造一道{风之屏障}，[敌方会被风墙阻挡，无法进出风墙](位于风墙内的敌方仍可通过部分传送及强制位移类技能离开，如莱特宁-瞬移闪击，库博-虚幻梦影)。',
        detailedDescription:
          '创造一道{风之屏障}，风墙大小500*500，持续一小段时间。[敌方会被风墙阻挡，无法进出风墙](位于风墙内的敌方仍可通过部分传送及强制位移类技能离开，如莱特宁-瞬移闪击，库博-虚幻梦影)。风墙对所有角色造成判定干扰，如猫的爪刀、拍子无法穿过风墙，风墙卡位时老鼠无法推奶酪。小跳风可将正在绑火箭的猫挤出火箭从而强行阻止猫绑火箭。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        // cancelableSkill: '不确定是否可被打断', // FIXME
        cancelableAftercast: '无后摇',
        forecast: 0.5,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '风墙持续3秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '屏障内的老鼠虚弱时间缩短。',
            detailedDescription: '在风墙中心半径850范围内老鼠虚弱时间缩短5秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '风墙持续时间延长；屏障内猫咪禁用技能与道具。',
            detailedDescription: '风墙持续时间延长至4.5秒；屏障内猫咪禁用技能与道具。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '幻影剑气',
        type: 'weapon1',
        description:
          '挥出一道{剑气}。剑气击中平台形成{幻影}，剑客莉莉再次点击技能可传送至幻影处；击中墙壁则不生成幻影。剑气首次击中角色/{小黄鸭}时将反弹，击中敌方造成伤害和减速；击中友方将给予移速、救援及跳跃高度提升，且获得持续5秒且仅可使用一次的额外技能：使用额外技能将瞬移至幻影处。',
        detailedDescription:
          '挥出一道{剑气}(可点按释放，也可拖动技能键调整剑气飞行方向)，同时技能进入禁用状态与持续5秒的读条状态。{剑气}飞行速度1750，轨迹为抛物线。若{剑气}击中平台或地面，则形成[持续5秒](幻影生成时才开始计时，\n即与技能读条的计时相互独立)的{幻影}并解除技能禁用，剑客莉莉在读条结束前再次点击技能可[传送至{幻影}处](此时中断技能读条并进入CD)；若击中墙壁，则不生成{幻影}，也不中断读条状态或解除技能禁用；若{剑气}在读条结束后才击中平台或地面，则仍会形成[持续5秒](幻影生成时才开始计时，\n即与技能读条的计时相互独立)的{幻影}但无法传送。任何情况下读条结束时解除技能禁用并进入CD。\n{剑气}首次击中角色/{小黄鸭}时将反弹，击中敌方造成{10*}伤害，并降低其40%移速、跳跃高度，持续5秒；击中[友方](包括处于虚弱状态的友方)使其移速、救援速度、跳跃高度提高25%，持续5秒，且获得持续5秒且仅可使用一次的额外技能：使用额外技能将瞬移至{幻影}处。初始情况下，剑客莉莉的二段技能以及队友被命中后获得的额外技能均处于不可使用状态，只有{幻影}生成后才可再次使用。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cooldownTiming: '释放后',
        // cancelableSkill: '不确定是否可被打断', // FIXME
        cancelableAftercast: '无后摇',
        forecast: 0.45,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: 'CD为20秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '',
            cooldown: 10,
            detailedDescription: '',
          },
          {
            level: 3,
            description: '被剑气击中的友方攻击提升。',
            detailedDescription: '被剑气击中的友方攻击增伤提升50，持续5秒。',
            cooldown: 10,
          },
        ],
      },
      {
        name: '攻无不克',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: 'Hp满时，获得减伤。',
            detailedDescription: '当Hp高于[Hp上限的99%](122)时，获得60%减伤。',
          },
          {
            level: 2,
            description: '当道具命中敌方时，获得4秒无敌，该效果有45秒内置CD。',
          },
          {
            level: 3,
            description:
              '当道具命中困在风墙内或被剑气打中的猫咪时，额外造成眩晕效果（可救下其手中的老鼠），对同一敌方有45秒内置CD。',
            detailedDescription:
              '当道具命中困在风墙内或被剑气打中的猫咪时，额外造成2.5秒眩晕效果（可救下其手中的老鼠），[对同一敌方有45秒内置CD](敌方会获得名为“免疫”的状态，状态期间免疫该眩晕效果)。',
          },
        ],
      },
    ],
    specialSkills: [
      { name: '干扰投掷', description: '提高干扰能力，还能配合风墙拖延更长时间。' },
      { name: '应急治疗', description: '提高续航能力，并且能更方便地触发1级被动。' },
    ],
  },

  /* ----------------------------------- 罗宾汉泰菲 ----------------------------------- */
  罗宾汉泰菲: {
    aliases: ['罗菲'],
    description:
      '来自12世纪英国的侠盗罗宾汉泰菲，他身形灵敏，擅长利用草丛隐蔽自己，是罗宾汉杰瑞的好帮手。',
    EnglishName: 'Robin Hood Tuffy',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '弹球可干扰猫咪，藤蔓能提供投掷道具。',
        additionalDescription: '藤蔓还能在狭窄的垂直地形堵住猫咪。自身Hp上限低，干扰时需注意安全。',
      },
      {
        tagName: '辅助',
        level: 4,
        description: '藤蔓可制造特殊地形进行支援，{2级藤蔓}还能为全队提供恢复。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 4,
        description: '弹球可对墙缝造成高额伤害，并且每次进出墙缝边缘都会造成伤害。',
        additionalDescription: '尽量选择合适角度来多次反弹，必要时可制造平台来辅助。',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '推速相对较快，且擅长搬奶酪，偶尔还能开出奶酪。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '通用加点',
        pattern: '12[12][0010]2',
        weaponType: 'weapon1',
        description:
          '本套为通用加点，适合大部分场合。如果不需要{3级弹力圆球}，可以将被动的加点提前。',
        additionaldescription:
          '{2级主动}提供控制，{2级武器}提供恢复和储存，根据实际情况抉择。被动升至Lv.2/Lv.3时会立即刷新护盾，推荐在需要时再加点。由于现版本{3级弹力圆球}加点仅在墙缝期有作用，可在6级时预计墙缝期等级是否足够点出{3级主动}而将被动提前加点来获得被动盾收益，尤其残局。',
      },
    ],
    knowledgeCardGroups: [
      {
        id: '干扰卡组',
        description:
          '以精准投射为主，不屈、绝地反击等知识卡为辅的卡组。弹球配合精准投射可以打出弹射-投掷-弹射的连招，但要注意弹球的控制有内置CD，避免断控。不屈能提高Hp上限，增强生存能力；绝地反击需要Hp低于一定百分比才能触发，而罗菲基础Hp低，因此触发所需受到的伤害量比一般老鼠低，与其有一定适配性。罗菲单人救援能力较差，容易被猫咪抓住破绽，因此救援时建议协同其他队友，或先控制住猫咪。',
        groups: [
          {
            cards: ['S-舍己', 'S-铁血', 'B-精准投射', 'C-不屈', 'C-救救我'],
            description:
              '泛用性很高的经典卡组。可根据需要[将不屈或救救我替换为绝地反击](非组队情况下慎换救救我，以防队友在不知情的情况下错判救援形势)',
          },
          {
            cards: ['S-铁血', 'B-精准投射', 'B-绝地反击', 'C-不屈', 'C-救救我'],
            description: '经典卡组的低知识量变种，干扰能力强。',
          },
        ],
        defaultFolded: false,
        detailedDescription:
          '以精准投射为主，不屈、绝地反击等知识卡为辅的卡组。弹球配合精准投射可以打出弹射-投掷-弹射的连招，并减少技能CD大幅提高罗菲的机动性，但要注意弹球的控制有内置CD，避免断控。不屈能提高Hp上限，增强生存能力；绝地反击需要Hp低于一定百分比才能触发，而罗菲基础Hp低，因此触发所需受到的伤害量比一般老鼠低，与其有一定适配性。罗菲单人救援能力较差，容易被猫咪抓住破绽，因此救援时建议协同其他队友，或先控制住猫咪。',
      },
      {
        id: '干扰卡组变种',
        description: '前类卡组在不同情况下的变种，特异性强化某些能力，更适合针对特定猫咪。',
        groups: [
          {
            cards: ['S-铁血', 'A-投手', 'B-精准投射', 'C-不屈', 'C-救救我'],
            description:
              '投手卡组，适合[对抗斯飞](斯飞的技能需要高移速才能正常生效。投手配合圆球可以尝试打断斯飞的疾冲，大幅降低其追击和攻击能力)。也可以酌情将精准投射换为舍己。',
          },
          {
            cards: ['S-缴械', 'S-铁血', 'B-精准投射', 'C-救救我'],
            description:
              '缴械卡组，适合对抗[莱特宁，苏蕊等害怕缴械的猫咪](这类猫咪往往高度依赖爪刀造成伤害。缴械可以封锁对方爪刀，降低对方攻击能力)，但容错和上限较低。',
          },
          {
            cards: ['S-无畏', 'S-铁血', 'B-精准投射', 'C-救救我'],
            description:
              '无畏卡组，适合对抗[米特等需要用无畏破局的猫咪](这类猫咪往往有大范围的持续伤害，擅长防守最后一块奶酪。无畏能一定程度上避免救援时被一换一，也可以用于强行推入最后一块奶酪)，但容错和上限较低，也不推荐在没有队友支援的情况下用无畏救援。',
          },
          {
            cards: ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-救救我'],
            description:
              '幸运体系卡组，适合对抗[库博等机动性强但防守能力较弱的猫咪](这类猫咪往往喜欢将老鼠绑到极远的位置，利用老鼠救援的时间差快速击倒其他老鼠，达到令鼠方疲于奔命的目的。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。',
          },
        ],
        defaultFolded: true,
      },
      {
        id: '游击自保卡组',
        description: '以自保为主的卡组。有效提高自身的生存能力，但干扰能力相对较低。',
        groups: [
          {
            cards: ['S-舍己', 'S-铁血', 'S-护佑', 'C-救救我'],
            description:
              '经典卡组，容错高但上限低，推荐新手或初次接触该角色的玩家尝试。若有需要，也可将舍己换为无畏、缴械等针对特定猫的知识卡。',
          },
          {
            cards: ['S-铁血', 'B-幸运', 'C-不屈', 'C-脱身', 'C-救救我'],
            description:
              '幸运体系卡组，[适合对抗库博等机动性强但防守能力较弱的猫咪](这类猫咪往往喜欢将老鼠绑到极远的位置，利用老鼠救援的时间差快速击倒其他老鼠，达到令鼠方疲于奔命的目的。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。该卡组上限相对较低。若有需要，也可将救救我换为祝愿，增强对幸运体系的适配性。',
          },
          {
            cards: [
              'S-舍己',
              'S-铁血',
              'C-不屈',
              'C-救救我',
              [CardGroupType.Or, 'B-夹不住我', 'A-逃窜', 'B-孤军奋战'],
            ],
            description:
              '对策如玉卡组，{精准投射}效果差，可将其换为其它提高自保的知识卡。{夹不住我}改版后效果整体变弱，推荐在多管道、{熊猫馆}等存在较多必踩夹的地图使用。罗菲的机动性并不依赖自身移速，但仍可酌情选取移速卡来填补自身技能CD。',
          },
          {
            cards: ['S-舍己', 'S-铁血', 'C-不屈', 'B-食物力量', 'C-救救我'],
            description:
              '{食物力量}由于道具刷新改版而地位大幅下滑，考虑到可以开局加点罗菲{1级被动}来获得收益，且游戏中仍有类似{太空堡垒II}休闲舱等集中刷新食物的房间，[在队伍中无主推位、不需要罗菲来承担大量干扰义务时](如打架队)可考虑选取，此时罗菲定位变为高机动的中速奶酪位，且需要开局一分钟吃食物启动。该打法会滞后罗菲主动与武器技能加点，使得罗菲团队能力明显下降，建议只在四排使用。',
          },
        ],
        defaultFolded: true,
      },
    ],
    recommendedStorePlans: [
      {
        items: ['胡椒瓶', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '弹力圆球',
        aliases: ['弹球'],
        type: 'active',
        description:
          '蓄力弹射，对目标造成效果。弹射过程中，点击技能将结束弹射并[下坠](属于技能后摇，可被道具键*取消)。',
        detailedDescription:
          '长按技能键，在0.5秒前摇后开始蓄力，[拖拽并松开技能键进行弹射](弹射方向由技能拖拽的方向决定，初速度锁定为1675)，弹射时间随蓄力时间线性增加，最短1秒，最长4.7秒（[需要蓄力条满](满后仍能继续蓄力，但不增加弹射时间)，即蓄力2.5秒以上）。弹射过程中碰撞体积增大，碰撞到[目标](包括：敌方、墙缝、小黄鸭、森林牧场大鸭子、墙壁、平台、地面)时将被[反弹](方向遵守反射定律。反弹平面为竖直面时，速度不变；为水平面时，改变速度：首次反弹初速度最高为1225，最低为1050，再次反弹初速度锁定为1050。碰撞敌方/墙缝/鸭子时的反弹平面始终为竖直面，与他们的碰撞体积重叠期间只会进行一次反弹)。弹射时技能同步进入读条，可通过道具键*立刻结束技能，再次点击技能则[竖直向下坠落1.5秒](初速度锁定为2000；下坠期间只会碰撞平台或地面，动作期间无法进行其他操作，可用道具键*取消)，碰撞平台或地面时进入0.3秒不可取消的后摇。前摇期间取消技能不进入CD，蓄力期间取消则进入50%的CD。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: ['道具键*'],
        forecast: 0.5,
        canHitInPipe: false,
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '碰撞敌方造成伤害和2秒减速。碰撞墙缝造成少量伤害。',
            detailedDescription:
              '碰撞敌方造成{50*}点伤害和20%减速，持续2秒，敌方减速期间不会再次受到该技能效果。碰撞墙缝造成{_10*}点伤害。',
            cooldown: 7,
          },
          {
            level: 2,
            description:
              '弹射期间获得[弱霸体](不免疫反向、失明、虚弱等状态)，碰撞敌方造成[眩晕](可击落道具，但无法击落老鼠)，但内置CD延长。',
            detailedDescription:
              '弹射期间获得[弱霸体](不免疫反向、失明、虚弱等状态)，碰撞敌方造成2秒[眩晕](可击落道具，但无法击落老鼠)，但不再造成减速，且敌方眩晕期间及眩晕结束后4秒内不会再次受到该技能效果。',
            cooldown: 7,
          },
          {
            level: 3,
            description: '提高对墙缝的伤害。',
            detailedDescription: '对墙缝的伤害提高至{_16*}。',
            cooldown: 7,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '藤蔓',
        aliases: ['树'],
        type: 'weapon1',
        description:
          '生成{藤蔓}，并在藤蔓顶端生成平台和{藤蔓纸盒}。藤蔓可攀爬，且被友方攀爬的速度大幅提高。敌方登上藤蔓顶端时受到1秒减速效果，且其在藤蔓顶端跳跃时会使藤蔓持续时间缩短。',
        detailedDescription:
          '在0.7秒后，在[自身前方150处](若拟生成藤蔓的位置有硬性墙体阻挡，实际位置会向罗宾汉泰菲进行移动，最低距离25)生成{藤蔓}。藤蔓生成时先出现高1100、宽250的可攀爬区域；该区域生成1.2秒后，在其顶端生成宽为350的平台和一个{藤蔓纸盒}。友方攀爬藤蔓的速度是爬普通梯子的4倍，敌方不变。敌方登上藤蔓顶端时受到1秒10%减速效果，且其在藤蔓顶端跳跃时会使藤蔓持续时间缩短3秒。\n藤蔓纸盒：与{大纸盒}类似，但只会开出以下8种道具：{盘子}、{扁盘}、{玻璃杯}、{碗}、{叉子}、{高尔夫球}、{灰花瓶}、{奶酪}。携带“美食家”知识卡时，改为开出{牛奶}或{蛋糕}，与{小纸盒}/{大纸盒}共计次数。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '藤蔓持续一小段时间。',
            detailedDescription:
              '藤蔓可攀爬区域和顶端平台均生成完毕后，持续10秒，随后[一起消失](藤蔓纸盒不会消失)。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '持续时间延长；友方站上藤蔓平台将回复Hp。',
            detailedDescription:
              '持续时间延长到15秒，友方[站上藤蔓平台](离开再重新回到平台/在平台和平台边缘间来回走动也能触发回复，并刷新持续恢复的持续时间)立刻回复27Hp并获得8Hp/秒的恢复效果，持续3秒。该效果结束后有5秒内置CD。',
            cooldown: 15,
            charges: 2,
          },
          {
            level: 3,
            description: '藤蔓的恢复效果可解除{受伤}，同时提高跳跃速度。',
            detailedDescription: '藤蔓的恢复效果可解除{受伤}，同时提高跳跃速度。',
            cooldown: 15,
            charges: 2,
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '野生体格',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '[吃食物](包括牛奶、蛋糕和天宫凌霄殿仙丹)后永久增加跳跃速度，最多叠加5次。',
            detailedDescription:
              '[吃食物](包括牛奶、蛋糕和天宫凌霄殿仙丹)后永久增加6%跳跃速度，最多叠加5次。',
          },
          {
            level: 2,
            description: '每隔一段时间，获得一层短时间的护盾。（加点时立刻获得护盾并重置护盾CD）',
            detailedDescription:
              '每隔15秒获得一层[护盾](该护盾无法免疫{斯派克}的抓取)，该护盾持续5秒。（加点时立刻获得护盾）',
          },
          {
            level: 3,
            description:
              'Hp自然恢复速度增加；2级被动的护盾触发时解除{受伤}。（加点时立刻获得护盾并重置护盾CD）',
            detailedDescription:
              '获得2Hp/秒的{恢复}状态；2级被动的护盾触发时解除{受伤}。（加点时立刻获得护盾并重置护盾CD）',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '干扰投掷',
        description:
          '[配合圆球和精准投射打出高频控制](基本连招：圆球起手，接上控制道具，干扰投掷小道具，放树拉扯)，提高干扰能力。',
      },
      {
        name: '绝处逢生',
        description: '通用特技。',
      },
      {
        name: '魔术漂浮',
        description:
          '仅在高低差多的地图可考虑携带，补充容错。不过罗菲本身就有藤蔓和[圆球二段跳](在空中向上释放弹力圆球，达到二段跳的效果)，并不特别依赖漂浮。',
      },
    ],
  },

  /* ----------------------------------- 玛丽 ----------------------------------- */
  玛丽: {
    description:
      '高贵优雅的贵族成熟女性，头戴星光闪耀的王冠，她的真实身份其实是公主，肩负责任的她有自己的原则和处事方式。',
    EnglishName: 'Marie',
    mousePositioningTags: [
      {
        tagName: '辅助',
        level: 4,
        description: '2级扇子可以解除队友的虚弱状态并回血。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description: '三级扇子可以吹飞夹子、图多盖洛的香水等。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 2,
        description: '自身的推速较快、2级扇子有推速加成。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        level: 2,
        description: '后期三级礼仪可干扰猫绑火箭。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 2,
        weapon: 1,
        description:
          '后期三级折扇可吹动地上的大量道具砸墙，且可吹动{鞭炮束}分解出的{小鞭炮}实现对墙缝的高额伤害',
        additionalDescription: '小心不要炸到队友／冰到队友了。',
      },
    ],
    skillAllocations: [
      {
        id: '折扇破局',
        pattern: '2(0)2121100',
        weaponType: 'weapon1',
        description: '加点灵活，可随机应变。需保留一级被动加点，当铁血触发且附近有队友时再加点。',
      },
      {
        id: '后期礼仪控场',
        pattern: '2(0)2111200',
        weaponType: 'weapon1',
        description: '适用于不需要破局的情况，更早点出三级礼仪控场。紧急情况下可点三级礼仪进行救人',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-无畏', 'C-救救我', 'B-应激反应'],
        description: '适合在钻石及以下的对局，或应对防守型猫咪。',
      },
      {
        cards: ['S-铁血', 'S-护佑', 'S-舍己', 'C-救救我'],
        description: '适合在钻石以上的对局。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '贵族礼仪',
        type: 'active',
        description: '玛丽优雅行礼，对左右两侧一定范围内的所有敌方造成负面效果。',
        detailedDescription:
          '玛丽优雅行礼，对以自身为中心，对左右两侧600范围内的所有敌方造成负面效果。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['道具键*', '跳跃键'],
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description:
              '使猫在5秒内禁用爪刀（20秒内无法重复触发），并[解除其隐身效果](该效果无视护盾影响)。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '',
            cooldown: 15,
          },
          {
            level: 3,
            description: '额外造成1秒[眩晕](可击落猫手中的老鼠)，并禁用猫的技能5秒。',
            cooldown: 15,
          },
        ],
        forecast: 0.25,
        aftercast: 0.75,
      },
      {
        name: '香风折扇',
        aliases: ['扇子'],
        type: 'weapon1',
        description:
          '手持折扇向前方扇风，对命中的敌方造成[少量伤害、反向和失明效果](可分别击破共计2层护盾)，持续5秒。',
        detailedDescription:
          '手持折扇向前方扇风，对前方650范围内的敌方依次造成{反向}状态，以及{50*}伤害和{失明}状态（反向与失明依次各自结算，可各自击破共计2层护盾；伤害为失明状态附带的一次性效果，若免疫失明则同步免疫伤害），均持续5秒。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['道具键*', '跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description:
              '命中的友方（含自身）立即解除{鼠虚弱}状态并回复少量Hp，随后短暂提升移速和推速。',
            cooldown: 20,
            detailedDescription:
              '命中的友方（含自身）立即解除{鼠虚弱}状态并回复30Hp，随后5秒内移速提升18%，推速固定增加4%/秒。',
          },
          {
            level: 3,
            description:
              '可吹飞部分道具。吹飞的投掷道具击中猫会对其造成相应效果。可吹飞{打开的老鼠夹}，{香水区域}等。',
            cooldown: 20,

            detailedDescription:
              '可吹飞部分道具。吹飞的投掷道具击中猫会对其造成相应效果。吹飞的易碎投掷道具与地面或道具产生碰撞立即破碎。可吹飞{打开的老鼠夹}，{香水区域}等。\n吹不飞的道具：所有饮料，{玩具枪}、{蛋糕}、{牛奶}、{大纸盒}、{小纸盒}、{空投包裹}、{果盘}、{修理锤}、{遥控器}，其他所有道具都能吹走。',
          },
        ],
        canHitInPipe: false,
        forecast: 0.3,
        aftercast: 0.85,
      },
      {
        name: '优雅从容',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '队友在附近时可免除一次虚弱状态。(CD：50秒)',
            detailedDescription: '玛丽自身周围半径900范围内有队友时可免除一次虚弱状态。(CD：50秒)',
          },
          {
            level: 2,
            description: 'Hp上限增加[25](从99变为124)。',
          },
          {
            level: 3,
            description:
              '附近的敌方会受到减速效果。队友在附近时，玛丽和附近的队友的移速不会低于310。',
            detailedDescription:
              '附近半径1000内的敌方移动速度降低15%。当附近900范围内有队友时，附近半径900范围内的所有友方单位的移速不会低于310。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '提高干扰能力和技能命中率。',
      },
    ],
  },

  /* ----------------------------------- 马索尔 ----------------------------------- */
  马索尔: {
    description:
      '黄色黑纹衣服，头戴绿色帽子，和杰瑞长相很相似。他是杰瑞的大表哥，实力强悍，勇敢威猛，是所有猫咪的克星。',
    EnglishName: 'Muscles',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description: '闪拳可拦截，传送可救援，有药水可以稳救。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        level: 4,
        description: '拳头可干扰霸体上火箭。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description: '发怒拳头可以强推奶酪。',
        additionalDescription: '后期发怒时可无视夹子和叉子。',
      },
      {
        tagName: '砸墙',
        level: 2,
        description: '{3级沙包拳头}能对墙缝造成伤害，发怒期间的拳头伤害更高。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '沙包拳头',
        pattern: '120022[10]1',
        weaponType: 'weapon1',
        description:
          '八级时，顺风3级被动，逆风二级传送；二人残局优先三级传送；六级可留点随时二级传送。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '常规卡组。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '适合单救阵容，保证第一波救援能力，也可以增加前期生存能力。',
      },
      {
        cards: ['S-铁血', 'S-无畏', 'B-逃之夭夭', 'C-救救我'],
        description: '无畏常规卡组，踏空不熟练或单双排可用。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '闪亮营救',
        type: 'active',
        description:
          '可通过小轮盘选择队友（初始仅可选择绑在火箭上和被猫抓在手中的队友），传送到身边落下，并弹飞附近的道具。“满怒”期间，可在下落后通过技能键额外进行一段攻击。',
        detailedDescription:
          '马索尔点击技能键后将展开小轮盘，显示当前可选择的队友头像（初始仅可选择绑在火箭上和被猫抓在手中的队友），点击对应头像后释放技能。\n技能释放后，马索尔在1.4秒前摇后传送到目标上方，并在0.65秒后落下，若成功落下且没有受到任何效果打断，将在0.25秒后对附近半径250内的道具产生[击飞效果](为与鞭炮类似的小幅度受力效果，并非“投掷”，不会命中敌方)。\n“满怒”期间，传送下落后本技能出现额外读条，可在0.5秒内通过向左右拖动技能键向选定方向挥出一拳：对命中的敌方造成{50*}伤害和2.4秒眩晕（前摇0.6秒，后摇0.75秒）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*', '移动键', '跳跃键', '药水键', '其他技能键'],
        forecast: 1.4,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 60,
          },
          {
            level: 2,
            description: '传送可选所有老鼠为目标。',
            detailedDescription: '传送改为可选择所有不处于被淘汰状态的友方老鼠为目标。',
            cooldown: 60,
          },
          {
            level: 3,
            description: '',
            cooldown: 35,
            detailedDescription: '',
          },
        ],
        aliases: ['闪现'],
        cueRange: '本房间可见',
        cooldownTiming: '前摇前',
        canHitInPipe: false,
      },
      {
        name: '沙包拳头',
        aliases: ['爪刀'],
        type: 'weapon1',
        description:
          '攥起拳头，再次使用技能以指定方法挥出拳头。“满怒”时，攥拳后可挥出三拳，且提升拳头效果，但攥拳会掉落且无法主动拾取道具。\n挥拳会对敌方造成伤害和眩晕，并根据挥拳方法的不同而产生额外效果。\n按键向上-升龙拳：眩晕并向上击飞敌方，同时熄灭火箭；满怒时额外击飞火箭。\n按键向前/不拖动-游龙拳：眩晕并击退敌方，同时熄灭火箭；满怒时增加击退距离、敌方击退时会击碎部分可破碎道具并对自身产生额外伤害和眩晕，拳头可将命中的奶酪推入一定进度。\n按键向下-地龙拳：原地打晕敌方，并施加减速；满怒时增加眩晕时间、[可能](根据不同平台有所不同，需单独测试)使敌方掉下其所在的平台。',
        detailedDescription:
          '马索尔攥起拳头，随后技能进入30秒读条，期间可再次拖动技能键释放二段技能，向面前方向以指定方法挥出拳头。“满怒”时，攥拳改为对拳头充气，拳头充气后会立即掉落手中道具，随后技能进入20秒读条，期间[无法主动拾取道具](仍可通过商店购买、被其它玩家用点燃的鞭炮丢中等方式获取道具，并可用该道具取消后摇)，且可至多挥出3次拳头，前2次挥拳会使本技能进入3秒[单独CD](与技能原本的CD无关；不受增加/缩减冷却的效果影响)。\n挥拳头有0.15秒前摇，挥拳会对前方290范围内的敌方造成{50*}伤害，挥拳后有1秒后摇。挥拳方式及满怒与否不影响拳头的范围和伤害。\n\n挥拳方式如下（以面向方向为0°，背对方向为180°，向上为正，向下为负）：\n按键范围+45°到180°——升龙拳：对敌方造成1秒眩晕，并将其[强制向上击飞](该击飞无法被敌方的护盾、无敌等防护状态免疫)450距离；对命中墙缝造成{_0*}伤害；使命中的已点燃火箭{熄灭}。“满怒”时，可使火箭向上击飞（火箭在平地上时，从击飞到落地的总时间为2.5秒；未落地的火箭无法主动交互），但对敌方的眩晕变为0.9秒。\n按键范围+45°至-45°，或点按——游龙拳：对敌方造成1秒眩晕，并将其击退500距离；对命中墙缝造成{_0*}伤害；使命中的已点燃火箭{熄灭}。“满怒”时，眩晕时间延长至1.5秒，击退距离提高至1500，且敌方在击退过程中会[撞碎](使对应道具消失，且会产生破碎效果，例如产生碎片等)部分可破碎道具，撞碎时受到{50*}伤害和2.8秒眩晕（敌方持有此眩晕或部分眩晕状态时，不会延长眩晕时间，详见{眩晕}），此外拳头命中老鼠洞口的未推入奶酪时，会将其[固定推入12.5%](不受其他推速加成影响。部分洞口所需推入量并非100%，详见相关机制页)。（可撞碎的道具包括：{玻璃杯}、{碗}、{盘子}、{扁盘}、{灰花瓶}、{蓝花瓶}、{香水瓶}、{胡椒瓶}、{番茄}、{果子}、{大纸盒}、{小纸盒}、{大仙人掌}、{小仙人掌}、{炮弹(衍生物)}。不包括{冰块}）\n按键范围-45°到180°——地龙拳：对敌方造成0.9秒眩晕，眩晕结束后敌方受到17.5%的减速，持续5秒。“满怒”时，眩晕时间延长至1.4秒，且当目标站在部分可穿越平台上时，将其向下击落。', //升龙拳原文“向上击飞1.1秒”，此处单独修改
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        canHitInPipe: false,
        forecast: 1.4,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '升龙拳和游龙拳对墙缝的伤害提高，“满怒”后进一步提高。“满怒”游龙拳打入奶酪的进度提高。',
            cooldown: 15,
            detailedDescription:
              '升龙拳和游龙拳对墙缝改为造成{_10*}伤害，“满怒”拳头则提高至{_15*}伤害。“满怒”游龙拳单次打入奶酪的进度提高至20%。',
          },
        ],
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '怒气喷发',
        type: 'passive',
        description:
          '当附近友方受到敌方攻击时，将积攒怒气，怒气满之后将进入较长时间的满怒状态，期间自身获得少量减伤且沙包拳头得到强化，但持续{暴露位置}。退出满怒状态后进入较长时间的冷静状态，期间大幅减速且不会获得怒气。',
        detailedDescription:
          '马索尔拥有额外的怒气条。当半径1750范围内友方角色（含自身）受到来自敌方的攻击时，自身积攒28%的怒气。怒气达到100%之后将进入持续32秒的满怒状态，期间{沙包拳头}与{闪亮营救}得到强化，但持续{暴露位置}。退出满怒状态后进入持续34.9秒的冷静状态，期间自身减速25%且不会获得怒气。',
        skillLevels: [
          {
            level: 1,
            description: '满怒时，大幅加速。',
            detailedDescription: '满怒状态下，移速额外增加20%。',
          },
          {
            level: 2,
            description: '满怒时，免疫眩晕等控制状态，且提高Hp恢复。',
            detailedDescription:
              '满怒状态下，免疫眩晕等控制状态（不免疫反向、失明等状态），且获得2.5Hp/秒的恢复状态。',
          },
          {
            level: 3,
            description: '满怒时，立刻刷新技能CD。',
            detailedDescription: '进入满怒状态时，立刻刷新主动和武器技能CD。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '魔术漂浮',
        description:
          '[踏空救援](马索尔在传送救援后使用魔术漂浮避免踩夹。这一操作需要传送前滞空/传送的瞬间跳跃，并且需要一定熟练度)必备。',
      },
      {
        name: '绝处逢生',
        description:
          '[传送破夹](传送前使用绝处逢生，传送后触发解控效果，从而清理火箭下的夹子)必备。',
      },
      {
        name: '干扰投掷',
        description: '提高干扰能力和拳头命中率。',
      },
      {
        name: '冰冻保鲜',
        description: '传送救援后使用冰冻保鲜避免踩夹。',
      },
    ],
    aliases: ['大表哥', '小表弟'],
  },

  /* ----------------------------------- 米雪儿 ----------------------------------- */
  米雪儿: {
    description:
      '米雪儿和图多盖洛居住在一个富有的家庭中，是一名富有的千金小姐。她喜欢吃甜品，但她不喜欢火炮类的东西，热爱自然的花草树木，尤其喜爱花朵类的装饰品。',
    EnglishName: 'Michelle',
    aliases: ['米雪'],
    mousePositioningTags: [
      {
        tagName: '辅助',
        level: 4,
        description:
          '队友{铁血}时，可用{主动技能}救活队友；一武器可为队友提供“额外”道具，二武器可为队友/对手提供增益/削弱。建议车队配合。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 4,
        weapon: 1,
        description: '主动技能后期15秒一个变大；武器技能3级后能提供很可观的墙缝增伤。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 2,
        weapon: 1,
        description: '二级被动可压血线增加推速；气球可给队友一定推速加成。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '第一武器',
        pattern: '212020011',
        weaponType: 'weapon1',
        description: '',
      },
      {
        id: '全程附身流',
        pattern: '13[03]11003',
        weaponType: 'weapon1',
        description:
          '角色强势全能或队友能力突出时使用。（附身状态下一级被动可用{有难同当}触发，若未携带该卡则可不点，六级直接点出三级哭）',
      },
      {
        id: '辅助游走流',
        pattern: '130[30]0113',
        weaponType: 'weapon1',
        description: '需要时可参与打团，也可以作为补推位',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '通用卡。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '常规卡组，双武器通用。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-有难同当', 'C-救救我'],
        description: '二武被动流。',
      },
      {
        cards: ['S-舍己', 'S-有难同当', 'B-幸运', 'C-脱身', 'C-救救我'],
        description: '二武卡组，适用于打前期猫，需要队友配合接哭接气球。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '小情绪',
        aliases: [],
        type: 'active',
        description:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在米雪儿或附近队友受到猫攻击后$激活$text-green-700 dark:text-green-300#。\n点击技能将原地大哭诉说委屈，期间将获得1层护盾，并使一定范围内的敌方减速。友方老鼠进入范围后可对米雪儿进行安抚，期间获得护盾，安抚结束后友方将变成{巨型比利鼠}。',
        detailedDescription:
          '技能初始$禁用$text-red-700 dark:text-red-300#，在米雪儿或半径1600范围内的队友受到攻击后$激活$text-green-700 dark:text-green-300#30秒，释放或时间结束后再次进入$禁用$text-red-700 dark:text-red-300#状态。\n点击技能将原地大哭诉说委屈，持续4秒，并获得1层持续8秒的护盾。哭泣期间，以自身为底边中点，750*750的矩形范围内将下起伤心的雨，使范围内的敌方移速和跳跃能力降低30%，但[免疫道具造成的失明](不会清除受到此状态之前已获得的失明)。\n友方老鼠进入范围后可通过交互对米雪儿进行安抚，安抚时立即获得1层持续8秒的护盾，安抚前摇[较短](在20260326更新前为0.6秒，之后有所缩短又有所回调，待测试)，安抚结束后友方将变成{巨型比利鼠}，持续10秒（对被{飘浮气球}跟随的队友改为5秒）。\n哭泣可通过[道具键*](需要【手持道具】或【所在处有道具且技能在地面原地释放】时才能打断)提前取消；取消哭泣或安抚成功后将清除米雪儿的护盾；队友未安抚不会清除米雪儿的护盾；队友安抚过程被打断不会清除队友的护盾；同时至多只能有一位队友进行安抚。\n\n$巨型比利鼠$font-bold#：无敌；可进行主动攻击，攻击前摇0.5秒，后摇0.5秒，攻击范围300，对命中的敌方造成{110*}伤害，对命中的墙缝造成{_1.5*}伤害（[伤害来源均为比利鼠](不同老鼠造成的伤害受各自攻击力/破坏力等因素影响而有差异)）。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '安抚成功后，自身获得短暂加速。',
            detailedDescription: '安抚成功后，米雪儿移速提高20%，持续5秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '',
            detailedDescription: '',
            cooldown: 15,
          },
        ],
      },
      {
        name: '超级变！变！变！',
        type: 'weapon1',
        description:
          '扫描面前1个$可变形道具$font-bold#，储存其信息；再次使用技能将[变形为该道具](可被正常使用；碰撞特性和体积会变为与该道具相同；部分角色功能的判定范围仍与变身前一致)。变形后依然可以进行交互，同时提高视野范围。受到伤害或点击技能键可变回；变回后道具消失。\n· 拥有3个独立的信息储存槽位，可通过轮盘切换。\n· [技能可用时](即当前信息储存槽位为空，且技能不处于冷却时)，范围内的可变形道具将变为粉色。',
        detailedDescription:
          '尝试扫描并记录[$128*208$text-blue-700 dark:text-blue-300#的矩形范围内](该范围不以米雪儿为正中心，实际构成为：米雪儿自身前96、后32、上160、下32范围内)的1个$可变形道具$font-bold#，优先扫描靠近自身的道具。\n成功扫描后会将该道具信息储存至技能栏，同时解锁二段技能，使用后米雪儿将[变形为该道具](可被正常使用；碰撞特性和体积会变为与该道具相同；部分角色功能的判定范围仍与变身前一致)。变形后依然可以进行交互，同时视野范围提高18%，但禁用特技。受到伤害、所变道具损坏、再次点击技能键、达到最大持续时间后将变回。\n· 本技能拥有3个独立的信息储存槽位，可通过外置轮盘进行切换。只有切换到已储存有道具信息的槽位时才能释放二段技能，二段技能释放结束后会自动尝试切换至其它已储存有道具信息的槽位。\n· 只有当一段技能未扫描到道具信息，或二段技能从道具变回后，本技能才会进入CD。\n· [一段技能可用时](即当前信息储存槽位为空，且技能不处于冷却时)，技能范围内的可变形道具在米雪儿视角会变为粉色。\n\n$可变形道具$font-bold#：\n1. 常规投掷物：{盘子}、{玻璃杯}、{碗}、{扁盘}、{灰花瓶}、{蓝花瓶}、{香水瓶}、{胡椒瓶}、{番茄}、{叉子}、{高尔夫球}、{冰块}、{小鞭炮}、{鞭炮束}；\n2. [非常规投掷物类道具](该项实际为白名单制。遥控器、电风扇、萝卜墩-天宫等道具不在该名单中，因此无法变形)：{牛奶}、{蛋糕}、{大纸盒}、{小纸盒}、{玩具枪}、{老鼠夹}、{苍蝇拍}、{果盘}、{冰桶}、{鞭炮堆}、{拳套盒}、{礼物盒}、{礼物袋}、{窝窝头}、{竹笋}、{萝卜墩}、由{金钥匙}伪装成的纸盒；\n3. [部分地图组件](同上，为白名单制。仙丹等组件不在该名单中，因此无法变形)：{小推车}、{桶}、{消防栓}、{紫色花}、{银色花}、{红色花}、{黄色花}、{金色花}、{蓝色花}、{青色花}、{灶台}上的铁锅、{果树丛}掉落的果子；\n4. [与上述内容类似的部分衍生物](该项实际为黑名单制。以下项目处于本技能黑名单中：蓝色卡牌、红色卡牌、黄色卡牌、长枪、闪耀足球、七色花、红色小淘气、蓝图-投掷物）。随版本更新，本名单不排除有变动的可能)：{子弹}、{果子}及部分独立的技能衍生物等。（$通过本技能变形的技能衍生物与原有衍生物的功能和物理性质可能出现较大偏差$text-blue-700 dark:text-blue-300#）',

        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '变形持续60秒；受到伤害后会解除变形。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '变身时将免疫1次伤害和控制；提高Hp恢复速度；提高被投掷命中时造成的伤害和控制时间。',
            cooldown: 5,
            detailedDescription:
              '变形期间获得3Hp/秒的恢复，并获得1层{护盾}，但[该护盾被打破时就会取消变身](这意味着此时受到碎片、香水反向、烟雾失明等状态时，虽然不会因此受到控制，但会解除变形)。\n自身变成的道具被投掷命中时对目标造成的伤害提高30，眩晕状态时间延长0.5秒。',
          },
          {
            level: 3,
            description:
              '增加变形的持续时间，同时提高变身状态下的攻击力和救援速度，并在变身结束后短暂保持。',
            cooldown: 5,
            detailedDescription:
              '变形的持续时间延长至90秒。\n变形期间攻击力+15、破坏力+3，救援速度提升100%。\n变形结束后，自身获得以下状态：攻击力+15，救援速度提升100%，获得5Hp/秒的恢复，持续3秒。',
          },
        ],

        parts: [
          {
            forecast: 1.5,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
            canMoveWhileUsing: false,
            cancelableAftercast: '无后摇',
          },
          {
            forecast: 0.5,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放后',
            cancelableSkill: ['道具键*'],
            canMoveWhileUsing: false,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '漂浮气球',
        type: 'weapon2',
        description:
          '本技能具有多个释放时机和作用：\n· $正常释放$font-bold#：浮上气球提高移速，跳跃时会退出该状态。\n· $发起跟随$font-bold#（通过外置轮盘释放）：选择周围目标发起跟随。跟随期间{无敌(状态)}，移除{受伤}并获得恢复，与跟随目标视作一个单位，仅可通过跳跃键主动退出跟随。\n· $跟随-队友$font-bold#：使其移速、推速和破坏力短暂提高，若此时其Hp比例低于自身则平衡双方Hp。队友被抓住或绑上火箭后解除跟随，该队友因{主动技能}变身的持续时间减半，且在{铁血}期间无法安抚米雪儿。无跟随时间限制。\n· $跟随-对手$font-bold#：使其减速，若此时其Hp比例高于自身则平衡双方Hp。有跟随时间限制。',
        detailedDescription:
          '本技能具有多个释放时机和作用。根据米雪儿的附身情况，本技能的效果有所变化：\n\n· $正常释放$font-bold#：开始[“漂浮”](“漂浮”为贴图表现，并无失重或类似效果)，移速提高10%，跳跃时会提前退出该状态。\n\n· $发起跟随$font-bold#（[通过外置轮盘独立释放](该键冷却与主技能分别结算。开始向目标飞去或是解除跟随状态时，该键会进入10秒独立CD)）：展开外置轮盘，显示此时1760范围内所有[$可附身角色$text-blue-700 dark:text-blue-300#](不处于隐身状态（库博-虚幻梦影隐身除外）的敌方玩家角色；未被抓住或绑上火箭，且未跟随也未被跟随的我方玩家角色)的头像，点击头像后[若该目标仍在范围内](“可跟随目标”轮盘不会实时更新，若选择了范围外的目标则无事发生（不进入CD）)，则以1120/秒的速度向目标飞去，飞行期间{无敌(状态)}，抵达目标位置后开始$跟随$font-bold text-purple-700 dark:text-purple-300#，成功跟随时会掉落自身手中道具、移除{受伤}、获得2Hp/秒的恢复状态（恢复持续20秒，脱离跟随时提前解除）。\n· $跟随*$font-bold text-purple-700 dark:text-purple-300#：自身悬浮在目标前上/后上方的[固定位置](距离目标身前/身后128、上方64处的位置)，可通过移动键切换（有1秒内置CD）；跟随目标移动且视野切换至与目标一致；持有{免控}和无敌；可以正常阻挡投掷道具及部分技能衍生物；可正常使用主动和武器技能且不解除跟随；无法自主移动、交互、拾取和使用道具；可通过跳跃键退出跟随。\n· $特殊-跟随队友*$font-bold text-purple-700 dark:text-purple-300#：队友虚弱时，米雪儿可通过交互键直接解除跟随并开始治疗队友。被跟随的队友因米雪儿主动技能变身时的持续时间减半，在{铁血}期间无法安抚米雪儿。队友被抓住或绑上火箭后会强制解除跟随。无跟随时间限制。\n· $特殊-跟随对手*$font-bold text-purple-700 dark:text-purple-300#：有跟随时间限制（跟随后技能将进入读条，用于提示剩余跟随时间，读条结束后自动解除跟随）。\n\n· $跟随队友时释放$font-bold#：使其移速提高15%，推速提高60%，破坏力提高30%，持续3秒；若释放时其Hp比例低于自身则触发$平衡Hp$font-bold text-green-700 dark:text-green-300#效果。\n· $跟随对手时释放$font-bold#：使其移速降低15%，持续3秒；若释放时其Hp比例高于自身则触发$平衡Hp$font-bold text-green-700 dark:text-green-300#效果。\n· $平衡Hp*$font-bold text-green-700 dark:text-green-300#：将双方当前Hp相加，随后按双方Hp上限的比例进行分配，使分配后双方的剩余Hp与Hp上限的比例一致。',

        skillLevels: [
          {
            level: 1,
            description: '跟随对手的时间限制为3秒。',
            cooldown: 10,
          },
          {
            level: 2,
            description: '跟随队友时，使其获得Hp恢复。',
            detailedDescription:
              '跟随队友时，该队友会获得2Hp/秒的恢复状态（持续30秒，脱离附身时提前解除）。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '跟随对手的时间限制提高至6秒。',
            cooldown: 10,
          },
        ],

        parts: [
          {
            forecast: 0.45,
            aftercast: 0,
            canUseInAir: true,
            cooldownTiming: '释放时',
            cancelableSkill: ['移动键', '跳跃键', '道具键*'],
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
          {
            forecast: 0,
            aftercast: 0,
            canUseInAir: true,
            cancelableSkill: '无前摇',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '坚强的米雪儿',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '米雪儿在队友附近时受到的伤害减少，且受到伤害后使附近队友移速、推速、攻击力和救援速度大幅提高。',
            detailedDescription:
              '米雪儿半径900范围内存在队友时，自身受到的伤害减少15，且受到伤害时使范围内的队友获得以下状态：移速提高20%，攻击力提高100%，推速提高20%，救援速度提高50%，持续8秒。',
          },
          {
            level: 2,
            description: 'Hp比例≥50%时，提高Hp上限；Hp比例≤50%时， 提高推速。',
            detailedDescription: 'Hp比例≥50%时，Hp上限+20；Hp比例≤50%时， 推速提升30%。',
          },
          {
            level: 3,
            description: '虚弱时间缩短30%；倒地后爬行速度大幅提升。',
            detailedDescription:
              '自身受到的{鼠虚弱}状态[持续时间$-3$text-blue-700 dark:text-blue-300#秒](若在虚弱状态加点，将立即减少虚弱时间)；进入虚弱时获得以下状态：移速提高290%，持续4秒。',
          },
        ],
      },
    ],
    specialSkills: [],
  },

  /* ----------------------------------- 音乐家杰瑞 ----------------------------------- */
  音乐家杰瑞: {
    aliases: ['音杰'],
    description:
      '他是艺术的宠儿，音乐家杰瑞拥有优雅帅气的外表，他精湛的技艺能够指挥乐队演绎世界上最华丽的乐章，那些或舒缓、或激昂的音乐不断撩动观众的心弦，激起人们内心深处的灵魂共鸣。',
    EnglishName: 'Conductor Jerry',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 3,
        description: '可利用{2级被动}摧毁火箭，快速将老鼠救下。',
        additionalDescription:
          '音乐家杰瑞可以配合各种特技组合技（如冰冰礼，礼服翻滚）稳定救下队友或救完迅速撤退，但被猫逼出幻风礼服后会十分乏力',
      },
      {
        tagName: '干扰',
        level: 3,
        description: '利用一级被动可以造成大量伤害和拦截猫上火箭。',
        additionalDescription: '被知识卡-皮糙肉厚大大克制。',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '主动技能可以带来不错的团队收益。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 2,
        description: '利用{3级被动}可快速破墙。',
        additionalDescription: '若4只老鼠均在墙缝附近可以技能全交做到秒破。',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '0210-22011',
        weaponType: 'weapon1',
        description:
          '五级时若奶酪位被放飞可先点二级协奏补推。二级礼服增加拆火箭难度，应将加点留到七级，直接升到三级礼服。面对上火箭能力较弱的猫可以优先点出二级被动。',
        additionaldescription:
          '若进入墙缝战时未满8级或猫咪破盾能力强，可舍弃三级礼服点三级被动及二级协奏。',
      },
      {
        id: '打库博侦汤',
        pattern: '012220011',
        weaponType: 'weapon1',
        description: '拆火箭意义不大时可先点三级礼服增强自保。',
      },
      {
        id: '常规加点2',
        pattern: '1200-22011',
        weaponType: 'weapon1',
        description: '',
      },
      {
        id: '前期有秒飞',
        pattern: '2001-22011',
        weaponType: 'weapon1',
        description: '前期如果有秒飞火箭的话可以使用这个加点（不推荐）',
      },
      {
        id: '加点方案 5',
        pattern: '20011[10]22',
        weaponType: 'weapon1',
        description: '现版本音乐家一级礼服就有盾，不太依赖三级盾，墙缝出现时先点3级被动',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: [
          'S-铁血',
          'S-舍己',
          'B-精准投射',
          'C-救救我',
          [CardGroupType.Or, 'B-夹不住我', 'B-绝地反击'],
        ],
        description:
          '利用{精准投射}快速刷新礼服CD，速炸火箭，让猫短时间内绑不上火箭。{夹不住我}可配合2级协奏音符速破夹子，换为{绝地反击}则为打架特化卡组，可以频繁的干扰猫的进攻节奏，但是丧失了部分功能性及自保，推荐四排且队伍里没有干扰位时使用',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-绝地反击', 'C-救救我', 'C-不屈'],
        description:
          '知识量不足可带本套卡组。{绝地反击}可配合共鸣冲击波快速打出高额伤害，{不屈}增加自保，可换成{夹不住我}。',
      },
      {
        cards: ['S-铁血', 'S-无畏', 'C-救救我', 'C-不屈', 'B-绝地反击'],
        description:
          '打米特可用卡组（未开启21点可舍弃{绝地反击}），尽量找到机会近身打掉胡椒罐（前提是血量健康），本卡组虽配备了{绝地反击}，但由于米特的血量较高还是尽量不要与其打架',
      },
      {
        cards: [
          'S-铁血',
          'S-舍己',
          'A-逃窜',
          'C-救救我',
          [CardGroupType.Or, 'B-应激反应', 'C-不屈'],
        ],
        description: '通用自保卡组。',
      },
    ],
    specialSkills: [
      {
        name: '急速翻滚',
        description: '音乐家在武器技能持续期间持有惯性，此时使用急速翻滚能快速位移。',
      },
      {
        name: '冰冻保鲜',
        description:
          '现版本冰冻保鲜在释放和解除时均能触发共鸣，可在短时间内放出4段共鸣，可用于打伤害或拆火箭。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '玻璃杯', '灰花瓶', '冰块'],
        description: '前两者适合快速补刀，瓶子和冰块让音杰更灵活',
      },
    ],
    skills: [
      {
        name: '风格骤变',
        type: 'active',
        description: '根据演奏风格给予周围友方增益效果。使用技能可切换风格。',
        detailedDescription:
          '音乐家自身为中心，根据演奏风格给予半径内友方增益效果。使用技能可切换风格，切换时音乐家杰瑞会同时保持上一种风格8秒。点出该技能时风格为协奏。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['道具键*', '跳跃键'],
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=408.2',
        skillLevels: [
          {
            level: 1,
            description: '狂想：提升攻击力。\n协奏：获得Hp恢复和加速。',
            detailedDescription: '狂想：提升15点攻击力。\n协奏：获得2.5/s的Hp恢复和15%加速。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '狂想：额外给予击中敌方时回复Hp的效果。\n协奏：额外提升推速和交互速度。',
            detailedDescription:
              '狂想：额外给予击中敌方时回复10Hp的效果。\n协奏：推速固定提高1.25%/秒，交互速度提高20%。',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '狂想：额外降低[技能CD](特技与机器鼠技能不生效)。\n协奏：额外降低周围火箭燃烧速度。',
            detailedDescription:
              '狂想：额外降低20%[技能CD](特技与机器鼠技能不生效)。\n协奏：额外降低50%周围火箭燃烧速度，不可叠加。',
            cooldown: 15,
          },
        ],
        forecast: 1,
        aftercast: 0.2,
        cueRange: '本房间可见',
      },
      {
        name: '幻风礼服',
        type: 'weapon1',
        description:
          '进行一场忘我演奏，可通过移动键进行最多3次快速位移。[再次按下技能键可取消技能](使用技能后的1秒/进行位移后的0.6秒内无法取消技能)。不可交互，可丢道具。',
        detailedDescription:
          '进行一场持续10秒或3次位移的忘我演奏，操作按键切换为移动键，可通过点按进行最多3次快速位移，每次位移前摇0.1秒，位移时间0.25秒，且视作使用了一次技能。[再次按下技能键可取消技能](使用技能后的1秒/进行位移后的0.6秒内无法取消技能)。不可交互，可丢道具。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=286.4',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '单次位移距离为330。使用技能时获得1层护盾，持续5秒（取消或技能释放结束后护盾清除）。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '位移距离和速度提升。',
            detailedDescription: '单次位移距离提高至400，用时不变。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '使用技能时获得2层护盾，持续5秒。',
            cooldown: 18,

            detailedDescription: '使用技能时获得2层护盾，持续5秒（取消或技能释放结束后不清除护盾。',
          },
        ],
        forecast: 0,
        aftercast: 0,
        cueRange: '随距离远近变化',
        cooldownTiming: '释放后',
      },
      {
        name: '共鸣',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=543.5',
        description:
          '对本技能加点后，使用技能时会在自身及队友处触发共鸣冲击波，自身额外触发一次。共鸣冲击波会对小范围内的目标产生影响。',
        detailedDescription:
          '对本技能加点后，[使用技能](包括主动技能、武器技能、特技等)时，会在自身及1800范围内队友身上触发1次共鸣冲击波，随后自身额外触发1次。共鸣冲击波会对180范围内的目标产生影响。',
        skillLevels: [
          {
            level: 1,
            description:
              '共鸣可对敌方造成伤害并叠加减速，叠加到第3层时对敌方造成短暂眩晕（可救下猫咪手中的老鼠；内置CD：10秒），但该眩晕期间敌方不会受到任何伤害及控制。',
            detailedDescription:
              '共鸣可对敌方造成{10*,不可攻击护盾}伤害（伤害来源为音乐家杰瑞），并使其减速3秒（不可攻击护盾），可叠加，叠加到第3层时清除并对敌方造成1秒眩晕（可救下猫咪手中的老鼠；内置CD：10秒），但该眩晕期间敌方不会受到任何伤害及控制。',
          },
          {
            level: 2,
            description: '5秒内对火箭造成5次共鸣后会{摧毁}火箭，45秒后恢复。',
            detailedDescription:
              '5秒内对火箭造成5次共鸣后会{摧毁}火箭（若同时救下了火箭上的队友则视为对火箭造成最后一段共鸣的友方老鼠救下且优先判定音乐家杰瑞的共鸣结算）。被摧毁的火箭45秒后恢复。',
          },
          {
            level: 3,
            description: '共鸣可对墙缝造成伤害。',
            detailedDescription:
              '共鸣可对墙缝造成{_2*,无法攻击泡泡}伤害（伤害来源为音波产生者，不同角色产生的音波伤害可能不同）。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 蒙金奇 ---------------------------------- */
  蒙金奇: {
    aliases: ['马嘉祺'],
    description: '军团指挥官蒙金奇。',
    EnglishName: 'Guardsman',
    mousePositioningTags: [
      {
        tagName: '破局',
        level: 4,
        description: '战车自带霸体，冲撞可撞开[绝大多数猫的布局](捕鼠夹、兔八哥萝卜、图多香水等)。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        level: 4,
        description: '战矛与冲撞配合，能安全地对猫咪进行较长时间的控制。',
        additionalDescription:
          '战矛配合干扰投掷与部分知识卡（如投手）可以进一步提高控制成功率；冲撞也能救下队友。',
      },
    ],
    skillAllocations: [
      {
        id: '军团战车',
        pattern: '120022011',
        weaponType: 'weapon1',
        description:
          '对于冲撞难以造成效果的猫（如图多，苏蕊，追风），六级优先3级被动；墙缝期优先点车。',
        additionaldescription: '如果猫携带了猛攻知识卡，可以考虑优先二级车。，',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '战矛也可触发缴械，合理搭配可以提高干扰和自保能力。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
        description: '战矛也可触发投手。',
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '战矛可以触发干扰投掷效果。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '勇往直前',
        aliases: ['冲撞'],
        type: 'active',
        description:
          '向前冲撞，期间获得霸体和减伤，推开道具并对敌方造成少量伤害和击退。施放时若有3格士气值，自动消耗并增强技能效果、并可击落猫咪手中的道具与老鼠。驾驶战车时始终造成强化效果。',
        detailedDescription:
          '以1500的基础移速向前冲撞，期间获得霸体和30%减伤，持续1秒，会向冲刺方向[推开](为单纯的受力效果，与“投掷”不同，被推开的道具不会因此命中敌方)道具，并对撞到的敌方造成{10*,不受来源影响}点伤害和击退。施放时若士气值不低于60%（3格），自动消耗3格士气值，使本次冲撞改为造成{25*,不受来源影响}点伤害、且增强击退效果、并可击落猫咪手中的道具与老鼠。[驾驶战车时也可以施放](但施放期间将禁用战矛投掷和脱离战车)，且无论士气值如何，均造成强化后的效果。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        forecast: 0.5,
        aftercast: 0.2,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '',
            cooldown: 20,
          },
          {
            level: 3,
            description: '首次冲撞后，5秒内可再次冲撞。',
            detailedDescription:
              '首次冲撞完成后，技能进入5秒读条，期间可再次释放。（各自分别判定是否消耗士气值）',
            cooldown: 20,
          },
        ],
      },
      {
        name: '军团战车',
        type: 'weapon1',
        description:
          '召唤并乘坐{战车}，消耗全部士气值以提升战车持续时间；战车拥有独立Hp，且持有{霸体}（但不免疫{禁用技能}效果）。乘坐战车期间无法交互、使用道具或回复Hp，可投出{战矛}（有2秒CD），可通过额外技能键主动脱离战车。当战车Hp归零、持续时间结束、或蒙金奇主动脱离时，战车进入自毁倒计时，5秒后爆炸，对范围内所有单位造成伤害和{爆炸}，对未脱离战车的蒙金奇造成极高伤害。',
        detailedDescription:
          '召唤并乘坐{战车}，消耗全部士气值，每格士气值提升战车3秒持续时间，战车最多持续20秒；战车拥有独立Hp，且持有{霸体}（免疫{虚弱}和大部分控制状态，但不免疫{禁用技能}效果）。乘坐战车期间无法交互、使用道具或[回复Hp](国王杰瑞-国王战旗（守护）除外)，可通过拖拽本技能键向前方投出{战矛}（命中敌方造成{30*,不受来源影响}，命中墙缝造成{_5*,不受来源影响}，可触发部分{投掷命中效果}），投掷战矛有0.2秒前摇和2秒CD。可通过额外技能键主动脱离战车，分离出{战车-分离态}（分离时保持速度）。当战车Hp归零、持续时间结束、或蒙金奇主动脱离时，战车进入自毁倒计时，5秒后爆炸，不造成伤害和2秒{爆炸}，可炸毁火箭（10秒后自动修复）。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        forecast: 0.7,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '战车Hp为100点。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '提高战车Hp。',
            detailedDescription: '战车Hp提高到125点。',
            cooldown: 35,
          },
          {
            level: 3,
            description: '',
            cooldown: 28,
          },
        ],
      },
      {
        name: '我，即是军团。',
        type: 'passive',

        skillLevels: [
          {
            level: 1,
            description:
              '自然增长士气值，上限为3格。对猫咪造成伤害会提升士气值。虛弱时士气值清空。每格士气值提高减伤能力。',
            detailedDescription:
              '以0.077格/s的速度自然增长士气值，上限为3格。每对猫咪造成一次伤害提高10点士气值。虛弱时士气值清空。每格士气值提高减伤能力。',
          },
          {
            level: 2,
            description: '士气值上限提升到5格。友方对附近猫咪造成伤害时，也会获得士气值。',
            detailedDescription:
              '士气值上限提升到5格。友方对自身一定范围内猫咪造成伤害时，也会获得半格士气值。',
          },
          {
            level: 3,
            description: '每格士气值额外提供移速和Hp恢复速度；士气自然增长速度提高。',
            detailedDescription:
              '每格士气值额外提供2%的移速和0.2/s的Hp恢复速度；士气自然增长速度提高。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 尼宝 ----------------------------------- */
  尼宝: {
    aliases: ['泥巴'],
    description: '爱捣蛋、爱运动的机灵鬼',
    EnglishName: 'Nipper',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description: '翻滚免控免死，钩子也能进行一定程度的拦截。',
        additionalDescription: '稳救不稳走，依赖隐身；被托普斯的捕虫网和各种强制位移技能克制。',
      },
      {
        tagName: '砸墙',
        level: 2,
        description: '2级被动提供超高墙缝增伤，配合果盘蒸发墙缝，一套就能打掉一半Hp。',
        additionalDescription: '触发条件较为苛刻，且需要与队友有一定沟通。',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '12100[01]22',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: [
          'S-铁血',
          'S-舍己',
          'C-不屈',
          'C-救救我',
          [CardGroupType.Or, 'A-逃窜', 'B-逃之夭夭'],
        ],
        description:
          '逃窜提高生存能力，同时也方便救援后跑路。也可带逃之夭夭，在救援后提高双方的速度，让双方更好的逃脱，但只能救援后触发，有一定局限性。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-救救我'],
        description:
          '提高容错，在只有尼宝一个救援位或者队友不好救下时可以自己下来。下来后翻滚能提高生存能力，所以不用为了幸运把救救我换脱身。同时幸运在一些情况下也可以断节奏（例如可消耗掉猫咪的穷追猛打）。',
      },
      {
        cards: [
          'S-舍己',
          'S-铁血',
          'C-不屈',
          'C-救救我',
          [CardGroupType.Or, 'B-应激反应', 'B-夹不住我'],
        ],
        description: '在无21点情况下的过渡卡组。',
      },
      {
        id: '',
        groups: [
          {
            cards: ['S-无畏', 'S-铁血', 'B-逃之夭夭', 'C-救救我'],
            description: '通用无畏卡组',
          },
        ],
        description: '',
        defaultFolded: false,
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '灵活跳跃',
        aliases: ['翻滚'],
        type: 'active',
        description: '快速向后翻滚，获得强霸体并提高救援速度。',
        detailedDescription:
          '快速向后翻滚，获得1秒强霸体并在3秒内提高100%的救援速度。（不能在跳跃中释放，但自由下落时可释放）。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=10.6',
        skillLevels: [
          {
            level: 1,
            description: '翻滚过程中免疫道具。',
            detailedDescription: '翻滚过程中免疫道具（鞭炮除外）。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '翻滚后获得短暂减伤和强霸体；首次翻滚后短时间内可再次翻滚。',
            detailedDescription:
              '首次翻滚结束后2秒内可再次翻滚，此后5秒内的第一次交互将回复自身55点Hp。（如果使用道具/交互键、受到控制或进入虚弱，则无法再次翻滚）',
            cooldown: 18,
          },
          {
            level: 3,
            description: '第一次翻滚后缓慢恢复Hp，第二次翻滚后短暂隐身。',
            detailedDescription:
              '第一次翻滚结束后获得5点Hp恢复，持续5秒；第二次翻滚结束后隐身2秒。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '尼宝的朋友',
        aliases: ['钩子', '尼宝的狐朋狗友'],
        type: 'weapon1',
        description:
          '附近没有自身召唤的{尼宝的朋友(衍生物)}时，在面前召唤一个朋友（技能不会进入CD），朋友持续一段时间后消失；反之则使附近的朋友向尼宝扔出{鱼钩}。鱼钩碰到道具会携带之；碰到角色会将其勾回，并救下敌方猫咪手中的老鼠。',
        detailedDescription:
          '附近没有自身召唤的{尼宝的朋友(衍生物)}时，[在面前召唤一个朋友](有单独0.5秒前摇)（技能不会进入CD），朋友在30秒后自然消失；反之则使附近的朋友向尼宝扔出{鱼钩}（扔鱼钩前摇0.33秒）。朋友扔出鱼钩过程中再次点击技能会使朋友将鱼钩收回。鱼钩碰到道具会携带之，碰撞敌方时造成相应效果；碰到角色会将其勾回，若勾中的是[敌方猫咪](包括部分护盾、霸体状态下的猫咪)则会使其掉落手中的老鼠。',
        forecast: 0.67,
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',

        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=50.7',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 16,
          },
          {
            level: 2,
            description: '',
            cooldown: 10,
          },
          {
            level: 3,
            description: '鱼钩携带的道具碰撞猫咪时造成额外的伤害和眩晕。',
            detailedDescription:
              '鱼钩携带的道具碰撞猫咪时额外造成{50*}伤害和2.5秒眩晕（先结算该效果，再结算道具原本的效果）。',
            cooldown: 10,
          },
        ],
      },
      {
        name: '古灵精怪',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=36.3',
        skillLevels: [
          {
            level: 1,
            description: '四次跳跃后，一段时间内大幅提升跳跃高度。',
            detailedDescription: '四次跳跃后，5秒内提升200跳跃高度，然后重新计数。',
          },
          {
            level: 2,
            description: '持续横向移动一段时间后，获得短暂的减伤、攻击提升和墙缝增伤。',
            detailedDescription:
              '持续横向移动6.7秒后，获得10点固定减伤、攻击提升30、墙缝增伤3，持续4.9秒。横向移动的转向可以通过翻滚，也可以通过在改变移动方向前极短暂地松开移动键（需要精准把控时间）',
          },
          {
            level: 3,
            description:
              '对猫咪造成伤害或受到猫咪的伤害时，刷新主动技能[和武器技能](游戏内描述有误，未提到刷新武器技能的效果)。(内置CD：9秒)',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '钩子可以主动中断漂浮，也方便更快的支援和救援后跑路。',
      },
      {
        name: '干扰投掷',
        description:
          '在无眩晕道具时提供一定的干扰能力，同时也能在一些情况下强换托普斯的网和剑客汤姆的旋。',
      },
    ],
  },

  /* ----------------------------------- 朵朵 ----------------------------------- */
  朵朵: {
    description:
      '朵朵原本是汤姆制造出来捕捉杰瑞的机器母鼠，但是在和杰瑞的友好相处中，她被杰瑞的善良勇敢热情打动，喜欢上了杰瑞。最终朵朵获得了人工智能，帮助杰瑞打败了汤姆。',
    EnglishName: 'Dodo',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '技能伤害极高，控制手段也很多。过载期间还能提供高额攻击增伤',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 4,
        description:
          '后期连招能打出极高额爆发伤害，堪称全游之最。此外被动技能和电池自起也提供了不俗的自保能力。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 2,
        description: '高额爆发提供破局能力，直接将试图防守的猫咪强行击倒。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '1(2)21(2)1000',
        weaponType: 'weapon1',
        description:
          '加点{1级能源装置}后，若进入虚弱状态则会因没有电池而被迫在起身后原地罚站，由此产生负面效果，建议在需要时才进行加点；在过载期间点出{3级能源装置}能立即充满能量条并释放一次电流，同样建议留加点；后期若等级充裕或道具充足可优先加点被动，最后再点{3级主动}。',
        additionaldescription: '',
      },
      {
        id: '被动加点提前',
        pattern: '1(2)20(2)0011',
        weaponType: 'weapon1',
        description:
          '优先加点{2级被动}以应对[固定连招或控制起手的猫](如汤姆，追风汤姆等)，也能防苍蝇拍；{3级被动}也有一定生存能力，尤其克制剑汤。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description:
          '{绝地反击}提供反杀能力，{不屈}提供生存能力，压好血线后期能斩杀满血且带{皮糙肉厚}猫。',
      },
      {
        cards: ['A-投手', 'A-冲冠一怒', 'B-应激反应', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '体系卡组，需队友配合控制与输出。自保强但容错低，慎用。{冲冠一怒}可换{逃窜}。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '通用卡组，打无道具的单刀猫可直接{缴械}救人。{舍己}可换{无畏}，但需队友接应。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '强能灌注',
        type: 'active',
        description:
          '朵朵为手持的[可充能道具](包括奶酪、电球和大部分常规类投掷道具，不包括小鞭炮、鞭炮束、冰块、番茄以及其他类型的道具)充能，充能期间道具将[悬浮在身边](模型消失，期间自身可拿取其他道具)，若自身被击倒将放下该道具；充能完成后可拿取该道具，道具将在一段时间内被电流包裹，命中敌方或与平台/地面碰撞时触发一次范围电击，造成[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加，可叠加)和眩晕。当充能对象为奶酪时，充能状态的奶酪第一次放入洞口时会直接推入一部分。过载状态下将大幅度提高充能速度。该技能需要手中有合适道具才能释放。',
        detailedDescription:
          '朵朵为手持的可充能道具充能，充能需要10.5秒，充能期间道具将[悬浮在身边](被充能的道具模型暂时消失，充能期间自身可拿取其他道具)等待充能完成，充能期间被击倒将放下手中道具；充能完成后进入5秒读条，期间点击技能可取出被充能的道具并替换手中的道具，5秒后将自动取出并替换，此时会中断当前的交互行为。\n道具被充能后，将附加持续一段时间的[充能状态](有电流包裹特效)，电流为独立状态，持续时间为[20秒](从完成充能开始计时)；该道具命中敌方单位或与平台/地面碰撞时失去充能状态，同时[先于道具本身](电流伤害独立于道具，且先于道具触发，控制时间不会和道具叠加)对半径192范围内的敌方单位造成{30*,电击}伤害（伤害来源为道具投掷者，被不同角色投掷时的伤害可能不同）和0.7秒眩晕。当充能对象为{奶酪}时，此块奶酪[第一次](同一块奶酪可被多次充能，但进度加成只对第一次充能有效)在[充能状态下丢入洞口](注意充能状态的奶酪碰到地面会失去充能，即使后续因惯性滑入洞口也不增加进度)时将直接增加25%的推入进度。处于过载状态时，充能速度增加100%。\n被充能的道具可以重新充能，会重置充能状态持续时间。\n该技能需要手中有能被充能的道具才能释放，反之则[释放失败](手中道具不可充能时会有文字提示；不进入CD)。\n\n可充能的道具列表如下：{盘子}/{扁盘}/{玻璃杯}/{碗}/{叉子}/{高尔夫球}/{香水瓶}/{胡椒瓶}/{灰花瓶}/{蓝花瓶}/{奶酪}/{小电球}/{大电球}。',

        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '提升附着电流的伤害和控制时间。',
            cooldown: 20,
            detailedDescription: '电流改为造成{70*,电击}伤害，且控制时间延长至1.2秒。',
          },
          {
            level: 3,
            description:
              '手中没有道具时，使用技能会产生电球（命中敌方造成电击伤害和眩晕，可二次充能）。',
            cooldown: 20,
            detailedDescription:
              '手中没有道具时，使用技能会产生电球（未过载时生成{小电球}，过载时生成{大电球}。电球命中敌方造成{70*,电击}伤害和1.2秒眩晕，命中墙缝造成{_1.5*}伤害。可再次被本技能充能以获得充能状态）。',
          },
        ],

        aliases: ['充电', '充能'],

        parts: [
          {
            cueRange: '本房间可见',
            forecast: 0,
            aftercast: 0,
            canUseInAir: true,
            canHitInPipe: true,
            cooldownTiming: '释放后',
            cancelableSkill: '无前摇',
            canMoveWhileUsing: true,
            cancelableAftercast: '无后摇',
          },
        ],
      },
      {
        name: '能源装置',
        aliases: ['过载', '放电'],
        type: 'weapon1',
        description:
          '加装强力能源装置，获得[电量条](电量上限100%，获得电量条时电量为100%)，电量缓慢下降，虚弱时清空电量；可通过食物、药水等方式回复100%电量，从猫手上掉落或从火箭上被救下回复80%电量。\n电量条有三种颜色，对应以下三个形态：\n常态-$绿色$text-green-600 dark:text-green-300 font-bold#指示灯：无特殊效果。\n过载状态-$黄色$text-amber-500 dark:text-yellow-300 font-bold#爆闪指示灯：开启本技能时立刻回复100%电量并进入过载状态，爆发性提高移速、跳跃速度、攻击增伤和投掷物的速度，但会加速消耗电量，电量小于30%时自动结束过载状态，再次使用可关闭并退出该状态。\n亏电状态-$红色$text-red-500 dark:text-red-400 font-bold#指示灯：电量低于30%时将进入亏电状态。移速和跳跃速度降低，且无法释放本技能。当电量归零时，[强制原地充能2秒](无法移动、交互、使用道具或技能等)，恢复到80%电量。',
        detailedDescription:
          '对本技能加点后，朵朵加装强力能源装置，获得[电量条](电量上限100%，获得电量条时电量为100%)，电量以0.5%/秒的速度下降，虚弱时清空电量；可通过[食物、药水](注意：当食物或药水带来的增益效果未结束时，再次吃同种食物或喝同种药水是不能回复电量的。\n（例如：喝完牛奶后，在牛奶带来的恢复+加速效果未结束时再次喝牛奶，则第二次喝的牛奶不会回复电量；喝下远视药水后，在远视药水带来的远视效果未结束时再次喝下远视药水，则第二次喝下的远视药水不会回复电量）)、被{仙女鼠}-{仙女棒}1星命中或[在{蒲团}上获得“静心”状态](与食物、药水类似，“静心”状态未结束时再次获得“静心”状态不会回复电量)回复100%电量，从猫手上掉落或被火箭上救下回复80%电量。\n电量条有三种颜色，对应以下三个形态：\n常态-$绿色$text-green-600 dark:text-green-300 font-bold#指示灯：无特殊效果。\n过载状态-$黄色$text-amber-500 dark:text-yellow-300 font-bold#爆闪指示灯：开启本技能时立刻回复100%电量、{主动技能}的充能速度增加100%，并进入持续100秒的过载状态：移速提高20%，跳跃能力提高10%，攻击力+20，投掷物被投掷时的初速度提高1000，但消耗电量速度大幅提高。电量小于30%时自动结束过载状态，再次使用本技能可以主动关闭技能退出过载状态。\n亏电状态-$红色$text-red-500 dark:text-red-400 font-bold#指示灯：电量低于30时将进入亏电状态。移速降低5%，且无法释放本技能。当电量归零时，[强制原地充能2秒](无法移动、交互、使用道具或技能等，同时以20%/秒的速度恢复电量，持续4秒，结束后进入1秒动作后摇)，最终恢复到80%电量。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        canHitInPipe: true,
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '[过载状态电量消耗速度为4.5%/秒](在不补充电量的情况下，过载状态持续15.85秒)。',
            cooldown: 22,
          },
          {
            level: 2,
            description:
              '朵朵进入虚弱时，[向固定方向弹出](电池将固定面朝前上方飞出，前方为墙壁时将反方向弹出)一枚{电池}（[朵朵](包括火箭上的朵朵)碰触时解除虚弱并恢复Hp和电量，同时对周围放电，造成电击伤害和眩晕；被其他老鼠拾取和投掷时，命中敌方破碎并放电。电池存在一定时间后自行消失）。',
            detailedDescription:
              '朵朵进入虚弱时，沿[面朝方向上偏60°](若该方向上极短距离内有墙壁等障碍阻挡，则改为背朝方向上偏60°)方向弹射一枚{电池}（可被[朵朵](包括火箭上的朵朵)碰触，解除朵朵的虚弱状态，并立即恢复其60Hp和100%电量，且对自身半径192范围内造成{30*,电击}伤害和0.7秒眩晕；也可被其他老鼠拾取和投掷，命中敌方时破碎并造成{70*,电击}伤害（伤害来源为电池投掷者，被不同角色投掷时伤害可能不同）和[0.7秒眩晕](该数据存疑，待进一步测试)。被其他老鼠投掷的电池在命中敌方或碰到平台、地面时将会消失，电池存在12秒后也会自行消失，也可由{鞭子}或{斗牛(衍生物)}损毁并消失。',
            cooldown: 22,
          },
          {
            level: 3,
            description:
              '过载状态的电量消耗速度降低。[进入过载状态时](若在过载状态下加点本技能至Lv.3，则会立刻恢复100%电量并释放电流)将在近身一定范围内放电（造成电击伤害和眩晕）。',
            cooldown: 22,
            detailedDescription:
              '[过载状态消耗电量降低至2.5%/秒](在不补充电量的情况下，过载状态持续28.9秒)，[进入过载状态时](若在过载状态下加点本技能至Lv.3，则会立刻恢复100%电量并释放电流)将在自身半径192范围内释放电流，造成{70*,电击}伤害和1.2秒眩晕（注意：该伤害因触发时机而无法享受过载的攻击力加成）。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '机械身躯',
        type: 'passive',
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '减弱太空和水下缺氧对朵朵造成的伤害。',
            detailedDescription:
              '太空缺氧伤害降低50%（由17/s降至8.5/s），缺氧伤害间隔不变；湖泊缺氧伤害降低60%（由50/s降至20/s），氧气消耗速度不变。',
          },
          {
            level: 2,
            description:
              '受控制时间缩短；不会因为搬运奶酪而减速；不会因推奶酪造成视野缩小；受到的减速影响大幅降低。',
            detailedDescription:
              '受控制时间缩短35%；不会因为搬运奶酪而减速；不会因推奶酪造成视野缩小；受到的减速影响大幅降低（任何减速（包括虚弱减速等）最多只能减少朵朵当前15%的最大移速）。',
          },
          {
            level: 3,
            description:
              '当朵朵Hp降低到一定比例时，对周围进行放电（造成电击伤害和眩晕），处于过载状态下则造成的眩晕时间略微延长。',
            detailedDescription:
              '当朵朵Hp降低到Hp上限的50%时，立即向自身半径192范围内释放电流，造成{30*,电击}伤害和1秒眩晕，处于过载状态下则改为造成{70*,电击}伤害和1.2秒眩晕。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '道具起手的特技道具-过载电流-充能道具连招。',
      },
    ],
    aliases: ['朵帝', '雷电法王', '电耗子'],
  },
  /* ----------------------------------- 仙女鼠 ----------------------------------- */
  仙女鼠: {
    aliases: ['大表姐'],
    description:
      '仙女鼠来自于神秘的地方，优雅又充满智慧的她，对小老鼠们充满了怜悯。在杰瑞遇到困难的时候，她悄然出现，好像灰姑娘的教母，满足杰瑞的愿望，帮助杰瑞战胜强敌。',
    EnglishName: 'Fairy Godmother',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '一星造成伤害、八星造成干扰；三级被动击中猫咪强制反向。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '四星帮队友回血；六星将队友变星星；魔镜提供道具和经验蛋糕。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 2,
        description: '将猫变为大星星后使其暂时失去部分攻击和防守能力，可以抱团强行推奶酪。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '魔镜',
        pattern: '122020011',
        weaponType: 'weapon1',
        description: '开局位置不好救援，可先点传送救人或被猫追捕快速跑路',
      },
      {
        id: '被动',
        pattern: '202002111',
        weaponType: 'weapon1',
        description: '先点三级被动反向，队友救援，旁边干扰',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'C-不屈', 'C-救救我', 'B-绝地反击'],
        description: '辅助救援，触发绝反可远距离预判1星',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'S-舍己', 'S-护佑'],
        description: '开局远距离可快速传送护佑救人',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'C-救救我', 'B-绝地反击', 'C-不屈'],
        description: '辅助救人',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'B-绝地反击', 'C-救救我'],
        description: '逃窜弥补前期自保，克制大部分击晕猫，而绝反提升星星伤害',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '魔镜召唤咒',
        type: 'active',
        aliases: ['镜子'],
        description:
          '召唤{魔镜}。[所有角色](包括敌方角色)均可与魔镜交互，消耗一颗星星获得随机道具、或消耗六颗星星传送至任意房间。（“星星”详见武器技能描述）',
        detailedDescription:
          '召唤{魔镜}。魔镜[存在60秒](可同时存在多个)。[所有角色](包括敌方角色)均可与魔镜交互，消耗一颗星星获得随机道具、或[消耗六颗星星传送至任意房间](进入传送界面即扣除星星，取消传送不返还星星。无法携带奶酪传送。)。（“星星”详见武器技能描述）\n一、二级道具概率：{盘子}或{碗}:20%、{高尔夫球}:15%、{胡椒瓶}:15%、{香水瓶}:10%、{冰块}:10%、{遥控器}:10%、{苍蝇拍}:10%、{老鼠夹}:5%、{神秘饮料}:4%、{奶酪}:1%。\n三级道具概率：{盘子}或{碗}:10%(↓)、{高尔夫球}:15%、{胡椒瓶}:15%、{香水瓶}:10%、{冰块}:10%、{遥控器}:10%、{苍蝇拍}:5%(↓)、{老鼠夹}:5%(↓)、{神秘饮料}:5%(↑)、{奶酪}:1%、{鞭炮束}:5%(+)、{狗骨头}:5%(+)、Lv.3{火药桶}或{花洒}或{披萨}（[有特殊阵营归属](召唤的火药桶和花洒属于中立衍生物，会对双方造成同等效果；由仙女鼠召唤的披萨属于仙女鼠的衍生物，只会撞击敌方角色)）:4%(+)。\n\n只能使用自己的星星许愿，不可借用队友星星。\n2025.9.27另注：现全等级许愿均有概率出现{魔镜经验蛋糕}。', //ToDo: 修正以上概率数据（取自梦回视频）
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*', '跳跃键'],
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        forecast: 1.5,
        aftercast: 0.32,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 40,
          },
          {
            level: 2,
            description: '',
            cooldown: 30,
          },
          {
            level: 3,
            description: '有概率许愿出更稀有的道具。',
            detailedDescription:
              '许愿的产物改变，新增{鞭炮束}、{狗骨头}、{火药桶}（3级）、{花洒}、{披萨}。',
            cooldown: 30,
          },
        ],
      },
      {
        name: '仙女棒',
        type: 'weapon1',
        description:
          '加点后，场上所有角色均可通过局内行为积累星星（局内代币）。\n仙女鼠可消耗一定数量的星星来投掷可穿墙的{星星}，并对命中者施加对应效果。1星、2星、4星、6星在飞行期间会追踪附近小范围内的友方。\n1星：队友-隐身；猫咪-受到伤害并减速。\n2星：队友-获得二段跳效果；猫咪-同1星。\n4星：队友-缓慢恢复Hp；猫咪-同1星。\n6星：队友-变为{小星星}并免疫虚弱和眩晕；猫咪-同1星。\n8星：队友-无效；猫咪-变为{大星星}并掉落手中老鼠。\n\n老鼠可通过攻击猫咪、推奶酪、救援队友等方式获取星星，仙女鼠自身可额外通过本技能其余效果获取星星；猫咪可通过对老鼠造成伤害[夺取2颗](老鼠的星星少于2颗则全部夺取)星星。\n每个角色最多存储9颗星星；仙女鼠可以借用附近队友的星星。',
        detailedDescription:
          '对本技能加点后，场上所有角色均可通过局内行为积累星星（局内代币），星星可供仙女鼠本技能消耗，也可用于对{魔镜}许愿。\n仙女鼠可消耗一定数量的星星来投掷[可穿墙](飞行速度2000；会被经典之家的挡板挡住)的{星星}；1星、2星、4星、6星若在飞行过程中距友方距离小于180，则以2000的速度追踪最近的友方；命中敌方或我方角色时对其施加对应效果：\n1星：队友-隐身3秒；猫咪-造成{20*,无视护盾}伤害，并减速17%，持续一小段时间。\n2星：队友-获得二段跳效果，持续5秒；猫咪-同1星。\n4星：队友-回复10Hp，并持续回血8秒，每秒7.5Hp；猫咪-同1星。\n6星：队友-解除虚弱和眩晕，并变为{小星星}（免疫虚弱和眩晕，移速665，可使用星星翻滚，CD为2秒，向前方滚动1.3秒，期间移速增加50%），持续5.9秒；猫咪-同1星。\n8星：队友-无效果；猫咪-解除虚弱和眩晕并掉落手中老鼠，随后变为{大星星}（免疫虚弱和眩晕，移速为725，碰撞体积大于常规猫咪，可使用[额外技能](前摇0.3秒，不可移动、不可取消；CD为1秒，最多存储3发)吐出{星星-敌方}，其飞行速度为2000，会对命中目标造成{20*,无视护盾}伤害（伤害来源为大星星，基础伤害为20，受大星星的基础攻击增伤等状态影响）和2秒10%减速。大星星拥有爪刀，爪刀判定范围与附加效果不受影响。变为大星星[不会中断部分技能](不会取消苏蕊跳舞、恶魔汤姆打碟)），持续8秒。\n\n星星的获取方式：\n老鼠：对猫咪造成[伤害等负面状态/效果](每次造成均+1颗星星；击倒猫咪相当于造成伤害和虚弱效果，故可获得两颗；仙女鼠自身的三级被动除外)、推入奶酪、[救下队友](包括被猫抓住和被绑上火箭的队友)，以上行为每次获取1颗星星；仙女鼠自身可通过本技能其余效果获取额外星星。\n猫咪：每次对老鼠造成伤害[夺取2颗](老鼠的星星少于2颗则全部夺取)。\n\n每个角色最多存储9颗星星；当仙女鼠有队友时，仙女鼠可以且会优先使用[半径1800范围内队友](如果有多个队友，优先借用最近队友的星星)的星星抵扣本技能的消耗。', //小星星注释原有“不免疫剑汤挑起”，意义不明（？）现暂时移除
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键', '跳跃键'],
        forecast: 0.32,
        aftercast: 0.15,
        // cancelableAftercast: '无后摇', //FIXME
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '自身星星额外以每7秒一颗的速度增长。',
            cooldown: 8,
          },
          {
            level: 2,
            description: '',
            cooldown: 2,
          },
          {
            level: 3,
            description:
              '自身星星增长速度提高至每5秒一颗。队友通过攻击获得星星时，仙女鼠也会获得1颗。',
            cooldown: 2,
          },
        ],
        aliases: ['魔法棒', '星星棒'],
      },
      {
        name: '魔咒强身',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '[保持静止](可用自起刷新不动状态)时，获得减伤。受到控制效果时失去减伤。',
            detailedDescription:
              '[保持静止](可用自起刷新不动状态)时，获得40点固定减伤。受到眩晕等控制效果时失去减伤。',
          },
          {
            level: 2,
            description: '受到攻击后进入短暂的隐身。',
            detailedDescription:
              '受到攻击后进入隐身，持续3秒；并[清除部分负面状态](由道具造成的反向及失明，以及由莱特宁-咸鱼造成的“鱼腥味”)。',
          },
          {
            level: 3,
            description: '对敌方造成伤害时，额外造成短暂的反向。',
            detailedDescription: '对敌方造成伤害时，额外对其造成3秒的反向。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '通用特技。',
      },
    ],
  },

  /* ----------------------------------- 米可 ----------------------------------- */
  米可: {
    description:
      '米可是米雪儿的哥哥，出身良好的他立志成为一个优秀的新闻人。以优异成绩毕业后，米可投身新闻事业，总是第一时间出现在新闻现场，向观众提供专业权威的新闻报道。',
    EnglishName: 'Miko',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '{主动技能}可以对猫造成减速、伤害、控制效果。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '{主动技能}可以减少猫造成的伤害。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 4,
        description:
          '米可救援可以在远处先使用{武器技能}拍照，舍己救人后通过二段回溯逃离并回溯血量。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        level: 4,
        description:
          '米可{主动技能}和{3级被动}的降低伤害效果可加算叠加，完全体状态下能使受到的伤害总共降低40%，并且还有霸体和回溯，几乎无法被常规手段击倒；{主动技能}还能造成很强的干扰效果。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '相机',
        pattern: '12[10]10022',
        weaponType: 'weapon1',
        description: '主流加点，开局先点出相机以便之后救援。',
      },
      {
        id: '采访',
        pattern: '101010222',
        weaponType: 'weapon1',
        description: '通过优先点出采访和被动增强干扰能力。',
      },
      {
        id: '被动',
        pattern: '120001122',
        weaponType: 'weapon1',
        description: '现版本的三级被动让采访状态下的米可血量更高，也能蹭到更多素材',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '米可主流卡组。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-救救我', 'S-缴械'],
        description: '没有21知识量时可选择携带。',
      },
      {
        id: 'Sunny推荐',
        description:
          '以下三套卡组本质是在无21知识量情况下，舍弃铁血换取更高上限的卡组方案，不推荐新手及有21知识量的玩家使用。',
        groups: [
          {
            cards: ['S-舍己', 'B-幸运', 'C-脱身', 'C-不屈', 'C-救救我'],
            contributor: 'sunny',
            description:
              '适用于无21知识点且单排的情况下，或队伍内缺少稳救时自保使用。幸运脱身可用于应对前期穷追针对米可的打法（由于米可在中低血量的情况下被死追时自保能力趋近于无，所以脱身提供的血量为必要），在猫没有提前布双夹的意识的情况下打米特以外的猫米可基本可以通过幸运脱身换取一次前中期火箭容错（只要能开出采访就能拖延很长一段时间），不屈用于保后期强度。',
          },
          {
            cards: ['S-舍己', 'A-逃窜', 'C-不屈', 'B-应激反应', 'C-救救我'],
            contributor: 'sunny',
            description:
              '适用于无21知识点且多排的情况下，或队伍中有强稳救/队伍构筑为三保一时使用，以及打如玉时作为对策卡组使用。逃窜应激可以让米可在挨打后获得非常客观的爆发移速，加上后期残局不屈提供的常态移速与米可3级被动提供的爆发移速基本可以做到挨一刀就飞走，同时由于如玉的爪刀不带有控制且击倒满血米可能力有限的情况下可以在挨刀后利用非常高的爆发移速迅速拉开与猫的距离逃走。',
          },
          {
            cards: ['S-舍己', 'B-幸运', 'C-脱身', 'C-不屈', 'A-祝愿'],
            contributor: 'sunny',
            description:
              '仅适用于以天使为核心的幸运体系，舍己用于配合米可的救人能力救天使，幸运脱身保证前期生存，祝愿用于配合天使换取飞掉之后的团队收益，不屈保证后期强度。',
          },
        ],
        defaultFolded: true,
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '说出你的故事',
        aliases: ['采访'],
        type: 'active',
        videoUrl: 'https://www.bilibili.com/video/BV1GQcuzYE3y', // TODO: add time stamps
        description:
          '开始采访，期间免疫控制且移速固定，范围内敌方的移速降低，造成的伤害降低，且[作出攻击行为](包括使用爪刀、投掷道具、使用技能、对米可造成伤害)时会为其自身叠加一层“素材”状态，最多叠加5层。可通过第二段技能进行曝光，对大范围内持有“素材”的敌方造成伤害和眩晕，“素材”层数越高效果越强，3层以上时会掉落道具和老鼠。曝光后清除对方持有的素材。',
        detailedDescription:
          '进入采访状态，持续12.5秒，期间免疫控制且移速固定为650，以米可自身为中心，生成大小1000*500的采访范围，[位于采访范围内](若敌方在进入采访范围时持有护盾/霸体/减伤等效果，则当次处于采访范围期间不会受到减速削弱等影响；反之，若敌方在进入采访范围后才获得护盾/霸体/减伤等效果，则当次处于采访范围期间仍然会受到减速削弱等影响。部分霸体/减伤效果除外，具体情况需单独测试)的敌方的移速降低25%，[造成的伤害降低20%](该效果作用于敌方，且与其他百分比降低伤害的效果加算叠加)，且[作出攻击行为](包括使用爪刀、投掷道具、使用技能、对米可造成伤害。部分技能效果会算作多次攻击行为，例如牛仔汤姆弹弓每射出一个仙人掌都会提供一层素材（算作投掷道具）；凯特每引爆一层米可身上的“破绽”，或图多盖洛的吻痕每造成一次伤害都会提供一层素材（算作各自独立的多段伤害）。少部分多段类技能在使用第二段时不会叠加素材)时会[为其自身叠加一层“素材”状态](若敌方持有护盾/霸体/减伤等效果，则暂时不会被叠加素材，但部分霸体/减伤效果除外，具体情况需单独测试)，最多叠加5层。采访到达时限或点击额外技能键可终止采访。\n[再次点击主动技能键](采访时或终止采访后均可)可通过二段技能进行曝光，对大范围内持有“素材”的敌方依次造成：\n1.素材层数×0.6秒眩晕（可击破1层护盾）\n2.若素材≥3层，额外造成一次可击落老鼠和道具、极短暂的眩晕（可击破1层护盾）\n3.造成{0*,不受来源影响,不可攻击护盾,无视伤害保护}伤害（每层素材状态使该伤害提高30，最高150），随后清除对方持有的素材。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '采访期间每隔5秒为敌方叠加一层“素材”。',
            detailedDescription:
              '采访期间，若敌方在5秒内一直处于采访范围内，则[为其叠加一层“素材”](若敌方持有护盾/霸体/减伤等效果，则暂时不会被叠加素材，但部分霸体/减伤效果除外，具体情况需单独测试)。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '采访期间的移速提高，并获得Hp恢复效果。',
            detailedDescription:
              '采访期间的移速提高至750、并[获得2.5Hp/秒的恢复效果](该效果与自然恢复不同，不会因受伤而失效)。',
            cooldown: 25,
          },
          {
            level: 3,
            description:
              '采访期间改为[每隔2.5秒](此处游戏内原文为3秒，但实际生效间隔为2.5秒)为敌方叠加一层“素材”。',
            detailedDescription:
              'Lv.1中“敌方一直处于采访范围内”的相关素材叠加机制失效，改为：\n[猫咪进入采访范围后开始倒计时](该倒计时无视敌方的护盾/霸体/减伤等效果，且不会在状态栏显示)，期间离开采访范围不会终止倒计时；倒计时2.5秒后进行结算：若猫咪在倒计时的第1~2.5秒内曾进入/处于采访范围内，则[为其叠加一层“素材”](若敌方持有护盾/霸体/减伤等效果，则暂时不会被叠加素材，但部分霸体/减伤效果除外，具体情况需单独测试)，反之无事发生。倒计时结束后可以立刻开始新的倒计时。',
            cooldown: 25,
          },
        ],
        canHitInPipe: true,
        cooldownTiming: '释放后',
      },
      {
        name: '记录美好瞬间',
        aliases: ['相机'],
        type: 'weapon1',
        videoUrl: 'https://www.bilibili.com/video/BV1GQcuzYE3y', // TODO: add time stamps
        description:
          '用魔法相机为面向镜头的所有角色[生成](可被虚弱、霸体等状态抵挡，但不能被无敌抵挡)一张{照片}，12秒内可再次使用技能将所有照片中的角色以照片生成时的状态[回溯](可被其虚弱、霸体、护盾、无敌等状态抵挡)。',
        detailedDescription:
          '用魔法相机自拍，对面向镜头的所有角色[附加被拍摄状态](可被虚弱、霸体等状态抵挡，但不能被无敌抵挡)，并在被拍摄到的角色脚下生成{照片}，12秒内可再次使用技能将所有持有被拍摄状态的角色[回溯](可被其虚弱、霸体、护盾、无敌等状态抵挡)，使其传送到自身照片所在位置，且将当前Hp改为被拍摄时的状态。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '拍摄到的敌方受到伤害和{失明}状态。',
            detailedDescription:
              '拍摄到的敌方[随后](伤害效果在照片生成后再结算，因此敌方被回溯时仍然为被拍摄时原本的Hp)会受到{50*,不可攻击护盾}伤害，且在被拍摄状态持续期间{失明}，回溯后解除。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '',
            cooldown: 20,
          },
        ],
        cooldownTiming: '释放后',
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['跳跃键'],
        cueRange: '全图可见',
      },
      {
        name: '必备专业素养',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1GQcuzYE3y', // TODO: add time stamps
        skillLevels: [
          {
            level: 1,
            description: '视野范围提升。',
            detailedDescription: '视野范围提升25%，但无法再获得其他视野提升效果。',
          },
          {
            level: 2,
            description: '对附近的敌方附加“审视”状态，使其短暂暴露小地图位置。',
            detailedDescription: '对附近的敌方附加“审视”状态，使其暴露小地图位置5秒。',
          },
          {
            level: 3,
            description:
              '受到来自敌方的伤害时，一段时间内受到的伤害降低，移速和救援队友的速度大幅提高。',
            detailedDescription:
              '受到来自敌方的伤害时，10秒内[受到的伤害降低20%](该效果作用于自身，且与其他百分比降低伤害的效果加算叠加，包括作用于敌方的百分比降低伤害效果)，移速提高25%，救援队友的速度提高50%。',
          },
        ],
      },
    ],
    aliases: ['记者'],
    specialSkills: [
      {
        name: '应急治疗',
        description: '加强生存能力，与被动减伤配合较好。',
      },
      {
        name: '勇气投掷',
        description: '用于缩短采访CD。',
      },
    ],
  },

  /* ----------------------------------- 霜月 ----------------------------------- */
  霜月: {
    description:
      '外表秀气，内心坚强果敢的霜月是百年来唯一一个通过自己努力进入瑶池，参与仙考的鼠族。自幼和弟弟相依为命的她为了提升自己的修为，曾在幼年时期离开仙界，前往下界独自历练数年，回来的时候已经变成一个法力高强的仙子，身边还多了一个贪吃又可爱的小迷袋——胖呆呆。',
    EnglishName: 'Celeste',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '可拦截猫或干扰绑火箭。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description: '滑铲可铲飞图多盖洛香水或夹子。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description:
          '滑铲可铲飞并熄灭火箭，还能踢走夹子；铲飞猫咪并补上定身符即可相对安全地进行救援。',
        additionalDescription:
          '小心敌方的特技-绝地反击。另外敌方在点燃火箭动作期间是无法进行火箭救援的，需尽量避免这种情况。',
      },
      {
        tagName: '辅助',
        level: 2,
        description:
          '乾坤袋可以抱起倒地的队友逃跑，或是吞吐食物帮助队友快速恢复Hp。队友也可以使用乾坤袋。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '121210002',
        weaponType: 'weapon1',
        description: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: [
          'S-舍己',
          'S-铁血',
          'C-救救我',
          [
            CardGroupType.Or,
            'S-缴械',
            [CardGroupType.And, 'C-不屈', [CardGroupType.Or, 'A-投手', 'B-精准投射', 'B-绝地反击']],
          ],
        ],
        description:
          '缴械适合打爪刀猫，如托普斯等。投手适合打斯飞等依靠追击的猫。精准投射减少滑铲CD。而分金符继承{绝地反击}伤害可观，3级甚至可二连分金符',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '滑步踢',
        type: 'active',
        description:
          '向前滑铲，期间{免控}且可进行转向，滑铲期间会[铲飞遇到的所有道具](火箭会垂直向上铲飞，其他道具向滑铲方向的斜上方铲飞；为单纯的受力效果，与“投掷”不同，不会命中敌方)；可通过跳起结束滑铲，跳起时可通过道具键扔出纸符，其可穿墙且初速度较高，根据自身特性分为两种：\n{金币符}：手上无道具进行投掷时自动生成。命中敌方造成伤害，并扣除一定局内金钱。\n{定身符}：手上拿着[部分道具](包括盘子/扁盘/玻璃杯/碗/叉子/高尔夫球/香水瓶/胡椒瓶)进行投掷时自动转化。命中敌方造成伤害和短暂{定身}（不掉落老鼠），手上拿着的其他道具不会自动转化。',
        detailedDescription:
          '以1600/秒的速度向前滑铲，期间{免控}且可进行转向，滑铲期间会[铲飞遇到的所有道具](火箭会垂直向上铲飞，其他道具向滑铲方向的斜上方铲飞；为单纯的受力效果，与“投掷”不同，不会命中敌方)；滑铲期间可通过跳跃键跳起并结束滑铲，跳起时可通过道具键扔出纸符，纸符可穿墙且被投掷时的初速度较高，可触发{投掷命中效果}。纸符根据自身特性分为两种：\n{金币符}：手上无道具进行投掷时自动生成。命中敌方造成{50*}伤害，并扣除15%（至少为500）局内金钱。\n{定身符}：手上拿着部分道具进行投掷时自动转化为定身符。命中敌方造成{30*}伤害和2秒{定身}（不掉落老鼠）。手上拿着其他道具则不会变成定身符。可被转化为定身符的道具包括：{盘子}/{扁盘}/{玻璃杯}/{碗}/{叉子}/{高尔夫球}/{香水瓶}/{胡椒瓶}。\n在滑步踢跳起且未落地时，手中没有道具时会优先拾取道具，而非丢出金币符；金币符丢出后仍可拾取道具，且可自动转化；金币符被投掷时无前摇，定身符被投掷时和其他投掷物一样有前摇，若前摇期间霜月落地则不会转化为定身符，而是直接丢出原道具。',
        videoUrl: 'https://www.bilibili.com/video/BV1vYNTzrE3q?=59',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键'],
        cancelableAftercast: ['移动键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description:
              '[可铲飞敌方猫](铲飞效果类似眩晕+向上方的击退，猫在被铲飞时解除其他控制效果，过程中为霸体)。乾坤袋在附近时，铲飞还会造成少量伤害和{眩晕}（可击落老鼠）。',
            cooldown: 15,
            detailedDescription:
              '[可铲飞敌方猫1秒](铲飞效果类似眩晕+向上方的击退，猫在被铲飞时解除其他控制效果，铲飞过程中前0.7秒为霸体（该数据存疑）)。乾坤袋在半径480范围内时，铲飞还会造成{10*,不受来源影响,不可攻击泡泡}伤害和1秒{眩晕}（可击落老鼠）（该效果与铲飞本身合计击破1层护盾）。',
          },
          {
            level: 3,
            description: '',
            charges: 2,
            cooldown: 15,
          },
        ],
        aliases: ['滑铲'],
        cueRange: '本房间可见',
      },
      {
        name: '乾坤袋',
        aliases: ['胖呆呆', '袋子'],
        type: 'weapon1',
        description:
          '扔出{乾坤袋-投射物(衍生物)}，落地后生成{乾坤袋(衍生物)}。再次使用技能则收回乾坤袋，随后技能进入CD。\n\n{乾坤袋(衍生物)}：小地图会显示位置。常态持有霸体，受到两次伤害后会进入20秒特殊的[虚弱状态](无法移动和释放技能，一段时间后自动恢复)。拥有吞噬和激励两个技能，且老鼠可与其进行融合。\n融合：老鼠[与乾坤袋融合](融合后该老鼠状态栏和小地图的头像会变为胖呆呆)，融合后可操纵乾坤袋移动、跳跃、[进行部分交互](开/关门，抱起队友，钻少数管道等)、释放技能。可抱起队友并通过投掷将其扔出，命中敌方造成伤害和眩晕。\n吞噬：吞噬周围的一个可吞噬目标，短暂延迟后将其吐出。可由操纵者释放，也可由未融合的乾坤袋自行尝试释放。\n激励：将操纵者携带的{速推}、{破墙}、{无畏}、{舍己}效果给予周围的友方。只可由操纵者释放。\n\n可吞噬目标及效果：\n[投掷道具](只包括常规类投掷道具)：将其以被投掷的形式吐出，优先瞄准附近的敌方；\n{打开的老鼠夹}：吐出折叠的{老鼠夹}；\n{蛋糕}和{牛奶}：将其以投掷物的形式吐出，优先瞄准附近的友方，命中友方使其立即获得对应效果；\n{奶酪}：吐出很轻的奶酪，其被搬运时不会降低搬运者的移速和跳跃高度；\n[饮料](包括远视/隐身/护盾/兴奋/变身/随机饮料)：随机吐出一个[饮料](包括远视/隐身/护盾/兴奋/变身/随机饮料)；\n敌方角色：吐出后使其减速一段时间；\n绑有队友的{火箭}：吐出后使其熄灭。',
        detailedDescription:
          '向任意方向扔出{乾坤袋-投射物(衍生物)}，命中猫咪使其移速降低40%持续5秒，或命中墙缝造成{_3*}伤害；命中敌方角色/墙缝/平台/地面后生成{乾坤袋(衍生物)}，若因极端情况导致乾坤袋-投射物飞行时间过长，则在飞行数秒后会立刻生成乾坤袋。[再次使用技能]（乾坤袋召唤物未出现前，无法再次使用技能）则[收回乾坤袋]（使其以道具形式以1500速度飞向霜月，且会携带已吞噬但未吐出的道具一同返回，该道具不会触发被吐出时的变化效果；飞行最长3秒，若仍未到达霜月的位置，则改为立刻传送到终点；只有到达终点后才会使技能进入CD），随后技能进入CD。\n\n{乾坤袋(衍生物)}：所有玩家都能在小地图看到乾坤袋的位置。当乾坤袋与老鼠融合后变为对应阵营，此时不再暴露视野。常态持有霸体，攻击增伤和破坏增伤均为0，Hp上限为2，[受到的伤害最多为1](特例：被携带了知识卡-长爪的猫的爪刀命中时，仍会受到25点伤害而进入虚弱状态）)。当Hp小于等于0时会进入20秒特殊的[虚弱状态](无法移动和释放技能并每秒恢复0.1Hp)，虚弱状态结束时自动起身并获得1秒无敌。其拥有吞噬和激励两个技能，且老鼠可与其进行融合。\n融合：老鼠点击交互键耗时1.5秒[与乾坤袋融合](融合后该老鼠状态栏和小地图的头像会变为乾坤袋；模型暂时消失；视野改为以乾坤袋位置为基点，这一过程中可能触发部分视野bug)。融合后可操纵乾坤袋移动、跳跃、[进行部分交互](开/关门，抱起队友，钻少数管道等)、释放技能。融合后可[抱起队友（交互时长1秒）并通过投掷将其扔出，命中敌方造成50伤害和2.5秒眩晕](伤害来源为乾坤袋，但若对敌方造成眩晕则可使操纵者或霜月获得局内商店金钱)，猫在接下来4.5秒内免疫该效果。\n吞噬：吞噬周围小范围内的一个可吞噬目标，咀嚼1秒后将其吐出。属于乾坤袋自身的技能，只能在范围内有可吞噬目标时才能释放，CD为8秒，可移动释放，可被移动键的转身打断。可由操纵者释放，也可[由未融合的乾坤袋自行尝试释放](由其释放时会使乾坤袋暂时无法进行融合操作。另外如果老鼠在乾坤袋开始吞噬时站在乾坤袋所在位置并保持不移动，则执行融合操作的交互键会始终无法出现，老鼠移动后恢复正常)，二者共享CD。\n激励：进入激励动作，持续5秒，期间无法移动，并将操纵者携带的{速推}、{破墙}、{无畏}、{舍己}效果给予周围800范围内的友方。属于乾坤袋自身的技能，CD为25秒，可被跳跃键打断。只可由操纵者释放。\n\n可吞噬目标及效果：\n部分投掷道具（包括{玻璃杯}/{盘子}/{碗}/{扁盘}/{灰花瓶}/{蓝花瓶}/{香水瓶}/{胡椒瓶}/{番茄}/{高尔夫球}）：将其以被投掷的形式吐出，优先瞄准附近800范围内的敌方；\n{打开的老鼠夹}：吐出折叠的{老鼠夹}；\n{蛋糕}和{牛奶}：将其以[可穿墙投掷物](可穿越绝大多数墙体，但不可交互)的形式吐出，优先瞄准附近800范围内的友方，命中友方使其立即获得对应效果；\n{奶酪}：吐出很轻的奶酪，其被搬运时不会降低搬运者的移速和跳跃高度；\n[饮料](包括远视/隐身/护盾/兴奋/变身/神秘饮料)：随机吐出一个[饮料](包括远视/隐身/护盾/兴奋/变身/随机饮料)；\n敌方角色：吐出后使其使其移速降低40%，持续3秒，并使其在10秒内不会被吞噬；\n绑有队友的{火箭}：[吐出](火箭将以较低的初速度，沿抛物线被投掷，直到落地后才不再移动位置)后使其熄灭。',
        videoUrl: 'https://www.bilibili.com/video/BV1vYNTzrE3q?=89',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['跳跃键', '移动键', '药水键'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '未融合状态的乾坤袋每5秒会尝试释放一次吞噬，成功释放后10秒内不再进行新的尝试。',
            cooldown: 50,
          },
          {
            level: 2,
            description: '若技能期间乾坤袋未进入过虚弱状态，收回时根据剩余Hp返还CD。',
            cooldown: 30,
            detailedDescription:
              '若技能期间乾坤袋未进入过虚弱状态，收回时根据剩余Hp返还CD，每1Hp返还10秒CD。',
          },
          {
            level: 3,
            description: '缩短未融合的乾坤袋自动尝试吞噬的间隔。',
            cooldown: 30,
            detailedDescription:
              '缩短未融合状态的乾坤袋自动尝试吞噬的间隔至3秒（成功释放后原有的10秒间隔不变）。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '灵气修为',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1vYNTzrE3q?=36',
        skillLevels: [
          {
            level: 1,
            description: '每隔15秒，获得5秒的跳跃加成。',
            detailedDescription: '每隔15秒获得以下增益：使跳跃能力提高30%，持续5秒。',
          },
          {
            level: 2,
            description: '{金币符}或{定身符}命中敌方时，自身推速和救援队友的速度短暂提升。',
            detailedDescription:
              '{金币符}或{定身符}命中敌方时，自身推速增加100%，救援队友的速度增加80%，持续5秒。',
          },
          {
            level: 3,
            description:
              '受到猫的爪击后不会立刻减少Hp，而是在5秒内固定减少60%最大Hp。如果期间受到乾坤袋的激励，则会移除该效果。',
            detailedDescription:
              '受到爪击伤害时，使当次伤害强制归零，但自身会以9.2Hp/秒的速度损失Hp，持续6秒。如果期间受到乾坤袋的激励，则会移除损失Hp的效果。期间再次被猫爪击，刷新持续时间并叠加1层扣血效果，至多叠加2层。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '魔术漂浮',
        description: '乾坤袋可主动中断漂浮，且漂浮空中可扔出多个符。',
      },
      {
        name: '干扰投掷',
        description: '符为控制道具，可触发干扰投掷。',
      },
      {
        name: '勇气投掷',
        description: '减少滑铲CD便于守火箭。',
      },
    ],
  },

  /* ----------------------------------- 表演者•杰瑞 ----------------------------------- */
  '表演者•杰瑞': {
    aliases: ['表演者杰瑞', '柠檬杰瑞'],
    description:
      '[来自神秘平行时空的另一位杰瑞](原型是查克琼斯画风的杰瑞)，曾因意外从西方漂洋过海来到东方戏院，立志成为一名优秀的演员。最终因一段奇妙际遇跟随汤姆和杰瑞来到它们的时空，不断磨砺演技，追寻着艺术梦想。',
    EnglishName: 'Performer Jerry',
    mousePositioningTags: [
      {
        tagName: '救援',
        level: 4,
        description:
          '{主动技能}可以安全地接近火箭，即便不慎被击倒也可以用{1级被动}及{铁血}效果强行救援。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        level: 2,
        description: '可以提升队友的推速。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '101002221',
        weaponType: 'weapon1',
        description: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
        description: '幸运体系卡组，可以断猫节奏。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'B-应激反应'],
        description: '可以在被打的时候快速跑路。也可以把{应激反应}换成{不屈}。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-绝地反击', 'B-夹不住我', 'C-救救我'],
        description: '武器技能搭配绝地反击可以对猫造成大量伤害，21点时可将夹不住我换成精准投射',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-幸运', 'C-救救我'],
        description: '低端局适用大部分猫，除剑客汤姆等。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '低端局用于针对剑客汤姆这一类猫。',
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '可以在铁血结束后快速起身继续跳舞拖延猫咪。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '梦幻舞步',
        aliases: ['跳舞'],
        type: 'active',
        description:
          '开始跳舞，期间获得{免控}，持续20秒，舞步效果在跳舞10秒后增强。期间给予附近老鼠推速加成、增加附近猫咪爪刀CD，[并使隐身的猫咪显形](若猫咪持有护盾等状态则不会现形)。每次受到伤害使跳舞的持续时间缩短6秒。再次点击技能键可以提前退出跳舞。',
        detailedDescription:
          '开始跳舞，期间获得{免控}，持续20秒。舞步分为两段，每段10秒，第二段的效果更强。第一段给予附近老鼠50%推速加成，[并使隐身的猫咪显形](若猫咪持有护盾等状态则不会现形)；第二段的推速加成增加至100%。每次受到伤害使跳舞的持续时间缩短6秒。再次点击技能键可以提前退出跳舞。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        forecast: 0,
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 35,
            detailedDescription: '',
          },
          {
            level: 2,
            description: '舞步期间额外获得{霸体}（不免疫{伤害}，免疫{虚弱}、{隐身}等效果）。', //新增免疫香水、胡椒粉、番茄与冰面滑行效果，还能免疫受伤状态、图茨-喵喵叫和汽水瓶的可叠加减速、图多盖洛-魅惑之吻
            cooldown: 35,
            detailedDescription:
              '舞步期间额外获得{霸体}（不免疫{伤害}，免疫{虚弱}、{隐身}等效果）。\n该技能Hp归零时仍可正常进入机器鼠，但在[其他延迟虚弱状态准备就绪时](铁血或Lv.1被动准备就绪时)会被打断，从而无法进入。',
          },
          {
            level: 3,
            description: '',
            cooldown: 25,
          },
        ],
      },
      {
        name: '柠檬旋风',
        type: 'weapon1',
        description:
          '拿出柠檬开始表演，同时技能进入读条；表演期间无法移动，且每隔一段时间对附近猫咪叠加一层“酸涩”；再次点击技能进行[“额外表演”](仅用作解锁后续的移动效果，无其他作用。动作表现：快速围绕柠檬一圈)，最多5次，满5次后可以移动并对碰到的敌方单位叠加3层“酸涩”。\n\n酸涩：造成伤害并减少移速、交互速度，最多叠加5层，叠满时会受到额外伤害并{眩晕}一段时间（可掉落老鼠），随后短暂免疫酸涩。',
        detailedDescription:
          '拿出柠檬开始表演，同时技能进入10秒读条，读条结束后结束技能；表演期间无法移动，且每隔一段时间对附近猫咪叠加一层“酸涩”；再次点击技能进行[“额外表演”](仅用作解锁后续的移动效果，无其他作用。动作表现：表演者•杰瑞快速围绕柠檬一圈，同时蓄力条位置随机出现红/绿标志以表示表演的成功与否。成功与否仅影响表现，作为表演者•杰瑞的娱乐，不涉及技能效果)，最多5次，满5次后[化身为柠檬旋风](该效果有特殊的贴图变化)，随后可以移动并对碰到的敌方单位叠加“3层“酸涩”。\n\n酸涩：造成{10*}伤害并减少2.5%移速和交互速度，[可乘算叠加](每层之间效果独立，单独乘算叠加)，最多叠加5层。叠满时会触发“酸涩难耐”——受到{30*}伤害并{眩晕}2秒（可掉落老鼠），眩晕期间及结束后一段时间内免疫“酸涩”。\n同时叠加多层酸涩时，先结算酸涩的伤害，随后再判定酸涩难耐。“酸涩”会被护盾等防护状态免疫（不消耗护盾层数）。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
            detailedDescription: '',
          },
          {
            level: 2,
            description: '',
            cooldown: 20,
          },
          {
            level: 3,
            description: '技能期间快速恢复Hp。',
            cooldown: 20,
            detailedDescription:
              '技能期间[获得20Hp/秒的恢复状态](与角色基础的Hp恢复效果不同，不会因受伤而失效)。',
          },
        ],
        cooldownTiming: '释放后',
        cancelableAftercast: '无后摇',
        cancelableSkill: ['跳跃键'],
      },
      {
        name: '喜剧之王',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '被击倒后[可以继续行动5秒，期间无法使用技能或道具](与铁血类似，优先于铁血生效，可与铁血叠加)，随后才进入虚弱（内置CD为30秒）。',
            detailedDescription:
              '被击倒后[可以继续行动5秒，期间无法使用技能或道具](与铁血类似，优先于铁血生效，可与铁血叠加)，随后才进入虚弱（内置CD为30秒）。',
          },
          {
            level: 2,
            description:
              '被绑在火箭上时，可通过新增的挣扎按键爬下火箭并在一段距离内左右移动。[其他老鼠在表演者•杰瑞和火箭处均可救援](在表演者•杰瑞处救援时，救援速度会变慢一些)。',
            detailedDescription:
              '被绑在火箭上时，可过新增的挣扎按键爬下火箭并在一段距离内左右移动。[其他老鼠在表演者•杰瑞和火箭处均可救援](在表演者•杰瑞处救援时，救援速度会变慢一些)。',
          },
          {
            level: 3,
            description:
              '被绑上15秒以下的火箭后，火箭引线会返回到15秒。被放飞后以“局外人”返场，Hp上限为624，且Hp以2/秒的速度降低，无法进行大部分交互，无法受到治疗，Hp清零时立即被放飞。返场期间可以用道具键投掷{柠檬}（造成极少量伤害和减速）。',
            detailedDescription:
              '被绑上15秒以下的火箭后，火箭引线会返回到15秒。被放飞后以“局外人”返场，Hp上限为624，且Hp以2/秒的速度降低，无法进行大部分交互，无法受到治疗，Hp清零时立即被放飞。返场期间可以用道具键投掷{柠檬}（造成{2.5*,不受来源影响}伤害并在2.5秒内降低10%移速，可触发{投掷命中效果})），内置CD2秒。与{道具}-{泡泡机}[有特殊互动关系](当表演者•杰瑞以“局外人”返场时，泡泡机不会将表演者•杰瑞判定为存活老鼠而因此不额外增加坚固值)。与{库博}-{虚幻梦影}的天堂火箭[有特殊互动关系](表演者•杰瑞在只被绑上天堂火箭的时候无法触发复活，但如果表演者•杰瑞既被绑上天堂火箭又被绑上了普通火箭，那么引线燃烧完后仍然能触发复活)。与{侦探汤姆}-{明察秋毫}的50线索值状态[有特殊互动关系](表演者•杰瑞被拥有50线索值的侦探汤姆第二次或更多次被绑上火箭后，即使该火箭引线低于15秒，也不会触发火箭引线返回效果，而是直接触发复活)。',
          },
        ],
      },
    ],
  },
  /* ----------------------------------- 莱恩 ----------------------------------- */
  莱恩: {
    description:
      '来自平面二维空间中的神秘之鼠，诞生于蘸水笔在蓝图上勾勒的几笔线条，获得生命后便决心将自己的灵感挥洒在每个角落。莱恩从画板中一跃而下，属于艺术家的创作从此揭开序幕。',
    EnglishName: 'Line',
    mousePositioningTags: [
      {
        level: 2,
        tagName: '辅助',
        description: '圆形可以使猫手中道具掉落，3级被动减少队友技能CD，藤蔓给队友回血。',
        additionalDescription: '',
      },
      {
        level: 3,
        tagName: '干扰',
        description: '守火箭能力一流，配合蓝图，猫很难绑上火箭；方块可以封走位。',
        additionalDescription: '',
      },
      {
        level: 2,
        tagName: '砸墙',
        description:
          '{火药桶}对墙缝造成高额伤害，[花洒](莱恩的花洒持续时间较短)能持续对道具施加推力，可通过让高尔夫球在墙缝与花洒右侧水流之间来回弹射进行破墙。',
        additionalDescription: '需要一定的熟练度',
      },
      {
        level: 2,
        tagName: '救援',
        description:
          '蓝图降低火箭燃烧速度，{方块}可以防踩夹；利用{方块}阻挡猫或把猫变{线条猫}+缴械后可以相对安全地救援；{火药桶}可炸火箭救援。',
        additionalDescription: '',
      },
      {
        level: 2,
        tagName: '破局',
        description: '把猫变{线条猫}+缴械后使其失去大部分攻击、防守能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '适合新手',
        pattern: '12[12]20001',
        weaponType: 'weapon1',
        description:
          '四级后，如果有队友在火箭上则点主动减慢火箭燃烧；其余情况皆点武器，七级点1级被动提高自保。',
        additionaldescription: '',
      },
      {
        id: '适合高手',
        pattern: '12[12]21000',
        weaponType: 'weapon1',
        description: '七级点三级蓝图可以稳定把猫变线条并触发缴械。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '带护佑提高自保能力',
      },
      {
        cards: ['S-缴械', 'S-舍己', 'S-铁血', 'C-救救我'],
        description:
          '配合缴械缩小把猫变线条的劣势，但要注意不要和队友的缴械冲突，以及自己缴械cd期间把猫变线条猫找死。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '蓝图',
        type: 'active',
        description:
          '莱恩扔出{蓝图-投射物(衍生物)}，落地后生成一张{蓝图(衍生物)}。接触蓝图的{火箭}变为{线条火箭}（燃烧速度减半），猫咪[隐身状态暂时失效](离开蓝图时恢复)且受到伤害时会短暂变为线条猫（有内置CD），并使手中老鼠掉落。再次使用技能或持续较长时间后收回蓝图。\n{线条猫}：只可使用移动、跳跃和爪刀，但减少受到的伤害、爪刀CD与受控时间。',
        detailedDescription:
          '莱恩扔出{蓝图-投射物(衍生物)}，碰到敌方/平台/地面（不包括{方块}/{强化方块}）/[部分npc](如{大鸭子})、或莱恩再次使用本技能时，[展开](蓝图的贴图需要一小段时间才能完全展开，该动画期间莱恩无法使用技能收回蓝图，但蓝图效果在未完全展开时就已经生效)一个大小1000×666的{蓝图(衍生物)}。接触蓝图的{火箭}变为{线条火箭}（燃烧速度减少20%），猫咪[隐身状态暂时失效](离开蓝图时恢复)且受到伤害时会短暂变为线条猫（变身结束后一段时间内不会再次变为线条猫），持续6秒，变身时手持道具与老鼠自然掉落。再次使用技能或持续较长时间后收回蓝图，蓝图收起后才会进入CD。\n{线条猫}：[只可使用移动、跳跃和爪刀]({如玉}的“花枪反击”键可以正常使用，但不会出现反击的光效，老鼠仍可受到伤害，范围和造成的伤害不变。当{剑客汤姆}变成线条猫时，{骑士之剑}仍可正常触发，1级提供的剑气仍能正常触发)，但受到的伤害和[受控时间](包括虚弱时间)减少50%，爪刀CD减少40%。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: '不可取消',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '蓝图持续30秒。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '蓝图持续时间延长。',
            cooldown: 25,
            detailedDescription: '蓝图持续时间延长至60秒。',
          },
          {
            level: 3,
            description: '扔出的蓝图命中猫咪时，会使其直接变成线条猫。',
            cooldown: 25,
            detailedDescription:
              '扔出的蓝图[命中](免死类霸体免疫该效果)猫咪时，会使其直接变成线条猫。火箭燃烧减慢的效果提升至50%。',
          },
        ],
        cancelableSkill: '不可主动打断',
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
        aliases: [],
        forecast: 0.6,
        aftercast: 0.5,
      },
      {
        name: '蘸水笔',
        type: 'weapon1',
        description:
          '自选位置生成{圆形}、{三角}和{方块}。在蓝图上绘制时，两种图形碰撞可合成其他老鼠的技能衍生物。\n{圆形}○：释放后向莱恩的朝向方向滚动，产生阻挡并对触碰的敌方造成伤害、并击落道具。\n{三角}△：对踩中的敌方造成少量伤害，并降低移速和绑火箭速度。\n{方块}□：停留在生成位置，可被推动，可作为平台或墙壁使用，被爪刀攻击后消失。\n\n蓝图合成配方：\n△+○={火药桶(衍生物)}（1级）\n△+□={花洒(衍生物)}（1级）\n○+□={感应雷(衍生物)}（1级）\n○+○={披萨(衍生物)}（1级）\n△+△={藤蔓(衍生物)}（2级）\n□+□={烟雾(衍生物)}（1级）',
        detailedDescription:
          '在半径800范围内绘制{圆形}、{三角}和{方块}，绘制前摇0.1秒。在蓝图上绘制时，两种图形碰撞可合成其他老鼠的技能道具或召唤物。\n{圆形}○：释放后向莱恩的朝向方向滚动，产生阻挡并对触碰的敌方造成{30*,不受来源影响}伤害、并击落道具；碰撞3次后或存在10秒后消失。\n{三角}△：对踩中的敌方造成{15*,不受来源影响}伤害，且移速降低12.5%、绑火箭速度下降35%，持续7秒；被敌方踩中或持续10秒后消失。\n{方块}□：停留在生成位置，可被推动，可作为平台或墙壁使用；碰撞四次、被爪刀攻击或25秒后消失。\n\n蓝图合成配方：\n△+○={火药桶(衍生物)}（1级）\n△+□={花洒(衍生物)}（1级）\n○+□={感应雷(衍生物)}（1级）\n○+○={披萨(衍生物)}（1级）\n△+△={藤蔓(衍生物)}（2级）\n□+□={烟雾(衍生物)}（1级）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            charges: 3,
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '在蓝图上绘制时，改为绘制对应的强化图形。\n{强化圆形}●：会进行弹跳，伤害更高，但移速减慢。\n{强化三角}▲：踩中后将飞出3个普通{三角}。\n{强化方块}■：反弹碰到的敌方。',
            cooldown: 8,
            charges: 3,
            detailedDescription:
              '在蓝图上绘制时，改为绘制对应的强化图形。\n{强化圆形}●：会进行弹跳，改为造成{30*,固定}伤害，但移速减慢至原来的60%。\n{强化三角}▲：踩中后将飞出3个普通{三角}。\n{强化方块}■：反弹碰到的敌方，第一次反弹0.65秒，其余反弹0.1秒。',
          },
          {
            level: 3,
            description: '提高强化图形持续时间。',
            cooldown: 8,
            charges: 4,
            detailedDescription: '提高强化图形持续时间，方块60秒，圆形20秒，三角15秒。',
          },
        ],
        cancelableAftercast: ['跳跃键', '移动键', '道具键*'],
        cueRange: '本房间可见',
        cancelableSkill: '不可主动打断',
      },
      {
        name: '莱恩的世界',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '莱恩在蓝图中获得减伤和加速。',
            detailedDescription: '莱恩在蓝图中获得20%减伤和15%加速。',
          },
          {
            level: 2,
            description: '莱恩在蓝图中的救援速度提升。',
            detailedDescription: '莱恩在蓝图中的救援速度提升10%。',
          },
          {
            level: 3,
            description: '友方在蓝图内大幅减少技能CD。',
            detailedDescription: '友方在蓝图内技能进入CD时，减少40%该技能CD。',
          },
        ],
      },
    ],
    aliases: ['粉笔鼠'],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '拉到高点放方块使猫上不来，逃离追击。',
      },
      {
        name: '急速翻滚',
        description: '拉开距离，方块阻挡，快速逃跑。',
      },
      {
        name: '绝处逢生',
        description: '猫被变为粉笔猫后无法抓起，可铁血拉远用自起。',
      },
    ],
  },

  /* ----------------------------------- 梦游杰瑞 ----------------------------------- */
  梦游杰瑞: {
    description:
      '杰瑞起初并不知道自己为何总是在奇怪的地方醒来。一天，他在梦中打包火腿时惊醒，而眼前是被毛线绑住的可怜汤姆。这时他才意识到自己似乎患上了严重的梦游症。“不要睡着，太危险了……” 梦游杰瑞一边干嚼咖啡豆。一边不断呢喃着，最终……沉沉地睡去。',
    EnglishName: 'Sleepwalker Jerry',
    mousePositioningTags: [
      {
        tagName: '奶酪',
        level: 4,
        description: '推速高，{香甜梦境}进一步提高自身推速，{毛线球}进一步加快奶酪进度。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 4,
        description: '{毛线球}可拉动道具，利用高尔夫球和毛线球可实现快速破墙。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description: '{毛线球}拉动道具砸入奶酪进度的特性使其克制大部分防守猫。',
        additionalDescription: '最后一块奶酪时请  不  要  和  梦  游  抢  高  尔  夫！！！谢谢！！',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '21(0)[21]2100',
        weaponType: 'weapon1',
        description: '若前期被针对可点{1级被动}，若未被针对则可不点被动。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'C-不屈', 'C-救救我'],
        description: '常规卡组。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-回家', 'C-救救我'],
        description: '常规卡组2。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'A-逃窜', 'C-救救我'],
        description: '新手卡组。也可以用来针对米特。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'C-救救我', 'C-脱身'],
        description: '{脱身}适配{1级被动}，与幸运+脱身的效果类似，适配幸运体系的战术。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '高尔夫球', '冰块', '灰花瓶'],
        description: '',
      },
      { items: ['盘子', '高尔夫球', '隐身饮料', '变身饮料'], description: '墙缝期商店' },
    ],
    skills: [
      {
        name: '香甜梦境',
        type: 'active',
        description:
          '进入梦境，期间提高推速，受到伤害时会在短时间内免疫虚弱并进入强制移动状态，该状态下碰到敌方会造成减速和伤害。[香甜梦境持续期间](未进入强制移动状态前)再次点按本技能键可退出梦境状态。',
        detailedDescription:
          '进入梦境，期间推速增加50%，受到伤害会[在1.9秒内免疫虚弱并以800的速度强制移动](强制移动期间可跳跃和改变移动方向，只能通过部分动作前摇自行取消（例如“进机器鼠”或{绝处逢生}的前摇）。强制移动不会因受到伤害打断，但会被眩晕打断。若在触发受伤但未导致虚弱的伤害导致的强制移动状态期间被攻击至虚弱，则刷新持续时间。若强制移动期间因受力等原因改变速度，则会持续保持该速度，这可能造成自身被“硬控在原地”)，强制移动时每次碰到敌方会对其造成{20*,固定}伤害并降低20%移速，持续1.5秒。[香甜梦境持续期间](未进入强制移动状态前)再次点击技能可在1.25秒前摇后结束梦境，后摇1秒。梦境可持续40秒。\n该技能效果先于{铁血}触发。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        forecast: 1.25,
        aftercast: 1,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 18,
          },
          {
            level: 2,
            description: '释放技能立刻回复大量Hp。梦境期间隐藏自身在小地图上的位置。',
            cooldown: 18,
            detailedDescription:
              '释放技能立刻回复51点Hp。梦境期间隐藏自身在小地图上的位置，且[受到可导致虚弱的伤害时](注意：若在触发受伤但未导致虚弱的伤害导致的强制移动状态期间被攻击至虚弱，则刷新持续时间)，使强制移动的速度增加到1200。',
          },
          {
            level: 3,
            description: '',
            cooldown: 12,
            detailedDescription: '',
          },
        ],
        cooldownTiming: '释放后',
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['道具键*', '跳跃键', '移动键'],
        cueRange: '全图可见',
      },
      {
        name: '毛线球',
        aliases: [],
        type: 'weapon1',
        description:
          '抛出{毛线球(衍生物)}，毛线球伸出{毛线}与自身绑定，毛线随自身移动逐渐拉长，踩到毛线的敌方会受到极少量伤害并被减速。毛线球停留一段时间自动收回，带回碰到的[部分道具](包括奶酪、盘子、高尔夫球、灰花瓶、蓝花瓶、打开的老鼠夹)。被毛线球带回的奶酪碰到空洞口会自动放入；被带回的[其它道具](不包括奶酪和打开的老鼠夹)在[碰到敌方时会直接命中](除高尔夫球以外的道具会直接被碰碎，高尔夫球会持续产生碰撞，直到被毛线强制拉回)，[碰到洞口的奶酪时](除高尔夫球以外的道具会直接被碰碎，高尔夫球会在碰撞后脱离毛线球的控制)会立即增加一定奶酪推入进度。单次携带的道具数量有上限。',
        detailedDescription:
          '[向上方固定角度](约为自身正上方偏后5-15°左右，该角度固定，无法改变，平抛时约落在自身身后600距离)抛出{毛线球(衍生物)}；毛线球伸出{毛线}与自身绑定，[毛线随自身移动逐渐拉长，且会按规律打结](毛线球在落地前会被墙壁及敌方角色反弹，在落地后立刻与梦游杰瑞所在位置形成第一根毛线连接并打结，随后每隔一段时间以最新的打结处与梦游杰瑞实际位置为两端点形成一道连接并打结，然后若新生成的连接与上一个连接之间的夹角接近0°或180°、且上一个连接的连接对象不为毛线球、且上一个连接的长度不等于0，则清除这两道连接之间的打结，重新生成一个更长的连接。毛线球和已打结的部分不会因隐身药水隐藏)，踩到毛线的敌方会受到{2.5*,不受来源影响}伤害并在2.5秒内降低10%移速。毛线球停留4秒后自动收回，带回碰到的[部分道具](包括奶酪、盘子、高尔夫球、灰花瓶、蓝花瓶、打开的老鼠夹)。被毛线球带回的奶酪碰到空洞口会自动放入；被带回的[其它道具](不包括奶酪)在[碰到敌方时会直接命中](除高尔夫球以外的道具会直接被碰碎，高尔夫球会持续产生碰撞，直到被毛线强制拉回)，[碰到洞口的奶酪时](除高尔夫球以外的道具会直接被碰碎，高尔夫球会在碰撞后脱离毛线球的控制)会立即将奶酪推入一部分。单次携带的道具数量有上限。若梦游杰瑞被击倒，则毛线球会立即消失，技能进入CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        forecast: 0.5,
        aftercast: 1.25,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '不可取消',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '道具碰到洞口的奶酪会增加约8.9%的奶酪推入进度。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '毛线球将奶酪拉进洞口时，增加一定奶酪推入进度。',
            detailedDescription: '毛线球将奶酪拉进洞口时，增加25%奶酪推入进度。',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '毛线球单次携带的道具数量提升为3个；大幅提高将奶酪拉进洞口和道具碰撞增加的奶酪推入进度。',
            cooldown: 15,
            detailedDescription:
              '毛线球单次携带的道具数量提升为3个；将奶酪拉进洞口增加的进度提高至约42.5%，道具与奶酪碰撞增加的进度提高至约15.1%。',
          },
        ],
        cueRange: '全图可见',
        cooldownTiming: '释放后',
      },
      {
        name: '梦中乐园',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '共3个效果：\n1.开局120秒内，被绑上火箭后触发[星星棒](星星棒是一次挣扎速度较慢，但挣扎进度充满时直接挣脱的特殊火箭挣扎)，使用后失效。\n2.每次从火箭上被解救时，自动释放香甜梦境（不进入CD）。\n3.受到伤害或即将虚弱时，若剩余Hp小于50%，则自动释放香甜梦境（进入CD且直接进入快速移动效果）。',
            detailedDescription:
              '共3个效果：\n1.对局开始120秒内，第一次被绑上火箭后触发[星星棒](星星棒是一次挣扎速度较慢，但挣扎进度充满时直接挣脱的特殊火箭挣扎。通过该技能获得的星星棒与幸运不同，不会在下火箭时获得护盾效果)，成功触发星星棒或开局120秒后失去此效果。\n2.每次从火箭上被解救时，自动释放香甜梦境（不进入CD）。\n3.受到伤害或即将虚弱时，若剩余Hp小于50%，则自动释放香甜梦境（进入CD且直接进入快速移动效果）。',
          },
          {
            level: 2,
            description:
              '当敌方处于眩晕或虚弱状态时，站在敌方附近并面朝敌方时将会进行嘲笑，回复Hp并减少技能CD。',
            detailedDescription:
              '当敌方处于眩晕或虚弱状态时，[站在距离敌方400的范围内并面朝敌方时将会进行嘲笑](梦游杰瑞移动时不会进行嘲笑，静止不动时面朝眩晕中的敌人自动开始嘲笑，可被移动键、跳跃键及道具键*打断)，动作持续1s，可回复30Hp并减少{主动技能}和{武器技能}CD上限的50%。该效果有10秒CD。',
          },
          {
            level: 3,
            description: '开局120秒后，自身被绑上的火箭的燃烧速度减少20%。',
            detailedDescription: '对局超过120秒后，自身被绑上的火箭的燃烧速度减少20%。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '急速翻滚',
        description: '搭配{毛线球}提高搬奶酪效率。',
      },
      {
        name: '绝处逢生',
        description:
          '{香甜梦境}持续期间受到伤害带来的移速加成可拉开与猫咪的距离，可能可以通过本特技逃脱。',
      },
    ],
  },

  /* ----------------------------------- 鲍姆 ----------------------------------- */
  鲍姆: {
    description:
      '名为鲍姆的小白鼠，是从实验室出逃的实验鼠之一，身上装有强大的炸药，任何小碰撞或摔倒都有可能引发爆炸。因此，他们大多小心翼翼，生怕引发意外。不过，鲍姆与众不同。他性格捉摸不透，脑中充满跳跃的想法，手里拿着能引发小爆炸的羊角锤，乐于为新生活增添一些乐趣。别觉得他的行为奇怪，那都是他从实验室外的老鼠身上学来的。',
    EnglishName: 'Baum',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '主动技能能频繁造成爆炸，干扰敌方或短暂炸毁火箭。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        level: 2,
        description: '主动技能炸毁火箭可救下队友，但救人之后自己难以逃跑。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        level: 2,
        description:
          '2级自爆能持续对道具施加推力，可通过让高尔夫球在墙缝与冲击波之间来回弹射进行破墙。3级自爆也可直接对墙缝造成伤害。',
        additionalDescription: '该操作需要一定的熟练度。',
      },
    ],
    skillAllocations: [
      {
        id: '加点方案1',
        pattern: '122110002',
        weaponType: 'weapon1',
        description: '常规加点，若熟练度不够不建议点三级主动，难以掌握状态变换。',
      },
      {
        id: '加点方案2',
        pattern: '122011002',
        weaponType: 'weapon1',
        description:
          '打苏蕊专用，苏蕊跳舞状态击倒鲍姆后可以触发鲍姆被动，并且即使被绑上火箭仍可爆炸。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'B-孤军奋战', 'C-救救我'],
        description: '常规卡组。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'A-逃窜', 'C-救救我'],
        description: '无畏流派常规卡，新上手鲍姆或对抗米特、图多盖洛等猫咪时可用。',
      } /*
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description: '缴械命中敌方后使用羊角锤击打敌方不会使敌方出刀',
      },*/,
      {
        cards: ['S-舍己', 'S-铁血', 'B-幸运', 'C-救救我'],
        description: '幸运流派卡组。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
        description: '逃之夭夭增加自身与被救队友的逃跑能力，不屈加强残局生存能力。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: 'BOOM!!',
        type: 'active',
        description:
          '进入危险和安全来回切换的不稳定状态，初始为危险状态，每3秒切换一次。\n危险状态：受到伤害会产生爆炸区域，然后退出不稳定状态。爆炸区域持续3秒，对敌方造成2秒{爆炸}状态（会掉落道具和老鼠）；位于该区域的友方会被弹开；位于该区域的{火箭}会被短暂{炸毁}。\n安全状态：移速提高，受到伤害会更快切换至危险状态。',
        detailedDescription:
          '进入危险和安全来回切换的不稳定状态，初始为危险状态，每3秒切换一次。\n危险状态：受到伤害会产生爆炸区域，然后退出不稳定状态。爆炸区域大小为500×500，持续3秒，[进入该区域的敌方](若敌方在此期间反复离开/进入该区域，则每次进入均会触发该效果)受到2秒{爆炸}状态（会掉落道具和老鼠）；位于该区域的友方会以1250/秒的速度被击飞0.1秒；位于该区域的{火箭}会被{炸毁}，12.1秒后恢复。\n安全状态：移速提高20%；受到伤害时，进入下次危险状态的时间缩短当前剩余时间的25%。\n\n爆炸可对离开又再次进入该区域的敌方重新造成控制；爆炸效果会打断队友的技能释放和购买道具进程。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        forecast: 1.1,
        cancelableSkill: ['道具键*'],
        aftercast: 0,
        skillLevels: [
          {
            level: 1,
            description: '不稳定状态持续20秒。',
            cooldown: 22,
          },
          {
            level: 2,
            description:
              '不稳定状态持续时间延长。爆炸区域可[弹开](为单纯的受力效果，与“投掷”不同，不会命中敌方)附近的部分道具。',
            cooldown: 22,
            detailedDescription:
              '不稳定状态持续时间延长至30秒。爆炸区域可[弹开](为单纯的受力效果，与“投掷”不同，不会命中敌方)附近的[部分道具](包括投掷道具，以及拍子/夹子/锤子等，不包括果盘/泡泡机)。',
          },
          {
            level: 3,
            description: '危险和安全状态的切换间隔缩短，爆炸可对墙缝造成伤害。',
            cooldown: 22,
            detailedDescription: '危险和安全状态的切换间隔缩短至2秒，爆炸可对墙缝造成{_7*}伤害。',
          },
        ],
      },
      {
        name: '羊角锤',
        aliases: ['锤子'],
        type: 'weapon1',
        description:
          '本技能可选择对自身或前方释放，通过外置轮盘切换技能状态。\n打自身：对自身造成微量伤害。\n打前方：对范围内敌方造成少量伤害，并使敌方[强制使用爪刀](该效果无视敌方身上的护盾、无敌、缴械等效果；若敌方处于眩晕、虚弱等动作状态期间则不会出刀)。',
        detailedDescription:
          '本技能可选择对自身或前方释放，通过外置轮盘切换技能状态。\n打自身：使自身恢复2Hp,然后对自身造成{1,不受来源影响,固定值,穿透护盾}伤害，可用于触发主动技能的爆炸或加速切换。（前摇0.5秒，后摇0.5秒）\n打前方：对范围内敌方造成少量伤害（与技能等级有关），并使敌方[强制使用爪刀](该效果无视敌方身上的护盾、无敌、缴械等效果；若敌方处于爪刀CD或眩晕、虚弱等动作状态期间则不会出刀)。并降低其30%的伤害能力，持续1.2秒（前摇0.35秒，后摇0.55秒）',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '打前方会对目标造成{10*}伤害。',
            cooldown: 3,
          },
          {
            level: 2,
            description:
              '打自身后，回复Hp并提高Hp上限，提高上限可叠加3层；打前方时，敌方强制爪刀的伤害降低。',
            detailedDescription:
              '打自身额外回复10Hp，随后{Hp上限提高}10（持续10秒，可叠加3层）。（注意：成功提高上限时也会同步回复10Hp；叠加层数达到3层后，再次获得时仅重置时间，不再额外回复Hp）',
            cooldown: 3,
          },
          {
            level: 3,
            description: '打前方造成的伤害提高。',
            cooldown: 3,
            detailedDescription: '打前方改为造成{40*}伤害。',
          },
        ],
      },
      {
        name: '自爆行动',
        type: 'passive',
        description:
          '进入虚弱时可产生倒计时，归零时在所在位置产生爆炸区域（效果等同于与本技能等级相同的主动技能）。每次跳跃均会减少倒计时，成功自爆/被抓起/解除虚弱时结束倒计时。',
        detailedDescription:
          '对本技能进行加点后，鲍姆进入虚弱时，同步进入9.85秒倒计时，倒计时归零时在自身所在位置产生一个爆炸区域，效果只取决于当前被动技能等级（与相应等级的主动技能爆炸区域效果一致）。虚弱期间每次跳跃均会减少0.55秒倒计时，成功自爆/被抓起/解除虚弱时也会结束倒计时但不触发自爆。隐身效果无法隐藏倒计时。',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
          },
          {
            level: 2,
            description: '减少爆炸的初始倒计时。',
            detailedDescription: '爆炸的初始倒计时减为7.05秒。',
          },
          {
            level: 3,
            description: '每次跳跃会减少更多倒计时。',
            detailedDescription: '每次跳跃会减少2秒倒计时。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '提高生存能力。可配合被动技能进一步提高生存能力。',
      },
      {
        name: '魔术漂浮',
        description: '两个技能均可主动中断漂浮，灵活性高。',
      },
    ],
    aliases: ['棍姆'],
  },
  /* ----------------------------------- 朝圣者泰菲 ----------------------------------- */
  朝圣者泰菲: {
    description:
      '特意前来参与感恩节晚宴的小鼠，从朝圣者人偶身上拿走了塑料枪、带上朝圣者帽、在餐桌上嬉戏玩耍，但眼睛却紧盯着那热气腾腾的美味烤鸡。',
    EnglishName: 'Pilgrim Tuffy',
    mousePositioningTags: [
      {
        tagName: '干扰',
        level: 4,
        description: '武器技能搭配一级被动可提供高伤害，且打出的子弹若未命中敌方可以长时间回弹。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        level: 4,
        description: '本身全鼠方基础推速第四，可作为副奶酪位甚至主奶酪位。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        level: 4,
        description:
          '武器技能可对猫造成较高伤害，主动技能可以吃掉插在地上的叉子，两技能均可对墙缝造成伤害。可在较大程度上抑制防守猫。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '12020011-2',
        weaponType: 'weapon1',
        description:
          '常规加点，武器技能三级对墙缝造成伤害较低，用来攻击敌方收益更大，酌情考虑是否加点。',
      },
      {
        id: '特殊加点1',
        pattern: '120(1)20021',
        weaponType: 'weapon1',
        description: '对面为防守型猫且地图中夹子较多时酌情考虑提前点出2级主动技能清理捕鼠夹。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '常规卡组，武器技能发射的子弹可以继承绝地反击的增伤效果，可打出较高伤害。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'A-逃窜', 'C-救救我'],
        description: '打米特，图多盖洛时可带。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'B-绝地反击', 'C-救救我', 'C-不屈'],
        description: '无畏卡组，与第二套卡组作用相似。',
      },
    ],
    recommendedStorePlans: [
      {
        items: ['盘子', '冰块', '灰花瓶', '隐身饮料'],
        description: '兼顾干扰、控制与救援。',
      },
    ],
    skills: [
      {
        name: '丰收盛宴',
        type: 'active',
        description:
          '尝试吃掉一个道具，成功吃掉则获得加速、减少武器技能大量CD、同时增加一格饱食度。饱食度积累到两层时，立即变身为{巨大泰菲球}。\n巨大泰菲球：变身时恢复大量Hp但掉落手持道具，随后免疫部分控制且获得{减伤}，但无法进行部分交互。可用较慢的速度救援，可使用技能撞击敌方，造成伤害、减速并恢复自身Hp，短时间命中三次会额外造成{眩晕}。变身时间耗尽或Hp归零时解除变身。',
        detailedDescription:
          '[尝试吃掉面前长200高150范围内的一个道具](优先选择范围内更靠近右侧的道具，可吃掉处于被投掷状态期间的道具)，若成功吃掉一个道具则获得3秒15％加速、减少武器技能30秒CD、同时增加一格饱食度。饱食度积累到两层时，立即变身为{巨大泰菲球}。\n巨大泰菲球：变身时立即恢复150Hp但掉落手持道具。变身期间移速提高15%并获得额外技能，仅可进行[部分交互](仅可进行“进行火箭救援”，“开木门”，“关木门”，“逃走”，“开金洞”，“使用普通管道”，“使用庭院-阁楼管道”，“开暖气片”，“关暖气片”，“使用站牌”，“使用装饰树大作战的烟囱管道”交互)，且救援队友的速度降低50%。变身期间[免疫部分负面状态](免疫打开的老鼠夹；受到伤害及眩晕等状态时会播放“炸毛”动画，该动画可被绝大多数操作取消，不影响行动；变身期间免疫虚弱，但由于Hp归零会导致解除变身，因此实际上仅能在Hp归零前免疫一次会导致虚弱的伤害)，并且{减伤}30%。变身持续20秒，时间耗尽或Hp归零时解除该状态。进入和解除该状态时有特殊动画（因Hp归零而解除该状态时除外）。\n巨大泰菲球-攻击：朝圣者泰菲使用额头向前撞击，撞击范围为300单位距离，命中敌方时恢复自身Hp并对敌方造成{30*}伤害和2.5秒10％减速状态，敌方处于撞击造成的减速效果期间被连续撞击三次会进入眩晕状态，持续1.5秒。撞击可对墙缝造成{_2.5*}伤害。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription:
              '圆球状态命中敌方恢复10Hp。初始可吃掉{盘子}、{扁盘}、{碗}、{玻璃杯}、{小鞭炮}、{鞭炮束}、{冰块}、{高尔夫球}、{叉子}（包括插在其它物体上的叉子）、{香水瓶}、{胡椒瓶}、{番茄}、{灰花瓶}、{蓝花瓶}。',
            cooldown: 10,
          },
          {
            level: 2,
            description: '可吃掉的道具增多，并且可吃掉部分猫技能衍生物。',
            detailedDescription:
              '新增可吃掉{小纸盒}、{大纸盒}、{拳套盒}、{老鼠夹}（不包括{打开的老鼠夹}）、{面粉袋}、由易碎道具产生的{碎片}、{旋转桶盖(衍生物)}、{泡泡}、{香水区域}、{汽水罐(衍生物)}、{饭盒}、{瑜伽球(衍生物)}、{巨型胡萝卜}。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '圆球状态命中敌方恢复的Hp增多。',
            detailedDescription: '圆球状态命中敌方恢复的Hp增加至25。',
            cooldown: 10,
          },
        ],
        cueRange: '全图可见',
        forecast: 0.5,
        aftercast: 1,
        cancelableAftercast: ['移动键', '跳跃键', '道具键*'],
      },
      {
        name: '玩具长长长枪',
        aliases: [],
        type: 'weapon1',
        description:
          '使用技能时先进入瞄准状态，可通过轮盘操作{枪头}。瞄准时再次使用技能则消耗技能存储次数并从枪头处发射一枚{木塞子}，可通过跳跃结束瞄准。\n枪头：朝圣者泰菲瞄准时可操作枪头向前延长及转向，枪头被猫咪爪刀命中时会对朝圣者泰菲造成伤害。\n木塞子：被发射后在房间内反弹直至存在时间结束，命中敌方造成伤害和减速，命中头部则造成更高伤害并额外补充1发(内置10秒CD)、但目标2秒内免疫其它木塞子效果。木塞子从下方或侧方命中平台时也会被反弹。',
        detailedDescription:
          '使用技能时不消耗存储次数并进入瞄准状态，切换至轮盘移动键，可通过[轮盘操作](可8向延长枪管，轮盘灵敏度影响方向选择灵活性，灵敏度越低越容易水平/竖直延长枪管。当灵敏度最高时，无法水平/竖直延长枪管){枪头}。瞄准期间再次使用技能则消耗技能存储次数并从枪头处发射一枚{木塞子}。瞄准期间进行跳跃、受到伤害、自身位置改变、技能存储次数耗尽时会结束瞄准。\n\n$枪头$font-bold#：朝圣者泰菲瞄准时可操作枪头向前延长及转向。枪头移速790单位长/秒，枪管变向角速度为210°/秒，可累计运动至多5秒。枪头被猫咪爪刀命中时会对朝圣者泰菲造成伤害并强制缩回。枪头每次发射木塞子具有0.1秒延迟，发射最后一颗子弹0.6秒后强制缩回枪头。\n$木塞子$font-bold#：被发射后在房间内反弹直至存在时间结束，命中敌方造成{35*}伤害并附加2秒的30%减速，[命中头部](指命中位置高于目标碰撞箱高度的65%)则改为造成{100*}伤害，但目标2秒内免疫其它木塞子效果。木塞子从下方或侧方命中平台时也会被反弹。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        cueRange: '随距离远近变化',
        skillLevels: [
          {
            level: 1,
            description: '木塞子最长存在20秒。',
            detailedDescription: '木塞子飞行速度为1500单位长度/秒，最长存在20秒。',
            cooldown: 12,
            charges: 4,
          },
          {
            level: 2,
            description: '木塞子命中猫咪头部后，额外对敌方造成持续伤害。',
            detailedDescription:
              '木塞子命中[敌方猫咪](对敌方老鼠无该效果)头部后为其附加7.5Hp/秒的持续伤害状态，持续3秒。',
            cooldown: 12,
            charges: 4,
          },
          {
            level: 3,
            description: '木塞子速度提升，最长存在时间延长至30秒，可命中墙缝。',
            detailedDescription:
              '木塞子飞行速度提升至1800单位长度/秒，最长存在时间延长至30秒，可命中墙缝并对其造成{_3*}伤害。',
            cooldown: 12,
            charges: 4,
          },
        ],
        cooldownTiming: '释放后',
        forecast: 0.95,
        aftercast: 0,
      },
      {
        name: '朝圣瞭望',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '随与敌方距离逐渐增大，朝圣者泰菲对敌方造成的伤害将增加。',
            detailedDescription:
              '对敌方造成伤害时，自身与敌方每距离32单位长，就增加2%伤害，最多增加20%。',
          },
          {
            level: 2,
            description: '站立不动2秒后，视野扩大（同类效果不叠加），移动时解除。',
            detailedDescription:
              '自身位置不变2秒后，视野扩大33%，移动时视野扩大状态在0.5秒后解除。\n（该状态会因由远视饮料等途径提供的远视而被清除或免疫）',
          },
          {
            level: 3,
            description: '站立不动2秒后，下次移动会短暂提升移动速度和跳跃高度。',
            detailedDescription:
              '自身位置不变2秒后，下次移动时获得以下状态：移速提高15%，跳跃能力提高30%，持续3秒。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '绝处逢生',
        description: '通用特技。',
      },
    ],
    aliases: ['朝菲', '圣菲'],
  },
  /* ----------------------------------- 巴特 ----------------------------------- */
  巴特: {
    description:
      '生活在神秘古堡里的小蝙蝠巴特，活泼好动，骨子里藏着一点小邪恶，一直渴望交到朋友。他喜欢玩模仿游戏，能灵活操控蛛丝，展开翅膀便可自由飞翔。自从汤姆和杰瑞误入古堡，他的世界终于有了色彩，于是跟随他们踏上了前往猫鼠之家的旅程。',
    aliases: ['蝙蝠'],
    mousePositioningTags: [
      {
        level: 3,
        tagName: '救援',
        description: '巴特机动性强，配合蛛丝可以实现远程救援，猫咪难以阻止。',
        additionalDescription: '',
      },
      {
        level: 2,
        tagName: '后期',
        description: '巴特速度很快且非常灵活，后期猫咪很难追上他。',
        additionalDescription: '新增标签介绍',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点',
        pattern: '12(1)0(1)2200',
        weaponType: 'weapon1',
        description: '主动技能升级可以补满使用次数，请在需要使用时再进行加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-无畏', 'S-铁血', 'B-逃之夭夭', 'C-救救我'],
        description: '适合初学者。救援较为稳定，但队友很可能无法逃脱。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-护佑', 'C-救救我'],
        description: '适合有一定基础的玩家。被救下的队友相对安全。',
      },
    ],
    skills: [
      {
        name: '立体机动',
        type: 'active',
        description:
          '拖动机能施展立体机动穿梭，穿梭期间免疫控制，穿梭结束后可短暂停留在空中或者倒挂在平台上。',
        detailedDescription:
          '拖动技能选择半径480范围内的指定位置，松开按键以该位置为终点施展$立体机动穿梭$text-blue-700 dark:text-blue-300 font-bold#，穿梭结束后：若处于空中，则$浮空$text-blue-700 dark:text-blue-300 font-bold#3秒；若自身位置上方有可悬挂平台，则改为永久$倒挂$text-blue-700 dark:text-blue-300 font-bold#在平台上。\n若因平台阻挡等原因而未能进行立体机动穿梭，则不会消耗使用次数。\n\n$立体机动穿梭$text-blue-700 dark:text-blue-300 font-bold#：向指定位置以960/秒的速度进行移动，期间免疫状态且不受重力影响。无法穿越部分平台、墙壁及障碍物。若手中持有{叉子}/{番茄}/{玩具枪}，则会原地掉落。\n$浮空/倒挂$text-blue-700 dark:text-blue-300 font-bold#：不受重力影响，可正常投掷道具、使用技能、进行[部分交互](包括但不限于救援队友、使用望远镜/消防栓等；不包括推奶酪、开/关冰箱等)等。可通过跳跃解除该状态。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可主动打断',
        skillLevels: [
          {
            level: 1,
            charges: 8,
            description: '',
            detailedDescription: '',
            cooldown: 50,
          },
          {
            level: 2,
            charges: 8,
            description: '提升悬空时间。补满本技能使用次数。',
            detailedDescription: '提升浮空时间到5秒。升级时立即补充本技能8次可使用次数。',
            cooldown: 50,
          },
          {
            level: 3,
            charges: 8,
            description: '提升最大穿梭距离。补满本技能使用次数。',
            detailedDescription:
              '穿梭的最大距离提升至[640](此处游戏内原文为“提升25%”，与实际情况有偏差)。升级时立即补充本技能8次可使用次数。',
            cooldown: 30,
          },
        ],
        forecast: 0,
        aftercast: 0,

        cooldownTiming: '前摇前',
      },
      {
        name: '蝙蝠与蛛丝',
        type: 'weapon1',
        description:
          '向下放出{小蜘蛛}，当碰到绑有队友的火箭时，小蜘蛛将缠绕形成{蛛丝茧}，绑回火箭上的队友，但队友需要挣扎破茧才能离开。',
        detailedDescription:
          '以蛛丝作连接，向自身正下方放出{小蜘蛛}，释放期间自身视野扩大22%。\n小蜘蛛将以960/秒的速度向下运动，最长运动距离1216，不与平台碰撞，在碰撞到地面或障碍物后提前收回；向下运动期间碰到绑有队友的火箭时，将缠绕形成{蛛丝茧}，茧内的队友将恢复35Hp，同时拉回巴特此时所处位置，但会被包入茧内，需要挣扎3.5秒破茧才能离开。蛛丝茧在受到2次投掷道具或猫的爪击攻击时破坏。\n可在立体机动$浮空/倒挂$text-blue-700 dark:text-blue-300 font-bold#时使用；浮空时， 本技能施放期间将暂停浮空剩余时间倒计时；倒挂时，将向上放出小蜘蛛。\n小蜘蛛救援可以继承巴特携带的知识卡（{无畏}、{舍己}等）。\n释放期间巴特无法主动移动（浮空/倒挂时可通过跳跃中止）；若巴特释放技能后通过其它方式出现了位移，则小蜘蛛会同步移动。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可主动打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '小蜘蛛没有碰到绑在火箭上的队友时，将返还冷却时间。',
            detailedDescription:
              '小蜘蛛因没有碰到绑在火箭上的队友而开始收回时，本技能剩余冷却时间降低75%。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '小蜘蛛的运动速度大幅提升。',
            detailedDescription:
              '小蜘蛛的向下和拉回的运动速度提升至[1600/秒](此处游戏内原文为“提升60%”，与实际情况有偏差)。',
            cooldown: 30,
          },
        ],
        cooldownTiming: '前摇前',
        forecast: 0,
        aftercast: 0,
      },
      {
        name: '动静结合',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '提高空中时的交互速度和健康值恢复速度，在浮空和倒挂状态下虚弱时，将自动进行3次立体机动后再进入虚弱。',
            detailedDescription:
              '[空中](包括角色起跳后的滞空，以及巴特使用主动技能后的浮空/倒挂等)时的交互速度提高50%，Hp恢复速度提高3点/秒，在浮空和倒挂状态下虚弱时，将[自动进行3次$立体机动穿梭$text-blue-700 dark:text-blue-300 font-bold#](方向在一定范围内随机，效果与当前主动技能等级相关)后再进入虚弱。',
          },
          {
            level: 2,
            description: '大幅提高浮空时的交互速度。',
            detailedDescription:
              '[空中](包括角色起跳后的滞空，以及巴特使用主动技能后的浮空/倒挂等)时的交互速度改为提高100%。',
          },
          {
            level: 3,
            description: '在浮空和倒挂状态下虚弱时，改为自动进行5次立体机动后再进入虚弱。',
            detailedDescription:
              '在浮空和倒挂状态下虚弱时，改为[自动进行5次$立体机动穿梭$text-blue-700 dark:text-blue-300 font-bold#](方向在一定范围内随机，效果与当前主动技能等级相关)后再进入虚弱。',
          },
        ],
      },
    ],

    specialSkills: [
      {
        name: '魔术漂浮',
        description: '浮空时使用魔术漂浮可持续向斜上方位移，用于配合小蜘蛛救援、逃跑或赶路。',
      },
      {
        name: '急速翻滚',
        description: '浮空时使用急速翻滚可持续向水平方向位移，用于配合小蜘蛛救援、逃跑或赶路。',
      },
      {
        name: '冰冻保鲜',
        description: '通用特技。',
      },
      {
        name: '魔术漂浮',
        description: '通用特技。',
      },
    ],

    counterTags: ['拉扯'],

    recommendedStorePlans: [
      {
        items: ['高尔夫球', '冰块', '香水瓶', '胡椒瓶'],
        description: '高尔夫配合 蝙蝠与蛛丝能秒破茧',
      },
    ],

    characterRelationOverrides: {
      雪梨: {
        kind: 'collaborators',
        isMinor: true,
        description: '2武器可使巴特快速位移或救人',
      },

      莱特宁: {
        kind: 'counteredBy',
        isMinor: false,
        description: '莱特宁的强机动性克制巴特的立体机动。',
      },
    },
  },
} as const satisfies Readonly<Record<string, CharacterDefinition>>;

// Process character definitions to assign IDs and process skills
const mouseCharacters = processCharacters(mouseCharacterDefinitions, 'mouse');

// Generate character image URLs in bulk
const pristineMouseCharactersWithImages = Object.fromEntries(
  Object.entries(mouseCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      imageUrl: AssetManager.getCharacterImageUrl(characterId, 'mouse'),
      skills: AssetManager.addSkillImageUrls(characterId, character.skills, 'mouse'),
    },
  ])
);

export function createMouseCharactersWithImages() {
  return structuredClone(pristineMouseCharactersWithImages);
}

export const mouseCharactersWithImages = createMouseCharactersWithImages();
