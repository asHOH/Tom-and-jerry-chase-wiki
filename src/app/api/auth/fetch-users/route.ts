import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';

export async function GET() {
  const guard = await requireRole(['Coordinator']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username_hash, nickname, role');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json(users);
}
