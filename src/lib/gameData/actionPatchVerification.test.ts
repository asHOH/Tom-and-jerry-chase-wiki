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

  it('verifies relation endpoint deltas while preserving unrelated edges and fields', () => {
    const rows = [
      row(
        'unrelated-field',
        {
          op: 'set',
          path: 'Tom.counteredBy',
          oldValue: [{ id: 'Unrelated', description: 'external-old', isMinor: false }],
          newValue: [{ id: 'Unrelated', description: 'external-final', isMinor: false }],
        },
        '2026-07-22T00:00:00.000Z'
      ),
      row(
        'disjoint-field',
        {
          op: 'set',
          path: 'Tom.counteredBy',
          oldValue: [{ id: 'Changed', description: 'old', isMinor: false }],
          newValue: [{ id: 'Changed', description: 'old', isMinor: true }],
        },
        '2026-07-22T00:01:00.000Z'
      ),
      row(
        'endpoint-delta',
        {
          op: 'set',
          path: 'Tom.counteredBy',
          oldValue: [
            { id: 'Stable', description: 'snapshot', isMinor: false },
            { id: 'Removed', description: 'remove me', isMinor: false },
            { id: 'Changed', description: 'old', isMinor: false },
          ],
          newValue: [
            { id: 'Stable', description: 'snapshot', isMinor: false },
            { id: 'Added', description: 'add me', isMinor: false },
            { id: 'Changed', description: 'new', isMinor: false },
          ],
        },
        '2026-07-22T00:02:00.000Z'
      ),
    ];

    expect(
      verifyActionPatch(
        rows,
        targets({
          Tom: {
            counteredBy: [
              { id: 'Unrelated', description: 'external-final', isMinor: false },
              { id: 'Stable', description: 'newer unrelated value', isMinor: true },
              { id: 'Added', description: 'add me', isMinor: false },
              { id: 'Changed', description: 'new', isMinor: true },
            ],
          },
        })
      )
    ).toEqual({
      verifiedRowIds: ['unrelated-field', 'disjoint-field', 'endpoint-delta'],
      failures: [],
    });
  });

  it('verifies an oldValue-less relation snapshot that a later same-path snapshot subsumes', () => {
    const correctedHome = {
      id: '经典之家II',
      isMinor: false,
      description: '横排上下两层的地图使莱特宁在下方就能通过闪现管控上方奶酪。',
    };
    const finalSnapshot = [
      correctedHome,
      { id: '游乐场', isMinor: false, description: '游乐场优势' },
      { id: '雪夜古堡III', isMinor: false, description: '雪夜古堡优势' },
    ];
    const rows = [
      row('typo-correction', {
        op: 'set',
        path: '莱特宁.advantageMaps',
        newValue: [correctedHome],
      }),
      row(
        'expanded-snapshot',
        {
          op: 'set',
          path: '莱特宁.advantageMaps',
          newValue: finalSnapshot,
        },
        '2026-07-22T00:01:00.000Z'
      ),
    ];

    expect(
      verifyActionPatch(
        rows,
        targets({
          莱特宁: {
            advantageMaps: [
              ...finalSnapshot,
              { id: '后续地图', isMinor: false, description: '不在本组内的后续关系' },
            ],
          },
        })
      )
    ).toEqual({ verifiedRowIds: ['typo-correction', 'expanded-snapshot'], failures: [] });
  });

  it.each([
    {
      name: 'removes an earlier endpoint',
      laterEndpoint: null,
    },
    {
      name: 'changes an earlier material field',
      laterEndpoint: { id: 'Stable', isMinor: false, description: 'changed' },
    },
  ])(
    'does not treat a later relation snapshot as superseding when it $name',
    ({ laterEndpoint }) => {
      const earlierEndpoint = { id: 'Stable', isMinor: false, description: 'original' };
      const laterSnapshot = [
        ...(laterEndpoint === null ? [] : [laterEndpoint]),
        { id: 'Added', isMinor: false, description: 'added' },
      ];
      const result = verifyActionPatch(
        [
          row('earlier-snapshot', {
            op: 'set',
            path: 'Tom.advantageMaps',
            newValue: [earlierEndpoint],
          }),
          row(
            'later-snapshot',
            { op: 'set', path: 'Tom.advantageMaps', newValue: laterSnapshot },
            '2026-07-22T00:01:00.000Z'
          ),
        ],
        targets({ Tom: { advantageMaps: laterSnapshot } })
      );

      expect(result.verifiedRowIds).toEqual([]);
      expect(result.failures).toEqual([
        expect.objectContaining({
          rowId: 'earlier-snapshot',
          code: 'projection_mismatch',
          detail: expect.objectContaining({ reason: 'added_endpoint_mismatch' }),
        }),
      ]);
    }
  );

  it.each([
    {
      name: 'an added endpoint is missing',
      oldValue: [],
      newValue: [{ id: 'Added', description: 'new', isMinor: false }],
      currentValue: [],
      reason: 'added_endpoint_mismatch',
    },
    {
      name: 'a removed endpoint is still present',
      oldValue: [{ id: 'Removed', description: 'old', isMinor: false }],
      newValue: [],
      currentValue: [{ id: 'Removed', description: 'old', isMinor: false }],
      reason: 'removed_endpoint_present',
    },
    {
      name: 'a changed material field does not match',
      oldValue: [{ id: 'Changed', description: 'old', isMinor: false }],
      newValue: [{ id: 'Changed', description: 'new', isMinor: false }],
      currentValue: [{ id: 'Changed', description: 'different', isMinor: false }],
      reason: 'changed_material_mismatch',
    },
  ])('rejects a relation delta when $name', ({ oldValue, newValue, currentValue, reason }) => {
    const result = verifyActionPatch(
      [row('relation-mismatch', { op: 'set', path: 'Tom.counters', oldValue, newValue })],
      targets({ Tom: { counters: currentValue } })
    );

    expect(result.verifiedRowIds).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({
        rowId: 'relation-mismatch',
        code: 'projection_mismatch',
        detail: expect.objectContaining({ reason }),
      }),
    ]);
  });

  it('uses factionId as part of a relation endpoint identity', () => {
    expect(
      verifyActionPatch(
        [
          row('faction-endpoint', {
            op: 'set',
            path: 'Tom.counteredBySpecialSkills',
            oldValue: [
              { id: 'Shared Skill', factionId: 'cat', description: 'cat', isMinor: false },
            ],
            newValue: [
              { id: 'Shared Skill', factionId: 'cat', description: 'cat', isMinor: false },
              { id: 'Shared Skill', factionId: 'mouse', description: 'mouse', isMinor: false },
            ],
          }),
        ],
        targets({
          Tom: {
            counteredBySpecialSkills: [
              { id: 'Shared Skill', factionId: 'mouse', description: 'mouse', isMinor: false },
              {
                id: 'Shared Skill',
                factionId: 'cat',
                description: 'changed elsewhere',
                isMinor: true,
              },
            ],
          },
        })
      )
    ).toEqual({ verifiedRowIds: ['faction-endpoint'], failures: [] });
  });

  it('compares changed relation tags without depending on tag order', () => {
    const firstTag = { counters: '控制', counteredBy: '免控' };
    const secondTag = { counters: '位移', counteredBy: '护盾' };

    expect(
      verifyActionPatch(
        [
          row('relation-tags', {
            op: 'set',
            path: 'Tom.counters',
            oldValue: [{ id: 'Jerry', isMinor: false, tags: [firstTag] }],
            newValue: [{ id: 'Jerry', isMinor: false, tags: [firstTag, secondTag] }],
          }),
        ],
        targets({
          Tom: {
            counters: [{ id: 'Jerry', isMinor: false, tags: [secondTag, firstTag] }],
          },
        })
      )
    ).toEqual({ verifiedRowIds: ['relation-tags'], failures: [] });
  });

  it('rejects duplicate semantic relation endpoints', () => {
    const result = verifyActionPatch(
      [
        row('duplicate-endpoint', {
          op: 'set',
          path: 'Tom.counteredBy',
          oldValue: [],
          newValue: [{ id: 'Jerry', isMinor: false }],
        }),
      ],
      targets({
        Tom: {
          counteredBy: [
            { id: 'Jerry', isMinor: false },
            { id: 'Jerry', isMinor: false },
          ],
        },
      })
    );

    expect(result.failures).toEqual([
      expect.objectContaining({
        rowId: 'duplicate-endpoint',
        detail: expect.objectContaining({ reason: 'invalid_relation_array' }),
      }),
    ]);
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
