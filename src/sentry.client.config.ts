import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  console.warn('Sentry DSN is missing. Sentry will not be initialized.');
}

console.log('Sentry Client Config Initialized');

Sentry.init({
  dsn: dsn || '',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,

  // Use the tunnel route to bypass ad-blockers
  tunnel: '/monitoring',

  replaysOnErrorSampleRate: 1,

  // You may want this to be 100% while in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
