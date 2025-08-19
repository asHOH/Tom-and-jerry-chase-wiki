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

    // Use the new function to get pending versions with full details
    const { data, error } = await supabaseAdmin.rpc('get_pending_versions_for_moderation', {
      p_requester_id: user.id,
    });
    console.log({ data });

    if (error) {
      console.error('Error fetching pending versions:', error);
      return NextResponse.json({ error: 'Failed to fetch pending versions' }, { status: 500 });
    }

    return NextResponse.json({
      pending_versions: data || [],
      total_count: data?.length || 0,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
