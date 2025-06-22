import { addSkillImageUrls } from '../lib/skillUtils';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition } from './types';

// Generate image URL based on character ID
const getMouseImageUrl = (characterId: string): string => {
  // Check if the image exists, otherwise use a placeholder
  const existingImages = ['杰瑞', '侦探杰瑞', '航海士杰瑞', '泰菲', '罗宾汉泰菲', '尼宝'];

  if (existingImages.includes(characterId)) {
    return `/images/mice/${characterId}.png`;
  } else {
    return `/images/mice/placeholder-mouse.png`;
  }
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
        description: '四级一般点二级隐身；如果需要团推且猫不在附近，可以先点二级烟雾弹。',
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
        description: '能对敌方造成伤害和高频率的控制效果',
        additionalDescription:
          '主动技能能对敌方造成伤害和控制效果；武器技能可提供额外的道具支援；自身血量低，技能需要近距离接触敌方才能进行干扰，因此请时刻注意自身安全',
      },
      {
        tagName: '辅助',
        isMinor: false,
        description: '拥有提供全队恢复和位移的能力',
        additionalDescription:
          '2级以上的武器技能可以提供高额的恢复效果，藤蔓可以提高全队的机动性，部分位置还能通过卡位来阻止敌方猫的追击',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '主动技能可对墙缝造成高额伤害',
        additionalDescription:
          '单次技能期间可反复对墙缝造成伤害；可通过选择合适的角度或制造特殊位置的平台等方式造成更高额的伤害',
      },
      {
        tagName: '奶酪',
        isMinor: true,
        description: '推速较快，并且擅长搬运奶酪',
        additionalDescription:
          '位移和控制能力强，但并没有提高推奶酪速度的能力。游戏内定位改版后为罗宾汉泰菲添加了此定位，但在实际游戏中不推荐当成纯粹的奶酪位来玩',
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
          '主动技能2级提供控制，武器技能2级提供恢复和储存，可根据实际情况抉择；被动升至2、3级时均会立即获得一层护盾，推荐在需要时才进行加点',
      },
      {
        id: '被动',
        pattern: '01(0)[12][12](0)2',
        weaponType: 'weapon1',
        description:
          '本套加点优先点二被动，有较高的局限性，对地图和角色依赖大，仅适配极少部分阵容和角色，慎用。',
        additionaldescription:
          '舍弃大量干扰和支援能力，换取小部分自保能力。在面对不需要技能提供伤害和控制、己方阵容以拉扯为主、猫咪难以处理带盾老鼠的场合可以尝试性使用该加点。',
      },
    ],

    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
      ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'B-精准投射', 'C-绝地反击', 'C-救救我'],
      ['S-铁血', 'B-精准投射', 'B-绝地反击', 'C-不屈', 'C-救救我'],
    ],

    skills: [
      {
        name: '弹力圆球',
        type: 'active',
        description: '罗宾汉泰菲通过蓄力弹射出去，碰撞猫咪时造成伤害。',
        detailedDescription:
          '罗宾汉泰菲通过蓄力弹射出去，碰撞猫咪或墙缝时对对方造成伤害并被反弹，碰撞墙壁或小黄鸭时也会被反弹。有效蓄力时间最长为2.5秒，弹射时间随蓄力时间增加而增加，最短为0.9秒，最长为4.7秒。弹射基础速度1570。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '不可被打断*', // 该技能为短前摇+蓄力的技能，前摇不可被除主动取消技能以外的方式打断
        cancelableAftercast: '可被道具键打断',
        videoUrl: 'https://www.bilibili.com/video/BV1by4y1f7md/?t=10', //使用了梦回的数值介绍，技能数据也有参考，特此注明

        skillLevels: [
          {
            level: 1,
            description:
              '期间若自身受到控制，则会恢复正常状态；也可再次点击技能下落至地面；取消蓄力返还50%CD；猫咪在2秒内不会重复受到该技能的伤害。', //此处游戏内没有对同一敌人受伤间隔的描述，我们对其进行了增补。下同。
            detailedDescription:
              '罗宾汉泰菲按住技能键0.65秒后开始蓄力，原地蓄力任意时间后松开技能键进行弹射。弹射程中将放大体型，对碰触的敌人造成55（技能基础伤害50+角色基础攻击力5）点伤害并减速20%，猫咪在2秒内不会重复受到该技能的伤害；对碰触的墙缝造成10.5（技能基础伤害10+角色基础破坏力0.5）点伤害。期间若自身受到眩晕等控制，则会恢复正常状态。弹射期间再次点击技能将垂直下坠1.5秒，接触地面时进入0.25秒不可取消的后摇。取消蓄力将返还50%CD。在未进入蓄力动作时取消技能将不进入冷却。',
            cooldown: 7,
          },
          {
            level: 2,
            description:
              '弹射期间获得弱霸体，额外对猫咪造成眩晕。猫咪在3.8秒内不会重复受到该技能的伤害和控制。',
            detailedDescription:
              '弹射期间获得弱霸体，额外对猫咪造成1.8秒眩晕，但不可击落敌方手中的老鼠。改为同一敌人在3.8秒内不会重复受到该技能的伤害和控制。',
            cooldown: 7,
          },
          {
            level: 3,
            description:
              '弹射造成的眩晕将使猫咪手中的老鼠掉落；提高对墙缝的伤害。取消猫咪受到该技能伤害和控制的内置CD。',
            detailedDescription:
              '弹射造成的眩晕将使猫咪手中的老鼠掉落；提高对墙缝的伤害至15.5（技能基础伤害15+角色基础破坏力0.5）。取消猫咪受到该技能伤害和控制的内置CD。',
            cooldown: 7,
          },
        ],
      },
      {
        name: '藤蔓',
        type: 'weapon1',
        description:
          '扔出藤蔓种子，生长出可以攀爬的藤蔓，持续一段时间，并在顶端出现一个箱子，老鼠在攀爬时将大幅提高攀爬速度。',
        detailedDescription:
          '释放技能0.65秒后，生成可攀爬的区域并于1.25秒后在顶端生成平台和特殊的大纸盒，老鼠在攀爬时速度提高300%。若生成藤蔓时藤蔓的攀爬区域有硬性墙体阻挡，藤蔓的生成位置会进行偏移，最低与自己距离为0。生成的特殊大纸盒中只会开出以下道具：圆盘子，玻璃杯，碗，盘子，灰色花瓶，高尔夫球，奶酪。携带“美食家”知识卡时，特殊大纸盒改为开出牛奶或蛋糕，与普通纸盒共计生效次数。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: '可被道具键*打断', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1by4y1f7md/?t=60', //使用了梦回的数值介绍，技能数据也有参考，特此注明
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '藤蔓平台持续10秒，随后和攀爬区域一同消失。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '技能可储存2次；提高藤蔓持续时间；站上藤蔓平台将恢复健康值。',
            detailedDescription:
              '技能可储存2次；藤蔓平台持续时间提高至15秒，站上藤蔓平台将立刻恢复27健康值并获得8/s的恢复效果，持续3秒，恢复效果未结束时重新站上平台可立刻回血并刷新效果持续时间，在恢复效果结束5秒内无法再次获得。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '藤蔓平台将解除受伤效果，同时提高跳跃高度',
            detailedDescription: '藤蔓平台将解除受伤效果，同时提高跳跃高度25%',
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
            description: '在喝牛奶和吃蛋糕之后将永久增加跳跃高度，最高叠加5次。',
            detailedDescription: '在喝牛奶和吃蛋糕之后将永久增加跳跃高度5%，最高叠加5次。',
          },
          {
            level: 2,
            description: '每隔15秒获得1层持续5秒的护盾。',
            detailedDescription: '每隔15秒获得1层持续5秒的护盾；加点时立刻获得护盾。',
          },
          {
            level: 3,
            description: '增加健康值恢复速度；二被的护盾触发时将解除受伤状态；加点时立刻获得护盾。',
            detailedDescription:
              '健康值恢复速度增加2/s；二被的护盾触发时将解除受伤状态；加点时立刻获得护盾。',
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
