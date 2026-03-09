import { NextRequest, NextResponse } from 'next/server';

import { buildEditSourcePolicy, type EditSourceSnapshot } from '@/lib/articles/editSources';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id?: string }> }) {
  void request;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
    }

    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title, category_id, character_id, created_at, author_id')
      .eq('id', id)
      .single();

    if (articleError || !article) {
      console.error('Supabase article query error:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const { data: userRole, error: roleError } = await supabaseAdmin.rpc('get_user_role', {
      p_user_id: user.id,
    });

    if (roleError) {
      console.error('Supabase role query error:', roleError);
      return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
    }

    if (article.author_id !== user.id && userRole !== 'Coordinator' && userRole !== 'Reviewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: approvedVersion, error: approvedError } = await supabaseAdmin
      .from('article_versions')
      .select('id, content, created_at')
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedError) {
      console.error('Supabase approved version query error:', approvedError);
      return NextResponse.json({ error: 'Failed to fetch approved version' }, { status: 500 });
    }

    const { data: ownPendingVersion, error: pendingError } = await supabaseAdmin
      .from('article_versions')
      .select(
        'id, content, created_at, commit_message, proposed_title, proposed_category_id, proposed_character_id'
      )
      .eq('article_id', id)
      .eq('editor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.error('Supabase pending version query error:', pendingError);
      return NextResponse.json({ error: 'Failed to fetch pending version' }, { status: 500 });
    }

    const approvedSource: EditSourceSnapshot | null = approvedVersion
      ? {
          version_id: approvedVersion.id,
          title: article.title,
          category_id: article.category_id,
          character_id: article.character_id,
          content: approvedVersion.content,
          created_at: approvedVersion.created_at,
        }
      : null;

    const pendingSource: EditSourceSnapshot | null = ownPendingVersion
      ? {
          version_id: ownPendingVersion.id,
          title: ownPendingVersion.proposed_title ?? article.title,
          category_id: ownPendingVersion.proposed_category_id ?? article.category_id,
          character_id: ownPendingVersion.proposed_character_id ?? article.character_id,
          content: ownPendingVersion.content,
          created_at: ownPendingVersion.created_at,
          commit_message: ownPendingVersion.commit_message,
        }
      : null;

    if (!approvedSource && !pendingSource) {
      return NextResponse.json({ error: 'No editable source found' }, { status: 404 });
    }

    const policy = buildEditSourcePolicy(approvedSource, pendingSource);

    return NextResponse.json(
      {
        article: {
          id: article.id,
          title: article.title,
          category_id: article.category_id,
          character_id: article.character_id,
          created_at: article.created_at,
        },
        edit_sources: {
          approved: approvedSource,
          pending_mine: pendingSource,
        },
        policy,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
