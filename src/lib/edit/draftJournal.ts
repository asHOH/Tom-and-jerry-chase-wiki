'use client';

import isEqual from 'lodash-es/isEqual';
import { subscribe, unstable_enableOp } from 'valtio';
import { snapshot } from 'valtio/vanilla';

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
  type Action,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import {
  createBrowserDraftHistoryPersistence,
  createBrowserDraftOperationStore,
  EditDraftPersistenceError,
  readDraftRequestBody,
  type DraftOperation,
  type DraftRecovery,
  type DraftRequestBody,
} from '@/lib/edit/draftPersistence';
import {
  buildDraftSummaryItemsForType,
  splitActionHistoryByEntity,
} from '@/lib/edit/editModeDrafts';
import { type EditStores } from '@/lib/edit/editStores';
import { reconcilePublishHistory } from '@/lib/edit/publishHistory';
import { areActionsOrderDependent } from '@/lib/gameData/actionDependencies';
import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';
import type { PendingActionOverlapResponse } from '@/lib/gameData/pendingActionAwarenessTypes';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  getPublishOperationFingerprint,
  PublishOperationConflictError,
} from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitOutcomeFromResults,
  type GameDataSubmitOutcome,
} from '@/lib/gameData/submitMode';
import { actionHistorySchema } from '@/lib/validation/schemas';
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

export type PublishTransportRequest = Readonly<{
  endpoint: '/api/game-data-actions/publish' | '/api/game-data-actions/publish-relations';
  operationId: string;
  body: string;
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
    body: request.body,
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
    requestId?: string;
    pendingAcknowledgementToken?: unknown;
    result?: Array<{
      id: string;
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

  if (
    !body ||
    !Array.isArray(body.result) ||
    body.result.length === 0 ||
    body.result.some(
      (row) =>
        !row ||
        typeof row.id !== 'string' ||
        row.id.trim().length === 0 ||
        typeof row.is_public !== 'boolean' ||
        !['pending', 'approved', 'rejected', 'synced', 'revoked'].includes(row.status)
    )
  ) {
    throw new Error('提交结果无法确认，请使用原请求重试。');
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
  const persistence = dependencies.history ?? createBrowserDraftHistoryPersistence();
  const operations = createBrowserDraftOperationStore();
  const operationRecords = new Map<string, DraftOperation>();
  const appliedTargets = new Set<string>();
  const pendingTargetWrites = new Set<string>();
  const activePublishes = new Map<
    PublishableEntityType,
    { signature: string; promise: ReturnType<EditSession['publishDraft']> }
  >();
  let restoring = true;
  const histories = new Map<PublishableEntityType, ActionHistoryEntry[]>();
  const persistenceStates = new Map<PublishableEntityType, EditDraftState['persistence']>();
  const pendingActions = new Map<PublishableEntityType, Action[]>();
  const recordingSubscriptions: Array<() => void> = [];
  let recordingSuppressed = 0;
  let mutationDepth = 0;
  const withRecordingSuppressed = <T>(fn: () => T): T => {
    recordingSuppressed += 1;
    try {
      return fn();
    } finally {
      recordingSuppressed -= 1;
    }
  };
  const save = (entityType: PublishableEntityType, entries: ActionHistoryEntry[]): boolean => {
    try {
      if (!persistence.replace(entityType, entries))
        throw new EditDraftPersistenceError('unavailable');
      persistenceStates.set(entityType, 'saved');
      return true;
    } catch (error) {
      persistenceStates.set(
        entityType,
        error instanceof EditDraftPersistenceError && error.kind === 'conflict'
          ? 'conflict'
          : 'unsaved'
      );
      return false;
    }
  };
  const history = {
    read: (entityType: PublishableEntityType) => structuredClone(histories.get(entityType) ?? []),
    replace: (entityType: PublishableEntityType, entries: ActionHistoryEntry[]) => {
      if (!save(entityType, entries)) return false;
      histories.set(entityType, structuredClone(entries));
      return true;
    },
  };
  const publish = dependencies.publish ?? publishWithFetch;
  const invalidate = dependencies.invalidate ?? (() => GameDataManager.invalidate());
  const manualDraftListeners = new Set<() => void>();
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
    return Object.freeze({
      actionCount: publishEntries.length,
      publishEntries,
      persistence: persistenceStates.get(entityType) ?? 'saved',
    });
  };

  const notifyDrafts = (): void => manualDraftListeners.forEach((listener) => listener());
  const writeOperation = (key: string, record: DraftOperation) => {
    operations.write(key, record);
    operationRecords.set(key, record);
  };
  const removeOperation = (key: string) => {
    operations.remove(key);
    operationRecords.delete(key);
    appliedTargets.delete(key);
    pendingTargetWrites.delete(key);
  };
  const recordDomain = (key: string, record: DraftOperation): PublishableEntityType => {
    if (record.gameDataRecovery) return scopeEntityType(record.gameDataRecovery.scope);
    return key.startsWith('relations:')
      ? 'characters'
      : (key.split(':')[1] as PublishableEntityType);
  };
  const recordEntries = (record: DraftOperation): ActionHistoryEntry[] => {
    const recovery = record.gameDataRecovery;
    if (recovery) return selectHistory(recovery.scope, recovery.source).matching;
    try {
      const entries = JSON.parse(record.fingerprint).entries;
      return actionHistorySchema.parse(entries) as ActionHistoryEntry[];
    } catch {
      return [];
    }
  };
  const relatedOperations = (scope: EditDraftScope) => {
    // Read newly created legacy records too; old callers can precede this session's first publish.
    for (const [key, record] of operations.list()) operationRecords.set(key, record);
    return [...operationRecords].filter(
      ([key, record]) =>
        recordDomain(key, record) === scopeEntityType(scope) &&
        (key === operationScope(scope, []) ||
          selectHistory(scope, recordEntries(record)).matching.length > 0 ||
          (record.gameDataRecovery && isEqual(record.gameDataRecovery.scope, scope)))
    );
  };
  const cancellationBlocks = (entityType: PublishableEntityType) =>
    [...operationRecords].some(
      ([key, record]) =>
        recordDomain(key, record) === entityType &&
        record.gameDataRecovery?.phase === 'cancelling' &&
        !appliedTargets.has(key)
    );

  const finishRecovery = (key: string, record: DraftOperation): boolean => {
    const recovery = record.gameDataRecovery;
    if (!recovery || recovery.phase === 'prepared') return true;
    const entityType = scopeEntityType(recovery.scope);
    const latest = history.read(entityType);
    try {
      let target = latest;
      if (!appliedTargets.has(key)) {
        const remaining =
          recovery.phase === 'cancelling'
            ? recovery.target
            : selectHistory(recovery.scope, recovery.source).remaining;
        // Compare the persisted representation: JSON omits undefined action fields.
        const before = reconcilePublishHistory(
          JSON.parse(JSON.stringify(recovery.source)),
          JSON.parse(JSON.stringify(remaining)),
          JSON.parse(JSON.stringify(latest))
        );
        const after =
          recovery.target === undefined
            ? null
            : reconcilePublishHistory(
                JSON.parse(JSON.stringify(recovery.target)),
                JSON.parse(JSON.stringify(recovery.target)),
                JSON.parse(JSON.stringify(latest))
              );
        if (recovery.target === undefined || pendingTargetWrites.has(key)) {
          if (before === null) throw new EditDraftPersistenceError('conflict');
          target = before;
        } else {
          if (before !== null && after !== null && !isEqual(before, after))
            throw new EditDraftPersistenceError('conflict');
          const resolved = before ?? after;
          if (!resolved) throw new EditDraftPersistenceError('conflict');
          target = resolved;
        }
        if (recovery.phase === 'acknowledged' && recovery.target === undefined) {
          writeOperation(key, { ...record, gameDataRecovery: { ...recovery, target } });
          pendingTargetWrites.add(key);
        }
        if (!history.replace(entityType, target)) return false;
        appliedTargets.add(key);
        if (recovery.phase === 'cancelling' && !restoring) {
          withRecordingSuppressed(() => {
            const root = mutableDomain(stores, entityType);
            const matching = selectHistory(recovery.scope, latest).matching;
            for (let index = matching.length - 1; index >= 0; index--)
              applyActionEntry(root, invertActionEntry(matching[index]!));
          });
        } else if (recovery.phase === 'acknowledged' && !restoring && entityType === 'characters') {
          const sent = readDraftRequestBody(recovery).entries.flat();
          withRecordingSuppressed(() => {
            for (const action of selectHistory(recovery.scope, recovery.source).matching.flat()) {
              if (
                isUnchangedCharacterRelationInitialization(action, baseline.characters) &&
                ![...sent, ...target.flat()].some((other) =>
                  areActionsOrderDependent(action, other)
                )
              ) {
                applyActionEntry(mutableDomain(stores, entityType), invertActionEntry(action));
              }
            }
          });
        }
      } else if (!save(entityType, latest)) return false;
      if (recovery.phase === 'cancelling') {
        for (const alias of recovery.associatedScopes) if (alias !== key) removeOperation(alias);
      }
      removeOperation(key);
      return true;
    } catch (error) {
      persistenceStates.set(
        entityType,
        error instanceof EditDraftPersistenceError && error.kind === 'conflict'
          ? 'conflict'
          : 'unsaved'
      );
      return false;
    }
  };

  const journal = {
    subscribe: (_scope: EditDraftScope | undefined, listener: () => void) => {
      assertActive();
      manualDraftListeners.add(listener);
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        manualDraftListeners.delete(listener);
      };
    },
    mutate: (entityType: PublishableEntityType, fn: () => void) => {
      assertActive();
      if (cancellationBlocks(entityType)) throw new EditDraftPersistenceError('cleanup-pending');
      mutationDepth += 1;
      try {
        fn();
      } finally {
        mutationDepth -= 1;
        if (mutationDepth === 0) flushRecording();
      }
    },
    hasUnsavedDrafts: () =>
      [...persistenceStates.values()].some((state) => state !== 'saved') ||
      [...operationRecords.values()].some(
        (record) => record.gameDataRecovery && record.gameDataRecovery.phase !== 'prepared'
      ),
    retryDraftPersistence: (
      scope?: EditDraftScope
    ): ReturnType<EditSession['retryDraftPersistence']> => {
      assertActive();
      const types = scope ? [scopeEntityType(scope)] : PUBLISHABLE_ENTITY_TYPES;
      const saved = types
        .map((entityType) => {
          const pending = [...operationRecords].filter(
            ([key, record]) =>
              recordDomain(key, record) === entityType &&
              record.gameDataRecovery &&
              record.gameDataRecovery.phase !== 'prepared'
          );
          if (pending.length > 0 && activePublishes.has(entityType)) return false;
          if (pending.some(([key, record]) => !finishRecovery(key, record))) return false;
          return save(entityType, history.read(entityType));
        })
        .every(Boolean);
      notifyDrafts();
      return saved
        ? { status: 'saved' }
        : { status: 'storage-failed', error: new EditDraftPersistenceError('unavailable') };
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
      if (activePublishes.has(entityType)) return { status: 'busy' };
      try {
        const associated = relatedOperations(scope);
        if (
          associated.some(
            ([, record]) => selectHistory(scope, recordEntries(record)).remaining.length > 0
          )
        ) {
          return { status: 'storage-failed', error: new PublishOperationConflictError() };
        }
        const priorCancellation = associated.find(
          ([, record]) => record.gameDataRecovery?.phase === 'cancelling'
        );
        if (priorCancellation) {
          const succeeded = finishRecovery(...priorCancellation);
          notifyDrafts();
          return succeeded
            ? { status: 'discarded' }
            : { status: 'storage-failed', error: new EditDraftCleanupError() };
        }
        const source = history.read(entityType);
        const { matching, remaining } = selectHistory(scope, source);
        if (associated.length > 0) {
          const [key, record] = associated[0]!;
          const cancellation: DraftOperation = {
            ...record,
            gameDataRecovery: {
              version: 1,
              phase: 'cancelling',
              scope,
              source,
              target: remaining,
              associatedScopes: associated.map(([alias]) => alias),
            },
          };
          writeOperation(key, cancellation);
          pendingTargetWrites.add(key);
          // This instance knows the history write has not happened yet.
          if (!history.replace(entityType, remaining)) {
            notifyDrafts();
            return { status: 'storage-failed', error: new EditDraftCleanupError() };
          }
          appliedTargets.add(key);
        } else if (!history.replace(entityType, remaining)) {
          notifyDrafts();
          return { status: 'storage-failed', error: new EditDraftCleanupError() };
        }
        withRecordingSuppressed(() => {
          const root = mutableDomain(stores, entityType);
          for (let index = matching.length - 1; index >= 0; index--)
            applyActionEntry(root, invertActionEntry(matching[index]!));
        });
        const succeeded =
          associated.length === 0 ||
          finishRecovery(associated[0]![0], operationRecords.get(associated[0]![0])!);
        invalidate();
        notifyDrafts();
        return succeeded
          ? { status: 'discarded' }
          : { status: 'storage-failed', error: new EditDraftCleanupError() };
      } catch (error) {
        persistenceStates.set(entityType, 'unsaved');
        notifyDrafts();
        return {
          status: 'storage-failed',
          error: error instanceof Error ? error : new EditDraftCleanupError(),
        };
      }
    },
    publishDraft: (
      scope: EditDraftScope,
      options: EditPublishOptions = {}
    ): ReturnType<EditSession['publishDraft']> => {
      assertActive();
      const entityType = scopeEntityType(scope);
      const signature = JSON.stringify({ scope, options, source: history.read(entityType) });
      const active = activePublishes.get(entityType);
      if (active)
        return active.signature === signature
          ? active.promise
          : Promise.resolve({ status: 'failed', error: new PublishOperationConflictError() });
      const promise = executePublish(scope, options)
        .catch((error: unknown) => ({
          status: 'failed' as const,
          error: error instanceof Error ? error : new Error('发布失败'),
        }))
        .finally(() => activePublishes.delete(entityType));
      activePublishes.set(entityType, { signature, promise });
      return promise;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      recordingSubscriptions.forEach((unsubscribe) => unsubscribe());
      manualDraftListeners.clear();
    },
  };
  const sendPrepared = async (
    key: string,
    record: DraftOperation
  ): ReturnType<EditSession['publishDraft']> => {
    const recovery = record.gameDataRecovery;
    if (!recovery || recovery.phase !== 'prepared') throw new PublishOperationConflictError();
    const entityType = scopeEntityType(recovery.scope);
    try {
      const result = await publish({
        endpoint: recovery.endpoint,
        operationId: record.operationId,
        body: recovery.body,
      });
      if (disposed)
        return { status: 'failed', error: new Error('编辑会话已结束，提交记录已保留。') };
      if (result.status === 'pending-conflict') {
        writeOperation(key, {
          ...record,
          gameDataRecovery: {
            ...recovery,
            acknowledgementToken: result.conflict.pendingAcknowledgementToken,
          },
        });
        return result;
      }
      const acknowledged: DraftOperation = {
        ...record,
        gameDataRecovery: {
          version: 1,
          phase: 'acknowledged',
          scope: recovery.scope,
          source: recovery.source,
          endpoint: recovery.endpoint,
          body: recovery.body,
          outcome: result.outcome,
        },
      };
      let completed = false;
      try {
        writeOperation(key, acknowledged);
        completed = finishRecovery(key, acknowledged);
      } catch {
        persistenceStates.set(entityType, 'unsaved');
      }
      notifyDrafts();
      return completed
        ? result
        : {
            status: 'cleanup-conflict',
            outcome: result.outcome,
            reason:
              persistenceStates.get(entityType) === 'conflict'
                ? 'history-diverged'
                : 'storage-failed',
          };
    } catch (error) {
      if (!disposed && error instanceof RejectedGameDataEditSubmissionError) {
        try {
          removeOperation(key);
        } catch (cleanupError) {
          persistenceStates.set(entityType, 'unsaved');
          notifyDrafts();
          return {
            status: 'failed',
            error: cleanupError instanceof Error ? cleanupError : new EditDraftCleanupError(),
          };
        }
      }
      return { status: 'failed', error: error instanceof Error ? error : new Error('发布失败') };
    }
  };
  const executePublish = async (
    scope: EditDraftScope,
    options: EditPublishOptions = {}
  ): ReturnType<EditSession['publishDraft']> => {
    assertActive();
    const entityType = scopeEntityType(scope);
    const associated = relatedOperations(scope);
    if (associated.length > 1 || cancellationBlocks(entityType))
      return { status: 'failed', error: new PublishOperationConflictError() };
    const recovered = associated[0];
    if (recovered?.[1].gameDataRecovery?.phase === 'acknowledged') {
      const recovery = recovered[1].gameDataRecovery;
      const completed = finishRecovery(...recovered);
      notifyDrafts();
      return completed
        ? { status: 'published', outcome: recovery.outcome }
        : {
            status: 'cleanup-conflict',
            outcome: recovery.outcome,
            reason:
              persistenceStates.get(entityType) === 'conflict'
                ? 'history-diverged'
                : 'storage-failed',
          };
    }
    const source = history.read(entityType);
    if (!save(entityType, source)) {
      notifyDrafts();
      return {
        status: 'failed',
        error: new EditDraftPersistenceError(
          persistenceStates.get(entityType) === 'conflict' ? 'conflict' : 'unavailable'
        ),
      };
    }
    if (recovered?.[1].gameDataRecovery?.phase === 'prepared') {
      const [key, record] = recovered;
      const recovery = record.gameDataRecovery as Extract<DraftRecovery, { phase: 'prepared' }>;
      const body = readDraftRequestBody(recovery);
      if (
        JSON.stringify(selectHistory(scope, source).matching) !==
          JSON.stringify(selectHistory(recovery.scope, recovery.source).matching) ||
        JSON.stringify(selectHistory(recovery.scope, source).matching) !==
          JSON.stringify(selectHistory(recovery.scope, recovery.source).matching) ||
        (options.message !== undefined && options.message !== body.message) ||
        (options.submitMode !== undefined && options.submitMode !== (body.submitMode ?? 'default'))
      )
        return { status: 'failed', error: new PublishOperationConflictError() };
      let prepared = record;
      if (
        options.pendingAcknowledgementToken !== undefined &&
        options.pendingAcknowledgementToken !== body.pendingAcknowledgementToken
      ) {
        if (options.pendingAcknowledgementToken !== recovery.acknowledgementToken)
          return { status: 'failed', error: new PublishOperationConflictError() };
        prepared = {
          ...record,
          gameDataRecovery: {
            ...recovery,
            body: JSON.stringify({
              ...JSON.parse(recovery.body),
              pendingAcknowledgementToken: options.pendingAcknowledgementToken,
            }),
          },
        };
        writeOperation(key, prepared);
      }
      return sendPrepared(key, prepared);
    }
    const { matching, remaining } = selectHistory(scope, source);
    const squashed = squashActions(matching, { currentRoot: mutableDomain(stores, entityType) });
    const legacySquashed = squashActions(matching, {
      currentRoot: mutableDomain(stores, entityType),
      preserveLegacyCreations: true,
    });
    const legacyScope = operationScope(scope, legacySquashed);
    const originalScope =
      recovered?.[0] ??
      (operations.read(legacyScope) ? legacyScope : operationScope(scope, squashed));
    const existingOperation = recovered?.[1] ?? operations.read(originalScope);
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
            (operationScope(scope, entries).startsWith('relations:pair:') &&
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
      withRecordingSuppressed(() => {
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

    if (existingOperation && existingOperation.fingerprint !== fingerprintForEndpoint(endpoint)) {
      if (!operationScope(scope, entries).startsWith('relations:pair:'))
        return { status: 'failed', error: new PublishOperationConflictError() };
      endpoint =
        endpoint === '/api/game-data-actions/publish'
          ? '/api/game-data-actions/publish-relations'
          : '/api/game-data-actions/publish';
      if (existingOperation.fingerprint !== fingerprintForEndpoint(endpoint))
        return { status: 'failed', error: new PublishOperationConflictError() };
    }
    const body: DraftRequestBody = {
      ...(endpoint === '/api/game-data-actions/publish-relations' ? {} : { entityType }),
      entries,
      ...(options.message === undefined ? {} : { message: options.message }),
      ...(options.pendingAcknowledgementToken === undefined
        ? {}
        : { pendingAcknowledgementToken: options.pendingAcknowledgementToken }),
      ...(options.submitMode === undefined ? {} : { submitMode: options.submitMode }),
    };
    const record: DraftOperation = {
      operationId: existingOperation?.operationId ?? crypto.randomUUID(),
      fingerprint: existingOperation?.fingerprint ?? fingerprintForEndpoint(endpoint),
      gameDataRecovery: {
        version: 1,
        phase: 'prepared',
        scope,
        source,
        endpoint,
        body: JSON.stringify(body),
      },
    };
    writeOperation(publishScope, record);
    return sendPrepared(publishScope, record);
  };

  const flushRecording = () => {
    if (pendingActions.size === 0) return;
    for (const [entityType, actions] of pendingActions) {
      const entries =
        entityType === 'characters'
          ? normalizeCharacterRelationPairHistory([actions])
          : [actions.length === 1 ? actions[0]! : actions];
      const updated = normalizeActionHistory([...(histories.get(entityType) ?? []), ...entries]);
      histories.set(entityType, updated);
      save(entityType, updated);
    }
    pendingActions.clear();
    notifyDrafts();
  };
  try {
    const errors: unknown[] = [];
    for (const [key, record] of operations.list()) operationRecords.set(key, record);
    for (const entityType of PUBLISHABLE_ENTITY_TYPES)
      histories.set(entityType, structuredClone(persistence.read(entityType)));
    const recoveries = [...operationRecords].sort(
      ([, a], [, b]) =>
        Number(b.gameDataRecovery?.phase === 'cancelling') -
        Number(a.gameDataRecovery?.phase === 'cancelling')
    );
    const fencedKeys = new Set(
      recoveries.flatMap(([, record]) =>
        record.gameDataRecovery?.phase === 'cancelling'
          ? record.gameDataRecovery.associatedScopes
          : []
      )
    );
    for (const [key, record] of recoveries) {
      if (!operationRecords.has(key)) continue;
      if (record.gameDataRecovery?.phase === 'cancelling' || !fencedKeys.has(key))
        finishRecovery(key, record);
    }
    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      try {
        const entity = mutableDomain(stores, entityType);
        const stored = history.read(entityType);
        const unresolved = [...operationRecords].some(
          ([key, record]) => recordDomain(key, record) === entityType
        );
        const normalized =
          entityType === 'characters' && !unresolved
            ? normalizeCharacterRelationPairHistory(stored)
            : stored;
        const restored =
          entityType === 'characters' && !unresolved
            ? migrateLegacyCharacterRelationDrafts(normalized, entity)
            : normalized;
        if (!isEqual(restored, stored) && !history.replace(entityType, restored))
          throw new EditDraftPersistenceError('unavailable');
        if (restored.length > DRAFT_HISTORY_WARNING_THRESHOLD)
          console.warn('Large edit mode draft history detected', {
            entityType,
            entries: restored.length,
            threshold: DRAFT_HISTORY_WARNING_THRESHOLD,
          });
        restored.forEach((entry) => applyActionEntry(entity, entry));
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) throw new EditDraftRestoreError(errors);
    PUBLISHABLE_ENTITY_TYPES.forEach((entityType) => {
      recordingSubscriptions.push(
        subscribe(
          stores[entityType],
          (ops) => {
            if (recordingSuppressed || disposed) return;
            const actions = actionsFromValtioOps(ops);
            if (actions.length === 0) return;
            const cloned = cloneGameDataValue(actions);
            if (!cloned.success) throw new EditDraftPersistenceError('invalid');
            pendingActions.set(entityType, [
              ...(pendingActions.get(entityType) ?? []),
              ...(cloned.value as Action[]),
            ]);
            if (mutationDepth === 0) flushRecording();
          },
          true
        )
      );
    });
    restoring = false;
    return journal;
  } catch (error) {
    recordingSubscriptions.forEach((unsubscribe) => unsubscribe());
    manualDraftListeners.clear();
    disposed = true;
    throw error instanceof EditDraftRestoreError ? error : new EditDraftRestoreError([error]);
  }
}
