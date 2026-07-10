import { NextRequest, NextResponse } from 'next/server';

import { Actions, Subjects } from '@/lib/auth/permissions';
import { requireAbility } from '@/lib/auth/requireAbility';

export async function GET(request: NextRequest) {
  void request;
  try {
    const guard = await requireAbility(Actions.APPROVE, Subjects.GAME_DATA_ACTION);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { data, error } = await supabase.rpc('get_pending_game_data_actions');

    if (error) {
      console.error('Error fetching pending game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch pending actions' }, { status: 500 });
    }

    return NextResponse.json({ submissions: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
