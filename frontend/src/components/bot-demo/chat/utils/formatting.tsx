import React from 'react';
import { LinkItem, StructuredContent } from './types';
import { extractLinks } from './extraction';
import { detectStructuredContent } from './detection';

/**
 * Formatiert Text und ersetzt Links und Paragraphen.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text als React-Element
 */
export const formatText = (text: string): React.ReactNode => {
  // Keine Formatierung für leeren Text
  if (!text) return null;

  // Zeilen aufteilen
  const paragraphs = text.split('\n\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    // Prüfen, ob es sich um eine Überschrift handelt
    if (paragraph.startsWith('#')) {
      const headingMatch = paragraph.match(/^(#+)\s+(.+)$/);
      if (headingMatch) {
        const headingLevel = headingMatch[1].length;
        const headingText = headingMatch[2];
        
        switch (headingLevel) {
          case 1:
            return <h1 key={pIndex} className="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">{headingText}</h1>;
          case 2:
            return <h2 key={pIndex} className="text-lg font-bold mt-3 mb-2 text-gray-800 dark:text-gray-100">{headingText}</h2>;
          case 3:
            return <h3 key={pIndex} className="text-base font-bold mt-2 mb-1 text-gray-800 dark:text-gray-100">{headingText}</h3>;
          default:
            return <h4 key={pIndex} className="text-sm font-bold mt-2 mb-1 text-gray-800 dark:text-gray-100">{headingText}</h4>;
        }
      }
    }
    
    // Liste erkennen (mit Aufzählungszeichen)
    if (paragraph.split('\n').filter(Boolean).every(line => line.trimStart().startsWith('-') || line.trimStart().startsWith('*'))) {
      const items = paragraph.split('\n').filter(Boolean).map(line => {
        const trimmedLine = line.trimStart().substring(1).trimStart();
        return formatTextWithLinks(trimmedLine);
      });
      
      return (
        <ul key={pIndex} className="list-disc list-inside mt-1 mb-2">
          {items.map((item, i) => (
            <li key={i} className="my-1">{item}</li>
          ))}
        </ul>
      );
    }
    
    // Nummerierte Liste erkennen
    if (paragraph.split('\n').filter(Boolean).every(line => {
      const match = line.match(/^\s*\d+\.\s/);
      return match !== null;
    })) {
      const items = paragraph.split('\n').filter(Boolean).map(line => {
        const num = line.match(/^\d+/)?.[0] || "";
        const trimmedLine = line.slice(num.length + 2).trimStart();
        return {
          number: num,
          content: formatTextWithLinks(trimmedLine)
        };
      });
      
      return (
        <ol key={pIndex} className="list-decimal list-inside mt-1 mb-2">
          {items.map((item, i) => (
            <li key={i} className="my-1">{item.content}</li>
          ))}
        </ol>
      );
    }
    
    // Normale Zeilen mit Zeilenumbrüchen innerhalb eines Paragraphen
    const lines = paragraph.split('\n');
    
    return (
      <p key={pIndex} className="mt-1 mb-2">
        {lines.map((line, lIndex) => (
          <React.Fragment key={lIndex}>
            {lIndex > 0 && <br />}
            {formatTextWithLinks(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
};

/**
 * Formatiert Text und ersetzt Links mit anklickbaren Elementen.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text mit Links als React-Elemente
 */
export const formatTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // URLs erkennen (http/https/www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  // Text in Teile zerlegen: normaler Text und Links
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  // Zusammenfügen der Teile mit formatierten Links
  return parts.reduce((result: React.ReactNode[], part, i) => {
    result.push(<React.Fragment key={`text-${i}`}>{part}</React.Fragment>);
    
    if (matches[i]) {
      let href = matches[i];
      if (href.startsWith('www.')) {
        href = `https://${href}`;
      }
      
      result.push(
        <a 
          key={`link-${i}`} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {matches[i]}
        </a>
      );
    }
    
    return result;
  }, []);
};

/**
 * Formatiert Text und hebt Wörter zwischen ** hervor.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text mit hervorgehobenen Wörtern
 */
export const formatTextWithBold = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Text zwischen ** erkennen
  const boldRegex = /\*\*(.*?)\*\*/g;
  
  // Text in Teile zerlegen: normaler Text und fettgedruckte Teile
  const parts = text.split(boldRegex);
  const matches = text.match(boldRegex) || [];
  
  // Zusammenfügen der Teile mit formatierten, fettgedruckten Texten
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, i) => {
    // Normalen Text hinzufügen
    if (part) {
      // Links im normalen Text formatieren
      result.push(formatTextWithLinks(part));
    }
    
    // Fettgedruckten Text hinzufügen, wenn vorhanden
    if (matches[i]) {
      const boldText = matches[i].slice(2, -2); // ** entfernen
      result.push(
        <strong key={`bold-${i}`} className="font-bold">
          {formatTextWithLinks(boldText)}
        </strong>
      );
    }
  });
  
  return <>{result}</>;
};

// Funktion zur Formatierung von Text mit Links und Absätzen
export const formatTextWithBoldTitle = (
  text: string, 
  renderNumberedList: (
    sections: any[], 
    introText: string, 
    links: LinkItem[]
  ) => React.ReactNode,
  renderBulletedList: (
    sections: any[],
    introText: string,
    links: LinkItem[]
  ) => React.ReactNode,
  renderSimpleText: (
    text: string,
    links: LinkItem[]
  ) => React.ReactNode,
  renderScreenshotFormat: (
    sections: any[],
    introText: string,
    links: LinkItem[]
  ) => React.ReactNode
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
    // Fallback bei Fehler - einfacher Text
    return <p className="text-sm whitespace-pre-wrap">{text}</p>;
  }
}; 