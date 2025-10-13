/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Only use bundle analyzer in development/analysis mode
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('next-bundle-analyzer')({ enabled: true });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
