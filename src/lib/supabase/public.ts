import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/data/database.types';

import { getOptionalSupabasePublicConfig } from './config';
import { fetchWithRetry } from './fetch-retry';

// Server-side public client (publishable key, no cookies/session).
// Safe for PUBLIC READS ONLY; for authenticated reads use src/lib/supabase/server.ts.
const config = getOptionalSupabasePublicConfig();
export const supabaseServerPublic: SupabaseClient<Database> | undefined = config
  ? createClient<Database>(config.url, config.publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: fetchWithRetry,
      },
    })
  : undefined;
