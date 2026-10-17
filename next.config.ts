import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { NextConfig } from 'next';
import createMDX from '@next/mdx';

import './src/env';

const productionBuildIdentity = process.env.DEPLOY_BUILD_ID?.trim() || randomUUID();
const requestedBuildCpuCount = Number.parseInt(process.env.NEXT_CPU_COUNT ?? '', 10);
const buildCpuCount =
  Number.isInteger(requestedBuildCpuCount) && requestedBuildCpuCount > 0
    ? requestedBuildCpuCount
    : undefined;

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
    remarkPlugins: [
      path.join(process.cwd(), 'scripts/remark-usage-last-updated.mjs'),
      'remark-gfm',
    ],
  },
});

const nextConfig: NextConfig = {
  agentRules: false,
  // --- 静态镜像（后端已剥离）---
  output: 'export',
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
  outputFileTracingIncludes: {
    '/api/chat': [
      './src/lib/ai/chatCodeRunner.cjs',
      './node_modules/vm2/**/*',
      './node_modules/acorn/**/*',
      './node_modules/acorn-walk/**/*',
    ],
  },
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
  // Enable typed routes for better navigation safety
  typedRoutes: true,
  experimental: {
    useTypeScriptCli: true,
    ...(buildCpuCount ? { cpus: buildCpuCount } : {}),
  },
};

const finalConfig = withBundleAnalyzer(withMDX(nextConfig));

export default finalConfig;
