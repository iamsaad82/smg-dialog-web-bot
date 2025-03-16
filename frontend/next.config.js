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
    // In Docker-Umgebung verwenden wir den Backend-Servicenamen
    // In der Entwicklungsumgebung auf dem Host verwenden wir localhost
    let backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    
    // Wenn wir im Container sind und BACKEND_URL nicht gesetzt ist, verwenden wir den Container-Namen
    if (process.env.NODE_ENV === 'development' && !process.env.BACKEND_URL && !process.env.DOCKER_CONTAINER) {
      backendUrl = 'http://localhost:8000';
    }
    
    console.log(`Backend URL for rewrites: ${backendUrl}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 