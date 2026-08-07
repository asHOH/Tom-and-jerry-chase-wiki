import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireNotBlocked } from '@/lib/blocks/server';
import {
  hashNotificationVerificationToken,
  sendNotificationEmailVerification,
} from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { createClient } from '@/lib/supabase/server';

const emailSchema = z.object({ email: z.email() });

const getUserId = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub;
};

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await requireSupabaseAdminClient()
    .from('notification_email_settings')
    .select('email, email_enabled, email_verified_at, pending_email, verification_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Failed to load email settings' }, { status: 500 });

  return NextResponse.json({
    email: data?.email ?? null,
    enabled: data?.email_enabled ?? false,
    verifiedAt: data?.email_verified_at ?? null,
    pendingEmail: data?.pending_email ?? null,
    verificationExpiresAt: data?.verification_expires_at ?? null,
  });
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'write', 'notification-email-verification');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const blocked = await requireNotBlocked({ request, userId, action: 'email' });
  if (blocked) return blocked;

  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashNotificationVerificationToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { error } = await requireSupabaseAdminClient().from('notification_email_settings').upsert(
    {
      user_id: userId,
      pending_email: email,
      verification_token_hash: tokenHash,
      verification_expires_at: expiresAt,
      verification_sent_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'Email is already in use' : 'Failed to save email settings' },
      { status }
    );
  }

  try {
    await sendNotificationEmailVerification(email, token);
  } catch (sendError) {
    console.error('Failed to send notification email verification:', sendError);
    await requireSupabaseAdminClient()
      .from('notification_email_settings')
      .update({
        pending_email: null,
        verification_token_hash: null,
        verification_expires_at: null,
        verification_sent_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('verification_token_hash', tokenHash);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 503 });
  }

  return NextResponse.json({ success: true, pendingEmail: email, expiresAt });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const blocked = await requireNotBlocked({ request, userId, action: 'email' });
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { data, error } = await requireSupabaseAdminClient()
    .from('notification_email_settings')
    .update({ email_enabled: body.enabled, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .not('email_verified_at', 'is', null)
    .select('user_id')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'A verified email is required' }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await requireSupabaseAdminClient()
    .from('notification_email_settings')
    .delete()
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: 'Failed to remove email' }, { status: 500 });
  return NextResponse.json({ success: true });
}
