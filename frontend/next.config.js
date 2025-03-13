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
  // Proxy-Konfiguration für API-Anfragen
  async rewrites() {
    // Stellt sicher, dass die URL korrekt formatiert ist
    let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    // Wenn backendUrl nicht mit http:// oder https:// beginnt, fügen wir http:// hinzu
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `http://${backendUrl}`;
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