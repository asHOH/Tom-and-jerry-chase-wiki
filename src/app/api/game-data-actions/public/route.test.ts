import { PublicActionQueryError } from '@/lib/gameData/publicActionQueries';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { readCachedApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

import { GET } from './route';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readCachedApprovedActionRows: jest.fn(),
}));
jest.mock('@/lib/gameData/publicRouteMetrics', () => ({
  logPublicGameDataRouteMetric: jest.fn(),
}));

const mockReadApprovedRows = jest.mocked(readCachedApprovedActionRows);
const mockLogRouteMetric = jest.mocked(logPublicGameDataRouteMetric);

const rows = [
  {
    id: 'action-id',
    entity_type: 'characters',
    entry: { op: 'set', path: 'Tom.name', newValue: 'Thomas' },
    created_at: '2026-07-17T00:00:00.000Z',
    status: 'approved',
    message: 'metadata must not leak into the legacy response',
    reviewed_at: '2026-07-17T00:01:00.000Z',
    created_by: 'user-id',
  },
];

describe('public game data actions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadApprovedRows.mockResolvedValue(rows);
  });

  it('preserves the public response schema through the shared tagged reader', async () => {
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      actions: [
        {
          id: 'action-id',
          entity_type: 'characters',
          entry: { op: 'set', path: 'Tom.name', newValue: 'Thomas' },
          created_at: '2026-07-17T00:00:00.000Z',
        },
      ],
    });
    expect(mockReadApprovedRows).toHaveBeenCalledTimes(1);
  });

  it('routes repeated compatibility requests through the same persistent reader', async () => {
    await GET();
    await GET();

    expect(mockReadApprovedRows).toHaveBeenCalledTimes(2);
  });

  it('preserves the structured failure when cached acquisition fails', async () => {
    const cause = { message: 'query failed' };
    const failure = new PublicActionQueryError('source failed', cause);
    mockReadApprovedRows.mockRejectedValue(failure);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch public actions' });
    expect(consoleError).toHaveBeenCalledWith('Error fetching public game data actions:', cause);
    consoleError.mockRestore();
  });

  it('preserves the unexpected-error response', async () => {
    const failure = new Error('unexpected');
    mockReadApprovedRows.mockRejectedValue(failure);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalledWith('API error:', failure);
    consoleError.mockRestore();
  });

  it('emits one privacy-safe countable metric per request', async () => {
    await GET();

    expect(mockLogRouteMetric).toHaveBeenCalledWith({
      route: '/api/game-data-actions/public',
      method: 'GET',
      status: 200,
      startedAt: expect.any(Number),
      requestCategory: 'legacy-public-actions',
    });
  });
});
