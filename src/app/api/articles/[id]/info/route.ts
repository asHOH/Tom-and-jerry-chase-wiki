import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id?: string }> }) {
  void request;
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(
        'id, title, category_id, character_id, created_at, article_versions(content, editor_id, status, created_at)'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch article information' }, { status: 500 });
    }

    return NextResponse.json({ article: data }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
