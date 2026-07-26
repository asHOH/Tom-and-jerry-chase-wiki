import { hasPermission, type PermissionGrant } from '@/lib/auth/permissions';

export type NotificationSubscriptionSettings = {
  articleVersionPendingEnabled: boolean;
  gameDataActionPendingEnabled: boolean;
  discussionCommentEnabled: boolean;
};

export type NotificationSubscriptionAvailability = {
  articleVersionPendingAvailable: boolean;
  gameDataActionPendingAvailable: boolean;
  discussionCommentAvailable: boolean;
};

export type NotificationSubscriptionResponse = NotificationSubscriptionSettings & {
  availability: NotificationSubscriptionAvailability;
};

export type NotificationSubscriptionKey = keyof NotificationSubscriptionSettings;
export type NotificationSubscriptionUpdate = {
  [Key in NotificationSubscriptionKey]?: boolean | undefined;
};

export const DEFAULT_NOTIFICATION_SUBSCRIPTION_SETTINGS: NotificationSubscriptionSettings = {
  articleVersionPendingEnabled: false,
  gameDataActionPendingEnabled: false,
  discussionCommentEnabled: false,
};

export const NOTIFICATION_SUBSCRIPTION_COLUMN_MAP = {
  articleVersionPendingEnabled: 'article_version_pending_enabled',
  gameDataActionPendingEnabled: 'game_data_action_pending_enabled',
  discussionCommentEnabled: 'discussion_comment_enabled',
} as const satisfies Record<NotificationSubscriptionKey, string>;

type NotificationSubscriptionRow = Partial<{
  article_version_pending_enabled: boolean | null;
  game_data_action_pending_enabled: boolean | null;
  discussion_comment_enabled: boolean | null;
}>;

export const toNotificationSubscriptionSettings = (
  row?: NotificationSubscriptionRow | null
): NotificationSubscriptionSettings => ({
  articleVersionPendingEnabled:
    row?.article_version_pending_enabled ??
    DEFAULT_NOTIFICATION_SUBSCRIPTION_SETTINGS.articleVersionPendingEnabled,
  gameDataActionPendingEnabled:
    row?.game_data_action_pending_enabled ??
    DEFAULT_NOTIFICATION_SUBSCRIPTION_SETTINGS.gameDataActionPendingEnabled,
  discussionCommentEnabled:
    row?.discussion_comment_enabled ??
    DEFAULT_NOTIFICATION_SUBSCRIPTION_SETTINGS.discussionCommentEnabled,
});

export const toNotificationSubscriptionRowUpdate = (
  settings: NotificationSubscriptionUpdate
): Partial<
  Record<(typeof NOTIFICATION_SUBSCRIPTION_COLUMN_MAP)[NotificationSubscriptionKey], boolean>
> => {
  const update: Partial<
    Record<(typeof NOTIFICATION_SUBSCRIPTION_COLUMN_MAP)[NotificationSubscriptionKey], boolean>
  > = {};

  for (const [key, column] of Object.entries(NOTIFICATION_SUBSCRIPTION_COLUMN_MAP) as Array<
    [
      NotificationSubscriptionKey,
      (typeof NOTIFICATION_SUBSCRIPTION_COLUMN_MAP)[NotificationSubscriptionKey],
    ]
  >) {
    const value = settings[key];
    if (typeof value === 'boolean') {
      update[column] = value;
    }
  }

  return update;
};

export const getNotificationSubscriptionAvailability = (
  grants: readonly PermissionGrant[]
): NotificationSubscriptionAvailability => ({
  articleVersionPendingAvailable:
    hasPermission(grants, 'article_version.approve') ||
    hasPermission(grants, 'article_version.reject') ||
    hasPermission(grants, 'article_version.revoke'),
  gameDataActionPendingAvailable:
    hasPermission(grants, 'game_data_action.approve') ||
    hasPermission(grants, 'game_data_action.reject') ||
    hasPermission(grants, 'game_data_action.revoke'),
  discussionCommentAvailable: true,
});
