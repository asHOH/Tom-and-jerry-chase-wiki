import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

type PublishBody = {
  entityType?: string;
  entries?: unknown;
};

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const entityType = typeof body.entityType === 'string' ? body.entityType.trim() : '';
  const entries = body.entries;

  if (!entityType) {
    return NextResponse.json({ error: 'Missing entityType' }, { status: 400 });
  }

  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('publish_game_data_actions', {
      p_entity_type: entityType,
      p_entries: entries,
    });

    if (error) {
      console.error('Error publishing game data actions:', error);
      return NextResponse.json({ error: 'Failed to publish actions' }, { status: 500 });
    }

    return NextResponse.json({ result: data ?? [] });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
