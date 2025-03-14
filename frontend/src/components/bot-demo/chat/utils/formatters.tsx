import React from 'react';
import { LinkItem } from './types';
import { formatTextWithBold } from './formatting';

/**
 * Formatiert Text und ersetzt Links mit anklickbaren Elementen.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text mit Links als React-Elemente
 */
export const formatTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Vorverarbeitung: Leerzeichen in URLs entfernen und eckige Klammern bereinigen
  let preprocessedText = text;
  
  // Spezialfall: Link im Format [URL](URL) behandeln
  preprocessedText = preprocessedText.replace(
    /\[\s*(https?:\/\/[^\s\]]+)\s*\]\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g, 
    (_, url1, url2) => {
      const cleanUrl1 = url1.replace(/\s+/g, '');
      const cleanUrl2 = url2.replace(/\s+/g, '');
      return `<a href="${cleanUrl2}">${cleanUrl1}</a>`;
    }
  );
  
  // Leerzeichen in allen URLs entfernen
  preprocessedText = preprocessedText.replace(
    /(https?:\/\/[^\s<>"']+)/g, 
    (match) => match.replace(/\s+/g, '')
  );
  
  // Behandlung von Markdown-Links [text](url)
  const markdownLinkRegex = /\[(.*?)\]\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g;
  let lastIndex = 0;
  const result: React.ReactNode[] = [];
  let match;
  
  // HTML-Tags temporär ersetzen
  preprocessedText = preprocessedText.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
    return `[${text}](${url})`;
  });
  
  // Markdown-Links verarbeiten
  while ((match = markdownLinkRegex.exec(preprocessedText)) !== null) {
    // Text bis zum aktuellen Match hinzufügen
    if (match.index > lastIndex) {
      result.push(preprocessedText.substring(lastIndex, match.index));
    }
    
    // Link-Text und URL extrahieren
    const [fullMatch, linkText, url] = match;
    const cleanUrl = url.replace(/\s+/g, ''); // Sicherstellen, dass keine Leerzeichen in der URL sind
    
    // Link-Element erstellen
    result.push(
      <a 
        key={`mdlink-${match.index}`} 
        href={cleanUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline hover:opacity-90 dark:text-blue-400 dark:hover:text-blue-300"
        aria-label={`${linkText} - Öffnet in einem neuen Tab`}
      >
        {linkText}
      </a>
    );
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Restlichen Text verarbeiten - insbesondere für einfache URLs
  if (lastIndex < preprocessedText.length) {
    const plainText = preprocessedText.substring(lastIndex);
    
    // Erkennung von URLs mit und ohne eckige Klammern
    const plainUrlRegex = /(?:\[(https?:\/\/[^\s\]]+)\])|(?<!\]\()(https?:\/\/[^\s\)\]"',<>]+)/g;
    
    let plainLastIndex = 0;
    let plainMatch;
    const plainResult: React.ReactNode[] = [];
    
    while ((plainMatch = plainUrlRegex.exec(plainText)) !== null) {
      // Text bis zum aktuellen Match hinzufügen
      if (plainMatch.index > plainLastIndex) {
        plainResult.push(plainText.substring(plainLastIndex, plainMatch.index));
      }
      
      // URL extrahieren (entweder aus den Klammern oder direkt)
      const url = (plainMatch[1] || plainMatch[0]).replace(/\s+/g, '');
      
      // Link-Element erstellen
      plainResult.push(
        <a 
          key={`plainlink-${plainMatch.index}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 underline hover:opacity-90 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={`Externer Link - Öffnet in einem neuen Tab`}
        >
          {url}
        </a>
      );
      
      plainLastIndex = plainMatch.index + plainMatch[0].length;
    }
    
    // Restlichen Text hinzufügen
    if (plainLastIndex < plainText.length) {
      plainResult.push(plainText.substring(plainLastIndex));
    }
    
    result.push(...plainResult);
  }
  
  return result.length === 0 ? preprocessedText : result;
};

/**
 * Formatiert Text mit fetten Passagen als React-Elemente.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text mit fetten Elementen
 */
export const formatTextWithBoldReact = (text: string): React.ReactNode => {
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