import { NextResponse } from 'next/server';

import { updateUserAccount } from '@/lib/auth/accountCredentials';
import { requirePermission } from '@/lib/auth/requirePermission';

export async function POST(request: Request) {
  const guard = await requirePermission('user.update', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { userId, nickname, password } = await request.json();

  if (!userId || !nickname) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const result = await updateUserAccount({ userId, nickname, password }, supabase);
  if (!result.ok) {
    if (result.reason === 'nickname_conflict') {
      return NextResponse.json({ error: 'Nickname already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ message: 'User updated successfully' });
}
