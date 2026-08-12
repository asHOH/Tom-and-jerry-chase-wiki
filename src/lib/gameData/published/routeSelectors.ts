import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { FactionId } from '@/data/types';

import type { ApprovedActionSnapshot } from './approvedActionSnapshot';
import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';
import {
  getPublishedEntityHistoryReadModel,
  hasPublishedEntityHistory,
  type PublishedEntityHistoryEntry,
} from './historySelectors';
import { getPublishedDomainReadModel } from './publishedSnapshot';
import type { PublishedGameDataEntityByType } from './types';

export type PublishedEntityRouteReadModel<EntityType extends PublishableEntityType> = Readonly<{
  revision: `v1:${string}`;
  entityType: EntityType;
  entityId: string;
  factionId: FactionId | null;
  data: PublishedGameDataEntityByType[EntityType] | null;
  history: readonly PublishedEntityHistoryEntry[];
}>;

function isFactionId(value: unknown): value is FactionId {
  return value === 'cat' || value === 'mouse';
}

function isFactionScoped(entityType: PublishableEntityType): boolean {
  return entityType === 'specialSkills' || entityType === 'achievements';
}

export async function getPublishedEntityRouteReadModel<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  entityId: string,
  factionId?: FactionId,
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedEntityRouteReadModel<EntityType>> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  const domain = await getPublishedDomainReadModel(entityType, acquiredSnapshot);
  const normalizedEntityId = entityId.trim();
  const normalizedFactionId = isFactionId(factionId) ? factionId : null;
  let data: PublishedGameDataEntityByType[EntityType] | null = null;

  if (normalizedEntityId && (!isFactionScoped(entityType) || normalizedFactionId)) {
    if (entityType === 'specialSkills' || entityType === 'achievements') {
      const factionRoot = domain.data as unknown as Readonly<
        Record<FactionId, Readonly<Record<string, unknown>>>
      >;
      const factionData = factionRoot[normalizedFactionId!];
      data = (factionData[normalizedEntityId] ?? null) as
        PublishedGameDataEntityByType[EntityType] | null;
    } else {
      const entityRoot = domain.data as unknown as Readonly<Record<string, unknown>>;
      data = (entityRoot[normalizedEntityId] ?? null) as
        PublishedGameDataEntityByType[EntityType] | null;
    }
  }

  const history =
    normalizedEntityId &&
    hasPublishedEntityHistory(entityType) &&
    (!isFactionScoped(entityType) || normalizedFactionId)
      ? (
          await getPublishedEntityHistoryReadModel(
            {
              entityType,
              entityId: normalizedEntityId,
              ...(normalizedFactionId ? { factionId: normalizedFactionId } : {}),
            },
            acquiredSnapshot
          )
        ).history
      : [];

  return Object.freeze({
    revision: domain.revision,
    entityType,
    entityId: normalizedEntityId,
    factionId: normalizedFactionId,
    data,
    history: Object.freeze(history),
  });
}
