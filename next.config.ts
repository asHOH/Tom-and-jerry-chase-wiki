import { randomUUID } from 'node:crypto';
import { NextConfig } from 'next';
import createMDX from '@next/mdx';

import { buildCspHeader } from './csp.config';

import './src/env';

const productionBuildIdentity = process.env.DEPLOY_BUILD_ID?.trim() || randomUUID();

let withBundleAnalyzer = (config: NextConfig) => config;

if (process.env.ANALYZE === 'true') {
  try {
    // eslint-disable-next-line typescript/no-require-imports
    const mod = require('@next/bundle-analyzer');
    withBundleAnalyzer = mod.default({
      enabled: true,
    });
  } catch (e) {
    if (e instanceof Error) console.warn('Failed to load @next/bundle-analyzer:', e.message);
  }
}

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
  generateBuildId: () => productionBuildIdentity,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: [
    'motion',
    'pinyin-pro',
    'valtio',
    // sanitize-html 2.17.6 is CommonJS but depends on an ESM-only parser chain.
    'sanitize-html',
    'html-react-parser',
    'html-dom-parser',
    'style-to-js',
    'style-to-object',
    'htmlparser2',
    'domhandler',
    'domutils',
    'dom-serializer',
    'domelementtype',
    'entities',
  ],
  // esbuild-wasm is required for Serwist with Turbopack; vm2 must retain its
  // native Node.js runtime behavior for the server-only AI sandbox.
  serverExternalPackages: ['esbuild-wasm', 'vm2'],
  typescript: {
    ignoreBuildErrors: process.env.SKIP_BUILD_CHECKS === 'true',
  },
  env: {
    // Server-only consumers import this embedded value from buildIdentity.ts. Keeping
    // the exact generateBuildId value in the built artifact prevents cache reuse
    // across deployments even when the source commit is unchanged.
    TJWIKI_BUILD_IDENTITY: productionBuildIdentity,
    // Use the commit timestamp if available (set by start_server.sh), otherwise fallback to build time
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
  },
  async rewrites() {
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const rewriteContents = [
      {
        source: '/version.json',
        destination: '/api/version',
      },
    ];

    if (
      process.env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !supabasePublicKey
    ) {
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

    // Discussion page rewrites — map sub-route discussion URLs to a single catch-all handler
    // More-specific patterns (literal segments) take priority over generic :entityType ones
    rewriteContents.push(
      // Special skills: 4 segments
      {
        source: '/special-skills/:factionId/:skillId/discussion/',
        destination: '/discuss/special-skills/:factionId/:skillId/',
      },
      // Standard detail discussions: 3 segments
      {
        source: '/:entityType/:entityId/discussion/',
        destination: '/discuss/:entityType/:entityId/',
      },
      // List discussions: 2 segments
      { source: '/:entityType/discussion/', destination: '/discuss/:entityType/' }
    );

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
          {
            key: 'Permissions-Policy',
            value: 'fullscreen=(self), geolocation=(), microphone=(), camera=()',
          },
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
    deviceSizes: [320, 480, 640],
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
  // Enable typed routes for better navigation safety
  typedRoutes: true,
  experimental: {
    useTypeScriptCli: true,
  },
};

const finalConfig = withBundleAnalyzer(withMDX(nextConfig));

export default finalConfig;
