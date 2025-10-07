import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id?: string } }) {
  const id = params?.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title;
  const category = body?.category;
  const content = body?.content;

  if (!id || !title || !category || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('author_id')
      .eq('id', id)
      .single();

    if (articleError) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const { data: userRole } = await supabaseAdmin.rpc('get_user_role', { p_user_id: user.id });

    if (article.author_id !== user.id && userRole !== 'Coordinator' && userRole !== 'Reviewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.rpc('submit_article', {
      p_article_id: id,
      p_title: title,
      p_content: content,
      p_category_id: category,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Article updated successfully', data }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
