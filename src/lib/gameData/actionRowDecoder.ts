import type { Action } from '@/lib/edit/diffUtils';

import type { ActionDecodeErrorCode } from './actionErrors';
import type { PublicActionRow } from './publicActionsTypes';

const ACTION_FIELDS = new Set(['op', 'path', 'oldValue', 'newValue']);
const ACTION_OPERATIONS = new Set<Action['op']>(['set', 'add', 'delete']);

type DecoderMode = 'publish' | 'stored';

export type CanonicalAction = {
  op: Action['op'];
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
};

export type CanonicalActionRowEntry = CanonicalAction | readonly CanonicalAction[];

export type ActionDecodeError = {
  code: ActionDecodeErrorCode;
  message: string;
  rowId?: string;
  actionIndex?: number;
  field?: string;
};

export type ActionDecodeResult<T> =
  { success: true; value: T } | { success: false; error: ActionDecodeError };

export type DecodedActionRowEntry = {
  actions: readonly Readonly<Action>[];
  canonicalEntry: CanonicalActionRowEntry;
};

export type DecodedStoredActionRow = {
  rowId: string;
  rawEntry: unknown;
  actions: readonly Readonly<Action>[];
};

type DecodeContext = {
  mode: DecoderMode;
  rowId?: string;
};

type ParsedAction = {
  action: Action;
  canonicalAction: CanonicalAction;
};

type FlattenedCandidates = {
  candidates: unknown[];
  preserveSingleShape: boolean;
};

type CloneResult = { success: true; value: unknown } | { success: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;

  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value);
}

function createError(
  context: DecodeContext,
  code: ActionDecodeErrorCode,
  message: string,
  details: { actionIndex?: number; field?: string } = {}
): ActionDecodeResult<never> {
  return {
    success: false,
    error: Object.freeze({
      code,
      message,
      ...(context.rowId === undefined ? {} : { rowId: context.rowId }),
      ...(details.actionIndex === undefined ? {} : { actionIndex: details.actionIndex }),
      ...(details.field === undefined ? {} : { field: details.field }),
    }),
  };
}

function cloneSupportedValue(value: unknown, ancestors = new WeakSet<object>()): CloneResult {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return { success: true, value };
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { success: true, value } : { success: false };
  }
  if (typeof value !== 'object' || ancestors.has(value)) return { success: false };

  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return { success: false };
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const item of value) {
      const cloned = cloneSupportedValue(item, ancestors);
      if (!cloned.success) return cloned;
      result.push(cloned.value);
    }
    ancestors.delete(value);
    return { success: true, value: result };
  }

  const result: Record<string, unknown> = Object.create(prototype);
  for (const [key, item] of Object.entries(value)) {
    const cloned = cloneSupportedValue(item, ancestors);
    if (!cloned.success) return cloned;
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: cloned.value,
      writable: true,
    });
  }
  ancestors.delete(value);
  return { success: true, value: result };
}

function cloneInput(rawEntry: unknown, context: DecodeContext): ActionDecodeResult<unknown> {
  const cloned = cloneSupportedValue(rawEntry);
  if (!cloned.success) {
    return createError(context, 'clone_failed', 'Action row entry could not be copied');
  }
  return cloned;
}

function flattenCandidates(
  rawEntry: unknown,
  context: DecodeContext
): ActionDecodeResult<FlattenedCandidates> {
  if (isRecord(rawEntry)) {
    return {
      success: true,
      value: { candidates: [rawEntry], preserveSingleShape: true },
    };
  }

  if (!Array.isArray(rawEntry)) {
    return createError(context, 'invalid_shape', 'Action row must be an action or an action array');
  }

  if (rawEntry.length === 0) {
    return createError(context, 'empty_row', 'Action row must contain at least one action');
  }

  const candidates: unknown[] = [];
  for (const item of rawEntry) {
    if (!Array.isArray(item)) {
      candidates.push(item);
      continue;
    }

    if (item.length === 0) {
      return createError(context, 'invalid_shape', 'Nested action arrays must not be empty', {
        actionIndex: candidates.length,
      });
    }

    for (const child of item) {
      if (Array.isArray(child)) {
        return createError(
          context,
          'invalid_shape',
          'Action rows support only one nested array level',
          {
            actionIndex: candidates.length,
          }
        );
      }
      candidates.push(child);
    }
  }

  return {
    success: true,
    value: { candidates, preserveSingleShape: false },
  };
}

function isJsonCompatible(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || seen.has(value)) return false;

  seen.add(value);
  if (Array.isArray(value)) {
    return value.every((item) => item !== undefined && isJsonCompatible(item, seen));
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;

  return Object.values(value).every((item) => item !== undefined && isJsonCompatible(item, seen));
}

function parseAction(
  candidate: unknown,
  actionIndex: number,
  context: DecodeContext
): ActionDecodeResult<ParsedAction> {
  if (!isRecord(candidate)) {
    return createError(context, 'invalid_shape', 'Action must be an object', { actionIndex });
  }

  if (context.mode === 'publish') {
    const unknownField = Object.keys(candidate).find((key) => !ACTION_FIELDS.has(key));
    if (unknownField !== undefined) {
      return createError(context, 'unknown_field', `Unknown action field: ${unknownField}`, {
        actionIndex,
        field: unknownField,
      });
    }
  }

  const operation = candidate.op;
  if (typeof operation !== 'string' || !ACTION_OPERATIONS.has(operation as Action['op'])) {
    return createError(context, 'invalid_shape', 'Action operation is invalid', {
      actionIndex,
      field: 'op',
    });
  }

  if (typeof candidate.path !== 'string') {
    return createError(context, 'invalid_path', 'Action path must be a string', {
      actionIndex,
      field: 'path',
    });
  }

  const path = candidate.path.trim();
  if (path.length === 0 || path.split('.').some((segment) => segment.trim().length === 0)) {
    return createError(context, 'invalid_path', 'Action path contains an empty segment', {
      actionIndex,
      field: 'path',
    });
  }

  const op = operation as Action['op'];
  const hasDefinedNewValue = hasOwn(candidate, 'newValue') && candidate.newValue !== undefined;
  if (op === 'add' && !hasDefinedNewValue) {
    return createError(context, 'missing_new_value', 'Add actions require newValue', {
      actionIndex,
      field: 'newValue',
    });
  }
  if (context.mode === 'publish' && op === 'set' && !hasDefinedNewValue) {
    return createError(
      context,
      'missing_new_value',
      'Published set actions require newValue; use delete explicitly',
      { actionIndex, field: 'newValue' }
    );
  }

  for (const field of ['oldValue', 'newValue'] as const) {
    const value = candidate[field];
    if (value !== undefined && !isJsonCompatible(value)) {
      return createError(context, 'invalid_shape', `${field} must be JSON-compatible`, {
        actionIndex,
        field,
      });
    }
  }

  const oldValue = hasOwn(candidate, 'oldValue') ? candidate.oldValue : undefined;
  const newValue = hasOwn(candidate, 'newValue') ? candidate.newValue : undefined;
  const action: Action = { op, path, oldValue, newValue };
  const canonicalAction: CanonicalAction = {
    op,
    path,
    ...(oldValue === undefined ? {} : { oldValue }),
    ...(newValue === undefined ? {} : { newValue }),
  };

  return { success: true, value: { action, canonicalAction } };
}

function decodeRow(
  rawEntry: unknown,
  context: DecodeContext
): ActionDecodeResult<{
  actions: readonly Readonly<Action>[];
  canonicalActions: readonly CanonicalAction[];
  preserveSingleShape: boolean;
}> {
  const cloned = cloneInput(rawEntry, context);
  if (!cloned.success) return cloned;

  const flattened = flattenCandidates(cloned.value, context);
  if (!flattened.success) return flattened;

  const actions: Action[] = [];
  const canonicalActions: CanonicalAction[] = [];
  for (const [actionIndex, candidate] of flattened.value.candidates.entries()) {
    const parsed = parseAction(candidate, actionIndex, context);
    if (!parsed.success) return parsed;
    actions.push(parsed.value.action);
    canonicalActions.push(parsed.value.canonicalAction);
  }

  return {
    success: true,
    value: Object.freeze({
      actions: freezeDeep(actions),
      canonicalActions: freezeDeep(canonicalActions),
      preserveSingleShape: flattened.value.preserveSingleShape,
    }),
  };
}

export function decodeActionRowEntry(rawEntry: unknown): ActionDecodeResult<DecodedActionRowEntry> {
  const decoded = decodeRow(rawEntry, { mode: 'publish' });
  if (!decoded.success) return decoded;

  const canonicalEntry = decoded.value.preserveSingleShape
    ? decoded.value.canonicalActions[0]!
    : decoded.value.canonicalActions;

  return {
    success: true,
    value: Object.freeze({
      actions: decoded.value.actions,
      canonicalEntry,
    }),
  };
}

export function decodeStoredActionRow(
  row: Pick<PublicActionRow, 'id' | 'entry'>
): ActionDecodeResult<DecodedStoredActionRow> {
  const rawEntry = cloneInput(row.entry, { mode: 'stored', rowId: row.id });
  if (!rawEntry.success) return rawEntry;

  const decoded = decodeRow(rawEntry.value, { mode: 'stored', rowId: row.id });
  if (!decoded.success) return decoded;

  return {
    success: true,
    value: Object.freeze({
      rowId: row.id,
      rawEntry: freezeDeep(rawEntry.value),
      actions: decoded.value.actions,
    }),
  };
}
