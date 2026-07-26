import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { getActiveBlock } from '@/lib/blocks/check';
import {
  getDiscussionCommentHref,
  getDiscussionNotificationTarget,
} from '@/lib/comments/scopeMapping';
import { renderWikiEmailTemplate } from '@/lib/emailTemplate';
import {
  getNotificationKindMeta,
  isModerationNotificationKind,
  type NotificationKind,
} from '@/lib/notifications/kinds';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/constants/seo';
import { env } from '@/env';

export type PublishNotificationInput = {
  recipientUserId: string;
  kind: NotificationKind;
  decisionOrigin: 'automatic' | 'manual';
  title: string;
  body: string;
  href?: string;
  sourceIds: string[];
  dedupeKey: string;
  skipEmailDelivery?: boolean;
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
    .select('id')
    .eq('id', input.recipientUserId)
    .single();

  if (recipientError || !recipient) {
    throw new Error(
      `Failed to load notification recipient: ${recipientError?.message ?? 'missing'}`
    );
  }

  const { data: canApproveArticles, error: permissionError } = await supabaseAdmin.rpc(
    'user_has_permission',
    {
      p_user_id: input.recipientUserId,
      p_permission_key: 'article_version.approve',
    }
  );
  if (permissionError) {
    throw new Error(
      `Failed to load notification recipient permissions: ${permissionError.message}`
    );
  }

  if (
    input.decisionOrigin === 'automatic' &&
    isModerationNotificationKind(input.kind) &&
    canApproveArticles
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

  if (input.skipEmailDelivery) {
    return { created: true, suppressed: false, emailStatus: 'skipped' };
  }

  const emailBlock = await getActiveBlock({ userId: input.recipientUserId, action: 'email' });
  if (emailBlock) {
    return { created: true, suppressed: false, emailStatus: 'skipped' };
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
  const kindMeta = getNotificationKindMeta(input.kind);

  try {
    const sent = await sendEmail({
      to: emailSettings.email,
      subject: `[猫鼠Wiki] ${input.title}`,
      text: `${input.title}\n\n${input.body}\n\n${link}\n\n取消订阅通知邮件：${unsubscribeLink}`,
      html: renderWikiEmailTemplate({
        preheader: `${input.title}：${input.body}`,
        eyebrow: kindMeta.eyebrow,
        title: input.title,
        message: input.body,
        tone: kindMeta.tone,
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

const uniqueIds = (values: readonly string[]) => [
  ...new Set(values.filter((value) => value.trim().length > 0)),
];

export async function notifyArticleVersionSubscribers(input: {
  actorUserId: string;
  articleId: string;
  articleTitle: string;
  proposedCategoryId: string;
  versionId: string;
}): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc('get_article_version_notification_recipients', {
    p_actor_id: input.actorUserId,
    p_article_id: input.articleId,
    p_proposed_category_id: input.proposedCategoryId,
  });

  if (error) {
    throw new Error(`Failed to load article version notification recipients: ${error.message}`);
  }

  const recipientIds = uniqueIds((data ?? []).map((row) => row.user_id));
  if (recipientIds.length === 0) return;

  await Promise.all(
    recipientIds.map((recipientUserId) =>
      publishNotification({
        recipientUserId,
        kind: 'article_version_created',
        decisionOrigin: 'automatic',
        title: '收到新的待审核文章',
        body: `《${input.articleTitle || '文章'}》已提交，等待审核。`,
        href: '/articles/pending/',
        sourceIds: [input.versionId],
        dedupeKey: `article-version-created:${input.versionId}:recipient:${recipientUserId}`,
      })
    )
  );
}

export async function notifyPendingGameDataActionSubscribers(input: {
  actorUserId: string | null;
  actionIds: readonly string[];
}): Promise<void> {
  const actionIds = uniqueIds(input.actionIds);
  if (actionIds.length === 0) return;

  const recipientsByUserId = new Map<string, string[]>();

  await Promise.all(
    actionIds.map(async (actionId) => {
      const { data, error } = await supabaseAdmin.rpc(
        'get_game_data_action_notification_recipients',
        {
          p_action_id: actionId,
          ...(input.actorUserId === null
            ? { p_actor_id: null }
            : { p_actor_id: input.actorUserId }),
        }
      );

      if (error) {
        throw new Error(`Failed to load game data notification recipients: ${error.message}`);
      }

      for (const recipientUserId of uniqueIds((data ?? []).map((row) => row.user_id))) {
        const sourceIds = recipientsByUserId.get(recipientUserId) ?? [];
        sourceIds.push(actionId);
        recipientsByUserId.set(recipientUserId, sourceIds);
      }
    })
  );

  await Promise.all(
    [...recipientsByUserId.entries()].map(([recipientUserId, sourceIds]) => {
      const uniqueSourceIds = uniqueIds(sourceIds).sort();
      return publishNotification({
        recipientUserId,
        kind: 'game_data_action_created',
        decisionOrigin: 'automatic',
        title: '收到新的待审核游戏数据改动',
        body: `有 ${uniqueSourceIds.length} 条新的游戏数据改动等待审核。`,
        href: '/admin/?tab=actions',
        sourceIds: uniqueSourceIds,
        dedupeKey: `game-data-action-created:${uniqueSourceIds.join(',')}:recipient:${recipientUserId}`,
      });
    })
  );
}

export async function notifyDiscussionCommentSubscribers(input: {
  actorUserId: string;
  commentId: string;
  scope: string;
  targetId: string;
  body: string;
}): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('notification_subscription_settings')
    .select('user_id')
    .eq('discussion_comment_enabled', true)
    .neq('user_id', input.actorUserId);

  if (error) {
    throw new Error(`Failed to load discussion comment notification recipients: ${error.message}`);
  }

  const recipientIds = uniqueIds((data ?? []).map((row) => row.user_id));
  if (recipientIds.length === 0) return;

  const target = getDiscussionNotificationTarget(input.scope, input.targetId);
  const href = getDiscussionCommentHref(input.scope, input.targetId, input.commentId);
  const labelSuffix =
    target.entityTitle === target.entityTypeLabel
      ? target.entityTitle
      : `${target.entityTitle} (${target.entityTypeLabel})`;

  await Promise.all(
    recipientIds.map((recipientUserId) =>
      publishNotification({
        recipientUserId,
        kind: 'discussion_comment_created',
        decisionOrigin: 'automatic',
        title: `${labelSuffix} 有新评论`,
        body: input.body,
        href,
        sourceIds: [input.commentId],
        dedupeKey: `discussion-comment-created:${input.commentId}:recipient:${recipientUserId}`,
        skipEmailDelivery: true,
      })
    )
  );
}

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
      message: '请确认这是您希望用于接收站内通知邮件的邮箱地址。',
      tone: 'info',
      action: { label: '验证邮箱', url: link },
      notice: '此验证链接将在 30 分钟后失效。如果这不是您的操作，可以安全忽略本邮件。',
    }),
  });

  if (!sent) throw new Error('Email delivery is not configured');
};
