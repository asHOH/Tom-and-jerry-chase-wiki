import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { pbkdf2Sync, randomBytes } from 'crypto';

const hashPassword = (password: string, salt: string) =>
  pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

const generateSalt = () => randomBytes(16).toString('hex');

export async function POST(request: Request) {
  const guard = await requireRole(['Coordinator']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { userId, nickname, password } = await request.json();

  if (!userId || !nickname) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const updates: { nickname: string; password_hash?: string; salt?: string } = { nickname };

  if (password) {
    const salt = generateSalt();
    updates.password_hash = hashPassword(password, salt);
    updates.salt = salt;
  }

  const { error } = await supabase.from('users').update(updates).eq('id', userId);

  if (error) {
    if ('code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Nickname already in use' }, { status: 409 });
    }
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ message: 'User updated successfully' });
}
