import { NextResponse, type NextRequest } from 'next/server';

import { hasSupabasePublicConfig } from './config';
import { createSupabaseProxyClient } from './ssrClient';

export async function updateSession(request: NextRequest) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request });
  }

  const { supabase, getResponse } = createSupabaseProxyClient(request);

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  await supabase.auth.getUser();

  return getResponse();
}
