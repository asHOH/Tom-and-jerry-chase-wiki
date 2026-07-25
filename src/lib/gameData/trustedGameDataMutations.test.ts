import { canAccessAll } from '@/lib/auth/permissions';
import { validateApprovedCandidateReplay } from '@/lib/gameData/approvedCandidateReplay';
import { readApprovedReplaySnapshot } from '@/lib/gameData/approvedReplaySnapshotReader';
import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { supabaseAdmin } from '@/lib/supabase/admin';

import {
  approvePreparedGameDataAction,
  markPreparedGameDataActionSynced,
  publishPreparedGameDataActions,
  revokePreparedGameDataAction,
  type TrustedGameDataActionRecord,
} from './trustedGameDataMutations';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/auth/permissions', () => ({ canAccessAll: jest.fn() }));
jest.mock('@/lib/gameData/approvedReplaySnapshotReader', () => ({
  readApprovedReplaySnapshot: jest.fn(),
}));
jest.mock('@/lib/gameData/approvedCandidateReplay', () => ({
  validateApprovedCandidateReplay: jest.fn(),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  invalidatePublicGameDataActionsCache: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
}));

const canAccessAllMock = jest.mocked(canAccessAll);
const readSnapshotMock = jest.mocked(readApprovedReplaySnapshot);
const validateCandidateMock = jest.mocked(validateApprovedCandidateReplay);
const invalidateMock = jest.mocked(invalidatePublicGameDataActionsCache);
const adminRpcMock = jest.mocked(supabaseAdmin.rpc);

const action = (path: string, newValue: unknown) => ({
  op: 'set' as const,
  path,
  oldValue: undefined,
  newValue,
});

const approvedRow = (rowId: string, path: string) => ({
  rowId,
  entityType: 'items',
  rawEntry: null,
  actions: [action(path, rowId)],
});

const snapshot = (rows = [approvedRow('approved-1', 'item-a.description')]) => ({
  replayEpoch: 9,
  rows: rows.map((row, index) => ({
    id: row.rowId,
    entity_type: row.entityType,
    entry: row.actions[0],
    created_at: `2026-07-18T00:0${index}:00.000Z`,
    status: 'approved' as const,
    message: null,
    reviewed_at: null,
    created_by: null,
  })),
  actionSnapshot: { rows },
});

const prepared = {
  actions: [
    {
      entityType: 'items' as const,
      rows: [
        {
          canonicalEntry: { op: 'set' as const, path: 'item-b.description', newValue: 'new' },
          actions: [action('item-b.description', 'new')],
        },
      ],
    },
  ],
  message: 'message',
};

const record = (
  overrides: Partial<TrustedGameDataActionRecord> = {}
): TrustedGameDataActionRecord => ({
  id: 'pending-1',
  entity_type: 'items',
  entry: { op: 'set', path: 'item-b.description', newValue: 'new' },
  created_at: '2026-07-18T00:01:00.000Z',
  created_by: 'author-1',
  status: 'pending',
  is_public: false,
  ...overrides,
});

describe('trusted game data mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canAccessAllMock.mockReturnValue(true);
    readSnapshotMock.mockResolvedValue(snapshot() as never);
    adminRpcMock.mockResolvedValue({
      data: [{ id: 'new-1', is_public: true, status: 'approved' }],
      error: null,
    } as never);
  });

  it('checks every server-derived resource context before reading the approved snapshot', async () => {
    canAccessAllMock.mockImplementation((_grants, permission) => {
      return permission !== 'game_data_action.create';
    });

    await expect(
      publishPreparedGameDataActions({
        actorId: 'actor-1',
        permission: 'game_data_action.create',
        grants: [],
        prepared,
      })
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(readSnapshotMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
  });

  it('publishes anonymous submissions through the pending-only RPC', async () => {
    adminRpcMock.mockResolvedValueOnce({
      data: [{ id: 'anonymous-1', is_public: false, status: 'pending' }],
      error: null,
    } as never);

    const result = await publishPreparedGameDataActions({
      actorId: null,
      permission: 'game_data_action.create',
      grants: [],
      prepared,
    });

    expect(canAccessAllMock).not.toHaveBeenCalled();
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_publish_anonymous_game_data_actions', {
      p_entity_type: 'items',
      p_entries: [{ op: 'set', path: 'item-b.description', newValue: 'new' }],
      p_message: 'message',
      p_expected_replay_epoch: 9,
    });
    expect(result).toEqual([{ id: 'anonymous-1', is_public: false, status: 'pending' }]);
  });

  it('replays the complete approved candidate and persists canonical rows with the snapshot epoch', async () => {
    const result = await publishPreparedGameDataActions({
      actorId: 'actor-1',
      permission: 'game_data_action.create',
      grants: [],
      prepared,
    });

    expect(validateCandidateMock).toHaveBeenCalledWith([
      expect.objectContaining({ rowId: 'approved-1' }),
      expect.objectContaining({ rowId: 'proposed:items:0' }),
    ]);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_publish_game_data_actions', {
      p_actor_id: 'actor-1',
      p_permission_key: 'game_data_action.create',
      p_entity_type: 'items',
      p_entries: [{ op: 'set', path: 'item-b.description', newValue: 'new' }],
      p_message: 'message',
      p_expected_replay_epoch: 9,
    });
    expect(result).toEqual([{ id: 'new-1', is_public: true, status: 'approved' }]);
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });

  it('preserves checked replay detail when candidate validation blocks persistence', async () => {
    const replayFailure = {
      detail: {
        code: 'missing_path',
        stage: 'apply',
        operation: 'set',
        path: 'item-b.description',
        rowId: 'proposed:items:0',
        actionIndex: 0,
        targetIndex: 0,
        rootKey: 'item-b',
        segmentIndex: 1,
        cause: { value: 'unsafe action value' },
      },
    };
    validateCandidateMock.mockImplementationOnce(() => {
      throw replayFailure;
    });

    await expect(
      publishPreparedGameDataActions({
        actorId: 'actor-1',
        permission: 'game_data_action.create',
        grants: [],
        prepared,
      })
    ).rejects.toMatchObject({ code: 'candidate_conflict', cause: replayFailure });

    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(invalidateMock).not.toHaveBeenCalled();
  });

  it('omits the whole entity batch from candidate replay when any row will remain pending', async () => {
    const twoRows = {
      ...prepared,
      actions: [
        {
          entityType: 'items' as const,
          rows: [
            ...prepared.actions[0]!.rows,
            {
              canonicalEntry: {
                op: 'set' as const,
                path: 'item-c.description',
                newValue: 'new',
              },
              actions: [action('item-c.description', 'new')],
            },
          ],
        },
      ],
    };
    canAccessAllMock.mockImplementation((_grants, permission, contexts) => {
      if (permission !== 'game_data_action.auto_approve') return true;
      return !JSON.stringify(contexts).includes('item-c');
    });
    adminRpcMock.mockResolvedValue({
      data: [{ id: 'new-1', is_public: false, status: 'pending' }],
      error: null,
    } as never);

    await publishPreparedGameDataActions({
      actorId: 'actor-1',
      permission: 'game_data_action.create',
      grants: [],
      prepared: twoRows,
    });

    expect(validateCandidateMock).toHaveBeenCalledWith([
      expect.objectContaining({ rowId: 'approved-1' }),
    ]);
    expect(invalidateMock).not.toHaveBeenCalled();
  });

  it('replays auto-published pending rows even when the actor cannot self-review them', async () => {
    canAccessAllMock.mockImplementation((_grants, permission) => {
      if (permission === 'game_data_action.approve') return false;
      return true;
    });
    adminRpcMock.mockResolvedValueOnce({
      data: [{ id: 'new-public-pending', is_public: true, status: 'pending' }],
      error: null,
    } as never);

    const result = await publishPreparedGameDataActions({
      actorId: 'actor-1',
      permission: 'game_data_action.create',
      grants: [],
      prepared,
    });

    expect(validateCandidateMock).toHaveBeenCalledWith([
      expect.objectContaining({ rowId: 'approved-1' }),
      expect.objectContaining({ rowId: 'proposed:items:0' }),
    ]);
    expect(result).toEqual([{ id: 'new-public-pending', is_public: true, status: 'pending' }]);
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });

  it('inserts an older pending row at its stored semantic position before approval', async () => {
    const first = approvedRow('approved-first', 'item-a.description');
    const last = approvedRow('approved-last', 'item-c.description');
    readSnapshotMock.mockResolvedValue({
      ...snapshot([first, last]),
      rows: [
        { ...snapshot([first]).rows[0], created_at: '2026-07-18T00:00:00.000Z' },
        {
          ...snapshot([last]).rows[0],
          id: 'approved-last',
          created_at: '2026-07-18T00:02:00.000Z',
        },
      ],
    } as never);
    adminRpcMock.mockResolvedValue({ data: null, error: null } as never);

    await approvePreparedGameDataAction('moderator-1', record());

    expect(validateCandidateMock.mock.calls[0]?.[0].map((row) => row.rowId)).toEqual([
      'approved-first',
      'pending-1',
      'approved-last',
    ]);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_approve_game_data_action', {
      p_actor_id: 'moderator-1',
      p_action_id: 'pending-1',
      p_expected_entity_type: 'items',
      p_expected_entry: record().entry,
      p_expected_replay_epoch: 9,
    });
  });

  it('treats public pending approval as metadata-only review', async () => {
    const publicPendingRecord = record({ is_public: true });
    readSnapshotMock.mockResolvedValue({
      ...snapshot([approvedRow('approved-1', 'item-a.description')]),
      rows: [
        snapshot().rows[0]!,
        {
          id: publicPendingRecord.id,
          entity_type: publicPendingRecord.entity_type,
          entry: publicPendingRecord.entry,
          created_at: publicPendingRecord.created_at,
          status: publicPendingRecord.status,
          message: null,
          reviewed_at: null,
          created_by: publicPendingRecord.created_by,
        },
      ],
      actionSnapshot: {
        rows: [
          approvedRow('approved-1', 'item-a.description'),
          approvedRow(publicPendingRecord.id, 'item-b.description'),
        ],
      },
    } as never);
    adminRpcMock.mockResolvedValue({ data: null, error: null } as never);

    await approvePreparedGameDataAction('moderator-1', publicPendingRecord);

    expect(validateCandidateMock).not.toHaveBeenCalled();
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_approve_game_data_action', {
      p_actor_id: 'moderator-1',
      p_action_id: 'pending-1',
      p_expected_entity_type: 'items',
      p_expected_entry: publicPendingRecord.entry,
      p_expected_replay_epoch: 9,
    });
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });

  it('validates the complete remaining set before mark-synced persistence', async () => {
    const target = approvedRow('approved-target', 'item-a.description');
    const remaining = approvedRow('approved-remaining', 'item-b.description');
    readSnapshotMock.mockResolvedValue(snapshot([target, remaining]) as never);
    adminRpcMock.mockResolvedValue({ data: null, error: null } as never);

    await markPreparedGameDataActionSynced(
      'coordinator-1',
      record({ id: 'approved-target', status: 'approved', is_public: true })
    );

    expect(validateCandidateMock).toHaveBeenCalledWith([
      expect.objectContaining({ rowId: 'approved-remaining' }),
    ]);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_mark_game_data_action_synced', {
      p_actor_id: 'coordinator-1',
      p_action_id: 'approved-target',
      p_expected_entity_type: 'items',
      p_expected_entry: record().entry,
      p_expected_replay_epoch: 9,
    });
  });

  it('validates the complete remaining set before revoke persistence', async () => {
    const target = approvedRow('approved-target', 'item-a.description');
    const remaining = approvedRow('approved-remaining', 'item-b.description');
    readSnapshotMock.mockResolvedValue(snapshot([target, remaining]) as never);
    adminRpcMock.mockResolvedValue({ data: null, error: null } as never);

    await revokePreparedGameDataAction(
      'moderator-1',
      record({ id: 'approved-target', status: 'approved', is_public: true })
    );

    expect(validateCandidateMock).toHaveBeenCalledWith([
      expect.objectContaining({ rowId: 'approved-remaining' }),
    ]);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_revoke_game_data_action', {
      p_actor_id: 'moderator-1',
      p_action_id: 'approved-target',
      p_expected_entity_type: 'items',
      p_expected_entry: record().entry,
      p_expected_replay_epoch: 9,
    });
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['pending', false],
    ['approved', false],
  ] as const)('rejects revoke when the record is not public (%s)', async (status, isPublic) => {
    await expect(
      revokePreparedGameDataAction('moderator-1', record({ status, is_public: isPublic }))
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(readSnapshotMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
  });

  it('maps a locked replay epoch mismatch to a stable conflict', async () => {
    adminRpcMock.mockResolvedValue({
      data: null,
      error: { code: '40001', message: 'approved_replay_epoch_conflict' },
    } as never);

    await expect(
      publishPreparedGameDataActions({
        actorId: 'actor-1',
        permission: 'game_data_action.create',
        grants: [],
        prepared,
      })
    ).rejects.toMatchObject({ code: 'replay_epoch_conflict' });
  });
});
