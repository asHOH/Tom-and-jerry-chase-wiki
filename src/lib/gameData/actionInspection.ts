import isEqual from 'lodash-es/isEqual';

import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { areActionsOrderDependent, groupActionEntriesByDependency } from './actionDependencies';
import { projectLegacyAction, type ActionPatchTargetRegistry } from './actionPatchVerification';
import { parseActionPath } from './actionPath';
import { decodeStoredActionRow } from './actionRowDecoder';

export const LARGE_ACTION_PAYLOAD_BYTES = 10_000;
const MAX_DIFF_ITEMS = 25;

export type ActionInspectionRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
  status: string;
  is_public: boolean;
  message: string | null;
};

export type ActionInspectionReport = {
  rows: ActionInspectionItem[];
  malformedRows: Array<{ rowId: string; code: string }>;
  dependencyGroups: Array<{ entityType: string; rowIds: string[] }>;
  chainLinks: Array<{
    entityType: string;
    path: string;
    previousRowId: string;
    nextRowId: string;
    matches: boolean;
  }>;
  overlapHistory: ActionInspectionHistoryItem[];
};

export type ActionInspectionItem = {
  rowId: string;
  actionIndex: number;
  createdAt: string;
  status: string;
  isPublic: boolean;
  entityType: string;
  op: Action['op'];
  path: string;
  oldBytes: number | null;
  newBytes: number | null;
  largePayload: boolean;
  sourceExists: boolean;
  sourceMatch: 'old' | 'new' | 'both' | 'neither' | 'unavailable';
  message: string | null;
  values?: {
    oldValue?: unknown;
    newValue?: unknown;
    sourceValue?: unknown;
  };
  largePayloadSummary?: {
    oldValue: ValueSummary;
    newValue: ValueSummary;
    sourceValue: ValueSummary;
    difference: ValueDifference;
  };
};

export type ActionInspectionHistoryItem = {
  rowId: string;
  actionIndex: number;
  createdAt: string;
  status: string;
  isPublic: boolean;
  entityType: string;
  op: Action['op'];
  path: string;
  matchingSelectedRowIds: string[];
};

type ValueIdentity = { key: 'id' | 'name'; value: string };

type ValueSummary =
  | { kind: 'absent' }
  | { kind: 'null' }
  | { kind: 'string'; bytes: number; length: number }
  | { kind: 'number' | 'boolean'; value: number | boolean }
  | { kind: 'array'; bytes: number; length: number; identityKey: 'id' | 'name' | 'index' }
  | {
      kind: 'object';
      bytes: number;
      keys: string[];
      identity?: ValueIdentity;
      type?: string;
    }
  | { kind: 'unsupported'; type: string };

type ValueDifference =
  | { kind: 'equal' }
  | { kind: 'value'; oldValue: ValueSummary; newValue: ValueSummary }
  | {
      kind: 'object';
      addedKeys: string[];
      removedKeys: string[];
      changedKeys: Array<{
        key: string;
        oldValue: ValueSummary;
        newValue: ValueSummary;
        arrayDifference?: ArrayDifference;
      }>;
      truncatedChangedKeys: number;
    }
  | ArrayDifference;

type ArrayDifference =
  | {
      kind: 'array-by-identity';
      identityKey: 'id' | 'name';
      oldLength: number;
      newLength: number;
      added: string[];
      removed: string[];
      moved: string[];
      changed: Array<{ identity: string; oldValue: ValueSummary; newValue: ValueSummary }>;
      truncated: { added: number; removed: number; moved: number; changed: number };
    }
  | {
      kind: 'array-by-index';
      oldLength: number;
      newLength: number;
      commonPrefixLength: number;
      commonSuffixLength: number;
      changedCount: number;
      changed: Array<{ index: number; oldValue: ValueSummary; newValue: ValueSummary }>;
      truncatedChanged: number;
    };

type DecodedInspectionRow = {
  row: ActionInspectionRow;
  actions: readonly (Action & { path: string })[];
};

type ReadResult = { exists: boolean; value: unknown };

function compareRows(left: ActionInspectionRow, right: ActionInspectionRow): number {
  return left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id);
}

function jsonBytes(value: unknown): number | null {
  if (value === undefined) return null;
  const serialized = JSON.stringify(value);
  return serialized === undefined ? null : new TextEncoder().encode(serialized).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identityForObject(value: Record<string, unknown>): ValueIdentity | undefined {
  if (typeof value.id === 'string') return { key: 'id', value: value.id };
  if (typeof value.name === 'string') return { key: 'name', value: value.name };
  return undefined;
}

function identityKey(values: readonly unknown[]): 'id' | 'name' | 'index' {
  if (values.length === 0) return 'index';

  for (const key of ['id', 'name'] as const) {
    const identities = values.map((value) => (isRecord(value) ? value[key] : undefined));
    if (
      identities.every((identity): identity is string => typeof identity === 'string') &&
      new Set(identities).size === identities.length
    ) {
      return key;
    }
  }
  return 'index';
}

function sharedIdentityKey(
  oldValues: readonly unknown[],
  newValues: readonly unknown[]
): 'id' | 'name' | 'index' {
  for (const key of ['id', 'name'] as const) {
    if (identityKey(oldValues) === key && identityKey(newValues) === key) return key;
  }
  return 'index';
}

function summarizeValue(value: unknown): ValueSummary {
  if (value === undefined) return { kind: 'absent' };
  if (value === null) return { kind: 'null' };
  if (typeof value === 'string') {
    return { kind: 'string', bytes: jsonBytes(value)!, length: value.length };
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return typeof value === 'number' ? { kind: 'number', value } : { kind: 'boolean', value };
  }
  if (Array.isArray(value)) {
    return {
      kind: 'array',
      bytes: jsonBytes(value)!,
      length: value.length,
      identityKey: identityKey(value),
    };
  }
  if (isRecord(value)) {
    const identity = identityForObject(value);
    return {
      kind: 'object',
      bytes: jsonBytes(value)!,
      keys: Object.keys(value).sort((left, right) => left.localeCompare(right)),
      ...(identity === undefined ? {} : { identity }),
      ...(typeof value.type === 'string' ? { type: value.type } : {}),
    };
  }
  return { kind: 'unsupported', type: typeof value };
}

function takeWithCount<T>(values: readonly T[]): { values: T[]; truncated: number } {
  return {
    values: values.slice(0, MAX_DIFF_ITEMS),
    truncated: Math.max(0, values.length - MAX_DIFF_ITEMS),
  };
}

function createIdentityArrayDifference(
  oldValues: readonly unknown[],
  newValues: readonly unknown[],
  key: 'id' | 'name'
): ArrayDifference {
  const oldIds = oldValues.map((value) => (value as Record<string, unknown>)[key] as string);
  const newIds = newValues.map((value) => (value as Record<string, unknown>)[key] as string);
  const oldById = new Map(oldIds.map((identity, index) => [identity, oldValues[index]]));
  const newById = new Map(newIds.map((identity, index) => [identity, newValues[index]]));
  const added = newIds.filter((identity) => !oldById.has(identity));
  const removed = oldIds.filter((identity) => !newById.has(identity));
  const moved = oldIds.filter(
    (identity, index) => newById.has(identity) && newIds.indexOf(identity) !== index
  );
  const changed = oldIds
    .filter(
      (identity) => newById.has(identity) && !isEqual(oldById.get(identity), newById.get(identity))
    )
    .map((identity) => ({
      identity,
      oldValue: summarizeValue(oldById.get(identity)),
      newValue: summarizeValue(newById.get(identity)),
    }));
  const addedPage = takeWithCount(added);
  const removedPage = takeWithCount(removed);
  const movedPage = takeWithCount(moved);
  const changedPage = takeWithCount(changed);

  return {
    kind: 'array-by-identity',
    identityKey: key,
    oldLength: oldValues.length,
    newLength: newValues.length,
    added: addedPage.values,
    removed: removedPage.values,
    moved: movedPage.values,
    changed: changedPage.values,
    truncated: {
      added: addedPage.truncated,
      removed: removedPage.truncated,
      moved: movedPage.truncated,
      changed: changedPage.truncated,
    },
  };
}

function createIndexArrayDifference(
  oldValues: readonly unknown[],
  newValues: readonly unknown[]
): ArrayDifference {
  const maximumLength = Math.max(oldValues.length, newValues.length);
  let commonPrefixLength = 0;
  while (
    commonPrefixLength < Math.min(oldValues.length, newValues.length) &&
    isEqual(oldValues[commonPrefixLength], newValues[commonPrefixLength])
  ) {
    commonPrefixLength += 1;
  }

  let commonSuffixLength = 0;
  while (
    commonSuffixLength < Math.min(oldValues.length, newValues.length) - commonPrefixLength &&
    isEqual(
      oldValues[oldValues.length - 1 - commonSuffixLength],
      newValues[newValues.length - 1 - commonSuffixLength]
    )
  ) {
    commonSuffixLength += 1;
  }

  const changed = Array.from({ length: maximumLength }, (_, index) => index)
    .filter((index) => !isEqual(oldValues[index], newValues[index]))
    .map((index) => ({
      index,
      oldValue: summarizeValue(oldValues[index]),
      newValue: summarizeValue(newValues[index]),
    }));
  const changedPage = takeWithCount(changed);

  return {
    kind: 'array-by-index',
    oldLength: oldValues.length,
    newLength: newValues.length,
    commonPrefixLength,
    commonSuffixLength,
    changedCount: changed.length,
    changed: changedPage.values,
    truncatedChanged: changedPage.truncated,
  };
}

function createArrayDifference(
  oldValues: readonly unknown[],
  newValues: readonly unknown[]
): ArrayDifference {
  const key = sharedIdentityKey(oldValues, newValues);
  return key === 'index'
    ? createIndexArrayDifference(oldValues, newValues)
    : createIdentityArrayDifference(oldValues, newValues, key);
}

function createObjectDifference(
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): ValueDifference {
  const oldKeys = Object.keys(oldValue);
  const newKeys = Object.keys(newValue);
  const addedKeys = newKeys.filter((key) => !Object.hasOwn(oldValue, key)).sort();
  const removedKeys = oldKeys.filter((key) => !Object.hasOwn(newValue, key)).sort();
  const changed = oldKeys
    .filter((key) => Object.hasOwn(newValue, key) && !isEqual(oldValue[key], newValue[key]))
    .sort()
    .map((key) => ({
      key,
      oldValue: summarizeValue(oldValue[key]),
      newValue: summarizeValue(newValue[key]),
      ...(Array.isArray(oldValue[key]) && Array.isArray(newValue[key])
        ? { arrayDifference: createArrayDifference(oldValue[key], newValue[key]) }
        : {}),
    }));
  const changedPage = takeWithCount(changed);
  return {
    kind: 'object',
    addedKeys,
    removedKeys,
    changedKeys: changedPage.values,
    truncatedChangedKeys: changedPage.truncated,
  };
}

function createValueDifference(oldValue: unknown, newValue: unknown): ValueDifference {
  if (isEqual(oldValue, newValue)) return { kind: 'equal' };
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return createArrayDifference(oldValue, newValue);
  }
  if (isRecord(oldValue) && isRecord(newValue)) {
    return createObjectDifference(oldValue, newValue);
  }
  return { kind: 'value', oldValue: summarizeValue(oldValue), newValue: summarizeValue(newValue) };
}

function readAtPath(target: Record<string, unknown>, path: string): ReadResult {
  const parsed = parseActionPath(path);
  if (!parsed.success) return { exists: false, value: undefined };

  let current: unknown = target;
  for (const segment of parsed.value.segments) {
    if ((!isRecord(current) && !Array.isArray(current)) || !Object.hasOwn(current, segment)) {
      return { exists: false, value: undefined };
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return { exists: true, value: current };
}

function stateMatches(read: ReadResult, expected: unknown): boolean {
  return expected === undefined ? !read.exists : read.exists && isEqual(read.value, expected);
}

function sourceMatch(read: ReadResult | null, action: Action): ActionInspectionItem['sourceMatch'] {
  if (read === null) return 'unavailable';
  const oldMatches = stateMatches(read, action.oldValue);
  const newMatches = stateMatches(read, action.newValue);
  if (oldMatches && newMatches) return 'both';
  if (oldMatches) return 'old';
  if (newMatches) return 'new';
  return 'neither';
}

function decodeRows(
  rows: readonly ActionInspectionRow[],
  actor?: string
): { decodedRows: DecodedInspectionRow[]; malformedRows: ActionInspectionReport['malformedRows'] } {
  const decodedRows: DecodedInspectionRow[] = [];
  const malformedRows: ActionInspectionReport['malformedRows'] = [];

  for (const row of [...rows].sort(compareRows)) {
    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) {
      malformedRows.push({ rowId: row.id, code: decoded.error.code });
      continue;
    }
    const actions = decoded.value.actions.map(projectLegacyAction).filter((action) => {
      if (actor === undefined) return true;
      const parsed = parseActionPath(action.path);
      return parsed.success && parsed.value.rootKey === actor;
    });
    if (actions.length > 0) decodedRows.push({ row, actions });
  }

  return { decodedRows, malformedRows };
}

function createDependencyGroups(
  decodedRows: readonly DecodedInspectionRow[]
): ActionInspectionReport['dependencyGroups'] {
  const byEntityType = new Map<string, DecodedInspectionRow[]>();
  for (const decodedRow of decodedRows) {
    const entityType = decodedRow.row.entity_type;
    const rows = byEntityType.get(entityType) ?? [];
    rows.push(decodedRow);
    byEntityType.set(entityType, rows);
  }
  const groups: ActionInspectionReport['dependencyGroups'] = [];

  for (const [entityType, rows] of byEntityType) {
    const dependencyGroups = groupActionEntriesByDependency(
      rows.map(({ actions }) => [...actions] as ActionHistoryEntry)
    );
    for (const indexes of dependencyGroups) {
      if (indexes.length < 2) continue;
      groups.push({ entityType, rowIds: indexes.map((index) => rows[index]!.row.id) });
    }
  }
  return groups;
}

function createChainLinks(
  decodedRows: readonly DecodedInspectionRow[]
): ActionInspectionReport['chainLinks'] {
  const actions = decodedRows.flatMap(({ row, actions: rowActions }) =>
    rowActions.map((action) => ({ row, action }))
  );
  const byPath = new Map<string, typeof actions>();
  for (const item of actions) {
    const key = JSON.stringify([item.row.entity_type, item.action.path]);
    const pathActions = byPath.get(key) ?? [];
    pathActions.push(item);
    byPath.set(key, pathActions);
  }
  const links: ActionInspectionReport['chainLinks'] = [];

  for (const pathActions of byPath.values()) {
    for (let index = 1; index < pathActions.length; index += 1) {
      const previous = pathActions[index - 1]!;
      const next = pathActions[index]!;
      links.push({
        entityType: next.row.entity_type,
        path: next.action.path,
        previousRowId: previous.row.id,
        nextRowId: next.row.id,
        matches: isEqual(previous.action.newValue, next.action.oldValue),
      });
    }
  }
  return links;
}

function createInspectionItems(
  decodedRows: readonly DecodedInspectionRow[],
  targets: ActionPatchTargetRegistry,
  includeValues: boolean
): ActionInspectionItem[] {
  return decodedRows.flatMap(({ row, actions }) =>
    actions.map((action, actionIndex) => {
      const oldBytes = jsonBytes(action.oldValue);
      const newBytes = jsonBytes(action.newValue);
      const largePayload =
        (oldBytes ?? 0) > LARGE_ACTION_PAYLOAD_BYTES ||
        (newBytes ?? 0) > LARGE_ACTION_PAYLOAD_BYTES;
      const entityTarget = targets[row.entity_type];
      const source = entityTarget ? readAtPath(entityTarget, action.path) : null;
      const item: ActionInspectionItem = {
        rowId: row.id,
        actionIndex,
        createdAt: row.created_at,
        status: row.status,
        isPublic: row.is_public,
        entityType: row.entity_type,
        op: action.op,
        path: action.path,
        oldBytes,
        newBytes,
        largePayload,
        sourceExists: source?.exists ?? false,
        sourceMatch: sourceMatch(source, action),
        message: row.message,
      };

      if (largePayload) {
        item.largePayloadSummary = {
          oldValue: summarizeValue(action.oldValue),
          newValue: summarizeValue(action.newValue),
          sourceValue: summarizeValue(source?.value),
          difference: createValueDifference(action.oldValue, action.newValue),
        };
      } else if (includeValues) {
        item.values = {
          ...(action.oldValue === undefined ? {} : { oldValue: action.oldValue }),
          ...(action.newValue === undefined ? {} : { newValue: action.newValue }),
          ...(source?.exists ? { sourceValue: source.value } : {}),
        };
      }
      return item;
    })
  );
}

function createOverlapHistory(
  selectedRows: readonly DecodedInspectionRow[],
  historyRows: readonly ActionInspectionRow[] | undefined
): ActionInspectionReport['overlapHistory'] {
  if (historyRows === undefined) return [];
  const selectedIds = new Set(selectedRows.map(({ row }) => row.id));
  const selectedActions = selectedRows.flatMap(({ row, actions }) =>
    actions.map((action) => ({ row, action }))
  );
  const { decodedRows } = decodeRows(historyRows);

  return decodedRows.flatMap(({ row, actions }) => {
    if (selectedIds.has(row.id)) return [];
    return actions.flatMap((action, actionIndex) => {
      const matches = selectedActions.filter(
        (selected) =>
          selected.row.entity_type === row.entity_type &&
          areActionsOrderDependent(selected.action, action)
      );
      if (matches.length === 0) return [];
      return [
        {
          rowId: row.id,
          actionIndex,
          createdAt: row.created_at,
          status: row.status,
          isPublic: row.is_public,
          entityType: row.entity_type,
          op: action.op,
          path: action.path,
          matchingSelectedRowIds: [
            ...new Set(matches.map(({ row: selectedRow }) => selectedRow.id)),
          ],
        },
      ];
    });
  });
}

export function createActionInspectionReport(options: {
  rows: readonly ActionInspectionRow[];
  targets: ActionPatchTargetRegistry;
  actor?: string;
  includeValues?: boolean;
  historyRows?: readonly ActionInspectionRow[];
}): ActionInspectionReport {
  const { decodedRows, malformedRows } = decodeRows(options.rows, options.actor);
  return {
    rows: createInspectionItems(decodedRows, options.targets, options.includeValues ?? false),
    malformedRows,
    dependencyGroups: createDependencyGroups(decodedRows),
    chainLinks: createChainLinks(decodedRows),
    overlapHistory: createOverlapHistory(decodedRows, options.historyRows),
  };
}

function parseCalendarDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function createBeijingDateRange(
  fromDate: string,
  toDate: string
): { fromUtc: string; toUtc: string } {
  const from = parseCalendarDate(fromDate);
  const to = parseCalendarDate(toDate);
  if (!from || !to) throw new RangeError('Dates must use YYYY-MM-DD and be valid calendar dates');

  const offsetMilliseconds = 8 * 60 * 60 * 1000;
  const fromMilliseconds = Date.UTC(from.year, from.month - 1, from.day) - offsetMilliseconds;
  const toMilliseconds = Date.UTC(to.year, to.month - 1, to.day + 1) - offsetMilliseconds;
  if (fromMilliseconds >= toMilliseconds) throw new RangeError('fromDate must not be after toDate');

  return {
    fromUtc: new Date(fromMilliseconds).toISOString(),
    toUtc: new Date(toMilliseconds).toISOString(),
  };
}
