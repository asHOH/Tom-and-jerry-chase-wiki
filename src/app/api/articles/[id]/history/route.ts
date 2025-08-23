import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    // First, verify the article exists
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Error fetching article:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get all approved versions using the public view (RLS will filter)
    const { data: versions, error: versionsError } = await supabaseAdmin
      .from('article_versions_public_view')
      .select(
        `
        id,
        content,
        created_at,
        editor_id,
        users(nickname)
      `
      )
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return NextResponse.json({ error: 'Failed to fetch article history' }, { status: 500 });
    }

    const response = {
      article: {
        id: article.id,
        title: article.title,
      },
      versions: versions || [],
      total_count: versions?.length || 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
