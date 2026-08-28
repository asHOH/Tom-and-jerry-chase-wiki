import type { NextRequest } from 'next/server';

import { PublicActionQueryError } from '@/lib/gameData/publicActionQueries';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { readCachedApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

import { GET } from './route';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/server', () => {
  class MockNextResponse {
    readonly headers: { get: (name: string) => string | null };
    readonly status: number;
    private readonly responseBody: string | null;

    constructor(body: string | null, init?: { headers?: Record<string, string>; status?: number }) {
      const headers = init?.headers ?? {};
      this.headers = {
        get: (name: string) =>
          Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ??
          null,
      };
      this.responseBody = body;
      this.status = init?.status ?? 200;
    }

    static json(body: unknown, init?: { headers?: Record<string, string>; status?: number }) {
      return new MockNextResponse(JSON.stringify(body), init);
    }

    async json() {
      return this.responseBody === null ? null : JSON.parse(this.responseBody);
    }

    async text() {
      return this.responseBody ?? '';
    }
  }

  return { NextResponse: MockNextResponse };
});
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readCachedApprovedActionRows: jest.fn(),
}));
jest.mock('@/lib/gameData/publicRouteMetrics', () => ({
  logPublicGameDataRouteMetric: jest.fn(),
}));

const mockReadApprovedRows = jest.mocked(readCachedApprovedActionRows);
const mockLogRouteMetric = jest.mocked(logPublicGameDataRouteMetric);
const publicCacheControl = 'public, s-maxage=300, stale-while-revalidate=60';

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
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(publicCacheControl);
    expect(response.headers.get('ETag')).toMatch(/^"[A-Za-z0-9_-]+"$/);
    expect(response.headers.get('Set-Cookie')).toBeNull();
    expect(mockReadApprovedRows).toHaveBeenCalledTimes(1);
  });

  it('returns a stable validator for repeated compatibility requests', async () => {
    const firstResponse = await GET();
    const secondResponse = await GET();

    expect(mockReadApprovedRows).toHaveBeenCalledTimes(2);
    expect(secondResponse.headers.get('ETag')).toBe(firstResponse.headers.get('ETag'));
    expect(secondResponse.headers.get('Cache-Control')).toBe(publicCacheControl);
  });

  it('honors a matching If-None-Match validator without a response body', async () => {
    const firstResponse = await GET();
    const etag = firstResponse.headers.get('ETag');
    expect(etag).not.toBeNull();

    const conditionalRequest = {
      headers: new Headers({ 'If-None-Match': etag ?? '' }),
    } as NextRequest;
    const conditionalResponse = await GET(conditionalRequest);

    expect(conditionalResponse.status).toBe(304);
    expect(conditionalResponse.headers.get('ETag')).toBe(etag);
    expect(conditionalResponse.headers.get('Cache-Control')).toBe(publicCacheControl);
    await expect(conditionalResponse.text()).resolves.toBe('');
    expect(mockLogRouteMetric).toHaveBeenLastCalledWith({
      route: '/api/game-data-actions/public',
      method: 'GET',
      status: 304,
      startedAt: expect.any(Number),
      requestCategory: 'legacy-public-actions',
    });
  });

  it('returns a cacheable empty snapshot when Supabase is disabled', async () => {
    mockReadApprovedRows.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(publicCacheControl);
    expect(response.headers.get('ETag')).toMatch(/^"[A-Za-z0-9_-]+"$/);
    await expect(response.json()).resolves.toEqual({ actions: [] });
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
