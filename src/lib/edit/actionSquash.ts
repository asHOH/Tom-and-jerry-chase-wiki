import isEqual from 'lodash-es/isEqual';
import { getVersion, snapshot } from 'valtio/vanilla';

import type { Action, ActionHistoryEntry } from './diffUtils';

type FlatItem = {
  action: Action;
  entryIndex: number;
  flatIndex: number;
};

type Container = Record<string, unknown> | unknown[];

export type SquashActionsOptions = {
  currentRoot?: Record<string, unknown>;
};

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

function isAtOrUnderPath(path: string, parentPath: string): boolean {
  return path === parentPath || path.startsWith(`${parentPath}.`);
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

function getAtPath(root: unknown, path: string): unknown {
  return getAtRelativePath(root, parsePath(path));
}

function createContainer(nextKey: string): Container {
  return isArrayIndex(nextKey) ? [] : {};
}

function getParentAtRelativePath(
  root: Container,
  parts: string[]
): { parent: Container; key: string } | null {
  if (parts.length === 0) return null;

  let current: unknown = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!isContainer(current)) return null;

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

  if (!isContainer(current)) return null;

  return { parent: current, key: parts[parts.length - 1]! };
}

function assignAtRelativePath(root: Container, parts: string[], value: unknown): boolean {
  const target = getParentAtRelativePath(root, parts);
  if (!target) return false;

  (target.parent as Record<string, unknown>)[target.key] = value;
  return true;
}

function removeAtRelativePath(
  root: Container,
  parts: string[],
  arrayMode: 'delete' | 'splice'
): boolean {
  const target = getParentAtRelativePath(root, parts);
  if (!target) return false;

  if (Array.isArray(target.parent) && isArrayIndex(target.key)) {
    const index = Number(target.key);
    if (!Number.isInteger(index) || index < 0) return false;

    if (arrayMode === 'splice') {
      target.parent.splice(index, 1);
    } else {
      delete target.parent[index];
    }
    return true;
  }

  delete (target.parent as Record<string, unknown>)[target.key];
  return true;
}

function addAtRelativePath(root: Container, parts: string[], value: unknown): boolean {
  if (value === undefined) return false;

  const target = getParentAtRelativePath(root, parts);
  if (!target) return false;

  if (Array.isArray(target.parent) && isArrayIndex(target.key)) {
    const index = Number(target.key);
    if (!Number.isInteger(index) || index < 0) return false;

    target.parent.splice(Math.min(index, target.parent.length), 0, value);
    return true;
  }

  (target.parent as Record<string, unknown>)[target.key] = value;
  return true;
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

function foldDescendantMutations(flat: FlatItem[], structuralParents: Set<string>): Set<number> {
  const foldedIndexes = new Set<number>();

  flat.forEach((item, flatPosition) => {
    const { action } = item;
    if (!action.path) return;
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
      const currentValue = getAtRelativePath(parentNewValue, relativePath);
      if (isEqual(currentValue, action.newValue)) {
        foldedIndexes.add(item.flatIndex);
        break;
      }
      if (!isEqual(currentValue, action.oldValue)) continue;
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

function isSquashablePropertyStructuralMutation(
  action: Action,
  currentRoot?: Record<string, unknown>
): boolean {
  if ((action.op !== 'add' && action.op !== 'delete') || !action.path || !currentRoot) return false;

  const mutationValue = action.op === 'add' ? action.newValue : action.oldValue;
  if (isContainer(mutationValue)) return false;

  const parent = getAtPath(currentRoot, getStructuralParent(action.path));
  return isContainer(parent) && !Array.isArray(parent);
}

function squashPathMutation(firstAction: Action, lastAction: Action): Action {
  const oldValue = firstAction.oldValue;
  const newValue = lastAction.newValue;

  if (newValue === undefined) {
    return { ...lastAction, op: 'delete', oldValue, newValue };
  }

  if (oldValue !== undefined) {
    return { ...lastAction, op: 'set', oldValue, newValue };
  }

  return { ...lastAction, oldValue, newValue };
}

function buildFlatEntries(entries: ActionHistoryEntry[]): FlatItem[] {
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

  return flat;
}

function cloneValue<T>(value: T): T | null {
  try {
    return structuredClone(value);
  } catch {
    return null;
  }
}

function cloneCurrentRoot(currentRoot: Record<string, unknown>): Record<string, unknown> | null {
  if (getVersion(currentRoot) === undefined) {
    return cloneValue(currentRoot);
  }

  try {
    return structuredClone(snapshot(currentRoot)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function applyForwardAction(root: Container, action: Action): boolean {
  if (!action.path) return false;

  const parts = parsePath(action.path);
  if (action.op === 'delete') {
    return removeAtRelativePath(root, parts, 'delete');
  }

  if (action.op === 'add') {
    return addAtRelativePath(root, parts, action.newValue);
  }

  return assignAtRelativePath(root, parts, action.newValue);
}

function applyInverseAction(root: Container, action: Action): boolean {
  if (!action.path) return false;

  const parts = parsePath(action.path);
  if (action.op === 'delete') {
    return assignAtRelativePath(root, parts, action.oldValue);
  }

  if (action.op === 'add') {
    return removeAtRelativePath(root, parts, 'splice');
  }

  if (action.oldValue === undefined) {
    return removeAtRelativePath(root, parts, 'splice');
  }

  return assignAtRelativePath(root, parts, action.oldValue);
}

function reverseApplyActions(root: Container, flat: FlatItem[]): void {
  for (let i = flat.length - 1; i >= 0; i -= 1) {
    const item = flat[i];
    if (item) applyInverseAction(root, item.action);
  }
}

function getStructuralArrayCandidateParent(action: Action): string | null {
  if (!action.path) return null;

  const parts = parsePath(action.path);
  if (parts.length < 2) return null;

  const last = parts[parts.length - 1]!;
  const parentPath = parts.slice(0, -1).join('.');
  if (!parentPath) return null;

  if ((action.op === 'delete' || action.op === 'add') && isArrayIndex(last)) {
    return parentPath;
  }

  if (action.op !== 'set') return null;
  if (last === 'length') return parentPath;
  if (isArrayIndex(last) && action.oldValue === undefined) return parentPath;

  return null;
}

function isArrayShapedDescendantPath(parentPath: string, childPath: string): boolean {
  const relativePath = getRelativeDescendantPath(parentPath, childPath);
  if (!relativePath) return false;

  const [first, ...rest] = relativePath;
  if (first === 'length') return rest.length === 0;
  return first !== undefined && isArrayIndex(first);
}

function isDenseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false;

  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) return false;
  }

  return true;
}

type ArrayParentNormalization = {
  action: Action | null;
  coveredFlatIndexes: Set<number>;
  firstEntryIndex: number;
  firstFlatIndex: number;
  parentPath: string;
};

function canNormalizeWithParentSet(
  parentPath: string,
  beforeRoot: Record<string, unknown>,
  oldArray: unknown[],
  newArray: unknown[]
): boolean {
  if (isEqual(oldArray, newArray)) return true;

  const candidateRoot = cloneValue(beforeRoot);
  if (!candidateRoot) return false;

  const newArrayClone = cloneValue(newArray);
  if (newArrayClone === null) return false;

  if (!assignAtRelativePath(candidateRoot, parsePath(parentPath), newArrayClone)) {
    return false;
  }

  return isEqual(getAtPath(candidateRoot, parentPath), newArray);
}

function getArrayParentNormalization(
  parentPath: string,
  flat: FlatItem[],
  beforeRoot: Record<string, unknown>,
  finalRoot: Record<string, unknown>
): ArrayParentNormalization | null {
  const coveredItems = flat.filter((item) => isAtOrUnderPath(item.action.path, parentPath));
  if (coveredItems.length === 0) return null;

  if (coveredItems.some((item) => !isArrayShapedDescendantPath(parentPath, item.action.path))) {
    return null;
  }

  const oldArray = getAtPath(beforeRoot, parentPath);
  const newArray = getAtPath(finalRoot, parentPath);
  if (!isDenseArray(oldArray) || !isDenseArray(newArray)) return null;

  const replayedRoot = cloneValue(beforeRoot);
  if (!replayedRoot) return null;

  for (const item of coveredItems) {
    if (!applyForwardAction(replayedRoot, item.action)) return null;
  }

  const replayedArray = getAtPath(replayedRoot, parentPath);
  if (!isDenseArray(replayedArray) || !isEqual(replayedArray, newArray)) return null;
  if (!canNormalizeWithParentSet(parentPath, beforeRoot, oldArray, newArray)) {
    return null;
  }

  const coveredFlatIndexes = new Set(coveredItems.map((item) => item.flatIndex));
  const firstItem = coveredItems[0]!;
  const oldArrayClone = cloneValue(oldArray);
  const newArrayClone = cloneValue(newArray);
  if (oldArrayClone === null || newArrayClone === null) return null;

  return {
    action: isEqual(oldArray, newArray)
      ? null
      : {
          op: 'set',
          path: parentPath,
          oldValue: oldArrayClone,
          newValue: newArrayClone,
        },
    coveredFlatIndexes,
    firstEntryIndex: firstItem.entryIndex,
    firstFlatIndex: firstItem.flatIndex,
    parentPath,
  };
}

function hasOverlappingNormalization(
  parentPath: string,
  normalizations: ArrayParentNormalization[]
): boolean {
  return normalizations.some(
    (normalization) =>
      isAtOrUnderPath(parentPath, normalization.parentPath) ||
      isAtOrUnderPath(normalization.parentPath, parentPath)
  );
}

function normalizeStructuralArrayActions(
  entries: ActionHistoryEntry[],
  currentRoot?: Record<string, unknown>
): ActionHistoryEntry[] {
  if (!currentRoot) return entries;

  const finalRoot = cloneCurrentRoot(currentRoot);
  if (!finalRoot) return entries;

  const beforeRoot = cloneValue(finalRoot);
  if (!beforeRoot) return entries;

  const flat = buildFlatEntries(entries);
  reverseApplyActions(beforeRoot, flat);

  const candidateParents = new Set<string>();
  flat.forEach((item) => {
    const parentPath = getStructuralArrayCandidateParent(item.action);
    if (parentPath) candidateParents.add(parentPath);
  });

  if (candidateParents.size === 0) return entries;

  const normalizations: ArrayParentNormalization[] = [];
  Array.from(candidateParents)
    .sort((a, b) => parsePath(a).length - parsePath(b).length)
    .forEach((parentPath) => {
      if (hasOverlappingNormalization(parentPath, normalizations)) return;

      const normalization = getArrayParentNormalization(parentPath, flat, beforeRoot, finalRoot);
      if (normalization) normalizations.push(normalization);
    });

  if (normalizations.length === 0) return entries;

  const coveredFlatIndexes = new Set<number>();
  const normalizationByFirstFlatIndex = new Map<number, ArrayParentNormalization>();

  normalizations.forEach((normalization) => {
    normalization.coveredFlatIndexes.forEach((flatIndex) => coveredFlatIndexes.add(flatIndex));
    normalizationByFirstFlatIndex.set(normalization.firstFlatIndex, normalization);
  });

  const grouped: Action[][] = entries.map(() => []);
  flat.forEach((item) => {
    const normalization = normalizationByFirstFlatIndex.get(item.flatIndex);
    if (normalization?.action) {
      const bucket = grouped[normalization.firstEntryIndex] ?? [];
      bucket.push(normalization.action);
      grouped[normalization.firstEntryIndex] = bucket;
    }

    if (coveredFlatIndexes.has(item.flatIndex)) return;

    const bucket = grouped[item.entryIndex] ?? [];
    bucket.push(item.action);
    grouped[item.entryIndex] = bucket;
  });

  const normalizedEntries: ActionHistoryEntry[] = [];
  grouped.forEach((actions) => {
    if (actions.length === 1) {
      normalizedEntries.push(actions[0]!);
    } else if (actions.length > 1) {
      normalizedEntries.push(actions);
    }
  });

  return normalizedEntries;
}

/**
 * Squash an action history so that only the last safe `set` per path remains.
 *
 * Safety rules:
 * - Always keep array/container structural ops (`add`/`delete`) as-is.
 * - Fold scalar object-property adds/deletes with later mutations on the same path when the
 *   current root proves that the parent is not an array.
 * - Do not squash sets inside the parent subtree of any structural op.
 * - Fold descendant sets into an earlier parent set when oldValue matches the parent snapshot,
 *   or when the descendant newValue is already represented by that snapshot.
 * - Drop no-op sets where oldValue === newValue.
 */
export function squashActions(
  entries: ActionHistoryEntry[],
  options?: SquashActionsOptions
): ActionHistoryEntry[] {
  const normalizedEntries = normalizeStructuralArrayActions(entries, options?.currentRoot);
  if (normalizedEntries.length === 0) return [];

  const structuralParents = new Set<string>();

  const recordStructuralParent = (action: Action) => {
    if (action.op !== 'add' && action.op !== 'delete') return;
    if (isSquashablePropertyStructuralMutation(action, options?.currentRoot)) return;
    if (!action.path) return;
    const parent = getStructuralParent(action.path);
    if (parent) structuralParents.add(parent);
  };

  normalizedEntries.forEach((entry) => {
    if (Array.isArray(entry)) {
      entry.forEach(recordStructuralParent);
    } else {
      recordStructuralParent(entry);
    }
  });

  const flat = buildFlatEntries(normalizedEntries);

  const foldedIndexes = foldDescendantMutations(flat, structuralParents);

  const latestByPath = new Map<string, number>();
  const firstMutationByPath = new Map<string, Action>();
  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;
    if (!path) return;
    if (foldedIndexes.has(idx)) return;

    const isSquashableMutation =
      action.op === 'set' || isSquashablePropertyStructuralMutation(action, options?.currentRoot);
    if (isSquashableMutation && !isInStructuralZone(path, structuralParents)) {
      if (!firstMutationByPath.has(path)) {
        firstMutationByPath.set(path, action);
      }
      latestByPath.set(path, idx);
    }
  });

  const grouped: Action[][] = normalizedEntries.map(() => []);

  flat.forEach((item) => {
    const { action, flatIndex: idx } = item;
    const path = action.path;
    if (foldedIndexes.has(idx)) return;

    const isSquashablePropertyMutation = isSquashablePropertyStructuralMutation(
      action,
      options?.currentRoot
    );
    const isStructural =
      ((action.op === 'add' || action.op === 'delete') && !isSquashablePropertyMutation) ||
      (path ? isInStructuralZone(path, structuralParents) : false);
    const isLatestForPath = !path || latestByPath.get(path) === idx;
    const shouldSquashMutation =
      (action.op === 'set' || isSquashablePropertyMutation) && path
        ? !isInStructuralZone(path, structuralParents)
        : false;
    const squashedAction = shouldSquashMutation
      ? squashPathMutation(firstMutationByPath.get(path) ?? action, action)
      : action;
    const isNoOp = isEqual(squashedAction.oldValue, squashedAction.newValue);

    const shouldKeep = isStructural || (shouldSquashMutation && isLatestForPath && !isNoOp);

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
