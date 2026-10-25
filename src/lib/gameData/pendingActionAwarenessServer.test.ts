import type { Json } from '@/data/database.types';

import {
  checkPendingActionAcknowledgement,
  getPendingActionTargets,
} from './pendingActionAwarenessServer';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/serverCache', () => ({
  cached: (_key: unknown, reader: () => Promise<unknown>) => reader(),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 12 * 60 * 60,
  PENDING_GAME_DATA_ACTIONS_CACHE_TAG: 'pending-game-data-actions',
}));

const fromMock = jest.fn();
jest.mock('@/lib/supabase/adminClient', () => ({
  requireSupabaseAdminClient: () => ({ from: fromMock }),
}));

const operationId = 'a3bb189e-8c21-4b8d-9a4f-5e24b7c29a10';
const action = {
  op: 'set' as const,
  path: 'item.description',
  oldValue: 'old',
  newValue: 'new',
};
const prepared = {
  actions: [
    {
      entityType: 'items' as const,
      rows: [{ canonicalEntry: action, actions: [action] }],
    },
  ],
} as const;

function pendingRows(rows: Array<Record<string, unknown>>) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({ data: rows, error: null }),
            })),
          })),
        })),
      })),
    })),
  };
}

describe('pending game data action acknowledgement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores pending rows created by the same publish operation on retry', async () => {
    fromMock.mockReturnValueOnce(
      pendingRows([
        {
          id: 'same-operation-row',
          entity_type: 'items',
          entry: action as unknown as Json,
          created_at: '2026-09-03T00:00:00.000Z',
          created_by: null,
          is_public: false,
          publish_operation_id: operationId,
        },
      ])
    );

    await expect(
      checkPendingActionAcknowledgement({
        prepared,
        userId: null,
        operationId,
      })
    ).resolves.toBeNull();
  });

  it('still reports overlapping rows from another operation', async () => {
    fromMock.mockReturnValueOnce(
      pendingRows([
        {
          id: 'other-operation-row',
          entity_type: 'items',
          entry: action as unknown as Json,
          created_at: '2026-09-03T00:00:00.000Z',
          created_by: null,
          is_public: false,
          publish_operation_id: 'c4cc2a7f-2d93-4fd5-9b2b-723e9b1da0ab',
        },
      ])
    );

    await expect(
      checkPendingActionAcknowledgement({
        prepared,
        userId: null,
        operationId,
      })
    ).resolves.toMatchObject({ error: 'pending_action_overlap' });
  });

  it('includes incoming shared and legacy relation changes in character-scoped awareness', async () => {
    fromMock.mockReturnValueOnce(
      pendingRows(
        [
          { path: 'A.characterRelationOverrides.B', newValue: null },
          { path: 'A.characterRelationOverrides.C', newValue: null },
          { path: 'C.counters', newValue: [{ id: 'B', isMinor: false }] },
          { path: 'D.counteredBy.0.description', newValue: 'legacy indexed edit' },
          { path: 'A.description', newValue: 'unrelated prose' },
        ].map((entry, index) => ({
          id: `character-row-${index}`,
          entity_type: 'characters',
          entry: { op: 'set', ...entry },
          created_at: '2026-10-25T00:00:00.000Z',
          created_by: null,
          is_public: false,
          publish_operation_id: null,
        }))
      )
    );

    const result = await getPendingActionTargets({
      entityType: 'characters',
      entityKey: 'B',
      userId: null,
    });
    expect(result.targets.map((target) => target.path)).toEqual([
      'A.characterRelationOverrides.B',
      'C.counters',
      'D.counteredBy.0.description',
    ]);
  });

  it('requires acknowledgement for legacy inverse edits overlapping a new shared record', async () => {
    fromMock.mockReturnValueOnce(
      pendingRows([
        {
          id: 'inverse-legacy-row',
          entity_type: 'characters',
          entry: { op: 'set', path: 'B.counters', newValue: [{ id: 'A', isMinor: false }] },
          created_at: '2026-10-25T00:00:00.000Z',
          created_by: null,
          is_public: false,
          publish_operation_id: null,
        },
      ])
    );
    const pairAction = {
      op: 'set' as const,
      path: 'A.characterRelationOverrides.B',
      oldValue: undefined,
      newValue: { kind: 'counteredBy', isMinor: false },
    };
    const pairPrepared = {
      actions: [
        {
          entityType: 'characters' as const,
          rows: [{ canonicalEntry: pairAction, actions: [pairAction] }],
        },
      ],
    };
    await expect(
      checkPendingActionAcknowledgement({ prepared: pairPrepared, userId: null })
    ).resolves.toMatchObject({
      error: 'pending_action_overlap',
      targets: [expect.objectContaining({ path: 'B.counters' })],
    });
  });
});
