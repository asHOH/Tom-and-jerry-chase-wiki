'use client';

import useSWR from 'swr';

type NotificationSummary = { unreadCount?: number };

export const NOTIFICATION_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

const fetcher = async (url: string): Promise<NotificationSummary> => {
  const response = await fetch(url);
  if (!response.ok) return { unreadCount: 0 };
  return (await response.json()) as NotificationSummary;
};

export const NOTIFICATIONS_API_KEY = '/api/notifications?filter=all';

export const useNotificationCount = (enabled: boolean) => {
  const { data } = useSWR(enabled ? NOTIFICATIONS_API_KEY : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: NOTIFICATION_REFRESH_INTERVAL_MS,
  });
  return data?.unreadCount ?? 0;
};
