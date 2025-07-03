import { addSkillImageUrls } from '../lib/skillUtils';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition } from './types';

// Generate image URL based on character ID
export const getMouseImageUrl = (characterId: string): string => {
  return `/images/mice/${characterId}.png`;
};

const mouseCharacterDefinitions: Record<string, CharacterDefinition> = {
  /* ----------------------------------- 杰瑞 ----------------------------------- */
  杰瑞: {
    description: '古灵精怪的小老鼠，喜欢戏弄汤姆，汤姆的欢喜冤家',

    maxHp: 99,
    attackBoost: 15,
    hpRecovery: 2,
    moveSpeed: 650,
    jumpHeight: 400,
    cheesePushSpeed: 4,
    wallCrackDamageBoost: 1,

    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '推速快。',
        additionalDescription: '此外还有被动提供推速加成和搬奶酪速度。',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '鼓舞为队友提供增益、处理二手火箭；鸟哨限制猫的走位。',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '大铁锤',
        pattern: '0[12]112200',
        weaponType: 'weapon1',
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先二被。',
        additionaldescription: '',
      },
      {
        id: '鸟哨',
        pattern: '0[13]113300',
        weaponType: 'weapon2',
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先二被。',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '有救援卡，逃窜适合打击晕猫',
      },
      {
        cards: ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
        description: '无救援卡，需要及时与队友沟通，避免无救援卡救援。',
      },
    ],

    skills: [
      {
        name: '鼓舞',
        type: 'active',
        description: '短暂为自己和附近队友提供增益。',
        // detailedDescription: '短暂为自己和附近队友提供增益。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=66.5',
        skillLevels: [
          {
            level: 1,
            description: '鼓舞增加移速和跳跃高度。',
            detailedDescription: '鼓舞增加15%移速和45%跳跃高度，持续5秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '鼓舞额外回复25Hp。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '鼓舞额外解除受伤状态，并延长附近绑有老鼠的火箭10秒燃烧时间。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '大铁锤',
        type: 'weapon1',
        description: '举起大铁锤近身攻击。',
        // detailedDescription: '举起大铁锤近身攻击。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '不可取消后摇',
        canHitInPipe: true,
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=104.4',
        skillLevels: [
          {
            level: 1,
            description: '眩晕猫咪3秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '额外造成65伤害；每次命中永久增加10%推速，最多叠五层。',
            cooldown: 16,
          },
          {
            level: 3,
            description: '眩晕时间延长至4秒。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '鸟哨',
        type: 'weapon2',
        description: '召唤投掷炸弹的金丝雀。',
        detailedDescription:
          '召唤投掷炸弹的金丝雀。同一房间内最多只能有一只投掷炸弹的金丝雀。猫咪被金丝雀的炸弹命中后将对其短暂免疫。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断',
        cancelableAftercast: '可被道具键*取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=125.5',
        skillLevels: [
          {
            level: 1,
            description: '炸弹造成55伤害和2秒眩晕。',
            detailedDescription: '炸弹造成55伤害和2秒眩晕；总共释放约15个炸弹。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '提高金丝雀投掷炸弹的频率。',
            detailedDescription: '提高金丝雀投掷炸弹的频率，炸弹数量提升到约17个。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '减少CD；进一步提高金丝雀投掷炸弹的频率。',
            detailedDescription: '减少CD；进一步提高金丝雀投掷炸弹的频率，炸弹数量提升到约20个。',
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
            description: '增加推速。',
            detailedDescription: '增加20%推速',
          },
          {
            level: 2,
            description: '搬奶酪时，增加移速和跳跃高度。',
            detailedDescription: '搬奶酪时，移速增加52%、跳跃高度增加25%。',
          },
          {
            level: 3,
            description: '奶酪被推完或墙缝被破坏到一定程度时，解除虚弱和受伤，并回复少量Hp。',
            detailedDescription:
              '奶酪被推完或墙缝被破坏到80%、60%、40%、20%、0%时，解除虚弱和受伤、回复20Hp、并获得2.7秒的13%加速。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 侦探杰瑞 ----------------------------------- */
  侦探杰瑞: {
    description:
      '谨慎机警的侦探杰瑞，来自19世纪末的英国，为了更快地抓到凶手，他极善于隐藏自己的踪迹。',

    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 1.67,
    moveSpeed: 640,
    jumpHeight: 380,
    cheesePushSpeed: 4.6,
    wallCrackDamageBoost: 0.5,

    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '拥有鼠方全角色第一的基础推速。',
        additionalDescription: '烟雾弹能进一步提高推速。',
      },
      {
        tagName: '破局',
        isMinor: true,
        description:
          '烟雾弹的沉默和巨额推速加成能使鼠方快速推完最后一块奶酪，克制大多数守奶酪的猫咪。',
        additionalDescription:
          '墙缝期时，烟雾弹也有着很强的干扰能力，尤其是阻止猫咪修墙。长时间的隐身也为烟雾弹的释放提供了保障。',
      },
    ],

    skillAllocations: [
      {
        id: '烟雾弹',
        pattern: '12[12]21000',
        weaponType: 'weapon1',
        description: '四级一般点二级隐身；如果需要团推且猫不在附近，可先点二级烟雾弹。',
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
      ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
    ],

    skills: [
      {
        name: '隐身',
        type: 'active',
        description: '进入隐身状态，期间移速提升。',
        detailedDescription: '进入隐身状态，期间移速提升15%。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可打断', // 前摇1.9s
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '隐身状态中使用道具或交互会显形。',
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
            description: '隐身持续更久；期间持续恢复Hp。',
            detailedDescription: '隐身持续15秒；期间额外以1.67/s恢复Hp。', //FIXME: not sure about the recovery rate
            cooldown: 20,
          },
        ],
      },
      {
        name: '烟雾弹',
        type: 'weapon1',
        description: '引爆烟雾弹遮挡猫的视野。在烟雾中猫咪无法查看小地图。',
        detailedDescription:
          '引爆烟雾弹遮挡猫的视野。在烟雾中猫咪无法查看小地图，此效果可以被一层护盾抵消。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可打断', // 前摇0.5s，后摇1.5s，引爆的前0.7s技能贴图由完全不透明淡化至半透明状态。烟雾弹持续4.8s，随后播放0.5s的消失动画
        cancelableAftercast: '不可取消',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '烟雾持续4.8秒。', // FIXME: not sure about the duration
            cooldown: 35,
          },
          {
            level: 2,
            description: '老鼠在烟雾范围内提升移速、跳跃高度和推速。',
            detailedDescription:
              '老鼠在烟雾范围内移速提升20%，跳跃高度提升50%，推速固定提升5.75%/s。',
            cooldown: 35,
          },
          {
            level: 3,
            description:
              '烟雾持续时间增加，猫在烟雾范围内会降低移速、跳跃高度和攻击频率，且无法使用技能和道具。',
            detailedDescription:
              '烟雾持续时间增加至6.5秒，猫在烟雾范围内移速降低20%、跳跃高度降低20%且爪刀CD延长50%，且无法使用技能和道具。',
            cooldown: 35,
          },
        ],
      },
      {
        name: '视觉干扰器',
        type: 'weapon2',
        description: '投掷干扰器，落地后对范围内的老鼠施加短暂的隐身效果。',
        detailedDescription:
          '以道具形式投掷干扰器，落地或碰到墙壁后对范围内的老鼠施加3.5秒隐身效果。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被打断', // FIXME: supplement this 投掷前摇0.3s；技能触发后持续存在1s。
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '除移动和跳跃外的交互行为将移除该隐身效果。',
            detailedDescription:
              '除移动和跳跃外的交互行为将移除该隐身效果。干扰器在技能触发后会持续存在1秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description:
              '交互行为不会取消隐身效果，持续期间解除并免疫道具香水效果、图多盖洛香水效果、胡椒粉烟雾效果。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '持续时间内大幅提高移速。',
            detailedDescription: '持续时间内移速提高20%。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '胆小如鼠',
        type: 'passive',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=36.3',
        skillLevels: [
          {
            level: 1,
            description: '每隔一段时间，在小地图上感知猫的位置。',
            detailedDescription:
              '每隔45秒，在小地图上感知猫的位置，持续3秒。升级该技能时直接进入冷却，不触发效果。',
          },
          {
            level: 2,
            description: '搬运奶酪时，不会被猫咪在小地图上察觉。',
          },
          {
            level: 3,
            description: '附近有猫咪时，移速和跳跃高度提升，但推速下降。',
            detailedDescription:
              '附近有猫咪时，侦探杰瑞只顾着逃命而无心推奶酪，移速和跳跃高度提升10%，但推速下降30%。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 航海士杰瑞 ----------------------------------- */
  航海士杰瑞: {
    description:
      '公海上向往自由的航海士杰瑞，是最强大的航海家，他浑身充满野性，常年与火炮打交道的他，善于破坏火箭。',

    maxHp: 99,
    attackBoost: 20,
    hpRecovery: 1.67,
    moveSpeed: 640,
    jumpHeight: 380,
    cheesePushSpeed: 2.6,
    wallCrackDamageBoost: 1.5,

    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '金币和火药桶能有效拦截猫咪上火箭、抓队友。',
        additionalDescription: '火炮也能连控猫咪，一被的减速配合知识卡投手可以让很多猫追不上老鼠。',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '拥有高额的基础破墙数值，三被进一步增强破墙能力。',
        additionalDescription: '火药桶也能对墙缝造成巨大破坏。',
      },
      {
        tagName: '救援',
        isMinor: true,
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
    ],

    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-飞跃', 'B-绝地反击', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
    ],

    skills: [
      {
        name: '飞翔金币',
        type: 'active',
        description: '拿出一枚能对猫咪造成眩晕的金币，金币能穿过大部分平台。',
        detailedDescription:
          '拿出一枚能对猫咪造成眩晕的金币，金币能穿过大部分平台，对猫造成2秒眩晕。金币击中后会使猫咪短暂进入“金币免疫”状态，金币无法对此状态下的猫咪造成效果。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '无后摇',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=10.6',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '金币对猫咪造成2次伤害和控制效果。',
            detailedDescription:
              '金币对猫咪造成2次伤害和控制效果，每次效果55点伤害（增伤后），实际总共99点伤害；但最多破一层盾。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '火药桶',
        type: 'weapon1',
        description:
          '放置一个能破坏火箭、墙缝的火药桶，火药桶爆炸后会破坏附近的火箭，并对周围角色造成伤害和眩晕。猫咪在绑老鼠前需要先修复火箭。火药桶可以被鞭炮炸飞。',
        detailedDescription:
          '放置一个能破坏火箭、墙缝的火药桶，火药桶爆炸后会破坏附近的火箭，并对周围角色造成伤害和眩晕。猫咪可以拆除火药桶，耗时1秒；老鼠可以推动火药桶。火药桶被打击后会引线时长会减少5秒。猫咪在绑老鼠前需要先修复火箭。航海士杰瑞破坏绑有队友的火箭后会救下队友（能触发无畏、舍己）。火药桶可以被鞭炮炸飞，在火药桶左侧的鞭炮会使火药桶呈抛物线飞出，右侧的鞭炮会使火药桶水平滑行。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '无后摇',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=50.7',
        skillLevels: [
          {
            level: 1,
            description: '放置一个火药桶，火箭在被破坏一段时间后自动修复。',
            detailedDescription:
              '放置一个火药桶，引线时长为8秒，爆炸时破坏火箭，对墙缝造成20+1.5伤害，对附近的猫和老鼠造成21点伤害与1.4秒眩晕，火箭在被破坏65秒后自动恢复。',
            cooldown: 45,
          },
          {
            level: 2,
            description: '提升伤害和爆炸范围；减少CD。',
            detailedDescription: '提升爆炸范围；伤害提升至45点；减少CD。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '火药桶引线减短，破坏的火箭无法自动恢复，威力增强。',
            detailedDescription:
              '火药桶引线时长减短至3秒，破坏的火箭无法自动恢复，伤害提升至70点。',
            cooldown: 30,
          },
        ],
      },
      {
        name: '舰艇火炮',
        type: 'weapon2',
        description:
          '放置一个舰艇火炮，老鼠可以进入火炮，控制方向发射并对碰到的猫咪造成伤害与眩晕，火炮内免疫投掷物。',
        detailedDescription:
          '放置一个舰艇火炮，老鼠可以进入火炮，控制方向发射并对碰到的猫咪造成50点伤害与1.5秒眩晕，火炮内免疫投掷物。火炮内老鼠进入虚弱后火炮会提前消失。同一房间最多出现两个火炮。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断', // FIXME: not sure
        cancelableAftercast: '不可取消后摇', // FIXME: not sure
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=50.7',
        skillLevels: [
          {
            level: 1,
            description: '放置一个火炮。',
            detailedDescription: '放置一个火炮，火炮持续15秒。',
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
            description: '减少CD。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '无坚不摧',
        type: 'passive',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=36.3',
        skillLevels: [
          {
            level: 1,
            description: '道具击中猫咪后，使猫咪受到短暂的减速。',
            detailedDescription: '道具击中猫咪后，使猫咪受到20%减速，持续3.5秒。',
          },
          {
            level: 2,
            description: '挣扎速度变快，挣脱后获得短暂的护盾和加速效果。',
            detailedDescription:
              '挣扎速度提升50%，挣扎时间变为13.33秒；挣脱后获得4.75秒的护盾，护盾期间移速增加15%。',
          },
          {
            level: 3,
            description: '提高墙缝增伤。',
            detailedDescription: '提高墙缝增伤1.3，即墙缝增伤变为2.8。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 泰菲 ----------------------------------- */
  泰菲: {
    description: '杰瑞的侄子，总将自己吃得圆滚滚的',

    maxHp: 74,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 630,
    jumpHeight: 380,
    cheesePushSpeed: 3.8,
    wallCrackDamageBoost: 0.5,

    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '推速较快。',
        additionalDescription: '有点矮子里面拔高个的意味，毕竟两个技能都跟奶酪没关系。',
      },
      {
        tagName: '破局',
        isMinor: true,
        description: '火箭筒能炸开夹子和叉子。',
        additionalDescription: '缺点是CD长，并且需要把控角度。',
      },
      {
        tagName: '砸墙',
        isMinor: true,
        description: '武器技能可以提供可观的砸墙伤害；三被能免疫鞭炮和泡泡。',
        additionalDescription: '',
      },
    ],

    skillAllocations: [
      {
        id: '火箭筒',
        pattern: '121220001',
        weaponType: 'weapon1',
        description: '',
        additionaldescription:
          '如果七级就进入墙缝战的话，可以考虑直接点出三级圆滚滚，毕竟一被和二被几乎没用。',
      },
      {
        id: '隐形感应雷',
        pattern: '131330001',
        weaponType: 'weapon2',
        description:
          '如果七级就进入墙缝战的话，可以考虑直接点出三级圆滚滚，毕竟一被和二被几乎没用。',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-精准投射', 'B-绝地反击', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
    ],

    skills: [
      {
        name: '圆滚滚',
        type: 'active',
        description: '向前翻滚一段距离。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1fM411A7YF?t=11.15',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '向前翻滚1.1秒；期间速度提升70%。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '滚动时处于无敌状态；滚动结束后短暂提升跳跃高度。',
            detailedDescription: '滚动时处于无敌状态；滚动结束后极短暂地提升跳跃高度。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '滚得更快更远。',
            detailedDescription: '翻滚时间提升至1.4秒；期间速度提升增加至105%。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '火箭筒',
        type: 'weapon1',
        description: '发射一枚弹头，造成伤害和眩晕。',
        // detailedDescription: '发射一枚弹头。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1fM411A7YF?t=46.4',
        skillLevels: [
          {
            level: 1,
            description: '眩晕猫咪1.5秒。',
            detailedDescription:
              '造成两段伤害（碰撞50+爆炸15），两段伤害都继承绝地反击等角色状态；眩晕猫咪1.5秒。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '增加伤害；眩晕时间提升至2.1秒。',
            detailedDescription: '第二段爆炸伤害提升至30；眩晕时间提升至2.1秒。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '可以储存两发弹头。',
            cooldown: 30,
          },
        ],
      },
      {
        name: '隐形感应雷',
        type: 'weapon2',
        description:
          '放下隐形感应雷。感应雷在猫咪靠近时现身，并在1.5秒后飞向猫咪并爆炸，造成伤害和控制。',
        detailedDescription:
          '放下隐形感应雷。雷在猫咪靠近时现身，并在1.5秒后飞向猫咪并爆炸，造成50伤害、1.9秒控制和击退（对墙缝伤害为10）。爆炸也会弹飞老鼠，但不造成伤害。隐身状态的猫咪不会触发雷。雷被道具攻击后会在一段时间后原地爆炸。雷会在30秒后自然消失。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1fM411A7YF?t=73.05',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 22,
          },
          {
            level: 2,
            description: '可以存储两发感应雷；雷使猫掉落手中的老鼠和道具。',
            // detailedDescription: '可以存储两发感应雷；雷使猫掉落手中的老鼠和道具。',
            cooldown: 22,
          },
          {
            level: 3,
            description: '提高雷对猫咪和墙缝的伤害。',
            detailedDescription: '雷对猫咪的伤害提高至80；对墙缝的伤害提高至15。',
            cooldown: 22,
          },
        ],
      },
      {
        name: '茁壮成长',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1fM411A7YF?t=25.85',
        skillLevels: [
          {
            level: 1,
            description: '牛奶加速生效期间，暂时提升25点Hp上限。',
          },
          {
            level: 2,
            description: 'Hp恢复提升（受伤状态也触发）；吃食物更快。',
            detailedDescription: 'Hp恢复提升2.5（受伤状态也触发）；吃食物速度提升20%。',
          },
          {
            level: 3,
            description: '免疫爆炸；Hp恢复进一步提升；吃食物进一步更快。',
            detailedDescription:
              '免疫鞭炮、泡泡等爆炸；Hp恢复提升增加至5；吃食物速度提升增加至45%。',
          },
        ],
      },
    ],
  },

  /* ---------------------------------- 剑客莉莉 ---------------------------------- */
  剑客莉莉: {
    description:
      '来自法国第一女剑客莉莉，她的剑招低调不失气势，华丽而不失潇洒，她是坏人们最害怕的敌人。',
    maxHp: 124,
    attackBoost: 20,
    hpRecovery: 1,
    moveSpeed: 645,
    jumpHeight: 380,
    cheesePushSpeed: 2.6,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '二级被动无敌，配合剑气无伤救援。',
        additionalDescription: '稳救不稳走，依赖隐身；被托普斯的捕虫网和各种强制位移技能克制。',
      },
      {
        tagName: '干扰',
        isMinor: true,
        description: '风墙关键时刻可以救队友，剑气高减速。',
        additionalDescription: '',
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
      ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
    ],
    skills: [
      {
        name: '御风剑舞',
        type: 'active',
        description: '创造一道风墙，短暂阻挡敌方。',
        detailedDescription:
          '创造一道风墙阻挡敌方，前摇0.5s。风墙大小500*500，持续3s。风墙对所有角色造成判定干扰，如猫的爪刀、拍子无法穿过风墙，风墙卡位时老鼠不能推奶酪。小跳风可将正在绑火箭的猫挤出火箭从而强行阻止猫绑火箭。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=10.6',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '屏障内的老鼠虚弱时间减少。',
            detailedDescription: '在风墙中心半径850范围内老鼠虚弱时间减少5s。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '风墙持续时间增加，屏障内猫咪将无法使用技能和道具。',
            detailedDescription: '风墙持续时间增加至4.5s，屏障内猫咪将无法使用技能和道具。',
            cooldown: 20,
          },
        ],
        cancelableSkill: '可被打断',
      },
      {
        name: '幻影剑气',
        type: 'weapon1',
        description:
          '挥出一道剑气。剑气击中敌方将造成伤害和减速；击中友方将给予移速、救援及跳跃高度提升，且其在此期间可用交互键瞬移至附近幻影处。剑气击中平台则形成幻影，再次点击技能按钮可瞬移至幻影处。',
        detailedDescription:
          '挥出一道剑气，前摇0.45s，飞行速度1750，持续5s。剑气击中角色可反弹一次，再次击中角色剑气消失。剑气击中敌方将造成10伤害（可继承状态），并降低其40%移速、跳跃高度，持续5s；击中友方将提升其25%移速、救援速度及跳跃高度，持续5s，且其在此期间可用交互键瞬移至附近幻影处。剑气击中平台则形成幻影，再次点击技能按钮可瞬移至幻影处。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被打断',
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
            cooldown: 10,
            detailedDescription: '减少CD至10s。',
          },
          {
            level: 3,
            description: '被剑气击中的友方攻击提升。',
            detailedDescription: '被剑气击中的友方攻击提升50点，持续5s。',
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
            detailedDescription: '当Hp高于[Hp上限的99%](122)时，获得40%减伤。',
          },
          {
            level: 2,
            description: '当道具命中敌方时，获得4秒无敌。（CD：45s）',
          },
          {
            level: 3,
            description:
              '当道具命中困在风墙内或被剑气打中的敌方时，额外造成眩晕效果（可使手中的老鼠掉落），敌方在45秒内不会重复受到此效果。',
            detailedDescription:
              '当道具命中困在风墙内或被剑气打中的敌方时，额外造成2.5秒眩晕效果（可使手中的老鼠掉落），敌方在45秒内不会重复受到此效果。',
          },
        ],
      },
    ],
  },

  罗宾汉泰菲: {
    description:
      '来自12世纪英国的侠盗罗宾汉泰菲，他身形灵敏，擅长利用草丛隐蔽自己，是罗宾汉杰瑞的好帮手', // 角色描述

    maxHp: 74, // 健康值上限
    attackBoost: 5, // 攻击增伤
    hpRecovery: 2.5, // 健康值回复速度
    moveSpeed: 630, // 移速
    jumpHeight: 380, // 跳跃高度
    cheesePushSpeed: 3.8, // 推奶酪速度（前三分钟的数值，即基础推速×0.8）
    wallCrackDamageBoost: 0.5, // 墙缝增伤
    mousePositioningTags: [
      // 定位
      {
        tagName: '干扰',
        isMinor: false,
        description: '能频繁对猫咪造成伤害和控制。',
        additionalDescription:
          '弹球可对猫咪造成伤害和控制，且CD极短；藤蔓可提供额外的道具支援。自身血量低，且主动技能需要近距离接触猫咪，因此需要注意自身安全。',
      },
      {
        tagName: '辅助',
        isMinor: false,
        description: '制造特殊地形、提供全队恢复。',
        additionalDescription:
          '藤蔓可以制造地形，部分位置还能通过卡位阻止敌方追击；Lv.2时为全队提供强力恢复。',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '弹球可对墙缝造成高额伤害',
        additionalDescription:
          '单次弹球可反复对墙缝造成伤害；选择合适角度或制造特殊位置平台可造成更高额的伤害。',
      },
      {
        tagName: '奶酪',
        isMinor: true,
        description: '推速较快，且擅长搬奶酪',
        additionalDescription:
          '推速较高，且擅长搬奶酪；但干扰和位移能力更出色、更擅长通过干扰和拉扯来创造推奶酪的机会。',
      },
    ],

    skillAllocations: [
      // 技能加点方案
      {
        id: '藤蔓',
        pattern: '12[12]10(0)(0)2',
        weaponType: 'weapon1',
        description: '本套为通用加点，适合大部分场合。',
        additionaldescription:
          '主动技能2级提供控制，武器技能2级提供恢复和储存，可根据实际情况抉择；被动升至2、3级时均会立即获得一层护盾，推荐在需要时才进行加点。',
      },
      {
        id: '被动',
        pattern: '1210(0)[12](0)2',
        weaponType: 'weapon1',
        description: '相比于通用加点，提高自保，但舍弃了部分辅助能力。',
        additionaldescription:
          '该套加点6级即可点出Lv.2被动，可利用护盾效果提高自保能力，但舍弃了武器技能Lv.2的恢复效果。',
      },
    ],

    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description:
          '以精准投射为核心的通用卡组。主动技能的短冷却配合精准投射可以打出弹射-投掷-弹射的高额爆发伤害。不屈能提高Hp上限，对基础Hp较低的角色增幅可观。救援时，建议协同多位队友一同前往，或先将猫咪打至虚弱。熟练使用后，若想继续提高操作上限，可尝试将救救我换为绝地反击（非组队情况下慎换）。',
      },
      {
        cards: ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description: '通用卡组将舍己换为幸运后产生的变种，思路类似。',
      },
      {
        cards: ['S-铁血', 'B-精准投射', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '通用卡组在知识量不足时的变种，思路类似。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '任何角色都能带的基础卡组，上限低但是能保下限，适合刚接触该角色的玩家。',
      },
    ],

    skills: [
      {
        name: '弹力圆球',
        type: 'active',
        description:
          '蓄力弹射，碰撞猫咪或墙缝时造成伤害。弹射期间再次点击技能将垂直下坠并结束弹射。',
        detailedDescription:
          '长按技能键，0.5秒后开始蓄力，蓄力期间无法进行其他操作；松开技能键进行弹射，弹射时间随蓄力时间增加而增加，最短为1秒，最长为4.7秒；蓄力2.5秒以上时，蓄力条充满，弹射时间达到最大。弹射基础速度1570。弹射过程中将放大体型，碰撞敌方或墙缝时造成伤害并被反弹，对碰触的敌方造成50（+5）点伤害；对碰触的墙缝造成10（+0.5）点伤害。碰撞其它墙壁或小黄鸭时也会被反弹。弹射期间再次点击技能将垂直下坠1.5秒，期间接触地面则进入0.3秒不可取消的后摇。取消蓄力将返还50%CD，在未进入蓄力动作时取消技能不进入冷却。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '不可被打断*', // 该技能为短前摇+蓄力的技能，前摇不可被除主动取消技能以外的方式打断
        cancelableAftercast: '可被道具键打断',
        videoUrl: 'https://www.bilibili.com/video/BV1by4y1f7md/?t=10', //使用了梦回的数值介绍，技能数据也有参考，特此注明

        skillLevels: [
          {
            level: 1,
            description: '弹射会被控制效果中断。碰撞猫咪额外造成20%减速，持续2秒。', // 因游戏内缺少对最短伤害间隔的描述，笔者对其进行了补充。原始测定结果为1.8至2.07之间，已进行取整
            detailedDescription:
              '弹射会被控制效果中断。碰撞猫咪额外造成20%减速，持续2秒。猫咪在2秒内不会重复受到该技能的伤害和减速。', // 因游戏内缺少对最短伤害间隔的描述，笔者对其进行了补充。原始测定结果为1.8至2.07之间，已进行取整
            cooldown: 7,
          },
          {
            level: 2,
            description:
              '弹射期间获得弱霸体，对猫咪不再造成减速，而是眩晕。猫咪在3.8秒内不会重复受到该技能的伤害和控制。',
            detailedDescription:
              '弹射期间获得弱霸体，对猫咪不再造成减速，而是2秒眩晕，可击落手中的道具，但不击落手中的老鼠。猫咪在3.5秒内不会重复受到该技能的伤害和控制。',
            cooldown: 7,
          },
          {
            level: 3,
            description:
              '弹射造成的眩晕将击落猫咪手中的老鼠；提高对墙缝的伤害。取消猫咪受到该技能效果的内置CD。',
            detailedDescription:
              '弹射造成的眩晕将使猫咪手中的老鼠掉落；提高对墙缝的伤害至15（+0.5）。取消猫咪受到该技能效果的内置CD。',
            cooldown: 7,
          },
        ],
      },
      {
        name: '藤蔓',
        type: 'weapon1',
        description:
          '生成可攀爬的藤蔓，持续一段时间，并在顶端生成一个箱子，老鼠在攀爬时将大幅提高攀爬速度。',
        detailedDescription:
          '释放技能0.7秒后，在自身前方150处生成高为1100、宽为250的矩形可攀爬区域，友方攀爬时速度提高到原先的400%；并于1.2秒后在顶端生成宽为350的平台和特殊的大纸盒。若生成可攀爬区域时有硬性墙体阻挡，其生成位置会尝试向罗宾汉泰菲进行移动，最低与自身距离为25。特殊大纸盒中只会开出以下7种道具：玻璃杯，碗，盘子，圆盘子，灰色花瓶，高尔夫球，奶酪。（携带“美食家”知识卡时，特殊大纸盒改为开出牛奶或蛋糕，与普通纸盒共计生效次数）', //此处攀爬速度提高的数值采用了梦回的数据，经再次次测试，结果相近。距离数值已以50为基础取整（“最低与自身距离”已以25取整）
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: '可被道具键*打断', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1by4y1f7md/?t=60', //使用了梦回的数值介绍，技能数据也有参考，特此注明
        skillLevels: [
          {
            level: 1,
            description: '藤蔓持续10秒。',
            detailedDescription: '藤蔓平台持续10秒，随后和攀爬区域一同消失。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '技能可储存2次；提高藤蔓持续时间；站上藤蔓平台将恢复Hp。',
            detailedDescription:
              '技能可储存2次；藤蔓平台持续时间提高至15秒，友方站上藤蔓平台将立刻恢复27Hp并获得8/s的恢复效果，持续3秒。恢复效果未结束时重新站上平台可立刻回血并刷新效果持续时间。在恢复效果结束5秒内无法再次获得。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '藤蔓平台额外解除受伤，同时提高跳跃高度',
            detailedDescription: '藤蔓平台额外解除受伤，同时恢复生效期间跳跃高度提高25%。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '野生体格',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1by4y1f7md/?t=45', //使用了梦回的数值介绍，技能数据也有参考，特此注明
        skillLevels: [
          {
            level: 1,
            description: '在喝牛奶和吃蛋糕后永久增加跳跃高度，最多叠加5次。',
            detailedDescription: '在喝牛奶和吃蛋糕后永久增加跳跃高度5%，最多叠加5次。', //跳跃提升数值采用了梦回的数据，
          },
          {
            level: 2,
            description: '每隔15秒，获得持续5秒的护盾。',
            detailedDescription: '每隔15秒，获得持续5秒的护盾；加点时立刻获得护盾。',
          },
          {
            level: 3,
            description: '增加Hp恢复；Lv.2的护盾触发时将解除受伤状态；加点时立刻获得护盾。',
            detailedDescription:
              '永久获得2/s的Hp恢复；Lv.2的护盾触发时将解除受伤状态；加点时立刻获得护盾并重置护盾CD。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 蒙金奇 ---------------------------------- */
  蒙金奇: {
    description: '军团指挥官蒙金奇。',
    maxHp: 99,
    attackBoost: 25,
    hpRecovery: 0.5,
    moveSpeed: 640,
    jumpHeight: 380,
    cheesePushSpeed: 3,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '破局',
        isMinor: false,
        description: '战车自带霸体，冲撞可撞开[绝大多数猫的布局](夹子、兔八哥萝卜、图多香水等)',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: false,
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
          '对于冲撞难以造成效果的猫（如图多，苏蕊，追风），六级优先三被；墙缝期优先点车。',
        additionaldescription: '如果猫携带了猛攻知识卡，可以考虑优先二级车。，',
      },
    ],
    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
    ],
    skills: [
      {
        name: '勇往直前',
        type: 'active',
        description:
          '向前冲撞，期间获得霸体和减伤，推开道具并对猫造成少量伤害和击退。消耗士气值可以增强技能效果。',
        detailedDescription:
          '向前冲撞，期间获得霸体和30%减伤，持续1秒，推开道具并对猫造成10点伤害和击退。施放时可以消耗3格士气值造成25点伤害和更强的击退效果，并击落猫咪手中的道具与老鼠。驾驶战车时也可以施放，且无论士气值如何，均造成强化后的效果。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断', //前摇0.3秒
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
            description: '首次冲撞后，5秒内可再次冲撞。',
            cooldown: 20,
          },
        ],
      },
      {
        name: '军团战车',
        type: 'weapon1',
        description:
          '消耗全部士气值，召唤拥有独立Hp的战车，每格士气值提升战车3秒持续时间。期间免疫控制，获得额外的战矛投掷技能和选择提前脱离战车的临时技能，但无法使用道具、交互或回复Hp。当战车Hp归零、持续时间结束、蒙金奇主动脱离时，战车进入自毁倒计时。战车爆炸，对范围内所有单位造成伤害。',
        detailedDescription:
          '消耗全部士气值，召唤拥有独立Hp的战车，每格士气值提升战车3秒持续时间，最多持续20秒。期间免疫控制，获得额外的[战矛投掷技能](前摇0.2秒，对猫咪造成30点固定伤害（无法触发知识卡追风）或对墙缝造成5点固定伤害；CD为2秒)和选择提前脱离战车的临时技能，但无法使用道具、交互或[回复Hp](例外：国王的守护战旗)。当战车Hp归零、持续时间结束、蒙金奇主动脱离时，战车进入5秒自毁倒计时。战车爆炸，对范围内所有单位造成75点爆炸伤害和2秒眩晕、对未脱离战车的蒙金奇造成自身血量100%的伤害。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断', // 前摇0.7秒
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '战车Hp为100点。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '战车Hp提高到125点。',
            cooldown: 35,
          },
          {
            level: 3,
            description: '减少CD。',
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
              '自然增长士气值，上限为3格。对猫咪造成伤害会提升士气值。虛弱时士气值清空。每格士气值提升减伤能力。',
            detailedDescription:
              '以0.077格/s的速度自然增长士气值，上限为3格。每对猫咪造成一次伤害提高10点士气值。虛弱时士气值清空。每格士气值给予5%的减伤能力。',
          },
          {
            level: 2,
            description: '士气值上限提升到5格。友方对附近猫咪造成伤害时也会获得士气值。',
            detailedDescription:
              '士气值上限提升到5格。友方对自身一定范围内猫咪造成伤害时，蒙金奇也会获得半格士气值。',
          },
          {
            level: 3,
            description: '每格士气值额外提供移速和Hp恢复速度；士气自然增长速度提升。',
            detailedDescription:
              '每格士气值额外提供2%的移速和0.2/s的Hp恢复速度；士气自然增长速度提高到0.15格/s。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 尼宝 ----------------------------------- */
  尼宝: {
    description: '爱捣蛋、爱运动的机灵鬼',

    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 640,
    jumpHeight: 400,
    cheesePushSpeed: 2.8,
    wallCrackDamageBoost: 1,

    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '二级翻滚免控免死。',
        additionalDescription: '稳救不稳走，依赖隐身；被托普斯的捕虫网和各种强制位移技能克制。',
      },
      {
        tagName: '砸墙',
        isMinor: true,
        description: '二被+果盘，墙缝蒸发一半',
        additionalDescription: '触发条件较为苛刻，且需要与队友有一定沟通。',
      },
    ],

    skillAllocations: [
      {
        id: '',
        pattern: '121000122',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
    ],

    skills: [
      {
        name: '灵活跳跃',
        type: 'active',
        description: '快速向后翻滚。',
        detailedDescription: '快速向后翻滚。（不能在跳跃中释放）',
        canMoveWhileUsing: false,
        canUseInAir: true, // 可以下落中释放，不能跳跃中释放
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
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
            description: '翻滚后获得短暂减伤和强霸体；首次翻滚后3秒内可再次翻滚。',
            detailedDescription:
              '翻滚开始后1.9秒获得20固定减伤和强霸体；首次翻滚结束后3秒内可再次翻滚。（如果使用道具/交互键、受到控制或进入虚弱，则无法再次翻滚）',
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
        type: 'weapon1',
        description:
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。',
        detailedDescription:
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。朋友在30秒后自然消失。朋友扔出鱼钩过程中再次点击技能会使朋友将鱼钩收回（有前摇）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=50.7',
        skillLevels: [
          {
            level: 1,
            description: '鱼钩碰到道具会携带之；碰到角色会将其勾回，并使猫咪掉落手中的老鼠。',
            detailedDescription:
              '鱼钩碰到道具会携带之，碰撞猫咪时造成相应效果；碰到角色会将其勾回，并使猫咪掉落手中的老鼠。',
            cooldown: 16,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '鱼钩携带的道具碰撞猫咪时造成额外的伤害和眩晕。',
            detailedDescription: '鱼钩携带的道具碰撞猫咪时额外造成50伤害和2.5秒眩晕。',
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
            description: '对猫咪造成伤害或受到猫咪的伤害时，刷新主动技能。(CD：9秒)',
            // detailedDescription: '对猫咪造成伤害或受到猫咪的伤害时，刷新主动技能。(CD：9秒)',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 魔术师 ----------------------------------- */
  // 角色名
  魔术师: {
    description:
      '魔术师是杰瑞的表哥之一，他出身高贵，动作优雅，是一位不折不扣的绅士，他拥有强大的魔法能力，能够将猫玩弄于股掌之间。',

    maxHp: 99,
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 645,
    jumpHeight: 400,
    cheesePushSpeed: 0.4,
    wallCrackDamageBoost: 0,
    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '兔子先生可以安全地运送和推入奶酪，而兔子大表哥可以增加魔术师的推速。',
        additionalDescription: '推速在奶酪位并不占优，更擅长通过干扰和拉扯来创造推奶酪机会。',
      },
      {
        tagName: '干扰',
        isMinor: false,
        description: '卡牌和兔子大表哥可以干扰猫咪。',
        additionalDescription:
          '卡牌可以超远程支援，且控制时间长，但并非硬性控制，实际使用时更偏向于用它创造更多的拉扯机会。',
      },
      {
        tagName: '救援',
        isMinor: true,
        description: '利用卡牌限制猫咪，然后利用兔子先生救援。',
        additionalDescription:
          '红牌+兔子先生即可较稳定地进行救援。兔子大表哥可以阻止秒飞，但需要魔术师在附近，需要牺牲部分推奶酪和拉扯能力。',
      },
    ],

    skillAllocations: [
      {
        id: '兔子先生',
        pattern: '[12]0(2)(2)1100',
        weaponType: 'weapon1',
        description: '升级兔子先生时会召回兔子并使技能CD归零。',
        additionaldescription: '需要注意，加点也会终止当前指令。',
      },
      {
        id: '兔子大表哥',
        pattern: '3101100-3-3',
        weaponType: 'weapon2',
        description: '',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-缴械', 'S-舍己', 'C-救救我'],
        description:
          '救援卡组，红牌命中后可以相对安全地舍己救援。若知识量充足，可视情况将舍己换为无畏。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description:
          '通用卡组，不屈提升自保，精准投射配合卡牌的短CD可以频繁进行干扰。若知识量不足，可将精准投射换为夹不住我。',
      },
      {
        cards: ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-脱身'],
        description: '通用卡组的幸运变种，思路类似。本套卡组需要较高的熟练度和合适的阵容。',
      },
      {
        cards: ['S-铁血', 'S-护佑', 'S-舍己', 'C-救救我'],
        description: '基础卡组，牺牲上限换下限，适合新手或者应对难以破盾的猫咪。',
      },
    ],

    skills: [
      {
        name: '奇思妙想',
        type: 'active',
        description:
          '从三张卡牌中选取一张，投掷命中猫咪时令其传送一小段距离，并禁用技能/急速反向/失重漂浮一段时间。',
        detailedDescription:
          '点击技能后进入1.5秒前摇，随后魔术师手中获得一张随机颜色卡牌，技能同步进入5秒读条，期间每0.5秒按红-黄-蓝的顺序切换卡色（若切换时魔术师正在交互中，则不会切换）；再次点击技能/用道具键投出卡牌/5秒读条结束后，将固定卡色，技能进入CD。\n卡牌属于投掷物，投掷时初速度为2000，穿越所有墙体，命中猫咪时可以触发部分以投掷命中为触发条件的效果（如知识卡-缴械，特技-干扰投掷等）。卡牌也会命中兔子大表哥/森林牧场大鸭子，但不会触发卡牌效果或投掷命中触发的效果。猫咪受卡牌效果影响期间，不会受到新的卡牌效果。魔术师虚弱时，卡牌不会从手中掉落。卡牌被丢弃时，将直接被移除。\n卡牌效果如下：\n通用：使目标向卡牌飞行方向传送80距离，并改变角色朝向。\n红牌：立刻受到65（+0）点伤害并掉落手中道具，6秒内禁用技能且减速18.5%。\n黄牌：每2秒获得[1.5秒的反向和150%加速](斯飞受黄牌效果期间不会受到反向和加速)，持续7秒。\n蓝牌：获得8秒失重状态。该状态下可在空中进行跳跃。', //红牌减速和黄牌加速数值采用了梦回的数据
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键或道具键打断',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Qd4y1W7fg/?t=8',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '减少CD。',
            detailedDescription: '减少CD至18秒。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '卡牌命中时为自身提供恢复/隐身/加速效果，命中兔子大表哥时额外减少CD。',
            detailedDescription:
              '卡牌命中任意目标时，自身根据卡色获得效果：\n红色：获得7/s的Hp恢复，持续5秒\n黄色：获得隐身，持续5秒；蓝色：获得30%加速，持续3秒。此外，卡牌命中兔子大表哥时，额外减少30%剩余CD。', //加速采用了梦回的数据
            cooldown: 18,
          },
        ],
      },
      {
        name: '兔子先生',
        type: 'weapon1',
        description:
          '召唤兔子先生，可下达救援、搬奶酪、推奶酪、拾取、投掷、治疗或跟随指令。兔子继承魔术师的部分效果。',
        detailedDescription:
          '在1.9秒前摇后，召唤“兔子先生”，其在场时技能按键变为释放指令（无CD，可移动释放但不可取消前摇）。\n释放指令：在0.9秒前摇后，选取以魔术师为中心，半径1150范围内的一个目标释放指令。优先选择优先级高的目标；优先级相同时，选择与魔术师直线距离近的目标。\n指令按优先级从高到低排列如下：\n1.火箭救援-对被绑上火箭的己方老鼠下达指令：兔子前往救援。\n2.搬奶酪-对奶酪下达指令：[兔子将立刻放下道具并搬起该奶酪](如兔子手里已经有奶酪，则什么都不做)。\n3.推奶酪-对已放入奶酪的洞口，或在兔子手持奶酪时对空洞口下达指令：兔子手中有奶酪时，他会朝该洞口投掷奶酪；该洞口有未推入的奶酪时，他会与其交互并开始推奶酪。\n4.治疗-对虚弱且可治疗的老鼠下达指令：该老鼠虚弱时，兔子将尝试对其治疗。\n5.投掷-兔子手中有[道具](奶酪除外)时，对猫咪/墙缝/小黄鸭下达指令：兔子手持道具时，他将连续对其投掷/使用道具（即：兔子开始投掷时，如果所在位置有其他道具，会一并拾取并立刻投掷/使用，直到没有道具可被拾取）。\n6.拾取-对部分可拾取的投掷道具下达指令：兔子手持该道具以外的道具时，他将放下道具；手中没有道具时，他会拾取该道具。\n7.跟随-无其他目标时下达指令：无效果。\n兔子先生的属性：Hp上限110，Hp恢复4.5（常态）或2（受伤时），移速820，跳跃550，攻击增伤20，推速1.6%/秒，墙缝增伤2。\n兔子先生的特性：\n1.常态：免疫碎片、捕鼠夹和直接抓起。搬运奶酪时不会减速，且可正常交互。当自身Hp为 0/魔术师被抓起或被淘汰时，自身退场并使技能进入CD。在场时会继承魔术师的[“无畏”知识卡](但改为被救者和魔术师获得无畏效果)和[由常规道具获得的牛奶、隐身和护盾效果](不包括卡牌、药水舱等)。其它判断逻辑[接近己方老鼠](如：猫咪攻击时可正常获得经验，会受推速加成)。\n2.指令执行逻辑：指令下达后将一直生效，直到下一条指令被下达。当魔术师对新目标下达指令或兔子退场时，兔子将立刻传送到魔术师的身边；当魔术师对相同目标下达指令时，指令将失效。当兔子当前指令行为执行完毕/跟随魔术师时与其距离超过360或一段时间内未进行交互和移动时，他将向魔术师移动。\n注：以下道具无法触发兔子的拾取指令，但可以在执行投掷指令时被拾取和使用：冰块，小鞭炮，鞭炮束，玩具枪，遥控器，电风扇，冰桶，鞭炮堆。兔子可以被动拾取药水，但不会使用，而是在一小段时间后放下；兔子可以以2000的初速度投掷电风扇。', //兔子基础属性采用了梦回的数据
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键或道具键打断',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1Qd4y1W7fg/?t=88',
        skillLevels: [
          {
            level: 1,
            description: '', //游戏内Lv.1的描述有误，兔子在场时魔术师并不会额外增加移速
            cooldown: 70,
          },
          {
            level: 2,
            description: '减少CD；提高兔子的Hp上限。升级时会召回兔子并重置CD。',
            detailedDescription: '减少CD至40秒；兔子的Hp上限提高至150。升级时会召回兔子并重置CD。',
            cooldown: 40,
          },
          {
            level: 3,
            description: '兔子的推速、攻击和墙缝增伤提升，在场时提高魔术师的移速、推速和Hp恢复。',
            detailedDescription:
              '兔子的推速提高75%，攻击增伤提高30，墙缝增伤提高3；在场时提高魔术师10%的移速，3.75%/秒的推速，1.67/s的Hp恢复。升级时会召回兔子并重置CD。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '兔子大表哥',
        type: 'weapon2',
        description:
          '召唤兔子大表哥，可下达举火箭、指卧撑或保镖指令。兔子大表哥可被卡牌命中并储存卡牌效果，期间出拳命中猫咪时对其施加卡牌效果。该技能无法主动升级，而是在队友被淘汰时自动升级。',
        detailedDescription:
          '兔子大表哥不在场时，使用技能在1.9秒前摇后召唤兔子大表哥。其在场时，可拖动技能按键至半径750以内的目标，[执行对应指令](每次释放指令额外+30表现分，最短间隔5秒，至多+300分)；[兔子大表哥可被卡牌命中](卡牌不会击中其他魔术师的兔子大表哥)并储存对应卡牌效果。\n指令按选取目标优先级从高到低排列如下：\n1.举火箭-对火箭下达指令：兔子大表哥传送至该火箭位置并将其举起，使其交互和判定位置上移，不再因倒计时归零而起飞。单次最多执行60秒。\n2.指卧撑-对地面下达指令：兔子大表哥传送至该处并开始做指卧撑，并以[自身](贴图位置：俯卧时从头顶到腰部)中轴线距地175处为端点，向面朝方向生成一个长度为125的平台，该平台具有弹性。以兔子大表哥为中心点，左右各距离80的范围内存在猫咪时，兔子大表哥会持续出拳（出拳只影响贴图，不影响平台及自身位置）。单次最多执行10秒。\n3.保镖-无其他可选目标时下达指令：兔子大表哥跟随魔术师。兔子大表哥被卡牌命中且魔术师周围1000距离内存在猫咪时，兔子大表哥会传送到其位置并出拳；魔术师或兔子大表哥被距离400以内的猫咪攻击时，兔子大表哥会跑向其并出拳；魔术师虚弱且与兔子大表哥距离小于100时，兔子大表哥会在0.5秒前摇后将魔术师击退1150距离。\n有关“储存卡牌”及“出拳”的信息如下：\n1.储存卡牌：兔子大表哥被卡牌命中时，[储存该卡牌60秒](可从外观分辨兔子大表哥储存了哪些卡牌)，三种卡牌独立计时，受到已有的卡牌时重置其计时。\n2.出拳：在0.5秒前摇后，对面前距离300内的猫咪造成35点伤害，并减速70%，持续1.7秒；对[墙缝](无法攻击墙缝上的泡泡)造成17点伤害；若出拳[命中猫咪](会额外获得100表现分，单场比赛至多1000)，会对其施加已储存的一种卡牌效果，卡牌的传送方向改为与出拳方向一致，优先级为黄-红-蓝；若单次攻击命中多个目标，会为目标分别附加卡牌效果，直到储存的卡牌耗尽；若命中已有卡牌效果的猫咪，也会消耗储存的卡牌，但不产生效果；若未命中目标，不会消耗。出拳CD2.6秒，所有指令共用。\n兔子大表哥的属性：Hp上限200，Hp恢复3/s，移速820，跳跃550。\n兔子大表哥的特性：\n1.常规：猫咪会在小地图全程透视他的位置。永久霸体。当魔术师被淘汰时，兔子大表哥也会离场。其它判断逻辑[接近己方猫咪](如：有伤害保护机制；Hp归零时，会虚弱5秒并快速恢复血量；Hp<0时会虚弱并使击杀者获得金钱；被魔术师使用卡牌击中5次会使魔术师-50成就分等)。\n2.指令执行逻辑：魔术师在场且自身与魔术师的距离超过1600/魔术师虚弱时，兔子大表哥会中断当前指令，传送到魔术师身边并执行保镖指令；魔术师被绑上火箭时，兔子大表哥会自动对魔术师所在的火箭执行举火箭指令（秒飞火箭除外）；兔子大表哥虚弱时，会中断当前指令，虚弱完毕后执行保镖指令。兔子大表哥执行指令时的朝向与收到指令时的朝向一致。\n3.指卧撑时：指令期间对其他地面位置下达指令时，指令剩余时间会被继承，执行完毕后自动执行跟随指令。可选取斜面为目标，但无法选取吊灯等场景组件上的平台为目标。\n4.举火箭时：兔子大表哥位移时，火箭的交互和判定位置会一同移动；兔子大表哥放下火箭时，火箭会传送回原位。指令期间无法对其他火箭下达举火箭指令。\n举起火箭时与其他角色技能的互动关系：沙包拳头无法打灭火箭；滑步踢无法踢飞火箭；乾坤袋无法吞火箭；喜剧之王Lv.2无法使表演者·杰瑞从火箭上挣脱（已挣脱时再举起火箭则贴图出错））', //正常的：Lv.3鼓舞、天使祝福可正常对火箭上的己方生效；火药桶、Lv.2共鸣可正常拆火箭；爱之花洒可浇灭火箭，但释放位置需上移；友情庇护范围内/风格骤变Lv.3范围内/蓝图内的火箭起飞速度会放缓（蓝图内火箭贴图会出错）
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '魔术师推速提高。',
            detailedDescription: '魔术师推速提高3%/s。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '举火箭指令执行期间可主动攻击，并改变兔子大表哥的外观（穿上披风）。魔术师推速和救援速度进一步提高。',
            detailedDescription:
              '举火箭时，若身旁100范围内有猫咪，则会挥舞火箭对范围内的所有目标造成35点伤害，向身侧击退100距离并向上击飞250距离。魔术师推速改为提高6%/s，救援速度提高50%。',
            cooldown: 5,
          },
          {
            level: 3,
            description:
              '新增主动出拳指令，并改变兔子大表哥的外观（穿上衬衫并戴上帽子）。魔术师免疫受伤；推速和救援速度极大幅度提高。',
            detailedDescription:
              '新增指令：主动出拳-对猫咪或墙缝下达指令：兔子大表哥传送到目标位置并立即出拳（该指令有10秒CD，CD期间释放该指令则指令无效，释放其他指令时CD归零）。该指令优先级高于指卧撑，低于举火箭。魔术师推速改为提高9%/s，救援速度改为提高约250%。',
            cooldown: 5,
          },
        ],
      },
      {
        name: '魔术戏法',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1Qd4y1W7fg/?t=69',
        skillLevels: [
          {
            level: 1,
            description: '卡牌命中时，手中会随机出现一张卡牌，同时减少技能CD，并获得经验。',
            detailedDescription:
              '主动技能的卡牌命中猫咪/兔子大表哥/森林牧场大鸭子时，减少主动与武器技能CD各10秒，获得（400/己方存活人数）点经验两次，并且获得一张随机颜色的新卡牌（获得卡牌有30秒CD）。',
          },
          {
            level: 2,
            description: '卡牌命中后，自身投掷的下一个易碎道具命中目标时也附加卡牌效果。',
            detailedDescription:
              '主动技能的卡牌命中猫咪/兔子大表哥/森林牧场大鸭子时，为魔术师下一个手持的道具附加以下效果：若该道具为玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块，则被魔术师投掷时，额外为命中目标附加对应卡牌效果（包括使用冰块误伤己方老鼠的情况）；若手持的道具不在上述之列，则不附加任何效果，该次机会将被浪费。道具被附加效果后，即使被放下/被装入蓝白花瓶中，所附加的效果依然存在。魔术师获得新卡牌时，清除场上已有的附加效果。',
          },
          {
            level: 3,
            description: '受到致命伤害时，有小概率消耗手中的可消耗道具并免疫当次伤害。',
            detailedDescription:
              '当魔术师即将受到致命伤害/即将虚弱时，若手持玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/任意卡牌，则有约30%的概率消耗该道具，并免疫当次伤害。', //参考了梦回的数据
          },
        ],
      },
    ],
  },
};

// Process character definitions to assign IDs and process skills
export const mouseCharacters = processCharacters(mouseCharacterDefinitions);

// Generate characters with faction ID and image URLs applied in bulk
export const mouseCharactersWithImages = Object.fromEntries(
  Object.entries(mouseCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      factionId: 'mouse' as const,
      imageUrl: getMouseImageUrl(characterId),
      skills: addSkillImageUrls(characterId, character.skills, 'mouse'),
    },
  ])
);
