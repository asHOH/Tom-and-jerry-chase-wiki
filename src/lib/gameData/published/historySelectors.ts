import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { mergeWikiHistoryData, publicActionsToWikiHistory } from '@/lib/wikiHistoryFromActions';
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
} satisfies Record<PublishableEntityType, SingleItemTypeName>;

export type PublishedEntityHistoryScope = {
  entityType: keyof typeof ENTITY_TYPE_TO_SINGLE_ITEM_TYPE;
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
  historyRows: readonly PublicActionRow[]
): WikiYearData[] {
  return publicActionsToWikiHistory(mergeActionHistoryRows(snapshot, historyRows));
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

export function selectPublishedWikiHistory(
  snapshot: ApprovedActionSnapshot,
  historyRows: readonly PublicActionRow[] = []
): WikiYearData[] {
  return mergeWikiHistoryData(wikiHistoryData, snapshotToWikiHistory(snapshot, historyRows));
}

export function selectPublishedEntityHistory(
  snapshot: ApprovedActionSnapshot,
  scope: PublishedEntityHistoryScope,
  historyRows: readonly PublicActionRow[] = []
): PublishedEntityHistoryEntry[] {
  const result: PublishedEntityHistoryEntry[] = [];

  for (const yearData of selectPublishedWikiHistory(snapshot, historyRows)) {
    for (const event of yearData.events) {
      for (const change of event.details.data?.changes ?? []) {
        if (!matchesScope(change.item, scope)) continue;
        result.push({
          year: yearData.year,
          date: event.date,
          type: change.changeType,
          description: change.description || event.description,
        });
      }

      for (const batch of event.details.data?.batchChanges ?? []) {
        for (const change of batch.changes) {
          if (!matchesScope(change.item, scope)) continue;
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

export async function getPublishedEntityHistoryReadModel(
  scope: PublishedEntityHistoryScope,
  snapshot?: ApprovedActionSnapshot,
  historyRows?: readonly PublicActionRow[]
): Promise<PublishedEntityHistoryReadModel> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  const acquiredHistoryRows = historyRows ?? (await fetchPublicGameDataActionHistory());
  return {
    revision: createPublishedRevision(PRODUCTION_BUILD_IDENTITY, acquiredSnapshot.actionRevision),
    history: selectPublishedEntityHistory(acquiredSnapshot, scope, acquiredHistoryRows),
  };
}
