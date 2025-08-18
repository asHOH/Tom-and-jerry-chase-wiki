import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('article_versions')
    .select('id, editor_id, status, created_at')
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
