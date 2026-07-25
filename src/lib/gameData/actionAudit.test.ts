import type { Action } from '@/lib/edit/diffUtils';

import {
  ActionAuditCursorError,
  createActionAuditDetailPage,
  createSanitizedActionAuditSummary,
  runActionAudit,
  type ApprovedActionAuditRow,
  type PendingActionAuditRow,
  type SyncedActionAuditRow,
} from './actionAudit';
import type { ActionAuditTargetRegistry } from './actionAuditTargets';

const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});

const remove = (path: string, oldValue: unknown): Action => ({
  op: 'delete',
  path,
  oldValue,
  newValue: undefined,
});

const baseRow = (id: string, entry: unknown, entityType = 'characters') => ({
  id,
  entity_type: entityType,
  entry,
  created_at: '2026-07-18T00:00:00.000Z',
  created_by: 'author-1',
});

const approvedRow = (
  id: string,
  entry: unknown,
  overrides: Partial<ApprovedActionAuditRow> = {}
): ApprovedActionAuditRow => ({
  ...baseRow(id, entry),
  status: 'approved',
  is_public: true,
  ...overrides,
});

const syncedRow = (
  id: string,
  entry: unknown,
  overrides: Partial<SyncedActionAuditRow> = {}
): SyncedActionAuditRow => ({
  ...baseRow(id, entry),
  status: 'synced',
  is_public: false,
  ...overrides,
});

const pendingRow = (
  id: string,
  entry: unknown,
  overrides: Partial<PendingActionAuditRow> = {}
): PendingActionAuditRow => ({
  ...baseRow(id, entry),
  status: 'pending',
  is_public: false,
  ...overrides,
});

const characterTargets = (
  characters: Record<string, unknown> = { Tom: { value: 'baseline' } }
): ActionAuditTargetRegistry => ({ characters: [characters] });

describe('runActionAudit', () => {
  it('classifies all cohorts while keeping synced rows out of target resolution', () => {
    const targets = new Proxy(characterTargets(), {
      get(target, property, receiver) {
        if (property === 'syncedOnly') throw new Error('synced target resolution is forbidden');
        return Reflect.get(target, property, receiver) as unknown;
      },
    });

    const report = runActionAudit({
      runFingerprint: 'audit-all-cohorts',
      approvedRows: [
        approvedRow('approved-malformed', [
          set('Tom.value', 'baseline', 'changed'),
          { op: 'set', path: '', oldValue: 'bad', newValue: 'bad' },
        ]),
      ],
      syncedRows: [
        syncedRow(
          'synced-atomic',
          [set('Tom.value', 'old', 'one'), set('Tom.other', undefined, 'two')],
          { entity_type: 'syncedOnly' }
        ),
      ],
      pendingRows: [pendingRow('pending-valid', set('Tom.value', 'baseline', 'pending'))],
      targets,
      knownNoopEntityTypes: [],
    });

    expect(report.cohortCounts).toEqual({
      approved: { rowCount: 1, decodedActionCount: 0 },
      synced: { rowCount: 1, decodedActionCount: 2 },
      pending: { rowCount: 1, decodedActionCount: 1 },
    });
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cohort: 'approved',
          category: 'malformed_row',
          rowIds: ['approved-malformed'],
        }),
        expect.objectContaining({
          cohort: 'synced',
          category: 'atomic_multi_action_row',
          rowIds: ['synced-atomic'],
        }),
      ])
    );
    expect(report.pendingReplayProvisional).toBe(true);
  });

  it('accumulates approved rows in database order and isolates every pending row', () => {
    const targets = characterTargets();
    const report = runActionAudit({
      runFingerprint: 'audit-replay-order',
      approvedRows: [
        approvedRow('approved-2', set('Tom.value', 'first', 'approved'), {
          created_at: '2026-07-18T00:02:00.000Z',
        }),
        approvedRow('approved-1', set('Tom.value', 'baseline', 'first'), {
          created_at: '2026-07-18T00:01:00.000Z',
        }),
      ],
      syncedRows: [],
      pendingRows: [
        pendingRow('pending-1', remove('Tom.value', 'approved')),
        pendingRow('pending-2', remove('Tom.value', 'approved'), {
          created_at: '2026-07-18T00:03:00.000Z',
        }),
      ],
      targets,
      knownNoopEntityTypes: [],
    });

    expect(targets.characters?.[0]).toEqual({ Tom: { value: 'approved' } });
    expect(
      report.findings.filter(
        (finding) => finding.cohort === 'pending' && finding.category === 'checked_replay_failure'
      )
    ).toEqual([]);
    expect(report.approvedReplayCompatible).toBe(true);
    expect(report.pendingReplayProvisional).toBe(false);
  });

  it('reports a transitive dependent candidate cluster without treating its tuple as provenance', () => {
    const targets = characterTargets({
      Tom: { profile: { name: 'Tom', title: 'old' }, description: 'old' },
    });
    const report = runActionAudit({
      runFingerprint: 'audit-cluster',
      approvedRows: [
        approvedRow('cluster-a', set('Tom.profile.name', 'Tom', 'Thomas')),
        approvedRow('cluster-b', set('Tom.profile', {}, { name: 'Thomas', title: 'old' })),
        approvedRow('cluster-c', set('Tom.profile.title', 'old', 'new')),
        approvedRow('not-clustered', set('Tom.description', 'old', 'new'), {
          created_by: 'author-2',
        }),
      ],
      syncedRows: [],
      pendingRows: [],
      targets,
      knownNoopEntityTypes: [],
    });

    expect(
      report.findings.filter((finding) => finding.category === 'dependent_candidate_cluster')
    ).toEqual([
      expect.objectContaining({
        cohort: 'approved',
        rowIds: ['cluster-a', 'cluster-b', 'cluster-c'],
      }),
    ]);
  });

  it('fails compatibility for unknown approved types while allowing reviewed known no-ops', () => {
    const report = runActionAudit({
      runFingerprint: 'audit-entity-types',
      approvedRows: [
        approvedRow('unknown-row', set('cat.value', 'old', 'new'), {
          entity_type: 'factions',
        }),
        approvedRow('noop-row', set('anything.value', 'old', 'new'), {
          entity_type: 'legacyNoop',
        }),
      ],
      syncedRows: [],
      pendingRows: [pendingRow('pending-valid', set('Tom.value', 'baseline', 'pending'))],
      targets: characterTargets(),
      knownNoopEntityTypes: ['legacyNoop'],
    });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'unknown_entity_type', rowIds: ['unknown-row'] }),
        expect.objectContaining({ category: 'known_noop_row', rowIds: ['noop-row'] }),
      ])
    );
    expect(report.approvedReplayCompatible).toBe(false);
    expect(report.pendingReplayProvisional).toBe(true);

    const knownNoopOnlyReport = runActionAudit({
      runFingerprint: 'audit-known-noop',
      approvedRows: [
        approvedRow('noop-row', set('anything.value', 'old', 'new'), {
          entity_type: 'legacyNoop',
        }),
      ],
      syncedRows: [],
      pendingRows: [],
      targets: characterTargets(),
      knownNoopEntityTypes: ['legacyNoop'],
    });

    expect(knownNoopOnlyReport.approvedReplayCompatible).toBe(true);
    expect(knownNoopOnlyReport.pendingReplayProvisional).toBe(false);
  });

  it('records checked replay failures and makes pending output provisional', () => {
    const report = runActionAudit({
      runFingerprint: 'audit-replay-failure',
      approvedRows: [approvedRow('missing-delete', remove('Tom.missing', 'old'))],
      syncedRows: [],
      pendingRows: [pendingRow('pending-row', set('Tom.value', 'baseline', 'pending'))],
      targets: characterTargets(),
      knownNoopEntityTypes: [],
    });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cohort: 'approved',
          category: 'checked_replay_failure',
          code: 'missing_path',
          rowIds: ['missing-delete'],
        }),
      ])
    );
    expect(report.approvedReplayCompatible).toBe(false);
    expect(report.pendingReplayProvisional).toBe(true);
  });
});

describe('sanitized action audit reporting', () => {
  it('reports stable counts and representative IDs without action values', () => {
    const report = runActionAudit({
      runFingerprint: 'audit-summary',
      approvedRows: [
        approvedRow('summary-malformed', { op: 'set', path: '', newValue: 'SECRET_ACTION_VALUE' }),
      ],
      syncedRows: [],
      pendingRows: [],
      targets: characterTargets(),
      knownNoopEntityTypes: [],
    });
    const summary = createSanitizedActionAuditSummary(report, 1);

    expect(summary.approvedReplayCompatibility).toEqual({
      pass: false,
      malformedRowCount: 1,
      checkedReplayFailureCount: 0,
      unknownEntityTypeCount: 0,
    });
    expect(summary.cohorts.approved.errorCodeCounts).toEqual({ invalid_path: 1 });
    expect(summary.cohorts.approved.categories.malformed_row).toEqual({
      count: 1,
      rowCount: 1,
      representativeRowIds: ['summary-malformed'],
    });
    expect(JSON.stringify(summary)).not.toContain('SECRET_ACTION_VALUE');
  });

  it('pages every member of a dependent cluster and binds cursors to the run fingerprint', () => {
    const report = runActionAudit({
      runFingerprint: 'audit-detail-a',
      approvedRows: [
        approvedRow('detail-a', set('Tom.profile.name', 'Tom', 'Thomas')),
        approvedRow('detail-b', set('Tom.profile', {}, { name: 'Thomas', title: 'old' })),
        approvedRow('detail-c', set('Tom.profile.title', 'old', 'new')),
      ],
      syncedRows: [],
      pendingRows: [],
      targets: characterTargets({ Tom: { profile: { name: 'Tom', title: 'old' } } }),
      knownNoopEntityTypes: [],
    });

    const firstPage = createActionAuditDetailPage(report, {
      selector: 'approved:dependent_candidate_cluster',
      limit: 2,
    });
    expect(firstPage.items.map((item) => item.rowId)).toEqual(['detail-a', 'detail-b']);
    expect(firstPage.nextCursor).toBeDefined();
    const nextCursor = firstPage.nextCursor;
    if (nextCursor === undefined) throw new Error('Expected a second detail page');

    const secondPage = createActionAuditDetailPage(report, {
      selector: 'approved:dependent_candidate_cluster',
      limit: 2,
      cursor: nextCursor,
    });
    expect(secondPage.items.map((item) => item.rowId)).toEqual(['detail-c']);
    expect(secondPage.nextCursor).toBeUndefined();

    expect(() =>
      createActionAuditDetailPage(
        { ...report, runFingerprint: 'audit-detail-b' },
        {
          selector: 'approved:dependent_candidate_cluster',
          limit: 2,
          cursor: nextCursor,
        }
      )
    ).toThrow(ActionAuditCursorError);
  });
});
