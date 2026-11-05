'use client';

import isEqual from 'lodash-es/isEqual';
import { subscribe, unstable_enableOp } from 'valtio';
import { snapshot, subscribe as subscribeValtio } from 'valtio/vanilla';

import { GameDataManager } from '@/lib/dataManager';
import {
  isUnchangedCharacterRelationInitialization,
  normalizeCharacterRelationPairHistory,
  splitCharacterRelationActionHistory,
} from '@/lib/edit/characterRelationActions';
import {
  actionsFromValtioOps,
  applyActionEntry,
  invertActionEntry,
  normalizeActionHistory,
  squashActions,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import { browserEditHistoryStore, type EditHistoryStore } from '@/lib/edit/draftPersistence';
import {
  buildDraftSummaryItemsForType,
  splitActionHistoryByEntity,
} from '@/lib/edit/editModeDrafts';
import { type EditStores } from '@/lib/edit/editStores';
import { reconcilePublishHistory } from '@/lib/edit/publishHistory';
import type { PendingActionOverlapResponse } from '@/lib/gameData/pendingActionAwarenessTypes';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  clearPublishOperation,
  getOrCreatePublishOperationId,
  getPublishOperationFingerprint,
  hasPublishOperation,
  PublishOperationConflictError,
  readPublishOperation,
} from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitOutcomeFromResults,
  type GameDataSubmitMode,
  type GameDataSubmitOutcome,
} from '@/lib/gameData/submitMode';
import { parseCharacterRelationPairPath } from '@/features/characters/utils/characterRelationPairs';
import {
  findInvalidModifiedKnowledgeCardGroup,
  KNOWLEDGE_CARD_GROUP_COST_MESSAGE,
} from '@/features/knowledge-cards/utils/groupCostValidation';

import type {
  EditDraftScope,
  EditDraftState,
  EditEntityRef,
  EditPublishOptions,
  EditSession,
  EditSessionDependencies,
} from './editSession';
import { migrateLegacyCharacterRelationDrafts } from './legacyCharacterRelationDrafts';

export class EditDraftCleanupError extends Error {
  constructor() {
    super('local_draft_cleanup_failed');
    this.name = 'EditDraftCleanupError';
  }
}

unstable_enableOp(true);

const DRAFT_HISTORY_WARNING_THRESHOLD = 1000;

class EditDraftRestoreError extends Error {
  readonly causes: readonly unknown[];

  constructor(causes: readonly unknown[]) {
    super('Failed to restore one or more edit-mode drafts.');
    this.name = 'EditDraftRestoreError';
    this.causes = causes;
  }
}

type EditModeRegistry = Readonly<{
  setupSubscribers: () => void;
  teardownSubscribers: () => void;
  loadDrafts: () => void;
  withRecordingSuppressed: <T>(entityType: PublishableEntityType, fn: () => T) => T;
}>;

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function createEntityRegistry(
  stores: EditStores
): Map<PublishableEntityType, Record<string, unknown>> {
  return new Map([
    ['achievements', asRecord(stores.achievements)],
    ['characters', asRecord(stores.characters)],
    ['cards', asRecord(stores.cards)],
    ['entities', asRecord(stores.entities)],
    ['buffs', asRecord(stores.buffs)],
    ['items', asRecord(stores.items)],
    ['fixtures', asRecord(stores.fixtures)],
    ['maps', asRecord(stores.maps)],
    ['modes', asRecord(stores.modes)],
    ['specialSkills', asRecord(stores.specialSkills)],
    ['traits', asRecord(stores.traits)],
  ]);
}

function syncEntityToLocalStorage(
  entityType: PublishableEntityType,
  entity: Record<string, unknown>,
  historyStore: EditHistoryStore
): () => void {
  return subscribe(entity, (ops) => {
    const actions = actionsFromValtioOps(ops);
    if (actions.length === 0) return;
    const entries =
      entityType === 'characters'
        ? normalizeCharacterRelationPairHistory([actions])
        : [actions.length === 1 ? actions[0]! : actions];
    entries.forEach((entry) => historyStore.append(entityType, entry));
  });
}

function createDraftRecording(
  stores: EditStores,
  historyStore: EditHistoryStore = browserEditHistoryStore
): EditModeRegistry {
  const entityRegistry = createEntityRegistry(stores);
  const subscribers = new Map<PublishableEntityType, () => void>();

  const subscribeEntity = (
    entityType: PublishableEntityType,
    entity: Record<string, unknown>
  ): void => {
    subscribers.get(entityType)?.();
    subscribers.set(entityType, syncEntityToLocalStorage(entityType, entity, historyStore));
  };

  const teardownSubscribers = (): void => {
    subscribers.forEach((unsubscribe) => unsubscribe());
    subscribers.clear();
  };

  const setupSubscribers = (): void => {
    entityRegistry.forEach((entity, entityType) => {
      subscribeEntity(entityType, entity);
    });
  };

  const withRecordingSuppressed: EditModeRegistry['withRecordingSuppressed'] = (entityType, fn) => {
    const entity = entityRegistry.get(entityType);
    const unsubscribe = subscribers.get(entityType);
    if (!entity || !unsubscribe) return fn();

    unsubscribe();
    subscribers.delete(entityType);
    try {
      return fn();
    } finally {
      subscribeEntity(entityType, entity);
    }
  };

  const loadDrafts = (): void => {
    if (typeof window === 'undefined') return;

    const errors: unknown[] = [];
    entityRegistry.forEach((entity, entityType) => {
      try {
        const storedHistory = historyStore.read(entityType);
        const normalizedHistory =
          entityType === 'characters'
            ? normalizeCharacterRelationPairHistory(storedHistory)
            : storedHistory;
        // An uncertain legacy submission must keep its original payload for an exact retry.
        const history =
          entityType === 'characters' &&
          ![
            'relations:characters',
            'page:characters:',
            ...Object.keys(entity).map((id) => `page:characters:${id}`),
          ].some(hasPublishOperation)
            ? migrateLegacyCharacterRelationDrafts(normalizedHistory, entity)
            : normalizedHistory;
        if (!isEqual(history, storedHistory) && !historyStore.replace(entityType, history)) {
          throw new Error('Failed to persist normalized character relation drafts.');
        }
        if (history.length === 0) return;

        if (history.length > DRAFT_HISTORY_WARNING_THRESHOLD) {
          console.warn('Large edit mode draft history detected', {
            entityType,
            entries: history.length,
            threshold: DRAFT_HISTORY_WARNING_THRESHOLD,
          });
        }

        withRecordingSuppressed(entityType, () => {
          for (const entry of history) {
            applyActionEntry(entity, entry);
          }
        });
      } catch (error) {
        console.error(`Failed to load ${entityType} from localStorage:`, error);
        errors.push(error);
      }
    });

    if (errors.length > 0) {
      throw new EditDraftRestoreError(errors);
    }
  };

  return Object.freeze({
    setupSubscribers,
    teardownSubscribers,
    loadDrafts,
    withRecordingSuppressed,
  });
}

export type PublishTransportRequest = Readonly<{
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

export type PublishTransportResult =
  | { status: 'published'; outcome: GameDataSubmitOutcome }
  | { status: 'pending-conflict'; conflict: PendingActionOverlapResponse };

class RejectedGameDataEditSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RejectedGameDataEditSubmissionError';
  }
}

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
    const message = getPublishErrorMessage(body, '发布失败');
    if (
      (response.status === 409 && body?.error === 'stale_edit') ||
      (response.status === 422 && body?.error === 'invalid_game_data')
    ) {
      throw new RejectedGameDataEditSubmissionError(message);
    }
    throw new Error(message);
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

function scopeEntityType(scope: EditDraftScope): PublishableEntityType {
  if (scope.kind === 'character-relations') return 'characters';
  return scope.kind === 'domain' ? scope.entityType : scope.entity.entityType;
}

function scopeEntityKey(ref: EditEntityRef): string {
  return 'factionId' in ref && ref.factionId ? `${ref.factionId}.${ref.entityId}` : ref.entityId;
}

function operationScope(scope: EditDraftScope, entries: readonly ActionHistoryEntry[]): string {
  const actions = entries.flat();
  const first = actions[0];
  const pair = first && parseCharacterRelationPairPath(first.path);
  if (
    scopeEntityType(scope) === 'characters' &&
    pair?.rest.length === 0 &&
    actions.every((action) => action.path === first!.path)
  ) {
    return `relations:pair:${first!.path}`;
  }
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
  return splitActionHistoryByEntity(
    [...source],
    scopeEntityKey(scope.entity),
    scope.entity.entityType
  );
}

export function createDraftJournal(
  baseline: PublishedGameDataByType,
  stores: EditStores,
  dependencies: EditSessionDependencies = {}
) {
  const history = dependencies.history ?? browserEditHistoryStore;
  const publish = dependencies.publish ?? publishWithFetch;
  const invalidate = dependencies.invalidate ?? (() => GameDataManager.invalidate());
  const registry = createDraftRecording(stores, history);
  const manualDraftListeners = new Set<() => void>();
  const sessionSubscriptions = new Set<() => void>();
  let disposed = false;

  const assertActive = (): void => {
    if (disposed) throw new Error('The edit session has been disposed.');
  };

  const squashDraft = (entityType: PublishableEntityType, entries: ActionHistoryEntry[]) => {
    const squashed = squashActions(entries, { currentRoot: mutableDomain(stores, entityType) });
    if (entityType !== 'characters') return squashed;
    return normalizeActionHistory(
      squashed.map((entry) =>
        (Array.isArray(entry) ? entry : [entry]).filter(
          (action) => !isUnchangedCharacterRelationInitialization(action, baseline.characters)
        )
      )
    );
  };

  const readDraft = (scope: EditDraftScope): EditDraftState => {
    assertActive();
    const entityType = scopeEntityType(scope);
    const { matching } = selectHistory(scope, history.read(entityType));
    const publishEntries = squashDraft(entityType, matching);
    return Object.freeze({ actionCount: publishEntries.length, publishEntries });
  };

  const notifyDrafts = (): void => manualDraftListeners.forEach((listener) => listener());
  const journal = {
    subscribe: (scope: EditDraftScope | undefined, listener: () => void) => {
      assertActive();
      manualDraftListeners.add(listener);
      const types = scope ? [scopeEntityType(scope)] : PUBLISHABLE_ENTITY_TYPES;
      const unsubscribes: Array<() => void> = [() => manualDraftListeners.delete(listener)];
      try {
        types.forEach((entityType) =>
          unsubscribes.push(subscribeValtio(stores[entityType], listener))
        );
      } catch (error) {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        throw error;
      }
      let subscribed = true;
      const unsubscribe = () => {
        if (!subscribed) return;
        subscribed = false;
        unsubscribes.forEach((cleanup) => cleanup());
        sessionSubscriptions.delete(unsubscribe);
      };
      sessionSubscriptions.add(unsubscribe);
      return unsubscribe;
    },
    readDraft,
    readDraftOverview: () => {
      assertActive();
      return PUBLISHABLE_ENTITY_TYPES.flatMap((entityType) => {
        const publishEntries = squashDraft(entityType, history.read(entityType));
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
    discardDraft: (scope: EditDraftScope): ReturnType<EditSession['discardDraft']> => {
      assertActive();
      const entityType = scopeEntityType(scope);
      const source = history.read(entityType);
      const { matching, remaining } = selectHistory(scope, source);
      const entries = squashDraft(entityType, matching);
      const discardScope = operationScope(scope, entries.length > 0 ? entries : matching);
      const originalEntries = squashActions(matching, {
        currentRoot: mutableDomain(stores, entityType),
      });
      const originalScope = operationScope(
        scope,
        originalEntries.length > 0 ? originalEntries : matching
      );
      if (matching.length > 0) {
        registry.withRecordingSuppressed(entityType, () => {
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
        registry.withRecordingSuppressed(entityType, () => {
          const root = mutableDomain(stores, entityType);
          matching.forEach((entry) => applyActionEntry(root, entry));
        });
      }
      if (cleanupSucceeded) {
        clearPublishOperation(discardScope);
        clearPublishOperation(originalScope);
      }
      invalidate();
      notifyDrafts();
      return cleanupSucceeded
        ? { status: 'discarded' }
        : {
            status: 'storage-failed',
            error: cleanupError ?? new Error('Failed to persist discarded draft.'),
          };
    },
    publishDraft: async (
      scope: EditDraftScope,
      options: EditPublishOptions = {}
    ): ReturnType<EditSession['publishDraft']> => {
      assertActive();
      const entityType = scopeEntityType(scope);
      const source = history.read(entityType);
      const { matching, remaining } = selectHistory(scope, source);
      const squashed = squashActions(matching, { currentRoot: mutableDomain(stores, entityType) });
      const legacySquashed = squashActions(matching, {
        currentRoot: mutableDomain(stores, entityType),
        preserveLegacyCreations: true,
      });
      const legacyScope = operationScope(scope, legacySquashed);
      const originalScope = readPublishOperation(legacyScope)
        ? legacyScope
        : operationScope(scope, squashed);
      const existingOperation = readPublishOperation(originalScope);
      const requestFingerprint = (
        entries: readonly ActionHistoryEntry[],
        endpoint = scope.kind === 'character-relations'
          ? '/api/game-data-actions/publish-relations'
          : '/api/game-data-actions/publish'
      ) =>
        getPublishOperationFingerprint({
          endpoint,
          entries,
          message: options.message?.trim() || null,
          submitMode: options.submitMode ?? 'default',
        });
      // An uncertain request must retain its exact payload for an idempotent retry.
      const retryEntries = existingOperation
        ? [squashed, legacySquashed].find(
            (entries) =>
              existingOperation.fingerprint === requestFingerprint(entries) ||
              (originalScope.startsWith('relations:pair:') &&
                existingOperation.fingerprint ===
                  requestFingerprint(
                    entries,
                    scope.kind === 'character-relations'
                      ? '/api/game-data-actions/publish'
                      : '/api/game-data-actions/publish-relations'
                  ))
          )
        : undefined;
      const retrying = retryEntries !== undefined;
      const entries = retryEntries ?? squashDraft(entityType, matching);
      const publishScope = existingOperation
        ? originalScope
        : operationScope(scope, entries.length > 0 ? entries : matching);

      if (
        entityType === 'characters' &&
        !retrying &&
        (!existingOperation || existingOperation.fingerprint === requestFingerprint(entries))
      ) {
        registry.withRecordingSuppressed(entityType, () => {
          for (const action of squashed.flat()) {
            if (isUnchangedCharacterRelationInitialization(action, baseline.characters)) {
              // Restore absence so the next edit records the correct before-value.
              applyActionEntry(mutableDomain(stores, entityType), invertActionEntry(action));
            }
          }
        });
      }

      if (entries.length === 0) {
        if (existingOperation) {
          return { status: 'failed', error: new PublishOperationConflictError() };
        }
        if (!history.replace(entityType, remaining)) {
          notifyDrafts();
          return { status: 'failed', error: new EditDraftCleanupError() };
        }
        clearPublishOperation(publishScope);
        notifyDrafts();
        return { status: 'empty' };
      }

      if (entityType === 'characters') {
        const invalidGroup = findInvalidModifiedKnowledgeCardGroup(
          baseline.characters,
          snapshot(stores.characters),
          entries
            .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
            .map((action) => action.path),
          (cardId) => baseline.cards[cardId.slice(cardId.indexOf('-') + 1)]?.cost ?? 0
        );
        if (invalidGroup) {
          return {
            status: 'failed',
            error: new Error(`${KNOWLEDGE_CARD_GROUP_COST_MESSAGE} (${invalidGroup})`),
          };
        }
      }

      let endpoint: PublishTransportRequest['endpoint'] =
        scope.kind === 'character-relations'
          ? '/api/game-data-actions/publish-relations'
          : '/api/game-data-actions/publish';
      const fingerprintForEndpoint = (value: PublishTransportRequest['endpoint']) =>
        getPublishOperationFingerprint({
          endpoint: value,
          entries,
          message: options.message?.trim() || null,
          submitMode: options.submitMode ?? 'default',
        });

      try {
        let operationId: string;
        try {
          operationId = getOrCreatePublishOperationId(
            publishScope,
            fingerprintForEndpoint(endpoint)
          );
        } catch (error) {
          if (
            !(error instanceof PublishOperationConflictError) ||
            !publishScope.startsWith('relations:pair:')
          ) {
            throw error;
          }
          // The server includes the endpoint's permission in its operation fingerprint.
          // Retry the original transport only when the complete draft still matches.
          endpoint =
            endpoint === '/api/game-data-actions/publish'
              ? '/api/game-data-actions/publish-relations'
              : '/api/game-data-actions/publish';
          operationId = getOrCreatePublishOperationId(
            publishScope,
            fingerprintForEndpoint(endpoint)
          );
        }
        const body: PublishTransportRequest['body'] = {
          ...(endpoint === '/api/game-data-actions/publish-relations' ? {} : { entityType }),
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
        if (error instanceof RejectedGameDataEditSubmissionError) {
          // A definitive rejection saved nothing under this key; allow a corrected draft.
          clearPublishOperation(publishScope);
        }
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
  };

  try {
    registry.loadDrafts();
    registry.setupSubscribers();
    return journal;
  } catch (error) {
    registry.teardownSubscribers();
    [...sessionSubscriptions].forEach((unsubscribe) => unsubscribe());
    sessionSubscriptions.clear();
    manualDraftListeners.clear();
    disposed = true;
    throw error;
  }
}
