import { NextResponse } from 'next/server';

import { getGameDataNotificationDetails } from '@/lib/gameData/contributionDisplay';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  ContributionStatusItem,
  ContributionStatusResponse,
} from '@/lib/users/contributionStatus';

const CONTRIBUTION_LIMIT = 200;

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [articleResult, gameDataResult, thanksResult] = await Promise.all([
    supabaseAdmin
      .from('article_versions')
      .select(
        'id, article_id, commit_message, created_at, preview_token, proposed_title, review_feedback, reviewed_at, status, articles!article_versions_article_id_fkey(title)'
      )
      .eq('editor_id', userId)
      .order('created_at', { ascending: false })
      .limit(CONTRIBUTION_LIMIT + 1),
    supabaseAdmin
      .from('game_data_actions')
      .select(
        'id, created_at, entity_type, entry, is_public, message, rejection_reason, reviewed_at, status'
      )
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(CONTRIBUTION_LIMIT + 1),
    supabaseAdmin
      .from('notifications')
      .select('body, source_ids')
      .eq('user_id', userId)
      .eq('kind', 'contribution_thanked'),
  ]);

  const firstError = articleResult.error ?? gameDataResult.error ?? thanksResult.error;
  if (firstError) {
    console.error('Failed to load contribution status:', firstError);
    return NextResponse.json({ error: 'Failed to load contributions' }, { status: 500 });
  }

  const thankMessageById = new Map<string, string>();
  for (const notification of thanksResult.data ?? []) {
    for (const sourceId of notification.source_ids) {
      thankMessageById.set(sourceId, notification.body);
    }
  }
  const articleRows = (articleResult.data ?? []).slice(0, CONTRIBUTION_LIMIT);
  const gameDataRows = (gameDataResult.data ?? []).slice(0, CONTRIBUTION_LIMIT);

  const articleContributions: ContributionStatusItem[] = articleRows.map((row) => {
    const title = row.proposed_title ?? row.articles?.title ?? '未命名文章';
    const isPublic = row.status === 'approved';

    return {
      id: row.id,
      kind: 'article',
      title: `文章《${title}》`,
      description: row.commit_message,
      status: row.status,
      isPublic,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      feedback: row.review_feedback,
      href: isPublic ? `/articles/${row.article_id}/` : null,
      previewHref:
        row.status === 'pending' || row.status === 'rejected'
          ? `/articles/preview?token=${encodeURIComponent(row.preview_token)}`
          : null,
      reviseHref:
        row.status === 'pending' || row.status === 'rejected'
          ? `/articles/${row.article_id}/edit`
          : null,
      thanked: thankMessageById.has(row.id),
      thankMessage: thankMessageById.get(row.id) ?? null,
    };
  });

  const gameDataContributions: ContributionStatusItem[] = gameDataRows.map((row) => {
    const details = getGameDataNotificationDetails([row]);
    const isPublic = row.is_public || row.status === 'synced';

    return {
      id: row.id,
      kind: 'gameData',
      title: details.summary,
      description: row.message,
      status: row.status,
      isPublic,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      feedback: row.rejection_reason,
      href: details.href,
      previewHref: null,
      reviseHref:
        row.status === 'rejected' && details.href
          ? `${details.href}${details.href.includes('?') ? '&' : '?'}edit=1`
          : null,
      thanked: thankMessageById.has(row.id),
      thankMessage: thankMessageById.get(row.id) ?? null,
    };
  });

  const response: ContributionStatusResponse = {
    contributions: [...articleContributions, ...gameDataContributions].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    ),
    truncated:
      (articleResult.data?.length ?? 0) > CONTRIBUTION_LIMIT ||
      (gameDataResult.data?.length ?? 0) > CONTRIBUTION_LIMIT,
  };

  return NextResponse.json(response);
}
