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
  const links: LinkItem[] = [];
  
  try {
    // Vorverarbeitung: Leerzeichen in URLs entfernen und spezielle Strukturen erkennen
    let processedText = text;
    
    // Spezialfall: Links in Schulinformationen erkennen (z.B. "Website: https://...")
    const schoolInfoLinkRegex = /(Website|E-Mail|Homepage|Webseite|URL):\s*((?:https?:\/\/|www\.)[^\s\n]+(?:\s+[^\s\n]+)*)/gi;
    let schoolInfoMatch;
    
    while ((schoolInfoMatch = schoolInfoLinkRegex.exec(text)) !== null) {
      if (schoolInfoMatch[2]) {
        // URL bereinigen (Leerzeichen entfernen)
        const url = schoolInfoMatch[2].replace(/\s+/g, '');
        const cleanUrl = url.startsWith('www.') && !url.startsWith('http') ? 'https://' + url : url;
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === cleanUrl)) {
          // Titel basierend auf dem Label generieren
          let title = 'Webseite';
          
          switch (schoolInfoMatch[1].toLowerCase()) {
            case 'website':
            case 'webseite':
            case 'homepage':
            case 'url':
              title = 'Schulwebseite';
              break;
            case 'e-mail':
              title = 'E-Mail-Kontakt';
              break;
          }
          
          links.push({ url: cleanUrl, title });
        }
      }
    }
    
    // Spezialfall: Links im Format [URL](URL) erkennen
    const markdownSelfLinkRegex = /\[\s*((?:https?:\/\/|www\.)[^\s\]]+(?:\s+[^\s\]]+)*)\s*\]\s*\(\s*((?:https?:\/\/|www\.)[^\s)]+(?:\s+[^\s)]+)*)\s*\)/g;
    let selfLinkMatch;
    
    while ((selfLinkMatch = markdownSelfLinkRegex.exec(text)) !== null) {
      if (selfLinkMatch[1] && selfLinkMatch[2]) {
        // URLs bereinigen (Leerzeichen entfernen)
        const displayUrl = selfLinkMatch[1].replace(/\s+/g, '');
        const targetUrl = selfLinkMatch[2].replace(/\s+/g, '');
        
        // Protokoll hinzufügen, falls nötig
        const cleanUrl = targetUrl.startsWith('www.') && !targetUrl.startsWith('http') 
          ? 'https://' + targetUrl 
          : targetUrl;
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === cleanUrl)) {
          // Titel generieren
          let title = 'Link';
          
          // Kontextbasierte Titel-Extraktion
          if (text.toLowerCase().includes('wohngeld') && cleanUrl.includes('brandenburg')) {
            title = 'Wohngeld-Informationen Brandenburg';
          } else if (cleanUrl.includes('stadt-brandenburg')) {
            title = 'Stadt Brandenburg Dienstleistung';
          } else if (text.toLowerCase().includes('schule') && cleanUrl.includes('brandenburg')) {
            title = 'Schulinformationen Brandenburg';
          } else {
            // Domain als Titel verwenden
            try {
              const domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
              title = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Webseite';
            } catch (e) {
              // Fallback-Titel
              title = 'Externe Webseite';
            }
          }
          
          links.push({ url: cleanUrl, title });
        }
      }
    }
    
    // Links in eckigen Klammern erkennen: [https://example.com]
    const bracketLinkRegex = /\[\s*((?:https?:\/\/|www\.)[^\s\]]+(?:\s+[^\s\]]+)*)\s*\]/g;
    let bracketMatch;
    
    while ((bracketMatch = bracketLinkRegex.exec(text)) !== null) {
      if (bracketMatch[1]) {
        const url = bracketMatch[1].replace(/\s+/g, '');
        const cleanUrl = url.startsWith('www.') && !url.startsWith('http') ? 'https://' + url : url;
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === cleanUrl)) {
          // Titel generieren
          let title = 'Link';
          
          // Kontextbasierte Titel-Extraktion
          if (text.toLowerCase().includes('wohngeld') && cleanUrl.includes('brandenburg')) {
            title = 'Wohngeld-Informationen Brandenburg';
          } else if (cleanUrl.includes('stadt-brandenburg')) {
            title = 'Stadt Brandenburg Dienstleistung';
          } else if (text.toLowerCase().includes('schule') && cleanUrl.includes('brandenburg')) {
            title = 'Schulinformationen Brandenburg';
          } else {
            // Domain als Titel verwenden
            try {
              const domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
              title = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Webseite';
            } catch (e) {
              // Fallback-Titel
              title = 'Externe Webseite';
            }
          }
          
          links.push({ url: cleanUrl, title });
        }
      }
    }
    
    // Normale Markdown-Links erkennen: [text](url)
    const markdownLinkRegex = /\[(.*?)\]\s*\(\s*((?:https?:\/\/|www\.)[^\s)]+(?:\s+[^\s)]+)*)\s*\)/g;
    let markdownMatch;
    
    while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
      // Wenn es kein Selbst-Link ist (bereits oben behandelt)
      if (markdownMatch[1] && markdownMatch[2] && !markdownMatch[1].startsWith('http')) {
        const url = markdownMatch[2].replace(/\s+/g, '');
        const cleanUrl = url.startsWith('www.') && !url.startsWith('http') ? 'https://' + url : url;
        
        // Link-Text als Titel verwenden
        const title = markdownMatch[1].trim() || 'Link';
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === cleanUrl)) {
          links.push({ url: cleanUrl, title });
        }
      }
    }
    
    // Einfache URLs ohne Markdown-Formatierung erkennen
    const plainUrlRegex = /(?<!\]\()((?:https?:\/\/|www\.)[^\s\)\]"',<>]+(?:\s+[^\s\)\]"',<>]+)*)/g;
    let urlMatch;
    
    while ((urlMatch = plainUrlRegex.exec(text)) !== null) {
      if (urlMatch[0]) {
        const url = urlMatch[0].replace(/\s+/g, '');
        const cleanUrl = url.startsWith('www.') && !url.startsWith('http') ? 'https://' + url : url;
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === cleanUrl)) {
          // Versuchen, einen aussagekräftigen Titel zu extrahieren
          let title = `Link ${links.length + 1}`;
          
          // Kontextbasierte Titel-Extraktion
          if (text.toLowerCase().includes('wohngeld') && cleanUrl.includes('brandenburg')) {
            title = 'Wohngeld-Informationen Brandenburg';
          } else if (cleanUrl.includes('stadt-brandenburg')) {
            title = 'Stadt Brandenburg Dienstleistung';
          } else if (text.toLowerCase().includes('schule') && cleanUrl.includes('brandenburg')) {
            title = 'Schulinformationen Brandenburg';
          } else {
            // Domain als Titel verwenden
            try {
              const domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
              title = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Webseite';
            } catch (e) {
              // Fallback-Titel
              title = 'Externe Webseite';
            }
          }
          
          links.push({ url: cleanUrl, title });
        }
      }
    }
    
    // Normalisieren der URLs (sicherstellen, dass keine Leerzeichen enthalten sind)
    return links.map(link => ({
      url: link.url.replace(/\s+/g, ''), // Leerzeichen in URLs entfernen
      title: link.title
    }));
  } catch (error) {
    console.error("Fehler beim Extrahieren von Links:", error);
    return [];
  }
}; 