import { createHash, pbkdf2Sync, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { verifyCaptchaProof } from '@/lib/captchaUtils';
import { checkPasswordStrength } from '@/lib/passwordUtils';
import { convertToPinyin } from '@/lib/pinyinUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TablesInsert } from '@/data/database.types';

const hashUsername = (username: string) => {
  return createHash('sha256').update(username).digest('hex');
};

const hashPassword = (password: string, salt: string) => {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

export async function POST(request: NextRequest) {
  try {
    const { username, nickname, password, captchaToken } = await request.json();

    if (!username || typeof username !== 'string' || !nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Username and nickname are required' }, { status: 400 });
    }

    if (!verifyCaptchaProof(captchaToken, username)) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
    }

    const usernamePinyin = await convertToPinyin(username);
    const usernameHash = hashUsername(username);
    const passwordlessSecret = `pw-${usernameHash.slice(0, 32)}`;
    const authPassword = password || passwordlessSecret;

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

    if (password) {
      const strength = await checkPasswordStrength(password);
      if (strength.strength <= 1) {
        return NextResponse.json(
          { error: `Password too weak: ${strength.reason}` },
          { status: 400 }
        );
      }
    }

    const { data: existingByUsername, error: usernameLookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username_hash', usernameHash)
      .maybeSingle();

    if (usernameLookupError && usernameLookupError.code !== 'PGRST116') {
      console.error('Error checking existing username:', usernameLookupError);
      return NextResponse.json(
        { error: 'Could not verify username availability.' },
        { status: 500 }
      );
    }

    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Username or nickname is already taken.' },
        { status: 409 }
      );
    }

    const { data: existingByNickname, error: nicknameLookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle();

    if (nicknameLookupError && nicknameLookupError.code !== 'PGRST116') {
      console.error('Error checking existing nickname:', nicknameLookupError);
      return NextResponse.json(
        { error: 'Could not verify nickname availability.' },
        { status: 500 }
      );
    }

    if (existingByNickname) {
      return NextResponse.json(
        { error: 'Username or nickname is already taken.' },
        { status: 409 }
      );
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = password ? hashPassword(password, salt) : '';

    const authUserEmail = `${usernamePinyin}@${process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authUserEmail,
      password: authPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'Username or nickname is already taken.' },
          { status: 409 }
        );
      }
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
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        return NextResponse.json(
          { error: 'Username or nickname is already taken.' },
          { status: 409 }
        );
      }
      console.error('Error inserting user:', insertError);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return NextResponse.json({ error: 'Could not create user.' }, { status: 500 });
    }

    // After successful registration, sign in the user and attach cookies to response
    type CreateServerClient = (typeof import('@supabase/ssr'))['createServerClient'];
    const { createServerClient }: { createServerClient: CreateServerClient } =
      await import('@supabase/ssr/dist/module/createServerClient.js');
    const response = NextResponse.json({ message: 'User created successfully' }, { status: 201 });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email: authUserEmail,
      password: authPassword,
    });

    if (sessionError) {
      console.error('Error signing in new user after registration:', sessionError);
      return NextResponse.json(
        { error: 'Registration successful, but login failed.' },
        { status: 500 }
      );
    }

    return response;
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
