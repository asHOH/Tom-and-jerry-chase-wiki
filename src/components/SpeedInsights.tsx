'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';

export function SpeedInsightsComponent() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  // Don't load speed insights in development or if not on Vercel
  if (!isProduction || !isVercel) {
    return null;
  }

  return <SpeedInsights debug={false} />;
}
