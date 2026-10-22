/** @jest-environment node */

import type { SupabaseClient } from '@supabase/supabase-js';

import { invalidateCache } from '@/lib/cacheTags';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Database } from '@/data/database.types';

import { changeOwnPassword, updateUserAccount } from './accountCredentials';
import { verifyPasswordCredentials } from './passwordCredentials';

jest.mock('@/lib/supabase/adminClient', () => ({ requireSupabaseAdminClient: jest.fn() }));
jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: { users: 'users' },
  invalidateCache: jest.fn(),
}));

const previousCredentials = {
  salt: '00112233445566778899aabbccddeeff',
  password_hash:
    '9896ef844dbd4aa7695588ee824e2940816c6325db9945b4a3c36b11560898bd3a183af2fd5c9f1284aaa40c0e8ee70d62c3916aba5e7a57cce135e0f997108e',
};
const mockAdminWrite = jest.fn();
const mockAdminQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnValue({ eq: mockAdminWrite }),
};
const mockAdmin = {
  from: jest.fn(() => mockAdminQuery),
  auth: { admin: { updateUserById: jest.fn(), signOut: jest.fn() } },
};
const mockSessionWrite = jest.fn();
const mockSessionQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnValue({ eq: mockSessionWrite }),
};
const mockSession = {
  from: jest.fn(() => mockSessionQuery),
  auth: { updateUser: jest.fn(), getSession: jest.fn() },
};
const sessionClient = mockSession as unknown as SupabaseClient<Database>;
const ownChange = { userId: 'user-1', oldPassword: 'LegacyPassw0rd!', newPassword: 'NewPassw0rd!' };
const adminChange = { userId: 'user-1', nickname: '新昵称', password: 'NewPassw0rd!' };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest
    .mocked(requireSupabaseAdminClient)
    .mockReturnValue(mockAdmin as unknown as SupabaseClient<Database>);
  mockAdminQuery.single.mockResolvedValue({ data: previousCredentials, error: null });
  mockSessionQuery.single.mockResolvedValue({ data: previousCredentials, error: null });
  mockAdminWrite.mockResolvedValue({ error: null });
  mockSessionWrite.mockResolvedValue({ error: null });
  mockSession.auth.updateUser.mockResolvedValue({ error: null });
  mockSession.auth.getSession.mockResolvedValue({
    data: { session: { access_token: 'current-token' } },
    error: null,
  });
  mockAdmin.auth.admin.updateUserById.mockResolvedValue({ error: null });
  mockAdmin.auth.admin.signOut.mockResolvedValue({ error: null });
});

describe('changeOwnPassword', () => {
  it('saves custom credentials, updates Auth with the session client, and signs out other sessions', async () => {
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({ ok: true });
    const saved = mockAdminQuery.update.mock.calls[0]?.[0];
    expect(saved).toEqual({ password_hash: expect.any(String), salt: expect.any(String) });
    expect(verifyPasswordCredentials(ownChange.newPassword, saved)).toBe(true);
    expect(saved.salt).not.toBe(previousCredentials.salt);
    expect(mockAdminQuery.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(mockAdminWrite).toHaveBeenCalledWith('id', 'user-1');
    expect(mockSession.from).not.toHaveBeenCalled();
    expect(mockSession.auth.updateUser).toHaveBeenCalledWith({ password: ownChange.newPassword });
    expect(mockAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(mockAdmin.auth.admin.signOut).toHaveBeenCalledWith('current-token', 'others');
    expect(invalidateCache).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, 'old_password_required'],
    [123, 'old_password_required'],
    ['', 'old_password_required'],
    ['wrong', 'incorrect_old_password'],
  ])('rejects old password %j before any write', async (oldPassword, reason) => {
    expect(await changeOwnPassword({ ...ownChange, oldPassword }, sessionClient)).toEqual({
      ok: false,
      reason,
    });
    expect(mockAdminQuery.update).not.toHaveBeenCalled();
    expect(mockSession.auth.updateUser).not.toHaveBeenCalled();
  });

  it('rejects an unchanged password after verifying the old password', async () => {
    expect(
      await changeOwnPassword({ ...ownChange, newPassword: ownChange.oldPassword }, sessionClient)
    ).toEqual({ ok: false, reason: 'unchanged_password' });
    expect(mockAdminQuery.update).not.toHaveBeenCalled();
  });

  it.each([null, ''])(
    'allows a first password when the previous hash is %j',
    async (password_hash) => {
      mockAdminQuery.single.mockResolvedValue({
        data: { ...previousCredentials, password_hash },
        error: null,
      });
      expect(
        await changeOwnPassword({ ...ownChange, oldPassword: undefined }, sessionClient)
      ).toEqual({ ok: true });
      expect(mockSession.auth.updateUser).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    { data: null, error: null },
    { data: null, error: { message: 'read failed' } },
  ])('reports credential lookup failure for %j', async (result) => {
    mockAdminQuery.single.mockResolvedValue(result);
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({
      ok: false,
      reason: 'credentials_unavailable',
    });
    expect(mockAdminQuery.update).not.toHaveBeenCalled();
  });

  it('stops before Auth when the custom write fails', async () => {
    mockAdminWrite.mockResolvedValue({ error: { message: 'write failed' } });
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({
      ok: false,
      reason: 'update_failed',
    });
    expect(mockSession.auth.updateUser).not.toHaveBeenCalled();
    expect(mockSession.auth.getSession).not.toHaveBeenCalled();
  });

  it.each([null, { message: 'rollback failed' }])(
    'restores credentials on Auth failure and reports rollback errors: %j',
    async (error) => {
      mockSession.auth.updateUser.mockResolvedValue({ error: { message: 'auth failed' } });
      mockAdminWrite.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error });
      expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({
        ok: false,
        reason: 'update_failed',
      });
      expect(mockAdminQuery.update).toHaveBeenNthCalledWith(2, previousCredentials);
      expect(mockSession.auth.getSession).not.toHaveBeenCalled();
      if (error)
        expect(console.error).toHaveBeenCalledWith(
          'Failed to revert custom user password hash:',
          error
        );
    }
  );

  it('restores an empty hash for an own-password account whose previous hash was null', async () => {
    mockAdminQuery.single.mockResolvedValue({
      data: { ...previousCredentials, password_hash: null },
      error: null,
    });
    mockSession.auth.updateUser.mockResolvedValue({ error: { message: 'auth failed' } });
    await changeOwnPassword({ ...ownChange, oldPassword: undefined }, sessionClient);
    expect(mockAdminQuery.update).toHaveBeenNthCalledWith(2, {
      password_hash: '',
      salt: previousCredentials.salt,
    });
  });

  it.each([
    { data: { session: null }, error: null },
    { data: { session: null }, error: { message: 'session failed' } },
  ])('preserves success when session lookup returns %j', async (result) => {
    mockSession.auth.getSession.mockResolvedValue(result);
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({ ok: true });
    expect(mockAdmin.auth.admin.signOut).not.toHaveBeenCalled();
    expect(mockAdminQuery.update).toHaveBeenCalledTimes(1);
  });

  it('preserves success when signing out other sessions fails', async () => {
    mockAdmin.auth.admin.signOut.mockResolvedValue({ error: { message: 'signout failed' } });
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({ ok: true });
    expect(mockAdminQuery.update).toHaveBeenCalledTimes(1);
  });

  it.each(['session', 'signout'])('preserves success when %s cleanup throws', async (step) => {
    const operation =
      step === 'session' ? mockSession.auth.getSession : mockAdmin.auth.admin.signOut;
    operation.mockRejectedValueOnce(new Error('cleanup failed'));
    expect(await changeOwnPassword(ownChange, sessionClient)).toEqual({ ok: true });
    expect(mockAdminQuery.update).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to clean up sessions after password update:',
      expect.any(Error)
    );
  });
});

describe('updateUserAccount', () => {
  it('saves nickname and credentials through the permitted client before updating Auth as admin', async () => {
    expect(await updateUserAccount(adminChange, sessionClient)).toEqual({ ok: true });
    const saved = mockSessionQuery.update.mock.calls[0]?.[0];
    expect(saved.nickname).toBe(adminChange.nickname);
    expect(verifyPasswordCredentials(adminChange.password, saved)).toBe(true);
    expect(mockAdmin.from).not.toHaveBeenCalled();
    expect(mockSessionWrite).toHaveBeenCalledWith('id', 'user-1');
    expect(mockAdmin.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      password: adminChange.password,
    });
    expect(mockSession.auth.updateUser).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalledWith('users', 'background');
    expect(mockSessionWrite.mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(invalidateCache).mock.invocationCallOrder[0]!
    );
    expect(jest.mocked(invalidateCache).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(requireSupabaseAdminClient).mock.invocationCallOrder[0]!
    );
  });

  it.each([undefined, ''])(
    'updates only the nickname without requiring admin credentials when password is %j',
    async (password) => {
      jest.mocked(requireSupabaseAdminClient).mockImplementation(() => {
        throw new Error('admin unavailable');
      });
      const input =
        password === undefined
          ? { userId: 'user-1', nickname: '新昵称' }
          : { ...adminChange, password };
      expect(await updateUserAccount(input, sessionClient)).toEqual({ ok: true });
      expect(mockSessionQuery.update).toHaveBeenCalledWith({ nickname: '新昵称' });
      expect(mockSessionQuery.single).not.toHaveBeenCalled();
      expect(requireSupabaseAdminClient).not.toHaveBeenCalled();
      expect(invalidateCache).toHaveBeenCalledWith('users', 'background');
    }
  );

  it('stops on credential lookup failure', async () => {
    mockSessionQuery.single.mockResolvedValue({ data: null, error: { message: 'read failed' } });
    expect(await updateUserAccount(adminChange, sessionClient)).toEqual({
      ok: false,
      reason: 'credentials_unavailable',
    });
    expect(mockSessionQuery.update).not.toHaveBeenCalled();
    expect(requireSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    [{ code: '23505' }, 'nickname_conflict'],
    [{ code: '42501' }, 'update_failed'],
  ])(
    'stops before Auth and cache invalidation on custom write failure %j',
    async (error, reason) => {
      mockSessionWrite.mockResolvedValue({ error });
      expect(await updateUserAccount(adminChange, sessionClient)).toEqual({ ok: false, reason });
      expect(requireSupabaseAdminClient).not.toHaveBeenCalled();
      expect(invalidateCache).not.toHaveBeenCalled();
    }
  );

  it.each([null, { message: 'rollback failed' }])(
    'restores only credentials on Auth failure while invalidating the saved nickname: %j',
    async (error) => {
      mockAdmin.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'auth failed' } });
      mockSessionWrite.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error });
      expect(await updateUserAccount(adminChange, sessionClient)).toEqual({
        ok: false,
        reason: 'update_failed',
      });
      expect(mockSessionQuery.update).toHaveBeenNthCalledWith(2, previousCredentials);
      expect(invalidateCache).toHaveBeenCalledTimes(1);
      expect(jest.mocked(invalidateCache).mock.invocationCallOrder[0]).toBeLessThan(
        mockAdmin.auth.admin.updateUserById.mock.invocationCallOrder[0]!
      );
      if (error)
        expect(console.error).toHaveBeenCalledWith(
          'Failed to revert custom user password hash:',
          error
        );
    }
  );

  it('preserves a null previous hash and omits an absent salt when reverting', async () => {
    mockSessionQuery.single.mockResolvedValue({ data: null, error: null });
    mockAdmin.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'auth failed' } });
    expect(await updateUserAccount(adminChange, sessionClient)).toEqual({
      ok: false,
      reason: 'update_failed',
    });
    expect(mockSessionQuery.update).toHaveBeenNthCalledWith(2, { password_hash: null });
  });
});
