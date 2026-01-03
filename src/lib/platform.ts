import 'server-only';

import { env } from '@/env';

function isVercelDeployment(): boolean {
  return env.VERCEL === '1';
}

export function isVercelAnalyticsEnabled(): boolean {
  const override = env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS;
  if (override === '0') {
    return false;
  }
  if (override === '1') {
    return true;
  }
  return isVercelDeployment() && process.env.NODE_ENV === 'production';
}
