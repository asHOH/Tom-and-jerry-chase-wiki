import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { abilityFor, type Role } from '@/lib/auth/permissions';
import { CACHE_TAGS } from '@/lib/cacheTags';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const id = (await params)?.id;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    // Authorize before parsing body — fail fast on missing article or insufficient permissions
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('author_id')
      .eq('id', id)
      .single();

    if (articleError) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const { data: userRole } = await supabaseAdmin.rpc('get_user_role', { p_user_id: userId });

    const role = (userRole as Role | undefined) ?? null;
    const ability = abilityFor(role);

    if (article.author_id !== userId && !ability.can('edit_any', 'Article')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Authorization passed — now parse and validate the body
    const body = await request.json().catch(() => null);
    const title = body?.title;
    const category = body?.category;
    const content = body?.content;
    const character_id = body?.character_id ?? null;
    const commit_message = body?.commit_message;

    if (!title || !category || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('submit_article', {
      p_article_id: id,
      p_title: title,
      p_content: content,
      p_category_id: category,
      p_character_id: character_id,
      p_commit_message: commit_message?.trim() || null,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }

    revalidateTag(CACHE_TAGS.article(id), 'max');
    revalidateTag(CACHE_TAGS.articleVersions(id), 'max');
    revalidateTag(CACHE_TAGS.articles, 'max');
    revalidateTag(CACHE_TAGS.sitemapArticles, 'max');

    return NextResponse.json({ message: 'Article updated successfully', data }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
