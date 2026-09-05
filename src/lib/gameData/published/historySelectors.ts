import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import {
  mergeWikiHistoryData,
  publicActionsToWikiHistory,
  type WikiHistoryConversionOptions,
} from '@/lib/wikiHistoryFromActions';
import type {
  FactionId,
  SingleItem,
  SingleItemTypeName,
  WikiChangeType,
  WikiYearData,
} from '@/data/types';
import { wikiHistoryData } from '@/data/wikiHistory';

import { fetchPublicGameDataActionHistory } from '../publicActions';
import type { PublicActionRow } from '../publicActionsTypes';
import type { ApprovedActionSnapshot } from './approvedActionSnapshot';
import { PRODUCTION_BUILD_IDENTITY } from './buildIdentity';
import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';
import { createPublishedRevision, type PublishedRevision } from './revision';

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

export type PublishedEntityHistoryEntityType = keyof typeof ENTITY_TYPE_TO_SINGLE_ITEM_TYPE;

export function hasPublishedEntityHistory(
  entityType: PublishableEntityType
): entityType is PublishedEntityHistoryEntityType {
  return entityType in ENTITY_TYPE_TO_SINGLE_ITEM_TYPE;
}

export type PublishedEntityHistoryScope = {
  entityType: PublishedEntityHistoryEntityType;
  entityId: string;
  factionId?: FactionId;
};

export type PublishedEntityHistoryEntry = {
  year: number;
  date: string;
  type: WikiChangeType;
  description: string;
};

export type PublishedEntityHistoryReadModel = {
  revision: PublishedRevision;
  history: PublishedEntityHistoryEntry[];
  relatedHistory: PublishedRelatedEntityHistory[];
};

export type PublishedRelatedEntityHistory = {
  item: SingleItem;
  history: PublishedEntityHistoryEntry[];
};

type PublishedEntityHistoryOptions = WikiHistoryConversionOptions & {
  relatedItems?: readonly SingleItem[];
};

function snapshotToPublicActionRows(snapshot: ApprovedActionSnapshot): PublicActionRow[] {
  return snapshot.rows.map((row) => ({
    id: row.rowId,
    entity_type: row.entityType,
    entry: row.rawEntry,
    created_at: row.createdAt,
    status: row.status,
    message: row.message,
    reviewed_at: row.reviewedAt,
    created_by: row.createdBy,
  }));
}

function mergeActionHistoryRows(
  snapshot: ApprovedActionSnapshot,
  historyRows: readonly PublicActionRow[]
): PublicActionRow[] {
  const rowsById = new Map<string, PublicActionRow>();

  for (const row of snapshotToPublicActionRows(snapshot)) rowsById.set(row.id, row);
  for (const row of historyRows) rowsById.set(row.id, row);

  return [...rowsById.values()].sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
}

function snapshotToWikiHistory(
  snapshot: ApprovedActionSnapshot,
  historyRows: readonly PublicActionRow[],
  options: WikiHistoryConversionOptions
): WikiYearData[] {
  return publicActionsToWikiHistory(mergeActionHistoryRows(snapshot, historyRows), options);
}

function matchesScope(item: SingleItem, scope: PublishedEntityHistoryScope): boolean {
  return (
    item.type === ENTITY_TYPE_TO_SINGLE_ITEM_TYPE[scope.entityType] &&
    item.name === scope.entityId &&
    (item.factionId === undefined ||
      scope.factionId === undefined ||
      item.factionId === scope.factionId)
  );
}

function matchesItem(left: SingleItem, right: SingleItem): boolean {
  return (
    left.type === right.type &&
    left.name === right.name &&
    (left.factionId === undefined ||
      right.factionId === undefined ||
      left.factionId === right.factionId)
  );
}

function selectHistoryEntries(
  wikiHistory: readonly WikiYearData[],
  matches: (item: SingleItem) => boolean
): PublishedEntityHistoryEntry[] {
  const result: PublishedEntityHistoryEntry[] = [];

  for (const yearData of wikiHistory) {
    for (const event of yearData.events) {
      for (const change of event.details.data?.changes ?? []) {
        if (!matches(change.item)) continue;
        result.push({
          year: yearData.year,
          date: event.date,
          type: change.changeType,
          description: change.description || event.description,
        });
      }

      for (const batch of event.details.data?.batchChanges ?? []) {
        for (const change of batch.changes) {
          if (!matches(change.item)) continue;
          result.push({
            year: yearData.year,
            date: event.date,
            type: change.changeType,
            description: change.description || batch.description || event.description,
          });
        }
      }
    }
  }

  return result;
}

export function selectPublishedWikiHistory(
  snapshot: ApprovedActionSnapshot,
  historyRows: readonly PublicActionRow[] = [],
  options: WikiHistoryConversionOptions = {}
): WikiYearData[] {
  return mergeWikiHistoryData(
    wikiHistoryData,
    snapshotToWikiHistory(snapshot, historyRows, options)
  );
}

export function selectPublishedEntityHistory(
  snapshot: ApprovedActionSnapshot,
  scope: PublishedEntityHistoryScope,
  historyRows: readonly PublicActionRow[] = [],
  options: WikiHistoryConversionOptions = {}
): PublishedEntityHistoryEntry[] {
  return selectHistoryEntries(selectPublishedWikiHistory(snapshot, historyRows, options), (item) =>
    matchesScope(item, scope)
  );
}

export async function getPublishedEntityHistoryReadModel(
  scope: PublishedEntityHistoryScope,
  snapshot?: ApprovedActionSnapshot,
  historyRows?: readonly PublicActionRow[],
  options: PublishedEntityHistoryOptions = {}
): Promise<PublishedEntityHistoryReadModel> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  const acquiredHistoryRows = historyRows ?? (await fetchPublicGameDataActionHistory());
  const wikiHistory = selectPublishedWikiHistory(acquiredSnapshot, acquiredHistoryRows, options);
  return {
    revision: createPublishedRevision(PRODUCTION_BUILD_IDENTITY, acquiredSnapshot.actionRevision),
    history: selectHistoryEntries(wikiHistory, (item) => matchesScope(item, scope)),
    relatedHistory: (options.relatedItems ?? []).map((item) => ({
      item,
      history: selectHistoryEntries(wikiHistory, (candidate) => matchesItem(candidate, item)),
    })),
  };
}
