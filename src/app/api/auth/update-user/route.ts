import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (roleData?.role !== 'Coordinator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

    const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
      password,
      salt: saltData,
    });
    if (hashError || !hashData) {
      return NextResponse.json({ error: 'Failed to hash password' }, { status: 500 });
    }

    updates.password_hash = hashData;
  }

  const { error } = await supabase.from('users').update(updates).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ message: 'User updated successfully' });
}
