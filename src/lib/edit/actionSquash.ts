import isEqual from 'lodash-es/isEqual';

import type { Action, ActionHistoryEntry } from './diffUtils';

type FlatItem = {
  action: Action;
  entryIndex: number;
  flatIndex: number;
};

type Container = Record<string, unknown> | unknown[];

function parsePath(path: string): string[] {
  return path.split('.').filter(Boolean);
}

function getStructuralParent(path: string): string {
  const parts = parsePath(path);
  return parts.slice(0, -1).join('.');
}

function isInStructuralZone(path: string, structuralParents: Set<string>): boolean {
  for (const parent of structuralParents) {
    if (path === parent || path.startsWith(`${parent}.`)) return true;
  }
  return false;
}

function isContainer(value: unknown): value is Container {
  return value !== null && typeof value === 'object';
}

function isArrayIndex(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

function getRelativeDescendantPath(parentPath: string, childPath: string): string[] | null {
  const parentParts = parsePath(parentPath);
  const childParts = parsePath(childPath);

  if (childParts.length <= parentParts.length) return null;

  for (let i = 0; i < parentParts.length; i += 1) {
    if (parentParts[i] !== childParts[i]) return null;
  }

  return childParts.slice(parentParts.length);
}

function getAtRelativePath(root: unknown, parts: string[]): unknown {
  let current = root;

  for (const part of parts) {
    if (!isContainer(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function createContainer(nextKey: string): Container {
  return isArrayIndex(nextKey) ? [] : {};
}

function setAtRelativePath(root: Container, parts: string[], value: unknown): boolean {
  if (parts.length === 0) return false;

  let current: unknown = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!isContainer(current)) return false;

    const key = parts[i]!;
    const nextKey = parts[i + 1] ?? '';
    const container = current as Record<string, unknown>;
    const existing = container[key];

    if (existing === undefined || existing === null) {
      container[key] = createContainer(nextKey);
    } else if (!isContainer(existing)) {
      container[key] = createContainer(nextKey);
    }

    current = container[key];
  }

  if (!isContainer(current)) return false;

  const last = parts[parts.length - 1]!;
  if (value === undefined) {
    if (Array.isArray(current) && isArrayIndex(last)) {
      current.splice(Number(last), 1);
      return true;
    }

    delete (current as Record<string, unknown>)[last];
    return true;
  }

  (current as Record<string, unknown>)[last] = value;
  return true;
}

function foldDescendantSets(flat: FlatItem[], structuralParents: Set<string>): Set<number> {
  const foldedIndexes = new Set<number>();

  flat.forEach((item, flatPosition) => {
    const { action } = item;
    if (action.op !== 'set' || !action.path) return;
    if (foldedIndexes.has(item.flatIndex)) return;
    if (isInStructuralZone(action.path, structuralParents)) return;

    for (let parentPosition = flatPosition - 1; parentPosition >= 0; parentPosition -= 1) {
      const parentItem = flat[parentPosition];
      if (!parentItem || foldedIndexes.has(parentItem.flatIndex)) continue;

      const parentAction = parentItem.action;
      if (parentAction.op !== 'set' || !parentAction.path) continue;
      if (isInStructuralZone(parentAction.path, structuralParents)) continue;
      if (!isContainer(parentAction.newValue)) continue;

      const relativePath = getRelativeDescendantPath(parentAction.path, action.path);
      if (!relativePath) continue;

      const parentNewValue = structuredClone(parentAction.newValue) as Container;
      if (!isEqual(getAtRelativePath(parentNewValue, relativePath), action.oldValue)) continue;
      if (!setAtRelativePath(parentNewValue, relativePath, action.newValue)) continue;

      flat[parentPosition] = {
        ...parentItem,
        action: {
          ...parentAction,
          newValue: parentNewValue,
        },
      };
      foldedIndexes.add(item.flatIndex);
      break;
    }
  });

  return foldedIndexes;
}

/**
 * Squash an action history so that only the last safe `set` per path remains.
 *
 * Safety rules:
 * - Always keep structural ops (`add`/`delete`) as-is.
 * - Do not squash sets inside the parent subtree of any structural op.
 * - Fold descendant sets into an earlier parent set when oldValue matches the parent snapshot.
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

  const foldedIndexes = foldDescendantSets(flat, structuralParents);

  const latestByPath = new Map<string, number>();
  const firstSetByPath = new Map<string, Action>();
  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;
    if (!path) return;
    if (foldedIndexes.has(idx)) return;

    if (action.op === 'set' && !isInStructuralZone(path, structuralParents)) {
      if (!firstSetByPath.has(path)) {
        firstSetByPath.set(path, action);
      }
      latestByPath.set(path, idx);
    }
  });

  const grouped: Action[][] = entries.map(() => []);

  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;
    if (foldedIndexes.has(idx)) return;

    const isStructural =
      action.op === 'add' ||
      action.op === 'delete' ||
      (path ? isInStructuralZone(path, structuralParents) : false);
    const isLatestForPath = !path || latestByPath.get(path) === idx;
    const shouldSquashSet =
      action.op === 'set' && path ? !isInStructuralZone(path, structuralParents) : false;
    const squashedAction = shouldSquashSet
      ? { ...action, oldValue: firstSetByPath.get(path)?.oldValue }
      : action;
    const isNoOp = isEqual(squashedAction.oldValue, squashedAction.newValue);

    const shouldKeep =
      isStructural ||
      (action.op === 'set' &&
        !isInStructuralZone(path, structuralParents) &&
        isLatestForPath &&
        !isNoOp);

    if (shouldKeep) {
      const bucket = grouped[item.entryIndex] ?? [];
      bucket.push(squashedAction);
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
