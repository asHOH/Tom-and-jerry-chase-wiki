export type NotificationTone = 'danger' | 'info' | 'success' | 'warning';

export type NotificationKind =
  | 'article_version_approved'
  | 'article_version_rejected'
  | 'article_version_created'
  | 'game_data_action_approved'
  | 'game_data_action_rejected'
  | 'game_data_action_created'
  | 'article_comment_created'
  | 'discussion_comment_created';

type ModerationNotificationKind = Extract<
  NotificationKind,
  | 'article_version_approved'
  | 'article_version_rejected'
  | 'game_data_action_approved'
  | 'game_data_action_rejected'
>;

type NotificationKindMeta = {
  eyebrow: string;
  tone: NotificationTone;
};

const DEFAULT_NOTIFICATION_KIND_META: NotificationKindMeta = {
  eyebrow: '站内通知',
  tone: 'info',
};

const NOTIFICATION_KIND_META: Record<NotificationKind, NotificationKindMeta> = {
  article_version_approved: {
    eyebrow: '审核通过',
    tone: 'success',
  },
  article_version_rejected: {
    eyebrow: '审核结果',
    tone: 'danger',
  },
  article_version_created: {
    eyebrow: '待审核文章',
    tone: 'warning',
  },
  game_data_action_approved: {
    eyebrow: '审核通过',
    tone: 'success',
  },
  game_data_action_rejected: {
    eyebrow: '审核结果',
    tone: 'danger',
  },
  game_data_action_created: {
    eyebrow: '待审核改动',
    tone: 'warning',
  },
  article_comment_created: {
    eyebrow: '文章评论',
    tone: 'info',
  },
  discussion_comment_created: {
    eyebrow: '讨论评论',
    tone: 'info',
  },
};

const MODERATION_NOTIFICATION_KINDS = new Set<NotificationKind>([
  'article_version_approved',
  'article_version_rejected',
  'game_data_action_approved',
  'game_data_action_rejected',
]);

export const getNotificationKindMeta = (kind: string): NotificationKindMeta =>
  NOTIFICATION_KIND_META[kind as NotificationKind] ?? DEFAULT_NOTIFICATION_KIND_META;

export const isModerationNotificationKind = (kind: string): kind is ModerationNotificationKind =>
  MODERATION_NOTIFICATION_KINDS.has(kind as NotificationKind);
