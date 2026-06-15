import {
  checkUsernameAvailability,
  getAuthUserEmailForUsername,
} from '@/lib/auth/usernameAvailability';

type QueryResult = {
  data: { password_hash: string | null } | null;
  error: { code?: string; message: string } | null;
};

const createAvailabilityClient = ({
  usernameResult,
  authEmailExists,
}: {
  usernameResult: QueryResult;
  authEmailExists: boolean;
}) => {
  const findUserByUsernameHash = jest
    .fn<Promise<QueryResult>, [string]>()
    .mockResolvedValue(usernameResult);
  const authEmailExistsLookup = jest
    .fn<Promise<{ data: boolean; error: null }>, [string]>()
    .mockResolvedValue({
      data: authEmailExists,
      error: null,
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
});
