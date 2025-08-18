import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin.rpc('get_user_role', {
      user_id: user.id,
    });

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!userRole || !['Contributor', 'Reviewer', 'Coordinator'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Contributor, Reviewer or Coordinator role required.' },
        { status: 403 }
      );
    }

    // Fetch pending submissions
    // Contributors can see all pending, Reviewers/Coordinators can see pending and rejected
    const statusFilter =
      userRole === 'Contributor' ? (['pending'] as const) : (['pending', 'rejected'] as const);

    const { data: pendingVersions, error: fetchError } = await supabaseAdmin
      .from('article_versions_public_view')
      .select(
        `
        id,
        content,
        created_at,
        status,
        article_id,
        editor_id,
        users_public_view:editor_id (
          nickname
        ),
        articles (
          id,
          title,
          author_id,
          created_at,
          categories (
            id,
            name
          ),
          users_public_view:author_id (
            nickname
          )
        )
      `
      )
      .in('status', statusFilter)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching pending versions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch pending submissions' }, { status: 500 });
    }

    return NextResponse.json({
      submissions: pendingVersions || [],
      count: pendingVersions?.length || 0,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
