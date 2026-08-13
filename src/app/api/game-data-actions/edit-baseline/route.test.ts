import type { NextRequest } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { checkRateLimit } from '@/lib/rateLimit';

import { GET, POST } from './route';

jest.mock('@/constants/seo', () => ({
  SITE_URL: 'https://www.tjwiki.com',
}));

jest.mock('@/lib/gameData/publicActionsCache', () => ({
  invalidatePublicGameDataActionsCache: jest.fn(),
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

const mockGetPublishedGameDataSnapshot = jest.mocked(getPublishedGameDataSnapshot);
const mockInvalidatePublicGameDataActionsCache = jest.mocked(invalidatePublicGameDataActionsCache);
const mockCheckRateLimit = jest.mocked(checkRateLimit);

const publishedSnapshot = {
  revision: 'v1:published' as const,
  actionRevision: 'v1:actions' as const,
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
    mockGetPublishedGameDataSnapshot.mockResolvedValue(publishedSnapshot);
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps GET read-only, including in development', async () => {
    jest.replaceProperty(
      process.env as Record<string, string | undefined>,
      'NODE_ENV',
      'development'
    );

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      revision: 'v1:published',
      data: expect.objectContaining({ characters: {}, items: {}, maps: {} }),
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockInvalidatePublicGameDataActionsCache).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing origin', undefined],
    ['a malformed origin', 'not-an-origin'],
    ['an origin containing a path', 'https://dev.tjwiki.com/path'],
    ['a cross-origin request', 'https://example.com'],
  ])('rejects %s without invalidating', async (_label, origin) => {
    const response = await POST(createRequest(origin));

    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockInvalidatePublicGameDataActionsCache).not.toHaveBeenCalled();
    expect(mockGetPublishedGameDataSnapshot).not.toHaveBeenCalled();
  });

  it('fails open when the optional limiter is unavailable', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockCheckRateLimit.mockRejectedValue(new Error('Upstash unavailable'));
    mockGetPublishedGameDataSnapshot.mockImplementation(async () => {
      expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
      return publishedSnapshot;
    });

    const response = await POST(createRequest('https://dev.tjwiki.com'));

    expect(response.status).toBe(200);
    expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedGameDataSnapshot).toHaveBeenCalledTimes(1);
  });

  it('returns limiter headers on a valid denial without invalidating', async () => {
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
    expect(mockInvalidatePublicGameDataActionsCache).not.toHaveBeenCalled();
    expect(mockGetPublishedGameDataSnapshot).not.toHaveBeenCalled();
  });

  it('allows an unconfigured limiter and refreshes before reading', async () => {
    mockGetPublishedGameDataSnapshot.mockImplementation(async () => {
      expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
      return publishedSnapshot;
    });

    const response = await POST(createRequest('http://localhost:3000', 'http://localhost:3000'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ revision: 'v1:published' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
    expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
  });

  it('allows the configured public origin behind a reverse proxy', async () => {
    const response = await POST(createRequest('https://www.tjwiki.com', 'https://localhost:3000'));

    expect(response.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
    expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedGameDataSnapshot).toHaveBeenCalledTimes(1);
  });

  it('uses the expensive endpoint bucket before refreshing a configured deployment', async () => {
    const request = createRequest('https://dev.tjwiki.com');

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      request,
      'expensive',
      'game-data-edit-baseline'
    );
    expect(mockInvalidatePublicGameDataActionsCache).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedGameDataSnapshot).toHaveBeenCalledTimes(1);
  });
});
