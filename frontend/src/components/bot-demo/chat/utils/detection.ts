import { StructuredContent, BulletedSection } from './types';
import { extractNumberedSections, extractBulletPoints } from './extraction';

// Erkennt strukturierte Daten im Text
export const detectStructuredContent = (text: string): StructuredContent => {
  try {
    // Streaming-Unterstützung: Nur analysieren, wenn ausreichend Text vorhanden ist
    if (!text || text.length < 10) {
      return { type: 'simple', text };
    }
    
    // Vereinfachte Erkennungslogik für nummerierte Listen
    // Wenn der Text nummerierte Einträge enthält (1., 2., usw.), versuchen wir diese zu extrahieren
    const numberedSections = extractNumberedSections(text);
    if (numberedSections.length > 0) {
      return { type: 'numbered', sections: numberedSections };
    }

    // Einfachere Erkennung von Aufzählungspunkten
    const bulletPoints = extractBulletPoints(text);
    if (bulletPoints.length > 3) { // Nur relevante Aufzählungen mit mehreren Punkten erkennen
      return { 
        type: 'bulleted', 
        sections: [{ title: '', items: bulletPoints }] 
      };
    }
    
    // Bei weniger als 3 Aufzählungspunkten oder keiner erkannten Struktur, 
    // den Text als einfachen Text behandeln
    return { type: 'simple', text };
  } catch (error) {
    console.error("Fehler bei der Strukturerkennung:", error);
    return { type: 'simple', text };
  }
}; 