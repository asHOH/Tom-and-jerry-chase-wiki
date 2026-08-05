import { NextResponse } from 'next/server';

import { canAccessAll } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { commentsListQuerySchema, formatZodError } from '@/lib/validation/schemas';
import type {
  DiscussionReviewWorkspaceResponse,
  ReviewAction,
  ReviewEvent,
  ReviewSubmission,
  ReviewVoteChoice,
} from '@/features/discussion/reviewTypes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ submissionsByTopic: {}, eventsByTopic: {} });
  }

  const rateLimit = await checkRateLimit(request, 'read', 'discussion-review-get');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const url = new URL(request.url);
  const parsed = commentsListQuerySchema.safeParse({
    scope: url.searchParams.get('scope') ?? undefined,
    targetId: url.searchParams.get('targetId') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub ?? null;
  const grants = userId ? await loadPermissionGrants(supabase) : [];

  const { data: topics, error: topicsError } = await supabaseAdmin
    .from('comments')
    .select('id')
    .eq('scope', parsed.data.scope)
    .eq('target_id', parsed.data.targetId)
    .is('parent_id', null)
    .not('title', 'is', null)
    .eq('status', 'visible');
  if (topicsError) {
    console.error('Failed to load review topics:', topicsError);
    return NextResponse.json({ error: 'Failed to load review workspace' }, { status: 500 });
  }

  const topicIds = (topics ?? []).map(({ id }) => id);
  if (topicIds.length === 0) {
    return NextResponse.json({ submissionsByTopic: {}, eventsByTopic: {} });
  }

  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('game_data_action_submissions')
    .select('id, created_at, created_by, discussion_topic_id, message')
    .in('discussion_topic_id', topicIds)
    .order('created_at', { ascending: true });
  if (submissionsError) {
    console.error('Failed to load review submissions:', submissionsError);
    return NextResponse.json({ error: 'Failed to load review workspace' }, { status: 500 });
  }

  const submissionIds = (submissions ?? []).map(({ id }) => id);
  const [actionsResult, eventsResult] = await Promise.all([
    submissionIds.length
      ? supabaseAdmin
          .from('game_data_actions')
          .select(
            'id, submission_id, entity_type, entry, status, is_public, rejection_reason, reviewed_at'
          )
          .in('submission_id', submissionIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('game_data_action_discussion_events')
      .select(
        'id, operation_id, submission_id, topic_id, action_id, event_type, actor_id, note, resulting_status, approve_votes, reject_votes, abstain_votes, created_at'
      )
      .in('topic_id', topicIds)
      .order('created_at', { ascending: true }),
  ]);
  const firstError = actionsResult.error ?? eventsResult.error;
  if (firstError) {
    console.error('Failed to load review workspace details:', firstError);
    return NextResponse.json({ error: 'Failed to load review workspace' }, { status: 500 });
  }

  const actionRows = actionsResult.data ?? [];
  const actionIds = actionRows.map(({ id }) => id);
  const { data: votes, error: votesError } = actionIds.length
    ? await supabaseAdmin
        .from('game_data_action_votes')
        .select('action_id, voter_id, choice')
        .in('action_id', actionIds)
    : { data: [], error: null };
  if (votesError) {
    console.error('Failed to load review votes:', votesError);
    return NextResponse.json({ error: 'Failed to load review workspace' }, { status: 500 });
  }

  const userIds = Array.from(
    new Set(
      [
        ...(submissions ?? []).map(({ created_by }) => created_by),
        ...(eventsResult.data ?? []).map(({ actor_id }) => actor_id),
      ].filter((value): value is string => Boolean(value))
    )
  );
  const { data: users } = userIds.length
    ? await supabaseAdmin.from('users_public_view').select('id, nickname').in('id', userIds)
    : { data: [] };
  const nicknameById = new Map((users ?? []).map((user) => [user.id, user.nickname]));

  const votesByAction = new Map<
    string,
    Array<{ action_id: string; voter_id: string; choice: ReviewVoteChoice }>
  >();
  for (const vote of votes ?? []) {
    const list = votesByAction.get(vote.action_id) ?? [];
    list.push(vote);
    votesByAction.set(vote.action_id, list);
  }

  const actionDtos = new Map<string, ReviewAction>();
  for (const action of actionRows) {
    const contexts = getGameActionResourceContexts(action.entity_type, [action.entry]);
    const actionVotes = votesByAction.get(action.id) ?? [];
    const count = (choice: ReviewVoteChoice) =>
      actionVotes.filter((vote) => vote.choice === choice).length;
    actionDtos.set(action.id, {
      id: action.id,
      entityType: action.entity_type,
      entry: action.entry,
      status: action.status,
      isPublic: action.is_public,
      rejectionReason: action.rejection_reason,
      reviewedAt: action.reviewed_at,
      votes: { approve: count('approve'), reject: count('reject'), abstain: count('abstain') },
      myVote:
        (actionVotes.find((vote) => vote.voter_id === userId)?.choice as
          ReviewVoteChoice | undefined) ?? null,
      capabilities: {
        vote: Boolean(userId) && canAccessAll(grants, 'game_data_action.vote', contexts),
        viewVotes: Boolean(userId) && canAccessAll(grants, 'game_data_action.view_votes', contexts),
        approve: Boolean(userId) && canAccessAll(grants, 'game_data_action.approve', contexts),
        reject: Boolean(userId) && canAccessAll(grants, 'game_data_action.reject', contexts),
        revoke: Boolean(userId) && canAccessAll(grants, 'game_data_action.revoke', contexts),
        sync: Boolean(userId) && canAccessAll(grants, 'game_data_action.mark_synced', contexts),
      },
    });
  }

  const submissionsByTopic: Record<string, ReviewSubmission[]> = {};
  for (const submission of submissions ?? []) {
    const topicId = submission.discussion_topic_id;
    if (!topicId) continue;
    const dto: ReviewSubmission = {
      id: submission.id,
      topicId,
      createdAt: submission.created_at,
      creatorNickname: submission.created_by
        ? (nicknameById.get(submission.created_by) ?? null)
        : null,
      message: submission.message,
      actions: actionRows
        .filter((action) => action.submission_id === submission.id)
        .flatMap((action) => {
          const dto = actionDtos.get(action.id);
          return dto ? [dto] : [];
        }),
    };
    (submissionsByTopic[topicId] ??= []).push(dto);
  }

  const eventsByTopic: Record<string, ReviewEvent[]> = {};
  for (const event of eventsResult.data ?? []) {
    const dto: ReviewEvent = {
      id: event.id,
      operationId: event.operation_id,
      submissionId: event.submission_id,
      topicId: event.topic_id,
      actionId: event.action_id,
      type: event.event_type,
      actorNickname: event.actor_id ? (nicknameById.get(event.actor_id) ?? null) : null,
      note: event.note,
      resultingStatus: event.resulting_status,
      votes: {
        approve: event.approve_votes,
        reject: event.reject_votes,
        abstain: event.abstain_votes,
      },
      createdAt: event.created_at,
    };
    (eventsByTopic[event.topic_id] ??= []).push(dto);
  }

  return NextResponse.json({
    submissionsByTopic,
    eventsByTopic,
  } satisfies DiscussionReviewWorkspaceResponse);
}
