import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/data/database.types';

import { hasSupabasePublicConfig, supabasePublishableKey, supabaseUrl } from './config';
import { fetchWithRetry } from './fetch-retry';

async function _createClient() {
  if (!hasSupabasePublicConfig()) {
    return void 0 as never;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    global: {
      fetch: fetchWithRetry,
    },
  });
}

export const createClient = cache(_createClient);
