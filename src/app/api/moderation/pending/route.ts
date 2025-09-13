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
      p_user_id: user.id,
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

    // Use the new function to get pending versions with full details
    const { data: pendingVersions, error: fetchError } = await supabaseAdmin.rpc(
      'get_pending_versions_for_moderation',
      {
        p_requester_id: user.id,
      }
    );

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
