'use client';

import { Analytics } from '@vercel/analytics/next';

export function AnalyticsComponent({ enabled }: { enabled?: boolean }) {
  if (!enabled) {
    return null;
  }

  return <Analytics debug={false} />;
}
