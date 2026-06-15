type AuthCreateUserError = {
  code?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
};

type AuthCreateUserFailure = {
  error: string;
  reason: string;
  status: number;
};

const duplicateAuthUserErrorCodes = new Set([
  'email_exists',
  'identity_already_exists',
  'user_already_exists',
]);

const getSafeStatus = (status: number | undefined) => {
  if (status && status >= 400 && status < 500) {
    return status;
  }

  return 500;
};

const isDuplicateAuthUserError = (authError: AuthCreateUserError | null | undefined) => {
  if (!authError) return false;
  if (authError.code && duplicateAuthUserErrorCodes.has(authError.code)) return true;

  return authError.message?.toLowerCase().includes('already registered') ?? false;
};

export const getAuthCreateUserFailure = (
  authError: AuthCreateUserError | null | undefined
): AuthCreateUserFailure => {
  if (isDuplicateAuthUserError(authError)) {
    return {
      error: 'Username or nickname is already taken.',
      reason: 'auth_user_already_exists',
      status: 409,
    };
  }

  switch (authError?.code) {
    case 'weak_password':
      return {
        error: 'Password does not meet authentication requirements.',
        reason: 'auth_weak_password',
        status: 400,
      };
    case 'email_address_invalid':
    case 'validation_failed':
      return {
        error: 'Could not create account because the generated login identity is invalid.',
        reason: 'auth_invalid_login_identity',
        status: 400,
      };
    case 'over_request_rate_limit':
      return {
        error: 'Too many authentication requests. Please try again later.',
        reason: 'auth_rate_limited',
        status: 429,
      };
    case 'email_provider_disabled':
    case 'signup_disabled':
      return {
        error: 'Account creation is temporarily unavailable.',
        reason: 'auth_provider_unavailable',
        status: 503,
      };
    case 'hook_timeout':
    case 'hook_timeout_after_retry':
    case 'request_timeout':
      return {
        error: 'Account creation timed out. Please try again.',
        reason: 'auth_temporarily_unavailable',
        status: 503,
      };
    default:
      return {
        error: 'Could not create authentication user.',
        reason: authError?.code ?? 'auth_create_user_failed',
        status: getSafeStatus(authError?.status),
      };
  }
};
