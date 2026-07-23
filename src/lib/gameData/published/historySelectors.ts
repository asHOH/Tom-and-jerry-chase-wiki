import 'server-only';

import { mergeWikiHistoryData, normalizedActionsToWikiHistory } from '@/lib/wikiHistoryFromActions';
import type {
  FactionId,
  SingleItem,
  SingleItemTypeName,
  WikiChangeType,
  WikiYearData,
} from '@/data/types';
import { wikiHistoryData } from '@/data/wikiHistory';

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
} satisfies Record<string, SingleItemTypeName>;

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

function snapshotToWikiHistory(snapshot: ApprovedActionSnapshot): WikiYearData[] {
  return normalizedActionsToWikiHistory(
    snapshot.rows.map((row) => ({
      entityType: row.entityType,
      createdAt: row.createdAt,
      actions: row.actions,
    }))
  );
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

export function selectPublishedWikiHistory(snapshot: ApprovedActionSnapshot): WikiYearData[] {
  return mergeWikiHistoryData(wikiHistoryData, snapshotToWikiHistory(snapshot));
}

export function selectPublishedEntityHistory(
  snapshot: ApprovedActionSnapshot,
  scope: PublishedEntityHistoryScope
): PublishedEntityHistoryEntry[] {
  const result: PublishedEntityHistoryEntry[] = [];

  for (const yearData of selectPublishedWikiHistory(snapshot)) {
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
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedEntityHistoryReadModel> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  return {
    revision: createPublishedRevision(PRODUCTION_BUILD_IDENTITY, acquiredSnapshot.actionRevision),
    history: selectPublishedEntityHistory(acquiredSnapshot, scope),
  };
}
