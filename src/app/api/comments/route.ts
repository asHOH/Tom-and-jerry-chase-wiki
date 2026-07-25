import { NextResponse } from 'next/server';

import { requirePermission } from '../../../lib/auth/requirePermission';
import { getRequestIp } from '../../../lib/blocks/server';
import { shouldAllowComment } from '../../../lib/comments/moderation';
import { publishNotification } from '../../../lib/notificationUtils';
import { checkRateLimit } from '../../../lib/rateLimit';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { hasSupabasePublicConfig } from '../../../lib/supabase/config';
import { createClient } from '../../../lib/supabase/server';
import {
  commentsListQuerySchema,
  createCommentSchema,
  formatZodError,
  patchCommentSchema,
} from '../../../lib/validation/schemas';

export const dynamic = 'force-dynamic';

type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  title: string | null;
  status: string;
  author: {
    id: string;
    nickname: string | null;
  };
};

async function getNicknamesByUserIds(userIds: string[]): Promise<Map<string, string | null>> {
  if (!userIds.length) {
    return new Map();
  }

  const adminClient = supabaseAdmin as unknown as typeof supabaseAdmin | undefined;
  if (!adminClient) {
    return new Map();
  }

  const { data } = await adminClient
    .from('users_public_view')
    .select('id, nickname')
    .in('id', userIds);

  const map = new Map<string, string | null>();
  (data ?? []).forEach((row) => {
    if (!row.id) {
      return;
    }
    map.set(row.id, row.nickname ?? null);
  });
  return map;
}

type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  title: string | null;
  status: string;
};

function rowToComment(row: CommentRow, nicknameMap: Map<string, string | null>): ApiComment {
  return {
    id: row.id,
    parent_id: row.parent_id,
    content: row.content,
    created_at: row.created_at,
    title: row.title,
    status: row.status,
    author: {
      id: row.author_id,
      nickname: nicknameMap.get(row.author_id) ?? null,
    },
  };
}

type ArticleNotificationTarget = {
  author_id: string;
  title: string;
};

const COMMENT_NOTIFICATION_PREVIEW_LENGTH = 120;

const buildCommentPreview = (value: string): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= COMMENT_NOTIFICATION_PREVIEW_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, COMMENT_NOTIFICATION_PREVIEW_LENGTH - 1)}…`;
};

async function getArticleNotificationTarget(
  articleId: string
): Promise<ArticleNotificationTarget | null> {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('author_id, title')
    .eq('id', articleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load article comment notification target: ${error.message}`);
  }

  return data;
}

async function notifyArticleAuthorOfComment({
  articleId,
  comment,
}: {
  articleId: string;
  comment: ApiComment;
}): Promise<void> {
  const article = await getArticleNotificationTarget(articleId);
  if (!article || article.author_id === comment.author.id) {
    return;
  }

  const commenterName = comment.author.nickname?.trim() || '匿名用户';
  const actionText = comment.parent_id ? '回复了文章评论' : '发表了评论';

  await publishNotification({
    recipientUserId: article.author_id,
    kind: 'article_comment_created',
    decisionOrigin: 'automatic',
    title: `《${article.title}》收到新评论`,
    body: `${commenterName}${actionText}：\n${buildCommentPreview(comment.content)}`,
    href: `/articles/${articleId}/#comments`,
    sourceIds: [comment.id],
    dedupeKey: `article-comment:${comment.id}:author:${article.author_id}`,
  });
}

export async function GET(req: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ comments: [] as ApiComment[] });
  }

  const rl = await checkRateLimit(req, 'read', 'comments-get');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const url = new URL(req.url);
  const parsed = commentsListQuerySchema.safeParse({
    scope: url.searchParams.get('scope') ?? undefined,
    targetId: url.searchParams.get('targetId') ?? undefined,
    topicsOnly: url.searchParams.get('topicsOnly') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { scope, targetId, topicsOnly } = parsed.data;
  const limit = parsed.data.limit ?? 50;

  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select('id, parent_id, author_id, content, created_at, title, status')
    .eq('scope', scope)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (topicsOnly) {
    query = query.is('parent_id', null).not('title', 'is', null);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error('Supabase comments select error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  const typedRows = (rows ?? []) as CommentRow[];

  const authorIds = Array.from(new Set(typedRows.map((r) => r.author_id)));
  const nicknameMap = await getNicknamesByUserIds(authorIds);

  const comments: ApiComment[] = typedRows.map((row) => rowToComment(row, nicknameMap));

  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Comments are disabled' }, { status: 503 });
  }

  const rl = await checkRateLimit(req, 'write', 'comments-post');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { scope, targetId, parentId, content, title } = parsed.data;
  const guard = await requirePermission(
    'comment.create',
    {
      resourceType: `comments/${scope}`,
      resourceId: targetId,
    },
    'all',
    { request: req, blockAction: 'edit' }
  );
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const allowed = await shouldAllowComment({
    scope,
    targetId,
    content,
    ...(parentId ? { parentId } : {}),
    ...(title ? { title } : {}),
  });

  try {
    const { data: newId, error: rpcError } = await supabaseAdmin.rpc('prepared_create_comment', {
      p_actor_id: guard.userId,
      p_ip: getRequestIp(req),
      p_scope: scope,
      p_target_id: targetId,
      p_content: content,
      ...(parentId ? { p_parent_id: parentId } : {}),
      ...(title ? { p_title: title } : {}),
    });

    if (rpcError || !newId) {
      console.error('Supabase RPC error:', rpcError);

      const msg = rpcError?.message ?? '';
      if (msg.includes('unauthorized')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (msg.includes('forbidden')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (msg.includes('scope_not_supported')) {
        return NextResponse.json({ error: 'Scope not supported' }, { status: 400 });
      }
      if (msg.includes('target_not_found') || msg.includes('target_id_empty')) {
        return NextResponse.json({ error: 'Target not found' }, { status: 404 });
      }
      if (msg.includes('parent_not_found') || msg.includes('parent_mismatch')) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }
      if (msg.includes('parent_deleted')) {
        return NextResponse.json({ error: 'Parent comment has been deleted' }, { status: 400 });
      }
      if (
        msg.includes('content_empty') ||
        msg.includes('content_too_long') ||
        msg.includes('title_empty') ||
        msg.includes('title_too_long') ||
        msg.includes('reply_with_title')
      ) {
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Placeholder auto-hide: if later this returns false, we will hide it.
    if (!allowed) {
      const adminClient = supabaseAdmin as unknown as typeof supabaseAdmin | undefined;
      if (adminClient) {
        const { error: hideError } = await adminClient
          .from('comments')
          .update({ status: 'hidden' })
          .eq('id', newId);
        if (hideError) {
          console.error('Failed to auto-hide comment:', hideError);
        }
      }
    }

    const { data: row, error: selectError } = await supabase
      .from('comments')
      .select('id, parent_id, author_id, content, created_at, title, status')
      .eq('id', newId)
      .single();

    if (selectError || !row) {
      console.error('Supabase comment re-select error:', selectError);
      return NextResponse.json({ message: 'Comment created' }, { status: 200 });
    }

    const nicknameMap = await getNicknamesByUserIds([(row as CommentRow).author_id]);
    const comment = rowToComment(row as CommentRow, nicknameMap);

    if (allowed && scope === 'articles') {
      try {
        await notifyArticleAuthorOfComment({ articleId: targetId, comment });
      } catch (notificationError) {
        console.error('Failed to publish article comment notification:', notificationError);
      }
    }

    return NextResponse.json({ comment }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Comments are disabled' }, { status: 503 });
  }

  const parsed = patchCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { commentId, status } = parsed.data;
  const { data: target } = await supabaseAdmin
    .from('comments')
    .select('scope, target_id')
    .eq('id', commentId)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  const guard = await requirePermission(
    'comment.moderate',
    {
      resourceType: `comments/${target.scope}`,
      resourceId: target.target_id,
    },
    'all',
    { request: req, blockAction: 'edit' }
  );
  if ('error' in guard) return guard.error;
  try {
    const { error: rpcError } = await supabaseAdmin.rpc('prepared_set_comment_status', {
      p_actor_id: guard.userId,
      p_ip: getRequestIp(req),
      p_comment_id: commentId,
      p_status: status,
    });

    if (rpcError) {
      const msg = rpcError?.message ?? '';
      if (msg.includes('unauthorized')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (msg.includes('forbidden')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (msg.includes('comment_not_found')) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update comment status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
