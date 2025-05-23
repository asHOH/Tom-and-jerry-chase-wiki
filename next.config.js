/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable image optimization for static export
    domains: ['localhost'],
  },
  output: 'export', // For GitHub Pages static export
};

module.exports = nextConfig;
