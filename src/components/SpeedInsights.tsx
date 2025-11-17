'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { isVercelAnalyticsEnabled } from '@/lib/platform';

export function SpeedInsightsComponent() {
  if (!isVercelAnalyticsEnabled()) {
    return null;
  }

  return <SpeedInsights debug={false} />;
}
