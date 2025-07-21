'use client';

import { Analytics } from '@vercel/analytics/react';

export function AnalyticsComponent() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  // Don't load analytics in development or if not on Vercel
  if (!isProduction || !isVercel) {
    return null;
  }

  return <Analytics debug={false} />;
}
