import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createHash, pbkdf2Sync } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { convertToPinyin } from '@/lib/pinyinUtils';

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
    const usernamePinyin = await convertToPinyin(username);

    // Query the custom users table to find a user with the matching username_hash
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash, salt')
      .eq('username_hash', usernameHash)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Fetch the corresponding user from Supabase auth.users table to get the email
    const {
      data: { user: authUser },
      error: authUserError,
    } = await supabaseAdmin.auth.admin.getUserById(user.id);

    if (authUserError || !authUser) {
      console.error('Error fetching auth user:', authUserError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (user.password_hash) {
      const providedPasswordHash = hashPassword(password, user.salt);
      if (providedPasswordHash !== user.password_hash) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }
    }
    // Password-based user is valid, create session
    const supabase = await createClient(); // Get the server-side client

    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email: `${usernamePinyin}@${process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`,
      password: password || username, // Use the provided password
    });

    if (sessionError) {
      console.error('Error signing in password-based user:', sessionError);
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }

    const response = NextResponse.json({ message: 'Login successful' });
    // The updateSession middleware will handle setting the cookies on the response
    // We just need to ensure the session is created on the server side
    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
