// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – reuse shared CSP config authored as .mjs
import { buildCspHeader } from '@/../csp.config.mjs';

import { isVercelAnalyticsEnabled } from '@/lib/platform';

export function getRuntimeCspHeader(): string {
  const csp = buildCspHeader({ includeVercelAnalytics: isVercelAnalyticsEnabled() });
  // frame-ancestors is ignored in <meta> tags and causes console warnings
  return csp.replace(/frame-ancestors[^;]+;?/g, '').trim();
}
