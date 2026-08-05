import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import { getGameDataNotificationDetails } from '@/lib/gameData/contributionDisplay';
import {
  approvePreparedGameDataAction,
  loadTrustedGameDataAction,
  markPreparedGameDataActionSynced,
  recordGameDataDiscussionEvent,
  revokePreparedGameDataAction,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { notifyGameDataReviewEvent, publishNotification } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MODERATION_ACTIONS = ['approve', 'reject', 'mark-synced', 'revoke'] as const;

type ModerationAction = (typeof MODERATION_ACTIONS)[number];

const isModerationAction = (action: string | null): action is ModerationAction =>
  MODERATION_ACTIONS.some((allowedAction) => allowedAction === action);

const readRejectionReason = async (request: NextRequest): Promise<string | undefined> => {
  try {
    const body = (await request.json()) as { note?: unknown; reason?: unknown };
    const value = typeof body?.reason === 'string' ? body.reason : body?.note;
    if (typeof value === 'string' && value.trim()) return value.trim();
  } catch {
    // ignore
  }

  return undefined;
};

const rejectConflictResponse = () =>
  NextResponse.json({ error: 'Action is already public; use revoke instead' }, { status: 409 });

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
  const moderationNote = await readRejectionReason(request);

  try {
    const requiredPermission =
      action === 'mark-synced'
        ? 'game_data_action.mark_synced'
        : action === 'revoke'
          ? 'game_data_action.revoke'
          : action === 'reject'
            ? 'game_data_action.reject'
            : 'game_data_action.approve';
    const guard = await requirePermission(requiredPermission, undefined, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return guard.error;
    const recordData = await loadTrustedGameDataAction(actionId);
    const { data: linkedSubmission } = recordData.submission_id
      ? await supabaseAdmin
          .from('game_data_action_submissions')
          .select('discussion_topic_id')
          .eq('id', recordData.submission_id)
          .maybeSingle()
      : { data: null };
    const hasLinkedDiscussion = Boolean(linkedSubmission?.discussion_topic_id);

    const contexts = getGameActionResourceContexts(recordData.entity_type, [recordData.entry]);
    if (contexts.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const resourceGuard = await requirePermission(requiredPermission, contexts, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in resourceGuard) return resourceGuard.error;

    if (action === 'mark-synced') {
      if (recordData.status !== 'approved') {
        return NextResponse.json(
          { error: 'Action must be approved before this transition' },
          { status: 409 }
        );
      }

      await markPreparedGameDataActionSynced(guard.userId, recordData, getRequestIp(request));
      if (typeof recordGameDataDiscussionEvent === 'function') {
        try {
          await recordGameDataDiscussionEvent({
            actorId: guard.userId,
            actionIds: [actionId],
            eventType: 'synced',
            ...(moderationNote ? { note: moderationNote } : {}),
          });
        } catch (eventError) {
          console.error('Failed to record sync discussion event:', eventError);
        }
      }
      if (typeof notifyGameDataReviewEvent === 'function') {
        await notifyGameDataReviewEvent({
          actorUserId: guard.userId,
          actionIds: [actionId],
          title: '游戏数据改动已标记为同步',
          body: moderationNote || '审核状态已更新。',
        }).catch((notificationError) =>
          console.error('Failed to publish sync review notification:', notificationError)
        );
      }
      return NextResponse.json({ message: 'Action marked as synced', action, action_id: actionId });
    }

    if (action === 'approve') {
      await approvePreparedGameDataAction(guard.userId, recordData, getRequestIp(request));
      if (typeof recordGameDataDiscussionEvent === 'function') {
        try {
          await recordGameDataDiscussionEvent({
            actorId: guard.userId,
            actionIds: [actionId],
            eventType: 'approved',
            ...(moderationNote ? { note: moderationNote } : {}),
          });
        } catch (eventError) {
          console.error('Failed to record approval discussion event:', eventError);
        }
      }
      if (typeof notifyGameDataReviewEvent === 'function') {
        await notifyGameDataReviewEvent({
          actorUserId: guard.userId,
          actionIds: [actionId],
          title: '讨论中的游戏数据改动已批准',
          body: moderationNote || '审核者已批准该改动。',
        }).catch((notificationError) =>
          console.error('Failed to publish approval review notification:', notificationError)
        );
      }
      if (recordData?.created_by && !hasLinkedDiscussion) {
        try {
          const details = getGameDataNotificationDetails([recordData]);
          await publishNotification({
            recipientUserId: recordData.created_by,
            kind: 'game_data_action_approved',
            decisionOrigin: 'manual',
            title: '游戏数据改动审核通过',
            body: `您的${details.summary}修改已通过审核。`,
            href: details.href ?? '/admin/?tab=actions',
            sourceIds: [actionId],
            dedupeKey: `game-data-action:${actionId}:approved`,
          });
        } catch (notificationError) {
          console.error('Failed to publish game data approval notification:', notificationError);
        }
      }

      return NextResponse.json({ message: 'Action approved', action, action_id: actionId });
    }

    if (action === 'revoke') {
      await revokePreparedGameDataAction(guard.userId, recordData, getRequestIp(request));
      if (typeof recordGameDataDiscussionEvent === 'function') {
        try {
          await recordGameDataDiscussionEvent({
            actorId: guard.userId,
            actionIds: [actionId],
            eventType: 'revoked',
            ...(moderationNote ? { note: moderationNote } : {}),
          });
        } catch (eventError) {
          console.error('Failed to record revoke discussion event:', eventError);
        }
      }
      if (typeof notifyGameDataReviewEvent === 'function') {
        await notifyGameDataReviewEvent({
          actorUserId: guard.userId,
          actionIds: [actionId],
          title: '讨论中的游戏数据改动已撤销',
          body: moderationNote || '审核者已撤销该改动。',
        }).catch((notificationError) =>
          console.error('Failed to publish revoke review notification:', notificationError)
        );
      }
      return NextResponse.json({ message: 'Action revoked', action, action_id: actionId });
    }

    // reject
    if (recordData.is_public) {
      return rejectConflictResponse();
    }
    const reason = moderationNote;

    const { error } = await supabaseAdmin.rpc('prepared_reject_game_data_action', {
      p_actor_id: guard.userId,
      p_action_id: actionId,
      p_reason: reason ?? '',
      p_ip: getRequestIp(request),
    });

    if (error) {
      console.error('Error rejecting game data action:', error);
      return NextResponse.json({ error: 'Failed to reject action' }, { status: 500 });
    }

    if (typeof recordGameDataDiscussionEvent === 'function') {
      try {
        await recordGameDataDiscussionEvent({
          actorId: guard.userId,
          actionIds: [actionId],
          eventType: 'rejected',
          ...(reason ? { note: reason } : {}),
        });
      } catch (eventError) {
        console.error('Failed to record rejection discussion event:', eventError);
      }
    }

    if (typeof notifyGameDataReviewEvent === 'function') {
      await notifyGameDataReviewEvent({
        actorUserId: guard.userId,
        actionIds: [actionId],
        title: '讨论中的游戏数据改动已拒绝',
        body: reason || '审核者已拒绝该改动。',
      }).catch((notificationError) =>
        console.error('Failed to publish rejection review notification:', notificationError)
      );
    }
    if (recordData?.created_by && !hasLinkedDiscussion) {
      try {
        const reasonSuffix = reason ? `原因：${reason}` : '';
        const details = getGameDataNotificationDetails([recordData]);
        await publishNotification({
          recipientUserId: recordData.created_by,
          kind: 'game_data_action_rejected',
          decisionOrigin: 'manual',
          title: '游戏数据改动未通过审核',
          body: `您的${details.summary}修改未通过审核。${reasonSuffix}`,
          href: `/contributions/?highlight=${encodeURIComponent(actionId)}`,
          sourceIds: [actionId],
          dedupeKey: `game-data-action:${actionId}:rejected`,
        });
      } catch (notificationError) {
        console.error('Failed to publish game data rejection notification:', notificationError);
      }
    }

    return NextResponse.json({ message: 'Action rejected', action, action_id: actionId });
  } catch (err) {
    if (err instanceof TrustedGameDataMutationError) {
      if (err.code === 'not_found') {
        return NextResponse.json({ error: 'Action not found' }, { status: 404 });
      }
      if (
        err.code === 'invalid_row' ||
        err.code === 'candidate_conflict' ||
        err.code === 'replay_epoch_conflict'
      ) {
        return NextResponse.json({ error: err.code }, { status: 409 });
      }
    }
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
