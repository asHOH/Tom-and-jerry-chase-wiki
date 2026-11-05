'use client';

import { snapshot, subscribe as subscribeValtio } from 'valtio/vanilla';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { PendingActionOverlapResponse } from '@/lib/gameData/pendingActionAwarenessTypes';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { PublishedRevision } from '@/lib/gameData/published/revision';
import type {
  PublishedGameDataByType,
  PublishedGameDataEntityByType,
} from '@/lib/gameData/published/types';
import type { FactionScopedGameDataEntityType } from '@/lib/gameData/scopedEntityPaths';
import type { GameDataSubmitMode, GameDataSubmitOutcome } from '@/lib/gameData/submitMode';
import type { FactionId } from '@/data/types';

import type { ActionHistoryEntry } from './diffUtils';
import {
  createDraftJournal,
  type PublishTransportRequest,
  type PublishTransportResult,
} from './draftJournal';
import type { EditHistoryStore } from './draftPersistence';
import { createEditStores, type EditStores } from './editStores';

export type EditEntityRef<EntityType extends PublishableEntityType = PublishableEntityType> =
  EntityType extends FactionScopedGameDataEntityType
    ? { entityType: EntityType; entityId: string; factionId: FactionId }
    : { entityType: EntityType; entityId: string; factionId?: never };

export type EditDraftScope =
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'character-relations' };

export type EditDraftState = Readonly<{
  actionCount: number;
  publishEntries: readonly ActionHistoryEntry[];
  persistence: 'saved' | 'unsaved' | 'conflict';
}>;

export type EditDraftOverviewItem = Readonly<{
  entityType: PublishableEntityType;
  entityId: string;
  factionId?: FactionId;
  actionCount: number;
}>;

export type EditPublishOptions = Readonly<{
  message?: string;
  pendingAcknowledgementToken?: string;
  submitMode?: GameDataSubmitMode;
}>;

export type EditPublishResult =
  | { status: 'empty' }
  | { status: 'published'; outcome: GameDataSubmitOutcome }
  | { status: 'pending-conflict'; conflict: PendingActionOverlapResponse }
  | {
      status: 'cleanup-conflict';
      outcome: GameDataSubmitOutcome;
      reason: 'history-diverged' | 'storage-failed';
    }
  | { status: 'failed'; error: Error };

export type EditDiscardResult =
  { status: 'discarded' } | { status: 'busy' } | { status: 'storage-failed'; error: Error };

export { EditDraftCleanupError } from './draftJournal';
export { EditDraftPersistenceError } from './draftPersistence';

type EditSubscriptionTarget =
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'draft'; scope: EditDraftScope }
  | { kind: 'draft-overview' };

export type EditDomainDraft<EntityType extends PublishableEntityType> = EditStores[EntityType];

export type EditSession = Readonly<{
  revision: PublishedRevision;
  readDomain: <EntityType extends PublishableEntityType>(
    entityType: EntityType
  ) => PublishedGameDataByType[EntityType];
  readEntity: <EntityType extends PublishableEntityType>(
    ref: EditEntityRef<EntityType>
  ) => DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null;
  subscribe: (target: EditSubscriptionTarget, listener: () => void) => () => void;
  updateDomain: <EntityType extends PublishableEntityType>(
    entityType: EntityType,
    mutate: (value: EditDomainDraft<EntityType>) => void
  ) => void;
  updateEntity: <EntityType extends PublishableEntityType>(
    ref: EditEntityRef<EntityType>,
    mutate: (value: PublishedGameDataEntityByType[EntityType]) => void
  ) => void;
  readDraft: (scope: EditDraftScope) => EditDraftState;
  readDraftOverview: () => readonly EditDraftOverviewItem[];
  discardDraft: (scope: EditDraftScope) => EditDiscardResult;
  publishDraft: (scope: EditDraftScope, options?: EditPublishOptions) => Promise<EditPublishResult>;
  hasUnsavedDrafts: () => boolean;
  retryDraftPersistence: (
    scope?: EditDraftScope
  ) => { status: 'saved' } | { status: 'storage-failed'; error: Error };
  dispose: () => void;
}>;

export type EditSessionDependencies = Readonly<{
  history?: EditHistoryStore;
  publish?: (request: PublishTransportRequest) => Promise<PublishTransportResult>;
  invalidate?: () => void;
}>;

function mutableDomain(
  stores: EditStores,
  entityType: PublishableEntityType
): Record<string, unknown> {
  return stores[entityType] as unknown as Record<string, unknown>;
}

function mutableEntity(
  stores: EditStores,
  ref: EditEntityRef
): Record<string, unknown> | undefined {
  const domain = mutableDomain(stores, ref.entityType);
  if ('factionId' in ref && ref.factionId) {
    return (domain[ref.factionId] as Record<string, Record<string, unknown>> | undefined)?.[
      ref.entityId
    ];
  }
  return domain[ref.entityId] as Record<string, unknown> | undefined;
}

export function createEditSession(
  baseline: PublishedGameDataByType,
  revision: PublishedRevision,
  dependencies: EditSessionDependencies = {}
): EditSession {
  const stores = createEditStores(baseline);
  const journal = createDraftJournal(baseline, stores, dependencies);
  const subscriptions = new Set<() => void>();
  let disposed = false;
  const assertActive = () => {
    if (disposed) throw new Error('The edit session has been disposed.');
  };
  const readDomain: EditSession['readDomain'] = <EntityType extends PublishableEntityType>(
    entityType: EntityType
  ) => {
    assertActive();
    return snapshot(stores[entityType]) as PublishedGameDataByType[EntityType];
  };
  const readEntity: EditSession['readEntity'] = <EntityType extends PublishableEntityType>(
    ref: EditEntityRef<EntityType>
  ) => {
    assertActive();
    const entity = mutableEntity(stores, ref as EditEntityRef);
    return entity
      ? (snapshot(entity) as DeepReadonly<PublishedGameDataEntityByType[EntityType]>)
      : null;
  };
  const updateDomain: EditSession['updateDomain'] = <EntityType extends PublishableEntityType>(
    entityType: EntityType,
    mutate: (value: EditDomainDraft<EntityType>) => void
  ) => {
    assertActive();
    journal.mutate(entityType, () => mutate(stores[entityType]));
  };
  const updateEntity: EditSession['updateEntity'] = <EntityType extends PublishableEntityType>(
    ref: EditEntityRef<EntityType>,
    mutate: (value: PublishedGameDataEntityByType[EntityType]) => void
  ) => {
    assertActive();
    const entity = mutableEntity(stores, ref as EditEntityRef);
    if (!entity) {
      throw new Error(`Cannot edit ${ref.entityType}.${ref.entityId} because it is not loaded.`);
    }
    journal.mutate(ref.entityType, () =>
      mutate(entity as PublishedGameDataEntityByType[EntityType])
    );
  };

  return Object.freeze({
    revision,
    readDomain,
    readEntity,
    updateDomain,
    updateEntity,
    readDraft: journal.readDraft,
    readDraftOverview: journal.readDraftOverview,
    discardDraft: journal.discardDraft,
    publishDraft: journal.publishDraft,
    hasUnsavedDrafts: journal.hasUnsavedDrafts,
    retryDraftPersistence: journal.retryDraftPersistence,
    subscribe: (target, listener) => {
      assertActive();
      if (target.kind === 'draft' || target.kind === 'draft-overview') {
        return journal.subscribe(target.kind === 'draft' ? target.scope : undefined, listener);
      }
      const entityType = target.kind === 'domain' ? target.entityType : target.entity.entityType;
      const value =
        target.kind === 'entity'
          ? (mutableEntity(stores, target.entity) ?? stores[entityType])
          : stores[entityType];
      const cleanup = subscribeValtio(value, listener);
      let subscribed = true;
      const unsubscribe = () => {
        if (!subscribed) return;
        subscribed = false;
        cleanup();
        subscriptions.delete(unsubscribe);
      };
      subscriptions.add(unsubscribe);
      return unsubscribe;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      journal.dispose();
      [...subscriptions].forEach((unsubscribe) => unsubscribe());
      subscriptions.clear();
    },
  } satisfies EditSession);
}
