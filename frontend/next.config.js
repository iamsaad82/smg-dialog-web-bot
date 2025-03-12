/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy wird jetzt über die API-Routes gesteuert
  experimental: {
    // Diese Option kann helfen, Probleme mit React 18 und JSX-Komponenten zu lösen
    esmExternals: 'loose'
  }
}

module.exports = nextConfig 