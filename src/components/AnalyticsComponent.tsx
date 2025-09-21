'use client';

import { Analytics } from '@vercel/analytics/next';

export function AnalyticsComponent() {
  return <Analytics debug={false} />;
}
