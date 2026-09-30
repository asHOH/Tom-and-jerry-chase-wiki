import { NextResponse, type NextRequest } from 'next/server';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { hasSupabasePublicConfig } from './config';
import { createSupabaseProxyClient } from './ssrClient';

const SESSION_REFRESH_TIMEOUT_MS = 5000;

export async function updateSession(request: NextRequest) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request });
  }

  const controller = new AbortController();
  const { supabase, getResponse } = createSupabaseProxyClient(request, controller.signal);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          // ponytail: the SDK retry loop may outlive this response; use SDK
          // cancellation when available. Abort blocks its network/cookie writes.
          controller.abort();
          resolve(null);
        }, SESSION_REFRESH_TIMEOUT_MS);
      }),
    ]);

    if (result === null || isAuthRetryableFetchError(result.error)) {
      const response = NextResponse.json(
        { error: '认证服务暂时不可用，请稍后重试' },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } }
      );
      // Refresh may have succeeded before the subsequent verification failed.
      getResponse()
        .cookies.getAll()
        .forEach((cookie) => response.cookies.set(cookie));
      return response;
    }

    return getResponse();
  } finally {
    clearTimeout(timeout);
  }
}
