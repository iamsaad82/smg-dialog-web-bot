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
  // Verbesserte Regex, die auch Links in Klammern und anderen Strukturen erkennt
  const linkRegex = /(?:\[([^\]]+)\])?\s*\(?(?:https?:\/\/|www\.)([^\s\)\]"',]+)/g;
  const links: LinkItem[] = [];
  
  try {
    // Zuerst alle direkten URL-Matches finden
    const urlMatches = text.match(linkRegex) || [];
    
    for (let i = 0; i < urlMatches.length; i++) {
      const rawMatch = urlMatches[i];
      
      // URL extrahieren - alles was mit http:// oder https:// oder www. beginnt
      let url = rawMatch.match(/(https?:\/\/|www\.)[^\s\)\]"',]+/)?.[0] || '';
      
      // Sicherstellen, dass URLs, die mit www. beginnen, ein https:// vorangestellt bekommen
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      }
      
      // Versuchen, einen aussagekräftigen Titel zu extrahieren
      let title = `Link ${links.length + 1}`; // Standard-Titel
      
      // Kontextbasierte Titel-Extraktion: Text vor dem Link prüfen auf Beschreibungen
      const textBeforeLink = text.substring(0, text.indexOf(rawMatch));
      const lastSentence = textBeforeLink.split(/[.!?]/).pop() || '';
      
      // Wenn der Link in eckigen Klammern ist, den Text aus den Klammern als Titel verwenden
      const bracketMatch = rawMatch.match(/\[([^\]]+)\]/);
      if (bracketMatch && bracketMatch[1]) {
        title = bracketMatch[1];
      } 
      // Wenn der Link nach "unter [" oder ähnlichen Formulierungen kommt
      else if (lastSentence.match(/unter|website|seite|portal|homepage|webseite/i)) {
        // Extrahiere den Domainnamen ohne www. und .de/.com etc.
        const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
        if (domainMatch && domainMatch[1]) {
          const domain = domainMatch[1].split('.')[0]; // Erster Teil der Domain
          title = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Webseite';
        }
      }
      // Wenn der Link in einem Kontext mit Wohngeld oder ähnlichen Begriffen steht
      else if (text.match(/wohngeld|mietzuschuss|lastenzuschuss/i)) {
        title = 'Wohngeld-Informationen';
      }
      
      links.push({ url, title });
    }
  } catch (error) {
    console.error("Fehler beim Extrahieren von Links:", error);
  }
  
  return links;
}; 