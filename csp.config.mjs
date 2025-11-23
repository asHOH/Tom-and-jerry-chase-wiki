const directives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://static.cloudflareinsights.com',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
  'img-src': ["'self'", 'data:', 'https://*.supabase.co'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    '*.supabase.co',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://api.pwnedpasswords.com',
    'https://*.pusher.com',
    'wss://*.pusher.com',
    'https://static.cloudflareinsights.com',
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': [
    "'self'",
    'about:',
    'data:',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  'child-src': [
    "'self'",
    'about:',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'frame-ancestors': ["'none'"],
};

function serializeCsp(map) {
  return Object.entries(map)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');
}

export const cspDirectives = directives;
export const cspHeaderValue = serializeCsp(directives);

export function extendCsp(additionalDirectives = {}) {
  const merged = { ...directives };
  for (const [key, value] of Object.entries(additionalDirectives)) {
    const base = new Set(merged[key] ?? []);
    for (const entry of value) base.add(entry);
    merged[key] = Array.from(base);
  }
  return serializeCsp(merged);
}

const vercelAnalyticsDirectives = {
  'script-src': ['https://vercel.live', 'https://va.vercel-scripts.com'],
  'img-src': ['https://vitals.vercel-insights.com'],
  'connect-src': [
    'https://vitals.vercel-insights.com',
    'https://vercel-analytics.com',
    'https://vercel.live',
  ],
  'frame-src': ['https://vercel.live'],
  'child-src': ['https://vercel.live'],
};

export function buildCspHeader({ includeVercelAnalytics = false } = {}) {
  if (includeVercelAnalytics) {
    return extendCsp(vercelAnalyticsDirectives);
  }
  return cspHeaderValue;
}

export default cspHeaderValue;
