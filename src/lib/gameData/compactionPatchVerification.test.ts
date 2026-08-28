import type { ActionPatchRow } from './actionPatchVerification';
import { verifyCompactionActionPatch } from './compactionPatchVerification';

const row = (id: string, entry: ActionPatchRow['entry'], createdAt: string): ActionPatchRow => ({
  id,
  entity_type: 'items',
  entry,
  created_at: createdAt,
  status: 'approved',
  is_public: true,
});

describe('compaction action patch verification', () => {
  it('replays verification-only dependencies before reversing the complete patch', () => {
    const result = verifyCompactionActionPatch(
      [
        row(
          'cutover',
          { op: 'set', path: 'item.name', oldValue: 'before', newValue: 'after' },
          '2026-07-28T00:00:00.000Z'
        ),
      ],
      [
        row(
          'dependency',
          { op: 'add', path: 'item.aliases.0', newValue: 'later' },
          '2026-07-29T00:00:00.000Z'
        ),
      ],
      { items: { item: { name: 'after', aliases: [] } } }
    );

    expect(result).toEqual({
      verifiedRowIds: ['cutover', 'dependency'],
      failures: [],
      dependencyReplayFailures: [],
    });
  });

  it('reports a dependency replay failure without accepting the cutover rows', () => {
    const result = verifyCompactionActionPatch(
      [],
      [
        row(
          'dependency',
          { op: 'delete', path: 'item.aliases.0', oldValue: 'missing' },
          '2026-07-29T00:00:00.000Z'
        ),
      ],
      { items: { item: { aliases: [] } } }
    );

    expect(result).toMatchObject({
      verifiedRowIds: [],
      failures: [],
      dependencyReplayFailures: [
        { rowId: 'dependency', code: 'replay_failed', detail: { stage: 'apply' } },
      ],
    });
  });
});
