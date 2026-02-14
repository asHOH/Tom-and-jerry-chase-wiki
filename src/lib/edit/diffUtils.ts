import isEqual from 'lodash-es/isEqual';
import { getUntracked } from 'proxy-compare';
import type { INTERNAL_Op } from 'valtio';

import { actionHistorySchema } from '@/lib/validation/schemas';

export const subscribers: Record<string, [() => void, () => void]> = {};

export type DiffOp = 'set' | 'add' | 'delete';

export interface Action {
  op: DiffOp;
  /** Dot-notation path relative to the subscribed root object */
  path: string;
  oldValue: unknown;
  newValue: unknown;
}

export type ActionHistoryEntry = Action | Action[];

const ACTIONS_STORAGE_PREFIX = 'editmode:actions:';

/**
 * Returns the localStorage key used to persist action history for an entity store.
 */
export function getActionsStorageKey(entityType: string): string {
  return `${ACTIONS_STORAGE_PREFIX}${entityType}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isArrayIndex(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

type ValtioPath = Array<string | symbol>;

function toPathString(path: ValtioPath): string | null {
  // Symbols are not representable in our persisted dot-path format.
  if (path.some((p) => typeof p === 'symbol')) return null;
  return (path as string[]).join('.');
}

function untrackIfPossible(value: unknown): unknown {
  if (value !== null && typeof value === 'object') {
    return getUntracked(value) || value;
  }
  return value;
}

function isNoOpAction(action: Action): boolean {
  if (!action.path) return true;
  if (action.op === 'delete') return action.oldValue === undefined;
  if (action.op === 'add') return action.newValue === undefined;
  return isEqual(action.oldValue, action.newValue);
}

function filterActionEntry(entry: ActionHistoryEntry): ActionHistoryEntry | null {
  if (Array.isArray(entry)) {
    const filtered = entry.filter((action) => !isNoOpAction(action));
    if (filtered.length === 0) return null;
    return filtered.length === 1 ? filtered[0]! : filtered;
  }

  return isNoOpAction(entry) ? null : entry;
}

function filterActionHistory(history: ActionHistoryEntry[]): ActionHistoryEntry[] {
  const filtered: ActionHistoryEntry[] = [];
  for (const entry of history) {
    const next = filterActionEntry(entry);
    if (next) filtered.push(next);
  }
  return filtered;
}

/**
 * Convert Valtio internal ops to our stable Action format.
 *
 * - Uses `proxy-compare`'s `getUntracked` to avoid persisting proxy references.
 * - For `set`, records a single action per op (no deep diff).
 */
export function actionsFromValtioOps(ops: INTERNAL_Op[]): Action[] {
  const actions: Action[] = [];

  for (const op of ops) {
    const opName = op[0];
    const pathString = toPathString(op[1] as ValtioPath);
    if (!pathString) continue;

    if (opName === 'set') {
      const nextValue = untrackIfPossible(op[2]);
      const prevValue = untrackIfPossible(op[3]);
      actions.push({ op: 'set', path: pathString, oldValue: prevValue, newValue: nextValue });
      continue;
    }

    // delete
    const prevValue = untrackIfPossible(op[2]);
    actions.push({ op: 'delete', path: pathString, oldValue: prevValue, newValue: undefined });
  }

  return actions.filter((action) => !isNoOpAction(action));
}

function parsePath(path: string): string[] {
  if (!path) return [];
  return path.split('.').filter(Boolean);
}

function ensureContainer(current: unknown, nextKey: string): Record<string, unknown> | unknown[] {
  const shouldBeArray = isArrayIndex(nextKey);
  if (shouldBeArray) {
    return isArray(current) ? current : [];
  }
  if (isRecord(current)) return current;
  if (isArray(current)) return current;
  return {};
}

function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = parsePath(path);
  if (parts.length === 0) {
    // Setting the root object isn't supported in-place (valtio proxy root),
    // so we do nothing. Callers should apply at a child path.
    return;
  }

  let current: unknown = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const nextKey = parts[i + 1] ?? '';

    if (!isRecord(current) && !isArray(current)) {
      return;
    }

    const container = current as Record<string, unknown>;
    const existing = container[key];

    if (existing === undefined || existing === null) {
      container[key] = isArrayIndex(nextKey) ? [] : {};
    } else {
      container[key] = ensureContainer(existing, nextKey);
    }

    current = container[key];
  }

  const last = parts[parts.length - 1]!;
  if (!isRecord(current) && !isArray(current)) return;
  if (value === undefined) {
    if (isArray(current) && isArrayIndex(last)) {
      const idx = Number(last);
      if (Number.isInteger(idx)) {
        current.splice(idx, 1);
        return;
      }
    }
    delete (current as Record<string, unknown>)[last];
    return;
  }

  (current as Record<string, unknown>)[last] = value;
}

function deleteAtPath(target: Record<string, unknown>, path: string): void {
  const parts = parsePath(path);
  if (parts.length === 0) return;

  let current: unknown = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (!isRecord(current) && !isArray(current)) return;
    current = (current as Record<string, unknown>)[key];
  }

  const last = parts[parts.length - 1]!;
  if (!isRecord(current) && !isArray(current)) return;

  if (isArray(current) && isArrayIndex(last)) {
    const idx = Number(last);
    if (Number.isInteger(idx)) {
      current.splice(idx, 1);
      return;
    }
  }

  delete (current as Record<string, unknown>)[last];
}

export function applyAction(target: Record<string, unknown>, action: Action): void {
  if (!action.path) return;

  if (action.op === 'delete') {
    deleteAtPath(target, action.path);
    return;
  }

  if (action.op === 'add') {
    addAtPath(target, action.path, action.newValue);
    return;
  }

  // add/set both become assignments
  setAtPath(target, action.path, action.newValue);
}

function addAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  if (value === undefined) return;

  const parts = parsePath(path);
  if (parts.length === 0) return;

  let current: unknown = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const nextKey = parts[i + 1] ?? '';

    if (!isRecord(current) && !isArray(current)) {
      return;
    }

    const container = current as Record<string, unknown>;
    const existing = container[key];

    if (existing === undefined || existing === null) {
      container[key] = isArrayIndex(nextKey) ? [] : {};
    } else {
      container[key] = ensureContainer(existing, nextKey);
    }

    current = container[key];
  }

  const last = parts[parts.length - 1]!;
  if (!isRecord(current) && !isArray(current)) return;

  if (isArray(current) && isArrayIndex(last)) {
    const idx = Number(last);
    if (!Number.isInteger(idx) || idx < 0) return;
    const insertIndex = Math.min(idx, current.length);
    current.splice(insertIndex, 0, value);
    return;
  }

  (current as Record<string, unknown>)[last] = value;
}

export function applyActionEntry(target: Record<string, unknown>, entry: ActionHistoryEntry): void {
  if (Array.isArray(entry)) {
    for (const action of entry) applyAction(target, action);
    return;
  }

  applyAction(target, entry);
}

function invertAction(action: Action): Action {
  if (action.op === 'add') {
    return { ...action, op: 'delete', oldValue: action.newValue, newValue: undefined };
  }
  if (action.op === 'delete') {
    return { ...action, op: 'add', oldValue: undefined, newValue: action.oldValue };
  }
  if (action.oldValue === undefined && action.newValue !== undefined) {
    return { ...action, op: 'delete', oldValue: action.newValue, newValue: undefined };
  }
  return { ...action, oldValue: action.newValue, newValue: action.oldValue };
}

export function invertActionEntry(entry: ActionHistoryEntry): ActionHistoryEntry {
  if (!Array.isArray(entry)) return invertAction(entry);
  // Undo a batch in reverse order
  return entry
    .slice()
    .reverse()
    .map((a) => invertAction(a));
}

export function readActionHistory(storageKey: string): ActionHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = actionHistorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return filterActionHistory(parsed.data as ActionHistoryEntry[]);
  } catch {
    return [];
  }
}

export function writeActionHistory(storageKey: string, history: ActionHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // ignore storage failures
  }
}

export function appendActionHistoryEntry(storageKey: string, entry: ActionHistoryEntry): void {
  const filteredEntry = filterActionEntry(entry);
  if (!filteredEntry) return;
  const history = readActionHistory(storageKey);
  history.push(filteredEntry);
  writeActionHistory(storageKey, history);
}

export function withRecordingSuppressed<T>(storageKey: string, fn: () => T): T {
  if (storageKey in subscribers) {
    subscribers[storageKey]![1]();
    try {
      return fn();
    } finally {
      subscribers[storageKey]![0]();
    }
  } else {
    return fn();
  }
}
