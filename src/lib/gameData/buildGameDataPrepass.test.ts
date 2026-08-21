import {
  createDisabledBuildGameDataPrepass,
  createEnabledBuildGameDataPrepass,
} from './buildGameDataPrepass';

jest.mock('server-only', () => ({}), { virtual: true });

const actionRow = {
  id: 'row-a',
  entity_type: 'items',
  entry: { op: 'set', path: '火箭.description', newValue: '发布值' },
  created_at: '2026-08-21T00:00:00.000Z',
  status: 'approved',
  created_by: null,
  message: null,
  reviewed_at: null,
};

const contributorSource = {
  sourceActionCount: 1,
  rowCount: 1,
  rows: [
    {
      characterId: '汤姆',
      contributorId: '11111111-1111-4111-8111-111111111111',
      nickname: '贡献者',
      contributionCount: 1,
    },
  ],
};

const syncedHistorySource = {
  sourceActionCount: 1,
  rowCount: 1,
  operationCount: 1,
  rows: [
    {
      entityType: 'items',
      createdAt: '2026-08-20T00:00:00.000Z',
      actions: [{ op: 'set' as const, path: '火箭.description' }],
    },
  ],
};

describe('build game-data prepass', () => {
  it('generates a valid empty artifact without any acquisition dependencies', () => {
    const result = createDisabledBuildGameDataPrepass(
      1,
      'deployment-1',
      () => '2026-08-21T00:00:00.000Z'
    );

    expect(result.replayEpoch).toBeNull();
    expect(result.artifact).toMatchObject({
      deploymentIdentity: 'deployment-1',
      approvedActions: { replayEpoch: null, rowCount: 0, rows: [] },
      contributors: { sourceActionCount: 0, characterCount: 0, index: {} },
      syncedHistory: { sourceActionCount: 0, rowCount: 0, operationCount: 0, rows: [] },
    });
    expect(result.summary.sources.map(({ fetchCount }) => fetchCount)).toEqual([0, 0, 0]);
    expect(result.summary.epochValidation.checkCount).toBe(0);
  });

  it('acquires the two public sources once in the required order', async () => {
    const order: string[] = [];
    const epochs = [7, 7];
    const result = await createEnabledBuildGameDataPrepass(1, 'deployment-1', {
      queryContributors: async () => {
        order.push('contributors');
        return contributorSource;
      },
      querySyncedHistory: async () => {
        order.push('history');
        return syncedHistorySource;
      },
      readReplayEpoch: async () => {
        order.push('epoch');
        return epochs.shift()!;
      },
      queryApprovedActions: async () => {
        order.push('approved');
        return { rows: [actionRow], exactCount: 1 };
      },
    });

    expect(order).toEqual(['contributors', 'history', 'epoch', 'approved', 'epoch']);
    expect(result.replayEpoch).toBe(7);
    expect(result.summary.sources.map(({ fetchCount }) => fetchCount)).toEqual([1, 1, 1]);
    expect(result.summary.epochValidation.checkCount).toBe(2);
  });

  it('rejects replay drift but does not epoch-bind contributor attribution', async () => {
    const epochs = [7, 8];
    await expect(
      createEnabledBuildGameDataPrepass(1, 'deployment-1', {
        queryContributors: async () => contributorSource,
        querySyncedHistory: async () => syncedHistorySource,
        readReplayEpoch: async () => epochs.shift()!,
        queryApprovedActions: async () => ({ rows: [actionRow], exactCount: 1 }),
      })
    ).rejects.toMatchObject({
      code: 'approved_replay_epoch_drift',
      summary: { attempt: 1 },
    });
  });
});
