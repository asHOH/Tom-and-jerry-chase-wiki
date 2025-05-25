import { Character } from './types';

// Generate image URL based on character ID for mouse faction
const getMouseImageUrl = (characterId: string): string => {
  // Check if the image exists, otherwise use a placeholder
  const existingImages = ['jerry', 'tuffy', 'nibbles'];

  if (existingImages.includes(characterId)) {
    return `/images/mice/${characterId}.png`;
  } else {
    // Use mouse-specific placeholder
    return `/images/mice/placeholder-mouse.png`;
  }
};

export const mouseCharacters: Record<string, Character> = {
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

// Generate characters with image URLs
export const mouseCharactersWithImages = Object.fromEntries(
  Object.entries(mouseCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      imageUrl: getMouseImageUrl(characterId)
    }
  ])
);
