/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    FAIRWAY_ADMIN_PASSWORD: process.env.FAIRWAY_ADMIN_PASSWORD || 'fairway2026',
  },
};
module.exports = nextConfig;
