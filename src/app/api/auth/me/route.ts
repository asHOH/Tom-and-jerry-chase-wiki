import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ role: null, nickname: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null, nickname: null });
  }

  const { data, error } = await supabase
    .from('users')
    .select('role, nickname')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ role: null, nickname: null }, { status: 200 });
  }

  return NextResponse.json({
    role: data?.role ?? null,
    nickname: data?.nickname ?? null,
  });
}
