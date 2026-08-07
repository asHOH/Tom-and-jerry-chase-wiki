import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/data/database.types';

import { getOptionalSupabasePublicConfig, SupabaseConfigurationError } from './config';
import { fetchWithRetry } from './fetch-retry';

async function _createOptionalClient() {
  const config = getOptionalSupabasePublicConfig();
  if (!config) return undefined;

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
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

export const createOptionalClient = cache(_createOptionalClient);

async function _createClient() {
  const client = await createOptionalClient();
  if (!client) throw new SupabaseConfigurationError('server');
  return client;
}

/** Create the required cookie-aware server client. */
export const createClient = cache(_createClient);
