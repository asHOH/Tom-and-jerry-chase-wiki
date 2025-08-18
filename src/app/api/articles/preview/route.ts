import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing preview token' }, { status: 400 });
  }

  try {
    // Use the security definer function to bypass RLS for preview access
    const { data: versions, error } = await supabaseAdmin.rpc('get_article_version_by_preview', {
      p_token: token,
    });

    if (error) {
      console.error('Error fetching preview version:', error);
      return NextResponse.json({ error: 'Invalid preview token' }, { status: 404 });
    }

    if (!versions || versions.length === 0) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    const version = versions[0];
    if (!version) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    // Get article and editor information
    const { data: article, error: articleError } = await supabaseAdmin
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
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get editor information
    const { data: editor, error: editorError } = await supabaseAdmin
      .from('users_public_view')
      .select('id, nickname')
      .eq('id', version.editor_id)
      .single();

    if (editorError) {
      console.error('Error fetching editor info:', editorError);
      // Don't fail the request if editor info is missing
    }

    const response = {
      preview: {
        article: {
          ...article,
          version: {
            id: version.id,
            content: version.content,
            status: version.status,
            created_at: version.created_at,
            editor: editor || { id: version.editor_id, nickname: 'Unknown' },
          },
        },
        is_preview: true,
        preview_token: token,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
