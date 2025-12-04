import { createRequire } from 'module';
import createMDX from '@next/mdx';
import withPWA from 'next-pwa';

import { buildCspHeader } from './csp.config.mjs';

const require = createRequire(import.meta.url);

let withBundleAnalyzer;
try {
  const bundleAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {
  // Fallback if @next/bundle-analyzer is not installed (e.g. in production test)
  withBundleAnalyzer = (config) => config;
}

const withPwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Exclude problematic build files from precaching
  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
    /server\/.*\.js$/,
    /static\/chunks\/.*\.js\.map$/,
  ],
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
  // Exclude files that might cause 404 errors
  publicExcludes: ['!version.json', '!noprecache/**/*', '!sw.js', '!workbox-*.js'],
  // Fallback for offline pages
  fallbacks: {
    document: '/offline/',
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  typescript: {
    ignoreBuildErrors: !!process.env.NEXT_PUBLIC_DISABLE_ARTICLES,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  async rewrites() {
    const rewriteContents = [
      {
        source: '/version.json',
        destination: '/api/version',
      },
    ];

    if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES) {
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
    formats: ['image/avif', 'image/webp'],
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
    compilationMode: 'annotation',
  },
};

export default withBundleAnalyzer(withPwa(withMDX(nextConfig)));
