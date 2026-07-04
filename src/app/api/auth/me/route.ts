import { NextResponse } from 'next/server';

import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ role: null, nickname: null });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ role: null, nickname: null });
  }

  const { data, error } = await supabase
    .from('users')
    .select('role, nickname')
    .eq('id', userId)
    .single();

  if (error) {
    return NextResponse.json({ role: null, nickname: null }, { status: 200 });
  }

  return NextResponse.json({
    role: data?.role ?? null,
    nickname: data?.nickname ?? null,
  });
}
