/** @jest-environment node */

import { NextRequest } from 'next/server';

import { incrementArticleViewCount } from '@/lib/articles/server/detailQueries';
import { getPublicReadClient } from '@/lib/articles/server/readClient';
import { checkRateLimit } from '@/lib/rateLimit';

import { GET, POST } from './route';

jest.mock('@/lib/articles/server/detailQueries', () => ({ incrementArticleViewCount: jest.fn() }));
jest.mock('@/lib/articles/server/readClient', () => ({ getPublicReadClient: jest.fn() }));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/constants/seo', () => ({ SITE_URL: 'https://tjwiki.test' }));

const id = '00000000-0000-4000-8000-000000000001';
const context = { params: Promise.resolve({ id }) };
const query = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };
const client = { from: jest.fn(() => query) };
const request = (method: string, origin = 'https://tjwiki.test') =>
  new NextRequest(`https://tjwiki.test/api/articles/${id}/views/`, {
    method,
    headers: { origin },
  });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
  jest.mocked(getPublicReadClient).mockReturnValue(client as never);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { view_count: 12 }, error: null });
});

it('reads the approved article count without recording a view or caching the response', async () => {
  const response = await GET(request('GET'), context);
  expect(await response.json()).toEqual({ viewCount: 12 });
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(query.eq).toHaveBeenCalledWith('current_version.status', 'approved');
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});

it('records a view for a published article on POST', async () => {
  const response = await POST(request('POST'), context);
  expect(response.status).toBe(200);
  expect(incrementArticleViewCount).toHaveBeenCalledTimes(1);
  expect(incrementArticleViewCount).toHaveBeenCalledWith(id);
});

it('does not record views for missing or unpublished articles', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await POST(request('POST'), context)).status).toBe(404);
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});

it('rejects cross-origin writes before querying the database', async () => {
  expect((await POST(request('POST', 'https://other.test'), context)).status).toBe(403);
  expect(client.from).not.toHaveBeenCalled();
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});

it('rejects invalid IDs', async () => {
  expect((await GET(request('GET'), { params: Promise.resolve({ id: 'invalid' }) })).status).toBe(
    400
  );
  expect(client.from).not.toHaveBeenCalled();
});

it('honors rate limits without counting a view', async () => {
  jest.mocked(checkRateLimit).mockResolvedValue({
    allowed: false,
    headers: { 'Retry-After': '60' },
    retryAfterSeconds: 60,
  });
  const response = await POST(request('POST'), context);
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBe('60');
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});

it('degrades safely when articles are disabled', async () => {
  jest.mocked(getPublicReadClient).mockReturnValue(undefined);
  expect((await POST(request('POST'), context)).status).toBe(404);
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});

it('returns a structured failure without incrementing when the read fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  query.maybeSingle.mockResolvedValue({ data: null, error: new Error('unavailable') });
  expect((await POST(request('POST'), context)).status).toBe(500);
  expect(incrementArticleViewCount).not.toHaveBeenCalled();
});
