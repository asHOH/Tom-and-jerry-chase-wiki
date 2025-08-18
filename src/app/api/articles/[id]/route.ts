import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  void request;
  const { id } = params;

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

    // Get the latest approved version using the public view (RLS will filter)
    const { data: latestVersion, error: versionError } = await supabase
      .from('article_versions_public_view')
      .select(
        `
        id,
        content,
        created_at,
        editor_id,
        users_public_view!article_versions_public_view_editor_id_fkey(nickname)
      `
      )
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (versionError) {
      console.error('Error fetching latest version:', versionError);
      return NextResponse.json({ error: 'No approved version found' }, { status: 404 });
    }

    // Combine the data
    const response = {
      article: {
        ...article,
        latest_version: latestVersion,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
