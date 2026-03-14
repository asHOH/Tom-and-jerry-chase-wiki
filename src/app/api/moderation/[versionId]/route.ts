import { NextRequest, NextResponse } from 'next/server';

import {
  mapModerationActionError,
  type ModerationAction,
} from '@/lib/articles/moderationActionError';
import { requireRole } from '@/lib/auth/requireRole';
import { CACHE_TAGS, invalidateCache } from '@/lib/cacheTags';
import { sendPushNotification } from '@/lib/push';

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
    const guard = await requireRole(['Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let functionName: `${'approve' | 'reject' | 'revoke'}_article_version`;
    switch (action) {
      case 'approve':
        functionName = 'approve_article_version';
        break;
      case 'reject':
        functionName = 'reject_article_version';
        break;
      case 'revoke':
        functionName = 'revoke_article_version';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error: actionError } = await supabase.rpc(functionName, {
      p_version_id: versionId,
    });
    if (actionError) {
      console.error(`Error executing ${action} action:`, actionError);

      const mappedError = mapModerationActionError(action as ModerationAction, actionError.message);
      if (mappedError) {
        return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });
      }

      return NextResponse.json({ error: `Failed to ${action} article version` }, { status: 500 });
    }

    // Best-effort: lookup article_id and author for targeted revalidation and push notification.
    try {
      const { data: versionRow, error: lookupError } = await supabase
        .from('article_versions')
        .select('article_id, editor_id, proposed_title')
        .eq('id', versionId)
        .single();

      if (lookupError) {
        console.error('Failed to lookup article for revalidation/push:', lookupError);
      } else if (versionRow) {
        const { article_id, editor_id, proposed_title } = versionRow;
        if (article_id) {
          // Nuke specific article versions to ensure fresh content
          await invalidateCache(CACHE_TAGS.article(article_id), 'nuke');
          await invalidateCache(CACHE_TAGS.articleVersions(article_id), 'nuke');
        }

        if (editor_id) {
          let pushTitle = '审核结果';
          let pushBody = `关于《${proposed_title || '文章'}》的审核已完成。`;

          if (action === 'approve') {
            pushTitle = '文章已发布';
            pushBody = `您的文章《${proposed_title || '文章'}》已通过审核并发布！`;
          } else if (action === 'reject') {
            pushTitle = '文章已被驳回';
            pushBody = `您的文章《${proposed_title || '文章'}》未通过审核，已被驳回。`;
          } else if (action === 'revoke') {
            pushTitle = '文章已被撤下';
            pushBody = `您的文章《${proposed_title || '文章'}》已被撤下。`;
          }

          await sendPushNotification(editor_id, {
            title: pushTitle,
            body: pushBody,
            url: article_id ? `/articles/${article_id}` : '/articles',
          });
        }
      }
    } catch (e) {
      console.error('Revalidation lookup error:', e);
    }

    // Expire public lists (SWR strategy)
    await invalidateCache(CACHE_TAGS.articles, 'expire');
    await invalidateCache(CACHE_TAGS.sitemapArticles, 'expire');

    return NextResponse.json({
      message: `Article version successfully ${action}${action === 'approve' ? 'd' : action === 'reject' ? 'ed' : 'd'}`,
      action,
      version_id: versionId,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
