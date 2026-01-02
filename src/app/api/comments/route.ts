import { NextResponse } from 'next/server';

import { shouldAllowComment } from '../../../lib/comments/moderation';
import { checkRateLimit } from '../../../lib/rateLimit';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { createClient } from '../../../lib/supabase/server';
import {
  commentsListQuerySchema,
  createCommentSchema,
  formatZodError,
} from '../../../lib/validation/schemas';

export const dynamic = 'force-dynamic';

type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
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

export async function GET(req: Request) {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { scope, targetId } = parsed.data;
  const limit = parsed.data.limit ?? 50;

  // Only articles are supported right now.
  if (scope !== 'articles') {
    return NextResponse.json({ error: 'Scope not supported yet' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from('comments')
    .select('id, parent_id, author_id, content, created_at')
    .eq('scope', scope)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Supabase comments select error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  const typedRows = (rows ?? []) as Array<{
    id: string;
    parent_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
  }>;

  const authorIds = Array.from(new Set(typedRows.map((r) => r.author_id)));
  const nicknameMap = await getNicknamesByUserIds(authorIds);

  const comments: ApiComment[] = typedRows.map((row) => ({
    id: row.id,
    parent_id: row.parent_id,
    content: row.content,
    created_at: row.created_at,
    author: {
      id: row.author_id,
      nickname: nicknameMap.get(row.author_id) ?? null,
    },
  }));

  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Comments are disabled' }, { status: 503 });
  }

  const rl = await checkRateLimit(req, 'write', 'comments-post');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { scope, targetId, parentId, content } = parsed.data;

  // Only articles are supported right now.
  if (scope !== 'articles') {
    return NextResponse.json({ error: 'Scope not supported yet' }, { status: 400 });
  }

  const allowed = await shouldAllowComment({
    scope,
    targetId,
    content,
    ...(parentId ? { parentId } : {}),
  });

  try {
    const { data: newId, error: rpcError } = await supabase.rpc('create_comment', {
      p_scope: scope,
      p_target_id: targetId,
      p_content: content,
      ...(parentId ? { p_parent_id: parentId } : {}),
    });

    if (rpcError || !newId) {
      console.error('Supabase RPC error:', rpcError);

      const msg = rpcError?.message ?? '';
      if (msg.includes('unauthorized')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (msg.includes('scope_not_supported')) {
        return NextResponse.json({ error: 'Scope not supported yet' }, { status: 400 });
      }
      if (msg.includes('target_not_found')) {
        return NextResponse.json({ error: 'Target not found' }, { status: 404 });
      }
      if (msg.includes('parent_not_found') || msg.includes('parent_mismatch')) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }
      if (msg.includes('content_empty') || msg.includes('content_too_long')) {
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Placeholder auto-hide: if later this returns false, we will hide it.
    // Requirement: hidden comments remain visible to the sender; UI should not label them.
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
      .select('id, parent_id, author_id, content, created_at')
      .eq('id', newId)
      .single();

    if (selectError || !row) {
      console.error('Supabase comment re-select error:', selectError);
      return NextResponse.json({ message: 'Comment created' }, { status: 200 });
    }

    const nicknameMap = await getNicknamesByUserIds([row.author_id]);

    const comment: ApiComment = {
      id: row.id,
      parent_id: row.parent_id,
      content: row.content,
      created_at: row.created_at,
      author: {
        id: row.author_id,
        nickname: nicknameMap.get(row.author_id) ?? null,
      },
    };

    return NextResponse.json({ comment }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
