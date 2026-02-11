import { spawnSync } from 'node:child_process';
import createMDX from '@next/mdx';
import withSerwistInit from '@serwist/next';

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

// Get git revision for cache busting (falls back to UUID if git not available)
const getRevision = (): string => {
  try {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' });
    return result.stdout?.trim() || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
};

const revision = getRevision();

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  // Precache the offline fallback page with revision for cache busting
  additionalPrecacheEntries: [{ url: '/offline/', revision }],
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
  // Required for Serwist to work with Turbopack
  serverExternalPackages: ['esbuild-wasm'],
  typescript: {
    ignoreBuildErrors: process.env.SKIP_BUILD_CHECKS === 'true',
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
    const headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          {
            key: 'Content-Security-Policy',
            value: buildCspHeader({
              includeVercelAnalytics: shouldIncludeVercelAnalytics(),
              allowUnsafeEval: process.env.NODE_ENV !== 'production',
            }),
          },
        ],
      },
    ];

    const allowedOrigin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    if (allowedOrigin) {
      headers.push({
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Vary', value: 'Origin' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      });
    }

    return headers;
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
  experimental: {
    // Enable typed routes for better navigation safety
    typedRoutes: true,
  },
};

const finalConfig = withBundleAnalyzer(withSerwist(withMDX(nextConfig)));

export default finalConfig;
