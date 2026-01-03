import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (typeof window !== 'undefined') {
  if (!dsn) {
    console.warn('Sentry DSN is missing. Sentry will not be initialized.');
  }

  Sentry.init({
    dsn: dsn || '',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: isProd ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: !isProd,

    // Use the tunnel route to bypass ad-blockers
    tunnel: '/monitoring',

    replaysOnErrorSampleRate: 1.0,

    // You may want this to be 100% while in development and sample at a lower rate in production
    replaysSessionSampleRate: isProd ? 0.1 : 1.0,

    // Enable sending user PII (Personally Identifiable Information)
    sendDefaultPii: true,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
