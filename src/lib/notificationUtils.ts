import 'server-only';

import { createHash } from 'crypto';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_NAME, SITE_URL } from '@/constants/seo';
import { env } from '@/env';

export type NotificationKind =
  | 'article_version_approved'
  | 'article_version_rejected'
  | 'game_data_action_approved'
  | 'game_data_action_rejected';

export type PublishNotificationInput = {
  recipientUserId: string;
  kind: NotificationKind;
  decisionOrigin: 'automatic' | 'manual';
  title: string;
  body: string;
  href?: string;
  sourceIds: string[];
  dedupeKey: string;
};

export type PublishNotificationResult = {
  created: boolean;
  suppressed: boolean;
  emailStatus: 'sent' | 'skipped' | 'failed';
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character] ?? character;
  });

const absoluteHref = (href?: string) => (href ? new URL(href, SITE_URL).toString() : SITE_URL);

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const sendEmail = async ({ to, subject, text, html }: SendEmailInput): Promise<boolean> => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(`Resend returned ${response.status}: ${responseBody}`);
  }

  return true;
};

export const publishNotification = async (
  input: PublishNotificationInput
): Promise<PublishNotificationResult> => {
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', input.recipientUserId)
    .single();

  if (recipientError || !recipient) {
    throw new Error(
      `Failed to load notification recipient: ${recipientError?.message ?? 'missing'}`
    );
  }

  if (
    input.decisionOrigin === 'automatic' &&
    (recipient.role === 'Reviewer' || recipient.role === 'Coordinator')
  ) {
    return { created: false, suppressed: true, emailStatus: 'skipped' };
  }

  const { data: createdNotification, error: insertError } = await supabaseAdmin
    .from('notifications')
    .upsert(
      {
        user_id: input.recipientUserId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        source_ids: input.sourceIds,
        dedupe_key: input.dedupeKey,
      },
      { onConflict: 'dedupe_key', ignoreDuplicates: true }
    )
    .select('id')
    .maybeSingle();

  if (insertError) {
    throw new Error(`Failed to create in-site notification: ${insertError.message}`);
  }

  if (!createdNotification) {
    return { created: false, suppressed: false, emailStatus: 'skipped' };
  }

  const { data: emailSettings, error: settingsError } = await supabaseAdmin
    .from('notification_email_settings')
    .select('email, email_enabled, email_verified_at')
    .eq('user_id', input.recipientUserId)
    .maybeSingle();

  if (settingsError) {
    console.error('Failed to load notification email settings:', settingsError);
    return { created: true, suppressed: false, emailStatus: 'failed' };
  }

  if (!emailSettings?.email || !emailSettings.email_enabled || !emailSettings.email_verified_at) {
    return { created: true, suppressed: false, emailStatus: 'skipped' };
  }

  const link = absoluteHref(input.href);
  const escapedTitle = escapeHtml(input.title);
  const escapedBody = escapeHtml(input.body).replace(/\n/g, '<br>');

  try {
    const sent = await sendEmail({
      to: emailSettings.email,
      subject: `[猫鼠Wiki] ${input.title}`,
      text: `${input.title}\n\n${input.body}\n\n${link}`,
      html: `<h2>${escapedTitle}</h2><p>${escapedBody}</p><p><a href="${escapeHtml(link)}">前往${escapeHtml(SITE_NAME)}查看</a></p>`,
    });
    return {
      created: true,
      suppressed: false,
      emailStatus: sent ? 'sent' : 'skipped',
    };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return { created: true, suppressed: false, emailStatus: 'failed' };
  }
};

export const hashNotificationVerificationToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const sendNotificationEmailVerification = async (
  email: string,
  token: string
): Promise<void> => {
  const verifyUrl = new URL('/api/notifications/email/verify', SITE_URL);
  verifyUrl.searchParams.set('token', token);
  const link = verifyUrl.toString();
  const sent = await sendEmail({
    to: email,
    subject: '[猫鼠Wiki] 验证通知邮箱',
    text: `请在 30 分钟内验证您的通知邮箱：${link}`,
    html: `<p>请在 30 分钟内验证您的通知邮箱：</p><p><a href="${escapeHtml(link)}">验证邮箱</a></p>`,
  });

  if (!sent) throw new Error('Email delivery is not configured');
};
