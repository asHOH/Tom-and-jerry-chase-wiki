import { NextResponse, type NextRequest } from 'next/server';

// Maintainer note:
// We dynamically deep-import createServerClient from @supabase/ssr to prevent the Edge
// bundle from including browser/realtime code (which relies on Node APIs). This avoids
// Edge runtime warnings. Package version is pinned in package.json for stability.

export async function updateSession(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES) {
    return NextResponse.next({ request });
  }
  type CreateServerClient = (typeof import('@supabase/ssr'))['createServerClient'];
  const { createServerClient }: { createServerClient: CreateServerClient } = await import(
    // Deep import to avoid pulling createBrowserClient into the Edge bundle
    '@supabase/ssr/dist/module/createServerClient.js'
  );
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  await supabase.auth.getUser();

  return supabaseResponse;
}
