import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, category, content } = await req.json();

  if (!title || !category || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // First, create the article and get its ID
    const { data: newArticle, error: articleError } = await supabaseAdmin
      .from('articles')
      .insert({
        title,
        category_id: category,
        author_id: user.id,
      })
      .select('id')
      .single();

    if (articleError) {
      console.error('Supabase article insert error:', articleError);
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }

    const newArticleId = newArticle.id;

    // Then, submit the first version using the RPC
    const { error: rpcError } = await supabase.rpc('submit_article', {
      p_article_id: newArticleId,
      p_title: title,
      p_content: content,
      p_category_id: category,
    });

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      // If submitting the version fails, delete the article to avoid orphans.
      await supabaseAdmin.from('articles').delete().eq('id', newArticleId);
      return NextResponse.json({ error: 'Failed to submit article version' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Article submitted successfully',
      article_id: newArticleId,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
