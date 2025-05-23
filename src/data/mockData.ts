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
  maxHP?: number; // 健康值上限
  attackBoost?: number; // 攻击增伤
  hpRecovery?: number; // 健康值恢复
  moveSpeed?: number; // 移动速度
  jumpHeight?: number; // 跳跃高度

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
  detailedDescription?: string; // Detailed description for advanced view

  // Skill usage properties
  canMoveWhileUsing: boolean; // 移动释放
  canUseInAir: boolean; // 空中释放
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
    description: '鼠阵营需要躲避猫的攻击，推完5块奶酪并砸开墙缝',
  }
};

/* -------------------------------------------------------------------------- */
export const characterData: Record<string, Character> = {
  tom: {
    id: 'tom',
    name: '汤姆',
    factionId: 'cat',
    description: '经典角色汤姆猫。',

    // Common attributes
    maxHP: 255,
    attackBoost: 0,
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
        detailedDescription: '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌结束后会有持续两秒的减速。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可通过道具键取消，但不返还CD。',
        skillLevels: [
          { level: 1, description: '造成100点伤害，击退1米', damage: '100', cooldown: 8, videoUrl: '/videos/tom-active-1.mp4' },
          { level: 2, description: '造成150点伤害，击退1.5米', damage: '150', cooldown: 7, videoUrl: '/videos/tom-active-2.mp4' },
          { level: 3, description: '造成200点伤害，击退2米', damage: '200', cooldown: 6, videoUrl: '/videos/tom-active-3.mp4' },
        ]
      },
      {
        id: 'tom-weapon',
        name: '捕鼠陷阱',
        type: 'WEAPON1',
        description: '放置一个陷阱，踩到的老鼠会被困住一段时间',
        detailedDescription: '汤姆猫在地面上放置一个捕鼠陷阱，陷阱在放置后3秒内激活。老鼠踩到激活的陷阱会被困住，无法移动或使用技能。陷阱持续时间30秒，最多可同时存在2个陷阱。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: '可被主动技能打断',
        cancelableAftercast: '后摇可取消',
        skillLevels: [
          { level: 1, description: '困住2秒', damage: '0', cooldown: 15, videoUrl: '/videos/tom-weapon-1.mp4' },
          { level: 2, description: '困住3秒', damage: '0', cooldown: 13, videoUrl: '/videos/tom-weapon-2.mp4' },
          { level: 3, description: '困住4秒', damage: '0', cooldown: 10, videoUrl: '/videos/tom-weapon-3.mp4' },
        ]
      },
      {
        id: 'tom-weapon2',
        name: '猫爪飞镖',
        type: 'WEAPON2',
        description: '投掷飞镖，命中的老鼠会被减速',
        detailedDescription: '汤姆猫投掷一枚猫爪形状的飞镖，飞行距离5米。飞镖命中老鼠后会造成少量伤害并减速目标。飞镖可以穿透障碍物，但只能命中一个目标。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被主动技能打断',
        cancelableAftercast: '后摇可取消',
        skillLevels: [
          { level: 1, description: '减速30%，持续1.5秒', damage: '20', cooldown: 10, videoUrl: '/videos/tom-weapon2-1.mp4' },
          { level: 2, description: '减速40%，持续2秒', damage: '30', cooldown: 9, videoUrl: '/videos/tom-weapon2-2.mp4' },
          { level: 3, description: '减速50%，持续2.5秒', damage: '40', cooldown: 8, videoUrl: '/videos/tom-weapon2-3.mp4' },
        ]
      },
      {
        id: 'tom-passive',
        name: '捕鼠专家',
        type: 'PASSIVE',
        // No description for passive skill
        canMoveWhileUsing: true,
        canUseInAir: true,
        skillLevels: [
          {
            level: 1,
            description: '移动速度提高10%',
            detailedDescription: '被动提升汤姆的移动速度，使其更容易追捕老鼠。此效果始终生效，不需要激活。',
            damage: '0',
            cooldown: 0,
            videoUrl: null
          },
          {
            level: 2,
            description: '移动速度提高15%',
            detailedDescription: '被动提升汤姆的移动速度，使其更容易追捕老鼠。此效果始终生效，不需要激活。',
            damage: '0',
            cooldown: 0,
            videoUrl: null
          },
          {
            level: 3,
            description: '移动速度提高20%',
            detailedDescription: '被动提升汤姆的移动速度，使其更容易追捕老鼠。此效果始终生效，不需要激活。',
            damage: '0',
            cooldown: 0,
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
    description: '布奇是一只黑色的猫，体型比汤姆猫更大，力量更强。他是汤姆猫的竞争对手，但有时也会与汤姆猫合作追捕老鼠。',

    // Common attributes
    maxHP: 1200,
    attackBoost: 20,
    hpRecovery: 3,
    moveSpeed: 6.5,
    jumpHeight: 1.8,

    // Cat-specific attributes
    clawKnifeCdHit: 2,
    clawKnifeCdUnhit: 4,
    clawKnifeRange: 3.0,

    skills: []
  },
  topsy: {
    id: 'topsy',
    name: '托普斯',
    factionId: 'cat',
    description: '这是托普斯。',

    // Common attributes
    maxHP: 950,
    attackBoost: 18,
    hpRecovery: 4,
    moveSpeed: 8.0,
    jumpHeight: 2.2,

    // Cat-specific attributes
    clawKnifeCdHit: 1,
    clawKnifeCdUnhit: 2.5,
    clawKnifeRange: 2.0,

    skills: []
  },
  jerry: {
    id: 'jerry',
    name: '杰瑞',
    factionId: 'mouse',
    description: '经典角色杰瑞，擅长逃跑和设置陷阱。杰瑞是一只棕色的小老鼠，他机智、灵活，总能从汤姆猫的追击中逃脱。在游戏中，他拥有出色的机动性和陷阱技能。',

    // Common attributes
    maxHP: 600,
    attackBoost: 5,
    hpRecovery: 8,
    moveSpeed: 9.0,
    jumpHeight: 2.5,

    // Mouse-specific attributes
    cheesePushSpeed: 1.5,
    wallCrackDamageBoost: 25,
    skills: [
      {
        id: 'jerry-active',
        name: '鼠标冲刺',
        type: 'ACTIVE',
        description: '快速冲刺一段距离，可以穿过障碍物',
        detailedDescription: '杰瑞快速冲刺指定方向，在冲刺过程中可以穿过障碍物和猫的攻击。冲刺结束后有短暂的无敌时间，但无法立即使用其他技能。此技能是杰瑞最重要的逃生手段。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可被打断',
        cancelableAftercast: '后摇不可取消',
        skillLevels: [
          { level: 1, description: '冲刺3米', damage: '0', cooldown: 10, videoUrl: '/videos/jerry-active-1.mp4' },
          { level: 2, description: '冲刺4米', damage: '0', cooldown: 9, videoUrl: '/videos/jerry-active-2.mp4' },
          { level: 3, description: '冲刺5米', damage: '0', cooldown: 8, videoUrl: '/videos/jerry-active-3.mp4' },
        ]
      },
      {
        id: 'jerry-weapon',
        name: '奶酪陷阱',
        type: 'WEAPON1',
        description: '放置一个奶酪陷阱，猫踩到会被减速',
        detailedDescription: '杰瑞放置一个奶酪形状的陷阱，陷阱在放置后立即激活。猫踩到陷阱会被减速，但陷阱不会消失，可以多次触发。陷阱持续时间20秒，最多可同时存在3个陷阱。',
        canMoveWhileUsing: true,
        canUseInAir: false,
        cancelableSkill: '可被主动技能打断',
        cancelableAftercast: '后摇可取消',
        skillLevels: [
          { level: 1, description: '减速30%，持续2秒', damage: '0', cooldown: 12, videoUrl: '/videos/jerry-weapon-1.mp4' },
          { level: 2, description: '减速40%，持续2.5秒', damage: '0', cooldown: 11, videoUrl: '/videos/jerry-weapon-2.mp4' },
          { level: 3, description: '减速50%，持续3秒', damage: '0', cooldown: 10, videoUrl: '/videos/jerry-weapon-3.mp4' },
        ]
      },
      {
        id: 'jerry-passive',
        name: '鼠的灵活',
        type: 'PASSIVE',
        // No general description for passive skill
        detailedDescription: '被动技能，杰瑞有一定几率自动闪避猫的攻击。闪避成功时，杰瑞会短暂无敌并获得少量速度提升。此技能不需要激活，效果始终生效。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        skillLevels: [
          {
            level: 1,
            description: '10%几率闪避攻击',
            detailedDescription: '被动提供10%几率闪避猫的攻击，闪避成功时获得0.5秒无敌时间和5%移动速度提升，持续1秒。',
            damage: '0',
            cooldown: 0,
            videoUrl: null
          },
          {
            level: 2,
            description: '15%几率闪避攻击',
            detailedDescription: '被动提供15%几率闪避猫的攻击，闪避成功时获得0.7秒无敌时间和7%移动速度提升，持续1.5秒。',
            damage: '0',
            cooldown: 0,
            videoUrl: null
          },
          {
            level: 3,
            description: '20%几率闪避攻击',
            detailedDescription: '被动提供20%几率闪避猫的攻击，闪避成功时获得1秒无敌时间和10%移动速度提升，持续2秒。',
            damage: '0',
            cooldown: 0,
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
    description: '小老鼠是杰瑞的侄子，一只灰色的小老鼠。他年幼但勇敢，经常跟随杰瑞一起冒险。',

    // Common attributes
    maxHP: 500,
    attackBoost: 3,
    hpRecovery: 10,
    moveSpeed: 9.5,
    jumpHeight: 2.8,

    // Mouse-specific attributes
    cheesePushSpeed: 1.8,
    wallCrackDamageBoost: 20,

    skills: []
  },
  nibbles: {
    id: 'nibbles',
    name: '尼宝',
    factionId: 'mouse',
    description: '尼布尔斯是杰瑞的朋友，一只小灰鼠。他性格温和，喜欢吃奶酪，经常和杰瑞一起逃避汤姆猫的追捕。',

    // Common attributes
    maxHP: 550,
    attackBoost: 4,
    hpRecovery: 7,
    moveSpeed: 8.5,
    jumpHeight: 2.3,

    // Mouse-specific attributes
    cheesePushSpeed: 2.0,
    wallCrackDamageBoost: 30,

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
