import { NextResponse } from 'next/server';

import { Actions, Subjects } from '@/lib/auth/permissions';
import { requireAbility } from '@/lib/auth/requireAbility';

export async function GET() {
  const guard = await requireAbility(Actions.VIEW_USERS, Subjects.USER);
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
