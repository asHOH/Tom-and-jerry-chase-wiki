'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';

export function SpeedInsightsComponent({ enabled }: { enabled?: boolean }) {
  if (!enabled) {
    return null;
  }

  return <SpeedInsights debug={false} />;
}
