import { NextRequest, NextResponse } from 'next/server';

import { changeOwnPassword } from '@/lib/auth/accountCredentials';
import { checkPasswordStrength } from '@/lib/passwordUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { createSupabaseRouteClient } from '@/lib/supabase/ssrClient';

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'auth', 'auth-change-password');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }

    // Bind cookie writes to the response so password updates don't log out the current session.
    const response = NextResponse.json({ message: '密码修改成功。' });
    const supabase = createSupabaseRouteClient(request, response);

    const { data: claimsData, error: authError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (authError || !userId) {
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

    const result = await changeOwnPassword({ userId, oldPassword, newPassword }, supabase);
    if (!result.ok) {
      const failures = {
        credentials_unavailable: { error: '获取用户信息失败。', status: 500 },
        old_password_required: { error: '请输入旧密码。', status: 400 },
        incorrect_old_password: { error: '旧密码不正确。', status: 401 },
        unchanged_password: { error: '新密码不能与旧密码相同。', status: 400 },
        update_failed: { error: '修改密码失败。', status: 500 },
      };
      const failure = failures[result.reason];
      return NextResponse.json({ error: failure.error }, { status: failure.status });
    }

    return response;
  } catch (e) {
    console.error('Change-password error:', e);
    return NextResponse.json({ error: '发生未知错误。' }, { status: 500 });
  }
}
