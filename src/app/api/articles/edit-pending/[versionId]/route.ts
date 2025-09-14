import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { versionId?: string } }) {
  const versionId = params?.versionId;

  if (!versionId) {
    return NextResponse.json({ error: 'Missing version ID' }, { status: 400 });
  }

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

  if (!title || !category || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get the article_id from the version.
    const { data: version, error: versionError } = await supabaseAdmin
      .from('article_versions')
      .select('article_id')
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Article version not found' }, { status: 404 });
    }

    // Call RPC to update pending article in a transaction
    const { error: rpcError } = await supabaseAdmin.rpc('update_pending_article', {
      p_version_id: versionId,
      p_article_id: version.article_id,
      p_title: title,
      p_content: content,
      p_category_id: category,
      p_editor_id: user.id,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      if (rpcError.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (rpcError.message.includes('Only pending articles can be modified')) {
        return NextResponse.json(
          { error: 'Only pending articles can be modified' },
          { status: 403 }
        );
      }
      if (rpcError.message.includes('Can only modify new article submissions')) {
        return NextResponse.json(
          {
            error:
              'Can only modify new article submissions, not modification requests for existing articles.',
          },
          { status: 403 }
        );
      }
      if (rpcError.message.includes('Article version not found')) {
        return NextResponse.json({ error: 'Article version not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update pending article' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Pending article updated successfully' }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
