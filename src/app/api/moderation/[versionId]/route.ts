import { NextRequest, NextResponse } from 'next/server';

import { invalidateArticleCache } from '@/lib/articles/invalidateArticleCache';
import {
  mapModerationActionError,
  type ModerationAction,
} from '@/lib/articles/moderationActionError';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getRequestIp } from '@/lib/blocks/server';
import { publishNotification } from '@/lib/notificationUtils';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { getPublicUserSubmissionHref } from '@/lib/users/publicProfile';

const readReviewFeedback = async (request: NextRequest): Promise<string | null> => {
  try {
    const body = (await request.json()) as { feedback?: unknown };
    if (typeof body.feedback !== 'string') return null;
    const feedback = body.feedback.trim();
    return feedback ? feedback.slice(0, 1000) : null;
  } catch {
    return null;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!versionId) {
    return NextResponse.json({ error: 'Missing version ID' }, { status: 400 });
  }

  if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be one of: approve, reject, revoke' },
      { status: 400 }
    );
  }

  try {
    const permission =
      action === 'approve'
        ? 'article_version.approve'
        : action === 'reject'
          ? 'article_version.reject'
          : 'article_version.revoke';
    const guard = await requirePermission(permission, undefined, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return guard.error;
    const { supabase } = guard;
    const reviewFeedback =
      action === 'approve' || action === 'reject' ? await readReviewFeedback(request) : null;

    // This lookup supplies an immutable cache target, not authorization; the RPC checks that.
    const { data: target, error: targetError } = await requireSupabaseAdminClient()
      .from('article_versions')
      .select('article_id')
      .eq('id', versionId)
      .maybeSingle();
    if (targetError) {
      console.error('Failed to resolve moderation target:', { versionId, error: targetError });
      return NextResponse.json({ error: 'Failed to resolve article version' }, { status: 500 });
    }
    if (!target?.article_id) {
      return NextResponse.json({ error: 'Article version not found' }, { status: 404 });
    }

    const { error: actionError } = await requireSupabaseAdminClient().rpc(
      'prepared_article_version_moderation',
      {
        p_actor_id: guard.userId,
        p_ip: getRequestIp(request),
        p_action: action,
        p_version_id: versionId,
        p_feedback: reviewFeedback,
      }
    );
    if (actionError) {
      console.error(`Error executing ${action} action:`, actionError);

      const mappedError = mapModerationActionError(action as ModerationAction, actionError.message);
      if (mappedError) {
        return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });
      }

      return NextResponse.json({ error: `Failed to ${action} article version` }, { status: 500 });
    }

    const refreshResult = invalidateArticleCache({
      articleId: target.article_id,
      versionId,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revoked',
    });

    // Notification metadata is optional and cannot prevent cache refresh after commit.
    try {
      const { data: versionRow, error: lookupError } = await supabase
        .from('article_versions')
        .select('article_id, editor_id, proposed_title')
        .eq('id', versionId)
        .single();

      if (lookupError) {
        console.error('Failed to lookup article for notification:', lookupError);
      } else if (versionRow) {
        const { article_id, editor_id, proposed_title } = versionRow;
        if (editor_id && (action === 'approve' || action === 'reject')) {
          const approved = action === 'approve';
          let submissionHref: string | undefined;
          if (!approved) {
            try {
              submissionHref =
                (await getPublicUserSubmissionHref(editor_id, versionId)) ?? undefined;
            } catch (error) {
              console.error('Failed to build contribution profile link:', error);
            }
          }
          const notificationHref =
            approved && article_id ? `/articles/${article_id}/` : submissionHref;
          await publishNotification({
            recipientUserId: editor_id,
            kind: approved ? 'article_version_approved' : 'article_version_rejected',
            decisionOrigin: 'manual',
            title: approved ? '文章已通过审核' : '文章未通过审核',
            body: approved
              ? `您的文章《${proposed_title || '文章'}》已通过审核并发布。${reviewFeedback ? `审核反馈：${reviewFeedback}` : ''}`
              : `您的文章《${proposed_title || '文章'}》未通过审核。${reviewFeedback ? `审核反馈：${reviewFeedback}` : ''}`,
            ...(notificationHref ? { href: notificationHref } : {}),
            sourceIds: [versionId],
            dedupeKey: `article-version:${versionId}:${approved ? 'approved' : 'rejected'}`,
          });
        }
      }
    } catch (e) {
      console.error('Article moderation notification failed:', e);
    }

    return NextResponse.json({
      message: `Article version successfully ${action}${action === 'approve' ? 'd' : action === 'reject' ? 'ed' : 'd'}`,
      action,
      version_id: versionId,
      ...refreshResult,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
