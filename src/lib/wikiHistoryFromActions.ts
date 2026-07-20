import type { Action } from '@/lib/edit/diffUtils';
import { SingleItem, SingleItemTypeName, WikiChangeType, WikiYearData } from '@/data/types';

import { flattenActionEntries, normalizePublicActionEntries } from './gameData/actionEntries';
import type { PublicActionRow } from './gameData/publicActionsTypes';
import { getGameDataActionTarget } from './gameData/scopedEntityPaths';

/**
 * Maps entity_type (used in game_data_actions) to SingleItemTypeName (used in wiki history)
 */
const ENTITY_TYPE_TO_SINGLE_ITEM_TYPE: Record<string, SingleItemTypeName> = {
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
};

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

/**
 * Converts a single action to wiki history info
 */
function actionToWikiHistoryInfo(
  action: Action,
  entityType: string,
  createdAt: Date
): WikiHistoryFromAction | null {
  const singleItemType = ENTITY_TYPE_TO_SINGLE_ITEM_TYPE[entityType];
  if (!singleItemType) return null;

  const target = getGameDataActionTarget(entityType, action.path);
  if (!target) return null;

  const itemPathDepth = target.factionId ? 2 : 1;

  const year = createdAt.getFullYear();
  const month = createdAt.getMonth() + 1;
  const day = createdAt.getDate();
  const date = `${month}.${day}` as `${number}.${number}`;

  const changeType = opToChangeType(action.op, action.path, itemPathDepth);

  // Generate a description based on the change
  let description = '';
  const pathParts = action.path.split('.').filter(Boolean);

  if (pathParts.length === itemPathDepth) {
    // Top-level change (create/delete entire item)
    if (action.op === 'add') {
      description = '创建该条目';
    } else if (action.op === 'delete') {
      description = '移除该条目';
    }
  } else {
    // Nested change
    const fieldPath = pathParts.slice(itemPathDepth).join('.');
    description = `更新 ${fieldPath}`;
  }

  return {
    year,
    date,
    item: {
      name: target.entityId,
      type: singleItemType,
      ...(target.factionId && { factionId: target.factionId }),
    },
    changeType,
    description,
  };
}

/**
 * Converts public action rows to wiki history entries grouped by year
 */
export function publicActionsToWikiHistory(actions: PublicActionRow[]): WikiYearData[] {
  const yearMap = new Map<number, Map<string, WikiHistoryFromAction[]>>();

  for (const row of actions) {
    const entries = normalizePublicActionEntries(row.entry);
    const actionsArray = flattenActionEntries(entries);
    if (actionsArray.length === 0) continue;

    const createdAt = new Date(row.created_at);
    const year = createdAt.getFullYear();

    // Group by date within year
    const month = createdAt.getMonth() + 1;
    const day = createdAt.getDate();
    const dateKey = `${month}.${day}`;

    for (const action of actionsArray) {
      const info = actionToWikiHistoryInfo(action, row.entity_type, createdAt);
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
      // Group changes by item to create batch changes
      const itemChanges = new Map<string, WikiHistoryFromAction[]>();
      for (const change of changes) {
        const key = `${change.item.type}:${change.item.factionId ?? ''}:${change.item.name}`;
        if (!itemChanges.has(key)) {
          itemChanges.set(key, []);
        }
        itemChanges.get(key)!.push(change);
      }

      // Create event with batch changes
      events.push({
        date: date as `${number}.${number}`,
        description: '自动同步的用户改动',
        details: {
          data: {
            batchChanges: [
              {
                changes: changes.map((c: WikiHistoryFromAction) => ({
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
