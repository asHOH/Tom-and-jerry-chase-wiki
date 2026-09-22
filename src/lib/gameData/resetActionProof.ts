import type { Action } from '@/lib/edit/diffUtils';

import { parseActionPath } from './actionPath';
import { applyCheckedAction } from './checkedActionReplay';
import { cloneGameDataValue } from './cloneGameDataValue';

type ValueAtPath = { exists: boolean; value: unknown };

function read(target: unknown, path: string): ValueAtPath {
  let value = target;
  for (const segment of path.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, segment)) {
      return { exists: false, value: undefined };
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return { exists: true, value };
}

/** Reconstructs a mutation only from an earlier concrete reset and its contained writes. */
export function reconstructResetAction(
  actions: readonly Readonly<Action>[],
  index: number,
  scopePath: string
): { before: ValueAtPath; after: ValueAtPath; beforeAction: ValueAtPath } | null {
  for (let start = index - 1; start >= 0; start -= 1) {
    const anchor = actions[start]!;
    const parsed = parseActionPath(anchor.path);
    if (anchor.newValue === undefined || !parsed.success) continue;
    // Property adds are assignments; indexed adds insert and cannot seed a reset.
    if (
      anchor.op !== 'set' &&
      !(anchor.op === 'add' && !/^(?:\d+|length)$/.test(parsed.value.segments.at(-1)!))
    )
      continue;
    const path = parsed.value.path;
    if (scopePath !== path && !scopePath.startsWith(`${path}.`)) continue;
    const sequence = actions.slice(start, index + 1).filter((action) => {
      const next = parseActionPath(action.path);
      return !next.success || next.value.rootKey === parsed.value.rootKey;
    });
    // A sibling structural operation could shift an indexed anchor. Only a wholly
    // contained sequence proves the same starting state on every replay.
    if (
      sequence.some(
        (action) => action.path.trim() !== path && !action.path.trim().startsWith(`${path}.`)
      )
    )
      continue;
    const target: Record<string, unknown> = {};
    let valid = true;
    for (const action of sequence.slice(0, -1)) {
      if (!applyCheckedAction(target, action).success) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;
    const before = cloneGameDataValue(read(target, scopePath));
    const beforeAction = cloneGameDataValue(read(target, actions[index]!.path.trim()));
    if (
      !before.success ||
      !beforeAction.success ||
      !applyCheckedAction(target, actions[index]!).success
    )
      continue;
    return {
      before: before.value as ValueAtPath,
      after: read(target, scopePath),
      beforeAction: beforeAction.value as ValueAtPath,
    };
  }
  return null;
}
