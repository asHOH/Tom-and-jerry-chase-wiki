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

export function createSupabaseProxyClient(request: NextRequest, signal: AbortSignal) {
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
        // A timed-out refresh must not modify a request/response already returned.
        if (signal.aborted) return;
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
      fetch: (input, init) =>
        fetchWithRetry(input, {
          ...init,
          signal: init?.signal ? AbortSignal.any([init.signal, signal]) : signal,
        }),
    },
  });

  return {
    supabase,
    getResponse: () => response,
  } as const;
}
