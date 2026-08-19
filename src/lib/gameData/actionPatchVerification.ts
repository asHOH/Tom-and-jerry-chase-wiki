import isEqual from 'lodash-es/isEqual';

import type { Action } from '@/lib/edit/diffUtils';
import { getPositioningTagLevel } from '@/constants/positioningTagSequences';

import { parseActionPath } from './actionPath';
import { decodeStoredActionRow } from './actionRowDecoder';
import { cloneGameDataValue } from './cloneGameDataValue';

export type ActionPatchRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
  status: string;
  is_public: boolean;
};

export type ActionPatchTargetRegistry = Record<string, Record<string, unknown>>;

export type ActionPatchVerificationFailure = {
  rowId: string;
  actionIndex?: number;
  path?: string;
  code:
    | 'invalid_row'
    | 'invalid_status'
    | 'unknown_entity_type'
    | 'clone_failed'
    | 'projection_mismatch'
    | 'ambiguous_array_delete';
  detail?: unknown;
};

export type ActionPatchVerificationResult = {
  verifiedRowIds: string[];
  failures: ActionPatchVerificationFailure[];
};

type ProjectedAction = Action & { path: string };
type DecodedActionPatchRow = { row: ActionPatchRow; actions: ProjectedAction[] };
type ReadResult = { exists: boolean; value: unknown };
type ReverseActionResult =
  | { success: true }
  | { success: false; code: ActionPatchVerificationFailure['code']; detail?: unknown };
type RelationMaterialKey = 'description' | 'isMinor' | 'tags';
type RelationCollection = {
  identities: string[];
  byIdentity: Map<string, Record<string, unknown>>;
};

const RELATION_ARRAY_KEYS = new Set([
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
]);

const POSITIONING_TAG_KEYS = new Set(['catPositioningTags', 'mousePositioningTags']);
const RELATION_MATERIAL_KEYS = [
  'description',
  'isMinor',
  'tags',
] satisfies readonly RelationMaterialKey[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value: unknown): unknown {
  const cloned = cloneGameDataValue(value);
  if (!cloned.success) throw new Error('clone_failed');
  return cloned.value;
}

function normalizePositioningTag(value: unknown): unknown {
  if (!isRecord(value)) return cloneValue(value);

  const normalized = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'isMinor')
      .map(([key, child]) => [key, normalizePositioningContainers(child)])
  );
  if (
    value.level === 0 ||
    value.level === 1 ||
    value.level === 2 ||
    value.level === 3 ||
    value.level === 4 ||
    typeof value.isMinor === 'boolean'
  ) {
    normalized.level = getPositioningTagLevel(value);
  }
  return normalized;
}

function normalizePositioningContainers(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizePositioningContainers);
  if (!isRecord(value)) return cloneValue(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      POSITIONING_TAG_KEYS.has(key) && Array.isArray(child)
        ? child.map(normalizePositioningTag)
        : normalizePositioningContainers(child),
    ])
  );
}

function normalizeValueAtPath(path: readonly string[], value: unknown): unknown {
  const positioningIndex = path.findIndex((segment) => POSITIONING_TAG_KEYS.has(segment));
  if (positioningIndex === -1) return normalizePositioningContainers(value);
  if (path.at(-1) === 'level' && typeof value === 'boolean') return value ? 2 : 4;
  if (path.length === positioningIndex + 1 && Array.isArray(value)) {
    return value.map(normalizePositioningTag);
  }
  if (path.length === positioningIndex + 2 && isRecord(value)) {
    return normalizePositioningTag(value);
  }
  return cloneValue(value);
}

export function projectLegacyAction(action: Readonly<Action>): ProjectedAction {
  const parsed = parseActionPath(action.path);
  if (!parsed.success) return { ...action };

  const segments = [...parsed.value.segments];
  const positioningIndex = segments.findIndex((segment) => POSITIONING_TAG_KEYS.has(segment));
  if (positioningIndex !== -1 && segments.at(-1) === 'isMinor') {
    segments[segments.length - 1] = 'level';
  }

  const path = segments.join('.');
  return {
    op: action.op,
    path,
    oldValue: normalizeValueAtPath(segments, action.oldValue),
    newValue: normalizeValueAtPath(segments, action.newValue),
  };
}

function readAtPath(target: Record<string, unknown>, segments: readonly string[]): ReadResult {
  let current: unknown = target;
  for (const segment of segments) {
    if (!isRecord(current) && !Array.isArray(current)) return { exists: false, value: undefined };
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return { exists: false, value: undefined };
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return { exists: true, value: current };
}

function readParent(
  target: Record<string, unknown>,
  segments: readonly string[]
): { parent: Record<string, unknown> | unknown[]; key: string } | null {
  if (segments.length === 0) return null;
  const parentPath = segments.slice(0, -1);
  const parent = readAtPath(target, parentPath);
  if (!parent.exists || (!isRecord(parent.value) && !Array.isArray(parent.value))) return null;
  return { parent: parent.value, key: segments.at(-1)! };
}

function writeAtPath(
  target: Record<string, unknown>,
  segments: readonly string[],
  value: unknown
): boolean {
  const resolved = readParent(target, segments);
  if (!resolved) return false;
  resolved.parent[resolved.key as keyof typeof resolved.parent] = cloneValue(value) as never;
  return true;
}

function deleteAtPath(target: Record<string, unknown>, segments: readonly string[]): boolean {
  const resolved = readParent(target, segments);
  if (!resolved) return false;
  if (Array.isArray(resolved.parent) && /^\d+$/.test(resolved.key)) {
    const index = Number(resolved.key);
    if (index >= resolved.parent.length) return false;
    resolved.parent.splice(index, 1);
    return true;
  }
  return Reflect.deleteProperty(resolved.parent, resolved.key);
}

function stableIdentity(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.id === 'string') return `id:${value.id}`;
  if (typeof value.name === 'string') return `name:${value.name}`;
  return null;
}

function uniqueIdentities(values: readonly unknown[]): string[] | null {
  const identities = values.map(stableIdentity);
  if (identities.some((identity) => identity === null)) return null;
  const concrete = identities as string[];
  return new Set(concrete).size === concrete.length ? concrete : null;
}

function arrayDiff(expected: readonly unknown[], actual: readonly unknown[]): unknown {
  const expectedIds = uniqueIdentities(expected);
  const actualIds = uniqueIdentities(actual);
  if (!expectedIds || !actualIds) {
    return { expectedLength: expected.length, actualLength: actual.length };
  }

  const expectedById = new Map(expectedIds.map((id, index) => [id, expected[index]]));
  const actualById = new Map(actualIds.map((id, index) => [id, actual[index]]));
  return {
    expectedLength: expected.length,
    actualLength: actual.length,
    added: actualIds.filter((id) => !expectedById.has(id)),
    removed: expectedIds.filter((id) => !actualById.has(id)),
    moved: expectedIds.filter((id, index) => actualById.has(id) && actualIds.indexOf(id) !== index),
    changed: expectedIds.filter(
      (id) => actualById.has(id) && !isEqual(expectedById.get(id), actualById.get(id))
    ),
  };
}

function relationComparable(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value
    .map((item) => {
      if (!isRecord(item)) return item;
      return {
        id: item.id,
        factionId: item.factionId ?? null,
        description: item.description ?? '',
        isMinor: item.isMinor ?? false,
        tags: Array.isArray(item.tags)
          ? [...item.tags].map((tag) => JSON.stringify(tag)).sort()
          : [],
      };
    })
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function relationEndpointIdentity(value: Record<string, unknown>): string | null {
  if (typeof value.id !== 'string') return null;
  if (
    value.factionId !== undefined &&
    value.factionId !== null &&
    typeof value.factionId !== 'string'
  ) {
    return null;
  }
  return JSON.stringify([value.id, value.factionId ?? null]);
}

function relationMaterialValue(value: Record<string, unknown>, key: RelationMaterialKey): unknown {
  if (key === 'description') return value.description ?? '';
  if (key === 'isMinor') return value.isMinor ?? false;
  return Array.isArray(value.tags) ? value.tags.map((tag) => JSON.stringify(tag)).sort() : [];
}

function relationMaterialsMatch(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>
): boolean {
  return RELATION_MATERIAL_KEYS.every((key) =>
    isEqual(relationMaterialValue(expected, key), relationMaterialValue(actual, key))
  );
}

function changedRelationMaterialKeys(
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): RelationMaterialKey[] {
  return RELATION_MATERIAL_KEYS.filter(
    (key) => !isEqual(relationMaterialValue(oldValue, key), relationMaterialValue(newValue, key))
  );
}

function createRelationCollection(value: unknown): RelationCollection | null {
  if (value === undefined) return { identities: [], byIdentity: new Map() };
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) return null;

  const values = value as Record<string, unknown>[];
  const identities = values.map(relationEndpointIdentity);
  if (identities.some((identity) => identity === null)) return null;
  const concreteIdentities = identities as string[];
  if (new Set(concreteIdentities).size !== concreteIdentities.length) return null;
  return {
    identities: concreteIdentities,
    byIdentity: new Map(concreteIdentities.map((identity, index) => [identity, values[index]!])),
  };
}

function relationMismatchDetail(
  reason: string,
  identity?: string,
  field?: RelationMaterialKey
): unknown {
  return {
    reason,
    ...(identity === undefined ? {} : { endpoint: JSON.parse(identity) }),
    ...(field === undefined ? {} : { field }),
  };
}

function restoreRelationMaterial(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  key: RelationMaterialKey
): void {
  if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = cloneValue(source[key]);
  else Reflect.deleteProperty(target, key);
}

function reverseRelationSet(currentValue: unknown, action: ProjectedAction): ReverseActionResult {
  const oldCollection = createRelationCollection(action.oldValue);
  const newCollection = createRelationCollection(action.newValue);
  const currentCollection = createRelationCollection(currentValue);
  if (!oldCollection || !newCollection || !currentCollection || !Array.isArray(currentValue)) {
    return {
      success: false,
      code: 'projection_mismatch',
      detail: relationMismatchDetail('invalid_relation_array'),
    };
  }

  const added = newCollection.identities.filter(
    (identity) => !oldCollection.byIdentity.has(identity)
  );
  const removed = oldCollection.identities.filter(
    (identity) => !newCollection.byIdentity.has(identity)
  );
  const changed = oldCollection.identities
    .filter((identity) => newCollection.byIdentity.has(identity))
    .map((identity) => ({
      identity,
      oldValue: oldCollection.byIdentity.get(identity)!,
      newValue: newCollection.byIdentity.get(identity)!,
    }))
    .map((item) => ({
      ...item,
      keys: changedRelationMaterialKeys(item.oldValue, item.newValue),
    }))
    .filter(({ keys }) => keys.length > 0);

  for (const identity of added) {
    const expected = newCollection.byIdentity.get(identity)!;
    const actual = currentCollection.byIdentity.get(identity);
    if (!actual || !relationMaterialsMatch(expected, actual)) {
      return {
        success: false,
        code: 'projection_mismatch',
        detail: relationMismatchDetail('added_endpoint_mismatch', identity),
      };
    }
  }
  for (const identity of removed) {
    if (currentCollection.byIdentity.has(identity)) {
      return {
        success: false,
        code: 'projection_mismatch',
        detail: relationMismatchDetail('removed_endpoint_present', identity),
      };
    }
  }
  for (const { identity, newValue, keys } of changed) {
    const actual = currentCollection.byIdentity.get(identity);
    if (!actual) {
      return {
        success: false,
        code: 'projection_mismatch',
        detail: relationMismatchDetail('changed_endpoint_missing', identity),
      };
    }
    const mismatchedKey = keys.find(
      (key) => !isEqual(relationMaterialValue(newValue, key), relationMaterialValue(actual, key))
    );
    if (mismatchedKey) {
      return {
        success: false,
        code: 'projection_mismatch',
        detail: relationMismatchDetail('changed_material_mismatch', identity, mismatchedKey),
      };
    }
  }

  const addedSet = new Set(added);
  for (let index = currentValue.length - 1; index >= 0; index -= 1) {
    const identity = relationEndpointIdentity(currentValue[index] as Record<string, unknown>);
    if (identity && addedSet.has(identity)) currentValue.splice(index, 1);
  }
  for (const { identity, oldValue, keys } of changed) {
    const actual = currentCollection.byIdentity.get(identity)!;
    for (const key of keys) restoreRelationMaterial(actual, oldValue, key);
  }
  for (const identity of removed) {
    currentValue.push(cloneValue(oldCollection.byIdentity.get(identity)!));
  }
  return { success: true };
}

function isOldValueLessRelationSnapshot(action: ProjectedAction): boolean {
  if (action.op !== 'set' || action.oldValue !== undefined) return false;
  const parsed = parseActionPath(action.path);
  return (
    parsed.success &&
    parsed.value.segments.length === 2 &&
    RELATION_ARRAY_KEYS.has(parsed.value.segments[1]!)
  );
}

function relationSnapshotSubsumes(earlier: ProjectedAction, later: ProjectedAction): boolean {
  if (
    !isOldValueLessRelationSnapshot(earlier) ||
    !isOldValueLessRelationSnapshot(later) ||
    earlier.path !== later.path
  ) {
    return false;
  }

  const earlierCollection = createRelationCollection(earlier.newValue);
  const laterCollection = createRelationCollection(later.newValue);
  if (!earlierCollection || !laterCollection || earlierCollection.identities.length === 0) {
    return false;
  }

  return earlierCollection.identities.every((identity) => {
    const earlierEndpoint = earlierCollection.byIdentity.get(identity)!;
    const laterEndpoint = laterCollection.byIdentity.get(identity);
    return laterEndpoint !== undefined && relationMaterialsMatch(earlierEndpoint, laterEndpoint);
  });
}

function findSubsumedRelationSnapshots(
  decodedRows: readonly DecodedActionPatchRow[]
): Set<ProjectedAction> {
  const orderedActions = decodedRows.flatMap(({ row, actions }) =>
    actions.map((action) => ({ action, entityType: row.entity_type }))
  );
  const subsumed = new Set<ProjectedAction>();

  for (let index = 0; index < orderedActions.length; index += 1) {
    const earlier = orderedActions[index]!;
    const hasCoveringLaterSnapshot = orderedActions
      .slice(index + 1)
      .some(
        (later) =>
          later.entityType === earlier.entityType &&
          relationSnapshotSubsumes(earlier.action, later.action)
      );
    if (hasCoveringLaterSnapshot) subsumed.add(earlier.action);
  }

  return subsumed;
}

function valuesMatch(path: readonly string[], expected: unknown, actual: unknown): boolean {
  const relationKey = path[1];
  return relationKey && RELATION_ARRAY_KEYS.has(relationKey)
    ? isEqual(relationComparable(expected), relationComparable(actual))
    : isEqual(expected, actual);
}

function mismatchDetail(expected: unknown, actual: unknown): unknown {
  if (Array.isArray(expected) && Array.isArray(actual)) return arrayDiff(expected, actual);
  return {
    expectedType: expected === null ? 'null' : typeof expected,
    actualType: actual === null ? 'null' : typeof actual,
  };
}

function reverseAction(
  target: Record<string, unknown>,
  action: ProjectedAction
): ReverseActionResult {
  const parsed = parseActionPath(action.path);
  if (!parsed.success) return { success: false, code: 'projection_mismatch' };
  const segments = parsed.value.segments;
  const resolved = readParent(target, segments);
  const current = readAtPath(target, segments);
  if (
    action.op === 'set' &&
    segments.length === 2 &&
    RELATION_ARRAY_KEYS.has(segments[1]!) &&
    current.exists
  ) {
    return reverseRelationSet(current.value, action);
  }
  const isDelete = action.op === 'delete' || (action.op === 'set' && action.newValue === undefined);

  if (isDelete) {
    if (resolved && Array.isArray(resolved.parent) && /^\d+$/.test(resolved.key)) {
      const identity = stableIdentity(action.oldValue);
      if (!identity) return { success: false, code: 'ambiguous_array_delete' };
      const identities = uniqueIdentities(resolved.parent);
      const index = Number(resolved.key);
      if (!identities || identities.includes(identity) || index > resolved.parent.length) {
        return { success: false, code: 'projection_mismatch' };
      }
      resolved.parent.splice(index, 0, cloneValue(action.oldValue));
      return { success: true };
    }
    if (current.exists) {
      return {
        success: false,
        code: 'projection_mismatch',
        detail: mismatchDetail(undefined, current.value),
      };
    }
    if (action.oldValue === undefined) {
      return { success: false, code: 'projection_mismatch' };
    }
    return writeAtPath(target, segments, action.oldValue)
      ? { success: true }
      : { success: false, code: 'projection_mismatch' };
  }

  if (!current.exists || !valuesMatch(segments, action.newValue, current.value)) {
    return {
      success: false,
      code: 'projection_mismatch',
      detail: mismatchDetail(action.newValue, current.value),
    };
  }

  if (action.op === 'add') {
    return deleteAtPath(target, segments)
      ? { success: true }
      : { success: false, code: 'projection_mismatch' };
  }
  if (action.oldValue === undefined) {
    return deleteAtPath(target, segments)
      ? { success: true }
      : { success: false, code: 'projection_mismatch' };
  }
  return writeAtPath(target, segments, action.oldValue)
    ? { success: true }
    : { success: false, code: 'projection_mismatch' };
}

function compareRows(left: ActionPatchRow, right: ActionPatchRow): number {
  return left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id);
}

export function verifyActionPatch(
  rows: readonly ActionPatchRow[],
  targets: ActionPatchTargetRegistry
): ActionPatchVerificationResult {
  const failures: ActionPatchVerificationFailure[] = [];
  const decoded: (DecodedActionPatchRow | null)[] = [...rows].sort(compareRows).map((row) => {
    if (row.status !== 'approved' || !row.is_public) {
      failures.push({ rowId: row.id, code: 'invalid_status' });
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(targets, row.entity_type)) {
      failures.push({ rowId: row.id, code: 'unknown_entity_type' });
      return null;
    }
    const result = decodeStoredActionRow(row);
    if (!result.success) {
      failures.push({ rowId: row.id, code: 'invalid_row', detail: result.error.code });
      return null;
    }
    return { row, actions: result.value.actions.map(projectLegacyAction) };
  });

  if (failures.length > 0) return { verifiedRowIds: [], failures };

  const workingTargets: ActionPatchTargetRegistry = {};
  try {
    for (const [entityType, target] of Object.entries(targets)) {
      workingTargets[entityType] = cloneValue(target) as Record<string, unknown>;
    }
  } catch {
    return {
      verifiedRowIds: [],
      failures: [{ rowId: rows[0]?.id ?? 'unknown', code: 'clone_failed' }],
    };
  }

  const decodedRows = decoded.filter((item): item is DecodedActionPatchRow => item !== null);
  const subsumedRelationSnapshots = findSubsumedRelationSnapshots(decodedRows);

  for (const decodedRow of decodedRows.toReversed()) {
    const target = workingTargets[decodedRow.row.entity_type]!;
    for (let actionIndex = decodedRow.actions.length - 1; actionIndex >= 0; actionIndex -= 1) {
      const action = decodedRow.actions[actionIndex]!;
      if (subsumedRelationSnapshots.has(action)) continue;
      const result = reverseAction(target, action);
      if (!result.success) {
        failures.push({
          rowId: decodedRow.row.id,
          actionIndex,
          path: action.path,
          code: result.code,
          ...(result.detail === undefined ? {} : { detail: result.detail }),
        });
        break;
      }
    }
  }

  return {
    verifiedRowIds: failures.length === 0 ? decodedRows.map((item) => item.row.id) : [],
    failures,
  };
}
