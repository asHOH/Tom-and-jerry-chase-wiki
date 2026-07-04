import { env } from '@/env';

type SupabasePublicKeyEnv = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string | undefined;
};

type SupabaseSecretKeyEnv = {
  SUPABASE_SECRET_KEY?: string | undefined;
  SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
};

export function resolveSupabasePublishableKey(values: SupabasePublicKeyEnv): string | undefined {
  return values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? values.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function resolveSupabaseSecretKey(values: SupabaseSecretKeyEnv): string | undefined {
  return values.SUPABASE_SECRET_KEY ?? values.SUPABASE_SERVICE_ROLE_KEY;
}

export const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = resolveSupabasePublishableKey(env);

export function hasSupabasePublicConfig(): boolean {
  return env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && !!supabaseUrl && !!supabasePublishableKey;
}
