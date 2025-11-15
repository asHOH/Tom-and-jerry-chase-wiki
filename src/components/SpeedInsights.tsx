'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { isVercelDeployment } from '@/lib/platform';

export function SpeedInsightsComponent() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Only load Speed Insights for Vercel production deployments
  if (!isProduction || !isVercelDeployment()) {
    return null;
  }

  return <SpeedInsights debug={false} />;
}
