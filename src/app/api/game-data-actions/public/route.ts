import { NextResponse } from 'next/server';

import {
  PublicActionQueryError,
  queryApprovedPublicActionRows,
} from '@/lib/gameData/publicActionQueries';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ actions: [] });
  }

  try {
    const supabase = await createClient();
    const rows = await queryApprovedPublicActionRows(supabase);
    const actions = rows.map(({ id, entity_type, entry, created_at }) => ({
      id,
      entity_type,
      entry,
      created_at,
    }));

    return NextResponse.json({ actions });
  } catch (err) {
    if (err instanceof PublicActionQueryError) {
      console.error('Error fetching public game data actions:', err.cause);
      return NextResponse.json({ error: 'Failed to fetch public actions' }, { status: 500 });
    }

    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
