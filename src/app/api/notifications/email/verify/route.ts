import { NextRequest, NextResponse } from 'next/server';

import { getActiveBlock } from '@/lib/blocks/server';
import { hashNotificationVerificationToken } from '@/lib/notificationUtils';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { SITE_URL } from '@/constants/seo';

const redirectToNotifications = (status: 'verified' | 'invalid' | 'blocked') => {
  const url = new URL('/notifications/', SITE_URL);
  url.searchParams.set('email', status);
  return NextResponse.redirect(url);
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return redirectToNotifications('invalid');

  const tokenHash = hashNotificationVerificationToken(token);
  const { data, error } = await requireSupabaseAdminClient()
    .from('notification_email_settings')
    .select('user_id, pending_email')
    .eq('verification_token_hash', tokenHash)
    .gt('verification_expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data?.pending_email) return redirectToNotifications('invalid');

  const block = await getActiveBlock({ request, userId: data.user_id, action: 'email' });
  if (block) return redirectToNotifications('blocked');

  const now = new Date().toISOString();
  const { error: updateError } = await requireSupabaseAdminClient()
    .from('notification_email_settings')
    .update({
      email: data.pending_email,
      email_verified_at: now,
      email_enabled: true,
      pending_email: null,
      verification_token_hash: null,
      verification_expires_at: null,
      verification_sent_at: null,
      updated_at: now,
    })
    .eq('user_id', data.user_id)
    .eq('verification_token_hash', tokenHash);

  return redirectToNotifications(updateError ? 'invalid' : 'verified');
}
