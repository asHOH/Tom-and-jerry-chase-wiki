import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { parseActionPath, resolveArraySegment } from './actionPath';

type Path = readonly string[];

type AnalyzedActionPath = {
  path: Path;
  structuralArrayParent: Path | null;
};

type ActionPathAnalysis = { success: true; value: AnalyzedActionPath } | { success: false };

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

function analyzeActionPath(action: Action): ActionPathAnalysis {
  const parsed = parseActionPath(action.path);
  if (!parsed.success) return { success: false };

  const path = parsed.value.segments;
  const finalSegmentIndex = path.length - 1;
  const finalSegment = path[finalSegmentIndex]!;
  const resolvedFinalSegment = resolveArraySegment(finalSegment, finalSegmentIndex);
  if (!resolvedFinalSegment.success) return { success: false };

  let structuralArrayParent: Path | null = null;
  if (path.length >= 2) {
    const parent = path.slice(0, -1);
    const isDirectIndex = resolvedFinalSegment.value.kind === 'index';
    const isStructuralIndexOperation =
      isDirectIndex && (action.op === 'set' || action.op === 'add' || action.op === 'delete');
    const isLengthSet =
      action.op === 'set' &&
      resolvedFinalSegment.value.kind === 'property' &&
      resolvedFinalSegment.value.key === 'length';

    if (isStructuralIndexOperation || isLengthSet) structuralArrayParent = parent;
  }

  return {
    success: true,
    value: { path, structuralArrayParent },
  };
}

export function areActionsOrderDependent(left: Action, right: Action): boolean {
  const leftAnalysis = analyzeActionPath(left);
  const rightAnalysis = analyzeActionPath(right);
  if (!leftAnalysis.success || !rightAnalysis.success) return true;

  const leftPath = leftAnalysis.value.path;
  const rightPath = rightAnalysis.value.path;
  if (pathsOverlap(leftPath, rightPath)) return true;

  const leftArrayParent = leftAnalysis.value.structuralArrayParent;
  if (leftArrayParent && isAtOrUnderPath(rightPath, leftArrayParent)) return true;

  const rightArrayParent = rightAnalysis.value.structuralArrayParent;
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
