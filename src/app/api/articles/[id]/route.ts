import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    // Get the article basic info
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
        users_public_view!author_id(nickname)
      `
      )
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Error fetching article:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get the latest approved version with editor info
    const { data: latestVersion, error: versionError } = await supabaseAdmin
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
