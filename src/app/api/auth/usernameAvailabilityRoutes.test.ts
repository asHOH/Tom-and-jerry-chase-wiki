/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

import { requireNotBlocked } from '@/lib/blocks/server';
import { verifyCaptchaProof, verifyCaptchaToken } from '@/lib/captchaUtils';
import { checkRateLimit } from '@/lib/rateLimit';

import { POST as checkUsername } from './check-username/route';
import { POST as register } from './register/route';

const mockLookup = jest.fn();
const mockInsert = jest.fn();
const mockCreateUser = jest.fn();
const mockSignIn = jest.fn();
const mockAuthEmailExists = jest.fn();
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: mockLookup,
  insert: mockInsert,
};
const mockAdmin = {
  from: jest.fn(() => mockQuery),
  rpc: mockAuthEmailExists,
  auth: { admin: { createUser: mockCreateUser, deleteUser: jest.fn() } },
};

jest.mock('@/env', () => ({
  env: { NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN: 'auth.example' },
}));
jest.mock('@/lib/supabase/adminClient', () => ({
  getOptionalSupabaseAdminClient: () => mockAdmin,
  requireSupabaseAdminClient: () => mockAdmin,
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: null }) } }),
}));
jest.mock('@/lib/supabase/ssrClient', () => ({
  createSupabaseRouteClient: () => ({ auth: { signInWithPassword: mockSignIn } }),
}));
jest.mock('@/lib/blocks/server', () => ({
  requireNotBlocked: jest.fn(),
  recordUserIp: jest.fn(),
}));
jest.mock('@/lib/captchaUtils', () => ({
  verifyCaptchaToken: jest.fn(),
  verifyCaptchaProof: jest.fn(),
  generateCaptchaProof: () => 'captcha-proof',
}));
jest.mock('@/lib/passwordUtils', () => ({
  checkPasswordStrength: async () => ({ strength: 3 }),
}));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: { users: 'users' },
  invalidateCache: jest.fn(),
}));

const request = () =>
  new NextRequest('https://example.test/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Official',
      nickname: '新用户',
      password: 'ValidPassw0rd!',
      token: 'captcha-token',
      captchaToken: 'captcha-proof',
    }),
  });

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
  jest.mocked(requireNotBlocked).mockResolvedValue(null);
  jest.mocked(verifyCaptchaToken).mockResolvedValue(true);
  jest.mocked(verifyCaptchaProof).mockReturnValue(true);
  mockLookup.mockResolvedValue({ data: null, error: null });
  mockAuthEmailExists.mockResolvedValue({ data: false, error: null });
  mockCreateUser.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockSignIn.mockResolvedValue({ error: null });
});

describe.each([
  ['preflight', checkUsername, 200],
  ['registration', register, 409],
] as const)('%s username availability', (_name, handler, collisionStatus) => {
  it('rejects normalized auth-email collisions before creating an account', async () => {
    mockAuthEmailExists.mockResolvedValue({ data: true, error: null });
    const response = await handler(request());
    expect(response.status).toBe(collisionStatus);
    expect(await response.json()).toMatchObject({ reason: 'auth_email_already_exists' });
    expect(mockAuthEmailExists).toHaveBeenCalledWith('auth_email_exists', {
      p_email: 'official@auth.example',
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('fails closed when availability lookup fails', async () => {
    mockAuthEmailExists.mockResolvedValue({ data: null, error: { message: 'database down' } });
    const response = await handler(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty('error');
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('honors rate limits before querying account data', async () => {
    jest.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      headers: { 'Retry-After': '60' },
      retryAfterSeconds: 60,
    });
    const response = await handler(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(mockAdmin.from).not.toHaveBeenCalled();
    expect(mockAuthEmailExists).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('honors account blocks before querying account data', async () => {
    jest
      .mocked(requireNotBlocked)
      .mockResolvedValue(NextResponse.json({ error: 'Blocked' }, { status: 403 }));
    const response = await handler(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Blocked' });
    expect(mockAdmin.from).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('rejects failed CAPTCHA verification before querying account data', async () => {
    jest.mocked(verifyCaptchaToken).mockResolvedValue(false);
    jest.mocked(verifyCaptchaProof).mockReturnValue(false);
    const response = await handler(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Captcha verification failed' });
    expect(mockAdmin.from).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});

it.each([
  [null, { status: 'not_exists', captchaProof: 'captcha-proof' }],
  [{ password_hash: 'hash' }, { status: 'exists_with_password', captchaProof: 'captcha-proof' }],
  [{ password_hash: null }, { status: 'requires_password_reset' }],
])('preflight reports the account state for %j', async (user, expected) => {
  mockLookup.mockResolvedValue({ data: user, error: null });
  const response = await checkUsername(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(expected);
});

it('registration rejects an existing username before creating an account', async () => {
  mockLookup.mockResolvedValue({ data: { password_hash: 'hash' }, error: null });
  const response = await register(request());
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ reason: 'username_already_exists' });
  expect(mockCreateUser).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
});

it('registration creates and signs in with the normalized address checked by preflight', async () => {
  const preflight = await checkUsername(request());
  expect(await preflight.json()).toEqual({ status: 'not_exists', captchaProof: 'captcha-proof' });
  const response = await register(request());
  expect(response.status).toBe(201);
  expect(mockAuthEmailExists).toHaveBeenCalledWith('auth_email_exists', {
    p_email: 'official@auth.example',
  });
  expect(mockCreateUser).toHaveBeenCalledWith({
    email: 'official@auth.example',
    password: 'ValidPassw0rd!',
    email_confirm: true,
  });
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'new-user', nickname: '新用户' })
  );
  expect(mockSignIn).toHaveBeenCalledWith({
    email: 'official@auth.example',
    password: 'ValidPassw0rd!',
  });
});
