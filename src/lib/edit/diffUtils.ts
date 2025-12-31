import { getUntracked } from 'proxy-compare';
import type { INTERNAL_Op } from 'valtio';

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

  return actions;
}

function readActionHistory(storageKey: string): ActionHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ActionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeActionHistory(storageKey: string, history: ActionHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // ignore storage failures
  }
}

export function appendActionHistoryEntry(storageKey: string, entry: ActionHistoryEntry): void {
  const history = readActionHistory(storageKey);
  history.push(entry);
  writeActionHistory(storageKey, history);
}

const suppressedRecordingKeys = new Set<string>();

export function isRecordingSuppressed(storageKey: string): boolean {
  return suppressedRecordingKeys.has(storageKey);
}
