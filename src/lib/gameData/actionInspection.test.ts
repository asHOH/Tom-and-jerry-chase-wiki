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
  it('flags unsupported relation wrappers before an absent old value can look usable', () => {
    const paths = [
      '米雪儿.relations',
      '米雪儿.relations.advantageMaps',
      '米雪儿.relations.advantageMaps.0.description',
      '米雪儿.relations.counters',
    ];
    const report = createActionInspectionReport({
      rows: paths.map((path) => row(path, { op: 'set', path, newValue: [] })),
      targets: targets({ 米雪儿: { advantageMaps: [] } }),
    });
    expect(report.malformedRows).toEqual([]);
    expect(report.rows).toHaveLength(paths.length);
    for (const item of report.rows) {
      expect(item).toMatchObject({
        sourceExists: false,
        sourceMatch: 'unsupported',
        pathIssue: 'unsupported_relation_wrapper',
      });
      expect(paths).toContain(item.path);
    }
  });

  it('keeps supported relation edits and legitimate absent-field additions usable', () => {
    const rows = [
      row('relation', {
        op: 'set',
        path: '米雪儿.advantageMaps',
        oldValue: [],
        newValue: [{ id: 'map' }],
      }),
      row('addition', { op: 'add', path: '米雪儿.description', newValue: 'description' }),
      {
        ...row('other-domain', { op: 'add', path: 'item.relations.advantageMaps', newValue: [] }),
        entity_type: 'items',
      },
    ];
    const report = createActionInspectionReport({
      rows,
      targets: {
        ...targets({ 米雪儿: { advantageMaps: [] } }),
        items: { item: { relations: {} } },
      },
    });
    expect(report.rows).toHaveLength(3);
    for (const item of report.rows) {
      expect(item.sourceMatch).toBe('old');
      expect(item.pathIssue).toBeUndefined();
    }
  });

  it.each([
    ['counters', 'counteredBy'],
    ['counteredBy', 'counters'],
    ['collaborators', 'collaborators'],
    ['counterEachOther', 'counterEachOther'],
  ])('matches reversed %s/%s edges in history and groups', (leftKind, rightKind) => {
    const selected = row('selected', {
      op: 'set',
      path: `Tom.${leftKind}`,
      oldValue: [],
      newValue: [{ id: 'Jerry' }],
    });
    const inverse = row('inverse', {
      op: 'set',
      path: `Jerry.${rightKind}`,
      oldValue: [{ id: 'Tom' }],
      newValue: [],
    });
    const unrelated = row('unrelated', {
      op: 'set',
      path: `Spike.${rightKind}`,
      oldValue: [],
      newValue: [{ id: 'Tyke' }],
    });
    const report = createActionInspectionReport({
      rows: [selected],
      targets: targets({}),
      historyRows: [
        selected,
        inverse,
        unrelated,
        { ...inverse, id: 'other-domain', entity_type: 'items' },
      ],
    });
    expect(report.overlapHistory.map(({ rowId }) => rowId)).toEqual(['inverse']);
    expect(
      createActionInspectionReport({ rows: [selected, inverse, unrelated], targets: targets({}) })
        .dependencyGroups
    ).toEqual([{ entityType: 'characters', rowIds: ['inverse', 'selected'] }]);
  });

  it('uses stored IDs for indexed endpoint objects without merging unrelated edges', () => {
    const selected = row('selected', {
      op: 'set',
      path: 'Tom.counters.0',
      oldValue: { id: 'Jerry', name: 'display label' },
      newValue: { id: 'Tyke', name: 'display label' },
    });
    const matching = row('matching', {
      op: 'set',
      path: 'Jerry.counteredBy.0',
      oldValue: { id: 'Tom' },
      newValue: { id: 'Tom', description: 'updated' },
    });
    const unrelated = row('unrelated', {
      op: 'set',
      path: 'Spike.counteredBy.0',
      oldValue: { id: 'Butch' },
      newValue: { id: 'Butch', description: 'updated' },
    });
    const report = createActionInspectionReport({
      rows: [selected],
      targets: targets({}),
      historyRows: [matching, unrelated],
    });
    expect(report.overlapHistory.map(({ rowId }) => rowId)).toEqual(['matching']);
    expect(
      createActionInspectionReport({ rows: [selected, matching, unrelated], targets: targets({}) })
        .dependencyGroups
    ).toEqual([{ entityType: 'characters', rowIds: ['matching', 'selected'] }]);
  });

  it('includes old endpoints, parent snapshots and unresolved indexed edits conservatively', () => {
    const selected = row('selected', {
      op: 'set',
      path: 'Tom.counters.0.id',
      oldValue: 'Jerry',
      newValue: 'Tyke',
    });
    const report = createActionInspectionReport({
      rows: [selected],
      targets: targets({}),
      historyRows: [
        row('old', {
          op: 'set',
          path: 'Jerry.counteredBy',
          oldValue: [],
          newValue: [{ id: 'Tom' }],
        }),
        row('parent', {
          op: 'set',
          path: 'Tyke',
          oldValue: { counteredBy: [] },
          newValue: { counteredBy: [{ id: 'Tom' }] },
        }),
        row('indexed', {
          op: 'set',
          path: 'Jerry.counteredBy.3.description',
          oldValue: 'a',
          newValue: 'b',
        }),
        row('wrong-direction', {
          op: 'set',
          path: 'Jerry.counters',
          oldValue: [],
          newValue: [{ id: 'Tom' }],
        }),
        row('wrong-kind', {
          op: 'set',
          path: 'Jerry.collaborators',
          oldValue: [],
          newValue: [{ id: 'Tom' }],
        }),
      ],
    });
    expect(report.overlapHistory.map(({ rowId }) => rowId)).toEqual(['indexed', 'old', 'parent']);
  });

  it('unions semantic and structural dependencies transitively while keeping rows atomic', () => {
    const report = createActionInspectionReport({
      rows: [
        row('a', { op: 'set', path: 'Tom.counters', oldValue: [], newValue: [{ id: 'Jerry' }] }),
        row('b', [
          { op: 'set', path: 'Jerry.counteredBy', oldValue: [], newValue: [{ id: 'Tom' }] },
          { op: 'set', path: 'Spike.name', oldValue: 'a', newValue: 'b' },
        ]),
        row('c', { op: 'set', path: 'Spike.name', oldValue: 'b', newValue: 'c' }),
      ],
      targets: targets({}),
    });
    expect(report.dependencyGroups).toEqual([
      { entityType: 'characters', rowIds: ['a', 'b', 'c'] },
    ]);
  });

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
