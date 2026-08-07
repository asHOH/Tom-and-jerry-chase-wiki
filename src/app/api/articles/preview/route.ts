import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

        // Get article and editor information in parallel
        const articleRequest = adminClient
          .from('articles')
          .select(
            `
              id,
              title,
              category_id,
              character_id,
              author_id,
              created_at,
              categories(name),
              users_public_view!articles_author_id_fkey(nickname)
            `
          )
          .eq('id', version.article_id)
          .single();
        const editorRequest = adminClient
          .from('users_public_view')
          .select('id, nickname')
          .eq('id', version.editor_id)
          .single();

        const [{ data: article, error: articleError }, { data: editor, error: editorError }] =
          await Promise.all([articleRequest, editorRequest]);

        if (articleError) {
          console.error('Error fetching article for preview:', articleError);
          return { error: 'Article not found' } as const;
        }

        if (editorError) {
          console.error('Error fetching editor info:', editorError);
          // Don't fail the request if editor info is missing
        }

        // A complete snapshot may intentionally use a null character ID to remove a binding.
        // Only legacy versions without the required title/category snapshot fall back wholesale.
        const previewMetadata =
          version.proposed_title !== null && version.proposed_category_id !== null
            ? {
                title: version.proposed_title,
                categoryId: version.proposed_category_id,
                characterId: version.proposed_character_id,
              }
            : {
                title: article.title,
                categoryId: article.category_id,
                characterId: article.character_id,
              };

        let previewCategory = article.categories;
        if (previewMetadata.categoryId !== article.category_id) {
          const { data: proposedCategory, error: categoryError } = await adminClient
            .from('categories')
            .select('name')
            .eq('id', previewMetadata.categoryId)
            .single();

          if (categoryError) {
            console.error('Error fetching proposed category for preview:', categoryError);
            return { error: 'Article category not found' } as const;
          }

          previewCategory = proposedCategory;
        }

        return {
          preview: {
            article: {
              ...article,
              title: previewMetadata.title,
              category_id: previewMetadata.categoryId,
              character_id: previewMetadata.characterId,
              categories: previewCategory,
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
        revalidate: 30,
        tags: [CACHE_TAGS.articles],
      }
    );

    if ('error' in response) {
      const status =
        response.error === 'Invalid preview token' ||
        response.error === 'Preview not found' ||
        response.error === 'Article not found' ||
        response.error === 'Article category not found'
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
