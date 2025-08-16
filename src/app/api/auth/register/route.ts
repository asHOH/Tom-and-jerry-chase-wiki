import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import { TablesInsert } from '@/data/database.types';

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

    // Get the default 'Contributor' role ID
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'Contributor')
      .single();

    if (roleError || !roleData) {
      console.error('Error fetching role:', roleError);
      return NextResponse.json({ error: 'Could not set user role.' }, { status: 500 });
    }

    const salt = randomBytes(16).toString('hex');
    const usernameHash = hashUsername(username);
    const passwordHash = password ? hashPassword(password, salt) : null;

    let authUserId: string;
    if (password) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${username}@${process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`,
        password: password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: 'Could not create authentication user.' },
          { status: 500 }
        );
      }
      authUserId = authData.user.id;
    } else {
      // For passwordless accounts, create a user without password in auth.users
      const tempPassword = randomBytes(16).toString('hex'); // Generate a temporary password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${username}@${process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`, // Using username as email for auth.users
        password: tempPassword,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user (passwordless):', authError);
        return NextResponse.json(
          { error: 'Could not create authentication user for passwordless account.' },
          { status: 500 }
        );
      }
      authUserId = authData.user.id;
    }

    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authUserId, // Use the ID from auth.users
      username_hash: usernameHash,
      nickname,
      password_hash: passwordHash,
      salt,
      role_id: roleData.id,
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

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
