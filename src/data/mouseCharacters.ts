import { Character } from './types';
import { addSkillImageUrls } from '../lib/skillUtils';

// Generate image URL based on character ID
const getMouseImageUrl = (characterId: string): string => {
  // Check if the image exists, otherwise use a placeholder
  const existingImages = ['杰瑞', '泰菲', '尼宝', '航海士杰瑞'];

  if (existingImages.includes(characterId)) {
    return `/images/mice/${characterId}.png`;
  } else {
    return `/images/mice/placeholder-mouse.png`;
  }
};

export const mouseCharacters: Record<string, Character> = {
  /* ----------------------------------- 杰瑞 ----------------------------------- */
  杰瑞: {
    id: '杰瑞',
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

    skills: [
      {
        id: '杰瑞-active',
        name: '鼓舞',
        type: 'ACTIVE',
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
        id: '杰瑞-weapon1',
        name: '大铁锤',
        type: 'WEAPON1',
        description: '举起大铁锤近身攻击。',
        // detailedDescription: '举起大铁锤近身攻击。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '不可取消后摇',
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
        id: '杰瑞-weapon2',
        name: '鸟哨',
        type: 'WEAPON2',
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
        id: '杰瑞-passive',
        name: '奶酪好手',
        type: 'PASSIVE',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=36',
        skillLevels: [
          {
            level: 1,
            description: '增加推速。',
            // detailedDescription: '增加推速'
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
    knowledgeCardGroups: [['S-铁血', 'S-护佑', 'S-回家', 'C-救救我']],
  },

  /* ----------------------------------- 泰菲 ----------------------------------- */
  泰菲: {
    id: '泰菲',
    description: '杰瑞的侄子，总将自己吃得圆滚滚的',

    maxHp: 74,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 630,
    jumpHeight: 380,
    cheesePushSpeed: 3.85,
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

    skills: [
      {
        id: '泰菲-active',
        name: '圆滚滚',
        type: 'ACTIVE',
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
        id: '泰菲-weapon1',
        name: '火箭筒',
        type: 'WEAPON1',
        description: '发射一枚弹头。',
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
        id: '泰菲-weapon2',
        name: '隐形感应雷',
        type: 'WEAPON2',
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
        id: '泰菲-passive',
        name: '茁壮成长',
        type: 'PASSIVE',
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
    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-精准投射', 'B-绝地反击', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
    ],
  },

  /* ----------------------------------- 尼宝 ----------------------------------- */
  尼宝: {
    id: '尼宝',
    description: '爱捣蛋、爱运动的机灵鬼',

    maxHp: 99,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 640,
    jumpHeight: 400,
    cheesePushSpeed: 2.85,
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

    skills: [
      {
        id: '尼宝-active',
        name: '灵活跳跃',
        type: 'ACTIVE',
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
        id: '尼宝-weapon1',
        name: '尼宝的朋友',
        type: 'WEAPON1',
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
        id: '尼宝-passive',
        name: '古灵精怪',
        type: 'PASSIVE',
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
    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'B-逃之夭夭', 'C-不屈', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'B-幸运', 'C-脱身'],
    ],
  },

  /* ----------------------------------- 航海士杰瑞 ----------------------------------- */
  航海士杰瑞: {
    id: '航海士杰瑞',
    description: '公海上向往自由的航海士杰瑞，是最强大的航海家，他浑身充满野性，常年与火炮打交道的他，善于破坏火箭。',

    maxHp: 99,
    attackBoost: 20,
    hpRecovery: 1.67,
    moveSpeed: 640,
    jumpHeight: 380,
    cheesePushSpeed: 3.25,
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
      // TODO: complete it
      {
        id: '',
        pattern: '121221000',
        weaponType: 'weapon1',
        description: '',
        additionaldescription: '',
      },
    ],

    skills: [
      {
        id: '航海士杰瑞-active',
        name: '飞翔金币',
        type: 'ACTIVE',
        description: '拿出一枚能对猫咪造成眩晕的金币，金币能穿过大部分平台。',
        detailedDescription: '拿出一枚能对猫咪造成眩晕的金币，金币能穿过大部分平台，对猫造成2秒眩晕以及35点伤害（包括航海士杰瑞自身的增伤则为55点伤害）。金币击中后会使猫咪短暂进入“金币免疫”状态，金币无法对此状态下的猫咪造成效果。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '无后摇',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=10.6',
        skillLevels: [
          {
            level: 1,
            description: '富有的航海士杰瑞扔出一枚黄金钱币把猫咪砸飞。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '技能的冷却间隔减短。',
            cooldown: 15,
          },
          {
            level: 3,
            description: '金币可以对猫咪造成2次伤害和控制效果。',
            detailedDescription:
              '金币可以对猫咪造成2次伤害和控制效果，一共造成99点伤害，但最多破一层盾。',
            cooldown: 15,
          },
        ],
      },
      {
        id: '航海士杰瑞-weapon1',
        name: '火药桶',
        type: 'WEAPON1',
        description:
          '放置一个能破坏火箭、墙缝的火药桶，火药桶爆炸后会破坏附近的火箭。猫咪在绑被破坏的火箭前需要先修复火箭。火药桶可以被鞭炮炸飞。',
        detailedDescription:
          '放置一个能破坏火箭、墙缝的火药桶，火药桶爆炸后会破坏附近的火箭，猫咪可以拆除火药桶，耗时1秒，老鼠可以推动火药桶。火药桶被打击后会引线时长会降低5秒。猫咪在绑被破坏的火箭前需要先修复火箭。航海士杰瑞破坏绑有队友的火箭后则会救下队友（能触发无畏、舍己）。火药桶可以被鞭炮炸飞，在火药桶左侧的鞭炮会使火药桶呈抛物线飞出，右侧的鞭炮会使火药桶水平滑行。',
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
            description: '减少CD。',
            detailedDescription:
              '减少CD，对附近猫和老鼠的伤害提升至45点。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '火药桶引线减短，破坏的火箭无法自动恢复，威力增强。',
            detailedDescription: '火药桶引线时长减短至3秒，破坏的火箭无法自动恢复，对附近猫和老鼠的伤害提升至70点。',
            cooldown: 30,
          },
        ],
      },
      {
        id: '航海士杰瑞-weapon2',
        name: '舰艇火炮',
        type: 'WEAPON2',
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
            description: '放置一个舰艇火炮。',
            detailedDescription:
              '放置一个舰艇火炮，火炮持续15秒。',
            cooldown: 25,
          },
          {
            level: 2,
            description: '火炮的持续时间延长。',
            detailedDescription:
              '火炮的持续时间延长至25秒。',
            cooldown: 25,
          },
          {
            level: 3,
            description: '减少火炮的CD。',
            cooldown: 15,
          },
        ],
      },
      {
        id: '航海士杰瑞-passive',
        name: '无坚不摧',
        type: 'PASSIVE',
        // videoUrl: 'https://www.bilibili.com/video/BV1ts4y1Y7Fj?t=36.3',
        skillLevels: [
          {
            level: 1,
            description: '使用道具击中猫后，使猫咪受到短暂的减速。',
            detailedDescription: '使用道具击中猫后，使猫咪受到20%减速，持续3.5秒。',
          },
          {
            level: 2,
            description: '在猫手中挣扎的速度变快，挣脱后获得短暂的护盾和加速效果。',
            detailedDescription:
              '挣扎速度提升50%，挣扎时间变为13.33秒，挣脱后获得4.75秒的护盾，护盾期间移速增加15%。',
          },
          {
            level: 3,
            description: '破坏墙缝的能力得到提升。',
            detailedDescription: '每次攻击对墙缝的伤害增加1.3，即破坏增加至2.8。',
          },
        ],
      },
    ],
    knowledgeCardGroups: [
      ['S-铁血', 'S-舍己', 'A-投手', 'B-绝地反击', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'S-护佑', 'C-救救我'],
    ],
  },
};

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
