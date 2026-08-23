import type { NextRequest } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { getFreshApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { checkRateLimit } from '@/lib/rateLimit';

import { GET, POST } from './route';

jest.mock('@/constants/seo', () => ({
  SITE_URL: 'https://www.tjwiki.com',
}));
jest.mock('@/lib/gameData/publicRouteMetrics', () => ({
  logPublicGameDataRouteMetric: jest.fn(),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  invalidatePublicGameDataActionsCache: jest.fn(),
}));
jest.mock('@/lib/gameData/published/getApprovedActionSnapshot', () => ({
  getFreshApprovedActionSnapshot: jest.fn(),
}));
jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedGameDataSnapshot: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}));
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      status: init?.status ?? 200,
      json: async () => body,
      headers: new Headers(init?.headers),
    }),
  },
}));

const mockGetFreshSnapshot = jest.mocked(getFreshApprovedActionSnapshot);
const mockGetPublishedSnapshot = jest.mocked(getPublishedGameDataSnapshot);
const mockCheckRateLimit = jest.mocked(checkRateLimit);
const mockLogRouteMetric = jest.mocked(logPublicGameDataRouteMetric);
const mockInvalidatePublicCache = jest.mocked(invalidatePublicGameDataActionsCache);

const freshSnapshot = {
  actionRevision: 'v1:fresh-actions' as const,
  rows: [],
};
const publishedSnapshot = {
  revision: 'v1:published' as const,
  actionRevision: 'v1:fresh-actions' as const,
  buildIdentity: 'build',
  data: {
    achievements: { cat: {}, mouse: {} },
    characters: {},
    cards: {},
    entities: {},
    buffs: {},
    items: {},
    fixtures: {},
    maps: {},
    modes: {},
    specialSkills: { cat: {}, mouse: {} },
    traits: {},
  },
};

function createRequest(origin?: string, requestOrigin = 'https://dev.tjwiki.com'): NextRequest {
  return {
    headers: new Headers(origin === undefined ? {} : { Origin: origin }),
    nextUrl: new URL(`${requestOrigin}/api/game-data-actions/edit-baseline`),
  } as NextRequest;
}

describe('/api/game-data-actions/edit-baseline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFreshSnapshot.mockResolvedValue(freshSnapshot);
    mockGetPublishedSnapshot.mockResolvedValue(publishedSnapshot);
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
  });

  it('keeps GET on the normal cached snapshot path', async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      revision: 'v1:published',
      data: expect.objectContaining({ characters: {}, items: {}, maps: {} }),
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(undefined);
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing origin', undefined],
    ['a malformed origin', 'not-an-origin'],
    ['an origin containing a path', 'https://dev.tjwiki.com/path'],
    ['a cross-origin request', 'https://example.com'],
  ])('rejects %s without acquiring a baseline', async (_label, origin) => {
    const response = await POST(createRequest(origin));

    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockGetPublishedSnapshot).not.toHaveBeenCalled();
  });

  it('fails open when the optional limiter is unavailable', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockCheckRateLimit.mockRejectedValue(new Error('Upstash unavailable'));

    const response = await POST(createRequest('https://dev.tjwiki.com'));

    expect(response.status).toBe(200);
    expect(mockGetFreshSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('returns limiter headers on a valid denial without acquiring a baseline', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 30,
      headers: {
        'Retry-After': '30',
        'X-RateLimit-Limit': '6',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '123',
      },
    });

    const response = await POST(createRequest('https://dev.tjwiki.com'));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockGetPublishedSnapshot).not.toHaveBeenCalled();
  });

  it('returns a fresh baseline without globally invalidating cached public data', async () => {
    const request = createRequest('http://localhost:3000', 'http://localhost:3000');

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ revision: 'v1:published' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      request,
      'expensive',
      'game-data-edit-baseline'
    );
    expect(mockGetFreshSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('allows the configured public origin behind a reverse proxy', async () => {
    const response = await POST(createRequest('https://www.tjwiki.com', 'https://localhost:3000'));

    expect(response.status).toBe(200);
    expect(mockGetFreshSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
  });

  it('returns a structured failure when fresh acquisition fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetFreshSnapshot.mockRejectedValue(new Error('source unavailable'));

    const response = await POST(createRequest('https://dev.tjwiki.com'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: '加载编辑数据失败' });
    expect(mockGetPublishedSnapshot).not.toHaveBeenCalled();
  });

  it('emits one privacy-safe countable metric for each POST result', async () => {
    await POST(createRequest('https://dev.tjwiki.com'));

    expect(mockLogRouteMetric).toHaveBeenCalledWith({
      route: '/api/game-data-actions/edit-baseline',
      method: 'POST',
      status: 200,
      startedAt: expect.any(Number),
      requestCategory: 'edit-baseline-refresh',
    });
  });
});
