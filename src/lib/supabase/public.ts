import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { Database } from '@/data/database.types';

import { hasSupabasePublicConfig, supabasePublishableKey, supabaseUrl } from './config';
import { fetchWithRetry } from './fetch-retry';

// Server-side public client (publishable key, no cookies/session).
// Safe for PUBLIC READS ONLY; for authenticated reads use src/lib/supabase/server.ts.
export const supabaseServerPublic = !hasSupabasePublicConfig()
  ? (void 0 as never)
  : createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: fetchWithRetry,
      },
    });
