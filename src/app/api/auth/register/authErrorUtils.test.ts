import { getAuthCreateUserFailure } from './authErrorUtils';

describe('getAuthCreateUserFailure', () => {
  it('maps duplicate Supabase auth identities to the existing account conflict response', () => {
    expect(
      getAuthCreateUserFailure({
        code: 'email_exists',
        message: 'User already registered',
        status: 422,
      })
    ).toEqual({
      error: 'Username or nickname is already taken.',
      reason: 'auth_user_already_exists',
      status: 409,
    });
  });

  it('maps generated login identity validation failures to a specific client error', () => {
    expect(
      getAuthCreateUserFailure({
        code: 'email_address_invalid',
        message: 'Invalid email',
        status: 400,
      })
    ).toEqual({
      error: 'Could not create account because the generated login identity is invalid.',
      reason: 'auth_invalid_login_identity',
      status: 400,
    });
  });

  it('keeps unexpected Supabase auth failures generic while exposing a sanitized reason code', () => {
    expect(
      getAuthCreateUserFailure({
        code: 'unexpected_failure',
        message: 'internal auth database detail',
        status: 500,
      })
    ).toEqual({
      error: 'Could not create authentication user.',
      reason: 'unexpected_failure',
      status: 500,
    });
  });
});
