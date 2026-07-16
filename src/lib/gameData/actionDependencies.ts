import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

type Path = string[];

function parsePath(path: string): Path {
  return path.split('.').filter(Boolean);
}

function isArrayIndex(segment: string): boolean {
  return /^[0-9]+$/.test(segment);
}

function isAtOrUnderPath(path: Path, parent: Path): boolean {
  if (path.length < parent.length) return false;

  for (let index = 0; index < parent.length; index += 1) {
    if (path[index] !== parent[index]) return false;
  }

  return true;
}

function pathsOverlap(left: Path, right: Path): boolean {
  return isAtOrUnderPath(left, right) || isAtOrUnderPath(right, left);
}

/**
 * Returns the array whose indexes can shift when this action is applied.
 *
 * Ordinary writes below different array items remain independent. Inserts,
 * removals, length writes, and append-shaped index sets affect every later
 * index below the structural parent.
 */
function getStructuralArrayParent(action: Action): Path | null {
  const path = parsePath(action.path);
  if (path.length < 2) return null;

  const last = path[path.length - 1]!;
  const parent = path.slice(0, -1);

  if ((action.op === 'add' || action.op === 'delete') && isArrayIndex(last)) {
    return parent;
  }

  if (action.op !== 'set') return null;
  if (last === 'length') return parent;
  if (isArrayIndex(last) && action.oldValue === undefined) return parent;

  return null;
}

export function areActionsOrderDependent(left: Action, right: Action): boolean {
  const leftPath = parsePath(left.path);
  const rightPath = parsePath(right.path);
  if (leftPath.length === 0 || rightPath.length === 0) return false;
  if (pathsOverlap(leftPath, rightPath)) return true;

  const leftArrayParent = getStructuralArrayParent(left);
  if (leftArrayParent && isAtOrUnderPath(rightPath, leftArrayParent)) return true;

  const rightArrayParent = getStructuralArrayParent(right);
  return Boolean(rightArrayParent && isAtOrUnderPath(leftPath, rightArrayParent));
}

function actionsInEntry(entry: ActionHistoryEntry): Action[] {
  return Array.isArray(entry) ? entry : [entry];
}

function entriesAreOrderDependent(left: ActionHistoryEntry, right: ActionHistoryEntry): boolean {
  return actionsInEntry(left).some((leftAction) =>
    actionsInEntry(right).some((rightAction) => areActionsOrderDependent(leftAction, rightAction))
  );
}

/**
 * Groups top-level history-entry indexes into transitive dependency clusters.
 * Every input index occurs exactly once, and both groups and their members
 * preserve the original history order.
 */
export function groupActionEntriesByDependency(entries: readonly ActionHistoryEntry[]): number[][] {
  const parents = entries.map((_, index) => index);

  const findRoot = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root]!;

    let current = index;
    while (parents[current] !== current) {
      const next = parents[current]!;
      parents[current] = root;
      current = next;
    }

    return root;
  };

  const union = (leftIndex: number, rightIndex: number): void => {
    const leftRoot = findRoot(leftIndex);
    const rightRoot = findRoot(rightIndex);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    const left = entries[leftIndex]!;
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const right = entries[rightIndex]!;
      if (entriesAreOrderDependent(left, right)) union(leftIndex, rightIndex);
    }
  }

  const groupsByRoot = new Map<number, number[]>();
  entries.forEach((_, index) => {
    const root = findRoot(index);
    const group = groupsByRoot.get(root);
    if (group) group.push(index);
    else groupsByRoot.set(root, [index]);
  });

  return [...groupsByRoot.values()].sort((left, right) => left[0]! - right[0]!);
}
