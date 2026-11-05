import { z } from 'zod';

import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import {
  getPublishOperationStorageKey,
  isPublishOperationId,
  PUBLISH_OPERATION_STORAGE_PREFIX,
} from '@/lib/gameData/publishOperation';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';
import { actionHistorySchema } from '@/lib/validation/schemas';

import { normalizeActionHistory, type ActionHistoryEntry } from './diffUtils';
import type { EditDraftScope } from './editSession';

const entityTypeSchema = z.enum(PUBLISHABLE_ENTITY_TYPES);
const historySchema = actionHistorySchema as z.ZodType<ActionHistoryEntry[]>;
const scopeSchema: z.ZodType<EditDraftScope> = z.union([
  z.object({ kind: z.literal('character-relations') }).strict(),
  z.object({ kind: z.literal('domain'), entityType: entityTypeSchema }).strict(),
  z
    .object({
      kind: z.literal('entity'),
      entity: z.union([
        z
          .object({
            entityType: entityTypeSchema.exclude(['achievements', 'specialSkills']),
            entityId: z.string().min(1),
          })
          .strict(),
        z
          .object({
            entityType: z.enum(['achievements', 'specialSkills']),
            entityId: z.string().min(1),
            factionId: z.enum(['cat', 'mouse']),
          })
          .strict(),
      ]),
    })
    .strict(),
]);

const requestBodySchema = z
  .object({
    entityType: entityTypeSchema.optional(),
    entries: historySchema.refine((entries) => entries.flat().length > 0),
    message: z.string().optional(),
    pendingAcknowledgementToken: z.string().optional(),
    submitMode: z.enum(['default', 'force_public_pending', 'force_pending']).optional(),
  })
  .strict();

export type DraftRequestBody = z.infer<typeof requestBodySchema>;
const requestFields = {
  version: z.literal(1),
  scope: scopeSchema,
  source: historySchema,
  endpoint: z.enum(['/api/game-data-actions/publish', '/api/game-data-actions/publish-relations']),
  body: z.string().refine((body) => {
    try {
      return requestBodySchema.safeParse(JSON.parse(body)).success;
    } catch {
      return false;
    }
  }),
};

const recoverySchema = z.discriminatedUnion('phase', [
  z
    .object({
      ...requestFields,
      phase: z.literal('prepared'),
      acknowledgementToken: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ...requestFields,
      phase: z.literal('acknowledged'),
      outcome: z.enum(['pending', 'public_pending', 'approved']),
      target: historySchema.optional(),
    })
    .strict(),
  z
    .object({
      version: z.literal(1),
      phase: z.literal('cancelling'),
      scope: scopeSchema,
      source: historySchema,
      target: historySchema,
      associatedScopes: z.array(z.string().min(1)).min(1),
    })
    .strict(),
]);

export type DraftRecovery = z.infer<typeof recoverySchema>;
export type DraftOperation = {
  fingerprint: string;
  operationId: string;
  gameDataRecovery?: DraftRecovery;
};

const operationSchema = z
  .object({
    fingerprint: z.string(),
    operationId: z.string().refine(isPublishOperationId),
    gameDataRecovery: recoverySchema.optional(),
  })
  .passthrough()
  .superRefine((operation, context) => {
    const recovery = operation.gameDataRecovery;
    if (!recovery) return;
    if (recovery.phase === 'cancelling') {
      if (recovery.associatedScopes.some((scope) => !isGameDataOperationScope(scope)))
        context.addIssue({ code: 'custom', message: 'Invalid cancellation scope' });
      return;
    }
    let body: unknown;
    try {
      body = JSON.parse(recovery.body);
    } catch {
      return;
    }
    const parsed = requestBodySchema.safeParse(body);
    if (!parsed.success) return;
    const entityType =
      recovery.scope.kind === 'character-relations'
        ? 'characters'
        : recovery.scope.kind === 'domain'
          ? recovery.scope.entityType
          : recovery.scope.entity.entityType;
    if (
      recovery.endpoint === '/api/game-data-actions/publish-relations'
        ? entityType !== 'characters' || parsed.data.entityType !== undefined
        : parsed.data.entityType !== entityType
    )
      context.addIssue({ code: 'custom', message: 'Request scope does not match its endpoint' });
  });

function isGameDataOperationScope(scope: string): boolean {
  return (
    scope === 'relations:characters' ||
    scope.startsWith('relations:pair:') ||
    (scope.startsWith('page:') &&
      PUBLISHABLE_ENTITY_TYPES.some((type) => scope.startsWith(`page:${type}:`)))
  );
}

function validateOperation(scope: string, value: unknown): asserts value is DraftOperation {
  if (!operationSchema.safeParse(value).success) throw new EditDraftPersistenceError('invalid');
  const recovery = (value as DraftOperation).gameDataRecovery;
  if (!recovery) return;
  const entityType =
    recovery.scope.kind === 'character-relations'
      ? 'characters'
      : recovery.scope.kind === 'domain'
        ? recovery.scope.entityType
        : recovery.scope.entity.entityType;
  const sameDomain = (key: string) =>
    key.startsWith(`page:${entityType}:`) ||
    (entityType === 'characters' &&
      (key === 'relations:characters' || key.startsWith('relations:pair:')));
  if (
    !sameDomain(scope) ||
    (recovery.phase === 'cancelling' &&
      (!recovery.associatedScopes.includes(scope) ||
        recovery.associatedScopes.some((key) => !sameDomain(key))))
  )
    throw new EditDraftPersistenceError('invalid');
}

export function readDraftRequestBody(
  recovery: Exclude<DraftRecovery, { phase: 'cancelling' }>
): DraftRequestBody {
  return requestBodySchema.parse(JSON.parse(recovery.body));
}

/** Strict game-data writes leave the shared best-effort article adapter unchanged. */
export function createBrowserDraftOperationStore() {
  const durable = new Map<string, string | null>();
  const access = <T>(fn: (storage: Storage) => T): T => {
    try {
      return fn(window.sessionStorage);
    } catch (error) {
      if (error instanceof EditDraftPersistenceError) throw error;
      throw new EditDraftPersistenceError('unavailable');
    }
  };
  const read = (scope: string): DraftOperation | null =>
    access((storage) => {
      const raw = storage.getItem(getPublishOperationStorageKey(scope));
      if (raw === null) {
        durable.set(scope, null);
        return null;
      }
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        throw new EditDraftPersistenceError('invalid');
      }
      validateOperation(scope, value);
      durable.set(scope, raw);
      return value;
    });
  const replace = (scope: string, value: DraftOperation | null): void => {
    if (!isGameDataOperationScope(scope)) throw new EditDraftPersistenceError('invalid');
    if (value) validateOperation(scope, value);
    if (!durable.has(scope)) read(scope);
    access((storage) => {
      const key = getPublishOperationStorageKey(scope);
      if (storage.getItem(key) !== durable.get(scope))
        throw new EditDraftPersistenceError('conflict');
      const raw = value === null ? null : JSON.stringify(value);
      if (raw === null) storage.removeItem(key);
      else storage.setItem(key, raw);
      if (storage.getItem(key) !== raw) throw new EditDraftPersistenceError('unavailable');
      durable.set(scope, raw);
    });
  };
  return {
    read,
    write: (scope: string, value: DraftOperation) => replace(scope, value),
    remove: (scope: string) => replace(scope, null),
    list: (): Array<[string, DraftOperation]> =>
      access((storage) => {
        const records: Array<[string, DraftOperation]> = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index)!;
          if (!key.startsWith(PUBLISH_OPERATION_STORAGE_PREFIX)) continue;
          let scope: string;
          try {
            scope = decodeURIComponent(key.slice(PUBLISH_OPERATION_STORAGE_PREFIX.length));
          } catch {
            continue;
          }
          if (!isGameDataOperationScope(scope)) continue;
          const operation = read(scope);
          if (operation) records.push([scope, operation]);
        }
        return records;
      }),
  };
}

export class EditDraftPersistenceError extends Error {
  constructor(readonly kind: 'unavailable' | 'invalid' | 'conflict') {
    super(
      kind === 'conflict'
        ? '其他页面已修改本地草稿，请保留当前内容后重新进入编辑模式。'
        : kind === 'invalid'
          ? '本地草稿格式异常，已保留原始记录，请先恢复草稿。'
          : '本地草稿保存失败，刷新或离开可能丢失修改，请重试保存。'
    );
    this.name = 'EditDraftPersistenceError';
  }
}

export type EditHistoryStore = Readonly<{
  read: (entityType: PublishableEntityType) => ActionHistoryEntry[];
  append: (entityType: PublishableEntityType, entry: ActionHistoryEntry) => void;
  replace: (entityType: PublishableEntityType, history: ActionHistoryEntry[]) => boolean;
}>;

export function createBrowserEditHistoryStore(): EditHistoryStore {
  const durable = new Map<PublishableEntityType, string | null>();
  const store: EditHistoryStore = {
    read: (entityType) => {
      let raw: string | null;
      try {
        raw = window.localStorage.getItem(getEditModeActionsStorageKey(entityType));
      } catch {
        throw new EditDraftPersistenceError('unavailable');
      }
      let history: ActionHistoryEntry[];
      try {
        history = actionHistorySchema.parse(
          raw === null ? [] : JSON.parse(raw)
        ) as ActionHistoryEntry[];
      } catch {
        throw new EditDraftPersistenceError('invalid');
      }
      durable.set(entityType, raw);
      return normalizeActionHistory(history);
    },
    append: (entityType, entry) => {
      store.replace(entityType, [...store.read(entityType), entry]);
    },
    replace: (entityType, history) => {
      const key = getEditModeActionsStorageKey(entityType);
      try {
        const storage = window.localStorage;
        if (storage.getItem(key) !== durable.get(entityType)) {
          throw new EditDraftPersistenceError('conflict');
        }
        const raw = history.length > 0 ? JSON.stringify(history) : null;
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
        if (storage.getItem(key) !== raw) throw new EditDraftPersistenceError('unavailable');
        durable.set(entityType, raw);
        return true;
      } catch (error) {
        if (error instanceof EditDraftPersistenceError) throw error;
        throw new EditDraftPersistenceError('unavailable');
      }
    },
  };
  return store;
}
