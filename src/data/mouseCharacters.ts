import { AssetManager } from '../lib/assetManager';
import { processCharacters } from '../lib/skillIdUtils';
import type { CharacterDefinition } from './types';

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
      {
        cards: ['S-无畏', 'S-铁血', 'A-团队领袖', 'C-救救我'],
        description: '新手未解锁+1知识量可用，以及针对米特。解锁后可将团队领袖换为缴械。',
      },
    ],
    skills: [
      {
        name: '鼓舞',
        type: 'active',
        description: '短暂为自己和附近队友提供增益。',
        detailedDescription:
          '前摇0.5s，后摇1s。短暂为自己和附近队友[提供增益](等级相同的鼓舞不可叠加，但等级不同的鼓舞可以叠加)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=66.5',
        skillLevels: [
          {
            level: 1,
            description: '增加移速和跳跃高度。',
            detailedDescription: '增加15%移速和45%跳跃高度，持续5秒。',
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
        detailedDescription: '前摇0.8s，后摇0.6s，举起大铁锤近身攻击。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        // 事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '不可取消后摇',
        canHitInPipe: true,
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=104.4',
        skillLevels: [
          {
            level: 1,
            description: '眩晕猫咪3秒。',
            detailedDescription: '[眩晕猫咪3秒](不会在猫的状态栏显示)。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '减少CD；额外造成伤害；每次命中永久提升10%推速。',
            detailedDescription:
              '减少CD；额外造成{65}伤害；每次[命中猫咪](包括虚弱、霸体或无敌的猫咪)永久提升10%推速，最多叠五层。',
            cooldown: 16,
          },
          {
            level: 3,
            description: '减少CD；眩晕时间延长至4秒。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '鸟哨',
        type: 'weapon2',
        description: '召唤金丝雀投掷炸弹，造成伤害和眩晕。',
        detailedDescription:
          '前摇1s，后摇1s，召唤金丝雀投掷炸弹，造成{55}伤害和2秒眩晕。同一房间内最多只能有一只投掷炸弹的金丝雀。猫咪被金丝雀的炸弹命中后将对其短暂免疫。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=125.5',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '金丝雀存在12s，每隔0.8s投掷一枚炸弹，总共15±1枚。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '缩短金丝雀投掷炸弹的间隔。',
            detailedDescription: '缩短金丝雀投掷炸弹的间隔至0.75s，总共17±1枚。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '减少CD；进一步缩短金丝雀投掷炸弹的间隔。',
            detailedDescription: '减少CD；进一步缩短金丝雀投掷炸弹的间隔至0.6s，总共20±1枚。',
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
            detailedDescription: '增加30%推速',
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
              '奶酪被推完或墙缝被破坏到80%、60%、40%、20%、0%时，解除虚弱和受伤、回复20Hp、并获得13%加速，持续2.7秒。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description: '适配大铁锤较长前摇',
      },
      {
        name: '魔术漂浮',
        description: '杰瑞所有技能均可中断漂浮，灵活性高',
      },
    ],
    aliases: ['撅瑞'],
    counteredBy: [
      {
        id: '侍卫汤姆',
        description: '',
        isMinor: true,
      },
      {
        id: '汤姆',
        description: '杰瑞技能前后摇较长，且鼓舞不能取消后摇，易被汤姆抓空档',
        isMinor: true,
      },
    ],
    collaborators: [],
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
        description:
          '四级时，如果需要团推且猫不在附近，可先点二级烟雾弹；如果不清楚猫的位置则点二级隐身。',
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
            description: '隐身持续更久；隐身状态下持续恢复Hp。',
            detailedDescription: '隐身持续15秒；隐身状态下额外以1.67/s恢复Hp。', //FIXME: not sure about the recovery rate
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
            cooldown: 12,
          },
          {
            level: 3,
            description: '战旗被召唤时即为强化状态。',
            cooldown: 12,
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
    specialSkills: [
      {
        name: '干扰投掷',
        description: '',
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
        canHitInPipe: false,
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
        canMoveWhileUsing: false,
        canUseInAir: false,
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
        pattern: '1313[30]001',
        weaponType: 'weapon2',
        description: '进墙缝期时再点三级感应雷。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'B-绝地反击', 'C-救救我'],
        description: '高风险高收益，卡残血伤害高，适合打不带皮糙肉厚的猫',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
        description: '防止前期3级时白给',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-吃货', 'B-食物力量', 'C-救救我'],
        description:
          '速推卡，打死守猫用，带这套卡只用点一级炮，优先点出二被，利用五层食物力量、有吃货加强下的一被加血、二被减伤快速回血加推奶酪减伤，可以强推，特技推荐带治疗或自起',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description:
          '用来打依赖爪刀或有无敌霸体技能的猫。缴械可以在一定程度上防止霸体反杀，特别是泰菲不能自主取消武器后摇。缴械和火箭筒的冷却都是三十秒，控制好可以让每一炮都附带缴械。',
        detailedDescription: '',
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
            detailedDescription:
              '滚动时处于[无敌状态](无敌时间略少于滚动时间)；滚动结束后极短暂地提升跳跃高度。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '滚得更快更远。',
            detailedDescription: '翻滚时间提升至1.4秒；期间速度提升增加至105%。',
            cooldown: 12,
          },
        ],
        aliases: ['无敌'],
        cueRange: '全图可见',
      },
      {
        name: '火箭筒',
        type: 'weapon1',
        description: '发射一枚弹头，造成伤害和眩晕。',
        canMoveWhileUsing: true,
        canUseInAir: true,
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
            description: '可以储存两枚弹头。',
            cooldown: 30,
          },
        ],
        aliases: ['炮'],
        cancelableSkill: '不可被打断',
        canHitInPipe: false,
        cueRange: '全图可见',
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
            description: '提高吃食物速度；牛奶加速生效期间，暂时提升25点Hp上限。',
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
    counters: [
      {
        id: '剑客汤姆',
        description: '',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '用来打卡视野漂浮落炮或踏空骗刀落炮',
      },
      {
        name: '绝处逢生',
        description: '可以用来硬抗控制效果及排夹，在解控瞬间开启圆滚滚来避免受到二次伤害或控制',
      },
      {
        name: '冰冻保鲜',
        description: '在冰冻保鲜结束的一瞬间开启圆滚滚，打猫一个出其不意，顺便骗出猫的攻击手段',
      },
      {
        name: '勇气投掷',
        description:
          '泰菲技能CD长，可以配合精准投射知识卡进行双减，增强续航牵制能力（该打法已不流行，因为许多人觉得泰菲本质上是个奶酪位）',
      },
      {
        name: '急速翻滚',
        description: '配合圆滚滚可以打出类似第五人格的双弹加速',
      },
      {
        name: '应急治疗',
        description: '常用于打米特，舍己跳救圆滚滚后秒点治疗，防止被胡椒粉毒死',
      },
      {
        name: '干扰投掷',
        description:
          '用来打出干扰投掷接炮，提高炮命中率（注意不要手快取消投掷），用于打速度快导致炮不易命中的猫',
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
        description: '头盔的长时间防御使得剑客泰菲具有十分优秀的救援能力。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        isMinor: false,
        description:
          '头盔的全体无敌可支持强推，后期也能用无敌砸墙。长枪可以带走夹子，也可以携带队友绕后进攻（如船长室）。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        weapon: 2,
        isMinor: false,
        description: '携带剑客长枪的剑客泰菲具有较强的机动性和干扰能力。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        isMinor: false,
        description:
          '2级及以上且有勇气的长枪可以解除队友和自己的受伤和虚弱效果，也可以带着队友转移',
        additionalDescription: '',
        weapon: 2,
      },
      {
        tagName: '后期',
        isMinor: true,
        description: '后期6级8级带来的减少cd和护盾的质变能对长枪剑菲带来很强的后期作战能力',
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
          '适合头盔的机动性卡组。飞跃提升机动性，绝反在救下人后极大提高容错率，绝反可换逃之夭夭。新手未解锁21知识点可舍弃绝反。',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'B-绝地反击', 'B-精准投射'],
        description:
          '适合长枪的高伤卡组。对低血量猫对策卡，精准投射可连控。新手未解锁21知识点可舍弃绝反。',
      },
    ],
    skills: [
      {
        name: '勇气冲刺',
        type: 'active',
        description: '向前猛烈一刺，并恢复少量勇气。会对猫咪造成伤害，但消耗一定的勇气。',
        detailedDescription:
          '前摇0.2s，向前猛烈一刺，期间加速50%，并恢复少量勇气。会对猫咪造成{40}伤害，但消耗一定的勇气。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableAftercast: '不可取消后摇',
        cooldownTiming: '释放后',
        cancelableSkill: '不可被打断',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 1.5,
          },
          {
            level: 2,
            description: '冲刺将造成减速；在短时间内击中猫咪5次后，使猫咪眩晕并受到额外的伤害。',
            cooldown: 1.5,
            detailedDescription:
              '冲刺将造成减速，持续4.8s，在减速期间再次命中将[叠加](覆盖原有减速效果)：第一层4.5%，第二层9%，第三层13.5%，第四层18%。该减速期间内击中猫咪5次后，使猫咪眩晕2.8s并受到额外的{25+25}伤害（受减伤机制影响后为40），同时清除减速效果。',
          },
          {
            level: 3,
            description: '眩晕条件减少到3次。',
            cooldown: 1.5,
            detailedDescription:
              '冲刺将造成减速，持续4.8s，在减速期间再次命中将[叠加](覆盖原有减速效果)：第一层4.5%，第二层9%。该减速期间内击中猫咪3次后，使猫咪眩晕2.8s并受到额外的{25+25}伤害（受减伤机制影响后为40），同时清除减速效果。',
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '头盔',
        type: 'weapon1',
        description:
          '举起头盔保护自己和队友，期间无敌，但惯性增大；小范围内的队友也无敌，但不能使用技能。头盔受击会减少0.5s；救下队友后头盔剩余时间减半。',
        detailedDescription:
          '前摇1.5s，举起头盔保护自己和队友，期间无敌，但惯性增大、移速降低3.5%、跳跃速度降低15%；小范围内的队友也无敌，但不能使用技能。头盔[受击](包括爪刀、道具、技能、来自友方的伤害)会减少0.5s；救下队友后头盔剩余时间减半。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        canHitInPipe: false,
        cancelableAftercast: '无后摇',
        cancelableSkill: '不可被打断',
        cooldownTiming: '释放时',
        skillLevels: [
          {
            level: 1,
            description: '头盔持续7.8s。',
            cooldown: 15,
          },
          {
            level: 2,
            description: '延长头盔的持续时间。',
            cooldown: 15,
            detailedDescription: '延长头盔的持续时间至12.8s。',
          },
          {
            level: 3,
            description: '头盔可以[更灵活地移动](不再受惯性影响，不会降低移速和跳跃速度)。',
            cooldown: 15,
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '剑客长枪',
        type: 'weapon2',
        description:
          '蓄力投掷长枪。蓄力期间获得远视。蓄力时间越长，投掷速度越快、距离越长。长枪对触碰的敌方造成伤害和减速。投掷后，短时间内可再次点击技能瞬移到长枪尾部跟随飞行。长枪碰到队友后，可携带1名友方进行飞行。期间剑客泰菲和友方均可通过跳跃键、道具键、药水键离开。飞行中碰到易碎道具和打开的捕鼠夹，也会挂着该道具飞行。长枪在碰到墙壁、地面、向下碰到平台时将消失。',
        detailedDescription:
          '前摇0.15s，蓄力投掷长枪。蓄力期间视野扩大到原来的2倍，同时清除原有的视野提升效果。蓄力时间越长，投掷速度越快、距离越长。蓄力至最大值需0.8s。长枪对触碰的敌方造成{60}伤害和20%减速，持续2.4s。在投掷后的1.8s内，可再次点击技能瞬移到长枪尾部跟随飞行。长枪碰到队友后，可携带1名友方进行飞行，期间剑客泰菲和友方均可通过跳跃键、道具键、药水键离开，受到眩晕或虚弱会强制离开。飞行中碰到易碎道具和打开的捕鼠夹，也会挂着该道具飞行。长枪最大存在时间为9.9s，在碰到墙壁、地面、向下碰到平台时将消失。长枪消失或剑菲上长枪后技能进入CD。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '长枪速度大幅提高，蓄力超过2/3时会对敌方造成额外控制效果。在勇气释放过程中，长枪命中猫咪时将使其无法使用技能并掉落手中道具、带飞友方时解除其受伤和虚弱。',
            cooldown: 8,
            detailedDescription:
              '长枪速度大幅提高，蓄力超过2/3但未到最大值时，命中敌方效果改为[造成2.8s眩晕](不会减速)；蓄力达到最大值时改为[造成2s眩晕](不会减速)。在勇气释放过程中，长枪命中猫咪时将使其无法使用技能4.8s并掉落手中道具，带飞友方时解除其受伤和虚弱。',
          },
          {
            level: 3,
            description: '在勇气释放过程中，本技能CD减少至4秒。',
            cooldown: 8,
          },
        ],
        cooldownTiming: '释放后',
        cancelableSkill: ['道具键*'],
        cueRange: '本房间可见',
      },
      {
        name: '勇者无惧',
        type: 'passive',
        description:
          '勇气值机制：\n没有勇气期间不会被狗抓、禁用冲刺和头盔、勇气值自然增加；\n有勇气期间会被狗抓、解锁冲刺和头盔、攻击增加、勇气值自然消耗。大多数交互行为都能增加勇气值。',
        detailedDescription:
          '勇气值机制：没有勇气期间不会被狗抓、禁用冲刺和头盔、勇气值自然增加，充满需26.9s；有勇气期间会被狗抓，解锁冲刺和头盔，攻击增加15点，勇气值自然消耗，耗完需49.9s。大多数交互行为都能增加勇气值。',
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
            detailedDescription:
              '每当勇气值达到最高时，解除自身受伤状态，并获得一个持续9.8s的护盾。（无内置CD）',
          },
        ],
      },
    ],
    collaborators: [
      {
        id: '音乐家杰瑞',
        description: '仅限长枪。长枪上的音乐家杰瑞释放礼服可让长枪强制位移，对猫造成极高爆发伤害。',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '补充头盔高点救人能力和自保，也可以为长枪拉开身位蓄力',
      },
      {
        name: '绝处逢生',
        description: '能在头盔内回复大量生命，也可以提高长枪的低下限',
      },
      {
        name: '干扰投掷',
        description: '和长枪形成连控',
      },
    ],
  },

  /* ----------------------------------- 牛仔杰瑞 ----------------------------------- */
  牛仔杰瑞: {
    description:
      '牛仔杰瑞拥有很高的音乐天赋，擅长使用吉他鸣奏，热爱自由的他，在草原上过着与世无争的生活。',
    maxHp: 124,
    attackBoost: 10,
    hpRecovery: 1.67,
    moveSpeed: 650,
    jumpHeight: 400,
    cheesePushSpeed: 3.2,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: true,
        description: '基础推速中上，二级琴加推速。',
        additionalDescription: '二级琴加速后推速达到5.5%每秒，且琴真空期只有5秒。',
      },
      {
        tagName: '干扰',
        isMinor: true,
        description:
          '仙人掌和琴的干扰，但比较偏后期，同时也不是强控，无法直接把老鼠从猫手上救下来。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        isMinor: false,
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
        description: '优先二级琴补推，随后出仙人掌加强干扰能力，再点三被加强整体眩晕能力。',
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
        description: '牛仔杰瑞一被免疫碎片，防止回家护盾被碎片打破，进一步提高后期生存能力。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description: '应对依赖爪刀的猫，例如苏瑞，天汤，托普斯。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-投手', 'C-不屈', 'C-救救我'],
        description: '应对依赖乘胜追击的猫，例如斯飞，前期就可以有很好的减速效果。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description:
          '逃窜提高容错，加血在部分情况下可以抗住天汤三次伤害，在被牛汤弹弓打中时也方便跑路。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-夹不住我', 'C-救救我', 'C-不屈'],
        description:
          '破夹专用，也是一个性价比较好的20点卡组。有21点后剩下费用也可以根据情况搭配别的。',
      },
    ],
    skills: [
      {
        name: '仙人掌',
        type: 'active',
        description: '',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description:
              '放置仙人掌，猫咪踩中受到僵直、减速和持续伤害，同时仙人掌消失。鼠方踩踏两次后仙人掌也会消失。',
            detailedDescription:
              '前摇0.65s，放置仙人掌，持续90秒。猫咪踩中受到1.2s僵直、15%减速、7.5/s的伤害，[持续3s](只造成两次伤害)，同时仙人掌消失。同一目标3秒内不会重复触发；减速最多叠加3层。所有老鼠不受仙人掌的影响，但鼠方踩踏两次后仙人掌消失。',
            cooldown: 18,
          },
          {
            level: 2,
            description:
              '可存储2个仙人掌，且减速和伤害效果加强。被踩中后会分裂为3个效果稍弱的小仙人掌。',
            cooldown: 18,
            detailedDescription:
              '可存储2个仙人掌，效果提升至20%减速、10/s的伤害，[持续5s](只造成四次伤害)。仙人掌被踩中后会分裂为3个小仙人掌，猫咪踩中受到0.8s的僵直、13%减速、7.5/s的伤害，[持续3s](只造成两次伤害)；减速最多叠加三层；小仙人掌的减速与持续伤害与大仙人掌独立计算，同时小仙人掌继承大仙人掌的持续时间。小仙人掌被鼠方踩踏两次后消失，大仙人掌老鼠踩一次就会分裂。',
          },
          {
            level: 3,
            description: '仙人掌效果进一步提升。',
            cooldown: 18,
            detailedDescription: '仙人掌效果提升至2.2s僵直、25%减速、[持续10s](只造成九次伤害)。',
          },
        ],
        cueRange: '全图可见',
      },
      {
        name: '牛仔吉他',
        type: 'weapon1',
        description:
          '可左右拖动和原地释放，弹琴并向拖动方向移动。猫听到音乐会受到短暂僵直，持续听到音乐后会受到减速并持续降低Hp。',
        detailedDescription:
          '前摇0.9s，可左右拖动和原地释放，弹琴并向拖动方向移动，期间保留惯性。猫首次听到音乐时会陷入1s的僵直，[持续听到音乐](0.5s)后会受到35%减速并以15/s降低Hp，持续2.8s。弹琴可通过跳跃和移动键主动结束释放；空中释放会立刻解除；最多持续弹奏5s。后摇0.8s。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 15,
          },
          {
            level: 2,
            description:
              '提升音乐的范围。弹奏结束后解除不良状态并获得移速、跳跃高度、Hp恢复和推速加成。',
            cooldown: 15,
            detailedDescription:
              '提升音乐的范围。弹奏结束后解除受伤、失明、反向、吻痕等状态，获得15%加速、跳跃高度提高50%、Hp恢复提高1.25/s、推速提升1.5%/s，持续10s。',
          },
          {
            level: 3,
            description: '猫咪持续听到音乐会陷入眩晕。',
            cooldown: 15,
            detailedDescription:
              '猫咪持续听到音乐时，每秒叠加一层减速，两层时清空层数，受到35点伤害并[眩晕1.4s](内置CD：10s)、掉落手中老鼠。',
          },
        ],
        cancelableAftercast: ['跳跃键', '移动键', '道具键'],
        cueRange: '本房间可见',
        cancelableSkill: ['其他技能键', '跳跃键'],
      },
      {
        name: '西部风情',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description:
              '无视碎片、烫伤和[冰箱减速](不免疫冰冻和嫦娥冰减速)效果，并缩短受到的眩晕效果。',
            detailedDescription:
              '无视碎片、烫伤和[冰箱减速](不免疫冰冻和嫦娥冰减速)效果，并缩短35%受到眩晕的持续时间。',
          },
          {
            level: 2,
            description: '技能造成控制效果后获得弱霸体，并提升救援速度。',
            detailedDescription:
              '主动和武器技能造成控制效果后获得5s[弱霸体](会免疫部分正面buff，例如隐身)，并提升20%救援速度。',
          },
          {
            level: 3,
            description: '技能对猫控制时间提高50%。',
            detailedDescription: '主动和武器技能对猫控制时间提高50%。',
          },
        ],
      },
    ],
    aliases: ['牛杰'],
    specialSkills: [
      {
        name: '冰冻保鲜',
        description:
          '一被配合冰冻保鲜可以有一秒多的无敌，部分情况下可以挡致命伤害，同时可以强救，但不好走。',
      },
      {
        name: '魔术漂浮',
        description: '仙人掌和琴都可以主动取消漂浮，通用性强',
      },
      {
        name: '干扰投掷',
        description: '增强干扰能力',
      },
    ],
    counters: [
      {
        id: '莱特宁',
        description: '牛仔杰瑞可以通过仙人掌防止闪现刀，且莱特宁本身怕干扰、难以处理124Hp老鼠',
        isMinor: false,
      },
      {
        id: '库博',
        description: '库博怕干扰，容易被牛仔杰瑞的僵直打掉蓄势，同时还会被传送点位的仙人掌拖延时间',
        isMinor: false,
      },
      {
        id: '侍卫汤姆',
        description: '侍卫怕干扰，容易被牛仔杰瑞的僵直打掉蓄势',
        isMinor: true,
      },
      {
        id: '剑客汤姆',
        description: '剑客汤姆怕干扰，不好上火箭，同时牛仔杰瑞的霸体免疫挑起',
        isMinor: false,
      },
      {
        id: '图茨',
        description: '图茨怕干扰，不好处理火箭仙人掌，喵喵叫也会被仙人掌打断',
        isMinor: true,
      },
      {
        id: '米特',
        description: '米特怕干扰，不好处理火箭仙人掌',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '汤姆',
        description: '汤姆的无敌免疫控制，二级平底锅处理124血量',
        isMinor: false,
      },
      {
        id: '苏蕊',
        description: '苏蕊跳舞时被控影响较小 而且可以绕过火箭下的仙人掌',
        isMinor: false,
      },
      {
        id: '托普斯',
        description:
          '托普斯的捕虫网无视牛仔杰瑞的霸体，同时托普斯三级分身在附近时拥有霸体，不会被控。',
        isMinor: false,
      },
    ],
    collaborators: [
      {
        id: '航海士杰瑞',
        description: '牛仔软控配合海盗硬控',
        isMinor: true,
      },
    ],
  },

  /* ----------------------------------- 恶魔泰菲 ----------------------------------- */
  恶魔泰菲: {
    aliases: ['恶菲'],
    description:
      '迷人又危险的小恶魔泰菲！为了帮助玩具城的国王杰瑞，恶魔泰菲挺身而出，将霸占玩具国的邪恶猫咪团的猫咪们耍得团团转，成功拯救了玩具国的子民们。',
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
        id: '恶魔之角',
        pattern: '01020[12][12]2',
        weaponType: 'weapon1',
        description: '一武加点。',
      },
      {
        id: '小淘气1',
        pattern: '03030[13]11',
        weaponType: 'weapon2',
        description: '二武常见加点。',
      },
      {
        id: '小淘气2',
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
        description: '二武恶菲推荐卡组。投手提高牵制能力，绿色小恶魔可以快速叠夹不住我层数。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description: '没21点知识量时的推荐，缴械配合蓝恶魔让猫变白板。',
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
        description:
          '释放小淘气们影响附近道具。\n易碎道具变成蓝色小恶魔：自动索敌，命中时造成伤害并使敌方3秒内无法使用技能和道具；\n控制道具变成红色小恶魔：可穿墙投掷，命中时向右击退敌方；\n高尔夫球变成绿色小恶魔：有比高尔夫球有更大的弹性，命中敌方不会消耗黑暗印记。\n此外，小淘气还可以影响[捕鼠夹](指未打开的捕鼠夹)和奶酪；捕鼠夹受影响会立刻打开；奶酪受影响后变轻、拾取后加速、并可投掷进洞。\n所有小恶魔道具均可以被猫鼠双方使用。',
        detailedDescription:
          '释放小淘气们影响附近道具。\n易碎道具变成蓝色小恶魔：被投掷后留在原地自动索敌，命中时造成20[基础伤害](会受攻击增伤的影响，例如被恶魔泰菲投掷时的实际伤害为35)，并使敌方3秒内无法使用技能和道具，；\n控制道具变成红色小恶魔：[投掷轨迹为一条直线，可穿墙](无法穿越部分实体类的墙体，如地面及部分障碍物等)，命中时向右击退敌方；\n高尔夫球变成绿色小恶魔：有比高尔夫球有更大的弹性，且命中敌方不会消耗黑暗印记。\n此外，小淘气还可以影响[捕鼠夹](指未打开的捕鼠夹)和奶酪；捕鼠夹受影响会立刻打开；奶酪受影响后变轻、拾取后加速、并可投掷进洞。\n所有小恶魔道具均可以被猫鼠双方使用。',
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
            detailedDescription: 'CD减少5秒。',
          },
          {
            level: 3,
            description:
              '小淘气可以选中墙缝为目标：持续减少墙缝耐久，并使墙缝在受到攻击后额外减少耐久。',
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
            description: '最多叠三层印记；三层印记时，大幅增加攻击增伤。',
            detailedDescription: '最多叠三层印记；三层印记时，攻击增伤增加100。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '托普斯',
        description: '托普斯血量较低。',
        isMinor: true,
      },
      {
        id: '牛仔汤姆',
        description: '恶菲机动性高，并且能回血和远程消耗。',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '库博',
        description: '新增关系描述',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '提高机动性。',
      },
      {
        name: '绝处逢生',
        description: '用于自保或破坏老鼠夹。',
      },
    ],
  },

  /* ----------------------------------- 雪梨 ----------------------------------- */
  雪梨: {
    description: '雪梨是温柔可爱的女孩子，喜欢一切美好的东西。',
    maxHp: 99,
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 680,
    jumpHeight: 380,
    cheesePushSpeed: 3.8,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '辅助',
        isMinor: false,
        description: '为队友回复Hp、远程治疗',
        additionalDescription: '',
      },
      {
        tagName: '砸墙',
        isMinor: false,
        description: '花洒配合高尔夫快速破墙',
        additionalDescription: '',
        weapon: 1,
      },
      {
        tagName: '救援',
        isMinor: true,
        description: '花洒搭配精准投掷可以无限浇灭火箭；花束+舍己，救下队友后双方均有较高Hp',
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
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'C-不屈', 'C-救救我', 'B-精准投射'],
        description: '花洒卡组，精准投射可刷新花洒CD，持续浇灭火箭',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'S-舍己', 'C-相助', 'C-不屈'],
        description: '花洒花束皆可',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'C-救救我', 'C-不屈', 'B-绝地反击'],
        description: '辅助救人',
      },
    ],
    skills: [
      {
        name: '爱心之吻',
        type: 'active',
        description:
          '附近有队友时可使用技能。吻出一个爱心飘向最近的队友，队友被爱心触碰后与雪梨建立友好关系，持续恢复Hp；友好关系持续20s后，同伴额外获得全面的强化效果，同时免疫反向和失明，直到友好关系中断。友好关系期间，雪梨可通过特殊技能按键[远程治疗同伴](每次建立关系只可使用一次，可被打断。CD：5s。)，且若雪梨隐身，则双方都隐身。',
        detailedDescription:
          '自身半径范围1800内有队友时可使用技能。前摇1s，后摇0.5s，原地吻出一个爱心，存在[20秒](超时后自爆)，会以650的速度追踪周围半径1500内的[队友](包括火箭上的队友和机械鼠，但不会与机械鼠建立友好关系)。队友被爱心触碰0.2s后，与雪梨的距离在2400之内则建立友好关系。与雪梨建立友好关系的队友将额外提高2.5/s的Hp恢复；友好关系持续20s后，同伴额外获得全面的强化效果：攻击力提高15，移速、跳跃速度提高10%，推速提高30%，Hp上限提高25，同时免疫反向和失明，直到友好关系中断。友好关系期间，雪梨可通过特殊技能按键[远程治疗同伴](每次建立关系只可使用一次，可被打断。享受被动增益。CD：5s。)，且若雪梨隐身，则[双方都隐身](双方隐身持续时间相同；例外是恶魔杰瑞的门提供的隐身，在同伴身上只会持续1秒)。\n解除友好关系的方式：1、再次使用主动技能；2、使用花束被其他队友接到；3、其中一方被猫咪或斯派克抓住，或进机械鼠；4、双方距离超过2400。',
        canMoveWhileUsing: false,
        canUseInAir: false,
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
              '减少CD；友好关系期间，同伴的Hp恢复效果提升，并在Hp大于一半时免疫直接抓取效果。',
            cooldown: 14,
            detailedDescription:
              '减少CD至14s；建立友好关系时，同伴立即恢复25Hp，并解除受伤；友好关系期间，同伴的Hp恢复效果提升至5/s，并在Hp大于一半时免疫直接抓取效果。',
          },
          {
            level: 3,
            description:
              '减少CD；强化效果所需时间降低至10s，进入强化状态后同伴额外回复Hp、提高Hp上限。',
            cooldown: 10,
            detailedDescription:
              '减少CD至10s；强化效果所需时间降低至10s，进入强化状态后同伴额外回复20Hp、提高50点Hp上限。',
          },
        ],
        cancelableSkill: ['道具键*'],
        canHitInPipe: false,
        cancelableAftercast: ['道具键*'],
        cueRange: '本房间可见',
      },
      {
        name: '爱之花洒',
        aliases: [],
        type: 'weapon1',
        description:
          '在地面放置花洒，范围内的队友持续恢复Hp并解除反向和失明。花洒还能减速猫咪、浇灭鞭炮、熄灭火箭。',
        detailedDescription:
          '前摇0.5s，在地面放置花洒，持续5s。花洒每个方向水流范围为175，初始方向为双向，可通过交互[改变水流方向](前摇1s，顺序为双向→右→左)，花洒范围内的队友以10/s持续恢复Hp、解除反向和失明；对雪梨自身效果提高至15/s。花洒可浇灭鞭炮、熄灭火箭。花洒水流带有受力效果(双头花洒、右花洒的力向右，左花洒的力向左；猫受力的移速为25；道具受力较大)，并使范围内猫咪减速25%。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 12,
          },
          {
            level: 2,
            description: '花洒持续时间增加。',
            cooldown: 12,
            detailedDescription: '花洒持续时间增加至7.6s。',
          },
          {
            level: 3,
            description: '单向水流范围变大。',
            cooldown: 12,
            detailedDescription: '单向水流范围提升至500。',
          },
        ],
        cueRange: '本房间可见',
      },
      {
        name: '爱心花束',
        type: 'weapon2',
        description:
          '投掷爱心花束，为命中的队友回复Hp，并弹向最近的另一个队友。若首先命中的队友已建立友好关系，则双方额外回复Hp，且双方各获得一个[传送技能](点击技能后立刻以1750速度飞向同伴，传送期间获得无法被任何道具、技能命中)。若已建立友好关系，但花束首先命中的不是友好关系的队友，则与之建立友好关系并获得传送技能、之前的友好关系消失。',
        detailedDescription:
          '前摇0.3s，投掷爱心花束，飞行速度650，无视平台，但会被地板墙壁阻挡。花束为命中的队友回复50Hp，若附近半径1250内还有其他队友，将以2000的速度弹向最近的队友，最多弹射3次、最多存在5s。若首先命中的队友已建立友好关系，则双方额外回复50Hp，且双方各获得一个[传送技能](点击技能后立刻以1750速度飞向同伴，传送期间获得无法被任何道具、技能命中)。若已建立友好关系，但花束首先命中的不是友好关系的队友，则与之建立友好关系并获得传送技能、之前的友好关系消失。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 10,
          },
          {
            level: 2,
            description:
              '爱心花束命中队友额外减少其主动技能CD；若与之有友好关系，则雪梨也会减少主动技能CD；传送技能额外减少双方武器技能CD并回复雪梨的Hp。',
            detailedDescription:
              '爱心花束命中队友额外减少其主动技能剩余CD的30%；若与之有友好关系，则雪梨减少主动技能剩余CD的30%、队友改为减少主动技能剩余CD的51%；传送技能额外减少双方武器技能剩余CD的30%并回复雪梨50Hp。',
            cooldown: 10,
          },
          {
            level: 3,
            description: '减少CD。',
            detailedDescription: '减少CD至8s。',
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
            description: '每隔15s解除不良状态并回复少量Hp；治疗队友速度大幅提升。',
            detailedDescription:
              '点出技能后立刻回复25Hp并解除反向、失明、受伤等异常状态，每隔14.9s触发一次该效果；治疗队友速度提升至0.35s；治疗虚弱队友将解除其受伤状态。',
          },
          {
            level: 2,
            description: '治疗队友后，队友Hp全部恢复。',
            detailedDescription: '治疗队友后，队友Hp恢复200。',
          },
          {
            level: 3,
            description: '治疗队友后，双方将持续恢复Hp、提升移速和跳跃速度，持续60s。',
            detailedDescription:
              '治疗队友后，双方移速和跳跃速度提升62%，持续0.5s。双方将额外以2.5/s持续恢复Hp、移速和跳跃速度提升10%，持续60s。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '',
      },
    ],
  },

  /* ----------------------------------- 天使杰瑞 ----------------------------------- */
  天使杰瑞: {
    description: '拥有一颗善良之心的天使，总会在汤姆遇上危险的时候，对他施以援手。',
    maxHp: 99,
    attackBoost: 5,
    hpRecovery: 5,
    moveSpeed: 665,
    jumpHeight: 420,
    cheesePushSpeed: 3.6,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '辅助',
        isMinor: false,
        description: '独一无二的复活机制，会给猫很大的压力。',
        additionalDescription:
          '虽然复活体尽量不会再去参与救人但是仍然可以保证奶酪进度，还能废掉一个秒飞，有不错的辅助能力。',
      },
      {
        tagName: '奶酪',
        isMinor: true,
        description: '推速较高，有一定自保。',
        additionalDescription: '本身牵制、救人能力不突出，无秒飞火箭时一般当奶酪位。',
      },
      {
        tagName: '破局',
        isMinor: false,
        description: '雷云的减伤和控制可以用于强推最后一块奶酪。',
        additionalDescription: '',
        weapon: 2,
      },
    ],
    skillAllocations: [
      {
        id: '丘比特之箭',
        pattern: '1(0)2110022',
        weaponType: 'weapon1',
        description:
          '一般建议留加点，如一级被动可以等猫拍你的时候点，能救一命，打部分[技能输出猫](如牛仔汤姆)可以优先点出三被。',
        additionaldescription: '',
      },
      {
        id: '止戈雷云',
        pattern: '3(0)[13]30011',
        weaponType: 'weapon2',
        description:
          '加点灵活，开局队友暴毙、刷二手火箭则优先祝福，否则被动。后期打部分[技能输出猫](如牛仔汤姆)可以优先点出三被。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'A-逃窜', 'C-救救我', 'C-不屈', 'S-铁血'],
        description:
          '适合新手游玩的卡组，不屈是天使的核心（队友被放飞时就产生增益，而不是被淘汰时），逃窜增加续航能力。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'A-祝愿', 'C-救救我', 'C-不屈'],
        description:
          '日常使用，需要注意高端局猫可能会优先送走天使，因此带了祝愿，卖自己也能有稳定的收益。',
      },
      {
        cards: ['S-无畏', 'S-铁血', 'B-绝地反击', 'C-救救我', 'C-不屈'],
        description: '防守类猫对策卡组。',
      },
      {
        cards: ['C-不屈', 'C-救救我', 'A-逃窜', 'A-泡泡浴', 'B-夹不住我', 'A-祝愿'],
        description: '四排车队可用不死流卡组（务必保证队友提前知道且不用你操心救人；单排慎用）',
      },
    ],
    skills: [
      {
        name: '天使祝福',
        type: 'active',
        description:
          '开始吟唱，给予周围范围内火箭上或猫手上的队友[祝福状态](头上出现光圈)，持续30秒。该状态的队友被放飞不会立刻淘汰而是在[固定位置](只与地图有关，每个地图都有固定点位)以复活体的形式返回游戏。复活体会持续暴露小地图位置，且一旦Hp到达[0](即老鼠倒地起身时的血量。这意味着尼宝翻滚、佩克斯三级主动等“免疫虚弱”的效果并不能防止其被淘汰)或被抓起就会被淘汰。',
        detailedDescription:
          '开始吟唱，约1.1秒后给予周围范围内火箭上或[猫手上](不包括托普斯捕虫网中、泰克抓取、跟随苏蕊跳舞、被塔拉或追风汤姆扔向火箭且正在飞行中)的队友[祝福状态](头上出现光圈)，持续30秒。老鼠从猫手中以绑火箭外的任何形式脱离，[将失去祝福状态](但塔拉或追风汤姆仍火箭时，如果被提前在猫手上祝福过，则可以正常生效)。祝福状态的老鼠从火箭上被救下将返还40秒CD。祝福状态的队友被放飞不会立刻淘汰而是在[固定位置](只与地图有关，每个地图都有固定点位)以复活体的形式返回游戏。复活体一旦Hp到达[0](即老鼠倒地起身时的血量。这意味着尼宝翻滚、佩克斯三级主动等“免疫虚弱”的效果并不能防止其被淘汰)或被抓起就会被淘汰。复活体会持续暴露小地图位置，但可通过进机械鼠，拿白色花等方式暂时隐藏。如果老鼠在铁血期间被放飞，则重生时为铁血状态、铁血结束直接被淘汰；如果在铁血结束后十秒内被放飞，重生时将是虚弱状态，被猫抓取会直接被淘汰。如果受到流血类伤害钻进机械鼠，且在机械鼠内死亡，则会留下一个机械鼠空壳。\n与其他角色之间的互动：表演者•杰瑞被放飞会优先判定三级被动的复活。如果复活体被托普斯捕虫网抓扔上火箭，则会正常读秒计时，此时再受到祝福会显示图标但无法生效、复活体在火箭被放飞时淘汰。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 60,
          },
          {
            level: 2,
            description: '祝福期间获得护盾，[护盾存在时持续恢复大量Hp](护盾被打破则恢复效果消失)。',
            cooldown: 60,
            detailedDescription:
              '祝福期间获得护盾，[护盾存在时持续恢复Hp](护盾被打破则恢复效果消失)，共计回复99点生命。',
          },
          {
            level: 3,
            description: '扩大祝福范围。',
            cooldown: 60,
          },
        ],
        aliases: ['复活'],
        canHitInPipe: true,
        cooldownTiming: '前摇前',
      },
      {
        name: '丘比特之箭',
        aliases: ['弓箭'],
        type: 'weapon1',
        description:
          '点按技能射出一发弓箭，射中队友为其回复一定生命；射中猫造成伤害。长按技能开始蓄力，蓄力满射出一发大弓箭，射中队友为其回复更多Hp，射中猫造成更高伤害和眩晕。中途可以取消释放，会返还一半CD。',
        detailedDescription:
          '点按技能射出一发弓箭，射中队友为其回复25Hp并提供1.6秒的10%加速；射中猫造成30伤害。长按技能开始蓄力，蓄力至少1.83秒后可以射出一发大弓箭，射中队友为其回复50Hp和1.6秒的5%加速；射中猫造成55伤害和1.4秒[眩晕](无视苏蕊的跳舞，但不打断跳舞或队友的跟随；无视天使汤姆二级被动的霸体，且可救下队友)。点按可以在空中射出，但蓄力弓箭无法在空中射出。射箭时天使可以调整[出射角度](约上下15度)。射出后的弓箭飞行[无视地形](平台，地板，天花板均不会影响；经典之家的厨房挡板除外)，直到击中其他角色或森林牧场大鸭子。弓箭射出方向为出射时所按的方向键，若未按则为拉弓时角色朝向。弓箭受到重力，但[速度大小不变，只改变方向](不受外力时，箭的竖直速度逐渐增大而水平速度逐渐减小，并非严格的抛物线)。弓箭可被鞭炮影响而改变飞行轨迹。中途可以取消释放，会返还一半CD。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['本技能键'],
        cancelableAftercast: ['道具键*'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 22,
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '治疗、伤害效果增强；蓄力箭命中虚弱队友会解除其虚弱状态。',
            cooldown: 12,
            detailedDescription:
              '普通弓箭伤害提高为55，蓄力箭提高为105；普通弓箭对队友治疗效果提高为50，蓄力箭提高为99。蓄力箭命中虚弱队友会解除其虚弱状态。',
          },
        ],
      },
      {
        name: '止戈雷云',
        type: 'weapon2',
        description:
          '在左右召唤两朵雷云，持续15秒。雷云内猫移速和伤害降低。如果猫在雷云中做出[攻击行为](爪刀、道具、技能)则会被雷劈（有一定延迟），受到少量[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)。',
        detailedDescription:
          '在左右各召唤一朵雷云，前摇0.65s，持续15秒。猫在雷云中对老鼠的伤害固定减少10点、受到35%减速。如果猫在雷云中有[攻击行为](如爪刀，道具，技能)则会[被雷云锁定](头顶出现感叹号标志)，锁定1.5秒后判定猫0.5秒前所在位置并在0.08秒内向该位置连续两次落雷，形成雷区，猫被雷直接击中或踏入雷区会受到35[电击伤害](电击伤害会使目标感电，每层感电使受到的电击伤害增加15，可叠加)。[极短时间内](如果同时有三道雷，会中两道)猫只能被一次雷击中。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 30,
          },
          {
            level: 2,
            description: '雷击附带眩晕，可击落猫手中的道具和老鼠。',
            detailedDescription:
              '雷击会附带0.7秒眩晕，可击落猫手中的道具和老鼠。1秒内猫不会重复受到雷电眩晕效果。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '雷云会主动攻击猫。无论雷云是否存在，猫伤害天使杰瑞都会遭到雷击。',
            detailedDescription:
              '猫在雷云内每5秒自动被锁定降下雷击，离开雷云5秒会重置计时。无论雷云是否存在，猫伤害天使杰瑞都会立刻被标记，随后遭到雷击。',
            cooldown: 30,
          },
        ],
        cooldownTiming: '释放后',
      },
      {
        name: '神之惩戒',
        type: 'passive',
        description: '',
        detailedDescription: '所有被动均会被猫咪的护盾、无敌、霸体抵消，且不会破盾。',
        skillLevels: [
          {
            level: 1,
            description: '被猫以任意方式伤害时，短暂禁用其爪刀。',
            detailedDescription: '被猫以任意方式伤害时禁用其爪刀5秒。（CD：10秒）',
          },
          {
            level: 2,
            description: '[附近](范围与一级复活相近)猫的爪刀和技能CD增加。',
            detailedDescription:
              '[附近](范围与一级复活相近)猫的爪刀和技能CD增加10%（特技不受影响）',
          },
          {
            level: 3,
            description: '被猫以任意方式伤害时，短暂禁用其[所有技能](包括特技)。',
            detailedDescription:
              '被猫以任意方式伤害时禁用其[所有技能](包括特技)4秒。（[CD：10秒](和Lv.1效果不共享冷却)）',
          },
        ],
      },
    ],
  },

  /* ----------------------------------- 天使泰菲 ----------------------------------- */
  天使泰菲: {
    description: '在王位争夺战中，泰菲化身为天使泰菲，用他的善良感动了汤姆，成功救下了国王杰瑞。',
    maxHp: 74,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 650,
    jumpHeight: 380,
    cheesePushSpeed: 2.9,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '奶酪',
        isMinor: true,
        description: '作为队伍的副推。',
        additionalDescription: '此外还有被动提供推速加成和搬奶酪速度。',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '可以用庇护保人。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        isMinor: false,
        description: '三级翅膀霸体和三级庇护免死后期救人十分强势。',
        additionalDescription: '新增标签介绍',
      },
      {
        tagName: '破局',
        isMinor: false,
        description: '庇护能保护队友强推最后一块奶酪。',
        additionalDescription: '新增标签介绍',
      },
    ],
    skillAllocations: [
      {
        id: '常规加点（容错续航较低）',
        pattern: '1221[12][12]000',
        weaponType: 'weapon1',
        description: '最正常的加点，最适合打克制天菲的猫。',
        additionaldescription: '',
      },
      {
        id: '翅膀流加点',
        pattern: '202121100',
        weaponType: 'weapon2',
        description: '打汤姆剑汤追风这种控制多的猫。',
        additionaldescription: '',
      },
      {
        id: '庇护流加点',
        pattern: '121012200',
        weaponType: 'weapon1',
        description: '',
      },
      {
        id: '偏门加点（偶有奇效）',
        pattern: '200221110',
        weaponType: 'weapon1',
        description: '适合救完人后立刻点二被，续航自保很高但对队友实力要求高。',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '有救援卡，逃窜适合打控制多的猫，不屈增加后期容错。',
      },
      {
        cards: ['S-护佑', 'S-舍己', 'S-铁血', 'C-救救我'],
        description:
          '适合单排打库伯苏蕊这种前期优势大但怕盾的猫，也可以在某些特别烂的阵容充当前期救人位。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-救救我', 'A-祝愿', 'B-夹不住我'],
        description:
          '适合车队打法，因为后期天菲强度高可能被某些打后期老鼠乏力的猫针对，适用于主点庇护的玩法。',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-救救我', 'B-精准投射', 'B-夹不住我'],
        description:
          '很流行的打法，很适配庇护流，精准投射能很好弥补武器技能和主动技能真空期的问题。',
      },
      {
        cards: ['S-舍己', 'C-救救我', 'B-破墙', 'C-不屈', 'B-幸运'],
        description: '天菲打逆风局很好用的卡，和队友说清楚没带铁血。',
      },
    ],
    skills: [
      {
        name: '友情庇护',
        type: 'active',
        description:
          '12秒内受到的伤害降低15，并转移范围内队友所受伤害和控制效果到自身，火箭在庇护范围内减少燃烧速度。优先使用怜悯值抵扣转移的伤害。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['药水键', '跳跃键', '道具键*', '其他技能键'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '伤害转移比例为50%。火箭在庇护范围内减少20%燃烧速度。',
            detailedDescription: '伤害转移比例为50%。火箭在庇护范围内减少20%燃烧速度。',
            cooldown: 16,
          },
          {
            level: 2,
            description: '伤害转移比例增加到100%，火箭燃烧速度减缓至50%。',
            cooldown: 16,
            detailedDescription: '伤害转移比例增加到100%，火箭燃烧速度减缓至50%。',
          },
          {
            level: 3,
            description:
              '若开启庇护时自身的怜悯值超过50%，消耗20%的怜悯值并在技能持续期间获得免疫虚弱的效果。',
            cooldown: 16,
          },
        ],
        cueRange: '无音效',
        aliases: ['庇护'],
        detailedDescription:
          '12秒内受到的伤害降低15，并转移范围内队友所受伤害和控制效果到自身，火箭在庇护范围内减少20%燃烧速度。优先使用怜悯值抵扣转移的伤害，100%怜悯值可承担50伤害。[本技能有争议](另一种减伤说法：25伤害变10,50伤害变35,65伤害变45,75伤害变55,100伤害变65,115虚弱；另一种怜悯值消耗说法：100%怜悯值可承担60伤害)。',
      },
      {
        name: '天使翅膀',
        aliases: ['翅膀'],
        type: 'weapon1',
        description: '6秒内受到的伤害降低15，并反弹受到伤害的55%。可消耗怜悯值使反弹伤害增加。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['道具键', '跳跃键', '移动键', '其他技能键'],
        cancelableAftercast: '不可取消后摇',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '若反弹时自身的怜悯值超过20%，消耗20%的怜悯值使当次反弹的伤害增加20。',
            cooldown: 20,
          },
          {
            level: 2,
            description: 'CD减少10秒。',
            cooldown: 10,
          },
          {
            level: 3,
            description:
              'Lv.1效果中的额外反弹伤害增加到35。若开启庇护时自身的怜悯值超过30%，消耗30%怜悯值获得5秒[霸体](不免疫虚弱)。',
            cooldown: 10,
          },
        ],
        detailedDescription:
          '6秒内受到的伤害降低15，并[反弹受到伤害]("反弹"即天使泰菲对攻击者造成一次伤害，该伤害不受攻击增伤影响；"受到伤害"的数值与实际受到的伤害值无关，其计算时机晚于攻击者的攻击增减伤，但早于天使泰菲的受击增减伤，并且最终数值不会超过天使泰菲当前的Hp)的55%。可消耗怜悯值使反弹伤害增加。[本技能有争议](另一种说法：不考虑怜悯值时，消耗25变5伤害返还20，50变25伤害返还25，75变50伤害返还20，100变60伤害返还40，125直接虚弱返还50；每10％反伤5伤害)。',
      },
      {
        name: '怜悯之心',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '怜悯值低于80%时，增长速度翻倍。',
            detailedDescription: '怜悯值低于80%时，增长速度翻倍。',
          },
          {
            level: 2,
            description: '怜悯值高于20%时，Hp恢复速度增加到5/s。',
            detailedDescription: '怜悯值高于20%时，Hp恢复速度增加到5/s。',
          },
          {
            level: 3,
            description: '怜悯值高于40%时，Hp上限增加到115。',
            detailedDescription: '怜悯值高于40%时，Hp上限增加到115。',
          },
        ],
        description:
          '天使泰菲拥有怜悯值充能条，自然回复情况下怜悯值30秒回满。怜悯值会自然增加，也能在队友受到伤害时增加。怜悯值可以增强主动和武器技能。',
        detailedDescription:
          '天使泰菲拥有怜悯值充能条，自然回复情况下怜悯值30秒回满。怜悯值会自然增加，也能在同一房间内有队友受到伤害时增加（每1伤害增加0.1%怜悯值）。怜悯值可以增强主动和武器技能。',
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '最适配主点翅膀的特技。',
      },
      {
        name: '绝处逢生',
        description: '增强自保，或用于破捕鼠夹。',
      },
      {
        name: '应急治疗',
        description: '配合减伤提高生存能力。',
      },
    ],
    counters: [
      {
        id: '追风汤姆',
        description: '很怕反伤。',
        isMinor: false,
      },
      {
        id: '米特',
        description: '技能提供的减伤能大幅降低甚至免疫胡椒粉的伤害，还能反伤。',
        isMinor: false,
      },
      {
        id: '剑客汤姆',
        description: '技能提供的减伤能大幅降低甚至免疫连斩的伤害。',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '托普斯',
        description:
          '托普斯的捕虫网能无视天菲的两个技能，即便是三级庇护都会被当成提款机(携带特技-我生气了时)。',
        isMinor: false,
      },
      {
        id: '图多盖洛',
        description: '天菲既被香水死克，又被猛攻指甲油克制。',
        isMinor: true,
      },
      {
        id: '塔拉',
        description:
          '塔拉的超大视野逼迫天菲救人拦截方面提前开技能，蓄势重击克制翅膀流，拍子克制庇护流。',
        isMinor: true,
      },
      {
        id: '库博',
        description: '库博伤害极高，90伤害使得击晕接道具秒天菲，蓄势140天妃三级翅膀直接死。',
        isMinor: false,
      },
    ],
    collaborators: [
      {
        id: '雪梨',
        description: '雪梨和天使泰菲的技能搭配能大幅提高生存能力。',
        isMinor: false,
      },
      {
        id: '米雪儿',
        description: '米雪儿和天使泰菲的技能搭配能大幅提高生存能力。',
        isMinor: true,
      },
      {
        id: '魔术师',
        description: '天使泰菲后期强力。魔术师二武器能提供大量经验，帮助到达后期。',
        isMinor: false,
      },
      {
        id: '佩克斯',
        description: '天使泰菲后期强力。佩克斯能提供大量经验，帮助到达后期。',
        isMinor: true,
      },
      {
        id: '侦探杰瑞',
        description: '侦探杰瑞的推奶酪和破局能力很强，推奶酪提供的经验能帮助天使泰菲到达后期。',
        isMinor: true,
      },
    ],
    aliases: ['天菲', '天妃'],
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
        description: '兔子可以安全地运送和推入奶酪。',
        additionalDescription:
          '兔子的推速并不占优，不过可以通过反复拉扯来创造推奶酪机会。兔子大表哥Lv.1增加的推速数值较低，不建议当做奶酪位来玩。',
        weapon: 1,
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
        description:
          '兔子先生[拥有一定救援能力](通常需携带“无畏”知识卡，否则可能无法进行有效救援)；兔子大表哥[可以阻止秒飞火箭起飞](需要魔术师在附近，实战时需抉择)。',
        additionalDescription: '兔子先生救援时建议搭配红牌干扰，提高稳定性。',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '分别点出Lv.1的主动、武器、被动技能后，可以通过卡牌刷取经验。',
        additionalDescription: '',
        weapon: 2,
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
        ],
        defaultFolded: false,
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
        defaultFolded: true,
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
              '幸运卡组，[适合对抗库博等机动性强但防守能力弱的猫咪](这类猫咪可以将老鼠绑到极远的位置，利用老鼠救援的时间差击倒其他老鼠，令鼠方疲于奔命。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。',
          },
        ],
        defaultFolded: true,
      },
    ],
    skills: [
      {
        name: '奇思妙想',
        aliases: ['卡牌', '魔术卡牌'],
        type: 'active',
        description:
          '从三张卡牌中选取一张，投掷命中猫咪时令其传送一小段距离，并禁用技能/急速反向/失重漂浮一段时间。',
        detailedDescription:
          '在1.5秒前摇后，魔术师手中获得一张随机颜色卡牌，同时技能进入5秒读条，期间[每0.5秒按红-黄-蓝的顺序切换卡色](若切换时魔术师正在交互中，则不会切换)；再次点击技能/用道具键投出卡牌/5秒读条结束后，固定卡色且技能进入CD。\n卡牌属于投掷物，投掷初速度固定为2000，穿越所有墙体，命中猫咪时可以触发[以投掷命中为条件的效果](包括知识卡-缴械/精准投射/投手/追风，特技-干扰投掷/勇气投掷)。卡牌也会命中兔子大表哥/森林牧场大鸭子，但[不会触发效果](不会触发卡牌本身的效果，也不会触发以投掷命中为条件的效果，但可触发Lv.1被动)。猫咪受卡牌效果影响期间，免疫其他卡牌效果。魔术师虚弱时，卡牌不会从手中掉落。卡牌被丢弃时，将直接被移除。\n卡牌效果如下：\n通用：使目标向卡牌飞行方向传送80距离，并改变其朝向。\n红牌：立刻受到{65}点伤害并掉落手中道具，6秒内禁用技能且减速18.5%。\n黄牌：[每2秒获得1.5秒反向，同时+150%移速](免疫“香水反向”的技能（如图多Lv.1被动）无法免疫该效果；免疫“反向”的技能（如斯飞被动）可以免疫该效果但不会增加移速)，持续7秒。\n蓝牌：获得8秒失重状态，并且降低跳跃速度，但可在空中进行跳跃。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
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
        cueRange: '全图可见',
      },
      {
        name: '兔子先生',
        type: 'weapon1',
        description:
          '召唤兔子先生，可下达救援、搬奶酪、推奶酪、拾取、投掷、治疗或跟随指令。兔子继承魔术师的部分效果。',
        detailedDescription:
          '兔子先生不在场时，在1.9秒前摇后召唤兔子先生；其在场时，技能按键变为释放指令：在0.9秒前摇后，选取[以魔术师为中心，半径1150范围内的一个目标](优先选择优先级高的目标；优先级相同时，选择直线距离近的目标)下达指令；无CD、可移动释放但不可取消前摇。\n指令按优先级从高到低排列如下：\n1.火箭救援-对被绑上火箭的老鼠下达指令：兔子会救援该老鼠。\n2.搬奶酪-对奶酪下达指令：兔子[放下道具并搬起该奶酪](若兔子手中已有另一块奶酪，则不会放下它)。\n3.推奶酪-对[可交互的洞口](有未推入奶酪的洞口，或兔子手持奶酪时的空洞口)下达指令：兔子会[与其交互](兔子手中有奶酪时，他会朝该洞口投掷；洞口有未推入奶酪时，他会开始推奶酪)。\n4.治疗-对虚弱且未处于控制状态中的老鼠下达指令：兔子会治疗该老鼠。\n5.投掷-兔子手中有[投掷道具](不包括奶酪)时，对猫咪/墙缝/小黄鸭下达指令：兔子会近距离对其[连续投掷/使用道具](兔子投掷道具时，如果所在位置有其他道具，他会一并拾取并投掷/使用，直到没有道具可被拾取；兔子可通过这种方式拾取以下特殊道具：冰块/小鞭炮/鞭炮束/玩具枪/遥控器/冰桶/鞭炮堆/药水/电风扇。其中兔子拾取药水后不会使用，而是在一小段时间后原地放下；兔子会以2000的初速度投掷电风扇)。\n6.拾取-对[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/番茄)或高尔夫球下达指令：兔子放下其他道具，并拾取该道具。\n7.跟随-无其他目标时下达指令：无效果。\n\n兔子先生的属性：\nHp上限110，Hp恢复4.5（常态）或2（受伤时），移速820，跳跃550，攻击增伤20，推速1.6%/s，墙缝增伤2。\n兔子先生的特性：\n1.常态：免疫碎片、捕鼠夹、直接抓起和斯派克抓起。搬运奶酪时不会减速，且可[进行交互](如：开门，拔叉子，火箭救援等)。当自身Hp<0/魔术师被抓起或被淘汰时，自身退场并使技能进入CD。在场时会继承魔术师的[“无畏”知识卡](但改为被救者和魔术师获得无畏效果)、[部分食物和药水效果](仅对由常规道具获得的牛奶恢复/蛋糕恢复/隐身/护盾效果生效，不包括远视/兴奋/变大/技能效果/地图道具效果)。其它判断逻辑[与老鼠类似](如：被猫咪攻击时，对方会获得经验；受推速加成；可被治疗)。\n2.指令执行逻辑：指令下达后将[一直生效](只要指令目标满足指令下达时的所需条件，兔子就会执行对应指令)，直到下一条指令被下达。魔术师下达[新指令](与当前指令目标不同或类型不同)/兔子退场时，兔子将传送到魔术师身边；魔术师下达[相同指令](与当前指令目标和类型均相同)时，[指令失效](兔子继续执行当前指令，不会传送到魔术师身边)。当兔子[无事可做](当前指令指定的行为执行完毕，或执行跟随指令)且与魔术师距离超过360/一段时间内未进行交互和移动时，他将跑向魔术师。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
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
        cueRange: '全图可见',
      },
      {
        name: '兔子大表哥',
        type: 'weapon2',
        description:
          '召唤兔子大表哥，可下达举火箭、指卧撑或保镖指令。兔表哥被卡牌命中时会储存该效果，并在通过技能出拳命中猫咪时对其附加。魔术师虚弱时也可释放本技能。技能在其他老鼠被淘汰时自动升级，但无法主动升级。',
        detailedDescription:
          '兔子大表哥不在场时，在[1.9秒前摇](不可移动释放，可被跳跃键或道具键打断)后[召唤兔子大表哥](兔子大表哥登场时会进行4.5秒的肌肉展示动作，可被移动打断)；其在场时，可拖动技能按键至半径750以内的目标[下达指令](每次下达指令+30表现分，至多+300分，最短间隔5秒)。\n指令按优先级从高到低排列如下：\n1.举火箭-对火箭下达指令：兔子大表哥传送至该火箭位置并将其举起，使其判定和交互位置上移175距离，并且[不再因倒计时归零起飞](仍会因经典之家炸药堆爆炸起飞)，此时[改变部分技能与火箭的互动关系](沙包拳头无法打灭火箭；滑步踢无法踢飞火箭，乾坤袋无法吞火箭；喜剧之王Lv.2无法使表演者·杰瑞从火箭上挣脱，若在举火箭前挣脱则贴图出错)，[其余技能不变](天使祝福、Lv.3鼓舞可正常对火箭上的老鼠生效；火药桶、Lv.2共鸣可正常拆火箭；爱之花洒可浇灭火箭，但释放位置需上移；友情庇护范围内/风格骤变Lv.3范围内/蓝图内的火箭起飞速度会放缓)。单次最多执行60秒。[火箭位置随兔子大表哥移动](兔子大表哥举火箭期间因道具或技能而位移时，火箭的交互和判定位置会一同移动；兔子大表哥放下火箭时，火箭会传送回原位)。指令期间对其他火箭[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n2.指卧撑-对地面下达指令：兔子大表哥传送至该处并开始做指卧撑，以自身中轴线距地175处为端点，向面朝方向生成一个[长度为125的平台](该平台生成时会托起与其位置重合的物件，并挤开位于其边缘的物件；该平台贴图位置：兔子大表哥的头顶到腰部)，该平台具有弹性。该状态下兔子大表哥左右各距离80的范围内存在猫咪时，他会[向面朝方向持续出拳](不影响平台及自身实际位置，不会转身)。单次最多执行10秒。指令期间对其他地面位置下达指令时，剩余时间会被继承。[只能选取平台为目标](可选取斜面平台为目标，但无法选取场景组件（如吊灯）上的平面为目标；某些地板（如太空堡垒I的武器舱地板）视作场景组件，但下方通常有平台，可尝试将指令释放位置下移)。\n3.保镖-无其他可选目标时下达指令：兔子大表哥[跟随魔术师](当兔子大表哥与魔术师距离超过360时,他将跑向魔术师)。该状态下兔子大表哥被卡牌命中且魔术师周围1000距离内存在猫咪时，他会传送到该猫咪位置并出拳；兔子大表哥或魔术师被各自距离400内的猫咪攻击时，他会[在靠近猫咪时向其出拳](如果猫咪距离较近，则会直接跑向对方并出拳；如果距离较远或在进行别的动作，则暂时不出拳，而是之后路过猫咪时顺便出拳)；魔术师虚弱且与兔子大表哥距离小于100时，兔子大表哥会在0.5秒前摇后将魔术师踹飞1150距离，动作后摇0.4秒。\n有关“储存卡牌”及“出拳”的信息如下：\n1.储存卡牌：兔子大表哥[可被卡牌命中](卡牌不会击中其他魔术师的兔子大表哥)并[储存该卡牌](兔子大表哥身上会出现所储存卡牌的特效，但他不会受到卡牌效果)60秒，三种卡牌独立计时，受到已有的卡牌时重置其计时。\n2.出拳：在0.5秒前摇后，对面前距离300内的猫咪造成35点伤害，并减速70%，持续1.7秒；出拳[命中猫咪](每次命中+100表现分，至多+1000分)时，会[对其施加储存的其中一种卡牌效果](施加优先级为黄-红-蓝；卡牌效果中的传送方向改为与出拳方向相同；只触发卡牌效果，不会触发Lv.1被动)，并[消耗对应卡牌的储存](单次攻击命中多个目标时，会依次为目标附加不同的卡牌效果，直到储存耗尽；命中已有卡牌效果的猫咪时，也会消耗储存，但不产生效果；未命中目标时，不会消耗储存)。出拳有2.6秒内置CD，所有指令共用。\n\n兔子大表哥的属性：\nHp上限200，Hp恢复3/s，移速820，跳跃550。\n兔子大表哥的特性：\n1.常规：[免疫眩晕等控制状态](但无法免疫反向、虚弱和森林牧场三角铁等控制效果)。魔术师被放飞时，兔子大表哥会直接退场；魔术师进洞时，其会在魔术师最后的位置原地待命。其它判断逻辑[与友方猫咪相同或类似](如：具有伤害保护；Hp<0时，会虚弱6.9秒且每秒恢复50Hp，并使击杀者获得金钱；魔术师卡牌击中他会算作误伤队友，反复5次会使魔术师-50成就分等)。\n2.指令执行逻辑：兔子大表哥[默认执行保镖指令](兔子大表哥被召唤时/执行的指令中断时，他会自动执行保镖指令)。[魔术师在场](不包括被猫抓起期间)且兔子大表哥与魔术师的距离超过1600时，他会中断当前指令并传送到魔术师身边；魔术师被绑上火箭时，他会自动[对魔术师所在的火箭执行举火箭指令](若该火箭为秒飞火箭，则不执行指令)；[自身或魔术师虚弱时会中断当前指令](若魔术师虚弱时与兔子距离较近，则有概率不中断指令，触发原因不详)。兔子大表哥执行指令时的朝向与收到指令时的朝向一致。兔子大表哥在[执行动作](包括：出场时的肌肉展示；出拳前摇；踹飞魔术师的前后摇；Lv.2挥舞火箭攻击的前摇与后摇；虚弱倒地期间)期间[下达指令会失效](兔子大表哥继续执行当前指令，但技能仍进入CD)。\n\n技能特性：\n魔术师虚弱时也可释放本技能。\n本技能在1/2只老鼠[被淘汰](若老鼠因技能复活，则复活体被淘汰时才算真正被淘汰)时自动升至Lv.2/Lv.3，但无法主动升级。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        canHitInPipe: true,
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '魔术师推速和救援速度提高（被动生效，无需兔子大表哥在场，下同）。',
            detailedDescription:
              '魔术师[推速提高3%/s](固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高30%（被动生效，无需兔子大表哥在场，下同）。',
            cooldown: 5,
          },
          {
            level: 2,
            description:
              '兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且举火箭期间会自动攻击。魔术师推速和救援速度进一步提高。',
            detailedDescription:
              '兔子大表哥[改变外观](原皮贴图：穿上魔术披风)，且获得新能力：举火箭期间，受到猫咪伤害时或身旁100范围内有猫咪时，兔子大表哥在0.7秒前摇后[挥舞火箭](不影响火箭判定与交互位置)对身旁100范围内的所有目标[造成35点伤害](与出拳动作不同，不会对目标施加卡牌效果)，向身侧击退100距离并向上击飞250距离，并减速70%，持续1.7秒，攻击后摇0.5秒。改为使魔术师[推速提高6%/s](固定值加成，不受其他推奶酪百分比加/减速影响)，救援速度提高50%。',
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
        cueRange: '全图可见',
        aliases: ['兔表哥', '蛋白兔'],
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
              '当魔术师即将进入虚弱状态时，若手持魔术卡牌或[易碎道具](包括：玻璃杯/碗/盘子/圆盘子/灰色花瓶/蓝白花瓶/香水瓶/胡椒瓶/冰块/番茄)，则有35%的概率消耗该道具并[免疫这次虚弱](仍会受到伤害和其他效果，如受伤、减速和眩晕等)。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '侍卫汤姆',
        description:
          '兔子们的血量较高，能逼出侍卫汤姆的蓄势一击或蓄力重击。魔术师还能利用红牌封禁侍卫的技能，令其无法开炮',
        isMinor: true,
      },
      {
        id: '塔拉',
        description: '兔子们的血量较高，能逼出塔拉的蓄势一击或蓄力重击',
        isMinor: true,
      },
      {
        id: '追风汤姆',
        description:
          '追风汤姆伤害低，难以处理兔子。兔子大表哥还会在追风试图利用技能将魔术师绑上火箭时瞬移出现，挡下当次技能，从而救下魔术师',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        id: '航海士杰瑞',
        description:
          '魔术师的卡牌和航海士杰瑞的金币可以相互弥补控制真空期，提高干扰能力。魔术师在干扰的同时还能推奶酪',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '泛用性很高，提高机动性和自保能力',
      },
      {
        name: '绝处逢生',
        description: '泛用性很高，可用于回血、倒地自愈或清理捕鼠夹',
      },
      {
        name: '干扰投掷',
        description: '配合魔术卡牌提高干扰能力',
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
        cancelableAftercast: ['道具键*', '跳跃键'],
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
        cancelableSkill: ['道具键*', '跳跃键'],
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
        description: '和侦探杰瑞并列第一的鼠方基础推速。',
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
        description: '召唤1个迷惑猫咪的分身，同时自己进入隐身状态。分身被击倒时使敌方短暂失明。', // FIXME: 被友方击倒呢？
        detailedDescription:
          '召唤1个迷惑猫咪的分身，存在6.9秒；同时自己进入隐身状态，持续4.8秒。分身被击倒时使敌方失明1.75秒，但不会破盾或减少护盾时间。\n分身大师分身特性：Hp上限为25并[按比例继承本体Hp](如本体血量为24，分身血量将为8.33)、继承角色Hp恢复速度、不继承本体状态和知识卡、免疫捕鼠夹；Hp归零或持续时间结束时将原地消失；会在地图内四处走动，可能会钻管道；若半径800范围内出现猫咪，分身会尝试远离之。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '无前摇',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '隐身状态下除喝药水和移动跳跃外的任何动作都将导致显形。',
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
      '来自12世纪英国的侠盗罗宾汉泰菲，他身形灵敏，擅长利用草丛隐蔽自己，是罗宾汉杰瑞的好帮手。',
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
        id: '通用加点',
        pattern: '12[12]10(0)(0)2',
        weaponType: 'weapon1',
        description: '本套为通用加点，适合大部分场合。如果不需要Lv.3弹球，可以将被动的加点提前。',
        additionaldescription:
          '主动技能Lv.2提供控制，武器技能Lv.2提供恢复和储存，根据实际情况抉择。被动升至Lv.2/Lv.3时会立即刷新护盾，推荐在需要时再加点。',
      },
      {
        id: '打斯飞',
        pattern: '12[12](1)0(0)(0)2',
        weaponType: 'weapon1',
        description:
          '除6级外与上方案同。斯飞有感电时，3级圆球撞下队友，队友会因为感电而倒地，所以应2级圆球控住，待感电消失后用道具救援，到墙缝期再点3级圆球砸墙。',
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
              '幸运卡组，适合对抗[库博等机动性强但防守能力较弱的猫咪](这类猫咪往往喜欢将老鼠绑到极远的位置，利用老鼠救援的时间差快速击倒其他老鼠，达到令鼠方疲于奔命的目的。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。',
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
              '幸运卡组，[适合对抗库博等机动性强但防守能力较弱的猫咪](这类猫咪往往喜欢将老鼠绑到极远的位置，利用老鼠救援的时间差快速击倒其他老鼠，达到令鼠方疲于奔命的目的。幸运可以让队友无需救援，避免陷入对方节奏)。也可以与多位携带幸运且以推奶酪/破局/后期为定位的角色组成[幸运体系阵容](鼠方角色均携带幸运，由此缓解救援压力，可以专心推奶酪并与猫咪拉开等级差，奠定优势)。该卡组上限相对较低。若有需要，也可将救救我换为祝愿，增强对幸运体系的适配性。',
          },
        ],
        defaultFolded: true,
      },
    ],
    skills: [
      {
        name: '弹力圆球',
        aliases: ['弹球'],
        type: 'active',
        description:
          '蓄力弹射，对目标造成效果。弹射过程中，点击技能将结束弹射并[下坠](属于技能后摇，可被道具键*打断)。',
        detailedDescription:
          '长按技能键，在0.5秒前摇后开始蓄力，[拖拽并松开技能键进行弹射](弹射方向由技能拖拽的方向决定，初速度锁定为1675)，弹射时间随蓄力时间线性增加，最短1秒，最长4.7秒（[需要蓄力条满](满后仍能继续蓄力，但不增加弹射时间)，即蓄力2.5秒以上）。弹射过程中碰撞体积增大，碰撞到[目标](包括：猫咪、墙缝、小黄鸭、森林牧场大鸭子、墙壁、平台、地面)时将被[反弹](方向遵守反射定律。反弹平面为竖直面时，速度不变；为水平面时，改变速度：首次反弹初速度最高为1225，最低为1050，再次反弹初速度锁定为1050。碰撞猫咪/墙缝/鸭子时的反弹平面始终为竖直面，与他们的碰撞体积重叠期间只会进行一次反弹)。弹射时技能同步进入读条，可通过道具键*立刻结束技能，再次点击技能则[竖直向下坠落1.5秒](初速度锁定为2000；下坠期间只会碰撞平台或地面，动作期间无法进行其他操作，可用道具键*打断)，碰撞平台或地面时进入0.3秒不可被打断的后摇。前摇期间取消技能不进入CD，蓄力期间取消则进入50%的CD。',
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
              '碰撞猫咪造成{55}点伤害和20%减速，持续2秒，对猫咪有2秒的内置CD。碰撞墙缝造成{_10.5}点伤害。', // 严格来讲，是对同一猫咪有2秒内置CD，下同
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
            detailedDescription: '对猫咪造成的眩晕可击落老鼠。对墙缝的伤害提高至{_15.5}。',
            cooldown: 7,
          },
        ],
        cueRange: '本房间可见',
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
    collaborators: [
      {
        id: '航海士杰瑞',
        description:
          '航海士杰瑞与罗菲的控制能互相弥补真空期，罗菲还能提供航海士杰瑞急需的恢复能力。',
        isMinor: false,
      },
      {
        id: '剑客杰瑞',
        description:
          '剑客杰瑞的伤害和罗菲的控制能互相弥补短板。罗菲还能提供恢复，发挥剑客杰瑞的高Hp优势。',
        isMinor: false,
      },
      {
        id: '牛仔杰瑞',
        description:
          '牛仔杰瑞与罗菲的控制能互相弥补真空期，罗菲还能提供恢复，发挥牛仔杰瑞的高Hp优势。',
        isMinor: false,
      },
      {
        id: '拿坡里鼠',
        description: '拿坡里鼠与罗菲的控制能互相弥补真空期。',
        isMinor: false,
      },
      {
        id: '剑客莉莉',
        description:
          '剑客莉莉与罗菲的控制能互相弥补真空期，罗菲还能提供恢复，发挥剑客莉莉的高Hp优势并触发她的Lv.1被动。',
        isMinor: false,
      },
      {
        id: '米可',
        description:
          '米可与罗菲的控制能互相弥补真空期，罗菲还能提供米可相对匮乏的恢复能力。米可的技能CD较长，配合时需注意。',
        isMinor: false,
      },
      {
        id: '天使杰瑞',
        description: '罗菲能为天使杰瑞提供恢复，帮助其多次触发被动。',
        isMinor: true,
      },
    ],
    counters: [
      {
        id: '托普斯',
        description:
          '托普斯没有分身时缺乏霸体能力，可被罗菲连续控制；分身Hp不高，可被罗菲快速击倒。不过，托普斯可以瞅准机会用捕虫网直接网住翻滚中的罗菲，或是利用换位躲过攻击。',
        isMinor: false,
      },
      {
        id: '莱特宁',
        description: '莱特宁缺乏霸体能力，可被罗菲连续控制。',
        isMinor: false,
      },
      {
        id: '牛仔汤姆',
        description:
          '牛仔汤姆缺乏霸体能力，并且机动性较差，可被罗菲连续控制或拉扯。罗菲的高低差爬树和高额恢复还克制弹弓和斗牛的远程消耗。但牛汤弹弓爆发伤害高，要小心其绝地反击特技免控后的连续弹弓攻击。',
        isMinor: false,
      },
      {
        id: '图茨',
        description:
          '图茨缺乏霸体能力，并且机动性较差，可被罗菲连续控制或拉扯，但要小心对方的绝地反击特技。',
        isMinor: false,
      },
      {
        id: '米特',
        description:
          '米特缺乏主动霸体能力，并且机动性较差，可被罗菲连续控制或拉扯。罗菲能用控制效果击落米特手中的胡椒瓶，还能为全队提供恢复，克制胡椒粉的持续伤害。但米特爪刀伤害高，被动还有禁疗效果，还是需要注意防范。',
        isMinor: false,
      },
      {
        id: '剑客汤姆',
        description: '剑客汤姆缺乏霸体能力，很容易被罗菲连续控制，但要小心对方的绝地反击特技。',
        isMinor: false,
      },
      {
        id: '侍卫汤姆',
        description:
          '侍卫汤姆霸体减控能力间隔较长，所需等级较高，前期很容易被罗菲连续控制。火炮的远程消耗可以被藤蔓的恢复轻易化解。不过，侍卫汤姆移速快，二被动伤害高，超大的视野范围也能防范罗菲的偷袭，因此罗菲单人干扰侍卫汤姆有一定风险，非常建议配合其他干扰位。',
        isMinor: true,
      },
      {
        id: '库博',
        description:
          '库博缺乏霸体能力，很容易被罗菲连续控制。罗菲的高机动性难以让库博抓住破绽。但库博主动和被动技能可提供高额攻击增伤和极强生存能力，不易被罗菲击倒，可以伺机偷袭罗菲。',
        isMinor: true,
      },
      {
        id: '斯飞',
        description:
          '罗菲的圆球加投掷道具配合投手，可以暂时中断斯飞的疾冲状态，达到干扰效果。但斯飞的速度较快，一旦断控很容易被反杀，并且也不容易逃跑或拉扯，务必小心。',
        isMinor: true,
      },
    ],
    counteredBy: [
      {
        id: '苏蕊',
        description:
          '苏蕊跳舞提供霸体和攻击增伤，克制罗菲的控制。但苏蕊攻击段数较低，后期罗菲可以尝试用被动的护盾免疫伤害。',
        isMinor: false,
      },
      {
        id: '恶魔汤姆',
        description: '恶魔汤姆有霸体和护盾能力，克制罗菲的控制。',
        isMinor: false,
      },
      {
        id: '凯特',
        description:
          '凯特被动提供减控和攻击增伤，克制罗菲的控制。但凯特Hp不高，罗菲可以尝试先击倒对方再进行救援/推奶酪，或用被动的护盾免疫伤害。',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '干扰投掷',
        description:
          '[配合圆球和精准投射打出高频控制](基本连招：圆球起手，接上控制道具，干扰投掷小道具，放树拉扯。)，提高干扰能力。',
      },
      {
        name: '绝处逢生',
        description: '在特定局势下使用，用于自起或清理捕鼠夹破局。',
      },
      {
        name: '魔术漂浮',
        description:
          '部分高低差较多的地图可考虑携带，补充容错。不过罗菲本身就有藤蔓和[圆球二段跳](在空中向上释放弹力圆球，达到类似二段跳的效果)，并不特别依赖漂浮。',
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
        detailedDescription:
          '玛丽优雅行礼，范围内猫咪受其高贵气质感染，无法做出失礼举动。(20秒内无法重复触发）',
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

  /* ----------------------------------- 马索尔 ----------------------------------- */
  马索尔: {
    description:
      '黄色黑纹衣服，头戴绿色帽子，和杰瑞长相很相似。他是杰瑞的大表哥，实力强悍，勇敢威猛，是所有猫咪的克星。',
    maxHp: 99,
    attackBoost: 0,
    hpRecovery: 2,
    moveSpeed: 650,
    jumpHeight: 400,
    cheesePushSpeed: 0.6,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '救援',
        isMinor: false,
        description: '闪拳可拦截，传送可救援，有药水可以稳救。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: false,
        description: '拳头可干扰霸体上火箭。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        isMinor: false,
        description: '发怒拳头可以强推奶酪。',
        additionalDescription: '后期发怒时可无视夹子和叉子。',
      },
    ],
    skillAllocations: [
      {
        id: '沙包拳头',
        pattern: '120022[10]1',
        weaponType: 'weapon1',
        description:
          '八级时，顺风三被，逆风二级传送；二人残局优先三级传送；六级可留点随时二级传送。',
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
    skills: [
      {
        name: '闪亮营救',
        type: 'active',
        description:
          '大表哥点击按钮后可选择绑在火箭上和被猫抓在手中的队友，瞬移到身边落下，弹飞附近的道具，当怒气满时，可在下落瞬间通过向左右拖动按钮来攻击对应方向的目标。',
        detailedDescription:
          '前摇1.4s，大表哥点击按钮后可选择绑在火箭上和被猫抓在手中的队友，瞬移到其上方并在0.65s后落下，若成功落下且没有受到任何效果打断，可在0.25s后将附近半径250内的道具击飞；当怒气满时，可在下落0.5s内通过向左右拖动按钮来攻击对应方向的目标，前摇0.6s，造成50伤害，并眩晕2.4s，后摇0.75s。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*', '移动键', '跳跃键', '药水键', '其他技能键'],
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
            cooldown: 60,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 35,
            detailedDescription: '减少CD至35s。',
          },
        ],
        aliases: ['闪现'],
        cueRange: '本房间可见',
        canHitInPipe: false,
      },
      {
        name: '沙包拳头',
        aliases: ['爪刀'],
        type: 'weapon1',
        description:
          '攥起拳头。再次使用技能将向按键拖动的方向挥出拳头，并在满怒时提升效果。\n按键向上-升龙拳：向上打飞敌方，同时熄灭火箭；满怒时额外打飞火箭。\n按键向前/不拖动-游龙拳：向前打飞敌方，同时熄灭火箭；满怒时增加击退距离并可打入一定进度的奶酪。\n按键向下-地龙拳：原地打晕敌方，并施加减速；满怒时增加眩晕时间、可能使敌方掉下其所在的平台。',
        detailedDescription:
          '前摇1.4s，之后的30秒内，再次使用技能将向按键拖动的方向挥出拳头。挥出拳头后立刻进入CD。成功挥出拳头有0.15s前摇，对前方[范围290](三种拳头都一样)的猫咪造成50点伤害，挥拳后有1s后摇。满怒时，使用技能改为对拳头充气，充气需1.4s，之后可在20s内至多挥出3次拳头，前后摇、伤害不变，但期间[无法使用道具](但可通过商店买道具在手上取消后摇)，每次挥拳有3秒CD。\n按键向上-升龙拳：造成[1s](满怒时为0.9s)眩晕，并击飞1.1s，对墙缝造成1点伤害，熄灭范围内点燃的火箭；满怒时额外向上击飞火箭2.5s。\n按键向前/不拖动-游龙拳：造成1s眩晕，并击退500距离，对墙缝造成1点伤害，熄灭范围内点燃的火箭；满怒时眩晕时间提高至1.5s，击退距离提高至1500，且敌方在击退过程中会撞碎[易碎道具](不包括冰块；包括果子)，撞碎时受到2.8s眩晕和[50伤害](受马索尔增伤影响；不会受到道具本身的伤害，且与道具本身无关；眩晕时间受到连击保护且与道具本身无关)，还可将洞中的奶酪打入[12.5%](不受其他推速加成影响)。\n按键向下-地龙拳：造成0.9s眩晕，眩晕结束后敌方受到17.5%的减速，持续5s；满怒时眩晕时间提高至1.4s，且若目标站在平台上，可能向下掉落。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['道具键*'],
        cancelableAftercast: ['道具键*'],
        canHitInPipe: false,
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
            description:
              '提高满怒时游龙拳打入奶酪的进度；提高升龙拳和游龙拳对墙缝的伤害，满怒后进一步提高。',
            cooldown: 15,
            detailedDescription:
              '提高满怒时游龙拳打入奶酪的进度至[20%](不受其他推速加成影响)；升龙拳和游龙拳对墙缝的伤害提高至11点，满怒后提高至16点。',
          },
        ],
        cueRange: '本房间可见',
        cooldownTiming: '释放后',
      },
      {
        name: '怒气喷发',
        type: 'passive',
        description:
          '怒气：当附近队友受到猫攻击时，将积攒怒气。怒气满之后将进入持续较长的满怒状态，期间暴露小地图视野、沙包拳头得到强化、获得减伤。退出满怒状态后进入冷静状态，较长时间内不会获得怒气、大幅减速。',
        detailedDescription:
          '怒气：当半径1750范围内队友或自己受到猫攻击时，将积攒28%的怒气。怒气达到100%之后将进入满怒状态，持续32s，期间暴露小地图视野、沙包拳头得到强化、获得5点固定减伤。退出满怒状态后进入冷静状态，持续34.9s，期间不会获得怒气、减速25%。',
        skillLevels: [
          {
            level: 1,
            description: '满怒时，大幅加速。',
            detailedDescription: '满怒时，加速20%。',
          },
          {
            level: 2,
            description: '满怒时，免疫控制效果，且提高Hp恢复。',
            detailedDescription: '满怒时，免疫控制效果，且Hp恢复提高2.5/s。',
          },
          {
            level: 3,
            description: '满怒时，立刻刷新技能CD。',
            detailedDescription: '满怒时，立刻刷新技能CD。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '踏空必备',
      },
      {
        name: '绝处逢生',
        description: '传送破夹',
      },
      {
        name: '干扰投掷',
        description: '道具接拳',
      },
    ],
    aliases: ['大表哥'],
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
          '点击技能时米雪儿记录自身周围半径100范围内[最近的道具](被记录的道具将变成粉色；若没有道具将直接进入技能CD)，记录前摇1.5秒，再次点击技能将变成该[道具](可被使用)，变身前摇0.5秒，持续60秒。变形后依然可以进行交互，同时提高视野范围至1.8倍。可储存2次记录的道具。受到伤害、所变道具损坏、再次点击技能键、达到最大持续时间后将变回，变回后技能进入5秒CD、道具消失。\n可以变形的道具为几乎所有投掷物（包括技能投掷物；例外：{剑客泰菲}的长枪、{魔术师}的卡牌、{恶魔泰菲}的红恶魔）、手枪、子弹、果盘、水果、番茄、鞭炮堆、冰桶、牛奶、蛋糕、纸箱、拳头盒子、拍子、关闭的捕鼠夹、[部分地图场景物](经典之家：推车、水桶、木桶；夏日游轮：消防栓、锅；森林牧场：三角铁、浆果、除七色花外的所有花及其被采后留下的叶子；熊猫谷：胡萝卜、竹笋、收纳箱；御门酒店：礼盒、除七色花外的所有花及其被采后留下的花瓶)。不能变形机器鼠遥控、风扇。',
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
    specialSkills: [
      {
        name: '急速翻滚',
        description: '',
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
              '狂想：额外降低[技能CD](特技与机械鼠技能不生效)。\n协奏：额外降低周围火箭燃烧速度。',
            detailedDescription:
              '狂想：额外降低18%[技能CD](特技与机械鼠技能不生效)。\n协奏：额外降低50%周围火箭燃烧速度，不可叠加。',
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
    specialSkills: [
      {
        name: '干扰投掷',
        description: '',
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
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。鱼钩碰到道具会携带之；碰到角色会将其勾回，并救下猫咪手中的老鼠。',
        detailedDescription:
          '在面前召唤朋友（技能不会进入CD）；在距离朋友较近时，使附近的朋友向尼宝扔出鱼钩。朋友在30秒后自然消失。朋友扔出鱼钩过程中再次点击技能会使朋友将鱼钩收回（有前摇）。鱼钩碰到道具会携带之，碰撞猫咪时造成相应效果；碰到角色会将其勾回，并救下[猫咪](含霸体状态下的猫咪)手中的老鼠。',
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
        description:
          '召唤魔镜。魔镜处可消耗三星获得道具、消耗六星传送至任意房间（猫咪也可用魔镜）。',
        detailedDescription:
          '前摇1.5s，召唤魔镜，后摇0.32s。魔镜[存在60s](可同时存在多个)。魔镜处可消耗三星获得随机道具、消耗六星传送至任意房间（进入传送界面即扣除星星，取消传送不返还星星；猫咪也可用魔镜；使用魔镜不能借用队友的星星）。\n一、二级道具概率：易碎道具:20%、高尔夫球:15%、胡椒粉:15%、香水瓶:10%、冰块:10%、遥控器:10%、苍蝇拍:10%、捕鼠夹:5%、药水:4%、奶酪:1%。\n三级道具概率：高尔夫球:15%(0)、胡椒粉:15%(0)、香水瓶:10%(0)、冰块:10%(0)、遥控器:10%(0)、易碎道具:10%(↓)、苍蝇拍:5%(↓)、鞭炮束:5%(+)、狗骨头:5%(+)、捕鼠夹:5%(↓)、神秘药水:5%(↑)、[技能产物](包括拿坡里鼠的饼和饼的碎片、航海士杰瑞的火药桶、雪梨的花洒（可以治疗猫）):4%(+)、奶酪:1%(0)。',
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
            detailedDescription: '减少CD至40s。',
          },
          {
            level: 3,
            description: '许愿内容提高质量。',
            cooldown: 40,
          },
        ],
      },
      {
        name: '仙女棒',
        type: 'weapon1',
        description:
          '消耗一定数量的星星来投掷可穿墙的星星，并对命中者施加对应的效果：\n1星：队友隐身；减少猫咪Hp和移速\n2星：队友获得二段跳效果；猫咪同1星\n4星：队友缓慢恢复Hp；猫咪同1星\n6星：队友变为小星星，免疫虚弱和眩晕；猫咪同1星\n8星：对队友无效；猫咪变为大星星、手上的老鼠掉落\n星星的获取方式：\n老鼠：主要来自对猫咪造成负面效果；仙女鼠拥有本技能时额外自动获取星星\n猫咪：每次对老鼠造成伤害[夺取2颗](老鼠的星星少于2颗则全部夺取)\n每个角色最多存储9颗星星；仙女鼠可以[借用附近队友的星星](有借无还)。',
        detailedDescription:
          '前摇0.32s，消耗一定数量的星星来投掷[可穿墙的星星](飞行速度2000；会被经典之家的挡板挡住)，后摇0.15s，并对命中者施加对应的效果：\n1星：队友隐身3s；对猫咪造成{20}点[真实伤害](无法被护盾、无敌抵消（例外：如果该伤害将导致虚弱，则不会进入虚弱，而是破盾并保留0Hp）)，减速17%\n2星：队友获得二段跳效果，持续5s；猫咪同1星\n4星：队友回复10Hp，并持续回血8s，每秒7.5Hp；猫咪同1星\n6星：队友变为小星星，持续5.9s，命中时[解除并免疫虚弱和眩晕](不免疫剑汤挑起)，小星星移速665，可使用星星翻滚，CD为2s，向前方滚动1.3s，期间移速增加50%；猫咪同1星\n8星：对队友无效；猫咪[变为大星星](不会取消苏蕊跳舞、恶魔汤姆打碟)，持续8s，命中时解除并免疫虚弱和眩晕、手上的老鼠掉落。大星星移速为725，模型比猫咪大、无法穿过狭窄地形，可[吐出小星星](前摇0.3s，不可移动、不可取消；CD为1s，最多存储3发)，小星星飞行速度为2000，会对老鼠造成基础伤害为20的[真实伤害](无法被护盾、无敌抵消（例外：如果该伤害将导致虚弱，则不会进入虚弱，而是破盾并保留0Hp）)和10%减速，持续2s；大星星拥有爪刀，爪刀判定范围与附加效果不受影响。\n星星的获取方式：\n老鼠：对猫咪造成[负面效果](每次造成均+1颗星星；击倒猫咪相当于造成伤害和虚弱效果，故可获得两颗；仙女鼠自身的三级被动除外)、推入奶酪、[救下队友](包括被猫抓住和被绑上火箭的队友)；仙女鼠拥有本技能时额外自动获取星星\n猫咪：每次对老鼠造成伤害[夺取2颗](老鼠的星星少于2颗则全部夺取)\n每个角色最多存储9颗星星；当仙女鼠半径1800范围内有队友时，本技能可以[借用队友的星星](有借无还；先用队友的星星；如果有多个队友，则先借最近队友的星星)。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: ['移动键', '跳跃键'],
        cancelableAftercast: '无后摇',
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '自身星星额外以每7秒一颗的速度增长。',
            cooldown: 8,
          },
          {
            level: 2,
            description: '大幅减少CD。',
            cooldown: 2,
            detailedDescription: '减少CD至2s。',
          },
          {
            level: 3,
            description: '自身星星增长速度提高至每5秒一颗。',
            cooldown: 2,
          },
        ],
        aliases: ['魔法棒'],
      },
      {
        name: '魔咒强身',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '[不动](可用自起刷新不动状态)时获得减伤。受到控制效果时失去减伤。',
            detailedDescription:
              '[不动](可用自起刷新不动状态)时获得固定减伤40。受到控制效果时失去减伤。',
          },
          {
            level: 2,
            description: '受到攻击后进入短暂的隐身。',
            detailedDescription: '受到攻击后进入隐身，持续2.9s。',
          },
          {
            level: 3,
            description: '对猫咪造成伤害时，额外造成短暂的反向。',
            detailedDescription: '对猫咪造成伤害时，额外造成2.9s的反向。',
          },
        ],
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '',
      },
      {
        name: '绝处逢生',
        description: '',
      },
    ],
  },

  /* ----------------------------------- 米可 ----------------------------------- */
  米可: {
    description:
      '米可是米雪儿的哥哥，出身良好的他立志成为一个优秀的新闻人。以优异成绩毕业后，米可投身新闻事业，总是第一时间出现在新闻现场，向观众提供专业权威的新闻报道。',
    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 2.5,
    moveSpeed: 640,
    jumpHeight: 0,
    cheesePushSpeed: 2.6,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '主动技能可以对猫造成减速、伤害、控制效果。',
        additionalDescription: '',
      },
      {
        tagName: '辅助',
        isMinor: true,
        description: '主动技能以及二、三级被动可以减少猫造成的伤害。',
        additionalDescription: '',
      },
      {
        tagName: '救援',
        isMinor: false,
        description: '米可救援可以在远处先使用武器技能拍照，舍己救人后通过二段回溯逃离并回溯血量。',
        additionalDescription: '',
      },
      {
        tagName: '后期',
        isMinor: true,
        description: '米可后期三级主动加三级被动很难被击倒。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '相机',
        pattern: '12[10]10022',
        weaponType: 'weapon1',
        description: '主流加点，开局先点出相机以便之后救援',
      },
      {
        id: '采访',
        pattern: '101010222',
        weaponType: 'weapon1',
        description: '通过优先点出采访和被动增强干扰能力',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-舍己', 'S-铁血', 'A-逃窜', 'C-不屈', 'C-救救我'],
        description: '米可主流卡组',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'C-救救我', 'S-缴械'],
        description: '没有21点时带',
      },
    ],
    skills: [
      {
        name: '说出你的故事',
        type: 'active',
        description:
          '开始采访，期间免控，范围内的猫咪因紧张而降低移速和伤害能力。猫咪在镜头内使用爪刀、投掷道具、[使用技能](牛仔汤姆的弹弓、凯特的被动、图多盖洛的吻痕将提供多层素材)都会被记录为素材，最多叠加5层。通过二段技能进行报道，猫咪因被曝光而受到[层数相关](无素材则无效果)的伤害和眩晕；3层以上会掉落道具和老鼠。',
        detailedDescription:
          '开始采访，持续12.5秒，期间免控、不会被减速，范围内的猫咪因紧张而降低移速和伤害能力。猫咪在镜头内使用爪刀、投掷道具、[使用技能](当猫在镜头内时，牛仔汤姆弹弓每射出一个仙人掌都会提供一层素材；凯特的被动每层都会额外提供一层素材；图多盖洛的吻痕每造成一点伤害将提供一层素材)都会被记录为素材，最多叠加5层。到达时限或点击额外技能键可终止采访。采访时或终止采访后均可通过二段技能[进行报道](无素材则无效果)，依次造成：\n1.素材层数×0.6秒眩晕(可破盾)\n2.若素材≥3层，额外造成一次可击落老鼠和道具、极短暂的眩晕(可破盾)\n3.素材层数×30伤害(不可破盾)',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键', '道具键*'],
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '采访期间每隔5秒额外为猫咪叠加一层“素材”。',
            cooldown: 35,
          },
          {
            level: 2,
            description: '减少CD；采访期间获得加速、提升Hp恢复速度。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '采访期间改为每隔2.5秒额外为猫咪叠加一层“素材”。',
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
        description:
          '用魔法相机为面向镜头的所有猫咪和老鼠[生成一张合照](可被虚弱、霸体等状态抵挡，但不能被无敌抵挡)，12秒内可再次使用技能将所有照片中的角色以照片生成时的状态[回溯](可被其虚弱、霸体、护盾、无敌等状态抵挡)',
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
            description: '拍摄到的猫咪额外受到60点伤害和失明。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 20,
          },
        ],
        cooldownTiming: '释放后',
        cancelableSkill: ['道具键*', '跳跃键'],
        cancelableAftercast: ['跳跃键'],
        detailedDescription: '米可拿出魔法相机进行自拍',
      },
      {
        name: '必备专业素养',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '视野范围提升。',
          },
          {
            level: 2,
            description: '给予附近的猫咪“审视”状态，在5秒内暴露小地图位置和降低攻击力。',
          },
          {
            level: 3,
            description: '被攻击后10秒内减少受到的伤害、加速并大幅度提高救援速度。',
          },
        ],
      },
    ],
    aliases: ['记者'],
    counters: [
      {
        id: '米特',
        description:
          '米可的减伤使胡椒粉难以造成伤害；照相机回溯可以舍己救人后不会因为胡椒粉而虚弱。',
        isMinor: false,
      },
      {
        id: '剑客汤姆',
        description: '米可主动技能霸体、被动减伤，克制骑士连斩。',
        isMinor: false,
      },
      {
        id: '莱特宁',
        description: '莱特宁攻击手段有限，米可的高减伤配上逃窜和特技治疗很难被莱特宁击倒。',
        isMinor: false,
      },
    ],
    collaborators: [
      {
        id: '罗宾汉泰菲',
        description: '二级藤蔓可以在米可采访时帮米可回血，提高续航。',
        isMinor: false,
      },
      {
        id: '杰瑞',
        description: '二级鼓舞可以在米可采访时帮米可回血和加速，提高续航。',
        isMinor: true,
      },
      {
        id: '音乐家杰瑞',
        description: '主动技能协奏曲可以在米可采访时给米可回血和加速，提高续航。',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '托普斯',
        description: '捕虫网可以网住正在采访的米可。',
        isMinor: false,
      },
      {
        id: '汤姆',
        description: '无敌可以让米可叠不上素材。',
        isMinor: false,
      },
      {
        id: '布奇',
        description: '高伤害，容易击倒米可；虚弱起身无敌时间长，三级桶盖还有霸体。',
        isMinor: false,
      },
      {
        id: '苏蕊',
        description: '苏蕊的霸体和高伤能有效克制米可。',
        isMinor: false,
      },
    ],
    specialSkills: [
      {
        name: '应急治疗',
        description: '加强生存能力，与被动减伤配合较好',
      },
      {
        name: '魔术漂浮',
        description: '泛用性很高，提高机动性和自保能力',
      },
      {
        name: '勇气投掷',
        description: '用于缩短采访CD',
      },
    ],
  },

  /* ----------------------------------- 霜月 ----------------------------------- */
  霜月: {
    description:
      '外表秀气，内心坚强果敢的霜月是百年来唯一一个通过自己努力进入瑶池，参与仙考的鼠族。自幼和弟弟相依为命的她为了提升自己的修为，曾在幼年时期离开仙界，前往下界独自历练数年，回来的时候已经变成一个法力高强的仙子，身边还多了一个贪吃又可爱的小迷袋——胖呆呆。',
    maxHp: 75,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 640,
    jumpHeight: 400,
    cheesePushSpeed: 2.4,
    wallCrackDamageBoost: 1,
    mousePositioningTags: [
      {
        tagName: '干扰',
        isMinor: false,
        description: '可拦截猫或干扰绑火箭。',
        additionalDescription: '',
      },
      {
        tagName: '破局',
        isMinor: false,
        description: '滑铲可铲飞图多盖洛香水或夹子。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '',
        pattern: '121210002',
        weaponType: 'weapon1',
        description: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'A-投手', 'C-不屈', 'C-救救我'],
        description: '适合打斯飞等依靠追击的猫',
      },
      {
        cards: ['S-铁血', 'S-舍己', 'B-精准投射', 'C-不屈', 'C-救救我'],
        description: '精准投射减少滑铲CD',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'B-绝地反击', 'C-不屈', 'C-救救我'],
        description: '分金符继承绝反伤害可观，3级甚至可二连分金符',
      },
      {
        cards: ['S-舍己', 'S-铁血', 'S-缴械', 'C-救救我'],
        description: '适合打爪刀猫，如托普斯等',
      },
    ],
    skills: [
      {
        name: '滑步踢',
        type: 'active',
        description:
          '向前滑铲，期间可转向且强霸体、跳起可扔出符。若手上无道具，则生成分金符，命中造成伤害、扣除猫的局内金币。若手上拿着[能造成减速的道具](番茄除外)，生成定身符，命中造成伤害和定身效果。手上的控制道具不会变成符。',
        detailedDescription:
          '向前滑铲，期间可转向且强霸体、跳起可扔出符。若手上无道具，则生成分金符，命中造成{60}伤害、扣除猫500局内金币。若手上拿着[能造成减速的道具](番茄除外)，生成定身符，命中造成{40}伤害和2秒定身效果。手上的控制道具不会变成符。铲中猫将解除猫的控制效果。',
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
              '[可铲飞敌方猫](猫在被铲飞过程中为霸体)。每次滑铲命中减少CD。乾坤袋在附近时，滑铲还会造成少量伤害和[眩晕](可击落手中的老鼠)。',
            cooldown: 15,
            detailedDescription:
              '[可铲飞敌方猫1秒](猫在被铲飞过程中前0.7秒为霸体；5秒内不再会被铲飞)。每次命中减少8秒CD。乾坤袋在附近时，滑铲还会造成10伤害和1秒[眩晕](可击落手中的老鼠)。',
          },
          {
            level: 3,
            description: '可储存两次使用。',
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
          '扔出乾坤袋，扔到猫会造成减速、扔到墙缝会造成伤害。落地后鼠方可进行交互。乾坤袋会自动吞噬周围道具或猫并吐出，受到两次攻击进入虚弱状态，一段时间后自动恢复。再次点击收回后技能进入CD。\n融合：老鼠点击交互键与胖呆呆融合。融合后对敌方隐藏小地图位置，并获得霸体。融合后可抱起队友，作为投掷道具扔出，可对猫造成伤害和眩晕。\n吞噬：吞噬投掷道具后，[优先向附近的敌方吐出](袋子伤害和破坏增伤皆为0)。吞噬打开的老鼠夹后，将吐出折叠的老鼠夹。吞噬蛋糕和牛奶后，将向附近的友方吐出，使其立即获得对应效果。吞噬奶酪后，将吐出轻奶酪，搬运时增加移速和跳跃高度。吞噬饮料后，将随机吐出另一个饮料。吞噬敌方猫后，吐出将使其减速一段时间。若吞噬的是火箭，则吐出时会熄灭火箭。\n激励：将自己携带的破墙、无畏、舍己效果给予友方。',
        detailedDescription:
          '扔出乾坤袋，扔到猫会造成减速40%，持续5秒、扔到墙缝会造成4点伤害。落地后所有玩家在小地图可见，鼠方可进行交互。乾坤袋血量为2，受到的伤害固定为1，倒地20秒后起身、获得1秒无敌。乾坤袋会每隔5秒尝试吞噬周围道具或猫并吐出。再次点击收回后技能进入CD。\n融合：老鼠点击交互键耗时1.5秒与胖呆呆融合。融合后对敌方隐藏小地图位置，并获得霸体。融合后可抱起队友，作为投掷道具扔出，可对猫造成50伤害和2.5秒眩晕。\n[吞噬](CD：8秒)：吞噬投掷道具后，[优先向附近的敌方吐出](袋子伤害和破坏增伤皆为0)。吞噬打开的老鼠夹后，将吐出折叠的老鼠夹。吞噬蛋糕和牛奶后，将向附近的友方吐出，使其立即获得对应效果。吞噬奶酪后，将吐出轻奶酪，搬运时增加移速和跳跃高度。吞噬饮料后，将随机吐出另一个饮料。[吞噬敌方猫](10秒后不会再被吞噬)后，吐出将会使其减速40%，持续3秒。若吞噬的是火箭，则吐出时会熄灭火箭。\n[激励](CD：25秒)：可在5秒持续时间内将自己携带的破墙、无畏、舍己、速推效果给予附近的友方。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: ['跳跃键'],
        cancelableAftercast: ['跳跃键', '移动键', '药水键'],
        canHitInPipe: false,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 50,
          },
          {
            level: 2,
            description: '减少CD。收回后根据剩余血量返还CD。',
            cooldown: 30,
            detailedDescription:
              '减少CD。收回后根据剩余血量决定CD（满血：10秒；半血：20秒；空血：30秒）。',
          },
          {
            level: 3,
            description: '提高乾坤袋自动吞噬附近道具的频率。',
            cooldown: 30,
            detailedDescription: '减少乾坤袋自动吞噬附近道具的间隔至3秒。',
          },
        ],
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
      },
      {
        name: '灵气修为',
        type: 'passive',
        skillLevels: [
          {
            level: 1,
            description: '每隔15秒，获得5秒的跳跃加成。',
            detailedDescription: '每隔15秒，获得5秒的50%跳跃高度加成。',
          },
          {
            level: 2,
            description: '符命中敌方时，获得短暂救援速度和推速提升。',
            detailedDescription: '符命中敌方时，救援速度增加50%，推速增加100%，持续5秒。',
          },
          {
            level: 3,
            description: '受到猫的爪击后不会立刻减少Hp，而是在5秒内固定减少60%最大Hp。',
            detailedDescription: '受到猫的爪击后不会立刻减少Hp，而是在5秒内以9/s失去Hp。',
          },
        ],
      },
    ],
    counters: [
      {
        id: '汤姆',
        description: '霜月滑铲可硬拖汤姆的无敌时间，使其绑不上火箭。',
        isMinor: false,
      },
    ],
    counteredBy: [
      {
        id: '托普斯',
        description: '托普斯三级分身霸体免疫滑铲，网可直接网住。',
        isMinor: true,
      },
    ],
    specialSkills: [
      {
        name: '魔术漂浮',
        description: '漂浮空中可扔出多个符，且乾坤袋可终止漂浮。',
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
    collaborators: [
      {
        id: '航海士杰瑞',
        description: '航海士杰瑞可拆掉火箭，便于霜月守火箭。',
        isMinor: true,
      },
      {
        id: '音乐家杰瑞',
        description: '音乐家杰瑞可拆掉火箭，便于霜月守火箭。',
        isMinor: true,
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
    specialSkills: [
      {
        name: '绝处逢生',
        description: '',
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
        description:
          '对附近的猫咪叠加酸涩效果，减少移速、交互速度并造成伤害，最多叠加5层，当叠满时会猫被控制并受到伤害。可进行5次额外表演，随后可以移动并对碰到的敌方单位叠加3成酸涩。',
        detailedDescription:
          '释放柠檬旋风，对附近猫咪叠加酸涩效果，每层减少2.5%移速和交互速度、造成15伤害，最多叠加5层。叠满时会猫被控制2秒并受到35伤害。可进行5次额外表演，随后可以移动并对碰到的敌方单位叠加3层酸涩。',
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

  /* ----------------------------------- 莱恩 ----------------------------------- */
  莱恩: {
    description:
      '来自平面二维空间中的神秘之鼠，诞生于蘸水笔在蓝图上勾勒的几笔线条，获得生命后便决心将自己的灵感挥洒在每个角落。莱恩从画板中一跃而下，属于艺术家的创作从此揭开序幕。',
    maxHp: 70,
    attackBoost: 5,
    hpRecovery: 1,
    moveSpeed: 680,
    jumpHeight: 400,
    cheesePushSpeed: 2.8,
    wallCrackDamageBoost: 0.5,
    mousePositioningTags: [
      {
        tagName: '辅助',
        isMinor: true,
        description: '圆形可以使猫手中道具掉落，三被减少队友技能CD。',
        additionalDescription: '',
      },
      {
        tagName: '干扰',
        isMinor: false,
        description: '守火箭能力一流，配合蓝图，猫很难绑上火箭；方块可以封走位。',
        additionalDescription: '',
      },
    ],
    skillAllocations: [
      {
        id: '蓝图',
        pattern: '12[12]20001',
        weaponType: 'weapon1',
        description: '四级后，如果有队友在火箭上则点主动减慢火箭燃烧；其余情况皆点武器。',
        additionaldescription: '',
      },
    ],
    knowledgeCardGroups: [
      {
        cards: ['S-铁血', 'S-舍己', 'C-救救我', 'S-护佑'],
        description: '带护佑提高自保能力',
      },
      {
        cards: ['S-铁血', 'C-救救我', 'A-逃窜', 'S-舍己', 'C-不屈'],
        description: '应对不能一套秒掉自己的猫，提高续航和牵制能力',
      },
      {
        cards: ['S-回家', 'S-护佑', 'S-铁血', 'C-救救我'],
        description: '适合四排，在队伍里有多个救援位的情况下，提高前后期自保',
      },
    ],
    skills: [
      {
        name: '蓝图',
        type: 'active',
        description:
          '莱恩扔出[蓝图](再次使用技能可可主动关闭)。蓝图内的火箭燃烧速度减半、隐身的猫咪会显形；在蓝图内受到伤害的猫咪会短暂变为线条猫，并使手中老鼠掉落。线条猫只可使用移动、跳跃和爪刀，但受到的伤害、爪刀CD、受控时间、虚弱时间减半。',
        detailedDescription:
          '莱恩扔出[蓝图](大小1000×666，可主动打开和关闭蓝图，前摇0.6s，主动打开蓝图硬控0.5s)，碰到平台或者墙体时打开，持续30s。蓝图内的火箭燃烧速度减半、隐身的猫咪会显形；在蓝图内受到伤害的猫咪会短暂变为线条猫，[持续8s](内置CD20s)，并使手中老鼠掉落。线条猫只可使用移动、跳跃和爪刀，但受到的伤害、爪刀CD、受控时间、虚弱时间减半。同一时间只可存在一个蓝图；蓝图收起后才会进入CD。\n合成配方：\n▲+●={航海士杰瑞}1级炸药桶\n▲+■={雪梨}1级花洒\n●+■={泰菲}1级地雷\n●+●={拿坡里鼠}1级饼\n▲+▲={罗宾汉泰菲}2级藤蔓\n■+■={侦探杰瑞}1级烟雾弹',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            detailedDescription: '',
            cooldown: 25,
          },
          {
            level: 2,
            description: '提高蓝图持续时间。',
            cooldown: 25,
            detailedDescription: '提高蓝图持续时间至60s。',
          },
          {
            level: 3,
            description: '扔出的蓝图命中猫咪，会使其直接变成线条猫。',
            cooldown: 25,
          },
        ],
        cancelableSkill: '不可被打断',
        canHitInPipe: false,
        cooldownTiming: '释放后',
        cueRange: '本房间可见',
        aliases: [],
      },
      {
        name: '蘸水笔',
        aliases: ['方块或圆'],
        type: 'weapon1',
        description:
          '绘制圆形、三角和方块，可储存3次。在蓝图上绘制时，两种图形碰撞可合成其他的老鼠的专属道具。\n圆形：释放后向莱恩的反方向滚动，产生阻挡并对触碰的猫咪造成伤害、手上道具掉落。\n三角：对踩中的猫咪造成少量伤害，并降低移速和绑火箭速度。\n方块：停留在生成位置，可被推动，可作为平台或墙壁使用，被爪刀攻击后消失。',
        detailedDescription:
          '在半径800范围内绘制圆形、三角和方块，前摇0.1s，可储存3次。在蓝图上绘制时，两种图形碰撞可合成其他老鼠的专属道具。\n圆形：释放后向莱恩的反方向滚动，产生阻挡并对触碰的猫咪造成30伤害、手上道具掉落；碰撞3次后或存在10s后消失。\n三角：对踩中的猫咪造成15伤害、12.5%减速和绑火箭速度下降35%，持续7s；被猫咪踩中或持续10s后消失。\n方块：停留在生成位置，可被推动，可作为平台或墙壁使用；碰撞四次、被爪刀攻击或25s后消失。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        canHitInPipe: true,
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 8,
          },
          {
            level: 2,
            description:
              '在蓝图上绘制时，会强化能力。\n强化圆形：会进行跳跃，伤害更高，但移速减慢。\n强化三角：踩中后将飞出普通三角。\n强化方块：反弹碰到的敌方。',
            cooldown: 8,
            detailedDescription:
              '在蓝图上绘制时，会强化能力。\n强化圆形：会进行跳跃，伤害提高为50，但移速减慢至原来的60%。\n强化三角：踩中后将飞出3个普通三角。\n强化方块：反弹碰到的敌方，第一次反弹0.65s，其余反弹0.1s。',
          },
          {
            level: 3,
            description: '提高强化图形持续时间；可多储存一次。',
            cooldown: 8,
            detailedDescription: '提高强化图形持续时间，方块60s，圆20s，三角15s；可多储存一次。',
          },
        ],
        cancelableAftercast: ['跳跃键', '移动键', '道具键'],
        cueRange: '本房间可见',
        cancelableSkill: '不可被打断',
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
        description: '拉到高点放方块使猫上不来，拖时间',
      },
      {
        name: '急速翻滚',
        description: '拉开距离，方块阻挡，快速逃跑',
      },
      {
        name: '绝处逢生',
        description: '猫被变为粉笔猫后无法抓起，可铁血拉远用自起',
      },
    ],
    counters: [
      {
        id: '追风汤姆',
        description: '莱恩的圆形、方块可以封锁追风汤姆的走位，并阻挡旋风和铁砧，还可能导致其坠机',
        isMinor: false,
      },
      {
        id: '汤姆',
        description: '莱恩克制汤姆的无敌，阻止上火箭，但注意不要被二被秒掉',
        isMinor: true,
      },
    ],
    collaborators: [],
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
      imageUrl: AssetManager.getCharacterImageUrl(characterId, 'mouse'),
      skills: AssetManager.addSkillImageUrls(characterId, character.skills, 'mouse'),
    },
  ])
);
