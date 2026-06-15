import { createHash } from 'crypto';

import { convertToPinyin } from '@/lib/pinyinUtils';
import type { supabaseAdmin } from '@/lib/supabase/admin';

type SupabaseLookupError = {
  code?: string | undefined;
  message: string;
};

type UsernameLookupResult = {
  data: { password_hash: string | null } | null;
  error: SupabaseLookupError | null;
};

type AuthEmailLookupResult = {
  data: boolean | null;
  error: SupabaseLookupError | null;
};

type UsernameAvailabilityDataSource = {
  findUserByUsernameHash: (usernameHash: string) => Promise<UsernameLookupResult>;
  authEmailExists: (authEmail: string) => Promise<AuthEmailLookupResult>;
};

export type UsernameAvailability =
  | { status: 'existing_user'; passwordHash: string | null }
  | { status: 'auth_email_unavailable'; authEmail: string }
  | { status: 'available'; authEmail: string }
  | { status: 'lookup_error'; check: 'username' | 'auth_email'; error: SupabaseLookupError };

type CheckUsernameAvailabilityOptions = {
  username: string;
  authEmailDomain: string;
  dataSource: UsernameAvailabilityDataSource;
  pinyinConverter?: (text: string) => Promise<string>;
};

export const hashUsername = (username: string) => {
  return createHash('sha256').update(username).digest('hex');
};

export const getAuthUserEmailForUsername = async (
  username: string,
  authEmailDomain: string,
  pinyinConverter: (text: string) => Promise<string> = convertToPinyin
) => {
  const usernamePinyin = await pinyinConverter(username);
  return `${usernamePinyin}@${authEmailDomain}`.toLowerCase();
};

export const checkUsernameAvailability = async ({
  username,
  authEmailDomain,
  dataSource,
  pinyinConverter,
}: CheckUsernameAvailabilityOptions): Promise<UsernameAvailability> => {
  const usernameHash = hashUsername(username);
  const { data: existingByUsername, error: usernameLookupError } =
    await dataSource.findUserByUsernameHash(usernameHash);

  if (usernameLookupError && usernameLookupError.code !== 'PGRST116') {
    return { status: 'lookup_error', check: 'username', error: usernameLookupError };
  }

  if (existingByUsername) {
    return {
      status: 'existing_user',
      passwordHash: existingByUsername.password_hash,
    };
  }

  const authEmail = await getAuthUserEmailForUsername(username, authEmailDomain, pinyinConverter);
  const { data: authEmailExists, error: authEmailLookupError } =
    await dataSource.authEmailExists(authEmail);

  if (authEmailLookupError) {
    return { status: 'lookup_error', check: 'auth_email', error: authEmailLookupError };
  }

  if (authEmailExists) {
    return { status: 'auth_email_unavailable', authEmail };
  }

  return { status: 'available', authEmail };
};

export const createSupabaseUsernameAvailabilityDataSource = (
  supabase: typeof supabaseAdmin
): UsernameAvailabilityDataSource => ({
  async findUserByUsernameHash(usernameHash) {
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('username_hash', usernameHash)
      .maybeSingle();

    return { data, error };
  },
  async authEmailExists(authEmail) {
    const { data, error } = await supabase.rpc('auth_email_exists', { p_email: authEmail });

    return { data, error };
  },
});
