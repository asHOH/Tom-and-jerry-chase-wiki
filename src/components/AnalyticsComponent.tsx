'use client';

import { Analytics } from '@vercel/analytics/next';
import { isVercelDeployment } from '@/lib/platform';

export function AnalyticsComponent() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Only load Analytics when running on Vercel production
  if (!isProduction || !isVercelDeployment()) {
    return null;
  }

  return <Analytics debug={false} />;
}
