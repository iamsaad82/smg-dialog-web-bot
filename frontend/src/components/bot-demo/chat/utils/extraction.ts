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
  // Verbesserte Regex, die auch Links in Klammern und Markdown-Format erkennt
  // z.B. [link text](https://example.com) oder auch normale URLs
  const links: LinkItem[] = [];
  
  try {
    // Markdown-Links erkennen: [text](url)
    const markdownLinkRegex = /\[(.*?)\]\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g;
    let markdownMatch;
    
    while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
      if (markdownMatch[2]) {
        const url = markdownMatch[2].trim();
        const title = markdownMatch[1].trim() || 'Link';
        
        // Link zur Liste hinzufügen
        links.push({ url, title });
      }
    }
    
    // Einfache URLs ohne Markdown-Formatierung erkennen
    // Jetzt auch mit Unterstützung für URLs in Klammern oder anderen Strukturen
    const plainUrlRegex = /(?<!\]\()(https?:\/\/[^\s\)\]"',<>]+)/g;
    let urlMatch;
    
    while ((urlMatch = plainUrlRegex.exec(text)) !== null) {
      if (urlMatch[1]) {
        const url = urlMatch[1].trim();
        
        // Prüfen, ob diese URL bereits als Teil eines Markdown-Links erkannt wurde
        if (!links.some(link => link.url === url)) {
          // Versuchen, einen aussagekräftigen Titel zu extrahieren
          let title = `Link ${links.length + 1}`;
          
          // Kontextbasierte Titel-Extraktion
          if (text.toLowerCase().includes('wohngeld') && url.includes('brandenburg')) {
            title = 'Wohngeld-Informationen Brandenburg';
          } else if (url.includes('stadt-brandenburg')) {
            title = 'Stadt Brandenburg Dienstleistung';
          } else {
            // Domain als Titel verwenden
            try {
              const domain = new URL(url).hostname.replace(/^www\./, '');
              title = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Webseite';
            } catch (e) {
              // Fallback-Titel
              title = 'Externe Webseite';
            }
          }
          
          links.push({ url, title });
        }
      }
    }
    
    // Normalisieren der URLs (Leerzeichen entfernen, etc.)
    return links.map(link => ({
      url: link.url.replace(/\s+/g, ''), // Leerzeichen in URLs entfernen
      title: link.title
    }));
  } catch (error) {
    console.error("Fehler beim Extrahieren von Links:", error);
    return [];
  }
}; 