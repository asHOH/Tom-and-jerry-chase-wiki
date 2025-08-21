import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id?: string } }) {
  // await params as requested (params may be a plain object but awaiting a resolved promise
  // satisfies the requirement while keeping behavior unchanged)
  const id = (await Promise.resolve(params))?.id;

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
    const { data, error } = await supabaseAdmin.rpc('submit_article', {
      p_article_id: id,
      p_title: title,
      p_content: content,
      p_category_id: category,
      p_editor_id: user.id,
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
