import 'server-only';

import isEqual from 'lodash-es/isEqual';

import { parseActionPath, resolveArraySegment } from './actionPath';
import type { ApprovedCandidateReplayRow } from './approvedCandidateReplay';
import { applyCheckedAction } from './checkedActionReplay';
import { isPublishableEntityType } from './publishableEntityTypes';
import { createApprovedActionSnapshot } from './published/approvedActionSnapshot';
import { getCanonicalGameData } from './published/canonicalSources';
import {
  PublishedGameDataReplayError,
  selectPublishedGameData,
} from './published/selectPublishedDomain';

export class StaleGameDataEditError extends Error {
  constructor(
    readonly detail: {
      entityType: string;
      path: string;
      reason: 'value_changed' | 'array_context_required';
    }
  ) {
    super('stale_edit');
    this.name = 'StaleGameDataEditError';
  }
}

/** Check only new edits. Historical public replay deliberately does not enforce oldValue. */
export function validateActionFreshness(
  currentRows: readonly ApprovedCandidateReplayRow[],
  proposedRows: readonly ApprovedCandidateReplayRow[]
): void {
  const snapshot = createApprovedActionSnapshot(
    currentRows.map((row) => ({
      entityType: row.entityType,
      decodedRow: { rowId: row.rowId, rawEntry: null, actions: row.actions },
    }))
  );
  const targets = new Map<string, Record<string, unknown>>();
  const checkedContainers = new Map<string, string[]>();

  for (const row of proposedRows) {
    if (!isPublishableEntityType(row.entityType)) throw new TypeError('Unknown entity type');
    let target = targets.get(row.entityType);
    if (!target) {
      // Compare the JSON values delivered to the editor, including omitted undefined properties.
      // The detached copy also lets actions in one request see earlier proposed edits safely.
      target = JSON.parse(
        JSON.stringify(
          selectPublishedGameData(row.entityType, getCanonicalGameData(row.entityType), snapshot)
        )
      ) as Record<string, unknown>;
      targets.set(row.entityType, target);
      checkedContainers.set(row.entityType, []);
    }

    for (const [actionIndex, action] of row.actions.entries()) {
      const fail = (
        reason: StaleGameDataEditError['detail']['reason'] = 'value_changed'
      ): never => {
        throw new StaleGameDataEditError({ entityType: row.entityType, path: action.path, reason });
      };
      const parsed = parseActionPath(action.path);
      if (!parsed.success) {
        throw new PublishedGameDataReplayError({
          ...parsed.error,
          rowId: row.rowId,
          actionIndex,
          stage: 'parse',
          operation: action.op,
          path: action.path,
        });
      }
      let parent: Record<string, unknown> | unknown[] = target;
      const { segments } = parsed.value;
      for (const [index, segment] of segments.entries()) {
        const last = index === segments.length - 1;
        if (Array.isArray(parent)) {
          const parentPath = segments.slice(0, index).join('.');
          if (
            !checkedContainers
              .get(row.entityType)!
              .some((path) => parentPath === path || parentPath.startsWith(`${path}.`))
          )
            fail('array_context_required');
          const key = resolveArraySegment(segment, index);
          if (!key.success) {
            throw new PublishedGameDataReplayError({
              ...key.error,
              rowId: row.rowId,
              actionIndex,
              stage: 'parse',
              operation: action.op,
              path: action.path,
            });
          }
          // Insertions/deletions/length changes need a complete before-array. The editor's
          // existing squashActions normalizes these to a parent set when it can prove one.
          if (
            segment === 'length' ||
            (last && (action.op !== 'set' || action.newValue === undefined)) ||
            (key.value.kind === 'index' && key.value.index >= parent.length)
          ) {
            fail('array_context_required');
          }
        }
        const exists = Object.hasOwn(parent, segment);
        const current: unknown = exists ? (parent as Record<string, unknown>)[segment] : undefined;
        if (last) {
          if (action.op === 'add' ? exists : !isEqual(current, action.oldValue)) fail();
          // An omitted oldValue is evidence of absence, never permission to replace a value.
          if (action.oldValue === undefined && exists) fail();
        } else {
          if (current === null || typeof current !== 'object') fail();
          parent = current as Record<string, unknown> | unknown[];
        }
      }
      const applied = applyCheckedAction(target, action);
      if (!applied.success) {
        throw new PublishedGameDataReplayError({
          ...applied.error,
          rowId: row.rowId,
          actionIndex,
          stage: 'apply',
        });
      }
      if (action.newValue !== null && typeof action.newValue === 'object') {
        checkedContainers.get(row.entityType)!.push(action.path);
      }
    }
  }
}
