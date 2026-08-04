import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import { getDiscussionCommentHref } from '@/lib/comments/scopeMapping';
import {
  actionMatchesDiscussionTarget,
  getGameDataDiscussionTargets,
} from '@/lib/gameData/discussionTargets';
import { notifyGameDataReviewEvent } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/data/database.types';

const patchSchema = z.object({ topicId: z.uuid().nullable() });
const MODERATION_PERMISSIONS = [
  'game_data_action.approve',
  'game_data_action.reject',
  'game_data_action.revoke',
  'game_data_action.mark_synced',
] as const;

async function loadSubmission(submissionId: string) {
  const [{ data: submission }, { data: actions, error }] = await Promise.all([
    supabaseAdmin
      .from('game_data_action_submissions')
      .select('id, discussion_topic_id')
      .eq('id', submissionId)
      .maybeSingle(),
    supabaseAdmin
      .from('game_data_actions')
      .select('id, entity_type, entry')
      .eq('submission_id', submissionId),
  ]);
  if (error) throw error;
  return { submission, actions: actions ?? [] };
}

async function requireSubmissionModerator(
  request: Request,
  actions: Awaited<ReturnType<typeof loadSubmission>>['actions']
) {
  const contexts = actions.flatMap((action) =>
    getGameActionResourceContexts(action.entity_type, [action.entry])
  );
  return requirePermission(MODERATION_PERMISSIONS, contexts, 'all', {
    request,
    blockAction: 'edit',
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const loaded = await loadSubmission(submissionId);
    if (!loaded.submission || loaded.actions.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const guard = await requireSubmissionModerator(request, loaded.actions);
    if ('error' in guard) return guard.error;

    const targets = [
      ...new Map(
        loaded.actions
          .flatMap((action) => getGameDataDiscussionTargets(action.entity_type, action.entry))
          .map((target) => [`${target.scope}:${target.targetId}`, target])
      ).values(),
    ];
    const topicGroups = await Promise.all(
      targets.map(async (target) => {
        const { data } = await supabaseAdmin
          .from('comments')
          .select('id, title, scope, target_id, created_at')
          .eq('scope', target.scope as Database['public']['Enums']['comment_scope'])
          .eq('target_id', target.targetId)
          .is('parent_id', null)
          .not('title', 'is', null)
          .eq('status', 'visible')
          .order('created_at', { ascending: false });
        return data ?? [];
      })
    );
    return NextResponse.json({
      currentTopicId: loaded.submission.discussion_topic_id,
      topics: topicGroups.flat().map((topic) => ({
        id: topic.id,
        title: topic.title,
        scope: topic.scope,
        targetId: topic.target_id,
        href: getDiscussionCommentHref(topic.scope, topic.target_id, topic.id),
      })),
    });
  } catch (error) {
    console.error('Discussion link API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const { submissionId } = await params;
    const loaded = await loadSubmission(submissionId);
    if (!loaded.submission || loaded.actions.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const guard = await requireSubmissionModerator(request, loaded.actions);
    if ('error' in guard) return guard.error;

    if (parsed.data.topicId) {
      const { data: topic } = await supabaseAdmin
        .from('comments')
        .select('id, parent_id, scope, status, target_id, title')
        .eq('id', parsed.data.topicId)
        .maybeSingle();
      if (
        !topic ||
        topic.parent_id !== null ||
        topic.status !== 'visible' ||
        !topic.title ||
        !loaded.actions.every((action) =>
          actionMatchesDiscussionTarget(action.entity_type, action.entry, {
            scope: topic.scope,
            targetId: topic.target_id,
          })
        )
      ) {
        return NextResponse.json({ error: 'Invalid discussion topic' }, { status: 400 });
      }
    }

    const { error } = await supabaseAdmin.rpc('prepared_set_game_data_submission_topic', {
      p_actor_id: guard.userId,
      p_submission_id: submissionId,
      p_topic_id: parsed.data.topicId,
      p_operation_id: crypto.randomUUID(),
      p_ip: getRequestIp(request),
    });
    if (error) {
      console.error('Failed to update submission discussion:', error);
      return NextResponse.json({ error: 'Failed to update discussion' }, { status: 500 });
    }
    const previousTopicId = loaded.submission.discussion_topic_id;
    if (previousTopicId !== parsed.data.topicId) {
      try {
        if (previousTopicId) {
          await notifyGameDataReviewEvent({
            actorUserId: guard.userId,
            actionIds: loaded.actions.map((action) => action.id),
            topicIdOverride: previousTopicId,
            title: parsed.data.topicId ? '游戏数据改动已移出讨论' : '游戏数据改动已取消讨论关联',
            body: parsed.data.topicId ? '审核者将改动移到了另一个讨论。' : '审核者取消了讨论关联。',
          });
        }
        if (parsed.data.topicId) {
          await notifyGameDataReviewEvent({
            actorUserId: guard.userId,
            actionIds: loaded.actions.map((action) => action.id),
            title: '游戏数据改动已关联讨论',
            body: '审核者将改动关联到了此讨论。',
          });
        }
      } catch (notificationError) {
        console.error('Failed to publish discussion link notification:', notificationError);
      }
    }
    return NextResponse.json({ success: true, topicId: parsed.data.topicId });
  } catch (error) {
    console.error('Discussion link API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
