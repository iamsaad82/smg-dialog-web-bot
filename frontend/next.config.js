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
  // Keine Proxy-Konfiguration mehr erforderlich, da wir jetzt API-Routen verwenden
  
  // Hinweis: Wir verwenden jetzt API-Routen in pages/api/v1/*, 
  // um die Backend-Anfragen weiterzuleiten. Dies bietet mehr Kontrolle
  // und vermeidet Probleme mit Redirects.
}

module.exports = nextConfig
