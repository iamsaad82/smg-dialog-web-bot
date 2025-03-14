import { LinkItem, NumberedSection } from './types';

// Erkennt nummerierte Listenelemente (z.B. "1. Alternative Heilmethoden")
export const extractNumberedSections = (text: string): NumberedSection[] => {
  const sections: NumberedSection[] = [];
  
  try {
    // Vereinfachter Ansatz: Nummerierte Abschnitte erkennen
    // Zeilen mit Nummern am Anfang (1., 2., etc.) finden
    const lines = text.split('\n');
    let currentSection: NumberedSection | null = null;
    let contentLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Nummeriertes Element erkennen (z.B. "1. Titel" oder "2. Wohngeld ( Mietzuschuss/Lastenzuschuss )")
      const numberedMatch = line.match(/^(\d+)[\.)]\s+(.+)$/);
      
      if (numberedMatch) {
        // Wenn wir bereits einen aktuellen Abschnitt haben, speichern wir ihn
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          sections.push(currentSection);
          contentLines = [];
        }
        
        // Neuen Abschnitt starten
        currentSection = {
          number: numberedMatch[1],
          title: numberedMatch[2].trim(),
          content: ''
        };
      } 
      // Wenn keine nummerierte Zeile, aber wir haben einen aktuellen Abschnitt,
      // betrachten wir es als Inhalt des aktuellen Abschnitts
      else if (currentSection) {
        contentLines.push(line);
      }
    }
    
    // Den letzten Abschnitt hinzufügen, falls vorhanden
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      sections.push(currentSection);
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