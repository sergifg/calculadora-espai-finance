/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.espaifinance.com',
      },
    ],
  },
}

module.exports = nextConfig
