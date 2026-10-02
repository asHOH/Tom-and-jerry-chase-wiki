import 'server-only';

import { cache } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import {
  isFactionScopedGameDataEntityType,
  type FactionScopedGameDataEntityType,
} from '@/lib/gameData/scopedEntityPaths';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { FactionId } from '@/data/types';

import type { ApprovedActionSnapshot } from './approvedActionSnapshot';
import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';
import {
  getPublishedEntityHistoryReadModel,
  hasPublishedEntityHistory,
  type PublishedEntityHistoryEntry,
  type PublishedRelatedEntityHistory,
} from './historySelectors';
import { getPublishedDomainReadModel } from './publishedSnapshot';
import type { PublishedGameDataEntityByType } from './types';

export type PublishedEntityRouteReadModel<EntityType extends PublishableEntityType> = Readonly<{
  revision: `v1:${string}`;
  entityType: EntityType;
  entityId: string;
  factionId: FactionId | null;
  data: PublishedGameDataEntityByType[EntityType] | null;
  history: PublishedEntityHistory;
  relatedHistory?: readonly PublishedRelatedEntityHistory[];
}>;

type CharacterHistoryProjection = Readonly<{
  skills: readonly Readonly<{ name: string }>[];
}>;

function isFactionId(value: unknown): value is FactionId {
  return value === 'cat' || value === 'mouse';
}

function readPublishedEntityRouteReadModel<EntityType extends FactionScopedGameDataEntityType>(
  entityType: EntityType,
  entityId: string,
  factionId: FactionId,
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedEntityRouteReadModel<EntityType>>;
function readPublishedEntityRouteReadModel<
  EntityType extends Exclude<PublishableEntityType, FactionScopedGameDataEntityType>,
>(
  entityType: EntityType,
  entityId: string,
  factionId?: undefined,
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedEntityRouteReadModel<EntityType>>;
async function readPublishedEntityRouteReadModel<EntityType extends PublishableEntityType>(
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

  if (
    normalizedEntityId &&
    (!isFactionScopedGameDataEntityType(entityType) || normalizedFactionId)
  ) {
    if (isFactionScopedGameDataEntityType(entityType)) {
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

  let history: readonly PublishedEntityHistoryEntry[] = [];
  let historyUnavailable = false;
  let relatedHistory: readonly PublishedRelatedEntityHistory[] = [];

  if (
    normalizedEntityId &&
    hasPublishedEntityHistory(entityType) &&
    (!isFactionScopedGameDataEntityType(entityType) || normalizedFactionId)
  ) {
    const characterRoot =
      entityType === 'characters'
        ? (domain.data as unknown as Readonly<Record<string, CharacterHistoryProjection>>)
        : undefined;
    const selectedCharacter = characterRoot?.[normalizedEntityId];
    const historyReadModel = await getPublishedEntityHistoryReadModel(
      {
        entityType,
        entityId: normalizedEntityId,
        ...(normalizedFactionId ? { factionId: normalizedFactionId } : {}),
      },
      acquiredSnapshot,
      undefined,
      characterRoot
        ? {
            resolveCharacterSkillName: (characterId, skillIndex) =>
              characterRoot[characterId]?.skills[skillIndex]?.name,
            relatedItems: (selectedCharacter?.skills ?? []).map((skill) => ({
              name: skill.name,
              type: 'skill',
            })),
          }
        : {}
    );
    history = historyReadModel.history;
    historyUnavailable = historyReadModel.unavailable;
    relatedHistory = historyReadModel.relatedHistory;
  }

  return Object.freeze({
    revision: domain.revision,
    entityType,
    entityId: normalizedEntityId,
    factionId: normalizedFactionId,
    data,
    history: Object.freeze({ entries: Object.freeze(history), unavailable: historyUnavailable }),
    relatedHistory: Object.freeze(relatedHistory),
  });
}

// Share entity/history work between metadata and the page within one server render.
export const getPublishedEntityRouteReadModel = cache(readPublishedEntityRouteReadModel);
