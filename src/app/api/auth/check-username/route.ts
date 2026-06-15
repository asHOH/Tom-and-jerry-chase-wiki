import { NextRequest, NextResponse } from 'next/server';

import {
  checkUsernameAvailability,
  createSupabaseUsernameAvailabilityDataSource,
} from '@/lib/auth/usernameAvailability';
import { generateCaptchaProof, verifyCaptchaToken } from '@/lib/captchaUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { env } from '@/env';

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'auth', 'auth-check-username');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }

    const { username, token } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!(await verifyCaptchaToken(token))) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
    }

    const captchaProof = generateCaptchaProof(username);

    if (!supabaseAdmin) {
      console.error('Supabase admin client is not configured (missing service role key).');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
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
      console.error('Supabase username availability error:', availability.error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (availability.status === 'available') {
      return NextResponse.json({ status: 'not_exists', captchaProof });
    }

    if (availability.status === 'auth_email_unavailable') {
      return NextResponse.json({ status: 'unavailable', reason: 'auth_email_already_exists' });
    }

    if (availability.passwordHash) {
      return NextResponse.json({ status: 'exists_with_password', captchaProof });
    }

    return NextResponse.json({ status: 'requires_password_reset' });
  } catch (e) {
    console.error('Check-username error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
