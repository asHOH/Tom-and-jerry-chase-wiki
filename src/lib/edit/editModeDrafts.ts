import type { Action, ActionHistoryEntry } from './diffUtils';

export type DraftEntityType =
  | 'characters'
  | 'factions'
  | 'cards'
  | 'entities'
  | 'buffs'
  | 'items'
  | 'fixtures'
  | 'maps'
  | 'modes'
  | 'specialSkills'
  | 'achievements';

export type DraftSummaryItem = {
  entityType: DraftEntityType;
  entityLabel: string;
  entityId: string;
  itemLabel: string;
  count: number;
  factionId?: 'cat' | 'mouse';
};

export type DraftItemLabelResolver = (draftPathParts: {
  entityType: DraftEntityType;
  entityId: string;
  factionId?: 'cat' | 'mouse';
}) => string | undefined;

const ENTITY_LABELS: Record<DraftEntityType, string> = {
  characters: '角色',
  factions: '阵营',
  cards: '知识卡',
  entities: '衍生物',
  buffs: '状态',
  items: '道具',
  fixtures: '地图组件',
  maps: '地图',
  modes: '模式',
  specialSkills: '特技',
  achievements: '成就',
};

function formatEntityLabel(entityType: DraftEntityType): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function normalizeActionEntry(actions: Action[]): ActionHistoryEntry {
  return actions.length === 1 ? actions[0]! : actions;
}

function matchesEntityAction(action: Action, entityId: string): boolean {
  if (!entityId) return true;
  return action.path === entityId || action.path.startsWith(`${entityId}.`);
}

function splitActionEntryByEntity(
  entry: ActionHistoryEntry,
  entityId: string
): { matching: ActionHistoryEntry | null; remaining: ActionHistoryEntry | null } {
  if (Array.isArray(entry)) {
    const matching: Action[] = [];
    const remaining: Action[] = [];

    entry.forEach((action) => {
      if (matchesEntityAction(action, entityId)) {
        matching.push(action);
      } else {
        remaining.push(action);
      }
    });

    return {
      matching: matching.length > 0 ? normalizeActionEntry(matching) : null,
      remaining: remaining.length > 0 ? normalizeActionEntry(remaining) : null,
    };
  }

  if (matchesEntityAction(entry, entityId)) {
    return { matching: entry, remaining: null };
  }

  return { matching: null, remaining: entry };
}

export function splitActionHistoryByEntity(
  history: ActionHistoryEntry[],
  entityId: string
): {
  matching: ActionHistoryEntry[];
  remaining: ActionHistoryEntry[];
} {
  const matching: ActionHistoryEntry[] = [];
  const remaining: ActionHistoryEntry[] = [];

  history.forEach((entry) => {
    const { matching: matchingEntry, remaining: remainingEntry } = splitActionEntryByEntity(
      entry,
      entityId
    );

    if (matchingEntry) matching.push(matchingEntry);
    if (remainingEntry) remaining.push(remainingEntry);
  });

  return { matching, remaining };
}

type DraftPathParts = {
  entityId: string;
  factionId?: 'cat' | 'mouse';
};

function normalizeActionEntryToList(entry: ActionHistoryEntry): Action[] {
  return Array.isArray(entry) ? entry : [entry];
}

function parseDraftPath(entityType: DraftEntityType, path: string): DraftPathParts | null {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return null;

  if (entityType === 'specialSkills') {
    const factionPart = parts[0];
    const skillId = parts[1];
    if (!skillId) return null;

    if (factionPart === 'cat' || factionPart === 'mouse') {
      return { entityId: skillId, factionId: factionPart };
    }

    return { entityId: skillId };
  }

  return { entityId: parts[0]! };
}

export function buildDraftSummaryItemsForType(
  entityType: DraftEntityType,
  history: ActionHistoryEntry[],
  resolveItemLabel: DraftItemLabelResolver
): DraftSummaryItem[] {
  const counters = new Map<
    string,
    {
      entityId: string;
      count: number;
      factionId?: 'cat' | 'mouse';
    }
  >();

  history.forEach((entry) => {
    normalizeActionEntryToList(entry).forEach((action) => {
      const pathParts = parseDraftPath(entityType, action.path);
      if (!pathParts) return;

      const itemKey = `${pathParts.factionId ?? ''}:${pathParts.entityId}`;
      const current = counters.get(itemKey);
      if (current) {
        current.count += 1;
        return;
      }

      const nextCounter: {
        entityId: string;
        count: number;
        factionId?: 'cat' | 'mouse';
      } = {
        entityId: pathParts.entityId,
        count: 1,
      };

      if (pathParts.factionId) {
        nextCounter.factionId = pathParts.factionId;
      }

      counters.set(itemKey, nextCounter);
    });
  });

  return Array.from(counters.values()).map((counter) => {
    const resolverInput: Parameters<DraftItemLabelResolver>[0] = {
      entityType,
      entityId: counter.entityId,
    };

    if (counter.factionId) {
      resolverInput.factionId = counter.factionId;
    }

    const itemLabel = resolveItemLabel(resolverInput) ?? counter.entityId;
    const summary: DraftSummaryItem = {
      entityType,
      entityLabel: formatEntityLabel(entityType),
      entityId: counter.entityId,
      itemLabel,
      count: counter.count,
    };

    if (counter.factionId) {
      summary.factionId = counter.factionId;
    }

    return summary;
  });
}

export function sortDraftSummaryItems(items: DraftSummaryItem[]): DraftSummaryItem[] {
  return items.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    const typeCompare = a.entityLabel.localeCompare(b.entityLabel, 'zh-CN');
    if (typeCompare !== 0) {
      return typeCompare;
    }

    return a.itemLabel.localeCompare(b.itemLabel, 'zh-CN');
  });
}
