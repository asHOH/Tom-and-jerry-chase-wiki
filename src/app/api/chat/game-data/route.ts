import { NextResponse } from 'next/server';

import { selectChatGameData } from '@/lib/gameData/chatGameData';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getPublishedGameDataSnapshot();

  return NextResponse.json(
    {
      revision: snapshot.revision,
      data: selectChatGameData(snapshot.data),
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}
