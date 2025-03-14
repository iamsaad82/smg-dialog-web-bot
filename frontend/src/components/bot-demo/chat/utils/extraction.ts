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

/**
 * Bereinigt eine URL von Leerzeichen und fügt ggf. ein Protokoll hinzu
 */
const cleanupUrl = (url: string): string => {
  if (!url) return '';
  
  // Leerzeichen in URLs entfernen
  let cleanUrl = url.replace(/\s+/g, '');
  
  // Klammern am Anfang und Ende entfernen
  cleanUrl = cleanUrl.replace(/^\(|\)$|\[$|\]$/g, '');
  
  // Sicherstellen, dass www.-URLs ein Protokoll haben
  if (cleanUrl.startsWith('www.') && !cleanUrl.startsWith('http')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  return cleanUrl;
};

/**
 * Generiert einen aussagekräftigen Titel für einen Link
 */
const generateLinkTitle = (url: string, context: string = ''): string => {
  try {
    // Domänenbasierten Titel erstellen
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const domainParts = domain.split('.');
    
    // Bekannte Domains
    if (domain.includes('brandenburg')) {
      if (context.toLowerCase().includes('schule') || context.toLowerCase().includes('gymnasium')) {
        return 'Schulwebseite Brandenburg';
      } else if (context.toLowerCase().includes('wohngeld')) {
        return 'Wohngeld Brandenburg';
      } else {
        return 'Brandenburg Informationen';
      }
    }
    
    // Standard-Titel basierend auf Domain
    const readableDomain = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
    return `${readableDomain} Webseite`;
  } catch (e) {
    // Fallback-Titel
    return 'Webseite';
  }
};

// Extrahiert Links aus dem Text
export const extractLinks = (text: string): LinkItem[] => {
  const links: LinkItem[] = [];
  
  try {
    // Pattern zum Erkennen von URLs (mit und ohne Protokoll)
    const urlPattern = '(?:https?:\\/\\/|www\\.)[^\\s\\]\\)>"\']+'
    
    // 1. Erkennung von Links in Schlüssel-Wert-Paaren (z.B. "Website: https://...")
    const keyValueLinkRegex = new RegExp(`(Website|E-Mail|Homepage|Webseite|URL|Link):\\s*(${urlPattern})`, 'gi');
    let keyValueMatch;
    
    while ((keyValueMatch = keyValueLinkRegex.exec(text)) !== null) {
      if (keyValueMatch[2]) {
        const url = cleanupUrl(keyValueMatch[2]);
        
        // Prüfen, ob dieser Link bereits erkannt wurde
        if (!links.some(link => link.url === url)) {
          // Titel basierend auf dem Label generieren
          let title = 'Webseite';
          
          switch (keyValueMatch[1].toLowerCase()) {
            case 'website':
            case 'webseite':
            case 'homepage':
            case 'url':
              title = text.toLowerCase().includes('schule') ? 'Schulwebseite' : 'Offizielle Webseite';
              break;
            case 'e-mail':
              title = 'E-Mail-Kontakt';
              break;
            case 'link':
              title = generateLinkTitle(url, text);
              break;
          }
          
          links.push({ url, title });
        }
      }
    }
    
    // 2. Erkennung von Markdown-Links: [text](url)
    const markdownLinkRegex = new RegExp(`\\[(.*?)\\]\\s*\\(\\s*(${urlPattern})\\s*\\)`, 'g');
    let markdownMatch;
    
    while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
      const linkText = markdownMatch[1].trim();
      const url = cleanupUrl(markdownMatch[2]);
      
      // Nur hinzufügen, wenn der Link noch nicht vorhanden ist
      if (!links.some(link => link.url === url)) {
        links.push({ 
          url, 
          title: linkText || generateLinkTitle(url, text) 
        });
      }
    }
    
    // 3. Erkennung von URLs in eckigen Klammern: [url]
    const bracketLinkRegex = new RegExp(`\\[\\s*(${urlPattern})\\s*\\]`, 'g');
    let bracketMatch;
    
    while ((bracketMatch = bracketLinkRegex.exec(text)) !== null) {
      const url = cleanupUrl(bracketMatch[1]);
      
      // Nur hinzufügen, wenn der Link noch nicht vorhanden ist
      if (!links.some(link => link.url === url)) {
        links.push({ 
          url, 
          title: generateLinkTitle(url, text) 
        });
      }
    }
    
    // 4. Erkennung von URLs in runden Klammern: (url)
    const parenLinkRegex = new RegExp(`\\(\\s*(${urlPattern})\\s*\\)`, 'g');
    let parenMatch;
    
    while ((parenMatch = parenLinkRegex.exec(text)) !== null) {
      const url = cleanupUrl(parenMatch[1]);
      
      // Nur hinzufügen, wenn der Link noch nicht vorhanden ist
      if (!links.some(link => link.url === url)) {
        links.push({ 
          url, 
          title: generateLinkTitle(url, text) 
        });
      }
    }
    
    // 5. Erkennung von einfachen URLs im Text
    const plainUrlRegex = new RegExp(`(?<![\\]\\(])\\b(${urlPattern})\\b`, 'g');
    let plainMatch;
    
    while ((plainMatch = plainUrlRegex.exec(text)) !== null) {
      const url = cleanupUrl(plainMatch[1]);
      
      // Nur hinzufügen, wenn der Link noch nicht vorhanden ist
      if (!links.some(link => link.url === url)) {
        links.push({ 
          url, 
          title: generateLinkTitle(url, text) 
        });
      }
    }
    
    return links;
  } catch (error) {
    console.error("Fehler beim Extrahieren von Links:", error);
    return [];
  }
}; 