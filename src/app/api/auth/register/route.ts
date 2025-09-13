import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import { TablesInsert } from '@/data/database.types';
import { createClient } from '@/lib/supabase/server';

const hashUsername = (username: string) => {
  return createHash('sha256').update(username).digest('hex');
};

const hashPassword = (password: string, salt: string) => {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

export async function POST(request: NextRequest) {
  try {
    const { username, nickname, password } = await request.json();

    if (!username || typeof username !== 'string' || !nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Username and nickname are required' }, { status: 400 });
    }

    // Requirement 6.6: Nickname and username must not be the same for passwordless accounts
    if (!password && username === nickname) {
      return NextResponse.json(
        { error: 'Username and nickname cannot be the same for passwordless accounts.' },
        { status: 400 }
      );
    }

    if (!password && process.env.NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const salt = randomBytes(16).toString('hex');
    const usernameHash = hashUsername(username);
    const passwordHash = password ? hashPassword(password, salt) : '';

    const authUserEmail = `${username}@${process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authUserEmail,
      password: password || username,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: 'Could not create authentication user.' }, { status: 500 });
    }
    const authUserId = authData.user.id;

    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authUserId, // Use the ID from auth.users
      username_hash: usernameHash,
      nickname,
      password_hash: passwordHash,
      salt,
      role: 'Contributor',
    } as TablesInsert<'users'>);

    if (insertError) {
      // Unique constraint violation codes for PostgreSQL
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Username or nickname is already taken.' },
          { status: 409 }
        );
      }
      console.error('Error inserting user:', insertError);
      return NextResponse.json({ error: 'Could not create user.' }, { status: 500 });
    }

    // After successful registration, sign in the user to persist the session
    const supabase = await createClient(); // Get the server-side client
    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email: authUserEmail,
      password: password || username!, // Use the provided password or the generated tempPassword
    });

    if (sessionError) {
      console.error('Error signing in new user after registration:', sessionError);
      return NextResponse.json(
        { error: 'Registration successful, but login failed.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ message: 'User created successfully' }, { status: 201 });
    // The updateSession middleware will handle setting the cookies on the response
    // We just need to ensure the session is created on the server side
    return response;
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
