import { pbkdf2Sync, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import {
  checkUsernameAvailability,
  createSupabaseUsernameAvailabilityDataSource,
  hashUsername,
} from '@/lib/auth/usernameAvailability';
import { verifyCaptchaProof } from '@/lib/captchaUtils';
import { checkPasswordStrength } from '@/lib/passwordUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authRegisterSchema, formatZodError } from '@/lib/validation/schemas';
import { TablesInsert } from '@/data/database.types';
import { env } from '@/env';

import { getAuthCreateUserFailure } from './authErrorUtils';

const hashPassword = (password: string, salt: string) => {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'auth', 'auth-register');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }

    const parsed = authRegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { username, nickname, password, captchaToken } = parsed.data;

    if (!verifyCaptchaProof(captchaToken, username)) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
    }

    if (!password || password.trim() === '') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const authPassword = password;

    // Requirement 6.6: Nickname and username must not be the same for passwordless accounts
    const strength = await checkPasswordStrength(password);
    if (strength.strength <= 1) {
      return NextResponse.json({ error: `Password too weak: ${strength.reason}` }, { status: 400 });
    }

    const authEmailDomain = env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN;
    if (!authEmailDomain) {
      console.error('Supabase auth user email domain is not configured.');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const availability = await checkUsernameAvailability({
      username,
      authEmailDomain,
      dataSource: createSupabaseUsernameAvailabilityDataSource(supabaseAdmin),
    });

    if (availability.status === 'lookup_error') {
      console.error('Error checking username availability:', availability.error);
      return NextResponse.json(
        { error: 'Could not verify username availability.' },
        { status: 500 }
      );
    }

    if (
      availability.status === 'existing_user' ||
      availability.status === 'auth_email_unavailable'
    ) {
      return NextResponse.json(
        {
          error: 'Username or nickname is already taken.',
          reason:
            availability.status === 'auth_email_unavailable'
              ? 'auth_email_already_exists'
              : 'username_already_exists',
        },
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

    const authUserEmail = availability.authEmail;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authUserEmail,
      password: authPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      const failure = getAuthCreateUserFailure(authError);
      return NextResponse.json(
        { error: failure.error, reason: failure.reason },
        { status: failure.status }
      );
    }
    const authUserId = authData.user.id;

    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authUserId, // Use the ID from auth.users
      username_hash: hashUsername(username),
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
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
