/** @jest-environment node */
import type { NextRequest } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import {
  getApprovedActionSnapshot,
  getFreshApprovedActionSnapshot,
} from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { createPublishedRevision } from '@/lib/gameData/published/revision';
import { checkRateLimit } from '@/lib/rateLimit';

import { GET, POST } from './route';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/gameData/published/buildIdentity', () => ({ PRODUCTION_BUILD_IDENTITY: 'build' }));
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
  getApprovedActionSnapshot: jest.fn(),
  getFreshApprovedActionSnapshot: jest.fn(),
}));
jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedGameDataSnapshot: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}));
const mockGetApprovedSnapshot = jest.mocked(getApprovedActionSnapshot);
const mockGetFreshSnapshot = jest.mocked(getFreshApprovedActionSnapshot);
const mockGetPublishedSnapshot = jest.mocked(getPublishedGameDataSnapshot);
const mockCheckRateLimit = jest.mocked(checkRateLimit);
const mockLogRouteMetric = jest.mocked(logPublicGameDataRouteMetric);
const mockInvalidatePublicCache = jest.mocked(invalidatePublicGameDataActionsCache);

const freshSnapshot = {
  actionRevision: 'v1:fresh-actions' as const,
  rows: [],
};
const revision = (digit: string): `v1:${string}` => `v1:${digit.repeat(64)}`;
const publishedSnapshot = {
  revision: createPublishedRevision('build', freshSnapshot.actionRevision),
  actionRevision: 'v1:fresh-actions' as const,
  buildIdentity: 'build',
  domainRevisions: {
    achievements: revision('7'),
    buffs: revision('1'),
    cards: revision('0'),
    characters: revision('9'),
    entities: revision('a'),
    fixtures: revision('3'),
    items: revision('2'),
    maps: revision('4'),
    modes: revision('5'),
    specialSkills: revision('6'),
    traits: revision('8'),
  } as const,
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

function createRequest(
  origin?: string,
  requestOrigin = 'https://dev.tjwiki.com',
  body?: unknown
): NextRequest {
  const url = new URL(`${requestOrigin}/api/game-data-actions/edit-baseline`);
  return Object.assign(
    new Request(url, {
      method: 'POST',
      headers: {
        ...(origin === undefined ? {} : { Origin: origin }),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    { nextUrl: url }
  ) as NextRequest;
}

describe('/api/game-data-actions/edit-baseline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedSnapshot.mockResolvedValue(freshSnapshot);
    mockGetFreshSnapshot.mockResolvedValue(freshSnapshot);
    mockGetPublishedSnapshot.mockResolvedValue(publishedSnapshot);
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
  });

  it('keeps GET on the normal cached snapshot path', async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      revision: publishedSnapshot.revision,
      domainRevisions: publishedSnapshot.domainRevisions,
      data: expect.objectContaining({ characters: {}, items: {}, maps: {} }),
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('ETag')).toBe(`W/"${publishedSnapshot.revision}"`);
    expect(mockGetApprovedSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it.each([
    `W/"${publishedSnapshot.revision}"`,
    `"${publishedSnapshot.revision}"`,
    `"older", W/"${publishedSnapshot.revision}"`,
    '*',
  ])('returns an empty 304 before composing domains for %s', async (validator) => {
    const response = await GET(
      new Request('https://www.tjwiki.com/api/game-data-actions/edit-baseline/', {
        headers: { 'If-None-Match': validator },
      }) as NextRequest
    );
    expect(response.status).toBe(304);
    expect(await response.text()).toBe('');
    expect(response.headers.get('ETag')).toBe(`W/"${publishedSnapshot.revision}"`);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockGetPublishedSnapshot).not.toHaveBeenCalled();
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
  });

  it.each([
    createPublishedRevision('older-build', freshSnapshot.actionRevision),
    createPublishedRevision('build', 'v1:older-actions'),
  ])('returns the full body when the build or approved revision changed', async (olderRevision) => {
    const response = await GET(
      new Request('https://www.tjwiki.com/api/game-data-actions/edit-baseline/', {
        headers: { 'If-None-Match': `W/"${olderRevision}"` },
      }) as NextRequest
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      revision: publishedSnapshot.revision,
      data: publishedSnapshot.data,
    });
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
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
    request.headers.set('If-None-Match', `W/"${publishedSnapshot.revision}"`);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ revision: publishedSnapshot.revision });
    expect(response.headers.get('ETag')).toBeNull();
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

  it('accepts an ordinary empty POST represented as a stream by the Node adapter', async () => {
    const url = new URL('https://www.tjwiki.com/api/game-data-actions/edit-baseline/');
    const request = Object.assign(
      new Request(url, {
        method: 'POST',
        headers: { Origin: url.origin },
        body: '',
      }),
      { nextUrl: url }
    ) as NextRequest;
    request.headers.delete('content-type');
    expect(request.body).not.toBeNull();
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('rejects recovery bodies with an unsupported content type', async () => {
    const request = createRequest('https://www.tjwiki.com', undefined, { visibleRevisions: [] });
    request.headers.set('content-type', 'text/plain');
    expect((await POST(request)).status).toBe(415);
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON without expiring any cache', async () => {
    const request = Object.assign(
      new Request('https://www.tjwiki.com/api/game-data-actions/edit-baseline/', {
        method: 'POST',
        headers: { Origin: 'https://www.tjwiki.com', 'Content-Type': 'application/json' },
        body: '{',
      }),
      { nextUrl: new URL('https://www.tjwiki.com/api/game-data-actions/edit-baseline/') }
    ) as NextRequest;
    expect((await POST(request)).status).toBe(400);
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('allows the configured public origin behind a reverse proxy', async () => {
    const response = await POST(createRequest('https://www.tjwiki.com', 'https://localhost:3000'));

    expect(response.status).toBe(200);
    expect(mockGetFreshSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
  });

  it('expires only mismatched domains, deduplicating repeated registrations', async () => {
    const response = await POST(
      createRequest('https://www.tjwiki.com', undefined, {
        visibleRevisions: [
          { entityType: 'characters', revision: revision('f') },
          { entityType: 'traits', revision: publishedSnapshot.domainRevisions.traits },
          { entityType: 'characters', revision: revision('e') },
        ],
      })
    );
    expect(response.status).toBe(200);
    expect(mockInvalidatePublicCache).toHaveBeenCalledTimes(1);
    expect(mockInvalidatePublicCache).toHaveBeenCalledWith(['characters']);
    expect(mockGetPublishedSnapshot).toHaveBeenCalledWith(freshSnapshot);
  });

  it('preserves caches when the submitted domains already match the fresh baseline', async () => {
    const response = await POST(
      createRequest('https://www.tjwiki.com', undefined, {
        visibleRevisions: [
          { entityType: 'characters', revision: publishedSnapshot.domainRevisions.characters },
          { entityType: 'traits', revision: publishedSnapshot.domainRevisions.traits },
        ],
      })
    );
    expect(response.status).toBe(200);
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { visibleRevisions: [] },
    { visibleRevisions: [{ entityType: 'users', revision: revision('a') }] },
    { visibleRevisions: [{ entityType: 'traits', revision: 'v1:invalid' }] },
    {
      visibleRevisions: Array.from({ length: 23 }, () => ({
        entityType: 'traits',
        revision: revision('a'),
      })),
    },
    { visibleRevisions: [{ entityType: 'traits', revision: revision('a'), tag: 'arbitrary-tag' }] },
  ])('rejects invalid recovery input without reading or expiring data: %j', async (body) => {
    const response = await POST(createRequest('https://www.tjwiki.com', undefined, body));
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('rejects an oversized recovery body before acquiring the baseline', async () => {
    const request = createRequest('https://www.tjwiki.com', undefined, { visibleRevisions: [] });
    request.headers.set('content-length', String(2 ** 30));
    expect((await POST(request)).status).toBe(413);
    expect(mockGetFreshSnapshot).not.toHaveBeenCalled();
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
  });

  it('preserves caches if fresh baseline acquisition fails during recovery', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetFreshSnapshot.mockRejectedValue(new Error('source unavailable'));
    const response = await POST(
      createRequest('https://www.tjwiki.com', undefined, {
        visibleRevisions: [{ entityType: 'characters', revision: revision('f') }],
      })
    );
    expect(response.status).toBe(500);
    expect(mockInvalidatePublicCache).not.toHaveBeenCalled();
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
