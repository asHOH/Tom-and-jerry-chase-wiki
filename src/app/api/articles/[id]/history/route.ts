import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { checkRateLimit } from '@/lib/rateLimit';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimit(request, 'read', 'articles-history');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  const supabase =
    (supabaseAdmin as unknown as typeof supabaseAdmin | undefined) ??
    (supabaseServerPublic as unknown as typeof supabaseServerPublic | undefined);

  if (!supabase) {
    return NextResponse.json({ error: 'Articles disabled' }, { status: 404 });
  }

  try {
    const response = await cached(
      ['api', 'articles', id, 'history'],
      async () => {
        // First, verify the article exists
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .select('id, title, categories(name)')
          .eq('id', id)
          .single();

        if (articleError || !article) {
          console.error('Error fetching article:', articleError);
          return { error: 'Article not found' } as const;
        }

        // Get all approved versions using the public view
        const { data: versions, error: versionsError } = await supabase
          .from('article_versions_public_view')
          .select(
            `
              id,
              content,
              created_at,
              editor_id,
              status,
              users:users_public_view!editor_id(nickname)
            `
          )
          .eq('article_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (versionsError) {
          console.error('Error fetching versions:', versionsError);
          return { error: 'Failed to fetch article history' } as const;
        }

        return {
          article: {
            id: article.id,
            title: article.title,
            categories: (article as unknown as { categories?: { name: string } }).categories,
          },
          versions: versions || [],
          total_count: versions?.length || 0,
        };
      },
      {
        revalidate: 300,
        tags: [CACHE_TAGS.article(id), CACHE_TAGS.articleVersions(id)],
      }
    );

    if ('error' in response) {
      const status = response.error === 'Article not found' ? 404 : 500;
      return NextResponse.json(response, { status });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
