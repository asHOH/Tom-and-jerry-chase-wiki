/** @jest-environment node */

import { generateKeyPairSync, sign } from 'node:crypto';
import { NextRequest } from 'next/server';

import { updateSession } from './middleware';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://latency-test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  },
}));

const COOKIE_NAME = 'sb-latency-test-auth-token';
const user = { id: '00000000-0000-4000-8000-000000000001' };
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

function session(expiresIn = 3600) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp })}.${Buffer.from('test-signature').toString('base64url')}`,
    refresh_token: 'test-refresh-token',
    expires_at: exp,
    expires_in: expiresIn,
    token_type: 'bearer',
    user,
  };
}

function requestWithSession(value: ReturnType<typeof session>) {
  return new NextRequest('https://example.test/admin/', {
    headers: { cookie: `${COOKIE_NAME}=base64-${encode(value)}` },
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('does not contact auth for a visitor without a session', async () => {
  const network = jest.spyOn(globalThis, 'fetch');
  const response = await updateSession(new NextRequest('https://example.test/admin/'));

  expect(network).not.toHaveBeenCalled();
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(jest.getTimerCount()).toBe(0);
});

it('verifies ES256 locally and reuses the cached public key on the next request', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const value = session();
  const unsigned = `${encode({ alg: 'ES256', typ: 'JWT', kid: 'test-es256' })}.${encode({ sub: user.id, exp: value.expires_at })}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  value.access_token = `${unsigned}.${signature.toString('base64url')}`;
  const network = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    expect(String(input)).toContain('/auth/v1/.well-known/jwks.json');
    return Response.json({
      keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test-es256', alg: 'ES256' }],
    });
  });

  for (let i = 0; i < 2; i++) {
    const response = await updateSession(requestWithSession(value));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('set-cookie')).toBe(false);
  }

  expect(network).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

it('bounds an expired-session refresh to five seconds without clearing cookies or retrying the network', async () => {
  const request = requestWithSession(session(-1));
  const originalCookie = request.cookies.get(COOKIE_NAME)?.value;
  const network = jest.spyOn(globalThis, 'fetch').mockImplementation(
    (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      })
  );

  const pending = updateSession(request);
  await jest.advanceTimersByTimeAsync(5000);
  const response = await pending;

  expect(response.status).toBe(503);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Retry-After')).toBe('5');
  expect(response.headers.has('x-middleware-next')).toBe(false);
  expect(response.headers.has('set-cookie')).toBe(false);
  expect(network.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);

  // Let the real SDK finish its internal retry loop after the response deadline.
  await jest.advanceTimersByTimeAsync(35000);
  expect(network).toHaveBeenCalledTimes(1);
  expect(request.cookies.get(COOKIE_NAME)?.value).toBe(originalCookie);
  expect(jest.getTimerCount()).toBe(0);
});

it('still delivers refreshed session cookies before the deadline', async () => {
  const request = requestWithSession(session(-1));
  const originalCookie = request.cookies.get(COOKIE_NAME)?.value;
  const refreshedSession = session();
  const network = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input) =>
      Response.json(String(input).includes('/token?') ? refreshedSession : user)
    );

  const response = await updateSession(request);

  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(response.cookies.get(COOKIE_NAME)?.value).toBe(request.cookies.get(COOKIE_NAME)?.value);
  expect(response.cookies.get(COOKIE_NAME)?.value).not.toBe(originalCookie);
  expect(network).toHaveBeenCalledTimes(2);
  expect(jest.getTimerCount()).toBe(0);
});

it('returns a retryable response for auth outages instead of continuing as logged out', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json({ message: 'Unavailable' }, { status: 503 }));
  const response = await updateSession(requestWithSession(session()));

  expect(response.status).toBe(503);
  expect(response.headers.has('set-cookie')).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

it.each(['outage', 'timeout'])(
  'preserves a completed refresh when the following verification encounters %s',
  async (failure) => {
    const request = requestWithSession(session(-1));
    const originalCookie = request.cookies.get(COOKIE_NAME)?.value;
    const refreshedSession = session();
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input).includes('/token?')) return Response.json(refreshedSession);
      if (failure === 'outage') return Response.json({ message: 'Unavailable' }, { status: 503 });
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });

    const pending = updateSession(request);
    if (failure === 'timeout') await jest.advanceTimersByTimeAsync(5000);
    const response = await pending;

    expect(response.status).toBe(503);
    expect(request.cookies.get(COOKIE_NAME)?.value).not.toBe(originalCookie);
    expect(response.cookies.get(COOKIE_NAME)?.value).toBe(request.cookies.get(COOKIE_NAME)?.value);
    expect(jest.getTimerCount()).toBe(0);
  }
);
