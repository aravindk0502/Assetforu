/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Allow dynamic rendering on Vercel
  experimental: {
    allowDynamic: [
      '/node_modules/uuid/**',
    ],
  },
};

module.exports = nextConfig;
