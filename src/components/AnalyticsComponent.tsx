'use client';

import { Analytics } from '@vercel/analytics/next';

import { isVercelAnalyticsEnabled } from '@/lib/platform';

export function AnalyticsComponent() {
  if (!isVercelAnalyticsEnabled()) {
    return null;
  }

  return <Analytics debug={false} />;
}
