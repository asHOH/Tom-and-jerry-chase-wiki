import type { Action } from '@/lib/edit/diffUtils';

import type { ActionProcessingErrorCode } from './actionErrors';
import {
  parseActionPath,
  resolveArraySegment,
  shouldCreateArrayForSegment,
  type ActionPathError,
  type ParsedActionPath,
} from './actionPath';
import { cloneGameDataValue } from './cloneGameDataValue';

type Container = Record<string, unknown> | unknown[];
type ContainerKey = string | number;

export type CheckedActionErrorCode = Extract<
  ActionProcessingErrorCode,
  | 'invalid_path'
  | 'invalid_array_index'
  | 'missing_new_value'
  | 'missing_path'
  | 'invalid_array_length'
  | 'clone_failed'
  | 'apply_failed'
>;

export type CheckedActionError = {
  code: CheckedActionErrorCode;
  message: string;
  operation: Action['op'];
  path: string;
  segment?: string;
  segmentIndex?: number;
  cause?: unknown;
};

export type CheckedActionFailure = { success: false; error: CheckedActionError };

export type CheckedActionResult = { success: true } | CheckedActionFailure;

export type CheckedRowError = CheckedActionError & {
  rowId: string;
  stage: 'parse' | 'backup' | 'apply';
  actionIndex?: number;
  targetIndex?: number;
  rootKey?: string;
};

export type CheckedRowResult =
  | {
      success: true;
      value: {
        touchedRootKeys: readonly string[];
        targetCount: number;
      };
    }
  | { success: false; error: CheckedRowError };

export type ApplyCheckedActionRowOptions = {
  rowId: string;
  actions: readonly Readonly<Action>[];
  targets: readonly Record<string, unknown>[];
};

type ReplayBranchBackup = {
  key: string;
  existed: boolean;
  value: unknown;
};

type ReplayTargetBackup = {
  target: Record<string, unknown>;
  branches: ReplayBranchBackup[];
};

export class CheckedActionReplayInvariantError extends AggregateError {
  readonly detail: {
    code: 'invariant_failed';
    rowId: string;
    stage: 'rollback';
  };

  constructor(rowId: string, causes: unknown[]) {
    super(causes, `Checked action row ${rowId} could not be fully rolled back`);
    this.name = 'CheckedActionReplayInvariantError';
    this.detail = Object.freeze({ code: 'invariant_failed', rowId, stage: 'rollback' });
  }
}

function isContainer(value: unknown): value is Container {
  return value !== null && typeof value === 'object';
}

function hasOwn(container: Container, key: ContainerKey): boolean {
  return Object.prototype.hasOwnProperty.call(container, key);
}

function createActionError(
  action: Readonly<Action>,
  code: CheckedActionErrorCode,
  message: string,
  details: { segment?: string; segmentIndex?: number; cause?: unknown } = {}
): CheckedActionFailure {
  return {
    success: false,
    error: Object.freeze({
      code,
      message,
      operation: action.op,
      path: action.path,
      ...(details.segment === undefined ? {} : { segment: details.segment }),
      ...(details.segmentIndex === undefined ? {} : { segmentIndex: details.segmentIndex }),
      ...(details.cause === undefined ? {} : { cause: details.cause }),
    }),
  };
}

function actionPathError(action: Readonly<Action>, error: ActionPathError): CheckedActionFailure {
  return createActionError(action, error.code, error.message, {
    ...(error.segment === undefined ? {} : { segment: error.segment }),
    ...(error.segmentIndex === undefined ? {} : { segmentIndex: error.segmentIndex }),
  });
}

function resolveContainerKey(
  container: Container,
  segment: string,
  segmentIndex: number,
  action: Readonly<Action>
): { success: true; key: ContainerKey; isArrayIndex: boolean } | CheckedActionFailure {
  if (!Array.isArray(container)) {
    return { success: true, key: segment, isArrayIndex: false };
  }

  const resolved = resolveArraySegment(segment, segmentIndex);
  if (!resolved.success) return actionPathError(action, resolved.error);
  return resolved.value.kind === 'index'
    ? { success: true, key: resolved.value.index, isArrayIndex: true }
    : { success: true, key: resolved.value.key, isArrayIndex: false };
}

function missingPath(
  action: Readonly<Action>,
  segment: string,
  segmentIndex: number
): CheckedActionFailure {
  return createActionError(action, 'missing_path', `Action path does not exist at ${segment}`, {
    segment,
    segmentIndex,
  });
}

function readExisting(container: Container, key: ContainerKey, isArrayIndex: boolean): unknown {
  if (Array.isArray(container) && isArrayIndex) return container[key as number];
  return (container as Record<string, unknown>)[key as string];
}

function existingPathContains(
  container: Container,
  key: ContainerKey,
  isArrayIndex: boolean
): boolean {
  if (Array.isArray(container) && isArrayIndex) return (key as number) < container.length;
  return hasOwn(container, key);
}

function walkToParent(
  target: Record<string, unknown>,
  parsedPath: ParsedActionPath,
  action: Readonly<Action>,
  createMissing: boolean
):
  | { success: true; container: Container; finalSegment: string; finalIndex: number }
  | CheckedActionFailure {
  let current: Container = target;
  const { segments } = parsedPath;

  for (let segmentIndex = 0; segmentIndex < segments.length - 1; segmentIndex += 1) {
    const segment = segments[segmentIndex]!;
    const nextSegment = segments[segmentIndex + 1]!;
    const resolvedKey = resolveContainerKey(current, segment, segmentIndex, action);
    if (!resolvedKey.success) return resolvedKey;

    if (!createMissing) {
      if (!existingPathContains(current, resolvedKey.key, resolvedKey.isArrayIndex)) {
        return missingPath(action, segment, segmentIndex);
      }
      const existing = readExisting(current, resolvedKey.key, resolvedKey.isArrayIndex);
      if (!isContainer(existing)) return missingPath(action, segment, segmentIndex);
      current = existing;
      continue;
    }

    const shouldCreateArray = shouldCreateArrayForSegment(nextSegment, segmentIndex + 1);
    if (!shouldCreateArray.success) return actionPathError(action, shouldCreateArray.error);

    const existing = readExisting(current, resolvedKey.key, resolvedKey.isArrayIndex);
    const existingMatches = shouldCreateArray.value
      ? Array.isArray(existing)
      : isContainer(existing);

    if (!existingMatches) {
      const replacement: Container = shouldCreateArray.value ? [] : {};
      const assigned = Reflect.set(current, resolvedKey.key, replacement);
      if (!assigned) {
        return createActionError(action, 'apply_failed', 'Failed to create path container', {
          segment,
          segmentIndex,
        });
      }
      current = replacement;
    } else {
      current = existing as Container;
    }
  }

  return {
    success: true,
    container: current,
    finalSegment: segments[segments.length - 1]!,
    finalIndex: segments.length - 1,
  };
}

function assignValue(
  container: Container,
  key: ContainerKey,
  value: unknown,
  action: Readonly<Action>,
  segmentIndex: number
): CheckedActionResult {
  try {
    if (!Reflect.set(container, key, value)) {
      return createActionError(action, 'apply_failed', 'Failed to assign action value', {
        segment: String(key),
        segmentIndex,
      });
    }
    return { success: true };
  } catch (cause) {
    const code =
      Array.isArray(container) && key === 'length' ? 'invalid_array_length' : 'apply_failed';
    return createActionError(action, code, 'Failed to assign action value', {
      segment: String(key),
      segmentIndex,
      cause,
    });
  }
}

function deleteValue(
  container: Container,
  key: ContainerKey,
  isArrayIndex: boolean,
  action: Readonly<Action>,
  segmentIndex: number
): CheckedActionResult {
  if (!existingPathContains(container, key, isArrayIndex)) {
    return missingPath(action, String(key), segmentIndex);
  }

  try {
    if (Array.isArray(container) && isArrayIndex) {
      container.splice(key as number, 1);
      return { success: true };
    }
    if (!Reflect.deleteProperty(container, key)) {
      return createActionError(action, 'apply_failed', 'Failed to delete action path', {
        segment: String(key),
        segmentIndex,
      });
    }
    return { success: true };
  } catch (cause) {
    return createActionError(action, 'apply_failed', 'Failed to delete action path', {
      segment: String(key),
      segmentIndex,
      cause,
    });
  }
}

/**
 * Applies one checked action to a disposable or row-backed plain-object target.
 * Callers that need atomicity must use applyCheckedActionRow.
 */
export function applyCheckedAction(
  target: Record<string, unknown>,
  action: Readonly<Action>
): CheckedActionResult {
  const parsedPath = parseActionPath(action.path);
  if (!parsedPath.success) return actionPathError(action, parsedPath.error);

  const isDelete = action.op === 'delete' || (action.op === 'set' && action.newValue === undefined);
  if (action.op === 'add' && action.newValue === undefined) {
    return createActionError(action, 'missing_new_value', 'Add actions require newValue');
  }

  try {
    const parent = walkToParent(target, parsedPath.value, action, !isDelete);
    if (!parent.success) return parent;

    const resolvedKey = resolveContainerKey(
      parent.container,
      parent.finalSegment,
      parent.finalIndex,
      action
    );
    if (!resolvedKey.success) return resolvedKey;

    if (isDelete) {
      return deleteValue(
        parent.container,
        resolvedKey.key,
        resolvedKey.isArrayIndex,
        action,
        parent.finalIndex
      );
    }

    if (action.op === 'add' && Array.isArray(parent.container) && resolvedKey.isArrayIndex) {
      parent.container.splice(
        Math.min(resolvedKey.key as number, parent.container.length),
        0,
        action.newValue
      );
      return { success: true };
    }

    return assignValue(
      parent.container,
      resolvedKey.key,
      action.newValue,
      action,
      parent.finalIndex
    );
  } catch (cause) {
    return createActionError(action, 'apply_failed', 'Checked action application threw', { cause });
  }
}

export type TouchedRootKeysResult =
  | { success: true; value: readonly string[] }
  | { success: false; actionIndex: number; error: CheckedActionError };

export function collectTouchedRootKeys(
  actions: readonly Readonly<Action>[]
): TouchedRootKeysResult {
  const keys = new Set<string>();
  for (const [actionIndex, action] of actions.entries()) {
    const parsed = parseActionPath(action.path);
    if (!parsed.success) {
      const result = actionPathError(action, parsed.error);
      if (result.success) throw new Error('Expected action path failure');
      return { success: false, actionIndex, error: result.error };
    }
    keys.add(parsed.value.rootKey);
  }
  return { success: true, value: Object.freeze([...keys]) };
}

function captureBackups(
  targets: readonly Record<string, unknown>[],
  rootKeys: readonly string[]
):
  | { success: true; value: ReplayTargetBackup[] }
  | { success: false; targetIndex: number; rootKey: string; cause: unknown } {
  const backups: ReplayTargetBackup[] = [];
  for (const [targetIndex, target] of targets.entries()) {
    const branches: ReplayBranchBackup[] = [];
    for (const key of rootKeys) {
      const existed = Object.prototype.hasOwnProperty.call(target, key);
      const cloned = existed
        ? cloneGameDataValue(target[key])
        : { success: true as const, value: undefined };
      if (!cloned.success) {
        return {
          success: false,
          targetIndex,
          rootKey: key,
          cause: new TypeError('Touched root branch is not cloneable game data'),
        };
      }
      branches.push({ key, existed, value: cloned.value });
    }
    backups.push({ target, branches });
  }
  return { success: true, value: backups };
}

function restoreBackups(
  rowId: string,
  backups: ReplayTargetBackup[],
  originalFailure: CheckedActionError
): void {
  const errors: unknown[] = [];
  for (let targetIndex = backups.length - 1; targetIndex >= 0; targetIndex -= 1) {
    const backup = backups[targetIndex]!;
    for (let branchIndex = backup.branches.length - 1; branchIndex >= 0; branchIndex -= 1) {
      const branch = backup.branches[branchIndex]!;
      try {
        const restored = branch.existed
          ? Reflect.set(backup.target, branch.key, branch.value)
          : Reflect.deleteProperty(backup.target, branch.key);
        if (!restored) errors.push(new Error(`Failed to restore root branch ${branch.key}`));
      } catch (error) {
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    throw new CheckedActionReplayInvariantError(rowId, [originalFailure, ...errors]);
  }
}

function rowError(
  rowId: string,
  stage: CheckedRowError['stage'],
  error: CheckedActionError,
  details: { actionIndex?: number; targetIndex?: number; rootKey?: string } = {}
): CheckedRowResult {
  return {
    success: false,
    error: Object.freeze({
      ...error,
      rowId,
      stage,
      ...(details.actionIndex === undefined ? {} : { actionIndex: details.actionIndex }),
      ...(details.targetIndex === undefined ? {} : { targetIndex: details.targetIndex }),
      ...(details.rootKey === undefined ? {} : { rootKey: details.rootKey }),
    }),
  };
}

/** Applies one decoded database row atomically across caller-supplied plain-object working targets. */
export function applyCheckedActionRow(options: ApplyCheckedActionRowOptions): CheckedRowResult {
  const touchedRoots = collectTouchedRootKeys(options.actions);
  if (!touchedRoots.success) {
    return rowError(options.rowId, 'parse', touchedRoots.error, {
      actionIndex: touchedRoots.actionIndex,
    });
  }

  const backups = captureBackups(options.targets, touchedRoots.value);
  if (!backups.success) {
    const backupActionIndex = options.actions.findIndex((action) => {
      const parsed = parseActionPath(action.path);
      return parsed.success && parsed.value.rootKey === backups.rootKey;
    });
    const backupAction: Readonly<Action> = options.actions[backupActionIndex] ??
      options.actions[0] ?? {
        op: 'set',
        path: backups.rootKey,
        oldValue: undefined,
        newValue: undefined,
      };
    return rowError(
      options.rowId,
      'backup',
      {
        code: 'clone_failed',
        message: 'Failed to clone a touched root branch',
        operation: backupAction.op,
        path: backupAction.path,
        cause: backups.cause,
      },
      {
        ...(backupActionIndex === -1 ? {} : { actionIndex: backupActionIndex }),
        targetIndex: backups.targetIndex,
        rootKey: backups.rootKey,
      }
    );
  }

  for (const [actionIndex, action] of options.actions.entries()) {
    for (const [targetIndex, target] of options.targets.entries()) {
      const result = applyCheckedAction(target, action);
      if (result.success) continue;

      restoreBackups(options.rowId, backups.value, result.error);
      return rowError(options.rowId, 'apply', result.error, { actionIndex, targetIndex });
    }
  }

  return {
    success: true,
    value: Object.freeze({
      touchedRootKeys: touchedRoots.value,
      targetCount: options.targets.length,
    }),
  };
}
