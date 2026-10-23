/** @jest-environment node */

import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import { getUserProfileHref } from '@/lib/users/profileRoutes';

jest.mock('@/lib/supabase/middleware', () => ({ updateSession: jest.fn() }));

let proxy: typeof import('./proxy').proxy;
let proxyConfig: typeof import('./proxy').config;

beforeAll(async () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    VERCEL: '1',
    VERCEL_ENV: 'preview',
  });
  ({ proxy, config: proxyConfig } = await import('./proxy'));
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

it('serves public pages to Baidu Browser without a server-side warning', async () => {
  const response = await proxy(
    new NextRequest('https://example.test/', { headers: { 'user-agent': 'BaiduBrowser Android' } })
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  expect(response.headers.has('set-cookie')).toBe(false);
  expect(updateSession).not.toHaveBeenCalled();
});

it('does not set browser override cookies on public pages', async () => {
  const response = await proxy(
    new NextRequest('https://example.test/?force_continue=1', {
      headers: { 'user-agent': 'BaiduBrowser Android' },
    })
  );

  expect(response.headers.has('set-cookie')).toBe(false);
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(updateSession).not.toHaveBeenCalled();
});

it.each(['', '?force_continue=1'])(
  'refreshes sessions for Baidu Browser on identity-dependent routes (%s)',
  async (search) => {
    const request = new NextRequest(`https://example.test/settings/${search}`, {
      headers: { 'user-agent': 'BaiduBrowser Android', cookie: 'force_continue=1' },
    });
    const refreshedResponse = NextResponse.next();
    refreshedResponse.cookies.set('sb-session', 'refreshed-token');
    jest.mocked(updateSession).mockResolvedValueOnce(refreshedResponse);

    expect(await proxy(request)).toBe(refreshedResponse);
    expect(updateSession).toHaveBeenCalledWith(request);
    expect(refreshedResponse.cookies.get('sb-session')?.value).toBe('refreshed-token');
    expect(refreshedResponse.cookies.has('force_continue')).toBe(false);
  }
);

describe.each(['GET', 'HEAD'])('AkariBot profile aliases (%s)', (method) => {
  it.each([
    ['/User:%E7%8C%AB%E9%BC%A0%E7%94%A8%E6%88%B7/', '猫鼠用户'],
    ['/User:Some%20User/', 'Some User'],
    ['/User:Mixed_Case/', 'Mixed_Case'],
    ['/User:team/editor/', 'team/editor'],
    ['/User:team%2Feditor/', 'team/editor'],
    ['/User:team%2F/', 'team/'],
    ['/User:%252Feditor/', '%2Feditor'],
    ['/User:A%3FB%23C%25/', 'A?B#C%'],
    ['/User:alice.json', 'alice.json'],
    ['/User:alice.json/', 'alice.json'],
    ['/User%3AEditor/', 'Editor'],
    ['/User:%2F%2Fevil.test/', '//evil.test'],
  ])('redirects %s to the public profile for %s', async (path, nickname) => {
    const url = `https://example.test${path}`;
    expect(unstable_doesMiddlewareMatch({ config: proxyConfig, url })).toBe(true);
    const response = await proxy(new NextRequest(url, { method }));

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      new URL(getUserProfileHref(nickname), 'https://example.test').toString()
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(updateSession).not.toHaveBeenCalled();
  });
});

it('does not redirect non-read requests to profile aliases', async () => {
  const request = new NextRequest('https://example.test/User:Editor/', { method: 'POST' });
  const refreshedResponse = NextResponse.next();
  jest.mocked(updateSession).mockResolvedValueOnce(refreshedResponse);
  expect(await proxy(request)).toBe(refreshedResponse);
  expect(updateSession).toHaveBeenCalledWith(request);
});

it('rejects malformed nickname encoding without throwing or refreshing the session', async () => {
  const response = await proxy(new NextRequest('https://example.test/User:%E0%A4%A/'));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: 'Invalid user nickname encoding' });
  expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  expect(updateSession).not.toHaveBeenCalled();
});

it('redirects Baidu Browser profile aliases without setting browser override cookies', async () => {
  const response = await proxy(
    new NextRequest('https://example.test/User:Editor/?force_continue=1', {
      headers: { 'user-agent': 'BaiduBrowser Android' },
    })
  );
  expect(response.status).toBe(307);
  expect(response.headers.get('Location')).toBe(
    new URL(getUserProfileHref('Editor'), 'https://example.test').toString()
  );
  expect(response.headers.has('set-cookie')).toBe(false);
  expect(updateSession).not.toHaveBeenCalled();
});
