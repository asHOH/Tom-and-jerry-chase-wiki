import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';

export async function GET(request: NextRequest) {
  void request;
  try {
    const guard = await requirePermission([
      'article_version.approve',
      'article_version.reject',
      'article_version.revoke',
    ]);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

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
