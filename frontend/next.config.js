/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimiert für statischen Export
  output: 'export',
  // Beseitigt die experimentelle Option
  experimental: {}
}

module.exports = nextConfig 