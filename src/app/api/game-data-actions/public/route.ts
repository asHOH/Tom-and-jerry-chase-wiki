import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ actions: [] });
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('game_data_actions')
      .select('id, entity_type, entry, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching public game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch public actions' }, { status: 500 });
    }

    return NextResponse.json({ actions: data ?? [] });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
