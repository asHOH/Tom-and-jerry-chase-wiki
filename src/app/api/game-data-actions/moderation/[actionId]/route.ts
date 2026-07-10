import { NextRequest, NextResponse } from 'next/server';

import { Actions, Subjects } from '@/lib/auth/permissions';
import { requireAbility } from '@/lib/auth/requireAbility';
import { sendPushNotification } from '@/lib/push';
import type { Database } from '@/data/database.types';

type GameDataActionUpdate = Database['public']['Tables']['game_data_actions']['Update'];

const MODERATION_ACTIONS = ['approve', 'reject', 'mark-synced'] as const;

type ModerationAction = (typeof MODERATION_ACTIONS)[number];

const isModerationAction = (action: string | null): action is ModerationAction =>
  MODERATION_ACTIONS.some((allowedAction) => allowedAction === action);

const readRejectionReason = async (request: NextRequest): Promise<string | undefined> => {
  try {
    const body = (await request.json()) as { reason?: unknown };
    if (typeof body?.reason === 'string' && body.reason.trim()) return body.reason.trim();
  } catch {
    // ignore
  }

  return undefined;
};

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

  if (!isModerationAction(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${MODERATION_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const requiredAction = action === 'mark-synced' ? Actions.MARK_SYNCED : Actions.APPROVE;
    const guard = await requireAbility(requiredAction, Subjects.GAME_DATA_ACTION);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { data: recordData } = await supabase
      .from('game_data_actions')
      .select('created_by, entity_type, status')
      .eq('id', actionId)
      .single();

    if (action === 'mark-synced') {
      if (!recordData) {
        return NextResponse.json({ error: 'Action not found' }, { status: 404 });
      }

      if (recordData.status !== 'approved') {
        return NextResponse.json(
          { error: 'Action must be approved before this transition' },
          { status: 409 }
        );
      }

      const { data: claimsData } = await supabase.auth.getClaims();
      const reviewerId = claimsData?.claims.sub;
      const updatePayload: GameDataActionUpdate = {
        is_public: true,
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
        status: 'synced',
      };

      if (reviewerId) {
        updatePayload.reviewed_by = reviewerId;
      }

      const { error } = await supabase
        .from('game_data_actions')
        .update(updatePayload)
        .eq('id', actionId)
        .eq('status', 'approved')
        .select('id')
        .single();

      if (error) {
        console.error('Error updating game data action status:', error);
        return NextResponse.json({ error: 'Failed to update action status' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Action marked as synced', action, action_id: actionId });
    }

    if (action === 'approve') {
      const { error } = await supabase.rpc('approve_game_data_action', { p_action_id: actionId });
      if (error) {
        console.error('Error approving game data action:', error);
        return NextResponse.json({ error: 'Failed to approve action' }, { status: 500 });
      }

      if (recordData?.created_by) {
        await sendPushNotification(recordData.created_by, {
          title: '审核通过',
          body: `您的 ${recordData.entity_type || '数据'} 修改已通过审核。`,
          url: '/admin',
        });
      }

      return NextResponse.json({ message: 'Action approved', action, action_id: actionId });
    }

    // reject
    const reason = await readRejectionReason(request);

    const { error } = await supabase.rpc(
      'reject_game_data_action',
      reason ? { p_action_id: actionId, p_reason: reason } : { p_action_id: actionId }
    );

    if (error) {
      console.error('Error rejecting game data action:', error);
      return NextResponse.json({ error: 'Failed to reject action' }, { status: 500 });
    }

    if (recordData?.created_by) {
      await sendPushNotification(recordData.created_by, {
        title: '修改被驳回',
        body: `您的 ${recordData.entity_type || '数据'} 修改被驳回。`,
        url: '/admin',
      });
    }

    return NextResponse.json({ message: 'Action rejected', action, action_id: actionId });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
