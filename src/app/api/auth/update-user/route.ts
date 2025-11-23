import { pbkdf2Sync, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

  const updates: { nickname: string; password_hash?: string | null; salt?: string } = { nickname };
  let previousPasswordHash: string | null = null;
  let previousSalt: string | null = null;

  if (password) {
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('password_hash, salt')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current user credentials:', fetchError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    previousPasswordHash = currentUser?.password_hash ?? null;
    previousSalt = currentUser?.salt ?? null;

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

  if (password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (authError) {
      console.error('Failed to update auth user password after profile update:', authError);

      const revertPayload: { password_hash: string | null } & { salt?: string } = {
        password_hash: previousPasswordHash,
      };
      if (previousSalt !== null) {
        revertPayload.salt = previousSalt;
      }

      const { error: revertError } = await supabase
        .from('users')
        .update(revertPayload)
        .eq('id', userId);

      if (revertError) {
        console.error(
          'Failed to revert user password hash after auth update failure:',
          revertError
        );
      }

      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'User updated successfully' });
}
