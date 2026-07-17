import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import type { ActionAuditTargetRegistry } from './actionAuditTargets';
import { groupActionEntriesByDependency } from './actionDependencies';
import type { ActionProcessingErrorCode } from './actionErrors';
import { decodeStoredActionRow } from './actionRowDecoder';
import { applyCheckedActionRow } from './checkedActionReplay';
import { cloneGameDataValue } from './cloneGameDataValue';

export const ACTION_AUDIT_COHORTS = Object.freeze(['approved', 'synced', 'pending'] as const);

export type ActionAuditCohort = (typeof ACTION_AUDIT_COHORTS)[number];

export const ACTION_AUDIT_FINDING_CATEGORIES = Object.freeze([
  'malformed_row',
  'dependent_candidate_cluster',
  'atomic_multi_action_row',
  'checked_replay_failure',
  'unknown_entity_type',
  'known_noop_row',
] as const);

export type ActionAuditFindingCategory = (typeof ACTION_AUDIT_FINDING_CATEGORIES)[number];

type ActionAuditRowBase = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
  created_by: string | null;
};

export type ApprovedActionAuditRow = ActionAuditRowBase & {
  status: 'approved';
  is_public: true;
};

export type SyncedActionAuditRow = ActionAuditRowBase & {
  status: 'synced';
  is_public: true;
};

export type PendingActionAuditRow = ActionAuditRowBase & {
  status: 'pending';
  is_public: boolean;
};

type ReplayableActionAuditRow = ApprovedActionAuditRow | PendingActionAuditRow;
type AnyActionAuditRow = ReplayableActionAuditRow | SyncedActionAuditRow;

type DecodedAuditRow<Row extends AnyActionAuditRow> = {
  row: Row;
  actions: readonly Readonly<Action>[];
};

export type ActionAuditFinding = {
  cohort: ActionAuditCohort;
  category: ActionAuditFindingCategory;
  rowIds: readonly string[];
  fingerprint: string;
  code?: ActionProcessingErrorCode;
};

export type ActionAuditReport = {
  runFingerprint: string;
  cohortCounts: Readonly<
    Record<ActionAuditCohort, { rowCount: number; decodedActionCount: number }>
  >;
  findings: readonly ActionAuditFinding[];
  approvedReplayCompatible: boolean;
  pendingReplayProvisional: boolean;
};

export type RunActionAuditOptions = {
  runFingerprint: string;
  approvedRows: readonly ApprovedActionAuditRow[];
  syncedRows: readonly SyncedActionAuditRow[];
  pendingRows: readonly PendingActionAuditRow[];
  targets: ActionAuditTargetRegistry;
  knownNoopEntityTypes: readonly string[];
};

type MutableCohortCount = { rowCount: number; decodedActionCount: number };

type AuditState = {
  cohortCounts: Record<ActionAuditCohort, MutableCohortCount>;
  findings: ActionAuditFinding[];
};

type AuditCategorySummary = {
  count: number;
  rowCount: number;
  representativeRowIds: string[];
};

export type SanitizedActionAuditSummary = {
  runFingerprint: string;
  cohorts: Record<
    ActionAuditCohort,
    {
      rowCount: number;
      decodedActionCount: number;
      errorCodeCounts: Partial<Record<ActionProcessingErrorCode, number>>;
      categories: Record<ActionAuditFindingCategory, AuditCategorySummary>;
    }
  >;
  approvedReplayCompatibility: {
    pass: boolean;
    malformedRowCount: number;
    checkedReplayFailureCount: number;
  };
  pendingReplayProvisional: boolean;
};

export type ActionAuditDetailSelector =
  | ActionAuditCohort
  | ActionAuditFindingCategory
  | `${ActionAuditCohort}:${ActionAuditFindingCategory}`;

export type ActionAuditDetailItem = {
  cohort: ActionAuditCohort;
  category: ActionAuditFindingCategory;
  fingerprint: string;
  rowId: string;
  code?: ActionProcessingErrorCode;
};

export type ActionAuditDetailPage = {
  runFingerprint: string;
  selector: ActionAuditDetailSelector | 'all';
  itemCount: number;
  totalItemCount: number;
  items: ActionAuditDetailItem[];
  nextCursor?: string;
};

export class ActionAuditCursorError extends Error {
  readonly code: 'invalid_cursor' | 'cursor_fingerprint_mismatch';

  constructor(code: ActionAuditCursorError['code']) {
    super(code === 'invalid_cursor' ? 'Invalid audit detail cursor' : 'Audit data changed');
    this.name = 'ActionAuditCursorError';
    this.code = code;
  }
}

const COHORT_ORDER: Record<ActionAuditCohort, number> = {
  approved: 0,
  synced: 1,
  pending: 2,
};

const MAX_REPRESENTATIVE_IDS = 10;
export const MAX_ACTION_AUDIT_DETAIL_LIMIT = 25;

function createAuditState(options: RunActionAuditOptions): AuditState {
  return {
    cohortCounts: {
      approved: { rowCount: options.approvedRows.length, decodedActionCount: 0 },
      synced: { rowCount: options.syncedRows.length, decodedActionCount: 0 },
      pending: { rowCount: options.pendingRows.length, decodedActionCount: 0 },
    },
    findings: [],
  };
}

function compareRows(left: ActionAuditRowBase, right: ActionAuditRowBase): number {
  return left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id);
}

function fingerprintParts(parts: readonly string[]): string {
  let hash = 0x811c9dc5;
  const input = parts.join('\u001f');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `finding-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function addFinding(
  state: AuditState,
  cohort: ActionAuditCohort,
  category: ActionAuditFindingCategory,
  rowIds: readonly string[],
  code?: ActionProcessingErrorCode
): void {
  const sortedRowIds = [...rowIds].sort((left, right) => left.localeCompare(right));
  state.findings.push(
    Object.freeze({
      cohort,
      category,
      rowIds: Object.freeze(sortedRowIds),
      fingerprint: fingerprintParts([cohort, category, code ?? '', ...sortedRowIds]),
      ...(code === undefined ? {} : { code }),
    })
  );
}

function assertCohortRows(rows: readonly AnyActionAuditRow[], cohort: ActionAuditCohort): void {
  for (const row of rows) {
    const hasExpectedStatus = row.status === cohort;
    const hasExpectedVisibility =
      cohort === 'pending' ? typeof row.is_public === 'boolean' : row.is_public === true;
    if (!hasExpectedStatus || !hasExpectedVisibility) {
      throw new Error(`Invalid ${cohort} audit row contract for ${row.id}`);
    }
  }
}

function decodeRows<Row extends AnyActionAuditRow>(
  rows: readonly Row[],
  cohort: ActionAuditCohort,
  state: AuditState
): DecodedAuditRow<Row>[] {
  const decodedRows: DecodedAuditRow<Row>[] = [];

  for (const row of [...rows].sort(compareRows)) {
    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) {
      addFinding(state, cohort, 'malformed_row', [row.id], decoded.error.code);
      continue;
    }

    state.cohortCounts[cohort].decodedActionCount += decoded.value.actions.length;
    if (decoded.value.actions.length > 1) {
      addFinding(state, cohort, 'atomic_multi_action_row', [row.id]);
    }
    decodedRows.push({ row, actions: decoded.value.actions });
  }

  return decodedRows;
}

function toDependencyEntry(actions: readonly Readonly<Action>[]): ActionHistoryEntry {
  return actions.map((action) => ({
    op: action.op,
    path: action.path,
    oldValue: action.oldValue,
    newValue: action.newValue,
  }));
}

function recordDependentCandidateClusters<Row extends ReplayableActionAuditRow>(
  decodedRows: readonly DecodedAuditRow<Row>[],
  cohort: Extract<ActionAuditCohort, 'approved' | 'pending'>,
  state: AuditState
): void {
  const candidates = new Map<string, DecodedAuditRow<Row>[]>();

  for (const decodedRow of decodedRows) {
    const row = decodedRow.row;
    const key = JSON.stringify([row.created_at, row.created_by, row.entity_type]);
    const group = candidates.get(key);
    if (group) group.push(decodedRow);
    else candidates.set(key, [decodedRow]);
  }

  for (const candidateRows of candidates.values()) {
    if (candidateRows.length < 2) continue;
    const dependencyGroups = groupActionEntriesByDependency(
      candidateRows.map(({ actions }) => toDependencyEntry(actions))
    );

    for (const group of dependencyGroups) {
      if (group.length < 2) continue;
      addFinding(
        state,
        cohort,
        'dependent_candidate_cluster',
        group.map((index) => candidateRows[index]!.row.id)
      );
    }
  }
}

function resolveReplayTargets(
  row: ReplayableActionAuditRow,
  cohort: Extract<ActionAuditCohort, 'approved' | 'pending'>,
  targets: ActionAuditTargetRegistry,
  knownNoopEntityTypes: ReadonlySet<string>,
  state: AuditState
): readonly Record<string, unknown>[] | null {
  if (knownNoopEntityTypes.has(row.entity_type)) {
    addFinding(state, cohort, 'known_noop_row', [row.id]);
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(targets, row.entity_type)) {
    addFinding(state, cohort, 'unknown_entity_type', [row.id]);
    return null;
  }

  return targets[row.entity_type]!;
}

function clonePendingTargets(
  targets: readonly Record<string, unknown>[]
): Record<string, unknown>[] | null {
  const clones: Record<string, unknown>[] = [];
  for (const target of targets) {
    const cloned = cloneGameDataValue(target);
    if (
      !cloned.success ||
      cloned.value === null ||
      typeof cloned.value !== 'object' ||
      Array.isArray(cloned.value)
    ) {
      return null;
    }
    clones.push(cloned.value as Record<string, unknown>);
  }
  return clones;
}

function applyApprovedRows(
  decodedRows: readonly DecodedAuditRow<ApprovedActionAuditRow>[],
  targets: ActionAuditTargetRegistry,
  knownNoopEntityTypes: ReadonlySet<string>,
  state: AuditState
): void {
  for (const { row, actions } of decodedRows) {
    const resolved = resolveReplayTargets(row, 'approved', targets, knownNoopEntityTypes, state);
    if (resolved === null) continue;

    const result = applyCheckedActionRow({ rowId: row.id, actions, targets: resolved });
    if (!result.success) {
      addFinding(state, 'approved', 'checked_replay_failure', [row.id], result.error.code);
    }
  }
}

function applyPendingRows(
  decodedRows: readonly DecodedAuditRow<PendingActionAuditRow>[],
  approvedTargets: ActionAuditTargetRegistry,
  knownNoopEntityTypes: ReadonlySet<string>,
  state: AuditState
): void {
  for (const { row, actions } of decodedRows) {
    const resolved = resolveReplayTargets(
      row,
      'pending',
      approvedTargets,
      knownNoopEntityTypes,
      state
    );
    if (resolved === null) continue;

    const pendingTargets = clonePendingTargets(resolved);
    if (pendingTargets === null) {
      addFinding(state, 'pending', 'checked_replay_failure', [row.id], 'clone_failed');
      continue;
    }

    const result = applyCheckedActionRow({ rowId: row.id, actions, targets: pendingTargets });
    if (!result.success) {
      addFinding(state, 'pending', 'checked_replay_failure', [row.id], result.error.code);
    }
  }
}

function countFindings(
  findings: readonly ActionAuditFinding[],
  cohort: ActionAuditCohort,
  category: ActionAuditFindingCategory
): number {
  return findings.filter((finding) => finding.cohort === cohort && finding.category === category)
    .length;
}

export function runActionAudit(options: RunActionAuditOptions): ActionAuditReport {
  assertCohortRows(options.approvedRows, 'approved');
  assertCohortRows(options.syncedRows, 'synced');
  assertCohortRows(options.pendingRows, 'pending');

  const state = createAuditState(options);
  const approvedRows = decodeRows(options.approvedRows, 'approved', state);
  decodeRows(options.syncedRows, 'synced', state);
  const pendingRows = decodeRows(options.pendingRows, 'pending', state);

  recordDependentCandidateClusters(approvedRows, 'approved', state);
  recordDependentCandidateClusters(pendingRows, 'pending', state);

  const knownNoopEntityTypes = new Set(options.knownNoopEntityTypes);
  applyApprovedRows(approvedRows, options.targets, knownNoopEntityTypes, state);

  const approvedMalformedCount = countFindings(state.findings, 'approved', 'malformed_row');
  const approvedReplayFailureCount = countFindings(
    state.findings,
    'approved',
    'checked_replay_failure'
  );
  const pendingReplayProvisional = approvedMalformedCount + approvedReplayFailureCount > 0;

  applyPendingRows(pendingRows, options.targets, knownNoopEntityTypes, state);

  return Object.freeze({
    runFingerprint: options.runFingerprint,
    cohortCounts: Object.freeze({
      approved: Object.freeze({ ...state.cohortCounts.approved }),
      synced: Object.freeze({ ...state.cohortCounts.synced }),
      pending: Object.freeze({ ...state.cohortCounts.pending }),
    }),
    findings: Object.freeze([...state.findings]),
    approvedReplayCompatible: approvedMalformedCount === 0 && approvedReplayFailureCount === 0,
    pendingReplayProvisional,
  });
}

function createEmptyCategorySummary(): Record<ActionAuditFindingCategory, AuditCategorySummary> {
  const empty = (): AuditCategorySummary => ({
    count: 0,
    rowCount: 0,
    representativeRowIds: [],
  });

  return {
    malformed_row: empty(),
    dependent_candidate_cluster: empty(),
    atomic_multi_action_row: empty(),
    checked_replay_failure: empty(),
    unknown_entity_type: empty(),
    known_noop_row: empty(),
  };
}

function createCohortSummary(report: ActionAuditReport, cohort: ActionAuditCohort, limit: number) {
  const errorCodeCounts: Partial<Record<ActionProcessingErrorCode, number>> = {};
  const categories = createEmptyCategorySummary();

  for (const finding of report.findings) {
    if (finding.cohort !== cohort) continue;
    const category = categories[finding.category];
    category.count += 1;
    category.rowCount += finding.rowIds.length;
    for (const rowId of finding.rowIds) {
      if (
        category.representativeRowIds.length < limit &&
        !category.representativeRowIds.includes(rowId)
      ) {
        category.representativeRowIds.push(rowId);
      }
    }
    if (finding.code !== undefined) {
      errorCodeCounts[finding.code] = (errorCodeCounts[finding.code] ?? 0) + 1;
    }
  }

  return {
    rowCount: report.cohortCounts[cohort].rowCount,
    decodedActionCount: report.cohortCounts[cohort].decodedActionCount,
    errorCodeCounts,
    categories,
  };
}

export function createSanitizedActionAuditSummary(
  report: ActionAuditReport,
  representativeIdLimit = 5
): SanitizedActionAuditSummary {
  if (
    !Number.isInteger(representativeIdLimit) ||
    representativeIdLimit < 1 ||
    representativeIdLimit > MAX_REPRESENTATIVE_IDS
  ) {
    throw new RangeError(`representativeIdLimit must be between 1 and ${MAX_REPRESENTATIVE_IDS}`);
  }

  const approved = createCohortSummary(report, 'approved', representativeIdLimit);
  const synced = createCohortSummary(report, 'synced', representativeIdLimit);
  const pending = createCohortSummary(report, 'pending', representativeIdLimit);

  return {
    runFingerprint: report.runFingerprint,
    cohorts: { approved, synced, pending },
    approvedReplayCompatibility: {
      pass: report.approvedReplayCompatible,
      malformedRowCount: approved.categories.malformed_row.count,
      checkedReplayFailureCount: approved.categories.checked_replay_failure.count,
    },
    pendingReplayProvisional: report.pendingReplayProvisional,
  };
}

function compareFindings(left: ActionAuditFinding, right: ActionAuditFinding): number {
  return (
    COHORT_ORDER[left.cohort] - COHORT_ORDER[right.cohort] ||
    left.category.localeCompare(right.category) ||
    left.fingerprint.localeCompare(right.fingerprint)
  );
}

function matchesSelector(
  finding: ActionAuditFinding,
  selector: ActionAuditDetailSelector | 'all'
): boolean {
  if (selector === 'all') return true;
  if ((ACTION_AUDIT_COHORTS as readonly string[]).includes(selector)) {
    return finding.cohort === selector;
  }
  if ((ACTION_AUDIT_FINDING_CATEGORIES as readonly string[]).includes(selector)) {
    return finding.category === selector;
  }
  return selector === `${finding.cohort}:${finding.category}`;
}

function encodeCursor(payload: { fingerprint: string; selector: string; offset: number }): string {
  return btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeCursor(cursor: string): { fingerprint: string; selector: string; offset: number } {
  try {
    const base64 = cursor.replaceAll('-', '+').replaceAll('_', '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(atob(`${base64}${padding}`)) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      typeof (parsed as { fingerprint?: unknown }).fingerprint !== 'string' ||
      typeof (parsed as { selector?: unknown }).selector !== 'string' ||
      !Number.isInteger((parsed as { offset?: unknown }).offset) ||
      ((parsed as { offset: number }).offset ?? -1) < 0
    ) {
      throw new Error('Invalid cursor payload');
    }
    return parsed as { fingerprint: string; selector: string; offset: number };
  } catch {
    throw new ActionAuditCursorError('invalid_cursor');
  }
}

export function isActionAuditDetailSelector(value: string): value is ActionAuditDetailSelector {
  if ((ACTION_AUDIT_COHORTS as readonly string[]).includes(value)) return true;
  if ((ACTION_AUDIT_FINDING_CATEGORIES as readonly string[]).includes(value)) return true;
  const [cohort, category, extra] = value.split(':');
  return (
    extra === undefined &&
    cohort !== undefined &&
    category !== undefined &&
    (ACTION_AUDIT_COHORTS as readonly string[]).includes(cohort) &&
    (ACTION_AUDIT_FINDING_CATEGORIES as readonly string[]).includes(category)
  );
}

export function createActionAuditDetailPage(
  report: ActionAuditReport,
  options: { selector?: ActionAuditDetailSelector; limit?: number; cursor?: string } = {}
): ActionAuditDetailPage {
  const selector = options.selector ?? 'all';
  const limit = options.limit ?? MAX_ACTION_AUDIT_DETAIL_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ACTION_AUDIT_DETAIL_LIMIT) {
    throw new RangeError(`limit must be between 1 and ${MAX_ACTION_AUDIT_DETAIL_LIMIT}`);
  }

  let offset = 0;
  if (options.cursor !== undefined) {
    const cursor = decodeCursor(options.cursor);
    if (cursor.fingerprint !== report.runFingerprint) {
      throw new ActionAuditCursorError('cursor_fingerprint_mismatch');
    }
    if (cursor.selector !== selector) throw new ActionAuditCursorError('invalid_cursor');
    offset = cursor.offset;
  }

  const detailItems = [...report.findings]
    .sort(compareFindings)
    .filter((finding) => matchesSelector(finding, selector))
    .flatMap((finding) =>
      finding.rowIds.map((rowId) => ({
        cohort: finding.cohort,
        category: finding.category,
        fingerprint: finding.fingerprint,
        rowId,
        ...(finding.code === undefined ? {} : { code: finding.code }),
      }))
    );

  if (offset > detailItems.length) throw new ActionAuditCursorError('invalid_cursor');
  const items = detailItems.slice(offset, offset + limit);
  const nextOffset = offset + items.length;

  return {
    runFingerprint: report.runFingerprint,
    selector,
    itemCount: items.length,
    totalItemCount: detailItems.length,
    items,
    ...(nextOffset < detailItems.length
      ? {
          nextCursor: encodeCursor({
            fingerprint: report.runFingerprint,
            selector,
            offset: nextOffset,
          }),
        }
      : {}),
  };
}
