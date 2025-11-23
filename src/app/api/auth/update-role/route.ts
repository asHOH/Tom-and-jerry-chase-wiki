import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';

export async function POST(request: Request) {
  const guard = await requireRole(['Coordinator']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Role updated successfully' });
}
