'use client';

import { snapshot, subscribe as subscribeValtio } from 'valtio/vanilla';

import type { DeepReadonly } from '@/types/deep-readonly';
import { GameDataManager } from '@/lib/dataManager';
import { splitCharacterRelationActionHistory } from '@/lib/edit/characterRelationActions';
import {
  applyActionEntry,
  getActionsStorageKey,
  invertActionEntry,
  squashActions,
  withRecordingSuppressed,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import {
  buildDraftSummaryItemsForType,
  splitActionHistoryByEntity,
} from '@/lib/edit/editModeDrafts';
import {
  browserEditHistoryStore,
  createEditModeRegistry,
  type EditHistoryStore,
  type EditModeRegistry,
} from '@/lib/edit/editModeRegistry';
import { createEditStores, type EditStores } from '@/lib/edit/editStores';
import { reconcilePublishHistory } from '@/lib/edit/publishHistory';
import type { PendingActionOverlapResponse } from '@/lib/gameData/pendingActionAwarenessTypes';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type { PublishedRevision } from '@/lib/gameData/published/revision';
import type {
  PublishedGameDataByType,
  PublishedGameDataEntityByType,
} from '@/lib/gameData/published/types';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  clearPublishOperation,
  getOrCreatePublishOperationId,
  getPublishOperationFingerprint,
} from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitOutcomeFromResults,
  type GameDataSubmitMode,
  type GameDataSubmitOutcome,
} from '@/lib/gameData/submitMode';
import type { FactionId } from '@/data/types';

type FactionScopedEditEntityType = Extract<PublishableEntityType, 'achievements' | 'specialSkills'>;

export type EditEntityRef<EntityType extends PublishableEntityType = PublishableEntityType> =
  EntityType extends FactionScopedEditEntityType
    ? { entityType: EntityType; entityId: string; factionId: FactionId }
    : { entityType: EntityType; entityId: string; factionId?: never };

export type EditDraftScope =
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'character-relations' };

export type EditDraftState = Readonly<{
  actionCount: number;
  publishEntries: readonly ActionHistoryEntry[];
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
  { status: 'discarded' } | { status: 'storage-failed'; error: Error };

export class EditDraftCleanupError extends Error {
  constructor() {
    super('local_draft_cleanup_failed');
    this.name = 'EditDraftCleanupError';
  }
}

export type EditSubscriptionTarget =
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'draft'; scope: EditDraftScope }
  | { kind: 'draft-overview' };

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
    mutate: (value: EditStores[EntityType]) => void
  ) => void;
  updateEntity: <EntityType extends PublishableEntityType>(
    ref: EditEntityRef<EntityType>,
    mutate: (value: PublishedGameDataEntityByType[EntityType]) => void
  ) => void;
  readDraft: (scope: EditDraftScope) => EditDraftState;
  readDraftOverview: () => readonly EditDraftOverviewItem[];
  discardDraft: (scope: EditDraftScope) => EditDiscardResult;
  publishDraft: (scope: EditDraftScope, options?: EditPublishOptions) => Promise<EditPublishResult>;
  dispose: () => void;
}>;

type PublishTransportRequest = Readonly<{
  endpoint: '/api/game-data-actions/publish' | '/api/game-data-actions/publish-relations';
  operationId: string;
  body: Readonly<{
    entityType?: PublishableEntityType;
    entries: readonly ActionHistoryEntry[];
    message?: string;
    pendingAcknowledgementToken?: string;
    submitMode?: GameDataSubmitMode;
  }>;
}>;

type PublishTransportResult =
  | { status: 'published'; outcome: GameDataSubmitOutcome }
  | { status: 'pending-conflict'; conflict: PendingActionOverlapResponse };

export type EditSessionDependencies = Readonly<{
  history?: EditHistoryStore;
  publish?: (request: PublishTransportRequest) => Promise<PublishTransportResult>;
  invalidate?: () => void;
}>;

/** Same session object; raw fields remain temporarily for Phase 5 test and legacy cleanup. */
export type EditSessionRuntime = EditSession &
  Readonly<{
    stores: EditStores;
    registry: EditModeRegistry;
  }>;

async function publishWithFetch(request: PublishTransportRequest): Promise<PublishTransportResult> {
  const response = await fetch(request.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.operationId },
    body: JSON.stringify(request.body),
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
    requestId?: string;
    pendingAcknowledgementToken?: unknown;
    result?: Array<{
      is_public: boolean;
      status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
    }>;
  } | null;

  if (!response.ok) {
    if (
      response.status === 409 &&
      body?.error === 'pending_action_overlap' &&
      typeof body.pendingAcknowledgementToken === 'string'
    ) {
      return { status: 'pending-conflict', conflict: body as PendingActionOverlapResponse };
    }
    throw new Error(getPublishErrorMessage(body, '发布失败'));
  }

  return {
    status: 'published',
    outcome: getGameDataSubmitOutcomeFromResults(body?.result ?? []),
  };
}

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

function scopeEntityType(scope: EditDraftScope): PublishableEntityType {
  if (scope.kind === 'character-relations') return 'characters';
  return scope.kind === 'domain' ? scope.entityType : scope.entity.entityType;
}

function scopeEntityKey(ref: EditEntityRef): string {
  return 'factionId' in ref && ref.factionId ? `${ref.factionId}.${ref.entityId}` : ref.entityId;
}

function operationScope(scope: EditDraftScope): string {
  if (scope.kind === 'character-relations') return 'relations:characters';
  if (scope.kind === 'domain') return `page:${scope.entityType}:`;
  return `page:${scope.entity.entityType}:${scopeEntityKey(scope.entity)}`;
}

function selectHistory(
  scope: EditDraftScope,
  source: readonly ActionHistoryEntry[]
): { matching: ActionHistoryEntry[]; remaining: ActionHistoryEntry[] } {
  if (scope.kind === 'character-relations') {
    return splitCharacterRelationActionHistory(source);
  }
  if (scope.kind === 'domain') {
    return { matching: [...source], remaining: [] };
  }
  return splitActionHistoryByEntity([...source], scopeEntityKey(scope.entity));
}

export function createEditSession(
  baseline: PublishedGameDataByType,
  revision: PublishedRevision,
  dependencies: EditSessionDependencies = {}
): EditSessionRuntime {
  const history = dependencies.history ?? browserEditHistoryStore;
  const publish = dependencies.publish ?? publishWithFetch;
  const invalidate = dependencies.invalidate ?? (() => GameDataManager.invalidate());
  const stores = createEditStores(baseline);
  const registry = createEditModeRegistry(stores, baseline, history);
  const manualDraftListeners = new Set<() => void>();
  const sessionSubscriptions = new Set<() => void>();
  let disposed = false;

  const assertActive = (): void => {
    if (disposed) throw new Error('The edit session has been disposed.');
  };

  const readDraft = (scope: EditDraftScope): EditDraftState => {
    assertActive();
    const entityType = scopeEntityType(scope);
    const { matching } = selectHistory(scope, history.read(entityType));
    const publishEntries = squashActions(matching, {
      currentRoot: mutableDomain(stores, entityType),
    });
    return Object.freeze({ actionCount: publishEntries.length, publishEntries });
  };

  const notifyDrafts = (): void => manualDraftListeners.forEach((listener) => listener());
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
    mutate: (value: EditStores[EntityType]) => void
  ) => {
    assertActive();
    mutate(stores[entityType]);
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
    mutate(entity as PublishedGameDataEntityByType[EntityType]);
  };

  const session: EditSessionRuntime = Object.freeze({
    revision,
    stores,
    registry,
    readDomain,
    readEntity,
    subscribe: (target, listener) => {
      assertActive();
      const unsubscribes: Array<() => void> = [];
      try {
        if (target.kind === 'draft' || target.kind === 'draft-overview') {
          manualDraftListeners.add(listener);
          unsubscribes.push(() => manualDraftListeners.delete(listener));
        }
        if (target.kind === 'draft-overview') {
          PUBLISHABLE_ENTITY_TYPES.forEach((entityType) => {
            unsubscribes.push(subscribeValtio(stores[entityType], listener));
          });
        } else {
          const entityType =
            target.kind === 'domain'
              ? target.entityType
              : target.kind === 'entity'
                ? target.entity.entityType
                : scopeEntityType(target.scope);
          const value =
            target.kind === 'entity'
              ? (mutableEntity(stores, target.entity) ?? stores[entityType])
              : stores[entityType];
          unsubscribes.push(subscribeValtio(value, listener));
        }
      } catch (error) {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        throw error;
      }
      let subscribed = true;
      const unsubscribe = () => {
        if (!subscribed) return;
        subscribed = false;
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        sessionSubscriptions.delete(unsubscribe);
      };
      sessionSubscriptions.add(unsubscribe);
      return unsubscribe;
    },
    updateDomain,
    updateEntity,
    readDraft,
    readDraftOverview: () => {
      assertActive();
      return PUBLISHABLE_ENTITY_TYPES.flatMap((entityType) => {
        const publishEntries = squashActions(history.read(entityType), {
          currentRoot: mutableDomain(stores, entityType),
        });
        return buildDraftSummaryItemsForType(entityType, publishEntries, () => undefined).map(
          ({ entityId, factionId, count }) => ({
            entityType,
            entityId,
            ...(factionId ? { factionId } : {}),
            actionCount: count,
          })
        );
      });
    },
    discardDraft: (scope) => {
      assertActive();
      const entityType = scopeEntityType(scope);
      const storageKey = getActionsStorageKey(entityType);
      const source = history.read(entityType);
      const { matching, remaining } = selectHistory(scope, source);
      if (matching.length > 0) {
        withRecordingSuppressed(storageKey, () => {
          const root = mutableDomain(stores, entityType);
          for (let index = matching.length - 1; index >= 0; index -= 1) {
            applyActionEntry(root, invertActionEntry(matching[index]!));
          }
        });
      }
      let cleanupError: Error | null = null;
      let cleanupSucceeded = false;
      try {
        cleanupSucceeded = history.replace(entityType, remaining);
      } catch (error) {
        cleanupError = error instanceof Error ? error : new Error('Failed to persist draft.');
      }
      if (!cleanupSucceeded && matching.length > 0) {
        withRecordingSuppressed(storageKey, () => {
          const root = mutableDomain(stores, entityType);
          matching.forEach((entry) => applyActionEntry(root, entry));
        });
      }
      if (cleanupSucceeded) clearPublishOperation(operationScope(scope));
      invalidate();
      notifyDrafts();
      return cleanupSucceeded
        ? { status: 'discarded' }
        : {
            status: 'storage-failed',
            error: cleanupError ?? new Error('Failed to persist discarded draft.'),
          };
    },
    publishDraft: async (scope, options = {}) => {
      assertActive();
      const entityType = scopeEntityType(scope);
      const source = history.read(entityType);
      const { matching, remaining } = selectHistory(scope, source);
      const entries = squashActions(matching, {
        currentRoot: mutableDomain(stores, entityType),
      });
      const publishScope = operationScope(scope);

      if (entries.length === 0) {
        if (!history.replace(entityType, remaining)) {
          notifyDrafts();
          return { status: 'failed', error: new EditDraftCleanupError() };
        }
        clearPublishOperation(publishScope);
        notifyDrafts();
        return { status: 'empty' };
      }

      const endpoint =
        scope.kind === 'character-relations'
          ? '/api/game-data-actions/publish-relations'
          : '/api/game-data-actions/publish';
      const fingerprint = getPublishOperationFingerprint({
        endpoint,
        entries,
        message: options.message?.trim() || null,
        submitMode: options.submitMode ?? 'default',
      });

      try {
        const operationId = getOrCreatePublishOperationId(publishScope, fingerprint);
        const body: PublishTransportRequest['body'] = {
          ...(scope.kind === 'character-relations' ? {} : { entityType }),
          entries,
          ...(options.message === undefined ? {} : { message: options.message }),
          ...(options.pendingAcknowledgementToken === undefined
            ? {}
            : { pendingAcknowledgementToken: options.pendingAcknowledgementToken }),
          ...(options.submitMode === undefined ? {} : { submitMode: options.submitMode }),
        };
        const result = await publish({ endpoint, operationId, body });
        if (result.status === 'pending-conflict') return result;

        const latest = history.read(entityType);
        const reconciled = reconcilePublishHistory(source, remaining, latest);
        if (reconciled === null) {
          notifyDrafts();
          return {
            status: 'cleanup-conflict',
            outcome: result.outcome,
            reason: 'history-diverged',
          };
        }
        if (!history.replace(entityType, reconciled)) {
          notifyDrafts();
          return { status: 'cleanup-conflict', outcome: result.outcome, reason: 'storage-failed' };
        }
        clearPublishOperation(publishScope);
        notifyDrafts();
        return result;
      } catch (error) {
        return { status: 'failed', error: error instanceof Error ? error : new Error('发布失败') };
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      registry.teardownSubscribers();
      [...sessionSubscriptions].forEach((unsubscribe) => unsubscribe());
      sessionSubscriptions.clear();
      manualDraftListeners.clear();
    },
  });

  try {
    registry.loadDrafts();
    registry.setupSubscribers();
    return session;
  } catch (error) {
    registry.teardownSubscribers();
    [...sessionSubscriptions].forEach((unsubscribe) => unsubscribe());
    sessionSubscriptions.clear();
    manualDraftListeners.clear();
    disposed = true;
    throw error;
  }
}
