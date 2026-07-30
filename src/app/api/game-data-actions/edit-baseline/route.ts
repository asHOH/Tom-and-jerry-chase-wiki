import { NextResponse } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Remote mutations cannot invalidate a separate localhost cache.
  if (process.env.NODE_ENV === 'development') {
    invalidatePublicGameDataActionsCache();
  }

  const snapshot = await getPublishedGameDataSnapshot();

  return NextResponse.json(
    {
      revision: snapshot.revision,
      data: snapshot.data,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}
