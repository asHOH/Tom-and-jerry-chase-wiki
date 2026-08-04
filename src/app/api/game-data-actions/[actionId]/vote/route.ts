import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import {
  loadTrustedGameDataAction,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { notifyDiscussionCommentSubscribers } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

const voteSchema = z.object({
  choice: z.enum(['approve', 'reject', 'abstain']),
  publicMessage: z.string().trim().min(1).max(1800).optional(),
});

async function loadVoteCounts(actionId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('game_data_action_votes')
    .select('choice, voter_id')
    .eq('action_id', actionId);
  const votes = data ?? [];
  return {
    votes: {
      approve: votes.filter(({ choice }) => choice === 'approve').length,
      reject: votes.filter(({ choice }) => choice === 'reject').length,
      abstain: votes.filter(({ choice }) => choice === 'abstain').length,
    },
    myVote: votes.find(({ voter_id }) => voter_id === userId)?.choice ?? null,
  };
}

export async function PUT(request: Request, { params }: { params: Promise<{ actionId: string }> }) {
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { actionId } = await params;
    const action = await loadTrustedGameDataAction(actionId);
    const contexts = getGameActionResourceContexts(action.entity_type, [action.entry]);
    const guard = await requirePermission('game_data_action.vote', contexts, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return guard.error;

    const { error } = await supabaseAdmin.rpc('prepared_set_game_data_action_vote', {
      p_actor_id: guard.userId,
      p_action_id: actionId,
      p_choice: parsed.data.choice,
      p_ip: getRequestIp(request),
    });
    if (error) {
      if (error.message.includes('voting_closed')) {
        return NextResponse.json({ error: 'Voting is closed' }, { status: 409 });
      }
      if (error.message.includes('discussion_unavailable')) {
        return NextResponse.json({ error: 'Discussion is unavailable' }, { status: 409 });
      }
      console.error('Failed to save game data vote:', error);
      return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 });
    }

    if (parsed.data.publicMessage) {
      const { data: submission } = await supabaseAdmin
        .from('game_data_action_submissions')
        .select('discussion_topic_id')
        .eq('id', action.submission_id ?? action.id)
        .maybeSingle();
      if (submission?.discussion_topic_id) {
        const { data: topic } = await supabaseAdmin
          .from('comments')
          .select('scope, target_id')
          .eq('id', submission.discussion_topic_id)
          .maybeSingle();
        if (topic) {
          const choiceLabel =
            parsed.data.choice === 'approve'
              ? '赞成'
              : parsed.data.choice === 'reject'
                ? '反对'
                : '弃权';
          const publicContent = `投票意见（${choiceLabel}）：${parsed.data.publicMessage}`;
          const { data: commentId, error: commentError } = await supabaseAdmin.rpc(
            'prepared_create_game_data_review_comment',
            {
              p_actor_id: guard.userId,
              p_ip: getRequestIp(request),
              p_scope: topic.scope,
              p_target_id: topic.target_id,
              p_parent_id: submission.discussion_topic_id,
              p_content: publicContent,
            }
          );
          if (commentError) {
            console.error('Vote saved but public explanation failed:', commentError);
          } else if (commentId) {
            try {
              await notifyDiscussionCommentSubscribers({
                actorUserId: guard.userId,
                commentId,
                scope: topic.scope,
                targetId: topic.target_id,
                body: publicContent,
              });
            } catch (notificationError) {
              console.error('Vote explanation notification failed:', notificationError);
            }
          }
        }
      }
    }

    return NextResponse.json(await loadVoteCounts(actionId, guard.userId));
  } catch (error) {
    if (error instanceof TrustedGameDataMutationError && error.code === 'not_found') {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const { actionId } = await params;
    const action = await loadTrustedGameDataAction(actionId);
    const contexts = getGameActionResourceContexts(action.entity_type, [action.entry]);
    const guard = await requirePermission('game_data_action.vote', contexts, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return guard.error;
    const { error } = await supabaseAdmin.rpc('prepared_delete_game_data_action_vote', {
      p_actor_id: guard.userId,
      p_action_id: actionId,
      p_ip: getRequestIp(request),
    });
    if (error) {
      if (error.message.includes('voting_closed')) {
        return NextResponse.json({ error: 'Voting is closed' }, { status: 409 });
      }
      if (error.message.includes('discussion_unavailable')) {
        return NextResponse.json({ error: 'Discussion is unavailable' }, { status: 409 });
      }
      console.error('Failed to withdraw game data vote:', error);
      return NextResponse.json({ error: 'Failed to withdraw vote' }, { status: 500 });
    }
    return NextResponse.json(await loadVoteCounts(actionId, guard.userId));
  } catch (error) {
    if (error instanceof TrustedGameDataMutationError && error.code === 'not_found') {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
