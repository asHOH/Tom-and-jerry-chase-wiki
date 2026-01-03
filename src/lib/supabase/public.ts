import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { Database } from '@/data/database.types';
import { env } from '@/env';

import { fetchWithRetry } from './fetch-retry';

// Server-side public client (anon key, no cookies/session).
// Safe for PUBLIC READS ONLY; for authenticated reads use src/lib/supabase/server.ts.
export const supabaseServerPublic =
  env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? (void 0 as never)
    : createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: fetchWithRetry,
        },
      });
