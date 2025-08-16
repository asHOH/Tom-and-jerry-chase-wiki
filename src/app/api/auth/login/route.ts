import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createHash, pbkdf2Sync } from 'crypto';

const hashUsername = (username: string) => {
  return createHash('sha256').update(username).digest('hex');
};

const hashPassword = (password: string, salt: string) => {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const usernameHash = hashUsername(username);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash, salt')
      .eq('username_hash', usernameHash)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Passwordless login check
    if (typeof password !== 'string' || password === '') {
      if (user.password_hash) {
        return NextResponse.json({ error: 'Password is required' }, { status: 401 });
      }
      // Passwordless user is valid
      // In a real app, you would now create a session token.
      return NextResponse.json({ message: 'Login successful' });
    }

    // Password-based login check
    if (!user.password_hash || !user.salt) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const providedPasswordHash = hashPassword(password, user.salt);
    if (providedPasswordHash !== user.password_hash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // In a real app, you would now create a session token.
    return NextResponse.json({ message: 'Login successful' });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
