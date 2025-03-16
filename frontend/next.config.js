/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimierte Konfiguration für Produktion
  output: 'standalone', // Erzeugt ein optimiertes Build-Ergebnis für Produktionsumgebungen
  poweredByHeader: false, // Entfernt den X-Powered-By Header für bessere Sicherheit
  experimental: {
    // Optimierte Builds
    optimizeCss: process.env.NODE_ENV === 'production', // CSS-Optimierungen nur in Produktion aktivieren
  },
  // Proxy-Konfiguration für API-Anfragen
  async rewrites() {
    // Hardcoded URL für den Backend-Service
    let backendUrl = 'http://backend:8000';
    
    console.log('Using hardcoded backend URL:', backendUrl);
    
    console.log(`Backend URL for rewrites: ${backendUrl}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/api/:path*/',
        destination: `${backendUrl}/api/:path*/`,
      },
    ];
  },
}

module.exports = nextConfig
