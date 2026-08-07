import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/data/database.types';
import { env } from '@/env';

import { resolveSupabaseSecretKey, supabaseUrl } from './config';
import { fetchWithRetry } from './fetch-retry';

const supabaseSecretKey = resolveSupabaseSecretKey(env);

export function hasSupabaseAdminConfig(): boolean {
  return env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && !!supabaseUrl && !!supabaseSecretKey;
}

// Note: this client is a singleton and can be used across the server-side of the app.
// It has elevated privileges and should be used with caution.
export const supabaseAdmin: SupabaseClient<Database> | undefined =
  env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !supabaseUrl || !supabaseSecretKey
    ? undefined
    : createClient<Database>(supabaseUrl, supabaseSecretKey, {
        global: {
          fetch: fetchWithRetry,
        },
      });
