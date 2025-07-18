import bundleAnalyzer from '@next/bundle-analyzer';
import withPWA from 'next-pwa';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    buildId: 'app-build-manifest',
    additionalManifestEntries: ['_next/app-build-manifest.json'],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/version.json',
        destination: '/api/version',
      },
    ];
  },
  trailingSlash: true,
  images: {
    unoptimized: false,
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
};

export default withBundleAnalyzer(withPwa(nextConfig));
