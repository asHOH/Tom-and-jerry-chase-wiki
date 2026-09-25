import isEqual from 'lodash-es/isEqual';

import { squashActions } from '@/lib/edit/actionSquash';
import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { parseActionPath } from './actionPath';
import { applyCheckedAction } from './checkedActionReplay';

/** Operator-reviewed identities, not a reconstruction of the contributor's original list. */
export type ReviewedArrayItems = Record<string, Record<string, string | number>>;

/** Prepare a fresh submission of reviewed legacy text edits; never relax approval validation. */
export function preparePendingActionRecovery(
  actions: readonly Readonly<Action>[],
  currentRoot: Record<string, unknown>,
  reviewedItems: ReviewedArrayItems
): ActionHistoryEntry[] {
  const target = structuredClone(currentRoot);
  for (const action of actions) {
    const parsed = parseActionPath(action.path);
    if (
      !parsed.success ||
      action.op !== 'set' ||
      typeof action.oldValue !== 'string' ||
      typeof action.newValue !== 'string'
    ) {
      throw new Error('Recovery only supports reviewed existing text fields');
    }
    let value: unknown = target;
    for (const [index, segment] of parsed.value.segments.entries()) {
      if (Array.isArray(value)) {
        const itemPath = parsed.value.segments.slice(0, index + 1).join('.');
        const identity = reviewedItems[itemPath];
        const item: unknown = value[Number(segment)];
        if (
          !identity ||
          Object.keys(identity).length === 0 ||
          !item ||
          typeof item !== 'object' ||
          !Object.entries(identity).every(
            ([key, expected]) =>
              Object.hasOwn(item, key) && isEqual((item as Record<string, unknown>)[key], expected)
          )
        ) {
          throw new Error(`Review the intended list item: ${itemPath}`);
        }
      }
      if (value === null || typeof value !== 'object' || !Object.hasOwn(value, segment)) {
        throw new Error(`Recovery field no longer exists: ${action.path}`);
      }
      value = (value as Record<string, unknown>)[segment];
    }
    if (!isEqual(value, action.oldValue)) {
      throw new Error(`Recovery would overwrite newer content: ${action.path}`);
    }
    const applied = applyCheckedAction(target, action);
    if (!applied.success) throw new Error(`Recovery replay failed: ${action.path}`);
  }
  return squashActions([...actions], { currentRoot: target });
}
