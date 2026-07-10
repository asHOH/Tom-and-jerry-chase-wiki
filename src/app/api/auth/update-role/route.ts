import { NextResponse } from 'next/server';

import { Actions, Subjects } from '@/lib/auth/permissions';
import { requireAbility } from '@/lib/auth/requireAbility';

export async function POST(request: Request) {
  const guard = await requireAbility(Actions.UPDATE_ROLE, Subjects.USER);
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
