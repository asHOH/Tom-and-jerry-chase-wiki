import { NextRequest, NextResponse } from 'next/server';

import { buildEditSourcePolicy, type EditSourceSnapshot } from '@/lib/articles/editSources';
import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id?: string }> }) {
  void request;
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
    }

    const { data: article, error: articleError } = await requireSupabaseAdminClient()
      .from('articles')
      .select(
        `id, title, category_id, character_id, created_at, author_id,
        current_version:article_versions!articles_current_version_id_fkey(id, content, created_at)`
      )
      .eq('id', id)
      .single();

    if (articleError || !article) {
      console.error('Supabase article query error:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const grants = await loadPermissionGrants(supabase);
    const contexts = [
      { resourceType: 'articles', resourceId: id },
      { resourceType: 'categories', resourceId: article.category_id },
    ];
    const canUpdateAny = contexts.some((context) =>
      canAccess(grants, 'article.update_any', context)
    );
    const canUpdateOwn =
      article.author_id === userId &&
      contexts.some((context) => canAccess(grants, 'article.update_own', context));
    if (!canUpdateAny && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const approvedVersion = article.current_version;

    const { data: ownPendingVersion, error: pendingError } = await requireSupabaseAdminClient()
      .from('article_versions')
      .select(
        'id, content, created_at, commit_message, proposed_title, proposed_category_id, proposed_character_id, metadata_snapshot_complete, base_version_id, base_version_known, draft_revision'
      )
      .eq('article_id', id)
      .eq('editor_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
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
          character_id: ownPendingVersion.metadata_snapshot_complete
            ? ownPendingVersion.proposed_character_id
            : article.character_id,
          content: ownPendingVersion.content,
          created_at: ownPendingVersion.created_at,
          commit_message: ownPendingVersion.commit_message,
          base_version_id: ownPendingVersion.base_version_id,
          base_version_known: ownPendingVersion.base_version_known,
          draft_revision: ownPendingVersion.draft_revision,
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
