import { NextRequest, NextResponse } from 'next/server';

import { getPendingActionTargets } from '@/lib/gameData/pendingActionAwarenessServer';
import { isPublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
};
const MAX_ENTITY_KEY_LENGTH = 256;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: NextRequest) {
  const entityType = request.nextUrl.searchParams.get('entityType')?.trim() ?? '';
  if (!isPublishableEntityType(entityType)) {
    return json({ error: 'Invalid entity type' }, 400);
  }

  const rawEntityKey = request.nextUrl.searchParams.get('entityKey');
  const entityKey = rawEntityKey?.trim() || undefined;
  if (entityKey && entityKey.length > MAX_ENTITY_KEY_LENGTH) {
    return json({ error: 'Invalid entity key' }, 400);
  }

  if (!hasSupabasePublicConfig()) {
    return json({ targets: [], truncated: false });
  }
  if (!hasSupabaseAdminConfig()) {
    return json({ error: 'Pending action awareness is unavailable' }, 503);
  }

  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub ?? null;
    const result = await getPendingActionTargets({
      entityType,
      ...(entityKey === undefined ? {} : { entityKey }),
      userId,
    });
    return json(result);
  } catch (error) {
    console.error('Failed to load pending game data action targets:', error);
    return json({ error: 'Failed to load pending action targets' }, 500);
  }
}
