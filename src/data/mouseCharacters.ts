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
        aliases: ['锤子'],
        type: 'weapon1',
        description: '举起大铁锤近身攻击。',
        // detailedDescription: '举起大铁锤近身攻击。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'], //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
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
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
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
    aliases: ['侦杰'],
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
        additionalDescription: '烟雾弹能进一步提高团队推速。',
      },
      {
        tagName: '破局',
        isMinor: true,
        weapon: 1,
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
      {
        cards: ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
    ],

    skills: [
      {
        name: '隐身',
        type: 'active',
        description: '进入隐身状态，期间获得加速。',
        detailedDescription: '前摇1.9秒，进入隐身状态，期间加速15%。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
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
          '引爆烟雾弹遮挡猫的视野。前摇0.5秒，后摇1.5秒。在烟雾中猫咪无法查看小地图，此效果可以被一层护盾抵消。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
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
            detailedDescription: '老鼠在烟雾范围内加速20%，跳跃高度提升50%，推速固定提升5.75%/s。',
            cooldown: 35,
          },
          {
            level: 3,
            description:
              '烟雾持续时间增加，猫在烟雾范围内会降低移速、跳跃高度和攻击频率，且无法使用技能和道具。',
            detailedDescription:
              '烟雾持续时间增加至6.5秒，猫在烟雾范围内减速20%、跳跃高度降低20%且爪刀CD延长50%，且无法使用技能和道具。',
            cooldown: 35,
          },
        ],
      },
      {
        name: '视觉干扰器',
        type: 'weapon2',
        description: '投掷干扰器，落地后对范围内的老鼠施加短暂的隐身效果。',
        detailedDescription:
          '以道具形式投掷干扰器，投掷前摇0.3s，落地或碰到墙壁后对范围内的老鼠施加3.5秒隐身效果。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        // cancelableSkill: '不确定是否可被打断', // FIXME
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
    aliases: ['海盗杰瑞'],
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
      {
        cards: ['S-铁血', 'S-舍己', 'B-飞跃', 'B-绝地反击', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
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
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
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
              '金币对猫咪造成2次伤害和控制效果，每次效果{55}点伤害；由于金币免疫，第二次伤害和控制效果会被免疫，只能破一层盾，总伤害{55}点。',
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
          '放置一个能破坏火箭、墙缝的火药桶，火药桶爆炸后会破坏[附近的火箭](下端判定非常大)，并对周围角色造成伤害和眩晕。猫咪可以拆除火药桶，耗时1秒；老鼠可以推动火药桶。火药桶被打击后会引线时长会缩短5秒。猫咪在绑老鼠前需要先修复火箭。航海士杰瑞破坏绑有队友的火箭后会救下队友（能触发无畏、舍己）。\n火药桶运动规律：可被鞭炮炸飞，在火药桶左侧的鞭炮会使火药桶呈抛物线飞出，右侧的鞭炮会使火药桶水平滑行。使用特定道具斜向下45°打击桶外侧可使桶产生横向加速；立着的盘子产生的加速较大，约为杯子产生加速的两倍。未引爆的炸药也可以使桶位移，且不会缩短引线。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '无后摇',
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
            description: '火药桶引线减短；破坏的火箭无法自动恢复；伤害提升。',
            detailedDescription:
              '火药桶引线时长减短至3秒；破坏的火箭无法自动恢复；伤害提升至70点。',
            cooldown: 30,
          },
        ],
      },
      {
        name: '舰艇火炮',
        type: 'weapon2',
        description:
          '放置一个舰艇火炮，老鼠可以进入。火炮内免疫投掷物，可以控制方向发射并对碰到的猫咪造成伤害与眩晕、碰到绑在火箭上的队友自动救援。',
        detailedDescription:
          '放置一个舰艇火炮，老鼠可以进入。火炮内免疫投掷物，可以控制方向发射并对碰到的猫咪造成50点伤害与1.5秒眩晕、碰到绑在火箭上的队友自动救援。火炮内老鼠进入虚弱后火炮会提前消失。同一房间最多出现两个火炮。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        // cancelableSkill: '不确定是否可被打断', // FIXME
        // cancelableAftercast: '不确定是否可取消后摇', // FIXME
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

  国王杰瑞: {
    description:
      '国王杰瑞是玩具国的王，他胸怀天下，对自己的子民良善，但对破坏国家安定的野猫毫不留情。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 1.67,
    moveSpeed: 600,
    jumpHeight: 380,
    cheesePushSpeed: 3.75,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '主动技能是救援的强力手段。',
        additionalDescription:
          '护盾瞬发、权杖无敌、战旗秒救，开局就拥有一定救援能力，成型后更难被拦截。',
      },
      {
        tagName: '辅助',
        isMinor: false,
        description: '一武团队无敌，二武多种团队增益。',
        additionalDescription:
          '权杖可以给范围内的队友施加群体无敌，是接应与抗伤的好手段；战旗集视野、输出、破局、自保等多种强效团队增益于一体，拥有极高的上限，是当之无愧的第一辅助。',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        weapon: 2,
        description: '攻击战旗可以提供强大的团队破墙能力。',
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
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
    ],
    collaborators: [
      {
        id: '音乐家杰瑞',
        description: '国王杰瑞的进攻战旗可以为音乐家杰瑞提供高额增伤。',
        isMinor: false,
      },
      {
        id: '蒙金奇',
        description: '国王杰瑞的强化救援战旗配合蒙金奇的战车可以实现稳救。',
        isMinor: false,
      },
      {
        id: '表演者•杰瑞',
        description: '国王杰瑞的强化救援战旗配合表演者•杰瑞的梦幻舞步可以实现稳救。',
        isMinor: false,
      },
      {
        id: '尼宝',
        description: '国王杰瑞的强化救援战旗可以大幅降低尼宝使用灵活跳跃的救援难度。',
        isMinor: true,
      },
      {
        id: '泰菲',
        description: '国王杰瑞的强化救援战旗配合泰菲的圆滚滚可以实现稳救。',
        isMinor: true,
      },
    ],
    skills: [
      {
        name: '威严光盾',
        aliases: ['小盾'],
        type: 'active',
        description: '',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=5.2',
        skillLevels: [
          {
            level: 1,
            description: '短暂获得一层护盾。',
            detailedDescription: '获得一层护盾，持续4.9秒。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '护盾持续期间获得加速；减少CD。',
            detailedDescription: '护盾持续期间获得18.5%加速；减少CD。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '改为获得两层护盾；减少CD。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '国王权杖',
        aliases: ['大盾'],
        type: 'weapon1',
        description: '给予附近友方短暂的无敌。',
        detailedDescription: '给予附近友方短暂的无敌。前摇0.9秒，后摇1秒。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=81.9',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '给予半径480范围内的友方2.5秒的无敌。',
            cooldown: 45,
          },
          {
            level: 2,
            description: '扩大技能生效范围。',
            detailedDescription: '技能生效半径扩大到[960](即扩大一倍)。',
            cooldown: 45,
          },
          {
            level: 3,
            description: '增加无敌的持续时间。',
            detailedDescription: '无敌的持续时间增加到3.5秒。',
            cooldown: 45,
          },
        ],
      },
      {
        name: '国王战旗',
        type: 'weapon2',
        description:
          '召唤战旗，为碰触的友方提供增益。战旗被碰触若干次后将获得强化。\n攻击战旗：提高攻击力（强化：同时获得墙缝增伤、免疫受伤）\n救援战旗：大幅提高救援速度。（强化：[获得瞬息救援能力](碰触火箭直接救援成功)）\n守护战旗：解除虚弱；Hp较低时将缓慢恢复Hp并加速（强化：直接获得1层护盾）\n感知战旗：对猫隐藏自己的小地图位置（强化：额外显示猫的位置）\n灵巧战旗：提高跳跃高度（强化：获得2段跳）。',
        detailedDescription:
          '在身前略高于地面的位置召唤战旗，为碰触的友方老鼠提供增益，前摇0.9秒，后摇0.5秒，战旗存在15秒。战旗被碰触若干次后获得强化，提供强化版增益。战旗具有重力，无碰撞体积，会因受力而移动。同一时间只能存在一种战旗，获得战旗效果后的15秒内无法再次获得同等级的效果。机械鼠不会继承战旗的增益效果\n攻击战旗：增加35点攻击力，持续10秒（强化：期间额外增加2点墙缝增伤，免疫受伤）\n救援战旗：提高100%的救援速度，持续5秒（强化：[获得瞬息救援能力](碰触火箭直接救援成功)，持续5秒。以该方式救下队友不计入赛后的数据统计）\n守护战旗：解除虚弱；Hp低于30%时，以7.5/s的速度恢复Hp，加速25%，并解除反向、失明、受伤等异常状态，持续2秒（强化：直接获得一层护盾，持续4秒。）\n感知战旗：对猫隐藏自己的小地图位置，持续10秒（强化：额外显示5秒猫的位置）\n灵巧战旗：提高50%的跳跃高度，持续5秒（强化：期间额外获得二段跳）。', // 感知战旗可以感知所有敌方单位
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV12P4y1e7rg?t=100.25',
        skillLevels: [
          {
            level: 1,
            description: '战旗被碰触两次后获得强化。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '强化所需的碰触次数减少一次；减少CD。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '战旗被召唤时即为强化状态。',
            cooldown: 15,
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
            detailedDescription: '救援速度提升40%。',
          },
          {
            level: 3,
            description: '从火箭上将队友救下后，彼此移速短暂提升。',
            detailedDescription: '从火箭上将队友救下后，彼此移速各提高15%，持续3秒。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 剑客杰瑞 ----------------------------------- */
  剑客杰瑞: {
    description:
      '来自法国的剑客杰瑞，是顶级的剑术大师，他常常冲锋陷阵在最前，是所有老鼠敬仰的英雄。',
    maxHp: 124,
    attackBoost: 25,
    hpRecovery: 0,
    moveSpeed: 640,
    jumpHeight: 380,
    cheesePushSpeed: 2.4,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '拥有极高的输出和武器的控制，技能提供续航。',
        additionalDescription:
          '高等级剑杰可在打出大量伤害的同时控制猫数秒，双武器均可与干扰投掷配合。',
      },
    ],
    skillAllocations: [
      {
        id: '剑舞华尔兹',
        pattern: '20212[1100]',
        weaponType: 'weapon1',
        description: '对于难以命中或是难以有效输出干扰的猫，出于自保可八级点出三级被动。',
        additionaldescription: '',
      },
      {
        id: '常规格挡',
        pattern: '303131100',
        weaponType: 'weapon2',
        description: '常规加点。对于不怕灌伤的猫，可以十级再点三级格挡。',
        additionaldescription: '',
      },
      {
        id: '自保格挡',
        pattern: '303100113',
        weaponType: 'weapon2',
        description: '用于打缺乏伤害的猫，偏自保，建议配合卡组3使用。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'B-绝地反击', 'C-救救我'],
        description: '双武器通用卡组，投手可换应激，有效输出的同时保证自保。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'B-绝地反击', 'C-救救我'],
        description: '二武常用卡组，配合控制与干扰投射，随时拥有反杀能力，上限极高。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '用于干扰收益不大的猫，偏自保，逃窜可换应激。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '第一套卡的下位替代，兼具自保和输出。',
      },
    ],
    skills: [
      {
        name: '剑与苹果',
        type: 'active',
        description: '使用华丽的剑法切碎苹果并吃掉它，解除不良状态，减少武器技能CD并获得额外增益。',
        detailedDescription:
          '使用华丽的剑法切碎苹果并吃掉它，前摇1.9秒。技能释放完成后解除失明、反向等不良效果，减少武器技能CD并获得额外增益。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '武器技能CD减少20秒；逐渐恢复Hp。',
            detailedDescription: '武器技能CD减少20秒；给予10/s的Hp恢复效果，持续5秒。',
            cooldown: 10,
          },
          {
            level: 2,
            description: '武器技能CD减少30秒；逐渐恢复改为立刻回复50Hp。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '立刻刷新武器技能CD；额外短暂提升攻击力。',
            detailedDescription: '立刻刷新武器技能CD；额外提升15点攻击力，持续14.9秒。',
            cooldown: 10,
          },
        ],
        cooldownTiming: '释放后',
        canHitInPipe: false,
      },
      {
        name: '剑舞华尔兹',
        aliases: [],
        type: 'weapon1',
        description: '使用三段剑舞近身攻击，造成伤害；前两段额外造成减速，第三段额外造成眩晕。',
        detailedDescription:
          '使用三段剑舞近身攻击。\n第一段，前摇0.45秒，对前方200、后方50范围内的敌方造成{30}点伤害，并减速30%，持续1.9秒；\n第二段，前摇0.45秒，对前方200、后方50范围内的敌方造成{30}点伤害，并减速50%，持续2.4秒；\n第三段，前摇0.75秒，后摇0.4秒，对前方200、后方70范围内的敌方造成{30}点伤害，并眩晕3秒。\n开始释放技能后的9.9秒内可以再次点击技能释放下一段，否则进入CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        canHitInPipe: true,
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 40,
          },
          {
            level: 2,
            description: '挥剑时免疫控制效果；挥剑后获得短暂加速。',
            cooldown: 40,
            detailedDescription:
              '技能前摇时获得霸体效果（后摇无），施放完成后获得短暂的加速。\n第一段，移速增加10%，跳跃高度增加10%，持续3秒；\n第二段，移速增加15%，跳跃高度增加20%，持续4秒；\n第三段，移速增加20%，跳跃高度增加30%，持续5秒。',
          },
          {
            level: 3,
            description: '第一段剑舞额外造成短暂眩晕。',
            cooldown: 40,
            detailedDescription: '第一段剑舞额外造成2秒眩晕。',
          },
        ],
      },
      {
        name: '格挡之剑',
        type: 'weapon2',
        description:
          '举剑格挡，受爪刀攻击后反击，也可以主动反击，造成伤害和眩晕。反击后，技能键短暂替换为翻滚。',
        detailedDescription:
          '原地进入1.4秒的格挡状态，该阶段下自身无敌，免疫绝大多数正负面效果、使撞到的牛仔汤姆的牛消失。受到爪刀攻击时进入反击阶段，0.4秒前摇后对猫造成{40}点伤害和2.5秒眩晕。反击也可通过再次点击技能键主动释放，对前方375、后方50范围内的敌方造成同等效果。\n反击释放后，1.2秒内技能键被替换为翻滚。翻滚阶段下，向前以1000的速度滚动0.9秒。翻滚开始或1.2秒未翻滚后，技能进入cd。被动触发的格挡反击[无视距离且必定命中](包括管道中的猫咪)、触发后自身回复25Hp并减少7秒技能CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: ['道具键*', '跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '大幅减少CD。',
            detailedDescription: '减少CD至7秒。',
            cooldown: 7,
          },
          {
            level: 3,
            description: '增加反击伤害。',
            detailedDescription: '反击伤害增加至{55}点。',
            cooldown: 7,
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '越战越勇',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '攻击力提升。',
            detailedDescription: '攻击力提升10点。',
          },
          {
            level: 2,
            description: '减少虚弱时间。',
            detailedDescription: '减少40%虚弱时间。',
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
    counters: [
      {
        id: '托普斯',
        description: '二武和高伤都可以迅速消灭分身，需要注意二武不能主动戳到分身。',
        isMinor: false,
      },
      {
        id: '莱特宁',
        description: '有效牵制习惯闪现接爪刀的莱特宁玩家。',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '汤姆',
        description: '会被平底锅拍飞，主动无敌无视一切输出。',
        isMinor: false,
      },
    ],
    collaborators: [
      {
        id: '国王杰瑞',
        description: '战旗的增益能使剑杰的输出能力进一步提升。',
        isMinor: true,
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
        weapon: 1,
        description: '火箭筒能炸开捕鼠夹和叉子。',
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
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'B-绝地反击', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '待补充',
      },
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
        aliases: ['地雷'],
        type: 'weapon2',
        description:
          '放下隐形感应雷。感应雷在猫咪靠近时现身，并在1.5秒后飞向猫咪并爆炸，造成伤害和控制。',
        detailedDescription:
          '放下隐形感应雷。雷在猫咪靠近时现身，并在1.5秒后飞向猫咪并爆炸，造成50伤害、1.9秒控制和击退（对墙缝伤害为10）。爆炸也会弹飞老鼠，但不造成伤害。隐身状态的猫咪不会触发雷。雷被道具攻击后会在一段时间后原地爆炸。雷会在30秒后自然消失。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
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
            description: '可以存储两发感应雷；雷可击落猫手中的老鼠和道具。',
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

  /* ----------------------------------- 剑客泰菲 ----------------------------------- */
  剑客泰菲: {
    aliases: ['剑菲'],
    description: '剑客泰菲虽然平时惹祸不断，但在学剑之余，他勤加练习掌握了操控盔甲人的技巧。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 1,
    moveSpeed: 600,
    jumpHeight: 380,
    cheesePushSpeed: 2.4,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '救援',
        weapon: 1,
        isMinor: false,
        description: '头盔的长轴防御使得剑客泰菲具有十分优秀的救援能力。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        weapon: 2,
        isMinor: false,
        description: '携带剑客长枪的剑客泰菲具有较强的机动性和干扰能力。',
        additionalDescription: '',
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
        description: '适合头盔的机动性卡组。飞跃提升机动性，救下来触发绝反高伤害。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'B-精准投射', 'B-绝地反击'],
        description: '适合长枪的高伤卡组，精准投射刷新技能CD，释放技能更频繁。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'A-投手', 'C-不屈'],
        description: '打斯飞专用。',
      },
    ],
    skills: [
      {
        name: '勇气冲刺',
        type: 'active',
        description: '剑向前猛烈一刺，对猫咪造成伤害，并恢复少量勇气。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '不可取消后摇',
        cooldownTiming: '释放后',
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description:
              '剑客泰菲鼓起勇气向前猛烈一刺并恢复少量勇气，对击中的猫咪造成伤害，但消耗一定的勇气。',
            detailedDescription: '',
            cooldown: 1.5,
          },
          {
            level: 2,
            description: '勇气冲刺在短时间内击中猫咪5次后，使猫咪眩晕并受到额外的伤害。',
            cooldown: 1.5,
          },
          {
            level: 3,
            description: '勇气冲刺在短时间内击中猫咪3次后，使猫咪眩晕并受到额外的伤害。',
            cooldown: 1.5,
          },
        ],
      },
      {
        name: '头盔',
        type: 'weapon1',
        description:
          '举起头盔保护自己和队友，躲在头盔后的队友不能使用技能。在头盔内受到攻击或成功火箭救援后会减少剩余的持续时间。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        canHitInPipe: true,
        cancelableAftercast: '不可取消后摇',
        cancelableSkill: '不可被打断',
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '延长头盔的持续时间。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '举起头盔时可以更灵活地移动。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '剑客长枪',
        type: 'weapon2',
        description: '',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description:
              '蓄力投掷长枪。蓄力时间越长，投掷的速度越快、距离越长。长枪对触碰的敌方造成伤害和控制效果。在投掷后的一定时间内，可再次点击技能瞬移到长枪尾部跟随飞行。长枪碰到队友后，可携带1名友方进行飞行，期间剑客泰菲和友方均可通过跳跃、投掷离开。若飞行中碰触到易碎道具和打开的捕鼠夹，也会挂着该道具飞行。长枪在碰到墙壁、地面、平台时将消失。',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '长枪速度大幅提高。在勇气释放过程中，长枪命中敌人时将使其无法使用技能、带飞友方时将解除其受伤和虚弱。',
            cooldown: 8,
          },
          {
            level: 3,
            description: '在勇气释放过程中，本技能CD减少至4秒。',
            cooldown: 8,
          },
        ],
      },
      {
        name: '勇者无惧',
        type: 'passive',
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
            description: '每当勇气值达到最高时，解除自身受伤状态，并获得一个临时的护盾。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 恶魔泰菲 ----------------------------------- */
  恶魔泰菲: {
    aliases: ['恶菲'],
    description: '待补充',
    maxHp: 74,
    attackBoost: 15,
    hpRecovery: 2.5,
    moveSpeed: 645,
    jumpHeight: 400,
    cheesePushSpeed: 3.6,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '本身推速不慢，且在经典之家、古堡一二、天宫有很强的搬奶酪能力。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '一武复制果盘道具，二武三级直接砸墙，主动也能吸附道具快速砸墙。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: false,
        weapon: 2,
        description: '二武蓝恶魔减速猫咪、红恶魔与猫咪拉开距离，拥有很强的干扰能力。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '方案1',
        pattern: '01020[12][12]2',
        weaponType: 'weapon1',
        description: '一武加点。',
      },
      {
        id: '方案2',
        pattern: '03030[13]11',
        weaponType: 'weapon2',
        description: '二武常见加点。',
      },
      {
        id: '方案3',
        pattern: '013003311',
        weaponType: 'weapon2',
        description: '二武天宫需要搬奶酪这么加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-回家', 'C-救救我'],
        description: '有三级回家的一武恶菲。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'A-投手', 'B-夹不住我'],
        description: '二武恶菲推荐卡组。投手提高牵制能力，绿色小恶魔可以快速叠夹不住我层数',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description: '没21点知识量时的推荐。',
      },
    ],
    collaborators: [
      {
        id: '剑客莉莉',
        description: '恶魔泰菲的蓝色小恶魔可以显著降低剑客莉莉利用二级被动的救援难度。',
        isMinor: true,
      },
    ],
    skills: [
      {
        name: '意念控制',
        type: 'active',
        description: '吸附附近道具或场景物。每吸附一个会获得额外加速。',
        detailedDescription:
          '吸附半径300范围内、除鞭炮堆以外的鼠方可用道具和场景物。每吸附一个道具或场景物加速8.9%。优先吸附左侧的道具。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '可吸附一个道具或场景物。',
            cooldown: 9,
          },
          {
            level: 2,
            description: '可吸附两个道具或场景物。',
            cooldown: 7,
          },
          {
            level: 3,
            description: '可吸附三个道具或场景物。',
            cooldown: 5,
          },
        ],
      },
      {
        name: '恶魔之角',
        type: 'weapon1',
        description: '将附近的道具复制一份。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 35,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '额外复制一个道具。',
            cooldown: 25,
          },
        ],
      },
      {
        name: '小淘气',
        type: 'weapon2',
        // FIXME: description all uses '小恶魔', but official description uses '小淘气'.
        description:
          '将附近道具变成小恶魔。\n易碎道具变成蓝色小恶魔：造成伤害并使敌方无法使用技能和道具，自动索敌；\n控制道具变成红色小恶魔：对敌方造成向右击退；\n高尔夫球变成绿色小恶魔：比高尔夫球有更大的弹性，不会消耗黑暗印记，可影响捕鼠夹和奶酪；捕鼠夹受影响会立刻打开；奶酪受影响后变轻、拾取后加速、并可投掷进洞。\n所有小恶魔猫鼠双方均可使用。',
        detailedDescription:
          '将附近道具变成小恶魔。\n易碎道具变成蓝色小恶魔：基础伤害为20，使敌方无法使用技能和道具，且放置原地自动索敌；\n控制道具变成红色小恶魔：对敌方造成向右击退；\n高尔夫球变成绿色小恶魔：比高尔夫球有更大的弹性，不会消耗黑暗印记，可影响捕鼠夹和奶酪；捕鼠夹受影响会立刻打开；奶酪受影响后变轻、拾取后加速、并可投掷进洞。\n所有小恶魔猫鼠双方均可使用。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 10,
          },
          {
            level: 3,
            description:
              '绿色小恶魔可直接砸墙，持续减少墙缝耐久，并使墙缝在受到攻击后额外减少耐久。',
            cooldown: 10,
          },
        ],
      },
      {
        name: '黑暗印记',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '自然增长黑暗印记；被攻击时获得一层印记；投掷命中敌方时移除一层。一层印记时，移速和跳跃高度提升。',
            detailedDescription:
              '每20秒自然增长一层黑暗印记；被爪刀、技能、投掷攻击时获得一层印记；绿色小恶魔以外的道具投掷命中敌方时移除一层。一层印记时，移速和跳跃高度提升。',
          },
          {
            level: 2,
            description: '最多叠加两层印记；两层印记时，持续恢复Hp。',
            detailedDescription: '最多叠加两层印记；两层印记时，以5/s恢复Hp。',
          },
          {
            level: 3,
            description: '最多叠三层印记；三层印记时，攻击力增强。',
            detailedDescription:
              '最多叠三层印记；三层印记时，攻击力增强：盘子165；碗、杯子、高尔夫140；二武蓝恶魔135；二武绿恶魔125。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 佩克斯 ----------------------------------- */
  佩克斯: {
    aliases: ['舅舅'],
    description:
      '头戴黑色牛仔帽，穿着亮闪闪高皮靴的佩克斯，踏着精准的乐点，手持玫瑰木吉他，在属于他的舞台上舞动、歌唱、奔跑，让人无限怀念那属于西部的浪漫与自由。',
    maxHp: 124,
    attackBoost: 10,
    hpRecovery: 2.5,
    moveSpeed: 650,
    jumpHeight: 380,
    cheesePushSpeed: 2.8,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '魔音有眩晕远击退高伤害。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        isMinor: false,
        description:
          '魔音可弹开[绝大多数猫的布局](捕鼠夹、兔八哥萝卜、图多香水等)，琴可为队友加推速。',
        additionalDescription: '三级琴可比肩烟雾弹。',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '二被动和琴可为队友加推速和回复Hp。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '干扰',
        pattern: '0110(0)1222',
        weaponType: 'weapon1',
        description:
          '6级后留加点升三被，铁血期间可点出三被，三级魔音眩晕时间长但击退少，根据需要自己加点。',
      },
      {
        id: '打架队',
        pattern: '02202(0)111',
        weaponType: 'weapon1',
        description: '队友干扰能力较强但推速较慢时，可以考虑做辅助位主点琴加推速。（注意配合）',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-冲冠一怒', 'B-绝地反击', 'C-救救我'],
        description: '常用。',
      },
      {
        cards: ['S-护佑', 'S-铁血', 'A-逃窜', 'C-救救我'],
        description: '强自保。',
      },
    ],
    skills: [
      {
        name: '魔音贯耳',
        type: 'active',
        description: '发出声波，击退琴头方向的猫咪。前摇期间可以移动和跳跃。',
        detailedDescription:
          '发出声波，击退琴头方向的猫咪1700距离。前摇0.75秒，期间可以移动和跳跃。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: ['道具键', '道具键*', '跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 15,
          },
          {
            level: 2,
            description: '额外造成大量伤害、可以击落猫手中道具和老鼠。',
            detailedDescription: '额外造成90伤害并使敌方眩晕0.4秒、可以击落猫手中道具和老鼠。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '减少击退距离，使敌方眩晕2.5秒。',
            detailedDescription: '击退距离减为500，使敌方眩晕2.5秒。',
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
        description: '持续演奏吉他，范围内的友方持续恢复Hp、猫咪被减速并受到少量伤害。',
        detailedDescription:
          '前摇0.35秒，持续演奏吉他2.6秒，弹奏范围为半径750的圆，友方进入范围后0.35、0.75、1.15、1.55、1.95、2.35秒回复10Hp。猫咪减速22%，并在进入范围后0.35、0.75、1.15、1.55秒叠加一次（覆盖原有效果），此后不再叠加；在进入范围1.95、2.35秒后再施加一次[4级减速效果](减速77%)。减速效果持续0.8秒，猫咪进入范围后1.4秒、2.4秒将分别受到10伤害。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: '无后摇',
        cancelableSkill: ['道具键*', '道具键', '跳跃键'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 22,
            detailedDescription: '',
          },
          {
            level: 2,
            description: '演奏使友方恢复Hp更多、额外提高推速。',
            cooldown: 22,
            detailedDescription: '每次回复量从10Hp提升至15Hp，额外固定增加7%/s推速。',
          },
          {
            level: 3,
            description: '[完整听完演奏的老鼠](包括自己)在7秒内免疫虚弱。',
            cooldown: 22,
            detailedDescription:
              '推速增益将在进入范围后0.35、0.75、1.15、1.55、1.95、2.35秒叠加一次（会覆盖原有效果），持续0.8秒。队友和自身停留在范围内2.4秒后，将在7秒内免疫虚弱。获得该效果时将清除推速增益。',
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
          },
          {
            level: 2,
            description: '附近有队友时，提升周围[所有队友](包括自己)的移速、跳跃高度和推速。',
            detailedDescription:
              '以自身为半径2350范围内有队友时，周围[所有队友](包括自己)的移速提高3%、跳跃高度提高5%、推速提高2.6%。',
          },
          {
            level: 3,
            description:
              '进入虚弱状态时，直接回满Hp，同时获得短暂的无敌效果（每局限1次）；佩克斯从火箭上救下队友可以刷新此效果（每局限1次）。',
            detailedDescription:
              '进入虚弱状态时，立即解除虚弱并回复200Hp，同时获得短暂的无敌效果（CD：15分钟），佩克斯从火箭上救下队友可以刷新此效果（每局限1次）。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 侦探泰菲 ----------------------------------- */
  侦探泰菲: {
    aliases: ['侦菲'],
    description:
      '侦探泰菲最擅长分析各类疑难问题和数据测算，在日常的探案中，侦探泰菲是侦探杰瑞最有力的助手!',
    maxHp: 74,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 635,
    jumpHeight: 380,
    cheesePushSpeed: 4.6,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: false,
        description: '和侦探杰瑞并列第一的鼠方推速。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '利用分身和被动探查猫视野。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '隐身',
        pattern: '101012220',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '如有自保或回血需要，可以在8级先点出三级被动。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '常用，可拉扯。',
      },
      {
        cards: ['S-护佑', 'S-铁血', 'A-逃窜', 'C-救救我'],
        description: '强自保。',
      },
    ],
    skills: [
      {
        aliases: ['隐身'],
        name: '分身大师',
        type: 'active',
        description:
          '召唤1个迷惑猫咪的分身，同时自己进入隐身状态，除喝药水和移动跳跃外的任何动作都将导致显形。分身被击倒时使敌方短暂失明。', // FIXME: 被友方击倒呢？
        detailedDescription:
          '召唤1个迷惑猫咪的分身，存在6.9秒；同时自己进入隐身状态，持续4.8秒。除喝药水和移动跳跃外任何动作都将导致显形。分身被击倒时使敌方失明1.75秒，但不会破盾或减少护盾时间。\n分身大师分身特性：Hp上限为25并[按比例继承本体Hp](如本体血量为24，分身血量将为8.33)、继承角色Hp恢复速度、不继承本体状态和知识卡、免疫捕鼠夹；Hp归零或持续时间结束时将原地消失；会在地图内四处走动，但不会钻管道；若半径800范围内出现猫咪，分身会尝试远离之。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
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
              '分身、隐身持续时间增加。分身存在期间，可以再次点击技能键与分身换位（CD：5秒）。',
            detailedDescription:
              '分身存在时间增加至11.9秒，隐身持续时间增加至9.8秒。分身存在期间，可以再次点击技能键与分身换位（CD：5秒），但自己爬梯子、被眩晕时无法换位。',
            cooldown: 15,
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '追踪饮料',
        type: 'weapon1',
        description:
          '拿出饮料杯朝地上倾倒，留下特殊印记，持续25秒。一旦印记与猫咪处在同一个房间，印记会召唤1个自己或队友的分身。分身被击倒时使敌方短暂失明。存在任何分身时，印记不会召唤新的分身；使用分身大师将使饮料分身立即消失。',
        detailedDescription:
          '前摇1.3秒。拿出饮料杯朝地上倾倒，留下特殊印记，持续25秒。一旦印记与猫咪处在同一个房间，印记会召唤1个自己或队友的分身，持续9.9秒。分身被击倒时使敌方失明1.75秒，但不会破盾或减少护盾时间。当场上存在[任何分身](不包括其他侦探泰菲召唤的分身)时，印记不会召唤新的分身；使用分身大师将使饮料分身立即消失。同一房间同时召唤的分身越多，分身存在时间越短。\n饮料分身特性：Hp上限为角色Hp上限减49并[按比例继承本体Hp](如124血的剑杰Hp为24，召唤出的分身Hp将为15)，若同房间内出现出现猫咪将跑向最近的道具/果盘/冰桶处，若半径800范围内出现猫咪将使用相应道具进行攻击。', // FIXME: 玩具枪也会用吗？“被击倒”是Hp归零还是要小于0？
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键', '跳跃键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 28,
          },
          {
            level: 2,
            description:
              '[猫咪](不论是否隐身)靠近印记时，对所有友方暴露小地图视野，且侦探泰菲移速、跳跃速度提升。若饮料召唤出分身，将立即结束加速效果和猫咪视野暴露。',
            cooldown: 28,
            detailedDescription:
              '[猫咪](不论是否隐身)进入印记半径1250范围内时，对所有友方暴露小地图视野25秒，且侦探泰菲加速20%、跳跃速度提升20%，持续20秒。若饮料召唤出分身，将立即结束加速效果和猫咪视野暴露。',
          },
          {
            level: 3,
            description: '减少CD；分身存在时间增加。',
            detailedDescription: '减少CD至16秒；分身存在时间增加至20秒。',
            cooldown: 16,
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
  },

  /* ---------------------------------- 剑客莉莉 ---------------------------------- */
  剑客莉莉: {
    aliases: ['剑莉'],
    description:
      '来自法国第一女剑客莉莉，她的剑招低调不失气势，华丽而不失潇洒，她是坏人们最害怕的猫咪。',
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
      {
        cards: ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
        description: '待补充',
      },
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
        // cancelableSkill: '不确定是否可被打断', // FIXME
        cancelableAftercast: '无后摇',
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
        // cancelableSkill: '不确定是否可被打断', // FIXME
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
            detailedDescription: '减少CD至10秒。',
          },
          {
            level: 3,
            description: '被剑气击中的友方攻击提升。',
            detailedDescription: '被剑气击中的友方攻击提升50点，持续5秒。',
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
              '当道具命中困在风墙内或被剑气打中的猫咪时，额外造成眩晕效果（可救下其手中的老鼠），敌方在45秒内不会重复受到此效果。',
            detailedDescription:
              '当道具命中困在风墙内或被剑气打中的猫咪时，额外造成2.5秒眩晕效果（可救下其手中的老鼠），敌方在45秒内不会重复受到此效果。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 罗宾汉泰菲 ----------------------------------- */
  罗宾汉泰菲: {
    aliases: ['罗菲'],
    description:
      '来自12世纪英国的侠盗罗宾汉泰菲，他身形灵敏，擅长利用草丛隐蔽自己，是罗宾汉杰瑞的好帮手',
    maxHp: 74,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 630,
    jumpHeight: 380,
    cheesePushSpeed: 3.8,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '弹球可干扰猫咪，藤蔓能提供投掷道具。',
        additionalDescription: '藤蔓还能在狭窄的垂直地形堵住猫咪。自身Hp上限低，干扰时需注意安全。',
      },
      {
        tagName: '辅助',
        isMinor: false,
        description: '藤蔓可制造特殊地形进行支援，Lv.2时还能为全队提供恢复。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '弹球可对墙缝造成高额伤害，并且每次进出墙缝边缘都会造成伤害。',
        additionalDescription: '尽量选择合适角度来多次反弹，必要时可制造平台来辅助。',
      },
      {
        tagName: '奶酪',
        isMinor: true,
        description: '推速相对较快，且擅长搬奶酪，偶尔还能开出奶酪。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '藤蔓',
        pattern: '12[12]10(0)(0)2',
        weaponType: 'weapon1',
        description: '本套为通用加点，适合大部分场合。',
        additionaldescription:
          '主动技能Lv.2提供控制，武器技能Lv.2提供恢复和储存，需根据实际情况抉择。被动升至Lv.2/Lv.3时会立即刷新护盾，推荐在需要时才进行加点。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description:
          '通用卡组。以精准投射为核心，[主动技能配合精准投射可以打出弹射-投掷-弹射的连招](需注意主动技能控制猫咪有内置CD，避免断控)。不屈能提高Hp上限，对罗菲的提升很大。另外，本卡组救援能力较差，救援时建议协同队友，或先控制住猫咪再救援。熟练使用后，若想继续提高操作上限，可尝试将救救我换为绝地反击（非组队情况下慎换）。',
      },
      {
        cards: ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description:
          '通用卡组的幸运变种。适合[特定阵容](由多名携带幸运的奶酪位老鼠组成的速推阵容，或由多名干扰位老鼠组成的强干扰阵容。也可用于对抗库博等机动性强的猫咪)。熟练使用后，若想继续提高操作上限，可尝试将救救我换为脱身或绝地反击（非组队情况下慎换）。',
      },
      {
        cards: ['S-铁血', 'B-精准投射', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '通用卡组的知识量不足变种。适合进行干扰，但容错较低。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description:
          '新手卡组，牺牲上限提高下限，适合刚接触该角色的玩家。有时也可用该卡组应对难以处理护盾的猫咪。',
      },
    ],
    skills: [
      {
        name: '弹力圆球',
        aliases: ['弹球'],
        type: 'active',
        description:
          '蓄力弹射，碰撞到其他目标时自身被反弹并对目标造成效果。弹射时点击技能将结束弹射并[下坠](属于技能后摇，可被道具键*打断)。',
        detailedDescription:
          '长按技能键，在0.5秒前摇后开始蓄力，[拖拽并松开技能键进行弹射](弹射方向由技能拖拽的方向决定，初速度锁定为1675)，弹射时间随蓄力时间线性增加，最短1秒，最长4.7秒（[需要蓄力条满](满后仍能继续蓄力，但不增加弹射时间)，即蓄力2.5秒以上）。弹射过程中碰撞体积增大，碰撞到[其他目标](包括：猫咪、墙缝、小黄鸭、森林牧场大鸭子、墙壁、平台、地面)时将被[反弹](方向遵守反射定律。反弹平面为竖直面时，速度不变；为水平面时，改变速度：首次反弹初速度最高为1225，最低为1050，再次反弹初速度锁定为1050。碰撞猫咪/墙缝/鸭子时的反弹平面始终为竖直面，与他们的碰撞体积重叠期间只会进行一次反弹)。弹射时技能同步进入读条，可通过道具键*立刻结束技能，再次点击技能则[竖直向下坠落1.5秒](初速度锁定为2000；下坠期间只会碰撞平台或地面，动作期间无法进行其他操作，可用道具键*打断)，碰撞平台或地面时进入0.3秒不可被打断的后摇。前摇期间取消技能不进入CD，蓄力期间取消则进入50%的CD。', //使用了梦回的数值介绍 https://www.bilibili.com/video/BV1by4y1f7md/?t=10
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: ['道具键*'],
        cancelableSkill: '不可被打断',
        canHitInPipe: false,
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '碰撞猫咪造成伤害和2秒减速。碰撞墙缝造成少量伤害。',
            detailedDescription:
              '碰撞猫咪造成{55}点伤害和20%减速，持续2秒，对猫咪有2秒的内置CD。碰撞墙缝造成{10.5}点伤害。', // 严格来讲，是对同一猫咪有2秒内置CD，下同
            cooldown: 7,
          },
          {
            level: 2,
            description:
              '弹射期间获得[弱霸体](不免疫反向、失明、虚弱等状态)，碰撞猫咪造成[眩晕](可击落道具，但无法击落老鼠)，但内置CD延长。',
            detailedDescription:
              '弹射期间获得[弱霸体](不免疫反向、失明、虚弱等状态)，碰撞猫咪造成2秒[眩晕](可击落道具，但无法击落老鼠)，但不再造成减速，且对猫咪的内置CD延长至6秒。',
            cooldown: 7,
          },
          {
            level: 3,
            description: '对猫咪造成的眩晕可击落老鼠。提高对墙缝的伤害。',
            detailedDescription: '对猫咪造成的眩晕可击落老鼠。对墙缝的伤害提高至{15.5}。',
            cooldown: 7,
          },
        ],
      },
      {
        name: '藤蔓',
        aliases: ['树'],
        type: 'weapon1',
        description: '生成可攀爬的藤蔓，并在藤蔓顶端生成平台和大纸盒。老鼠攀爬藤蔓的速度大幅提高。',
        detailedDescription:
          '释放技能0.7秒后，在[自身前方150处](若拟生成藤蔓的位置有硬性墙体阻挡，实际位置会向罗宾汉泰菲进行移动，最低距离25)生成藤蔓。藤蔓生成时先出现高1100、宽250的可攀爬区域；该区域生成1.2秒后，在其顶端生成宽为350的平台和一个[特殊大纸盒](只会开出以下8种道具：玻璃杯、碗、盘子、圆盘子、灰色花瓶、高尔夫球、叉子、奶酪。携带“美食家”知识卡时，改为开出牛奶或蛋糕，与普通纸盒共计次数)。老鼠攀爬藤蔓的速度是爬普通梯子的4倍，猫咪不变。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '藤蔓持续一小段时间。',
            detailedDescription:
              '藤蔓可攀爬区域和顶端平台均生成完毕后，持续10秒，随后[一起消失](特殊大纸盒不会消失)。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '技能可储存2次；持续时间提高；站上藤蔓平台将回复Hp。',
            detailedDescription:
              '技能可储存2次；持续时间提高到15秒，友方[站上藤蔓平台](离开再重新回到平台/在平台和平台边缘间来回走动也能触发回复，并刷新持续恢复的持续时间)立刻回复27Hp并获得8/s的恢复效果，持续3秒。该效果结束后有5秒内置CD。',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '藤蔓的恢复效果可解除[受伤](被猫咪攻击时附加的状态，效果为停止自然Hp恢复且减速5%)，同时提高跳跃速度。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '野生体格',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '[吃食物](包括牛奶、蛋糕和天宫凌霄殿仙丹)后永久增加跳跃速度，最多叠加5次。', //跳跃提升数值采用了梦回的数据，
          },
          {
            level: 2,
            description: '每隔一段时间，获得一层短时间的护盾。',
            detailedDescription: '加点时立刻获得一层持续5秒的护盾，此后每15秒会再次获得。',
          },
          {
            level: 3,
            description:
              '获得额外的Hp恢复效果；Lv.2的护盾触发时解除[受伤](被猫咪攻击时附加的状态，效果为停止自然Hp恢复且减速5%)；加点时立刻获得护盾。',
            detailedDescription:
              '[获得2/s的Hp恢复状态](在受伤期间也生效)；Lv.2的护盾触发时解除[受伤](被猫咪攻击时附加的状态，效果为停止自然Hp恢复且减速5%)；加点时立刻获得护盾并重置护盾CD。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 玛丽 ----------------------------------- */
  玛丽: {
    description:
      '高贵优雅的贵族成熟女性，头戴星光闪耀的王冠，她的真实身份其实是公主，肩负责任的她有自己的原则和处事方式。',
    maxHp: 99,
    attackBoost: 0,
    hpRecovery: 2.5,
    moveSpeed: 635,
    jumpHeight: 380,
    cheesePushSpeed: 4.25,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '辅助',
        isMinor: false,
        description: '2级扇子可以解除队友的虚弱状态并回血。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        isMinor: false,
        description: '三级扇子可以吹飞夹子、图多盖洛的香水等。',
        additionalDescription: '',
      },
      {
        tagName: '奶酪',
        isMinor: true,
        description: '自身的推速较快、2级扇子有推速加成。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: true,
        description: '后期三级礼仪可干扰猫绑火箭。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '折扇破局',
        pattern: '2(0)2121100',
        weaponType: 'weapon1',
        description:
          '加点灵活，可随机应变。游戏开始时需保留一级被动加点，铁血且附近有队友再加点。适用于需要破局的情况。',
      },
      {
        id: '后期礼仪控场',
        pattern: '2(0)2111200',
        weaponType: 'weapon1',
        description: '适用于不需要破局的情况，更早点出三级礼仪控场。',
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
    skills: [
      {
        name: '贵族礼仪',
        type: 'active',
        description: '玛丽优雅行礼，范围内猫咪受其高贵气质感染，无法做出失礼举动。',
        detailedDescription: '',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['道具键*', '跳跃键'],
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description: '使猫在5秒内无法使用爪刀，并[解除其隐身效果](有盾也可)。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '额外造成短暂眩晕（可救下猫手中的队友），并禁用猫的技能。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '香风折扇',
        aliases: ['扇子'],
        type: 'weapon1',
        description: '手持折扇向目标方向扇风，对命中的猫咪造成少量伤害、反向和失明效果，可破盾。',
        // 2级折扇因为有对自身的加速效果所以可以搭配翻滚特技和应激反应来使用，能够在被猫攻击后快速逃脱，如果技能打中猫可直接断掉猫的节奏。墙缝战的时候如果点了3级折扇，可以卡在炸药包0秒时使用对墙缝造成大量伤害，达到破墙的效果(难度较高)\n注意1:不要对朵朵使用2级折扇\n注意2:折扇的基础效果对斯飞没用。
        canMoveWhileUsing: false,
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
            description: '可解除队友的虚弱状态并回复自身和队友的少量Hp，短暂提升推速和移速。',
            cooldown: 20,
          },
          {
            level: 3,
            description:
              '可吹飞部分道具。吹飞的投掷道具击中猫会对其造成相应效果。还可吹飞夹子，图多盖洛的香水等。',
            cooldown: 20,
          },
        ],
        canHitInPipe: false,
      },
      {
        name: '优雅从容',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '队友在附近时可免除一次虚弱状态。(CD：50秒)',
          },
          {
            level: 2,
            description: 'Hp上限增加[25](从99变为124)。',
          },
          {
            level: 3,
            description: '虚弱下减速附近猫咪；附近有队友时，提高自己和附近队友的虚弱状态移速。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 米雪儿 ----------------------------------- */
  米雪儿: {
    description:
      '米雪儿和图多盖洛居住在一个富有的家庭中，是一名富有的千金小姐。她喜欢吃甜品，但她不喜欢火炮类的东西，热爱自然的花草树木，尤其喜爱花朵类的装饰品。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 650,
    jumpHeight: 400,
    cheesePushSpeed: 3,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '辅助',
        isMinor: false,
        description: '队友铁血可用主动技能救活队友（建议车队配合）。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '后期15秒一个变大；三级武器对墙缝的增伤也很可观。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: true,
        description: '可变成道具偷袭猫。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '212020011',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '常用',
      },
    ],
    skills: [
      {
        name: '小情绪',
        aliases: [],
        type: 'active',
        description:
          '技能平时禁用，在米雪儿或附近队友队友受到猫攻击后激活。点击技能将原地大哭诉说委屈，期间将获得1层护盾。友方老鼠进入范围后可对米雪儿进行安抚，期间获得护盾，安抚结束后友方将变成攻击力强大的愤怒大老鼠。',
        detailedDescription:
          '技能平时禁用，在自己和以自己为中心半径1500内的队友受到猫攻击后激活30秒。点击技能将原地大哭诉说委屈，持续3.9秒，并获得1层持续7.9秒的护盾。哭泣750*750的矩形范围内将下起伤心的雨，对敌方造成25%减速。友方老鼠进入范围后可通过交互对米雪儿进行安抚，安抚前摇0.6秒，前摇前获得1层持续7.8秒的护盾。安抚结束后友方将变成攻击力强大的巨型比例鼠，持续9.9秒（爪刀前摇0.5秒，后摇0.5秒，爪刀范围[300](与汤姆相同)，对敌方造成110的基础伤害，并造成20%减速，持续1.9秒；对墙伤害为1.5）。哭时使用道具键*取消后摇或安抚成功后，将清除米雪儿的护盾；队友未安抚不会清除米雪儿的护盾；若在队友安抚的途中取消后摇不会清除队友的护盾，且该护盾能抵消虚弱状态。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: ['道具键*'],
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 20,
          },
          {
            level: 2,
            description: '安抚成功后，获得短暂加速。',
            detailedDescription: '安抚成功后，获得15%加速，持续4.9秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '减少CD。',
            detailedDescription: '减少CD至15秒。',
            cooldown: 15,
          },
        ],
        cancelableSkill: '无前摇',
      },
      {
        name: '超级变！变！变！',
        type: 'weapon1',
        description:
          '点击技能时米雪儿记录面前[最近的道具](被记录的道具将变成粉色)，再次点击技能将变成该[道具](可被使用)。变形后依然可以进行交互，同时提高视野范围。可储存2次记录的道具。受到伤害或点击技能键可变回；变回后道具消失。',
        detailedDescription:
          '点击技能时米雪儿记录自身周围半径100范围内[最近的道具](被记录的道具将变成粉色；若没有道具将直接进入技能CD)，记录前摇1.5秒，再次点击技能将变成该[道具](可被使用)，变身前摇0.5秒，持续60秒。变形后依然可以进行交互，同时提高视野范围至1.8倍。可储存2次记录的道具。受到伤害、所变道具损坏、再次点击技能键、达到最大持续时间后将变回，变回后技能进入5秒CD、道具消失。\n可以变形的道具为几乎所有投掷物（包括技能投掷物；例外：剑客泰菲的长枪、魔术师的卡牌、恶魔泰菲的红恶魔）、手枪、子弹、果盘、水果、番茄、鞭炮堆、冰桶、牛奶、蛋糕、纸箱、拳头盒子、拍子、关闭的捕鼠夹、[部分地图场景物](经典之家：推车、水桶、木桶；夏日游轮：消防栓、锅；森林牧场：三角铁、浆果、除七色花外的所有花及其被采后留下的叶子；熊猫谷：胡萝卜、竹笋、收纳箱；御门酒店：礼盒、除七色花外的所有花及其被采后留下的花瓶)。不能变形机器鼠遥控、风扇。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '受到[纯控制效果](碎片、管道等)不会取消变身。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '变身时将免疫1次伤害和控制；提高Hp恢复速度；提高被投掷命中时造成的伤害和控制时间。',
            cooldown: 5,
            detailedDescription:
              '变身时将免疫1次伤害和控制但受到[纯控制效果](碎片、管道等)将会取消变身。Hp恢复速度提升2.5/s；被投掷命中时造成的伤害提高50，控制时间增加0.6秒。',
          },
          {
            level: 3,
            description:
              '增加变形的持续时间和存储次数，同时提高变身状态下的攻击力和救援速度，并在变身结束后短暂保持。',
            cooldown: 5,
            detailedDescription:
              '变形的持续时间提高至90秒，存储的次数增加1次，变身期间攻击力提高15、对墙伤害提升3、救援速度提升60%，并在变身结束后保持3秒。',
          },
        ],
      },
      {
        name: '坚强的米雪儿',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '米雪儿受到伤害后，附近队友将大幅提高移速和救援速度。',
            detailedDescription:
              '米雪儿受到伤害后，自身半径900范围内的队友移动度提高15%、救援速度提高50%，持续7.9秒。',
          },
          {
            level: 2,
            description: 'Hp大于一半时，提高Hp上限，Hp低于一半时， 推速提升。',
            detailedDescription: 'Hp大于一半时，提高Hp上限25，Hp低于一半时， 推速提升30%。',
          },
          {
            level: 3,
            description: '虚弱时间减少30%；倒地后爬行速度短暂提升。',
            detailedDescription:
              '[虚弱时间减少30%](若在虚弱状态加点，将立即减少虚弱时间)，倒地后爬行速度提升为500，持续4秒。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 音乐家杰瑞 ----------------------------------- */
  音乐家杰瑞: {
    aliases: ['音杰'],
    description:
      '他是艺术的宠儿，音乐家杰瑞拥有优雅帅气的外表，他精湛的技艺能够指挥乐队演绎世界上最华丽的乐章，那些或舒缓、或激昂的音乐不断撩动观众的心弦，激起人们内心深处的灵魂共鸣。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 1,
    moveSpeed: 600,
    jumpHeight: 400,
    cheesePushSpeed: 3.5,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '可利用二级被动快速将老鼠救下火箭。',
        additionalDescription: '但在此期间容易吃到控制导致礼服被断。',
      },
      {
        tagName: '干扰',
        isMinor: false,
        description: '利用一级被动可以造成大量伤害和拦截猫上火箭。',
        additionalDescription: '被知识卡-皮糙肉厚大大克制。',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '主动技能可以带来不错的团队收益。',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        isMinor: true,
        description: '利用三级被动可快速破墙。',
        additionalDescription: '若4只老鼠均在墙缝附近可以技能全交做到秒破。',
      },
    ],

    skillAllocations: [
      {
        id: '',
        pattern: '0210-22011',
        weaponType: 'weapon1',
        description:
          '加点灵活。五级时若奶酪位被放飞可先点二级协奏补推。二级礼服增加拆火箭难度，应将加点留到七级，直接升到三级礼服。',
        additionaldescription:
          '若进入墙缝战时未满8级或猫咪破盾能力强，可舍弃三级礼服点三级被动及二级协奏。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'B-夹不住我', 'C-救救我'],
        description:
          '利用精准投射快速刷新礼服CD，速炸火箭，让猫短时间内绑不上火箭，夹不住我可配合2级协奏音符速破夹子。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-绝地反击', 'C-救救我', 'C-不屈'],
        description:
          '知识量不足可带本套卡组。绝地反击可配合共鸣冲击波快速打出高额伤害，不屈增加自保，可换成夹不住我。',
      },
      {
        cards: ['S-铁血', 'S-无畏', 'A-投手', 'C-救救我'],
        description: '米特专用卡组。',
      },
    ],

    skills: [
      {
        name: '风格骤变',
        type: 'active',
        description: '根据演奏风格给予周围友方增益效果。使用技能可切换风格。',
        detailedDescription:
          '根据演奏风格给予周围友方增益效果。使用技能可切换风格，切换时音乐家杰瑞会同时保持上一种风格8秒。点出该技能时风格为协奏。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        // cancelableSkill: '不确定是否可被打断', // FIXME
        cancelableAftercast: ['道具键*', '跳跃键'],
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=408.2',
        skillLevels: [
          {
            level: 1,
            description: '狂想：提升攻击力。\n协奏：获得Hp恢复和加速。',
            detailedDescription: '狂想：提升15点攻击力。\n协奏：获得2.5/s的Hp恢复和12%加速。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '狂想：额外给予击中敌方时回复Hp的效果。\n协奏：额外提升推速和交互速度。',
            detailedDescription:
              '狂想：额外给予击中敌方时回复10Hp的效果。\n协奏：额外提升30%推速和18%交互速度。',
            cooldown: 15,
          },
          {
            level: 3,
            description:
              '狂想：额外降低[技能CD](特技与机器鼠技能不生效)。\n协奏：额外降低周围火箭燃烧速度。',
            detailedDescription:
              '狂想：额外降低18%[技能CD](特技与机器鼠技能不生效)。\n协奏：额外降低50%周围火箭燃烧速度，不可叠加。',
            cooldown: 15,
          },
        ],
      },
      {
        name: '幻风礼服',
        type: 'weapon1',
        description:
          '进行一场忘我演奏，期间获得减伤、可通过移动键进行最多3次快速位移。[再次按下技能键可取消技能](使用技能后的1秒/进行位移后的0.6秒内无法取消技能)。不可交互，可丢道具。',
        detailedDescription:
          '进行一场忘我演奏，期间获得20点减伤、可通过移动键进行最多3次快速位移。[再次按下技能键可取消技能](使用技能后的1秒/进行位移后的0.6秒内无法取消技能)。不可交互，可丢道具。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=286.4',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 18,
          },
          {
            level: 2,
            description: '位移距离和速度提升。提高了拆火箭的难度，故一般与三级礼服一起加点。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '使用技能时获得2层护盾，持续7秒。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '共鸣',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1UDiKeSE63?t=543.5',
        skillLevels: [
          {
            level: 1,
            description:
              '使用技能会触发共鸣冲击波，共鸣范围内可对敌方造成伤害并减速。共鸣叠加3层时对敌方造成僵直（可救下猫咪手中的老鼠）。',
            detailedDescription:
              '使用技能会触发共鸣冲击波(音乐家杰瑞自身2层，范围内队友1层)，共鸣范围内可对敌方造成10点伤害并减速3秒。共鸣叠加3层时对敌方造成1秒僵直（可救下猫咪手中的老鼠；内置CD：10秒），僵直期间猫咪不会受到任何伤害及控制。',
          },
          {
            level: 2,
            description: '5秒内对火箭造成5次共鸣后会摧毁火箭。',
            detailedDescription: '5秒内对火箭造成5次共鸣后会摧毁火箭。被摧毁的火箭60秒后恢复。',
          },
          {
            level: 3,
            description: '共鸣对墙缝造成伤害。',
            detailedDescription: '共鸣对墙缝造成2.9%伤害，但不对泡泡造成伤害。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 蒙金奇 ---------------------------------- */
  蒙金奇: {
    aliases: ['马嘉祺'],
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
        description: '战车自带霸体，冲撞可撞开[绝大多数猫的布局](捕鼠夹、兔八哥萝卜、图多香水等)',
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
      {
        cards: ['S-铁血', 'S-舍己', 'S-缴械', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
    ],
    skills: [
      {
        name: '勇往直前',
        aliases: ['冲撞'],
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
          '消耗全部士气值，召唤拥有独立Hp的战车，每格士气值提升战车3秒持续时间，最多持续20秒。期间免疫控制，获得额外的[战矛投掷技能](前摇0.2秒，对猫咪造成30点固定伤害（无法触发知识卡追风）或对墙缝造成5点固定伤害；CD为2秒)和选择提前脱离战车的临时技能，但无法使用道具、交互或[回复Hp](例外：国王的守护战旗)。当战车Hp归零、持续时间结束、蒙金奇主动脱离时，战车进入5秒自毁倒计时。战车爆炸，对范围内所有单位造成75点爆炸伤害和2秒眩晕、对未脱离战车的蒙金奇造成自身Hp100%的伤害。',
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
    aliases: ['泥巴'],
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
      {
        cards: ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
        description: '待补充',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
        description: '待补充',
      },
    ],

    skills: [
      {
        name: '灵活跳跃',
        aliases: ['翻滚'],
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
        aliases: ['钩子'],
        type: 'weapon1',
        description:
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。',
        detailedDescription:
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。朋友在30秒后自然消失。朋友扔出鱼钩过程中再次点击技能会使朋友将鱼钩收回（有前摇）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=50.7',
        skillLevels: [
          {
            level: 1,
            description: '鱼钩碰到道具会携带之；碰到角色会将其勾回，并救下猫咪手中的老鼠。',
            detailedDescription:
              '鱼钩碰到道具会携带之，碰撞猫咪时造成相应效果；碰到角色会将其勾回，并救下猫咪手中的老鼠。',
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
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 仙女鼠 ----------------------------------- */
  仙女鼠: {
    aliases: ['大表姐'],
    description:
      '仙女鼠来自于神秘的地方，优雅又充满智慧的她，对小老鼠们充满了怜悯。在杰瑞遇到困难的时候，她悄然出现，好像灰姑娘的教母，满足杰瑞的愿望，帮助杰瑞战胜强敌。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 585,
    jumpHeight: 400,
    cheesePushSpeed: 2.8,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '一星造成伤害、八星造成干扰；三级被动击中猫咪强制反向。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '四星帮队友回血；六星将队友变星星。',
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
    ],
    skills: [
      {
        name: '魔镜召唤咒',
        type: 'active',
        description: '召唤魔镜。魔镜处可消耗三星获得道具、消耗六星传送至任意房间（猫咪也可用）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*', '跳跃键'],
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 60,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 40,
          },
          {
            level: 3,
            description: '许愿内容随着许愿次数有概率提高质量。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '仙女棒',
        type: 'weapon1',
        description:
          '自身每7秒获得1颗星星。队友攻击猫咪可获得星星；敌方攻击队友夺取星星。可消耗一定数量的星星来投掷星星（可穿墙），并对命中者施加对应的效果：\n1星：队友隐身；减少猫咪Hp和移速\n2星：队友二段跳；猫咪同1星\n4星：队友缓慢恢复Hp；猫咪同1星\n6星：队友变小星星，免疫虚弱和眩晕；猫咪同1星\n8星：猫咪变为大星星、手上的老鼠掉落',
        detailedDescription:
          '自身每7秒获得1颗星星。队友攻击猫咪可获得星星；敌方攻击队友夺取星星。拖拽技能可消耗一定数量的星星来投掷星星（可穿墙），并对命中者施加对应的效果：\n1星：队友隐身；减少猫咪Hp和移速\n2星：队友二段跳；猫咪同1星\n4星：队友缓慢恢复Hp；猫咪同1星\n6星：队友变小星星，免疫虚弱和眩晕；猫咪同1星\n8星：对队友无效；猫咪变为大星星、手上的老鼠掉落', // 队友别挡我的8星
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键', '跳跃键'],
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
            description: '减少CD。',
            cooldown: 2,
          },
          {
            level: 3,
            description: '提高自身星星增长速度至每5秒1颗。',
            cooldown: 2,
          },
        ],
      },
      {
        name: '魔咒强身',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '不动时获得减伤。受到控制效果时失去减伤。',
          },
          {
            level: 2,
            description: '受到攻击后进入短暂的隐身。',
          },
          {
            level: 3,
            description: '对猫咪造成伤害时，额外造成反向，持续较短时间。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 表演者•杰瑞 ----------------------------------- */
  '表演者•杰瑞': {
    aliases: ['表演者杰瑞', '柠檬杰瑞'],
    description: '来自另一个平行时空的表演者，立志成为最好的表演家',
    maxHp: 124,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 650,
    jumpHeight: 380,
    cheesePushSpeed: 3.25,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '可以铁血换人。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '可以提升队友的推速。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '101002221',
        weaponType: 'weapon1',
        description: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
        description: '待补充',
      },
    ],
    skills: [
      {
        name: '梦幻舞步',
        aliases: ['跳舞'],
        type: 'active',
        description:
          '跳舞并获得霸体，持续20秒，期间[给予附近老鼠推速加成、增加附近猫咪爪刀CD](跳舞10秒后效果增强)、并使隐身的猫咪显形。每次受到伤害，持续时间减少6秒。',
        detailedDescription:
          '跳舞并获得霸体，分为两段，每段10秒。第一段给予附近老鼠50%推速加成，附近猫咪爪刀CD增加20%；第二段改为100%推速加成、爪刀CD增加40%。跳舞可使附近隐身的猫咪显形。每次受到伤害，持续时间减少6秒。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 35,
          },
          {
            level: 2,
            description: '跳舞期间免疫虚弱。',
            cooldown: 35,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 25,
          },
        ],
      },
      {
        name: '柠檬旋风',
        type: 'weapon1',
        description: '',
        canMoveWhileUsing: true,
        canUseInAir: false,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description:
              '对附近的猫咪叠加酸涩效果，减少移速、交互速度并造成伤害，最多叠加5层，当叠满时会猫被控制并受到伤害。可进行5次额外表演，随后可以移动并对碰到的敌方单位叠加3成酸涩。',
            cooldown: 30,
            detailedDescription:
              '释放柠檬旋风，对附近猫咪叠加酸涩效果，每层减少2.5%移速和交互速度、造成15伤害，最多叠加5层。叠满时会猫被控制2秒并受到35伤害。可进行5次额外表演，随后可以移动并对碰到的敌方单位叠加3层酸涩。',
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '使用技能期间快速恢复Hp。',
            cooldown: 20,
            detailedDescription: '使用技能期间以20/s恢复Hp。',
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
            description: '被击倒后可以继续行动5秒。',
            detailedDescription: '被击倒后可以继续行动5秒，但期间不能使用技能或道具。',
          },
          {
            level: 2,
            description:
              '被绑在火箭上时，可爬下火箭并在一段距离内左右移动。其他老鼠在表演者•杰瑞和火箭处均可救援。',
            detailedDescription:
              '被绑在火箭上时，可爬下火箭并在一段距离内左右移动。其他老鼠在表演者•杰瑞和火箭处均可救援。',
          },
          {
            level: 3,
            description:
              '被绑上火箭后，火箭引线不会低于15秒。被放飞后以“局外人”返场，Hp上限为624，且Hp以2/s降低，无法进行大部分交互；血量清空立即放飞，可以用道具键投掷，造成2.5伤害和持续2.5秒的10%减速。',
            detailedDescription:
              '被绑上火箭后，火箭引线不会低于15秒。被放飞后以“局外人”返场，Hp上限为624，且Hp以2/s降低，无法进行大部分交互；血量清空立即放飞，可以用道具键投掷，造成2.5伤害和持续2.5秒的10%减速。',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 魔术师 ----------------------------------- */
  魔术师: {
    aliases: ['二表哥'],
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
        additionalDescription:
          '魔术师和兔子的推速并不占优，不过他可以通过干扰和拉扯来创造推奶酪机会。',
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
        description: '自身等级较高时，可以暂时充当队伍中的救援位。',
        additionalDescription:
          '红牌+兔子先生可较稳定地进行救援。兔子大表哥可以阻止秒飞，但需要魔术师在附近，实战时需进行抉择。',
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
        cards: ['S-铁血', 'S-缴械', 'S-舍己', 'C-救救我'],
        description:
          '通用卡组，缴械既能干扰敌方，也可以配合红牌进行舍己救援。可视情况将舍己换为无畏。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description:
          '通用卡组，不屈提升自保，精准投射配合卡牌的短CD可以频繁进行干扰。若知识量不足，可将精准投射换为夹不住我。',
      },
      {
        cards: ['S-铁血', 'B-幸运', 'B-精准投射', 'C-不屈', 'C-脱身'],
        description: '通用卡组的幸运变种。使用本套卡组需要较高的熟练度和合适的阵容。',
      },
      {
        cards: ['S-铁血', 'S-护佑', 'S-舍己', 'C-救救我'],
        description: '基础卡组，牺牲上限换下限。适合新手，也可应对难以破盾的猫咪。',
      },
    ],
    skills: [
      {
        name: '奇思妙想',
        aliases: ['卡牌'],
        type: 'active',
        description:
          '从三张卡牌中选取一张，投掷命中猫咪时令其传送一小段距离，并禁用技能/急速反向/失重漂浮一段时间。',
        detailedDescription:
          '在1.5秒前摇后，魔术师手中获得一张随机颜色卡牌，同时技能进入5秒读条，期间[每0.5秒按红-黄-蓝的顺序切换卡色](若切换时魔术师正在交互中，则不会切换)；再次点击技能/用道具键投出卡牌/5秒读条结束后，固定卡色且技能进入CD。\n卡牌属于投掷物，投掷初速度固定为2000，穿越所有墙体，命中猫咪时可以触发[以投掷命中为条件的效果](包括知识卡-缴械/精准投射/投手/追风，特技-干扰投掷/勇气投掷)。卡牌也会命中兔子大表哥/森林牧场大鸭子，但[不会触发效果](不会触发卡牌本身的效果，也不会触发以投掷命中为条件的效果，但可触发Lv.1被动)。猫咪受卡牌效果影响期间，免疫其他卡牌效果。魔术师虚弱时，卡牌不会从手中掉落。卡牌被丢弃时，将直接被移除。\n卡牌效果如下：\n通用：使目标向卡牌飞行方向传送80距离，并改变其朝向。\n红牌：立刻受到{65}点伤害并掉落手中道具，6秒内禁用技能且减速18.5%。\n黄牌：[每2秒获得1.5秒反向，同时+150%移速](免疫“香水反向”的技能（如图多Lv.1被动）无法免疫该效果；免疫“反向”的技能（如斯飞被动）可以免疫该效果但不会增加移速)，持续7秒。\n蓝牌：获得8秒失重状态，并且降低跳跃速度，但可在空中进行跳跃。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
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
            description: 'CD降低。',
            detailedDescription: 'CD降低至18秒。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '卡牌命中时为自身提供恢复/隐身/加速效果，命中兔子大表哥时额外减少CD。',
            detailedDescription:
              '卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，自身根据卡色获得效果：\n红色：获得7/s的Hp恢复，持续5秒；\n黄色：获得隐身，持续5秒；\n蓝色：获得30%加速，持续3秒。\n卡牌命中兔子大表哥时，本技能剩余CD减少30%。',
            cooldown: 18,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '兔子先生',
        type: 'weapon1',
        description:
          '召唤兔子先生，可下达救援、搬奶酪、推奶酪、拾取、投掷、治疗或跟随指令。兔子继承魔术师的部分效果。',
        detailedDescription:
          '兔子先生不在场时，在1.9秒前摇后召唤兔子先生；其在场时，技能按键变为释放指令：在0.9秒前摇后，选取[以魔术师为中心，半径1150范围内的一个目标](优先选择优先级高的目标；优先级相同时，选择直线距离近的目标)下达指令；无CD、可移动释放但不可取消前摇。\n指令按优先级从高到低排列如下：\n1.火箭救援-对被绑上火箭的老鼠下达指令：兔子会救援该老鼠。\n2.搬奶酪-对奶酪下达指令：兔子[放下道具并搬起该奶酪](若兔子手中已有另一块奶酪，则不会放下它)。\n3.推奶酪-对[可交互的洞口](有未推入奶酪的洞口，或兔子手持奶酪时的空洞口)下达指令：兔子会[与其交互](兔子手中有奶酪时，他会朝该洞口投掷；洞口有未推入奶酪时，他会开始推奶酪)。\n4.治疗-对虚弱且未处于控制状态中的老鼠下达指令：兔子会治疗该老鼠。\n5.投掷-兔子手中有[投掷道具](不包括奶酪)时，对猫咪/墙缝/小黄鸭下达指令：兔子会近距离对其[连续投掷/使用道具](兔子投掷道具时，如果所在位置有其他道具，他会一并拾取并投掷/使用，直到没有道具可被拾取；兔子可通过这种方式拾取以下特殊道具：冰块/小鞭炮/鞭炮束/玩具枪/遥控器/冰桶/鞭炮堆/药水/电风扇。其中兔子拾取药水后不会使用，而是在一小段时间后原地放下；兔子会以2000的初速度投掷电风扇)。\n6.拾取-对[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/番茄)或高尔夫球下达指令：兔子放下其他道具，并拾取该道具。\n7.跟随-无其他目标时下达指令：无效果。\n兔子先生的属性：Hp上限110，Hp恢复4.5（常态）或2（受伤时），移速820，跳跃550，攻击增伤20，推速1.6%/s，墙缝增伤2。\n兔子先生的特性：\n1.常态：免疫碎片、捕鼠夹、直接抓起和斯派克抓起。搬运奶酪时不会减速，且可[进行交互](如：开门，拔叉子，火箭救援等)。当自身Hp<0/魔术师被抓起或被淘汰时，自身退场并使技能进入CD。在场时会继承魔术师的[“无畏”知识卡](但改为被救者和魔术师获得无畏效果)、[部分食物和药水效果](仅对由常规道具获得的牛奶恢复/蛋糕恢复/隐身/护盾效果生效，不包括远视/兴奋/变大/技能效果/地图道具效果)。其它判断逻辑[与老鼠类似](如：被猫咪攻击时，对方会获得经验；受推速加成；可被治疗)。\n2.指令执行逻辑：指令下达后将[一直生效](只要指令目标满足指令下达时的所需条件，兔子就会执行对应指令)，直到下一条指令被下达。魔术师下达[新指令](与当前指令目标不同或类型不同)/兔子退场时，兔子将传送到魔术师身边；魔术师下达[相同指令](与当前指令目标和类型均相同)时，[指令失效](兔子继续执行当前指令，不会传送到魔术师身边)。当兔子[无事可做](当前指令指定的行为执行完毕，或执行跟随指令)且与魔术师距离超过360/一段时间内未进行交互和移动时，他将跑向魔术师。', //兔子可以以2000的初速度投掷电风扇；兔子基础属性采用了梦回的数据
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
        cooldownTiming: '释放后',
        videoUrl: 'https://www.bilibili.com/video/BV1Qd4y1W7fg/?t=88',
        skillLevels: [
          {
            level: 1,
            description: '', //游戏内Lv.1的描述有误，兔子在场时魔术师并不会额外增加移速
            cooldown: 70,
          },
          {
            level: 2,
            description: '减少CD；提高兔子的Hp上限。升级时召回兔子并重置CD。',
            detailedDescription: '减少CD至40秒；兔子Hp上限增加40。升级时召回兔子并使CD归零。',
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
      },
      {
        name: '兔子大表哥',
        type: 'weapon2',
        description:
          '召唤兔子大表哥，可下达举火箭、指卧撑或保镖指令。兔表哥被卡牌命中时会储存该效果，并在通过技能出拳命中猫咪时对其附加。魔术师虚弱时也可释放本技能。技能在其他老鼠被淘汰时自动升级，但无法主动升级。',
        detailedDescription:
          '兔子大表哥不在场时，在[1.9秒前摇](不可移动释放，可被跳跃键或道具键打断)后[召唤兔子大表哥](兔子大表哥登场时会进行4.5秒的肌肉展示动作，可被移动打断)；其在场时，可拖动技能按键至半径750以内的目标[下达指令](每次下达指令+30表现分，至多+300分，最短间隔5秒)。\n指令按优先级从高到低排列如下：\n1.举火箭-对火箭下达指令：兔子大表哥传送至该火箭位置并将其举起，使其判定和交互位置上移175距离，并且[不再因倒计时归零起飞](仍会因经典之家炸药堆爆炸起飞)，此时[改变部分技能与火箭的互动关系](沙包拳头无法打灭火箭；滑步踢无法踢飞火箭，乾坤袋无法吞火箭；喜剧之王Lv.2无法使表演者·杰瑞从火箭上挣脱，若在举火箭前挣脱则贴图出错)，[其余技能不变](天使祝福、Lv.3鼓舞可正常对火箭上的老鼠生效；火药桶、Lv.2共鸣可正常拆火箭；爱之花洒可浇灭火箭，但释放位置需上移；友情庇护范围内/风格骤变Lv.3范围内/蓝图内的火箭起飞速度会放缓)。单次最多执行60秒。\n2.指卧撑-对地面下达指令：兔子大表哥传送至该处并开始做指卧撑，以自身中轴线距地175处为端点，向面朝方向生成一个[长度为125的平台](该平台贴图位置：兔子大表哥的头顶到腰部)，该平台具有弹性。该状态下兔子大表哥左右各距离80的范围内存在猫咪时，他会[向面朝方向持续出拳](不影响平台及自身实际位置，不会转身)。单次最多执行10秒。\n3.保镖-无其他可选目标时下达指令：兔子大表哥[跟随魔术师](当兔子大表哥与魔术师距离超过360时,他将跑向魔术师)。该状态下兔子大表哥被卡牌命中且魔术师周围1000距离内存在猫咪时，他会传送到该猫咪位置并出拳；兔子大表哥或魔术师被各自距离400内的猫咪攻击时，他会[在靠近猫咪时向其出拳](如果猫咪距离较近，则会直接跑向对方并出拳；如果距离较远或在进行别的动作，则暂时不出拳，而是之后路过猫咪时顺便出拳)；魔术师虚弱且与兔子大表哥距离小于100时，兔子大表哥会在0.5秒前摇后将魔术师踹飞1150距离，动作后摇0.4秒。\n有关“储存卡牌”及“出拳”的信息如下：\n1.储存卡牌：兔子大表哥[可被卡牌命中](卡牌不会击中其他魔术师的兔子大表哥)并[储存该卡牌](兔子大表哥身上会出现所储存卡牌的特效，但他不会受到卡牌效果)60秒，三种卡牌独立计时，受到已有的卡牌时重置其计时。\n2.出拳：在0.5秒前摇后，对面前距离300内的猫咪造成35点伤害，并减速70%，持续1.7秒；出拳[命中猫咪](每次命中+100表现分，至多+1000分)时，会[对其施加储存的其中一种卡牌效果](施加优先级为黄-红-蓝；卡牌效果中的传送方向改为与出拳方向相同；只触发卡牌效果，不会触发Lv.1被动)，并[消耗对应卡牌的储存](单次攻击命中多个目标时，会依次为目标附加不同的卡牌效果，直到储存耗尽；命中已有卡牌效果的猫咪时，也会消耗储存，但不产生效果；未命中目标时，不会消耗储存)。出拳有2.6秒内置CD，所有指令共用。\n兔子大表哥的属性：Hp上限200，Hp恢复3/s，移速820，跳跃550。\\n兔子大表哥的特性：\n1.常规：[免疫眩晕等控制状态](但无法免疫反向、虚弱和森林牧场三角铁等控制效果)。魔术师被放飞时，兔子大表哥会直接退场；魔术师进洞时，其会在魔术师最后的位置原地待命。其它判断逻辑[与友方猫咪相同或类似](如：具有伤害保护；Hp<0时，会虚弱6.9秒且每秒恢复50Hp，并使击杀者获得金钱；魔术师卡牌击中他会算作误伤队友，反复5次会使魔术师-50成就分等)。\n2.指令执行逻辑：兔子大表哥[默认执行保镖指令](兔子大表哥被召唤时/执行的指令中断时，他会自动执行保镖指令)。[魔术师在场](不包括被猫抓起期间)且兔子大表哥与魔术师的距离超过1600时，他会中断当前指令并传送到魔术师身边；魔术师被绑上火箭时，他会自动[对魔术师所在的火箭执行举火箭指令](若该火箭为秒飞火箭，则不执行指令)；[自身或魔术师虚弱时会中断当前指令](若魔术师虚弱时与兔子距离较近，则有概率不中断指令，触发原因不详)。兔子大表哥执行指令时的朝向与收到指令时的朝向一致。兔子大表哥在[执行动作](包括：出场时的肌肉展示；出拳前摇；踹飞魔术师的前后摇；Lv.2挥舞火箭攻击的前摇与后摇；虚弱倒地期间)期间[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n3.指卧撑：指令期间对其他地面位置下达指令时，剩余时间会被继承。[只能选取平台为目标](可选取斜面平台为目标，但无法选取场景组件（如吊灯）上的平面为目标；某些地板（如太空堡垒I的武器舱地板）视作场景组件，但下方通常有平台，可尝试将指令释放位置下移)。\n4.举火箭：[火箭位置随兔子大表哥移动](兔子大表哥举火箭期间因道具或技能而位移时，火箭的交互和判定位置会一同移动；兔子大表哥放下火箭时，火箭会传送回原位)。指令期间对其他火箭[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n魔术师虚弱时也可释放本技能。\n本技能在1/2只老鼠[被淘汰](若老鼠因技能复活，则复活体被淘汰时才算真正被淘汰)时自动升至Lv.2/Lv.3，但无法主动升级。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        videoUrl: '',
        skillLevels: [
          {
            level: 1,
            description: '魔术师推速提高。',
            detailedDescription:
              '魔术师[推速提高3%/s](固定值加成，不受其他推奶酪百分比加/减速影响)。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且举火箭期间会自动攻击。魔术师推速和救援速度进一步提高。',
            detailedDescription:
              '兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且获得新能力：举火箭期间，受到猫咪伤害时或身旁100范围内有猫咪时，兔子大表哥在0.7秒前摇后[挥舞火箭](不影响火箭判定与交互位置)对身旁100范围内的所有目标[造成35点伤害](与出拳动作不同，不会对目标施加卡牌效果)，向身侧击退100距离并向上击飞250距离，攻击后摇0.5秒。改为使魔术师[推速提高6%/s](固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高50%。',
            cooldown: 5,
          },
          {
            level: 3,
            description:
              '兔子大表哥[改变外观](原皮贴图：戴上魔术帽，穿上条纹马甲)，新增主动出拳指令，出拳可以对墙缝造成伤害。魔术师免疫[受伤](被猫咪攻击时附加的状态，效果为停止自然Hp恢复且减速5%)，且极大提高推速和救援速度。',
            detailedDescription:
              '兔子大表哥[改变外观](原皮贴图：戴上魔术帽，穿上条纹马甲)，新增指令：[主动出拳-对猫咪或墙缝下达指令](该指令优先级高于指卧撑，低于举火箭)：兔子大表哥传送到目标位置并立即出拳，[该指令出拳有10秒内置CD](内置CD期间释放该指令则兔子传送后不会出拳，但技能仍进入CD；释放其他指令时该内置CD归零)。[出拳](包括：指卧撑出拳，保镖状态出拳和主动出拳)可以[对墙缝造成17点伤害](无法攻击墙缝上的泡泡)。魔术师免疫[受伤](被猫咪攻击时附加的状态，效果为停止自然Hp恢复且减速5%)。改为使魔术师[推速提高18.75%/s](该加成为固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高150%。',
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
            description:
              '卡牌命中时，手中会出现一张新卡牌（有内置CD）；还会减少所有技能CD并获得经验。',
            detailedDescription:
              '主动技能的卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，[获得一张随机颜色的新卡牌](若此时魔术师手中有道具，则不触发该效果，也不进入CD)（[该效果有30秒内置CD](吃蛋糕也会减少该CD)）；还会减少主动与武器技能CD各10秒，同时获得两次（400/己方存活人数）点经验。',
          },
          {
            level: 2,
            description:
              '卡牌命中后，自身投掷的下一个[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)命中猫咪时对其附加卡牌效果。',
            detailedDescription:
              '主动技能的卡牌命中[任意目标](包括：猫咪/兔子大表哥/森林牧场大鸭子)时，若魔术师[手中的道具](如果此时魔术师手中没有道具，则为下一个道具)是[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)，则它被魔术师投掷命中[其他角色](包括猫咪和被冰块误伤的其他老鼠，不包括兔子大表哥等)时，额外[为该角色附加卡牌效果](卡色取决于上一次命中的卡牌；只触发卡牌效果，不会触发Lv.1被动)，[直到魔术师获得下一张卡牌](被该技能影响的道具被放下/被装入蓝白花瓶中时，效果依然存在；魔术师获得新卡牌时，上一个被该技能影响的道具的效果会被清除)；若该道具不是[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)，则无事发生。',
          },
          {
            level: 3,
            description:
              '受到致命伤害时，有低概率消耗手中的魔术卡牌或[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)，然后免疫当次伤害。',
            detailedDescription:
              '当魔术师即将进入虚弱状态时，若手持魔术卡牌或[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)，则有35%的概率消耗该道具并[免疫这次虚弱](仍会受到伤害和其他效果，如受伤、减速和眩晕等)。', //参考了梦回的数据
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
