import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import { getUserProfileHref } from '@/lib/users/profileRoutes';

const IS_VERCEL = process.env.VERCEL === '1';
const IS_VERCEL_PREVIEW = IS_VERCEL && process.env.VERCEL_ENV !== 'production';

// These route trees render without server-side identity. Keep session refresh for
// other routes (including user profiles) and for non-read requests.
const PUBLIC_WIKI_ROUTE_ROOTS = new Set([
  '',
  'achievements',
  'buffs',
  'cards',
  'characters',
  'docs',
  'entities',
  'factions',
  'fixtures',
  'games',
  'itemGroups',
  'items',
  'maps',
  'mechanics',
  'modes',
  'offline',
  'ranks',
  'recommended',
  'relations',
  'special-skills',
  'tools',
  'usages',
  'win-rates',
]);

const applyNoIndex = (res: NextResponse) => {
  if (IS_VERCEL_PREVIEW) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
};

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);

  // AkariBot constructs profile links from siteinfo's /$1 article path.
  // Strip the routing slash before decoding so an encoded nickname slash survives.
  const userAlias = /^\/User(?::|%3[Aa])(.+)$/.exec(url.pathname);
  if ((request.method === 'GET' || request.method === 'HEAD') && userAlias) {
    let nickname: string;
    try {
      nickname = decodeURIComponent(userAlias[1]!.replace(/\/$/, ''));
    } catch {
      return applyNoIndex(
        NextResponse.json({ error: 'Invalid user nickname encoding' }, { status: 400 })
      );
    }
    if (nickname) {
      return applyNoIndex(
        NextResponse.redirect(new URL(getUserProfileHref(nickname), url), {
          status: 307,
          headers: { 'Cache-Control': 'no-store' },
        })
      );
    }
  }

  if (
    (request.method === 'GET' || request.method === 'HEAD') &&
    PUBLIC_WIKI_ROUTE_ROOTS.has(url.pathname.split('/')[1] ?? '')
  ) {
    return applyNoIndex(NextResponse.next({ request }));
  }

  // Refresh sessions on routes that may need server-side identity.
  const supabaseResponse = await updateSession(request);

  // Return the response from Supabase middleware, which includes updated cookies
  return applyNoIndex(supabaseResponse as NextResponse);
}

export const config = {
  matcher: [
    // User nicknames may contain slashes or resemble asset filenames.
    { source: '/:userTitle(User(?::|%3[Aa]).*)' },
    {
      source:
        '/((?!api|_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|workbox-.*|swe-worker-.*|version.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|bmp|tiff|avif|js|css|mjs|json|txt|xml|map|mp4|webm|ogg|mp3|wav)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
