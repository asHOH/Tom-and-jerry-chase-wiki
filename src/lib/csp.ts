// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – reuse shared CSP config authored as .mjs
import { buildCspHeader } from '@/../csp.config.mjs';
import { isVercelAnalyticsEnabled } from '@/lib/platform';

export function getRuntimeCspHeader(): string {
  return buildCspHeader({ includeVercelAnalytics: isVercelAnalyticsEnabled() });
}
