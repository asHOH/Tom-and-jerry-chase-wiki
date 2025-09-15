// Define types for better type safety
export type FactionId = 'cat' | 'mouse';

export type Faction = {
  id: FactionId;
  name: string;
  description: string;
  detailedDescription?: string;
};

// Positioning tag types separated by faction
export type CatPositioningTagName = '进攻' | '防守' | '追击' | '打架' | '速通' | '翻盘' | '后期';
export type MousePositioningTagName = '奶酪' | '干扰' | '辅助' | '救援' | '破局' | '砸墙' | '后期';

export type CatPositioningTag = {
  tagName: CatPositioningTagName;
  weapon?: 1 | 2;
  isMinor: boolean; // Whether the character only partially exhibits this positioning's characteristics
  description: string; // Brief explanation of why this character has this specific positioning
  additionalDescription: string; // Extended description for detailed view mode
};

export type MousePositioningTag = {
  tagName: MousePositioningTagName;
  weapon?: 1 | 2;
  isMinor: boolean; // Whether the character only partially exhibits this positioning's characteristics
  description: string; // Brief explanation of why this character has this specific positioning
  additionalDescription: string; // Extended description for detailed view mode
};

// Union type for backward compatibility
export type PositioningTagName = CatPositioningTagName | MousePositioningTagName;
export type PositioningTag = CatPositioningTag | MousePositioningTag;

// Skill allocation types
export type SkillAllocation = {
  id: string;
  pattern: string; // Format: "021112200" or "013(0)3301-1"
  weaponType: 'weapon1' | 'weapon2'; // Which weapon this allocation uses
  description: string;
  additionaldescription?: string;
};

// Skill types - both for definitions and final processed skills
export type SkillType = 'active' | 'weapon1' | 'weapon2' | 'passive';
export type CancellableKeyType =
  | '道具键'
  | '道具键*'
  | '跳跃键'
  | '移动键'
  | '药水键'
  | '本技能键'
  | '其他技能键';

export type CancelableSkillType = CancellableKeyType[] | '无前摇' | '不可主动打断';
export type CancelableAftercastType = CancellableKeyType[] | '无后摇' | '不可取消';

export type SkillLevel = {
  level: number;
  description: string;
  detailedDescription?: string;
  cooldown?: number;
};

// Raw skill definition (without ID, for character definitions)
export type SkillDefinition = {
  name: string;
  type: SkillType;
  aliases?: string[]; // Alternative names for search
  description?: string; // Basic description (optional, especially for passive skills)
  detailedDescription?: string; // Detailed description for detailed view
  imageUrl?: string; // Skill icon image URL
  videoUrl?: string; // Skill video URL (external link)

  // Skill usage properties
  canMoveWhileUsing?: boolean; // 移动释放
  canUseInAir?: boolean; // 空中释放
  cancelableSkill?: CancelableSkillType; // 可取消释放
  cancelableAftercast?: CancelableAftercastType; // 可取消后摇
  forecast?: number; // 前摇（秒）
  aftercast?: number; // 后摇（秒）
  canHitInPipe?: boolean; // 可击中管道中的角色
  cooldownTiming?: '前摇前' | '释放时' | '释放后'; // 进入CD时机
  cueRange?: '全图可见' | '本房间可见' | '无音效'; // 技能音效的范围

  skillLevels: SkillLevel[];
};

// Final processed skill (with ID assigned)
export type Skill = Omit<SkillDefinition, 'forecast' | 'aftercast'> & {
  id: string;
  // 处理后的技能可以没有前摇/后摇（未测试），也可以为负值表示未测试
  forecast?: number;
  aftercast?: number;
};

export type KnowledgeCardGroup = {
  cards: string[];
  description?: string;
  contributor?: string;
};

export type KnowledgeCardGroupSet = {
  id: string;
  description: string;
  detailedDescription?: string;
  groups: KnowledgeCardGroup[];
  defaultFolded: boolean;
};

export type SuggestedSpecialSkillItem = {
  name: string;
  description: string;
};

export type CharacterRelationItem = {
  id: string;
  description?: string;
  isMinor: boolean;
};

// Character definition type (without id, for raw definitions)
export type CharacterDefinition = {
  description: string;
  imageUrl?: string; // We'll generate it automatically
  aliases?: string[]; // Alternative names for search

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
  initialItem?: string; // 初始道具

  // Mouse-specific attributes
  cheesePushSpeed?: number; // 推速
  wallCrackDamageBoost?: number; // 墙缝增伤

  // Positioning tags (faction-specific)
  catPositioningTags?: CatPositioningTag[]; // For cat characters
  mousePositioningTags?: MousePositioningTag[]; // For mouse characters

  // Skill allocations
  skillAllocations?: SkillAllocation[];

  skills: SkillDefinition[];

  // Knowledge card suggestions
  knowledgeCardGroups: (KnowledgeCardGroup | KnowledgeCardGroupSet)[];

  // special skill suggestions
  specialSkills?: SuggestedSpecialSkillItem[];

  // character restraint information
  counters?: CharacterRelationItem[];
  countersKnowledgeCards?: CharacterRelationItem[];
  countersSpecialSkills?: CharacterRelationItem[];

  counteredBy?: CharacterRelationItem[];
  counteredByKnowledgeCards?: CharacterRelationItem[];
  counteredBySpecialSkills?: CharacterRelationItem[];

  collaborators?: CharacterRelationItem[];
};

export type CharacterRelation = {
  counters: CharacterRelationItem[];
  countersKnowledgeCards: CharacterRelationItem[];
  countersSpecialSkills: CharacterRelationItem[];

  counteredBy: CharacterRelationItem[];
  counteredByKnowledgeCards: CharacterRelationItem[];
  counteredBySpecialSkills: CharacterRelationItem[];

  collaborators: CharacterRelationItem[];
};

export type PartialCharacterDefinition = { hidden: true } & Partial<CharacterDefinition>;

// Final processed character (with ID and processed skills)
export type Character = CharacterDefinition & {
  id: string; // Chinese name (e.g., '汤姆')
  factionId?: FactionId; // Optional in base definition, will be assigned in bulk
  skills: Skill[]; // Processed skills with IDs
};

// Card-related types
export type CardRank = 'C' | 'B' | 'A' | 'S';

export type CardLevel = {
  level: number;
  description: string;
  detailedDescription?: string;
};

export type Card = {
  id: string; // Chinese name without rank prefix (e.g., '乘胜追击')
  factionId?: FactionId; // Optional in base definition, will be assigned in bulk
  rank: CardRank;
  cost: number;
  description: string;
  detailedDescription?: string;
  imageUrl?: string; // We'll generate it automatically
  levels: CardLevel[];
};

export type SpecialSkillDefinition = {
  cooldown: number;
  aliases?: string[]; // Alternative names for search
  description?: string; // Basic description (optional, especially for passive skills)
  detailedDescription?: string;
  adviceDescription?: string;
};

export type SpecialSkill = SpecialSkillDefinition & {
  name: string;
  factionId: FactionId;
  imageUrl: string;
};

export type Itemtypelist = '投掷类' | '手持类' | '物件类' | '食物类' | '流程类' | '其它'; //list of items' types
export type Itemsourcelist = '常规道具' | '地图道具'; //list of items' source

export type ItemDefinition = {
  itemtype: Itemtypelist; //type of items
  itemsource: Itemsourcelist; //source of items
  damage?: number;
  walldamage?: number; //damage to wall joint
  factionId?: FactionId;
  aliases?: string[]; // Alternative names for search
  description?: string; // Basic description (optional, especially for passive skills)
  detailedDescription?: string;
  create?: string; //the way of items create
  detailedCreate?: string;
  store?: boolean; //if item can buy on store
  price?: number; //item's price
  unlocktime?: string; //when item unlock in store
  storeCD?: number; //item's CD in store
  teamCD?: boolean; //if item's CD in store is team shared
  exp?: number; //(cat) get exp when item hit mouse
};

export type Item = ItemDefinition & { name: string; imageUrl: string };

export type Entitytypelist = '道具类' | '投射物类' | '召唤物类' | '平台类' | 'NPC类' | '其它';

export type EntityDefinition = {
  entitytype: Entitytypelist; //type of entity
  characterName: string; //which character does this entity belong to
  skillname?: string; //which skill does this entity belong to
  aliases?: string[]; // (entities') Alternative names for search
  move?: boolean; //if entity can move (by itself)
  gravity?: boolean; //if entity can be influenced by gravity
  collsion?: boolean; //if entity have collsion box
  ignore?: string[]; //(if 'collsion: true')which object does this entity ignore collsion
  description?: string;
  detailedDescription?: string;
  create?: string; //the way of items create
  detailedCreate?: string;

  specialImageUrl?: string; //(interim) use other image instead of entity's missing image
};

export type Entity = EntityDefinition & { name: string; factionId?: FactionId; imageUrl: string };

export type Bufftypelist = '正面效果' | '负面效果';
//Todo: add Buffclass
{
  /*export type Buffclass = '全局效果' | '常规效果' | '特殊技能效果';*/
}

export type BuffDefinition = {
  bufftype: Bufftypelist;
  //buffclass: Buffclass;
  aliases?: string[];
  correlations?: string[];
  source?: string[]; //all sources of buff
  duration?: number | 'infinite'; // duration of buff.If buff has more than two different durations,don't fill in this attribute.
  failure?: string; //failure conditions of buff
  description?: string;
  detailedDescription?: string;
  stack?: string; // the stacking way in more than two same buffs
  detailedStack?: string;

  unuseImage?: boolean; //show its image in grid.Default:false
  specialImageUrl?: string; //use other image instead of buff's image
};

export type Buff = BuffDefinition & { name: string; imageUrl: string };
