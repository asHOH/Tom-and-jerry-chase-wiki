import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { CACHE_TAGS, invalidateCache } from '@/lib/cacheTags';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Database } from '@/data/database.types';

import { createPasswordCredentials, verifyPasswordCredentials } from './passwordCredentials';

type AccountClient = SupabaseClient<Database>;
type Credentials = { password_hash: string | null; salt?: string };
type WriteResult = { ok: true } | { ok: false; reason: 'nickname_conflict' | 'update_failed' };
type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'credentials_unavailable'
        | 'old_password_required'
        | 'incorrect_old_password'
        | 'unchanged_password'
        | 'update_failed';
    };
type UpdateAccountResult = WriteResult | { ok: false; reason: 'credentials_unavailable' };

async function writeAccountCredentials(
  {
    userId,
    password,
    nickname,
    previousCredentials,
    mode,
  }: {
    userId: string;
    password: string | undefined;
    nickname?: string;
    previousCredentials: Credentials;
    mode: 'own' | 'admin';
  },
  customClient: AccountClient,
  sessionClient: AccountClient
): Promise<WriteResult> {
  const updates = {
    ...(nickname === undefined ? {} : { nickname }),
    ...(password ? createPasswordCredentials(password) : {}),
  };
  const { error } = await customClient.from('users').update(updates).eq('id', userId);
  if (error) {
    if (mode === 'admin' && error.code === '23505') {
      return { ok: false, reason: 'nickname_conflict' };
    }
    console.error('Failed to update custom user account:', error);
    return { ok: false, reason: 'update_failed' };
  }

  // The nickname is already saved even if the Auth update fails below.
  if (mode === 'admin') invalidateCache(CACHE_TAGS.users, 'background');
  if (!password) return { ok: true };

  const { error: authError } =
    mode === 'own'
      ? await sessionClient.auth.updateUser({ password })
      : await requireSupabaseAdminClient().auth.admin.updateUserById(userId, { password });
  if (authError) {
    console.error('Failed to update auth user password:', authError);
    const { error: revertError } = await customClient
      .from('users')
      .update(previousCredentials)
      .eq('id', userId);
    if (revertError) console.error('Failed to revert custom user password hash:', revertError);
    return { ok: false, reason: 'update_failed' };
  }

  return { ok: true };
}

export async function changeOwnPassword(
  {
    userId,
    oldPassword,
    newPassword,
  }: { userId: string; oldPassword: unknown; newPassword: string },
  sessionClient: AccountClient
): Promise<ChangePasswordResult> {
  const adminClient = requireSupabaseAdminClient();
  const { data: current, error } = await adminClient
    .from('users')
    .select('password_hash, salt')
    .eq('id', userId)
    .single();
  if (error || !current) {
    console.error('Failed to fetch current user credentials:', error);
    return { ok: false, reason: 'credentials_unavailable' };
  }

  const previousCredentials = { password_hash: current.password_hash ?? '', salt: current.salt };
  if (previousCredentials.password_hash) {
    if (!oldPassword || typeof oldPassword !== 'string') {
      return { ok: false, reason: 'old_password_required' };
    }
    if (!verifyPasswordCredentials(oldPassword, previousCredentials)) {
      return { ok: false, reason: 'incorrect_old_password' };
    }
    if (oldPassword === newPassword) return { ok: false, reason: 'unchanged_password' };
  }

  const result = await writeAccountCredentials(
    { userId, password: newPassword, previousCredentials, mode: 'own' },
    adminClient,
    sessionClient
  );
  if (!result.ok) return { ok: false, reason: 'update_failed' };

  // Session cleanup must preserve a saved password and its refreshed response cookies.
  try {
    const {
      data: { session },
      error: sessionError,
    } = await sessionClient.auth.getSession();
    if (sessionError || !session?.access_token) {
      console.error('Failed to get current session after password update:', sessionError);
      return { ok: true };
    }
    const { error: signOutError } = await adminClient.auth.admin.signOut(
      session.access_token,
      'others'
    );
    if (signOutError) console.error('Failed to sign out other sessions:', signOutError);
  } catch (error) {
    console.error('Failed to clean up sessions after password update:', error);
  }
  return { ok: true };
}

export async function updateUserAccount(
  { userId, nickname, password }: { userId: string; nickname: string; password?: string },
  sessionClient: AccountClient
): Promise<UpdateAccountResult> {
  let previousCredentials: Credentials = { password_hash: null };
  if (password) {
    const { data: current, error } = await sessionClient
      .from('users')
      .select('password_hash, salt')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch current user credentials:', error);
      return { ok: false, reason: 'credentials_unavailable' };
    }
    previousCredentials = {
      password_hash: current?.password_hash ?? null,
      ...(current?.salt == null ? {} : { salt: current.salt }),
    };
  }

  return writeAccountCredentials(
    { userId, nickname, password, previousCredentials, mode: 'admin' },
    sessionClient,
    sessionClient
  );
}
