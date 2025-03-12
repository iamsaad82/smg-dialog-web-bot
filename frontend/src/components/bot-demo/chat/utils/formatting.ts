import { LinkItem, StructuredContent } from './types';
import { extractLinks } from './extraction';
import { detectStructuredContent } from './detection';

/**
 * Formatiert Text und hebt Wörter zwischen ** hervor.
 * @param text Der zu formatierende Text
 */
export const formatTextWithBold = (text: string): string => {
  if (!text) return '';
  
  // Text zwischen ** ersetzen
  return text.replace(/\*\*(.*?)\*\*/g, (_, match) => `<strong>${match}</strong>`);
};

/**
 * Funktion zur Formatierung von Text mit Links und Absätzen
 */
export const formatTextWithBoldTitle = (
  text: string, 
  renderNumberedList: (
    sections: any[], 
    introText: string, 
    links: LinkItem[]
  ) => any,
  renderBulletedList: (
    sections: any[],
    introText: string,
    links: LinkItem[]
  ) => any,
  renderSimpleText: (
    text: string,
    links: LinkItem[]
  ) => any,
  renderScreenshotFormat: (
    sections: any[],
    introText: string,
    links: LinkItem[]
  ) => any
) => {
  if (!text) return null;
  
  try {
    // Zeilenumbrüche standardisieren
    text = text.replace(/\r\n/g, '\n');
    
    // Links erkennen und sammeln
    const links = extractLinks(text);
    const linkUrls = links.map(link => link.url);
    
    // Links aus dem Text entfernen für saubere Anzeige
    const textWithoutLinks = text.replace(/(https?:\/\/[^\s]+)/g, '');
    
    // Prüfe direkt auf das Format aus dem Screenshot (mit Nummer und fettgedrucktem Titel)
    const listWithBoldTitlesRegex = /\d+\.\s+\*\*[^*]+\*\*/;
    const hasScreenshotFormat = listWithBoldTitlesRegex.test(textWithoutLinks);
    
    // Erkenne strukturierte Inhalte
    const structuredContent = detectStructuredContent(textWithoutLinks);
    
    // Spezialfall: Format wie im Screenshot (nummerierte Cards mit blauem Kreis)
    if (hasScreenshotFormat && structuredContent.type === 'numbered' && structuredContent.sections.length > 0) {
      // Finde den Einleitungstext
      let introText = '';
      try {
        const introRegex = /^([\s\S]*?)(?=\d+\.\s+\*\*)/;
        const introMatch = textWithoutLinks.match(introRegex);
        introText = introMatch && introMatch[1] ? introMatch[1].trim() : '';
      } catch (e) {
        const firstNumberPos = textWithoutLinks.search(/\d+\.\s+\*\*/);
        introText = firstNumberPos > 0 ? textWithoutLinks.substring(0, firstNumberPos).trim() : '';
      }
      
      return renderScreenshotFormat(structuredContent.sections, introText, links);
    }
    
    // Bei normalen nummerierten Listen
    if (structuredContent.type === 'numbered' && structuredContent.sections.length > 0) {
      // Finde den Einleitungstext
      let introText = '';
      try {
        const firstSection = structuredContent.sections[0];
        const pattern = new RegExp(`\\d+[\.)]\\s*${firstSection.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
        const parts = textWithoutLinks.split(pattern);
        introText = parts[0].trim();
      } catch (e) {
        // Fallback, falls RegEx schlägt fehl
        const firstNumberPos = textWithoutLinks.search(/\d+[\.)](\s+|\s*\*\*)/);
        introText = firstNumberPos > 0 ? textWithoutLinks.substring(0, firstNumberPos).trim() : '';
      }
      
      return renderNumberedList(structuredContent.sections, introText, links);
    }
    
    // Bei Aufzählungslisten und Abschnitten mit Titeln
    if (structuredContent.type === 'bulleted' && structuredContent.sections.length > 0) {
      // Extrahiere den Einleitungstext - alles vor dem ersten identifizierten Abschnitt
      let introText = '';
      const firstSectionWithTitle = structuredContent.sections.find(s => s.title);
      
      if (firstSectionWithTitle && firstSectionWithTitle.title) {
        const parts = textWithoutLinks.split(new RegExp(`${firstSectionWithTitle.title}[:\\s]`));
        if (parts.length > 1) {
          introText = parts[0].trim();
        }
      } else {
        // Wenn kein Titel gefunden wurde, verwende den ersten Absatz
        introText = textWithoutLinks.split('\n\n')[0];
      }
      
      return renderBulletedList(structuredContent.sections, introText, links);
    }
    
    // Einfacher Text ohne erkannte Struktur
    return renderSimpleText(textWithoutLinks, links);
  } catch (error) {
    console.error("Fehler bei der Textformatierung:", error);
    return null;
  }
}; 