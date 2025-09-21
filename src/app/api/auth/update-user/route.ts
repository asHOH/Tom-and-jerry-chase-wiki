import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { pbkdf2Sync } from 'crypto';

const hashPassword = (password: string, salt: string) => {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

export async function POST(request: Request) {
  const guard = await requireRole(['Coordinator']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { userId, nickname, password } = await request.json();

  if (!userId || !nickname) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const updates: { nickname: string; password_hash?: string } = { nickname };

  if (password) {
    const { data: saltData, error: saltError } = await supabase.rpc('generate_salt');
    if (saltError || !saltData) {
      return NextResponse.json({ error: 'Failed to generate salt' }, { status: 500 });
    }

    updates.password_hash = hashPassword(password, saltData);
  }

  const { error } = await supabase.from('users').update(updates).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ message: 'User updated successfully' });
}
