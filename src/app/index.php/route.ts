import { NextResponse, type NextRequest } from 'next/server';

import { getMediaWikiCatalog } from '@/lib/mediaWiki/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

function parseCurid(rawCurid: string | null): number | null {
  if (!rawCurid || !/^\d+$/.test(rawCurid)) return null;

  const curid = Number(rawCurid);
  return Number.isSafeInteger(curid) && curid > 0 ? curid : null;
}

export async function GET(request: NextRequest) {
  const curid = parseCurid(request.nextUrl.searchParams.get('curid'));
  if (curid === null) {
    return NextResponse.json(
      { error: 'A valid positive integer curid is required' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const catalog = await getMediaWikiCatalog();
  const page = catalog.pages.find((candidate) => candidate.pageid === curid);

  if (!page) {
    return NextResponse.json(
      { error: 'The requested page was not found' },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.redirect(page.canonicalUrl, {
    status: 307,
    headers: NO_STORE_HEADERS,
  });
}
