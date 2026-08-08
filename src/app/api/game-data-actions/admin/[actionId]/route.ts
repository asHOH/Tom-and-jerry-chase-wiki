import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function logTiming(startedAt: number, rowCount: number, success: boolean): void {
  console.info(
    JSON.stringify({
      queryShape: 'admin-game-data-actions:detail',
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      rowCount,
      success,
    })
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ actionId: string }> }
) {
  const startedAt = performance.now();
  let timingLogged = false;

  try {
    const guard = await requirePermission([
      'game_data_action.approve',
      'game_data_action.reject',
      'game_data_action.mark_synced',
      'game_data_action.revoke',
    ]);
    if ('error' in guard) return guard.error;

    const { actionId } = await context.params;
    if (!UUID_PATTERN.test(actionId)) {
      return NextResponse.json({ error: 'Invalid action ID' }, { status: 400 });
    }

    const { data, error } = await guard.supabase
      .from('game_data_actions')
      .select('id, entry')
      .eq('id', actionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin game data action detail:', error);
      return NextResponse.json({ error: 'Failed to fetch action detail' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    logTiming(startedAt, 1, true);
    timingLogged = true;
    return NextResponse.json({ action_id: data.id, entry: data.entry });
  } catch (error) {
    console.error('Admin game data action detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (!timingLogged) logTiming(startedAt, 0, false);
  }
}
