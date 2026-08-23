import {
  readCachedApprovedActionRows,
  readFreshApprovedActionRows,
} from '@/lib/gameData/runtimeActionSources';

import {
  getApprovedActionSnapshot,
  getFreshApprovedActionSnapshot,
} from './getApprovedActionSnapshot';

const mockArtifactPath = jest.fn<string | undefined, []>(() => undefined);
const mockReadArtifact = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (callback: unknown) => callback,
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readCachedApprovedActionRows: jest.fn(),
  readFreshApprovedActionRows: jest.fn(),
}));
jest.mock('@/lib/gameData/buildArtifactReader', () => ({
  readBuildGameDataArtifact: (...args: unknown[]) => mockReadArtifact(...args),
}));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => mockArtifactPath(),
}));

const mockReadCachedRows = jest.mocked(readCachedApprovedActionRows);
const mockReadFreshRows = jest.mocked(readFreshApprovedActionRows);
const rows = [
  {
    id: 'snapshot-row',
    entity_type: 'items',
    entry: { op: 'set', path: '火箭.description', newValue: '发布值' },
    created_at: '2026-07-24T00:00:00.000Z',
    status: 'approved',
    created_by: null,
    message: null,
    reviewed_at: null,
  },
];

describe('getApprovedActionSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArtifactPath.mockReturnValue(undefined);
    mockReadCachedRows.mockResolvedValue(rows);
    mockReadFreshRows.mockResolvedValue(rows);
  });

  it('uses the shared cached runtime source', async () => {
    const snapshot = await getApprovedActionSnapshot();

    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.rows[0]?.actions[0]).toMatchObject({
      op: 'set',
      path: '火箭.description',
      newValue: '发布值',
    });
    expect(mockReadCachedRows).toHaveBeenCalledTimes(1);
    expect(mockReadFreshRows).not.toHaveBeenCalled();
  });

  it('provides a fresh snapshot without reading the persistent cache', async () => {
    const snapshot = await getFreshApprovedActionSnapshot();

    expect(snapshot.rows[0]).toMatchObject({ rowId: 'snapshot-row' });
    expect(mockReadFreshRows).toHaveBeenCalledTimes(1);
    expect(mockReadCachedRows).not.toHaveBeenCalled();
  });

  it('uses the shared checked artifact without a runtime source read', async () => {
    const { createApprovedActionArtifactPayload } =
      await import('@/lib/gameData/approvedActionArtifact');
    mockArtifactPath.mockReturnValue('D:/artifact.json');
    mockReadArtifact.mockResolvedValue({
      approvedActions: createApprovedActionArtifactPayload(3, 1, rows),
    });

    const snapshot = await getApprovedActionSnapshot();

    expect(snapshot.rows[0]).toMatchObject({ rowId: 'snapshot-row' });
    expect(mockReadArtifact).toHaveBeenCalledTimes(1);
    expect(mockReadCachedRows).not.toHaveBeenCalled();
  });
});
