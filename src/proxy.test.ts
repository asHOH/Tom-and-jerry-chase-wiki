/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

jest.mock('@/lib/supabase/middleware', () => ({ updateSession: jest.fn() }));

let proxy: typeof import('./proxy').proxy;

beforeAll(async () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    VERCEL: '1',
    VERCEL_ENV: 'preview',
  });
  ({ proxy } = await import('./proxy'));
});

it.each(['/', '/?from=nav', '/factions/cat/', '/characters/tom/', '/maps/house/interactive/'])(
  'serves public wiki reads without session refresh: %s',
  async (path) => {
    const request = new NextRequest(`https://example.test${path}`, {
      headers: { cookie: 'sb-session=expired-token' },
    });
    const response = await proxy(request);

    expect(updateSession).not.toHaveBeenCalled();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(response.headers.has('set-cookie')).toBe(false);
  }
);

it.each(['GET', 'HEAD'])('skips refresh for logged-out homepage %s requests', async (method) => {
  const response = await proxy(new NextRequest('https://example.test/', { method }));
  expect(updateSession).not.toHaveBeenCalled();
  expect(response.headers.get('x-middleware-next')).toBe('1');
});

it.each([
  ['/admin/', 'GET'],
  ['/users/example/', 'GET'],
  ['/settings/', 'GET'],
  ['/notifications/', 'GET'],
  ['/articles/new/', 'GET'],
  ['/characters-private/', 'GET'],
  ['/future-route/', 'GET'],
  ['/', 'POST'],
])('preserves refresh and its response for %s (%s)', async (path, method) => {
  const request = new NextRequest(`https://example.test${path}`, { method });
  const refreshedResponse = NextResponse.next();
  refreshedResponse.cookies.set('sb-session', 'refreshed-token');
  jest.mocked(updateSession).mockResolvedValueOnce(refreshedResponse);

  const response = await proxy(request);

  expect(updateSession).toHaveBeenCalledWith(request);
  expect(response).toBe(refreshedResponse);
  expect(response.cookies.get('sb-session')?.value).toBe('refreshed-token');
  expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
});

it('still blocks unsupported browsers on public pages', async () => {
  const response = await proxy(
    new NextRequest('https://example.test/', { headers: { 'user-agent': 'BaiduBrowser Android' } })
  );

  expect(response.status).toBe(403);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(updateSession).not.toHaveBeenCalled();
});

it('still allows the explicit browser override on public pages', async () => {
  const response = await proxy(
    new NextRequest('https://example.test/?force_continue=1', {
      headers: { 'user-agent': 'BaiduBrowser Android' },
    })
  );

  expect(response.cookies.get('force_continue')?.value).toBe('1');
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(updateSession).not.toHaveBeenCalled();
});
