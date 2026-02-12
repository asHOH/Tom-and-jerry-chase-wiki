import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id?: string }> }) {
  void request;
  try {
    const guard = await requireRole(['Contributor', 'Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('articles')
      .select(
        'id, title, category_id, character_id, created_at, article_versions(content, editor_id, status, created_at)'
      )
      .eq('id', id)
      .order('created_at', { foreignTable: 'article_versions', ascending: false })
      .limit(1, { foreignTable: 'article_versions' })
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
