import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { renderWikiEmailTemplate } from '@/lib/emailTemplate';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/constants/seo';
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

const absoluteHref = (href?: string) => (href ? new URL(href, SITE_URL).toString() : SITE_URL);

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  headers,
}: SendEmailInput): Promise<boolean> => {
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
      ...(headers ? { headers } : {}),
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(`Resend returned ${response.status}: ${responseBody}`);
  }

  return true;
};

const getUnsubscribeSecret = () =>
  env.NOTIFICATION_UNSUBSCRIBE_SECRET ?? env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

const getEmailFingerprint = (email: string) =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24);

export const createNotificationUnsubscribeToken = (userId: string, email: string): string => {
  const secret = getUnsubscribeSecret();
  if (!secret) throw new Error('Notification unsubscribe signing secret is not configured');

  const payload = Buffer.from(`${userId}:${getEmailFingerprint(email)}`).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

export const getNotificationUnsubscribeUserId = (token: string): string | null => {
  const secret = getUnsubscribeSecret();
  if (!secret) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const userId = decoded.slice(0, separatorIndex);
    return separatorIndex > 0 && userId ? userId : null;
  } catch {
    return null;
  }
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
  const unsubscribeToken = createNotificationUnsubscribeToken(
    input.recipientUserId,
    emailSettings.email
  );
  const unsubscribeUrl = new URL('/api/notifications/email/unsubscribe', SITE_URL);
  unsubscribeUrl.searchParams.set('token', unsubscribeToken);
  const unsubscribeLink = unsubscribeUrl.toString();
  const approved = input.kind.endsWith('_approved');

  try {
    const sent = await sendEmail({
      to: emailSettings.email,
      subject: `[猫鼠Wiki] ${input.title}`,
      text: `${input.title}\n\n${input.body}\n\n${link}\n\n取消订阅审核结果邮件：${unsubscribeLink}`,
      html: renderWikiEmailTemplate({
        preheader: `${input.title}：${input.body}`,
        eyebrow: approved ? '审核通过' : '审核结果',
        title: input.title,
        message: input.body,
        tone: approved ? 'success' : 'danger',
        action: { label: '查看详情', url: link },
        notice: '您可以随时在 Wiki 的通知页面管理邮件通知设置。',
        unsubscribeUrl: unsubscribeLink,
      }),
      headers: {
        'List-Unsubscribe': `<${unsubscribeLink}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
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
    html: renderWikiEmailTemplate({
      preheader: '验证您的猫鼠 Wiki 通知邮箱',
      eyebrow: '邮箱验证',
      title: '验证通知邮箱',
      message: '请确认这是您希望用于接收审核结果通知的邮箱地址。',
      tone: 'info',
      action: { label: '验证邮箱', url: link },
      notice: '此验证链接将在 30 分钟后失效。如果这不是您的操作，可以安全忽略本邮件。',
    }),
  });

  if (!sent) throw new Error('Email delivery is not configured');
};
