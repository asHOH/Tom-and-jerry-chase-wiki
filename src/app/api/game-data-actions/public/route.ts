import { NextResponse } from 'next/server';

import { PublicActionQueryError } from '@/lib/gameData/publicActionQueries';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { readCachedApprovedActionRows } from '@/lib/gameData/runtimeActionSources';

export async function GET() {
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

    const response = NextResponse.json({ actions });
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
