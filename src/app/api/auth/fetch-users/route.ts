import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';

export async function GET() {
  const guard = await requirePermission(['user.read', 'user.update', 'group.assign']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const [{ data: users, error }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('id, nickname'),
    supabase.from('user_group_memberships').select('user_id, group_id'),
  ]);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json(
    (users ?? []).map((user) => ({
      ...user,
      groupIds: (memberships ?? [])
        .filter((membership) => membership.user_id === user.id)
        .map((membership) => membership.group_id),
    }))
  );
}
