import { LinkItem, NumberedSection } from './types';

// Erkennt nummerierte Listenelemente (z.B. "1. Alternative Heilmethoden:")
export const extractNumberedSections = (text: string): NumberedSection[] => {
  // Prüfen für das spezielle Format aus dem Screenshot
  const screenShotRegex = /(\d+)\.\s+\*\*([^*:]+)\*\*([^]*?)(?=\d+\.\s+\*\*|\n\n\d+\s|\n\s*\n|$)/g;
  const sections: NumberedSection[] = [];
  
  try {
    let match;
    let fullText = text;
    
    // Ein zusätzlicher Punkt am Ende hilft, das letzte Segment zu extrahieren
    if (!fullText.endsWith('.')) {
      fullText += '.';
    }
    
    // Zuerst den Screenshot-Stil prüfen
    while ((match = screenShotRegex.exec(fullText)) !== null) {
      const [_, number, title, content] = match;
      if (title && title.trim()) {
        sections.push({
          number,
          title: title.trim(),
          content: content.trim()
        });
      }
    }
    
    // Wenn keine Treffer, dann die anderen Formate probieren
    if (sections.length === 0) {
      // Verbesserte Regex für verschiedene Formate mit korrekter Doppelpunktbehandlung
      // Nummerierung (1. oder 1)), gefolgt von Titel, optional ein Doppelpunkt, dann Inhalt
      const numberedSectionRegex = /(\d+)[\.)\s]+\s*([^:\n]+)(?::\s*)?(.+?)(?=\s*\d+[\.)\s]+\s*[^:\n]+(?::\s*)?|$)/g;
      
      while ((match = numberedSectionRegex.exec(fullText)) !== null) {
        const [_, number, title, content] = match;
        if (title && title.trim()) {
          sections.push({
            number,
            title: title.trim(),
            content: content.trim()
          });
        }
      }
    }
    
    // Dritte Alternative für "X. **Titel**: Content" Format
    if (sections.length === 0) {
      const boldTitleWithColonRegex = /(\d+)[\.)\s]+\s+\*\*([^*:]+)(?::\s*)\*\*([\s\S]*?)(?=\s*\d+[\.)\s]+\s+\*\*|$)/g;
      while ((match = boldTitleWithColonRegex.exec(fullText)) !== null) {
        const [_, number, title, content] = match;
        if (title && title.trim()) {
          sections.push({
            number,
            title: title.trim(),
            content: content.trim()
          });
        }
      }
    }
  } catch (error) {
    console.error("Fehler beim Extrahieren von nummerierten Abschnitten:", error);
  }
  
  return sections;
};

// Extrahiert Aufzählungen mit Punkten
export const extractBulletPoints = (text: string): string[] => {
  const items: string[] = [];
  const bulletRegex = /[•\-\*]\s+([\s\S]*?)(?=\n[•\-\*]|$)/g;
  
  try {
    let match;
    while ((match = bulletRegex.exec(text)) !== null) {
      if (match[1] && match[1].trim()) {
        items.push(match[1].trim());
      }
    }
  } catch (error) {
    console.error("Fehler beim Extrahieren von Aufzählungspunkten:", error);
  }
  
  return items;
};

// Extrahiert Links aus dem Text
export const extractLinks = (text: string): LinkItem[] => {
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const links: LinkItem[] = [];
  
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      url: match[0],
      title: `Link ${links.length + 1}` // Standard-Titel, wenn kein besserer verfügbar ist
    });
  }
  
  return links;
}; 