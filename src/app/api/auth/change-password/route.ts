import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { checkPasswordStrength } from '@/lib/passwordUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { env } from '@/env';

const hashPassword = (password: string, salt: string) =>
  pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

function stringTimingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf16le');
  const bufB = Buffer.from(b, 'utf16le');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'auth', 'auth-change-password');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }

    type CreateServerClient = (typeof import('@supabase/ssr'))['createServerClient'];
    const { createServerClient }: { createServerClient: CreateServerClient } =
      await import('@supabase/ssr/dist/module/createServerClient.js');

    // Bind cookie writes to the response so password updates don't log out the current session.
    const response = NextResponse.json({ message: '密码修改成功。' });
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '需要先登录。' }, { status: 401 });
    }

    const body = (await request.json()) as unknown;
    const { oldPassword, newPassword } = (body ?? {}) as {
      oldPassword?: unknown;
      newPassword?: unknown;
    };

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: '新密码不能为空。' }, { status: 400 });
    }

    const strength = await checkPasswordStrength(newPassword);
    if (strength.strength <= 1) {
      return NextResponse.json({ error: `密码强度不足：${strength.reason}` }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash, salt')
      .eq('id', user.id)
      .single();

    if (fetchError || !current) {
      console.error('Failed to fetch current user credentials:', fetchError);
      return NextResponse.json({ error: '获取用户信息失败。' }, { status: 500 });
    }

    const previousPasswordHash = current.password_hash ?? '';
    const previousSalt = current.salt;
    const hasExistingPassword = !!previousPasswordHash;

    if (hasExistingPassword) {
      if (!oldPassword || typeof oldPassword !== 'string') {
        return NextResponse.json({ error: '请输入旧密码。' }, { status: 400 });
      }
      const providedHash = hashPassword(oldPassword, previousSalt);
      if (!stringTimingSafeEqual(providedHash, previousPasswordHash)) {
        return NextResponse.json({ error: '旧密码不正确。' }, { status: 401 });
      }
    }

    if (hasExistingPassword && typeof oldPassword === 'string' && oldPassword === newPassword) {
      return NextResponse.json({ error: '新密码不能与旧密码相同。' }, { status: 400 });
    }

    const nextSalt = randomBytes(16).toString('hex');
    const nextPasswordHash = hashPassword(newPassword, nextSalt);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: nextPasswordHash, salt: nextSalt })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update custom user password hash:', updateError);
      return NextResponse.json({ error: '修改密码失败。' }, { status: 500 });
    }

    // Update Supabase Auth password for the current user.
    // Using the session-bound client ensures the current session stays alive via refreshed cookies.
    const { error: supabaseAuthUpdateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (supabaseAuthUpdateError) {
      console.error('Failed to update supabase auth password:', supabaseAuthUpdateError);

      const { error: revertError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: previousPasswordHash, salt: previousSalt })
        .eq('id', user.id);

      if (revertError) {
        console.error('Failed to revert custom user password hash:', revertError);
      }

      return NextResponse.json({ error: '修改密码失败。' }, { status: 500 });
    }

    // Invalidate other sessions while keeping the current one.
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.error('Failed to get current session after password update:', sessionError);
      // Return the response anyway so any cookie updates are applied.
      return response;
    }

    const { error: signOutOthersError } = await supabaseAdmin.auth.admin.signOut(
      session.access_token,
      'others'
    );

    if (signOutOthersError) {
      console.error('Failed to sign out other sessions:', signOutOthersError);
      // Keep current session even if the "logout other sessions" step fails.
      return response;
    }

    return response;
  } catch (e) {
    console.error('Change-password error:', e);
    return NextResponse.json({ error: '发生未知错误。' }, { status: 500 });
  }
}
