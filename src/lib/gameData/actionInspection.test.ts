import {
  createActionInspectionReport,
  createBeijingDateRange,
  type ActionInspectionRow,
} from './actionInspection';
import type { ActionPatchTargetRegistry } from './actionPatchVerification';

function row(
  id: string,
  entry: unknown,
  createdAt = '2026-07-24T00:00:00.000Z'
): ActionInspectionRow {
  return {
    id,
    entity_type: 'characters',
    entry,
    created_at: createdAt,
    status: 'approved',
    is_public: true,
    message: null,
  };
}

function targets(characters: Record<string, unknown>): ActionPatchTargetRegistry {
  return { characters };
}

describe('createBeijingDateRange', () => {
  it('converts inclusive Beijing calendar days to an exclusive UTC range', () => {
    expect(createBeijingDateRange('2026-07-24', '2026-07-24')).toEqual({
      fromUtc: '2026-07-23T16:00:00.000Z',
      toUtc: '2026-07-24T16:00:00.000Z',
    });
    expect(createBeijingDateRange('2026-07-24', '2026-07-26')).toEqual({
      fromUtc: '2026-07-23T16:00:00.000Z',
      toUtc: '2026-07-26T16:00:00.000Z',
    });
  });

  it('rejects invalid or reversed dates', () => {
    expect(() => createBeijingDateRange('2026-02-30', '2026-03-01')).toThrow(RangeError);
    expect(() => createBeijingDateRange('2026-07-25', '2026-07-24')).toThrow(RangeError);
  });
});

describe('createActionInspectionReport', () => {
  it('decodes nested rows and exposes dependencies, chains, and current-source matches', () => {
    const report = createActionInspectionReport({
      rows: [
        row('parent', [
          [
            {
              op: 'set',
              path: 'Tom.profile',
              oldValue: { name: 'old', untouched: true },
              newValue: { name: 'middle', untouched: true },
            },
          ],
        ]),
        row(
          'child',
          {
            op: 'set',
            path: 'Tom.profile',
            oldValue: { name: 'middle', untouched: true },
            newValue: { name: 'final', untouched: true },
          },
          '2026-07-24T00:01:00.000Z'
        ),
      ],
      targets: targets({ Tom: { profile: { name: 'final', untouched: true } } }),
      includeValues: true,
    });

    expect(report.malformedRows).toEqual([]);
    expect(report.rows.map(({ rowId, sourceMatch }) => ({ rowId, sourceMatch }))).toEqual([
      { rowId: 'parent', sourceMatch: 'neither' },
      { rowId: 'child', sourceMatch: 'new' },
    ]);
    expect(report.dependencyGroups).toEqual([
      { entityType: 'characters', rowIds: ['parent', 'child'] },
    ]);
    expect(report.chainLinks).toEqual([
      {
        entityType: 'characters',
        path: 'Tom.profile',
        previousRowId: 'parent',
        nextRowId: 'child',
        matches: true,
      },
    ]);
    expect(report.rows[1]?.values?.sourceValue).toEqual({ name: 'final', untouched: true });
  });

  it('summarizes large values without returning their complete payloads', () => {
    const oldSecret = `OLD_SECRET_${'x'.repeat(11_000)}`;
    const newSecret = `NEW_SECRET_${'y'.repeat(11_000)}`;
    const report = createActionInspectionReport({
      rows: [
        row('large', {
          op: 'set',
          path: 'Tom.description',
          oldValue: oldSecret,
          newValue: newSecret,
        }),
      ],
      targets: targets({ Tom: { description: newSecret } }),
      includeValues: true,
    });

    expect(report.rows[0]).toMatchObject({
      largePayload: true,
      sourceMatch: 'new',
      largePayloadSummary: {
        oldValue: { kind: 'string', length: oldSecret.length },
        newValue: { kind: 'string', length: newSecret.length },
        difference: { kind: 'value' },
      },
    });
    expect(report.rows[0]?.values).toBeUndefined();
    expect(JSON.stringify(report)).not.toContain('OLD_SECRET');
    expect(JSON.stringify(report)).not.toContain('NEW_SECRET');
  });

  it('finds path-overlapping history while excluding selected and unrelated rows', () => {
    const selected = row('selected', {
      op: 'set',
      path: 'Tom.profile',
      oldValue: { name: 'old' },
      newValue: { name: 'new' },
    });
    const report = createActionInspectionReport({
      rows: [selected],
      targets: targets({ Tom: { profile: { name: 'new' }, aliases: [] } }),
      historyRows: [
        selected,
        row(
          'overlap',
          { op: 'set', path: 'Tom.profile.name', oldValue: 'older', newValue: 'old' },
          '2026-07-23T00:00:00.000Z'
        ),
        row('unrelated', { op: 'set', path: 'Tom.aliases', oldValue: [], newValue: ['T'] }),
      ],
    });

    expect(report.overlapHistory).toEqual([
      expect.objectContaining({
        rowId: 'overlap',
        path: 'Tom.profile.name',
        matchingSelectedRowIds: ['selected'],
      }),
    ]);
  });

  it('filters decoded actions by actor root', () => {
    const report = createActionInspectionReport({
      rows: [
        row('mixed', [
          { op: 'set', path: 'Tom.name', oldValue: 'Tom', newValue: '汤姆' },
          { op: 'set', path: 'Jerry.name', oldValue: 'Jerry', newValue: '杰瑞' },
        ]),
      ],
      targets: targets({ Tom: { name: '汤姆' }, Jerry: { name: '杰瑞' } }),
      actor: 'Jerry',
    });

    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({ rowId: 'mixed', path: 'Jerry.name' });
  });
});
