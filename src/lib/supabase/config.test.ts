import { resolveSupabasePublishableKey, resolveSupabaseSecretKey } from './config';

describe('supabase config', () => {
  it('prefers the new publishable key over the legacy anon key', () => {
    expect(
      resolveSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_new',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon',
      })
    ).toBe('sb_publishable_new');
  });

  it('falls back to the legacy anon key during migration', () => {
    expect(
      resolveSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon',
      })
    ).toBe('legacy-anon');
  });

  it('prefers the new secret key over the legacy service-role key', () => {
    expect(
      resolveSupabaseSecretKey({
        SUPABASE_SECRET_KEY: 'sb_secret_new',
        SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
      })
    ).toBe('sb_secret_new');
  });

  it('falls back to the legacy service-role key during migration', () => {
    expect(
      resolveSupabaseSecretKey({
        SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
      })
    ).toBe('legacy-service-role');
  });
});
