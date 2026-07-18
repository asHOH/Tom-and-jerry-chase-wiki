import { createSanitizedPublishLimitMeasurement } from './publishLimitsMeasurement';

describe('createSanitizedPublishLimitMeasurement', () => {
  it('reports aggregate distributions without retaining action or message values', () => {
    const rows = [
      {
        id: 'row-1',
        entity_type: 'characters',
        entry: { op: 'set', path: '汤姆.description', newValue: 'SECRET_ACTION_VALUE' },
        created_at: '2026-07-18T00:00:00.000Z',
        created_by: 'author-1',
        message: 'SECRET_MESSAGE',
      },
      {
        id: 'row-2',
        entity_type: 'characters',
        entry: [
          { op: 'set', path: '汤姆.aliases.0', newValue: '蓝猫' },
          { op: 'delete', path: '汤姆.aliases.1' },
        ],
        created_at: '2026-07-18T00:00:00.000Z',
        created_by: 'author-1',
        message: 'SECRET_MESSAGE',
      },
    ];

    const result = createSanitizedPublishLimitMeasurement(rows, 'audit-fingerprint');

    expect(result).toMatchObject({
      runFingerprint: 'audit-fingerprint',
      rowCount: 2,
      decodableRowCount: 2,
      malformedRowCount: 0,
      flattenedActionsPerRow: { max: 2 },
      heuristicSubmissionGroups: {
        groupCount: 1,
        topLevelEntries: { max: 2 },
        flattenedActions: { max: 3 },
      },
    });
    expect(result.pathCharacters.max).toBe('汤姆.description'.length);
    expect(result.pathBytes.max).toBeGreaterThan(result.pathCharacters.max);
    expect(JSON.stringify(result)).not.toContain('SECRET_ACTION_VALUE');
    expect(JSON.stringify(result)).not.toContain('SECRET_MESSAGE');
  });
});
