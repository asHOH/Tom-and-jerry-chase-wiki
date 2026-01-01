import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '../../../../../lib/auth/requireRole';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!actionId) {
    return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be one of: approve, reject' },
      { status: 400 }
    );
  }

  try {
    const guard = await requireRole(['Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    if (action === 'approve') {
      const { error } = await supabase.rpc('approve_game_data_action', { p_action_id: actionId });
      if (error) {
        console.error('Error approving game data action:', error);
        return NextResponse.json({ error: 'Failed to approve action' }, { status: 500 });
      }
      return NextResponse.json({ message: 'Action approved', action, action_id: actionId });
    }

    // reject
    let reason: string | undefined;
    try {
      const body = (await request.json()) as { reason?: unknown };
      if (typeof body?.reason === 'string' && body.reason.trim()) reason = body.reason.trim();
    } catch {
      // ignore
    }

    const { error } = await supabase.rpc(
      'reject_game_data_action',
      reason ? { p_action_id: actionId, p_reason: reason } : { p_action_id: actionId }
    );

    if (error) {
      console.error('Error rejecting game data action:', error);
      return NextResponse.json({ error: 'Failed to reject action' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Action rejected', action, action_id: actionId });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
