import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getDiscussionCommentHref } from '@/lib/comments/scopeMapping';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'synced', 'revoked', 'all'] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET(request: NextRequest) {
  try {
    const guard = await requirePermission([
      'game_data_action.approve',
      'game_data_action.reject',
      'game_data_action.mark_synced',
      'game_data_action.revoke',
    ]);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') ?? 'all').trim() as AllowedStatus;

    const status: AllowedStatus = ALLOWED_STATUSES.includes(statusParam) ? statusParam : 'all';

    let query = supabase
      .from('game_data_actions')
      .select(
        'id, created_at, created_by, entity_type, entry, is_public, message, rejection_reason, reviewed_at, reviewed_by, status, submission_id'
      )
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    const rows = data ?? [];
    const submissionIds = Array.from(
      new Set(
        rows.map((row) => row.submission_id).filter((value): value is string => Boolean(value))
      )
    );
    const { data: submissionRows } = submissionIds.length
      ? await supabaseAdmin
          .from('game_data_action_submissions')
          .select('id, discussion_topic_id')
          .in('id', submissionIds)
      : { data: [] };
    const topicIds = (submissionRows ?? []).flatMap((row) =>
      row.discussion_topic_id ? [row.discussion_topic_id] : []
    );
    const { data: topicRows } = topicIds.length
      ? await supabaseAdmin
          .from('comments')
          .select('id, scope, target_id, title')
          .in('id', topicIds)
      : { data: [] };
    const reviewActionIds = rows.filter((row) => Boolean(row.submission_id)).map((row) => row.id);
    const { data: voteRows } = reviewActionIds.length
      ? await supabaseAdmin
          .from('game_data_action_votes')
          .select('action_id, choice')
          .in('action_id', reviewActionIds)
      : { data: [] };
    const submissionById = new Map((submissionRows ?? []).map((row) => [row.id, row]));
    const topicById = new Map((topicRows ?? []).map((row) => [row.id, row]));

    const userIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.created_by, row.reviewed_by])
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    );

    const nicknameByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users_public_view')
        .select('id, nickname')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users_public_view for nicknames:', usersError);
        return NextResponse.json({ error: 'Failed to fetch user nicknames' }, { status: 500 });
      }

      for (const u of users ?? []) {
        if (u.id && u.nickname) nicknameByUserId.set(u.id, u.nickname);
      }
    }

    const submissions = rows.map((row) => {
      const createdByNickname = row.created_by ? (nicknameByUserId.get(row.created_by) ?? '') : '';
      const reviewedByNickname = row.reviewed_by
        ? (nicknameByUserId.get(row.reviewed_by) ?? '')
        : '';

      return {
        action_id: row.id,
        created_at: row.created_at,
        created_by: row.created_by ?? '',
        created_by_nickname: createdByNickname,
        entity_type: row.entity_type,
        entry: row.entry,
        is_public: row.is_public,
        message: row.message,
        rejection_reason: row.rejection_reason ?? '',
        reviewed_at: row.reviewed_at ?? '',
        reviewed_by: row.reviewed_by ?? '',
        reviewed_by_nickname: reviewedByNickname,
        status: row.status,
        submission_id: row.submission_id,
        vote_totals: {
          approve: (voteRows ?? []).filter(
            (vote) => vote.action_id === row.id && vote.choice === 'approve'
          ).length,
          reject: (voteRows ?? []).filter(
            (vote) => vote.action_id === row.id && vote.choice === 'reject'
          ).length,
          abstain: (voteRows ?? []).filter(
            (vote) => vote.action_id === row.id && vote.choice === 'abstain'
          ).length,
        },
        discussion_topic: (() => {
          const topicId = submissionById.get(row.submission_id)?.discussion_topic_id;
          const topic = topicId ? topicById.get(topicId) : undefined;
          return topic
            ? {
                id: topic.id,
                title: topic.title,
                href: getDiscussionCommentHref(topic.scope, topic.target_id, topic.id),
              }
            : null;
        })(),
      };
    });

    return NextResponse.json({ submissions, count: submissions.length, status });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
