/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimierte Konfiguration für Produktion
  output: 'standalone', // Erzeugt ein optimiertes Build-Ergebnis für Produktionsumgebungen
  poweredByHeader: false, // Entfernt den X-Powered-By Header für bessere Sicherheit
  experimental: {
    // Optimierte Builds
    optimizeCss: true, // CSS-Optimierungen in Produktion
  },
  // Bei Bedarf hinzufügen: Proxy-Konfiguration für API-Anfragen
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 