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

export type SupabaseClientKind = 'admin' | 'browser' | 'public' | 'server';

export class SupabaseConfigurationError extends Error {
  constructor(public readonly clientKind: SupabaseClientKind) {
    super(
      `Supabase ${clientKind} client is unavailable because Supabase is disabled or not configured`
    );
    this.name = 'SupabaseConfigurationError';
  }
}

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function getOptionalSupabasePublicConfig(): SupabasePublicConfig | undefined {
  if (!hasSupabasePublicConfig()) return undefined;
  return { url: supabaseUrl!, publishableKey: supabasePublishableKey! };
}

export function requireSupabasePublicConfig(
  clientKind: Exclude<SupabaseClientKind, 'admin'>
): SupabasePublicConfig {
  const config = getOptionalSupabasePublicConfig();
  if (!config) throw new SupabaseConfigurationError(clientKind);
  return config;
}

export function hasSupabasePublicConfig(): boolean {
  return env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && !!supabaseUrl && !!supabasePublishableKey;
}
