// Define types for better type safety
export type FactionId = 'cat' | 'mouse';

export type Faction = {
  id: FactionId;
  name: string;
  description: string;
};

export type Character = {
  id: string;
  name: string;
  factionId: FactionId;
  description: string;
  imageUrl?: string; // We'll generate it automatically

  // Common attributes for all characters
  maxHp?: number; // Hp上限
  attackBoost?: number; // 攻击增伤
  hpRecovery?: number; // Hp恢复
  moveSpeed?: number; // 移速
  jumpHeight?: number; // 跳跃

  // Cat-specific attributes
  clawKnifeCdHit?: number; // 爪刀CD (命中)
  clawKnifeCdUnhit?: number; // 爪刀CD (未命中)
  clawKnifeRange?: number; // 爪刀范围

  // Mouse-specific attributes
  cheesePushSpeed?: number; // 推奶酪速度
  wallCrackDamageBoost?: number; // 墙缝增伤

  skills: Skill[];
};

export type Skill = {
  id: string;
  name: string;
  type: 'ACTIVE' | 'WEAPON1' | 'WEAPON2' | 'PASSIVE';
  description?: string; // Basic description (optional, especially for passive skills)
  detailedDescription?: string; // Detailed description for detailed view

  // Skill usage properties
  canMoveWhileUsing?: boolean; // 移动释放
  canUseInAir?: boolean; // 空中释放
  cancelableSkill?: string; // 可取消释放
  cancelableAftercast?: string; // 可取消后摇

  skillLevels: SkillLevel[];
};

export type SkillLevel = {
  level: number;
  description: string;
  detailedDescription?: string; // Detailed description for this specific level
  damage?: string;
  cooldown?: number;
  videoUrl?: string | null;
};

// Generate image URL based on character ID
const getImageUrl = (characterId: string, factionId?: FactionId): string => {
  // Check if the image exists, otherwise use a placeholder
  // In a real app, you would check if the file exists on the server
  const existingImages = ['tom', 'jerry', 'tuffy', 'nibbles', 'butch', 'topsy'];

  if (existingImages.includes(characterId)) {
    return `/images/${characterId}.png`;
  } else {
    // Use faction-specific placeholder based on the faction ID
    return `/images/placeholder-${factionId === 'cat' ? 'cat' : 'mouse'}.png`;
  }
};

/* -------------------------------------------------------------------------- */
export const factionData: Record<FactionId, Faction> = {
  cat: {
    id: 'cat',
    name: '猫阵营',
    description: '猫阵营需要阻止鼠阵营推奶酪，并将他们绑上火箭放飞',
  },
  mouse: {
    id: 'mouse',
    name: '鼠阵营',
    description: '鼠阵营共有4名角色，需要躲避猫的攻击、推完5块奶酪并砸开墙缝',
  }
};

/* -------------------------------------------------------------------------- */
export const characterData: Record<string, Character> = {
  tom: {
    id: 'tom',
    name: '汤姆',
    factionId: 'cat',
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家',

    // Common attributes
    maxHp: 255,
    hpRecovery: 3.5,
    moveSpeed: 755,
    jumpHeight: 420,

    // Cat-specific attributes
    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.3,
    clawKnifeRange: 300,
    skills: [
      {
        id: 'tom-active',
        name: '发怒冲刺',
        type: 'ACTIVE',
        description: '解控并进入一段时间的无敌。',
        detailedDescription: '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌期间获得12.5%加速，仍会受到真实伤害（如仙女鼠的一星；但不会因此被击倒）和位移效果的影响（如尼宝的钩子）。无敌结束后会有2秒的10%减速（可以被护盾抵消）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断，但不返还CD',
        cancelableAftercast: '无后摇',
        skillLevels: [
          { level: 1, description: '持续3.8秒', cooldown: 20, videoUrl: '/videos/tom-active-1.mp4' },
          { level: 2, description: '持续6.8秒', cooldown: 20, videoUrl: '/videos/tom-active-2.mp4' },
          { level: 3, description: '无敌期间减少25%爪刀CD', cooldown: 20, videoUrl: '/videos/tom-active-3.mp4' },
        ]
      },
      {
        id: 'tom-weapon1',
        name: '手型枪',
        type: 'WEAPON1',
        description: '汤姆最爱的捕鼠神器。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '可被跳跃键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '手型枪会水平飞出、原路飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
            detailedDescription: '手型枪会水平飞出、原路飞回，对命中的老鼠造成15点伤害、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，额外给予65点伤害。眩晕对比例鼠和虚弱的老鼠也生效。',
            cooldown: 12, videoUrl: '/videos/tom-weapon1-1.mp4'
          },
          { level: 2, description: '手型枪飞行速度增加', cooldown: 12, videoUrl: '/videos/tom-weapon1-2.mp4' },
          { level: 3, description: '猫咪可以直接抓起被手型枪拉回并眩晕的老鼠', cooldown: 12, videoUrl: '/videos/tom-weapon1-3.mp4' },
        ]
      },
      {
        id: 'tom-weapon2',
        name: '平底锅',
        type: 'WEAPON2',
        description: '比手型枪攻击力更高，但范围更小。',
        detailedDescription: '比手型枪攻击力更高，但范围更小。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '打晕并致盲附近的老鼠、降低命中老鼠的救援速度；也能击飞附近的道具',
            detailedDescription: '挥锅对命中的老鼠造成15点伤害、5秒失明和55%救援减速，并打出煎蛋；煎蛋也会对命中的老鼠造成15点伤害、5秒失明和55%救援减速；被锅命中的老鼠落地后受到25点伤害，并眩晕1秒。',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '致盲延长至7.5秒；锅命中老鼠立刻刷新爪刀CD。',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被平底锅命中、落地后眩晕的老鼠',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'tom-passive',
        name: '捕鼠专家',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '对敌方造成伤害时回复Hp并加速',
            detailedDescription: '对敌方造成伤害时，回复25Hp并获得2.6秒的9.5%加速；若伤害来自爪刀命中，额外回复25Hp。',
            videoUrl: null
          },
          {
            level: 2,
            description: '手握老鼠时依然可以攻击',
            detailedDescription: '手握老鼠时依然可以攻击，并可触发蓄势、击晕等效果，但不会改变惯性（即不能用二被进行楼梯刀加速）',
            videoUrl: null
          },
          {
            level: 3,
            description: '对敌方造成伤害时，给予3秒沉默',
            detailedDescription: '对敌方造成伤害时，给予3秒沉默',
            videoUrl: null
          },
        ]
      }
    ]
  },
  butch: {
    id: 'butch',
    name: '布奇',
    factionId: 'cat',
    description: '“流浪猫铁三角”中的老大，从街头流浪逆袭为亿万富豪',

    // Common attributes
    maxHp: 220,
    attackBoost: 25,
    hpRecovery: 2,
    moveSpeed: 745,
    jumpHeight: 420,

    // Cat-specific attributes
    clawKnifeCdHit: 6,
    clawKnifeCdUnhit: 4.8,
    clawKnifeRange: 280,

    skills: [
      {
        id: 'butch-active',
        name: '横冲直撞',
        type: 'ACTIVE',
        description: '猛冲一段距离，击飞道具并对老鼠造成伤害和晕眩。可通过方向键改变方向。',
        detailedDescription: '猛冲一段距离，击飞道具并对老鼠造成伤害和晕眩。可通过方向键改变方向。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可打断',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成25点伤害和短暂眩晕',
            cooldown: 20,
            videoUrl: '/videos/butch-active-1.mp4'
          },
          {
            level: 2,
            description: '减少前摇、冲刺更迅速',
            cooldown: 20,
            videoUrl: '/videos/butch-active-2.mp4'
          },
          {
            level: 3,
            description: '冲刺更迅速、大幅提高造成的眩晕时间；命中时提升移速',
            cooldown: 20,
            videoUrl: '/videos/butch-active-3.mp4'
          },
        ]
      },
      {
        id: 'butch-weapon1',
        name: '垃圾盖',
        type: 'WEAPON1',
        description: '小范围AOE。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键取消',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕附近老鼠',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-1.mp4'
          },
          {
            level: 2,
            description: '增加眩晕时间、被命中的老鼠攻击力短暂降低；震碎附近的易碎道具',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-2.mp4'
          },
          {
            level: 3,
            description: '被命中的老鼠救援速度短暂降低',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-3.mp4'
          },
        ]
      },
      {
        id: 'butch-weapon2',
        name: '旋转桶盖',
        type: 'WEAPON2',
        description: '原地释放或扔出几何桶盖。',
        detailedDescription: '原地释放或扔出几何桶盖，轨迹十分独特。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃/道具键打断',
        cancelableAftercast: '可被跳跃/道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕命中的老鼠；自己捡到桶盖会获得6秒减伤',
            cooldown: 20,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '减少CD',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '增加桶盖飞行速度；自己捡到桶盖会额外获得强霸体',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'butch-passive',
        name: '力大无穷',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '虚弱后更快起身、无敌时间更长',
            // detailedDescription: '虚弱后更快起身、无敌时间更长',
            videoUrl: null
          },
          {
            level: 2,
            description: '投掷道具造成额外伤害',
            videoUrl: null
          },
          {
            level: 3,
            description: '爪刀有30%概率直接造成虚弱；技能和道具造成的控制时间增加1秒',
            videoUrl: null
          },
        ]
      }
    ]
  },
  topsy: {
    id: 'topsy',
    name: '托普斯',
    factionId: 'cat',
    description: '“流浪猫铁三角”的一员，呆萌小灰猫，爱和小老鼠交朋友',

    // Common attributes
    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 780,
    jumpHeight: 420,

    // Cat-specific attributes
    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.6,
    clawKnifeRange: 220,

    skills: [
      {
        id: 'topsy-active',
        name: '双重猫格',
        type: 'ACTIVE',
        description: '释放分身。分身继承知识卡、无视碎片和老鼠夹、爪刀冷却减少、提供小地图视野，但被攻击时会受到固定额外伤害。被额外技能按钮可指挥分身出击或跟随。再次使用技能可与分身换位。',
        detailedDescription: '释放分身。分身继承知识卡、无视碎片和老鼠夹、爪刀冷却减少、提供小地图视野（包括隐身的老鼠），但被攻击时会受到固定额外伤害。被额外技能按钮可指挥分身出击或跟随（CD为5秒）。再次使用技能可与分身换位。本体获得部分增益时，分身也会获得。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可取消',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '换位CD为15秒；分身在一段时间或被击倒后消失',
            cooldown: 36,
            videoUrl: '/videos/topsy-active-1.mp4'
          },
          {
            level: 2,
            description: '减少CD；换位CD缩短至10秒；换位时回复Hp并获得短暂加速和交互速度提升',
            cooldown: 24,
            videoUrl: '/videos/topsy-active-2.mp4'
          },
          {
            level: 3,
            description: '减少CD；换位CD缩短至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分控制和受到的一半伤害会转移给分身。',
            detailedDescription: '减少CD；换位CD缩短至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分控制（不包括狗哥抓取、老鼠夹、虚弱、仙女鼠8星、尼宝钩子等）和受到的一半伤害会转移给分身。',
            cooldown: 20,
            videoUrl: '/videos/topsy-active-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-weapon1',
        name: '泡泡棒',
        type: 'WEAPON1',
        description: '吹出泡泡来困住老鼠。',
        detailedDescription: '吹出泡泡来困住老鼠。泡泡可以被道具砸破，也会因困住的老鼠挣扎而破裂。泡泡破裂时会伤害和眩晕周围老鼠；20秒后自然消失。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '吹出一个泡泡',
            detailedDescription: '吹出一个泡泡，直接释放则泡泡会留在原地，拖动释放则泡泡会缓慢向该方向漂移。',
            cooldown: 20,
            videoUrl: '/videos/topsy-weapon1-1.mp4'
          },
          {
            level: 2,
            description: '减少CD',
            cooldown: 12,
            videoUrl: '/videos/topsy-weapon1-2.mp4'
          },
          {
            level: 3,
            description: '一次吹出两个泡泡',
            cooldown: 12,
            videoUrl: '/videos/topsy-weapon1-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-weapon2',
        name: '捕虫网',
        type: 'WEAPON2',
        description: '将面前的一只老鼠抓到网中；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠会被直接绑上途经的火箭。',
        detailedDescription: '将面前的一只老鼠抓到网中，期间老鼠可挣扎挣脱（若有多个老鼠在网的范围内，则会网住编号最小的）；再次使用技能将老鼠扔出，扔出的老鼠落地后眩晕并再次受到伤害，同时伤害周围的老鼠。扔出的老鼠会被直接绑上途经的火箭。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '',
            // detailedDescription: '',
            cooldown: 15,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大',
            detailedDescription: '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大',
            cooldown: 15,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '减少CD',
            cooldown: 10,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-passive',
        name: '元气满满',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '爪刀命中后大幅减少爪刀CD',
            videoUrl: null
          },
          {
            level: 2,
            description: '手中的老鼠挣扎速度降低30%',
            videoUrl: null
          },
          {
            level: 3,
            description: '击中老鼠时，移除其大部分增益',
            // detailedDescription: '爪刀有30%概率直接造成虚弱；技能和道具造成的控制时间增加1秒',
            videoUrl: null
          },
        ]
      }
    ]
  },
  jerry: {
    id: 'jerry',
    name: '杰瑞',
    factionId: 'mouse',
    description: '古灵精怪的小老鼠，喜欢戏弄汤姆，汤姆的欢喜冤家',

    // Common attributes
    maxHp: 100, // 原则上是99，但还是说100更方便
    attackBoost: 15,
    hpRecovery: 2,
    moveSpeed: 650,
    jumpHeight: 400,

    // Mouse-specific attributes
    cheesePushSpeed: 4,
    wallCrackDamageBoost: 1,
    skills: [
      {
        id: 'jerry-active',
        name: '鼓舞',
        type: 'ACTIVE',
        description: '短暂增加自己和附近队友的移速和跳跃高度',
        detailedDescription: '增加自己和附近队友15%移速和45%跳跃高度，持续5秒',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '后摇不可取消',
        skillLevels: [
          {
            level: 1,
            description: '',
            cooldown: 18,
            videoUrl: '/videos/jerry-active-1.mp4'
          },
          { level: 2,
            description: '鼓舞额外回复25Hp',
            cooldown: 18,
            videoUrl: '/videos/jerry-active-2.mp4'
          },
          { level: 3,
            description: '鼓舞额外解除受伤状态，并延长附近绑有老鼠的火箭10秒燃烧时间',
            cooldown: 18,
            videoUrl: '/videos/jerry-active-3.mp4'
          },
        ]
      },
      {
        id: 'jerry-weapon1',
        name: '大铁锤',
        type: 'WEAPON1',
        description: '近身攻击',
        // detailedDescription: '近身攻击',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断（*表示需要手中有道具或【所在处有道具且技能在地面原地释放】时才能打断/取消）', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '后摇不可取消',
        skillLevels: [
          {
            level: 1,
            description: '硬控敌方3秒',
            cooldown: 20,
            videoUrl: '/videos/jerry-weapon-1.mp4'
          },
          {
            level: 2,
            description: '额外造成65伤害；每次命中永久增加10%推速，最多叠五层',
            cooldown: 16,
            videoUrl: '/videos/jerry-weapon-2.mp4'
          },
          {
            level: 3,
            description: '控制时间延长至4秒',
            cooldown: 12,
            videoUrl: '/videos/jerry-weapon-3.mp4'
          },
        ]
      },
      {
        id: 'jerry-weapon2',
        name: '鸟哨',
        type: 'WEAPON2',
        description: '召唤投掷炸弹的金丝雀',
        detailedDescription: '召唤投掷炸弹的金丝雀。同一房间内最多只能有一只投掷炸弹的金丝雀。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断（*表示需要手中或所在处有道具时才能打断/取消）',
        cancelableAftercast: '可被道具键*取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '炸弹造成55伤害和2秒眩晕',
            detailedDescription: '炸弹造成55伤害和2秒眩晕；总共释放约15个炸弹；敌方被金丝雀的炸弹命中后将对其短暂免疫。',
            cooldown: 30,
            videoUrl: '/videos/jerry-weapon-1.mp4'
          },
          {
            level: 2,
            description: '提高金丝雀投掷炸弹的频率',
            detailedDescription: '提高金丝雀投掷炸弹的频率，炸弹数量提升到约17个',
            cooldown: 30,
            videoUrl: '/videos/jerry-weapon-2.mp4'
          },
          {
            level: 3,
            description: '减少CD；进一步提高金丝雀投掷炸弹的频率',
            detailedDescription: '减少CD；进一步提高金丝雀投掷炸弹的频率，炸弹数量提升到约20个',
            cooldown: 24,
            videoUrl: '/videos/jerry-weapon-3.mp4'
          },
        ]
      },
      {
        id: 'jerry-passive',
        name: '奶酪好手',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '增加推奶酪速度',
            // detailedDescription: '增加推奶酪速度',
            videoUrl: null
          },
          {
            level: 2,
            description: '搬起奶酪时，移速增加52%、跳跃高度增加25%',
            // detailedDescription: '搬起奶酪时，移速增加52%、跳跃高度增加25%',
            videoUrl: null
          },
          {
            level: 3,
            description: '奶酪被推完或墙缝被破坏到一定程度时，解除虚弱和受伤状态，回复20Hp，并获得短暂加速',
            detailedDescription: '奶酪被推完或墙缝被破坏到80%、60%、40%、20%、0%时，解除虚弱和受伤状态，回复20Hp，并获得2.7秒的13%加速',
            videoUrl: null
          },
        ]
      }
    ]
  },
  tuffy: {
    id: 'tuffy',
    name: '泰菲',
    factionId: 'mouse',
    description: '杰瑞的侄子，总将自己吃得圆滚滚的',

    // Common attributes
    maxHp: 75,
    attackBoost: 5,
    hpRecovery: 2.5,
    moveSpeed: 630,
    jumpHeight: 380,

    // Mouse-specific attributes
    cheesePushSpeed: 3.85,
    wallCrackDamageBoost: 0.5,

    skills: []
  },
  nibbles: {
    id: 'nibbles',
    name: '尼宝',
    factionId: 'mouse',
    description: '爱捣蛋、爱运动的机灵鬼',

    // Common attributes
    maxHp: 100,
    attackBoost: 10,
    hpRecovery: 2,
    moveSpeed: 640,
    jumpHeight: 400,

    // Mouse-specific attributes
    cheesePushSpeed: 2.85,
    wallCrackDamageBoost: 1,

    skills: []
  }
};

// Generate derived data structures for the application
// 1. Create factions with their characters
export const factions = Object.fromEntries(
  Object.entries(factionData).map(([factionId, faction]) => {
    // Get all characters belonging to this faction
    const factionCharacters = Object.values(characterData)
      .filter(character => character.factionId === factionId)
      .map(({ id, name, imageUrl }) => ({
        id,
        name,
        // Use the character's ID to generate the image URL if not provided
        imageUrl: imageUrl || getImageUrl(id, factionId as FactionId)
      }));

    return [factionId, { ...faction, characters: factionCharacters }];
  })
);

// 2. Create characters with faction objects
export const characters = Object.fromEntries(
  Object.entries(characterData).map(([characterId, character]) => {
    // Use type assertion to ensure TypeScript knows factionId is valid
    const factionId = character.factionId as FactionId;
    const faction = factionData[factionId];

    return [characterId, {
      ...character,
      // Use the character's ID to generate the image URL if not provided
      imageUrl: character.imageUrl || getImageUrl(characterId, factionId),
      faction: { id: faction.id, name: faction.name }
    }];
  })
);
