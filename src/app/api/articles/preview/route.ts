import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';

const REVALIDATE_SECONDS = process.env.VERCEL ? 1800 : 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing preview token' }, { status: 400 });
  }

  const adminClient = supabaseAdmin as unknown as typeof supabaseAdmin | undefined;
  if (!adminClient) {
    return NextResponse.json({ error: 'Articles disabled' }, { status: 404 });
  }

  try {
    const response = await cached(
      ['api', 'articles', 'preview', token],
      async () => {
        // Use the security definer function to bypass RLS for preview access
        const { data: versions, error } = await adminClient.rpc('get_article_version_by_preview', {
          p_token: token,
        });

        if (error) {
          return { error: 'Invalid preview token' } as const;
        }

        if (!versions || versions.length === 0) {
          return { error: 'Preview not found' } as const;
        }

        const version = versions[0];
        if (!version) {
          return { error: 'Preview not found' } as const;
        }

        // Get article and editor information
        const { data: article, error: articleError } = await adminClient
          .from('articles')
          .select(
            `
              id,
              title,
              category_id,
              author_id,
              created_at,
              categories(name),
              users_public_view!articles_author_id_fkey(nickname)
            `
          )
          .eq('id', version.article_id)
          .single();

        if (articleError) {
          console.error('Error fetching article for preview:', articleError);
          return { error: 'Article not found' } as const;
        }

        // Get editor information
        const { data: editor, error: editorError } = await adminClient
          .from('users_public_view')
          .select('id, nickname')
          .eq('id', version.editor_id)
          .single();

        if (editorError) {
          console.error('Error fetching editor info:', editorError);
          // Don't fail the request if editor info is missing
        }

        return {
          preview: {
            article: {
              ...article,
              version: {
                id: version.id,
                content: version.content,
                status: version.status,
                created_at: version.created_at,
                commit_message: version.commit_message,
                editor: editor || { id: version.editor_id, nickname: 'Unknown' },
              },
            },
            is_preview: true,
            preview_token: token,
          },
          _tags: {
            articleId: version.article_id,
          },
        };
      },
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.articles],
      }
    );

    if ('error' in response) {
      const status =
        response.error === 'Invalid preview token' ||
        response.error === 'Preview not found' ||
        response.error === 'Article not found'
          ? 404
          : 500;
      return NextResponse.json(response, { status });
    }

    const { _tags: _unused, ...payload } = response as unknown as { _tags?: unknown };
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
