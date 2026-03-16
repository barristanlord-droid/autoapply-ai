/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.CAPACITOR_BUILD === '1' ? 'export' : undefined,
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === '1',
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.licdn.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;
