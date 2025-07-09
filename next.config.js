/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Skip ESLint checks during production builds (helps Vercel deploy without peer-dep issues)
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 