import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';

export async function GET(request: NextRequest) {
  void request;
  try {
    const guard = await requireRole(['Contributor', 'Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Use the new function to get pending versions with full details
    const { data: pendingVersions, error: fetchError } = await supabase.rpc(
      'get_pending_versions_for_moderation'
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
