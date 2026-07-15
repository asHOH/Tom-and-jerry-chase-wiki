import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { canAccessAll } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActions';
import { publishNotification } from '@/lib/notificationUtils';
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
    const requiredPermission =
      action === 'mark-synced'
        ? 'game_data_action.mark_synced'
        : action === 'reject'
          ? 'game_data_action.reject'
          : 'game_data_action.approve';
    const guard = await requirePermission(requiredPermission);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { data: recordData } = await supabase
      .from('game_data_actions')
      .select('created_by, entity_type, entry, status')
      .eq('id', actionId)
      .single();

    const contexts = recordData
      ? getGameActionResourceContexts(recordData.entity_type, [recordData.entry])
      : [];
    if (contexts.length === 0 || !canAccessAll(guard.grants, requiredPermission, contexts)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

      revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'max');
      return NextResponse.json({ message: 'Action marked as synced', action, action_id: actionId });
    }

    if (action === 'approve') {
      const { error } = await supabase.rpc('approve_game_data_action', { p_action_id: actionId });
      if (error) {
        console.error('Error approving game data action:', error);
        return NextResponse.json({ error: 'Failed to approve action' }, { status: 500 });
      }

      revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'max');
      if (recordData?.created_by) {
        try {
          await publishNotification({
            recipientUserId: recordData.created_by,
            kind: 'game_data_action_approved',
            decisionOrigin: 'manual',
            title: '游戏数据改动审核通过',
            body: `您的 ${recordData.entity_type || '数据'} 修改已通过审核。`,
            sourceIds: [actionId],
            dedupeKey: `game-data-action:${actionId}:approved`,
          });
        } catch (notificationError) {
          console.error('Failed to publish game data approval notification:', notificationError);
        }
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
      try {
        const reasonSuffix = reason ? `原因：${reason}` : '';
        await publishNotification({
          recipientUserId: recordData.created_by,
          kind: 'game_data_action_rejected',
          decisionOrigin: 'manual',
          title: '游戏数据改动未通过审核',
          body: `您的 ${recordData.entity_type || '数据'} 修改未通过审核。${reasonSuffix}`,
          sourceIds: [actionId],
          dedupeKey: `game-data-action:${actionId}:rejected`,
        });
      } catch (notificationError) {
        console.error('Failed to publish game data rejection notification:', notificationError);
      }
    }

    return NextResponse.json({ message: 'Action rejected', action, action_id: actionId });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
