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
  actions: readonly Readonly<Action>[];
};

/**
 * Converts a single action to wiki history info
 */
function actionToWikiHistoryInfo(
  action: Action,
  entityType: string,
  createdAt: Date
): WikiHistoryFromAction | null {
  if (!isPublishableEntityType(entityType)) return null;
  if (!hasWikiHistoryMapping(entityType)) return null;

  const singleItemType = ENTITY_TYPE_TO_SINGLE_ITEM_TYPE[entityType];

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
export function normalizedActionsToWikiHistory(
  rows: readonly NormalizedWikiHistoryActionRow[]
): WikiYearData[] {
  const yearMap = new Map<number, Map<string, WikiHistoryFromAction[]>>();

  for (const row of rows) {
    if (row.actions.length === 0) continue;

    const createdAt = new Date(row.createdAt);
    const year = createdAt.getFullYear();

    // Group by date within year
    const month = createdAt.getMonth() + 1;
    const day = createdAt.getDate();
    const dateKey = `${month}.${day}`;

    for (const action of row.actions) {
      const info = actionToWikiHistoryInfo(action as Action, row.entityType, createdAt);
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
 * Legacy adapter for the root action payload. Published selectors call the
 * normalized entry point with the immutable decoded snapshot instead.
 */
export function publicActionsToWikiHistory(actions: PublicActionRow[]): WikiYearData[] {
  return normalizedActionsToWikiHistory(
    actions.map((row) => {
      const entries = normalizePublicActionEntries(row.entry);
      return {
        entityType: row.entity_type,
        createdAt: row.created_at,
        actions: flattenActionEntries(entries),
      };
    })
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
