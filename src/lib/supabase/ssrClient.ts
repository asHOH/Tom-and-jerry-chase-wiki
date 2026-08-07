import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/data/database.types';

import { requireSupabasePublicConfig } from './config';
import { fetchWithRetry } from './fetch-retry';

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  const config = requireSupabasePublicConfig('server');
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
    global: {
      fetch: fetchWithRetry,
    },
  });
}

export function createSupabaseProxyClient(request: NextRequest) {
  const config = requireSupabasePublicConfig('server');
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
    global: {
      fetch: fetchWithRetry,
    },
  });

  return {
    supabase,
    getResponse: () => response,
  } as const;
}
