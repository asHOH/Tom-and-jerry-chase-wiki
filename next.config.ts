import withPWAInit from '@ducanh2912/next-pwa';
import createMDX from '@next/mdx';
import { withSentryConfig } from '@sentry/nextjs';

import { buildCspHeader } from './csp.config.mjs';

import './src/env';

import { NextConfig } from 'next';

let withBundleAnalyzer = (config: NextConfig) => config;

if (process.env.ANALYZE === 'true') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@next/bundle-analyzer');
    withBundleAnalyzer = mod.default({
      enabled: true,
    });
  } catch (e) {
    if (e instanceof Error) console.warn('Failed to load @next/bundle-analyzer:', e.message);
  }
}

const withPwa = withPWAInit({
  dest: 'public',
  register: false,
  disable: process.env.NODE_ENV === 'development',
  // Exclude problematic build files from precaching
  // buildExcludes: [
  //   /middleware-manifest\.json$/,
  //   /app-build-manifest\.json$/,
  //   /server\/.*\.js$/,
  //   /static\/chunks\/.*\.js\.map$/,
  // ],
  // Exclude files that might cause 404 errors
  publicExcludes: ['!version.json', '!noprecache/**/*', '!sw.js', '!workbox-*.js'],
  // Fallback for offline pages
  fallbacks: {
    document: '/offline/',
  },
  workboxOptions: {
    skipWaiting: true,

    // More conservative runtime caching
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/version.*$/,
        handler: 'NetworkOnly',
        options: {
          cacheName: 'version-check',
        },
      },
      {
        urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 2592000, // 30 days (shorter than before)
          },
        },
      },
      {
        urlPattern: /^https?.*\.(js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      {
        urlPattern: /^https?.*\/api\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
    ],
  },
});

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

const shouldIncludeVercelAnalytics = () => {
  const override = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS;
  if (override === '0') {
    return false;
  }
  if (override === '1') {
    return true;
  }
  return process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
};

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['motion', 'pinyin-pro', 'valtio'],
  typescript: {
    ignoreBuildErrors:
      process.env.SKIP_BUILD_CHECKS === 'true' ||
      !!process.env.NEXT_PUBLIC_DISABLE_ARTICLES ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  env: {
    // Use the commit timestamp if available (set by start_server.sh), otherwise fallback to build time
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
  },
  async rewrites() {
    const rewriteContents = [
      {
        source: '/version.json',
        destination: '/api/version',
      },
    ];

    if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      rewriteContents.push(
        { source: '/api/articles', destination: '/404' },
        { source: '/api/articles/:path*', destination: '/404' },
        { source: '/api/admin', destination: '/404' },
        { source: '/api/admin/:path*', destination: '/404' },
        { source: '/api/auth', destination: '/404' },
        { source: '/api/auth/:path*', destination: '/404' },
        { source: '/api/moderation', destination: '/404' },
        { source: '/api/moderation/:path*', destination: '/404' },
        { source: '/api/site-images', destination: '/404' },
        { source: '/api/site-images/:path*', destination: '/404' },
        { source: '/api/uploads', destination: '/404' },
        { source: '/api/uploads/:path*', destination: '/404' },
        { source: '/articles', destination: '/404' },
        { source: '/articles/:path*', destination: '/404' },
        { source: '/admin', destination: '/404' },
        { source: '/admin/:path*', destination: '/404' }
      );
    }

    if (process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL === '1') {
      rewriteContents.push({ source: '/api/feedback', destination: '/404' });
    }

    return rewriteContents;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Content-Security-Policy',
            value: buildCspHeader({ includeVercelAnalytics: shouldIncludeVercelAnalytics() }),
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  trailingSlash: true,
  images: {
    // unoptimized: true,
    formats: ['image/avif' as const, 'image/webp' as const],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // loader: 'custom',
    // loaderFile: './src/components/Image.tsx',
  },
  poweredByHeader: false,
  compress: true,
  // Safe webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  reactCompiler: {
    compilationMode: 'annotation' as const,
  },
};

const sentryConfig = withBundleAnalyzer(withPwa(withMDX(nextConfig)));

export default withSentryConfig(sentryConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  ...(process.env.SENTRY_ORG && { org: process.env.SENTRY_ORG }),
  ...(process.env.SENTRY_PROJECT && { project: process.env.SENTRY_PROJECT }),

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
