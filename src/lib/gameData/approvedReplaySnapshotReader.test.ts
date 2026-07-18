import { readApprovedReplaySnapshot } from './approvedReplaySnapshotReader';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: undefined }));

const row = (id: string, createdAt: string) => ({
  id,
  entity_type: 'items',
  entry: { op: 'set', path: 'item.description', newValue: id },
  created_at: createdAt,
  status: 'approved',
  message: null,
  reviewed_at: null,
  created_by: null,
});

describe('readApprovedReplaySnapshot', () => {
  it('returns the epoch and ordered decoded rows from one RPC result', async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            replay_epoch: 7,
            action_rows: [
              row('row-1', '2026-07-18T00:00:00.000Z'),
              row('row-2', '2026-07-18T00:01:00.000Z'),
            ],
          },
        ],
        error: null,
      }),
    };

    const result = await readApprovedReplaySnapshot(client as never);

    expect(client.rpc).toHaveBeenCalledWith('read_game_data_approved_replay_snapshot');
    expect(result.replayEpoch).toBe(7);
    expect(result.rows.map(({ id }) => id)).toEqual(['row-1', 'row-2']);
    expect(result.actionSnapshot.rows.map(({ rowId }) => rowId)).toEqual(['row-1', 'row-2']);
    expect(Object.isFrozen(result.rows)).toBe(true);
  });

  it('fails closed on RPC, shape, or stored decode errors', async () => {
    await expect(
      readApprovedReplaySnapshot({
        rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'failed' } }),
      } as never)
    ).rejects.toMatchObject({ code: 'read_failed' });

    await expect(
      readApprovedReplaySnapshot({
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as never)
    ).rejects.toMatchObject({ code: 'invalid_snapshot' });

    await expect(
      readApprovedReplaySnapshot({
        rpc: jest.fn().mockResolvedValue({
          data: [
            {
              replay_epoch: 1,
              action_rows: [
                {
                  ...row('bad-row', '2026-07-18T00:00:00.000Z'),
                  entry: { op: 'set', path: '', newValue: true },
                },
              ],
            },
          ],
          error: null,
        }),
      } as never)
    ).rejects.toMatchObject({ code: 'decode_failed' });
  });
});
