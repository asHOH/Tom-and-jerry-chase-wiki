import type { Action } from '@/lib/edit/diffUtils';
import {
  isPublishableEntityType,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { SingleItem, SingleItemTypeName, WikiChangeType, WikiYearData } from '@/data/types';

import { flattenActionEntries, normalizePublicActionEntries } from './gameData/actionEntries';
import type { PublicActionRow } from './gameData/publicActionsTypes';
import { getGameDataActionTarget } from './gameData/scopedEntityPaths';

/**
 * Maps entity_type (used in game_data_actions) to SingleItemTypeName (used in wiki history)
 */
const ENTITY_TYPE_TO_SINGLE_ITEM_TYPE = {
  characters: 'character',
  cards: 'knowledgeCard',
  specialSkills: 'specialSkill',
  items: 'item',
  entities: 'entity',
  buffs: 'buff',
  maps: 'map',
  fixtures: 'fixture',
  modes: 'mode',
  achievements: 'achievement',
} satisfies Partial<Record<PublishableEntityType, SingleItemTypeName>>;

type WikiHistoryEntityType = keyof typeof ENTITY_TYPE_TO_SINGLE_ITEM_TYPE;

const WIKI_HISTORY_FIELD_LABELS: Readonly<Record<string, string>> = {
  id: '名称',
  name: '名称',
  EnglishName: '英文名',
  aliases: '别名',
  type: '类型',
  factionId: '阵营',
  description: '描述',
  detailedDescription: '详细描述',
  additionalDescription: '补充描述',
  additionaldescription: '补充描述',
  imageUrl: '图片',
  specialImageUrl: '特殊图片',
  videoUrl: '视频',
  unuseImage: '不使用图片',
  level: '等级',
  skills: '技能',
  skillLevels: '技能等级',
  cooldown: '冷却时间',
  charges: '储存次数',
  parts: '分段',
  canMoveWhileUsing: '移动释放',
  canUseInAir: '空中释放',
  cancelableSkill: '可取消释放',
  cancelableAftercast: '可取消后摇',
  causesWoundedState: '造成受伤状态',
  forecast: '前摇',
  aftercast: '后摇',
  canHitInPipe: '管道攻击',
  cooldownTiming: 'CD时机',
  cueRange: '技能音效范围',
  specialClawKnifeCdHit: '特殊爪刀命中CD',
  specialClawKnifeCdUnhit: '特殊爪刀未命中CD',
  catPositioningTags: '猫方定位',
  mousePositioningTags: '鼠方定位',
  tagName: '定位',
  weapon: '武器',
  counterTags: '克制标签',
  counters: '克制关系',
  counteredBy: '被克制关系',
  counterEachOther: '互克关系',
  collaborators: '协作关系',
  countersKnowledgeCards: '克制的知识卡',
  counteredByKnowledgeCards: '被克制的知识卡',
  countersSpecialSkills: '克制的特技',
  counteredBySpecialSkills: '被克制的特技',
  advantageMaps: '优势地图',
  advantageModes: '优势模式',
  disadvantageMaps: '劣势地图',
  disadvantageModes: '劣势模式',
  isMinor: '次要关系',
  tags: '关系标签',
  group: '关系组',
  relation: '关系',
  kind: '关系类型',
  subject: '关系主体',
  target: '关系对象',
  spacialCase: '特殊情况',
  excludeFactionId: '排除阵营',
  skillAllocations: '技能加点方案',
  pattern: '加点顺序',
  weaponType: '武器类型',
  knowledgeCardGroups: '知识卡组',
  cards: '知识卡',
  groups: '卡组',
  contributor: '贡献者',
  defaultFolded: '默认折叠',
  specialSkills: '特技推荐',
  recommendedStorePlans: '商店购买方案',
  items: '道具',
  rank: '品级',
  cost: '知识量',
  levels: '等级效果',
  priority: '升级优先级',
  adviceDescription: '使用建议',
  move: '移动',
  gravity: '重力',
  collision: '碰撞',
  itemtype: '道具类型',
  itemsource: '道具来源',
  damage: '伤害',
  walldamage: '破墙伤害',
  create: '生成方式',
  detailedCreate: '详细生成方式',
  store: '商店可购买',
  price: '价格',
  unlocktime: '解锁时间',
  storeCD: '商店CD',
  teamCD: '全队共享CD',
  exp: '经验',
  actorProfileName: '角色档案',
  itemAttributesAsCharacter: '特殊角色属性',
  entityAttributesAsCharacter: '特殊角色属性',
  fixtureAttributesAsCharacter: '特殊角色属性',
  actorType: '角色类型',
  physicsType: '物理特质',
  physicsBodyName: '体型',
  sex: '性别',
  width: '宽度',
  height: '高度',
  runSpeed: '移速',
  jumpSpeed: '跳跃速度',
  climbSpeed: '攀爬速度',
  visionScale: '视野缩放',
  baseHp: '基础Hp',
  maxHp: 'Hp上限',
  attack: '攻击力',
  wallDamage: '破坏力',
  attackRange: '爪刀范围',
  attackCooldown: '爪刀CD',
  hit: '命中',
  miss: '未命中',
  pushCheeseSpeed: '推速',
  initialItem: '初始道具',
  deformCooldown: '变形彩蛋CD',
  shoppingCooldown: '购物CD',
  shoppingDelay: '购物到货时间',
  attackBoost: '攻击增伤',
  hpRecovery: 'Hp恢复',
  moveSpeed: '移速',
  jumpHeight: '跳跃',
  clawKnifeCdHit: '命中攻击CD',
  clawKnifeCdUnhit: '未命中攻击CD',
  clawKnifeRange: '攻击范围',
  factionBelong: '所属阵营',
  entitytag: '衍生物标签',
  entitytype: '衍生物类型',
  owner: '归属者',
  class: '同类名称',
  range: '取值范围',
  stack: '叠加方式',
  detailedStack: '详细叠加方式',
  source: '来源',
  sourceDescription: '来源说明',
  score: '成就分数',
  mapSkin: '地图皮肤',
  size: '大小',
  studyLevelUnlock: '解锁学业等级',
  changeWithStudyLevel: '随学业等级变化',
  roomCount: '房间数',
  pipeCount: '管道数',
  doorCount: '木门数',
  hiddenRoomCount: '彩蛋房数',
  randomizedRoom: '随机房间',
  supportedModes: '支持模式',
  changeWithMode: '随模式变化',
  mapImageUrl: '地图图片',
  interactiveMap: '互动地图',
  tileSize: '图块大小',
  minZoom: '最小缩放级别',
  maxZoom: '最大缩放级别',
  tileUrl: '图块地址',
  previewUrl: '预览图',
  rooms: '房间',
  points: '标记点',
  showLabel: '显示名称',
  polygons: '区域轮廓',
  category: '分类',
  subtype: '子类型',
  position: '位置',
  minimapPaths: '小地图路径',
  targetWallCrackPointId: '目标墙缝点',
  geometryBarrelRoute: '火药桶路线',
  firecrackerPosition: '小鞭炮位置',
  targetRocketPointId: '目标火箭点',
  barrelCountdownDisplayAtFirecrackerExplosion: '小鞭炮爆炸时的火药桶倒计时',
  connection: '连接',
  targetPointId: '目标点',
  direction: '方向',
  label: '标签',
  isInvisible: '隐藏',
  isRandomCandidate: '随机候选',
  relatedEntries: '相关词条',
  supportedMaps: '支持地图',
  openingTime: '开放时间',
  format: '模式规格',
  rules: '规则',
  detailedRules: '详细规则',
  length: '数量',
};

const WIKI_HISTORY_INDEXED_FIELD_LABELS: Readonly<Record<string, (position: number) => string>> = {
  aliases: (position) => `第${position}个别名`,
  skills: (position) => `第${position}个技能`,
  skillLevels: (position) => `第${position}级`,
  parts: (position) => `第${position}段`,
  catPositioningTags: (position) => `第${position}个猫方定位`,
  mousePositioningTags: (position) => `第${position}个鼠方定位`,
  skillAllocations: (position) => `第${position}个技能加点方案`,
  knowledgeCardGroups: (position) => `第${position}个知识卡组`,
  cards: (position) => `第${position}张知识卡`,
  groups: (position) => `第${position}个卡组`,
  specialSkills: (position) => `第${position}个特技推荐`,
  recommendedStorePlans: (position) => `第${position}个商店购买方案`,
  items: (position) => `第${position}个道具`,
  levels: (position) => `第${position}级`,
  collision: (position) => `第${position}个碰撞对象`,
  owner: (position) => `第${position}个归属者`,
  source: (position) => `第${position}个来源`,
  range: (position) =>
    position === 1 ? '取值下限' : position === 2 ? '取值上限' : `取值范围第${position}项`,
  mapSkin: (position) => `第${position}个地图皮肤`,
  supportedModes: (position) => `支持的第${position}个模式`,
  supportedMaps: (position) => `支持的第${position}张地图`,
  counters: (position) => `第${position}个克制对象`,
  counteredBy: (position) => `第${position}个被克制对象`,
  counterEachOther: (position) => `第${position}个互克对象`,
  collaborators: (position) => `第${position}个协作对象`,
  countersKnowledgeCards: (position) => `第${position}张克制的知识卡`,
  counteredByKnowledgeCards: (position) => `第${position}张被克制的知识卡`,
  countersSpecialSkills: (position) => `第${position}个克制的特技`,
  counteredBySpecialSkills: (position) => `第${position}个被克制的特技`,
  advantageMaps: (position) => `第${position}张优势地图`,
  advantageModes: (position) => `第${position}个优势模式`,
  disadvantageMaps: (position) => `第${position}张劣势地图`,
  disadvantageModes: (position) => `第${position}个劣势模式`,
  tags: (position) => `第${position}个关系标签`,
  spacialCase: (position) => `第${position}个特殊情况`,
  rooms: (position) => `第${position}个房间`,
  points: (position) => `第${position}个标记点`,
  polygons: (position) => `第${position}个区域轮廓`,
  minimapPaths: (position) => `第${position}条小地图路径`,
  relatedEntries: (position) => `第${position}个相关词条`,
};

const RELATION_FIELD_NAMES = new Set([
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
]);

function getParentFieldName(pathParts: readonly string[], index: number): string | undefined {
  const previousPart = pathParts[index - 1];
  return previousPart && /^\d+$/.test(previousPart) ? pathParts[index - 2] : previousPart;
}

function translateWikiHistoryFieldName(
  pathParts: readonly string[],
  index: number,
  part: string
): string {
  const parentFieldName = getParentFieldName(pathParts, index);

  if (parentFieldName === 'tags') {
    if (part === 'counters') return '克制方标签';
    if (part === 'counteredBy') return '被克制方标签';
  }
  if (part === 'id' && parentFieldName && RELATION_FIELD_NAMES.has(parentFieldName)) {
    return '关系对象';
  }

  return WIKI_HISTORY_FIELD_LABELS[part] ?? part;
}

function translateWikiHistoryFieldPath(pathParts: readonly string[]): string {
  const translatedParts: string[] = [];

  for (const [index, part] of pathParts.entries()) {
    if (/^\d+$/.test(part)) {
      const position = Number(part) + 1;
      const indexedLabel = WIKI_HISTORY_INDEXED_FIELD_LABELS[pathParts[index - 1] ?? ''];

      if (indexedLabel && translatedParts.length > 0) {
        translatedParts[translatedParts.length - 1] = indexedLabel(position);
      } else {
        translatedParts.push(`第${position}项`);
      }
      continue;
    }

    translatedParts.push(translateWikiHistoryFieldName(pathParts, index, part));
  }

  return translatedParts.join('的');
}

function hasWikiHistoryMapping(
  entityType: PublishableEntityType
): entityType is WikiHistoryEntityType {
  return entityType in ENTITY_TYPE_TO_SINGLE_ITEM_TYPE;
}

/**
 * Maps action operation to WikiChangeType
 */
function opToChangeType(op: string, path: string, itemPathDepth = 1): WikiChangeType {
  // If path ends at the item record (e.g., "汤姆" or "cat.翻盘"), it's a top-level item.
  const pathParts = path.split('.').filter(Boolean);

  if (op === 'add') {
    // If adding at root level, it's CREATE; otherwise it's ADD
    return pathParts.length === itemPathDepth ? WikiChangeType.CREATE : WikiChangeType.ADD;
  }
  if (op === 'delete') {
    return WikiChangeType.REMOVE;
  }
  // 'set' operation is UPDATE
  return WikiChangeType.UPDATE;
}

interface WikiHistoryFromAction {
  year: number;
  date: string;
  item: SingleItem;
  changeType: WikiChangeType;
  description: string;
}

export type NormalizedWikiHistoryActionRow = {
  entityType: string;
  createdAt: string;
  message?: string | null;
  actions: readonly Readonly<Action>[];
};

export type WikiHistoryConversionOptions = {
  resolveCharacterSkillName?: (characterId: string, skillIndex: number) => string | undefined;
};

function getActionSkillName(action: Action): string | undefined {
  const candidate = action.op === 'delete' ? action.oldValue : action.newValue;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return undefined;

  const name = (candidate as { name?: unknown }).name;
  return typeof name === 'string' && name.trim() ? name : undefined;
}

/**
 * Converts a single action to wiki history info
 */
function actionToWikiHistoryInfo(
  action: Action,
  entityType: string,
  createdAt: Date,
  actionDescription: string | undefined,
  options: WikiHistoryConversionOptions
): WikiHistoryFromAction | null {
  if (!isPublishableEntityType(entityType)) return null;
  if (!hasWikiHistoryMapping(entityType)) return null;

  const target = getGameDataActionTarget(entityType, action.path);
  if (!target) return null;

  let singleItem: SingleItem = {
    name: target.entityId,
    type: ENTITY_TYPE_TO_SINGLE_ITEM_TYPE[entityType],
    ...(target.factionId && { factionId: target.factionId }),
  };
  let itemPathDepth = target.factionId ? 2 : 1;

  if (entityType === 'characters' && target.pathParts[itemPathDepth] === 'skills') {
    const skillIndexPart = target.pathParts[itemPathDepth + 1];
    const skillIndex = skillIndexPart === undefined ? NaN : Number(skillIndexPart);

    if (Number.isInteger(skillIndex) && skillIndex >= 0) {
      const skillName =
        options.resolveCharacterSkillName?.(target.entityId, skillIndex) ??
        getActionSkillName(action);

      if (skillName) {
        singleItem = { name: skillName, type: 'skill' };
        itemPathDepth += 2;
      }
    }
  }

  const year = createdAt.getFullYear();
  const month = createdAt.getMonth() + 1;
  const day = createdAt.getDate();
  const date = `${month}.${day}` as `${number}.${number}`;

  const changeType = opToChangeType(action.op, action.path, itemPathDepth);

  // Prefer the contributor's description, then fall back to the affected field.
  let description = actionDescription ?? '';
  const pathParts = action.path.split('.').filter(Boolean);

  if (!description && pathParts.length === itemPathDepth) {
    // Top-level change (create/delete entire item)
    if (action.op === 'add') {
      description = '创建该条目';
    } else if (action.op === 'delete') {
      description = '移除该条目';
    }
  } else if (!description) {
    // Nested change
    const fieldPath = translateWikiHistoryFieldPath(pathParts.slice(itemPathDepth));
    description = `更新 ${fieldPath}`;
  }

  return {
    year,
    date,
    item: singleItem,
    changeType,
    description,
  };
}

/**
 * Converts public action rows to wiki history entries grouped by year
 */
export function normalizedActionsToWikiHistory(
  rows: readonly NormalizedWikiHistoryActionRow[],
  options: WikiHistoryConversionOptions = {}
): WikiYearData[] {
  const yearMap = new Map<number, Map<string, WikiHistoryFromAction[]>>();

  for (const row of rows) {
    if (row.actions.length === 0) continue;

    const createdAt = new Date(row.createdAt);
    const actionDescription = row.message?.trim() || undefined;
    const year = createdAt.getFullYear();

    // Group by date within year
    const month = createdAt.getMonth() + 1;
    const day = createdAt.getDate();
    const dateKey = `${month}.${day}`;

    for (const action of row.actions) {
      const info = actionToWikiHistoryInfo(
        action as Action,
        row.entityType,
        createdAt,
        actionDescription,
        options
      );
      if (!info) continue;

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      const dateMap = yearMap.get(year)!;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(info);
    }
  }

  // Convert to WikiYearData format
  const result: WikiYearData[] = [];

  for (const [year, dateMap] of Array.from(yearMap)) {
    const events: WikiYearData['events'] = [];

    for (const [date, changes] of Array.from(dateMap)) {
      const uniqueChanges: WikiHistoryFromAction[] = [];
      const seenChanges = new Set<string>();
      for (const change of changes) {
        const key = JSON.stringify([
          change.item.type,
          change.item.factionId ?? '',
          change.item.name,
          change.changeType,
          change.description,
        ]);
        if (seenChanges.has(key)) continue;
        seenChanges.add(key);
        uniqueChanges.push(change);
      }

      // Create event with batch changes
      events.push({
        date: date as `${number}.${number}`,
        description: '自动同步的用户改动',
        details: {
          data: {
            batchChanges: [
              {
                changes: uniqueChanges.map((c: WikiHistoryFromAction) => ({
                  item: c.item,
                  changeType: c.changeType,
                  description: c.description,
                })),
                description: '用户提交的改动',
              },
            ],
          },
        },
      });
    }

    result.push({ year, events });
  }

  // Sort by year descending
  result.sort((a, b) => b.year - a.year);

  return result;
}

/**
 * Legacy adapter for the root action payload. Published selectors call the
 * normalized entry point with the immutable decoded snapshot instead.
 */
export function publicActionsToWikiHistory(
  actions: PublicActionRow[],
  options: WikiHistoryConversionOptions = {}
): WikiYearData[] {
  return normalizedActionsToWikiHistory(
    actions.map((row) => {
      const entries = normalizePublicActionEntries(row.entry);
      return {
        entityType: row.entity_type,
        createdAt: row.created_at,
        message: row.message,
        actions: flattenActionEntries(entries),
      };
    }),
    options
  );
}

/**
 * Merges wiki history from static data and public actions
 */
export function mergeWikiHistoryData(
  staticData: WikiYearData[],
  actionsData: WikiYearData[]
): WikiYearData[] {
  const yearMap = new Map<number, WikiYearData>();

  // Add static data first
  for (const yearData of staticData) {
    yearMap.set(yearData.year, { ...yearData, events: [...yearData.events] });
  }

  // Merge actions data
  for (const yearData of actionsData) {
    if (yearMap.has(yearData.year)) {
      const existing = yearMap.get(yearData.year)!;
      existing.events.push(...yearData.events);
    } else {
      yearMap.set(yearData.year, { ...yearData, events: [...yearData.events] });
    }
  }

  // Convert to array and sort by year descending
  return Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
}
