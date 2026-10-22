/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

import { changeOwnPassword, updateUserAccount } from '@/lib/auth/accountCredentials';
import { checkPasswordStrength } from '@/lib/passwordUtils';
import { checkRateLimit } from '@/lib/rateLimit';

import { POST as changePassword } from './change-password/route';
import { POST as updateUser } from './update-user/route';

const mockGetClaims = jest.fn();
const mockSessionClient = { auth: { getClaims: mockGetClaims } };
const mockPermissionClient = { from: jest.fn() };
const mockRequirePermission = jest.fn();
const mockCreateRouteClient = jest.fn((_request: NextRequest, response: NextResponse) => {
  response.cookies.set('session', 'refreshed', { httpOnly: true });
  return mockSessionClient;
});

jest.mock('@/lib/auth/accountCredentials', () => ({
  changeOwnPassword: jest.fn(),
  updateUserAccount: jest.fn(),
}));
jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));
jest.mock('@/lib/supabase/ssrClient', () => ({
  createSupabaseRouteClient: (request: NextRequest, response: NextResponse) =>
    mockCreateRouteClient(request, response),
}));
jest.mock('@/lib/passwordUtils', () => ({ checkPasswordStrength: jest.fn() }));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));

const passwordBody = { oldPassword: 'PreviousPassw0rd!', newPassword: 'NewPassw0rd!' };
const updateBody = { userId: 'target-user', nickname: '新昵称', password: 'NewPassw0rd!' };
const request = (body: unknown) =>
  new NextRequest('https://example.test/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
  jest.mocked(checkPasswordStrength).mockResolvedValue({ strength: 3, reason: '密码强度良好' });
  jest.mocked(changeOwnPassword).mockResolvedValue({ ok: true });
  jest.mocked(updateUserAccount).mockResolvedValue({ ok: true });
  mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'signed-in-user' } }, error: null });
  mockRequirePermission.mockResolvedValue({
    supabase: mockPermissionClient,
    userId: 'administrator',
    grants: [],
  });
});

describe('change-password route', () => {
  it('uses the signed-in user and session client, returning refreshed cookies on success', async () => {
    const input = request({ ...passwordBody, userId: 'another-user' });
    const response = await changePassword(input);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: '密码修改成功。' });
    expect(response.cookies.get('session')?.value).toBe('refreshed');
    expect(mockCreateRouteClient).toHaveBeenCalledWith(input, response);
    expect(checkRateLimit).toHaveBeenCalledWith(input, 'auth', 'auth-change-password');
    expect(checkPasswordStrength).toHaveBeenCalledWith(passwordBody.newPassword);
    expect(changeOwnPassword).toHaveBeenCalledWith(
      { userId: 'signed-in-user', ...passwordBody },
      mockSessionClient
    );
  });

  it.each([
    ['credentials_unavailable', 500, '获取用户信息失败。'],
    ['old_password_required', 400, '请输入旧密码。'],
    ['incorrect_old_password', 401, '旧密码不正确。'],
    ['unchanged_password', 400, '新密码不能与旧密码相同。'],
    ['update_failed', 500, '修改密码失败。'],
  ] as const)('maps %s to its existing HTTP response', async (reason, status, error) => {
    jest.mocked(changeOwnPassword).mockResolvedValue({ ok: false, reason });

    const response = await changePassword(request(passwordBody));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
  });

  it('honors rate limits before creating a session client', async () => {
    jest.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      headers: { 'Retry-After': '60' },
      retryAfterSeconds: 60,
    });

    const response = await changePassword(request(passwordBody));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(await response.json()).toEqual({ error: 'Too many requests' });
    expect(mockCreateRouteClient).not.toHaveBeenCalled();
    expect(changeOwnPassword).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: null },
    { data: { claims: { sub: 'signed-in-user' } }, error: new Error('Expired session') },
  ])('requires authenticated claims before changing credentials: %j', async (claims) => {
    mockGetClaims.mockResolvedValue(claims);

    const response = await changePassword(request(passwordBody));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: '需要先登录。' });
    expect(checkPasswordStrength).not.toHaveBeenCalled();
    expect(changeOwnPassword).not.toHaveBeenCalled();
  });

  it.each([null, {}, { newPassword: '' }, { newPassword: 123 }])(
    'rejects a missing or invalid new password: %j',
    async (body) => {
      const response = await changePassword(request(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: '新密码不能为空。' });
      expect(checkPasswordStrength).not.toHaveBeenCalled();
      expect(changeOwnPassword).not.toHaveBeenCalled();
    }
  );

  it('rejects a weak password before changing credentials', async () => {
    jest.mocked(checkPasswordStrength).mockResolvedValue({ strength: 1, reason: '密码过短' });

    const response = await changePassword(request(passwordBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: '密码强度不足：密码过短' });
    expect(changeOwnPassword).not.toHaveBeenCalled();
  });

  it('allows the credential operation to decide whether an old password is required', async () => {
    const response = await changePassword(request({ newPassword: passwordBody.newPassword }));

    expect(response.status).toBe(200);
    expect(changeOwnPassword).toHaveBeenCalledWith(
      { userId: 'signed-in-user', oldPassword: undefined, newPassword: passwordBody.newPassword },
      mockSessionClient
    );
  });

  it('preserves the structured unexpected-error response', async () => {
    jest.mocked(changeOwnPassword).mockRejectedValue(new Error('Unexpected failure'));

    const response = await changePassword(request(passwordBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: '发生未知错误。' });
  });
});

describe('update-user route', () => {
  it('forwards edit permission options and uses the permission-checked client', async () => {
    const input = request(updateBody);
    const response = await updateUser(input);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'User updated successfully' });
    expect(mockRequirePermission).toHaveBeenCalledWith('user.update', undefined, 'all', {
      request: input,
      blockAction: 'edit',
    });
    expect(updateUserAccount).toHaveBeenCalledWith(updateBody, mockPermissionClient);
  });

  it.each([
    ['credentials_unavailable', 500, 'Failed to update user'],
    ['update_failed', 500, 'Failed to update user'],
    ['nickname_conflict', 409, 'Nickname already in use'],
  ] as const)('maps %s to its existing HTTP response', async (reason, status, error) => {
    jest.mocked(updateUserAccount).mockResolvedValue({ ok: false, reason });

    const response = await updateUser(request(updateBody));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
  });

  it.each([401, 403])('returns a %i guard response before changing the account', async (status) => {
    const denied = NextResponse.json({ error: 'Access denied' }, { status });
    mockRequirePermission.mockResolvedValue({ error: denied });

    const response = await updateUser(request(updateBody));

    expect(response).toBe(denied);
    expect(updateUserAccount).not.toHaveBeenCalled();
  });

  it.each([{}, { nickname: '新昵称' }, { userId: 'target-user' }, { ...updateBody, nickname: '' }])(
    'requires both user ID and nickname: %j',
    async (body) => {
      const response = await updateUser(request(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid request' });
      expect(updateUserAccount).not.toHaveBeenCalled();
    }
  );

  it('passes nickname-only changes through without adding a password', async () => {
    const response = await updateUser(request({ userId: 'target-user', nickname: '新昵称' }));

    expect(response.status).toBe(200);
    expect(updateUserAccount).toHaveBeenCalledWith(
      { userId: 'target-user', nickname: '新昵称', password: undefined },
      mockPermissionClient
    );
  });
});
