const directives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://vercel.live',
    'https://va.vercel-scripts.com',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
  'img-src': ["'self'", 'data:', 'https://vitals.vercel-insights.com', 'https://*.supabase.co'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://vitals.vercel-insights.com',
    'https://vercel-analytics.com',
    'https://vercel.live',
    '*.supabase.co',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
    'https://api.pwnedpasswords.com',
  ],
  'media-src': ["'self'"],
  'object-src': ['none'],
  'frame-src': [
    "'self'",
    'about:',
    'https://vercel.live',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  'child-src': [
    "'self'",
    'about:',
    'https://vercel.live',
    'https://hcaptcha.com',
    'https://*.hcaptcha.com',
    'https://challenges.cloudflare.com',
  ],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'frame-ancestors': ['none'],
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

export default cspHeaderValue;
