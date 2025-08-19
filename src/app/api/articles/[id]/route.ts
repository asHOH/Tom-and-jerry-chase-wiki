import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

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
        categories(name),
        users_public_view!articles_author_id_fkey(nickname)
      `
      )
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Error fetching article:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get the latest approved version
    const { data: latestVersion, error: versionError } = await supabase
      .from('article_versions_public_view')
      .select('id, content, created_at, editor_id')
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (versionError) {
      console.error('Error fetching latest version:', versionError);
      return NextResponse.json({ error: 'No approved version found' }, { status: 404 });
    }

    // Get the editor's nickname separately if we have an editor_id
    let editorNickname = null;
    if (latestVersion.editor_id) {
      const { data: editorData, error: editorError } = await supabase
        .from('users_public_view')
        .select('nickname')
        .eq('id', latestVersion.editor_id)
        .single();

      if (editorError) {
        console.error('Error fetching editor info:', editorError);
        // Don't fail the request if we can't get editor info
      } else {
        editorNickname = editorData?.nickname || null;
      }
    }

    // Add editor info to the version
    const versionWithEditor = {
      ...latestVersion,
      editor_nickname: editorNickname,
    };

    // Combine the data
    const response = {
      article: {
        ...article,
        latest_version: versionWithEditor,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
