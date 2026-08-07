import { cookies } from 'next/headers';

import { createClient, createOptionalClient } from './server';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({ cache: (fn: unknown) => fn }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
jest.mock('./config', () => {
  class MockSupabaseConfigurationError extends Error {
    constructor(readonly clientKind: string) {
      super(`missing ${clientKind}`);
      this.name = 'SupabaseConfigurationError';
    }
  }
  return {
    getOptionalSupabasePublicConfig: jest.fn(() => undefined),
    SupabaseConfigurationError: MockSupabaseConfigurationError,
  };
});

describe('cookie-aware Supabase client availability', () => {
  it('does not read cookies when optional configuration is unavailable', async () => {
    await expect(createOptionalClient()).resolves.toBeUndefined();
    expect(cookies).not.toHaveBeenCalled();
  });

  it('throws a dedicated error for required access', async () => {
    await expect(createClient()).rejects.toMatchObject({
      name: 'SupabaseConfigurationError',
      clientKind: 'server',
    });
  });
});
