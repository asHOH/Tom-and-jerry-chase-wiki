import isEqual from 'lodash-es/isEqual';

import type { Action, ActionHistoryEntry } from './diffUtils';

type FlatItem = {
  action: Action;
  entryIndex: number;
  flatIndex: number;
};

function getStructuralParent(path: string): string {
  const parts = path.split('.').filter(Boolean);
  return parts.slice(0, -1).join('.');
}

function isInStructuralZone(path: string, structuralParents: Set<string>): boolean {
  for (const parent of structuralParents) {
    if (path === parent || path.startsWith(`${parent}.`)) return true;
  }
  return false;
}

/**
 * Squash an action history so that only the last safe `set` per path remains.
 *
 * Safety rules:
 * - Always keep structural ops (`add`/`delete`) as-is.
 * - Do not squash sets inside the parent subtree of any structural op.
 * - Drop no-op sets where oldValue === newValue.
 */
export function squashActions(entries: ActionHistoryEntry[]): ActionHistoryEntry[] {
  if (entries.length === 0) return [];

  const structuralParents = new Set<string>();

  const recordStructuralParent = (action: Action) => {
    if (action.op !== 'add' && action.op !== 'delete') return;
    if (!action.path) return;
    const parent = getStructuralParent(action.path);
    if (parent) structuralParents.add(parent);
  };

  entries.forEach((entry) => {
    if (Array.isArray(entry)) {
      entry.forEach(recordStructuralParent);
    } else {
      recordStructuralParent(entry);
    }
  });

  const flat: FlatItem[] = [];
  let flatIndex = 0;

  entries.forEach((entry, entryIndex) => {
    if (Array.isArray(entry)) {
      entry.forEach((action) => {
        flat.push({ action, entryIndex, flatIndex });
        flatIndex += 1;
      });
    } else {
      flat.push({ action: entry, entryIndex, flatIndex });
      flatIndex += 1;
    }
  });

  const latestByPath = new Map<string, number>();
  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;
    if (!path) return;

    if (action.op === 'set' && !isInStructuralZone(path, structuralParents)) {
      latestByPath.set(path, idx);
    }
  });

  const grouped: Action[][] = entries.map(() => []);

  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;

    const isStructural =
      action.op === 'add' ||
      action.op === 'delete' ||
      (path ? isInStructuralZone(path, structuralParents) : false);
    const isLatestForPath = !path || latestByPath.get(path) === idx;
    const isNoOp = isEqual(action.oldValue, action.newValue);

    const shouldKeep =
      isStructural ||
      (action.op === 'set' &&
        !isInStructuralZone(path, structuralParents) &&
        isLatestForPath &&
        !isNoOp);

    if (shouldKeep) {
      const bucket = grouped[item.entryIndex] ?? [];
      bucket.push(action);
      grouped[item.entryIndex] = bucket;
    }
  });

  const result: ActionHistoryEntry[] = [];
  grouped.forEach((actions) => {
    if (actions.length === 1) {
      result.push(actions[0]!);
    } else if (actions.length > 1) {
      result.push(actions);
    }
  });

  return result;
}
