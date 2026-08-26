import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { PublicActionQueryError } from '@/lib/gameData/publicActionQueries';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { readCachedApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

const PUBLIC_ACTIONS_HTTP_CACHE_SECONDS = 5 * 60;
const PUBLIC_ACTIONS_HTTP_CACHE_CONTROL = `public, s-maxage=${PUBLIC_ACTIONS_HTTP_CACHE_SECONDS}, stale-while-revalidate=60`;

export async function GET(request?: NextRequest) {
  const startedAt = performance.now();
  let status = 500;

  try {
    const rows = await readCachedApprovedActionRows();
    const actions = rows.map(({ id, entity_type, entry, created_at }) => ({
      id,
      entity_type,
      entry,
      created_at,
    }));

    const etag = `"${createHash('sha256').update(JSON.stringify(actions)).digest('base64url')}"`;
    const headers = {
      'Cache-Control': PUBLIC_ACTIONS_HTTP_CACHE_CONTROL,
      ETag: etag,
    };
    if (request?.headers.get('if-none-match') === etag) {
      status = 304;
      return new NextResponse(null, { status, headers });
    }

    const response = NextResponse.json({ actions }, { headers });
    status = response.status;
    return response;
  } catch (err) {
    if (err instanceof PublicActionQueryError) {
      console.error('Error fetching public game data actions:', err.cause);
      status = 500;
      return NextResponse.json({ error: 'Failed to fetch public actions' }, { status });
    }

    console.error('API error:', err);
    status = 500;
    return NextResponse.json({ error: 'Internal server error' }, { status });
  } finally {
    logPublicGameDataRouteMetric({
      route: '/api/game-data-actions/public',
      method: 'GET',
      status,
      startedAt,
      requestCategory: 'legacy-public-actions',
    });
  }
}
