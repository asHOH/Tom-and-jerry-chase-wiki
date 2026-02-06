import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { checkRateLimit } from '@/lib/rateLimit';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';
import {
  articleRecordSchema,
  articleVersionSchema,
  formatZodError,
} from '@/lib/validation/schemas';

const REVALIDATE_SECONDS = process.env.VERCEL ? 1800 : 120;
const CACHE_CONTROL_HEADER = `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimit(request, 'read', 'articles-detail');
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
    // Increment view count
    const adminClient = supabaseAdmin as unknown as typeof supabaseAdmin | undefined;
    if (adminClient) {
      const { error: incrementError } = await adminClient.rpc('increment_article_view_count', {
        p_article_id: id,
      });

      if (incrementError) {
        // Log the error but don't block the request
        console.error('Error incrementing view count:', incrementError);
      }
    }

    const response = await cached(
      ['api', 'articles', id],
      async () => {
        // Get the article basic info
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .select(
            `
              id,
              title,
              category_id,
              author_id,
              created_at,
              view_count,
              categories(name),
              users_public_view!author_id(nickname)
            `
          )
          .eq('id', id)
          .single();

        if (articleError) {
          console.error('Error fetching article:', articleError);
          return { error: 'Article not found' } as const;
        }
        const parsedArticle = articleRecordSchema.safeParse(article);
        if (!parsedArticle.success) {
          console.error('Article payload validation failed', parsedArticle.error.format());
          return {
            error: 'Article data invalid',
            details: formatZodError(parsedArticle.error),
          } as const;
        }

        // Get the latest approved version with editor info
        const { data: latestVersion, error: versionError } = await supabase
          .from('article_versions_public_view')
          .select(
            `
              id,
              content,
              created_at,
              editor_id,
              users_public_view!editor_id(nickname)
            `
          )
          .eq('article_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (versionError) {
          console.error('Error fetching latest version:', versionError);
          return { error: 'No approved version found' } as const;
        }
        const parsedVersion = articleVersionSchema.safeParse(latestVersion);
        if (!parsedVersion.success) {
          console.error('Article version payload validation failed', parsedVersion.error.format());
          return {
            error: 'Article version data invalid',
            details: formatZodError(parsedVersion.error),
          } as const;
        }

        return {
          article: {
            ...parsedArticle.data,
            latest_version: parsedVersion.data,
          },
        };
      },
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.article(id), CACHE_TAGS.articleVersions(id), CACHE_TAGS.articles],
      }
    );

    if ('error' in response) {
      const status =
        response.error === 'Article not found' || response.error === 'No approved version found'
          ? 404
          : 500;
      return NextResponse.json(response, {
        status,
        headers: { 'Cache-Control': CACHE_CONTROL_HEADER },
      });
    }

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': CACHE_CONTROL_HEADER },
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
