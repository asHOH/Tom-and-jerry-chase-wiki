import {
  checkUsernameAvailability,
  getAuthUserEmailForUsername,
} from '@/lib/auth/usernameAvailability';

type QueryResult = {
  data: { password_hash: string | null } | null;
  error: { code?: string; message: string } | null;
};

type LookupError = NonNullable<QueryResult['error']>;

const createAvailabilityClient = ({
  usernameResult,
  authEmailExists,
  authEmailError = null,
}: {
  usernameResult: QueryResult;
  authEmailExists: boolean;
  authEmailError?: LookupError | null;
}) => {
  const findUserByUsernameHash = jest
    .fn<Promise<QueryResult>, [string]>()
    .mockResolvedValue(usernameResult);
  const authEmailExistsLookup = jest
    .fn<Promise<{ data: boolean; error: LookupError | null }>, [string]>()
    .mockResolvedValue({
      data: authEmailExists,
      error: authEmailError,
    });

  return {
    dataSource: {
      findUserByUsernameHash,
      authEmailExists: authEmailExistsLookup,
    },
    authEmailExistsLookup,
  };
};

describe('usernameAvailability', () => {
  it('derives the same lowercased auth email Supabase Auth stores', async () => {
    await expect(
      getAuthUserEmailForUsername('Official', 'auth.example', async (value) => value)
    ).resolves.toBe('official@auth.example');
  });

  it('returns an existing user without checking normalized auth email collisions', async () => {
    const { dataSource, authEmailExistsLookup } = createAvailabilityClient({
      usernameResult: { data: { password_hash: 'hash' }, error: null },
      authEmailExists: true,
    });

    await expect(
      checkUsernameAvailability({
        username: 'Official',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({ status: 'existing_user', passwordHash: 'hash' });

    expect(authEmailExistsLookup).not.toHaveBeenCalled();
  });

  it('marks a raw-case username unavailable when the normalized auth email already exists', async () => {
    const { dataSource, authEmailExistsLookup } = createAvailabilityClient({
      usernameResult: { data: null, error: null },
      authEmailExists: true,
    });

    await expect(
      checkUsernameAvailability({
        username: 'official',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({
      status: 'auth_email_unavailable',
      authEmail: 'official@auth.example',
    });

    expect(authEmailExistsLookup).toHaveBeenCalledWith('official@auth.example');
  });

  it('returns the normalized auth email when the username is available', async () => {
    const { dataSource } = createAvailabilityClient({
      usernameResult: { data: null, error: null },
      authEmailExists: false,
    });

    await expect(
      checkUsernameAvailability({
        username: 'NewUser',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({ status: 'available', authEmail: 'newuser@auth.example' });
  });

  it('returns a username lookup error without checking the auth email', async () => {
    const error = { code: 'PGRST500', message: 'username lookup failed' };
    const { dataSource, authEmailExistsLookup } = createAvailabilityClient({
      usernameResult: { data: null, error },
      authEmailExists: false,
    });

    await expect(
      checkUsernameAvailability({
        username: 'NewUser',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({ status: 'lookup_error', check: 'username', error });
    expect(authEmailExistsLookup).not.toHaveBeenCalled();
  });

  it('treats PGRST116 as a missing username and continues checking the auth email', async () => {
    const { dataSource, authEmailExistsLookup } = createAvailabilityClient({
      usernameResult: {
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      },
      authEmailExists: false,
    });

    await expect(
      checkUsernameAvailability({
        username: 'NewUser',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({ status: 'available', authEmail: 'newuser@auth.example' });
    expect(authEmailExistsLookup).toHaveBeenCalledWith('newuser@auth.example');
  });

  it('returns an auth email lookup error', async () => {
    const error = { message: 'auth email lookup failed' };
    const { dataSource } = createAvailabilityClient({
      usernameResult: { data: null, error: null },
      authEmailExists: false,
      authEmailError: error,
    });

    await expect(
      checkUsernameAvailability({
        username: 'NewUser',
        authEmailDomain: 'auth.example',
        dataSource,
        pinyinConverter: async (value) => value,
      })
    ).resolves.toEqual({ status: 'lookup_error', check: 'auth_email', error });
  });
});
