import 'server-only';

import { unstable_cache } from 'next/cache';

import {
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';

import type { ApprovedActionSnapshot } from './approvedActionSnapshot';
import { PRODUCTION_BUILD_IDENTITY } from './buildIdentity';
import { createPublishedDomainCacheKey, PUBLISHED_SNAPSHOT_CACHE_SHAPE } from './cachePolicy';
import { getCanonicalGameData } from './canonicalSources';
import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';
import { createPublishedRevision } from './revision';
import { selectPublishedGameData } from './selectPublishedDomain';
import type {
  PublishedDomainReadModel,
  PublishedGameDataByType,
  PublishedGameDataSnapshot,
} from './types';

export type PublishedDomainReader = <EntityType extends PublishableEntityType>(
  entityType: EntityType,
  snapshot: ApprovedActionSnapshot,
  buildIdentity: string
) => Promise<PublishedGameDataByType[EntityType]>;

async function readPersistentPublishedDomain<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  snapshot: ApprovedActionSnapshot,
  buildIdentity: string
): Promise<PublishedGameDataByType[EntityType]> {
  const read = unstable_cache(
    async () => selectPublishedGameData(entityType, getCanonicalGameData(entityType), snapshot),
    createPublishedDomainCacheKey(buildIdentity, snapshot.actionRevision, entityType),
    {
      revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
      tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );

  return read();
}

export type ComposePublishedSnapshotOptions = {
  buildIdentity?: string;
  readDomain?: PublishedDomainReader;
};

export async function composePublishedGameDataSnapshot(
  snapshot: ApprovedActionSnapshot,
  options: ComposePublishedSnapshotOptions = {}
): Promise<PublishedGameDataSnapshot> {
  const buildIdentity = options.buildIdentity ?? PRODUCTION_BUILD_IDENTITY;
  const readDomain = options.readDomain ?? readPersistentPublishedDomain;
  const data: Partial<Record<PublishableEntityType, unknown>> = {};

  await Promise.all(
    PUBLISHABLE_ENTITY_TYPES.map(async (entityType) => {
      data[entityType] = await readDomain(entityType, snapshot, buildIdentity);
    })
  );

  return Object.freeze({
    revision: createPublishedRevision(buildIdentity, snapshot.actionRevision),
    actionRevision: snapshot.actionRevision,
    buildIdentity,
    data: Object.freeze(data) as PublishedGameDataByType,
  });
}

export async function getPublishedGameDataSnapshot(
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedGameDataSnapshot> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  return composePublishedGameDataSnapshot(acquiredSnapshot);
}

export async function getPublishedDomainReadModel<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  snapshot?: ApprovedActionSnapshot
): Promise<PublishedDomainReadModel<EntityType>> {
  const acquiredSnapshot = snapshot ?? (await getApprovedActionSnapshot());
  const data = await readPersistentPublishedDomain(
    entityType,
    acquiredSnapshot,
    PRODUCTION_BUILD_IDENTITY
  );

  return Object.freeze({
    revision: createPublishedRevision(PRODUCTION_BUILD_IDENTITY, acquiredSnapshot.actionRevision),
    entityType,
    data,
  });
}

export { PUBLISHED_SNAPSHOT_CACHE_SHAPE };
