import 'server-only';

import type { Action } from '@/lib/edit/diffUtils';

import { groupActionEntriesByDependency } from './actionDependencies';
import {
  decodeActionRowEntry,
  type ActionDecodeError,
  type CanonicalActionRowEntry,
} from './actionRowDecoder';
import { isPublishableEntityType, type PublishableEntityType } from './publishableEntityTypes';
import { PUBLISH_LIMITS } from './publishLimits';

export type PublishPreparationErrorCode =
  | 'invalid_json'
  | 'invalid_shape'
  | 'request_too_large'
  | 'unknown_entity_type'
  | 'too_many_entries'
  | 'too_many_actions'
  | 'too_many_actions_per_row'
  | 'path_too_long'
  | 'message_too_long'
  | 'dependent_rows'
  | ActionDecodeError['code'];

export type PublishDependencyDiagnostic = {
  rowIndexes: readonly number[];
  rows: readonly {
    rowIndex: number;
    actions: readonly {
      op: Action['op'];
      path: string;
    }[];
    omittedActionCount: number;
  }[];
  omittedRowCount: number;
};

type PublishPreparationErrorDetails = {
  code: PublishPreparationErrorCode;
  entityType?: string;
  entryIndex?: number;
  dependencyGroups?: readonly PublishDependencyDiagnostic[];
  omittedDependencyGroupCount?: number;
};

export class PublishPreparationError extends Error {
  readonly detail: PublishPreparationErrorDetails;

  constructor(
    code: PublishPreparationErrorCode,
    details: Omit<PublishPreparationErrorDetails, 'code'> = {}
  ) {
    super(code);
    this.name = 'PublishPreparationError';
    this.detail = Object.freeze({ code, ...details });
  }
}

const MAX_DIAGNOSTIC_GROUPS = 4;
const MAX_DIAGNOSTIC_ROWS_PER_GROUP = 8;
const MAX_DIAGNOSTIC_ACTIONS_PER_ROW = 8;

function buildDependencyDiagnostics(
  rows: readonly PreparedPublishRow[],
  groups: readonly number[][]
): {
  dependencyGroups: readonly PublishDependencyDiagnostic[];
  omittedDependencyGroupCount: number;
} {
  const dependentGroups = groups.filter((group) => group.length > 1);
  const dependencyGroups = dependentGroups.slice(0, MAX_DIAGNOSTIC_GROUPS).map((group) => {
    const includedRowIndexes = group.slice(0, MAX_DIAGNOSTIC_ROWS_PER_GROUP);
    return Object.freeze({
      rowIndexes: Object.freeze([...includedRowIndexes]),
      rows: Object.freeze(
        includedRowIndexes.map((rowIndex) => {
          const actions = rows[rowIndex]?.actions ?? [];
          return Object.freeze({
            rowIndex,
            actions: Object.freeze(
              actions.slice(0, MAX_DIAGNOSTIC_ACTIONS_PER_ROW).map((action) =>
                Object.freeze({
                  op: action.op,
                  path: action.path,
                })
              )
            ),
            omittedActionCount: Math.max(0, actions.length - MAX_DIAGNOSTIC_ACTIONS_PER_ROW),
          });
        })
      ),
      omittedRowCount: Math.max(0, group.length - MAX_DIAGNOSTIC_ROWS_PER_GROUP),
    });
  });

  return {
    dependencyGroups: Object.freeze(dependencyGroups),
    omittedDependencyGroupCount: Math.max(0, dependentGroups.length - MAX_DIAGNOSTIC_GROUPS),
  };
}

export type UntrustedPublishActionItem = {
  entityType: unknown;
  entries: unknown;
};

export type PreparedPublishRow = {
  canonicalEntry: CanonicalActionRowEntry;
  actions: readonly Readonly<Action>[];
};

export type PreparedPublishActionItem = {
  entityType: PublishableEntityType;
  rows: readonly PreparedPublishRow[];
};

export type PreparedPublishRequest = {
  actions: readonly PreparedPublishActionItem[];
  message?: string;
};

export async function readBoundedJsonBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > PUBLISH_LIMITS.requestBytes) {
    throw new PublishPreparationError('request_too_large');
  }
  if (request.body === null) throw new PublishPreparationError('invalid_json');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > PUBLISH_LIMITS.requestBytes) {
      await reader.cancel();
      throw new PublishPreparationError('request_too_large');
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)) as unknown;
  } catch {
    throw new PublishPreparationError('invalid_json');
  }
}

function prepareMessage(message: unknown): string | undefined {
  if (message === undefined) return undefined;
  if (typeof message !== 'string') throw new PublishPreparationError('invalid_shape');
  const trimmed = message.trim();
  if (trimmed.length > PUBLISH_LIMITS.messageCharacters) {
    throw new PublishPreparationError('message_too_long');
  }
  return trimmed || undefined;
}

export function preparePublishActionItems(
  items: readonly UntrustedPublishActionItem[],
  message?: unknown
): PreparedPublishRequest {
  if (!Array.isArray(items) || items.length === 0) {
    throw new PublishPreparationError('invalid_shape');
  }

  let topLevelEntryCount = 0;
  for (const item of items) {
    if (!Array.isArray(item.entries) || item.entries.length === 0) {
      throw new PublishPreparationError('invalid_shape');
    }
    topLevelEntryCount += item.entries.length;
    if (topLevelEntryCount > PUBLISH_LIMITS.topLevelEntries) {
      throw new PublishPreparationError('too_many_entries');
    }
  }

  let flattenedActionCount = 0;
  const rowsByEntityType = new Map<PublishableEntityType, PreparedPublishRow[]>();
  for (const item of items) {
    const rawEntityType = typeof item.entityType === 'string' ? item.entityType.trim() : '';
    if (!isPublishableEntityType(rawEntityType)) {
      throw new PublishPreparationError('unknown_entity_type', { entityType: rawEntityType });
    }

    const rows = rowsByEntityType.get(rawEntityType) ?? [];
    for (const [entryIndex, entry] of (item.entries as unknown[]).entries()) {
      const decoded = decodeActionRowEntry(entry);
      if (!decoded.success) {
        throw new PublishPreparationError(decoded.error.code, {
          entityType: rawEntityType,
          entryIndex,
        });
      }
      if (decoded.value.actions.length > PUBLISH_LIMITS.actionsPerRow) {
        throw new PublishPreparationError('too_many_actions_per_row', {
          entityType: rawEntityType,
          entryIndex,
        });
      }
      flattenedActionCount += decoded.value.actions.length;
      if (flattenedActionCount > PUBLISH_LIMITS.flattenedActions) {
        throw new PublishPreparationError('too_many_actions');
      }
      if (
        decoded.value.actions.some((action) => action.path.length > PUBLISH_LIMITS.pathCharacters)
      ) {
        throw new PublishPreparationError('path_too_long', {
          entityType: rawEntityType,
          entryIndex,
        });
      }
      rows.push({
        canonicalEntry: decoded.value.canonicalEntry,
        actions: decoded.value.actions,
      });
    }

    rowsByEntityType.set(rawEntityType, rows);
  }

  const preparedActions: PreparedPublishActionItem[] = [];
  for (const [entityType, rows] of rowsByEntityType) {
    const dependencyGroups = groupActionEntriesByDependency(
      rows.map((row) => row.actions.map((action) => ({ ...action })))
    );
    if (dependencyGroups.some((group) => group.length > 1)) {
      throw new PublishPreparationError('dependent_rows', {
        entityType,
        ...buildDependencyDiagnostics(rows, dependencyGroups),
      });
    }
    preparedActions.push({ entityType, rows: Object.freeze(rows) });
  }

  const preparedMessage = prepareMessage(message);
  return Object.freeze({
    actions: Object.freeze(preparedActions),
    ...(preparedMessage === undefined ? {} : { message: preparedMessage }),
  });
}
