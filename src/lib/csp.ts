import { isVercelAnalyticsEnabled } from '@/lib/platform';

import { buildCspHeader } from '../../csp.config';

export function getRuntimeCspHeader(): string {
  const csp = buildCspHeader({
    includeVercelAnalytics: isVercelAnalyticsEnabled(),
    allowUnsafeEval: process.env.NODE_ENV !== 'production',
  });
  // frame-ancestors is ignored in <meta> tags and causes console warnings
  return csp.replace(/frame-ancestors[^;]+;?/g, '').trim();
}
