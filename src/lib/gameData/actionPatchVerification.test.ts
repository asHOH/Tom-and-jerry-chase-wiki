import {
  projectLegacyAction,
  verifyActionPatch,
  type ActionPatchRow,
  type ActionPatchTargetRegistry,
} from './actionPatchVerification';

const row = (
  id: string,
  entry: ActionPatchRow['entry'],
  createdAt = '2026-07-22T00:00:00.000Z'
): ActionPatchRow => ({
  id,
  entity_type: 'characters',
  entry,
  created_at: createdAt,
  status: 'approved',
  is_public: true,
});

const targets = (characters: Record<string, unknown>): ActionPatchTargetRegistry => ({
  characters,
});

describe('verifyActionPatch', () => {
  it('verifies overlapping parent and child actions in reverse order', () => {
    const rows = [
      row('parent', {
        op: 'set',
        path: 'Tom.profile',
        oldValue: { name: 'old', untouched: true },
        newValue: { name: 'middle', untouched: true },
      }),
      row(
        'child',
        {
          op: 'set',
          path: 'Tom.profile.name',
          oldValue: 'middle',
          newValue: 'final',
        },
        '2026-07-22T00:01:00.000Z'
      ),
    ];

    expect(
      verifyActionPatch(rows, targets({ Tom: { profile: { name: 'final', untouched: true } } }))
    ).toEqual({ verifiedRowIds: ['parent', 'child'], failures: [] });
  });

  it('projects legacy positioning isMinor paths to level', () => {
    const action = projectLegacyAction({
      op: 'set',
      path: 'Tom.mousePositioningTags.0.isMinor',
      oldValue: false,
      newValue: true,
    });

    expect(action).toMatchObject({
      path: 'Tom.mousePositioningTags.0.level',
      oldValue: 4,
      newValue: 2,
    });
    expect(
      verifyActionPatch(
        [row('legacy', action)],
        targets({ Tom: { mousePositioningTags: [{ tagName: '奶酪', level: 2 }] } })
      )
    ).toEqual({ verifiedRowIds: ['legacy'], failures: [] });
  });

  it('compares relation parent sets by semantic identity rather than order', () => {
    const oldValue = [{ id: 'Jerry', description: 'old' }];
    const newValue = [
      { id: 'Jerry', description: 'new' },
      { id: 'Tuffy', isMinor: true },
    ];

    expect(
      verifyActionPatch(
        [row('relation', { op: 'set', path: 'Tom.counteredBy', oldValue, newValue })],
        targets({ Tom: { counteredBy: [...newValue].reverse() } })
      )
    ).toEqual({ verifiedRowIds: ['relation'], failures: [] });
  });

  it('defers an array deletion without stable identity', () => {
    const result = verifyActionPatch(
      [row('delete', { op: 'delete', path: 'Tom.aliases.0', oldValue: 'old' })],
      targets({ Tom: { aliases: [] } })
    );

    expect(result.verifiedRowIds).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({ rowId: 'delete', code: 'ambiguous_array_delete' }),
    ]);
  });

  it('verifies an array deletion with stable identity', () => {
    expect(
      verifyActionPatch(
        [
          row('delete', {
            op: 'delete',
            path: 'Tom.aliases.0',
            oldValue: { id: 'removed', label: 'old' },
          }),
        ],
        targets({ Tom: { aliases: [{ id: 'remaining', label: 'new' }] } })
      )
    ).toEqual({ verifiedRowIds: ['delete'], failures: [] });
  });

  it('rejects the whole batch when a projection does not match', () => {
    const result = verifyActionPatch(
      [row('mismatch', { op: 'set', path: 'Tom.description', oldValue: 'old', newValue: 'new' })],
      targets({ Tom: { description: 'different' } })
    );

    expect(result.verifiedRowIds).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({ rowId: 'mismatch', code: 'projection_mismatch' }),
    ]);
  });
});
