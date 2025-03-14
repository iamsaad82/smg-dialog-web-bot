import React from 'react';
import { ExternalLink } from 'lucide-react';
import { LinkItem } from './types';
import { formatTextWithBold } from './formatting';

/**
 * Bereinigt URLs von Leerzeichen und anderen Problemen
 */
const cleanupUrl = (url: string): string => {
  if (!url) return '';
  
  // Leerzeichen in URLs entfernen
  let cleanUrl = url.replace(/\s+/g, '');
  
  // Klammern am Anfang und Ende entfernen
  cleanUrl = cleanUrl.replace(/^\(|\)$|\[$|\]$/g, '');
  
  // Sicherstellen, dass www. URLs ein Protokoll haben
  if (cleanUrl.startsWith('www.') && !cleanUrl.startsWith('http')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  // Sicherstellen, dass E-Mail-Adressen ein mailto: Präfix haben
  if (cleanUrl.includes('@') && !cleanUrl.startsWith('mailto:')) {
    cleanUrl = 'mailto:' + cleanUrl;
  }
  
  return cleanUrl;
};

/**
 * Gibt einen lesbaren Domainnamen zurück
 */
const getDomainLabel = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (url.startsWith('mailto:')) {
      return url.replace('mailto:', '');
    }
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

/**
 * Erzeugt ein Link-Element mit konsistentem Stil
 */
const createLinkElement = (url: string, text: string, key: string): JSX.Element => {
  const cleanUrl = cleanupUrl(url);
  const isEmail = cleanUrl.startsWith('mailto:');
  
  return (
    <a 
      key={key} 
      href={cleanUrl} 
      target={isEmail ? '_self' : '_blank'} 
      rel={isEmail ? undefined : 'noopener noreferrer'}
      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
      aria-label={isEmail ? `E-Mail an ${text}` : `${text} - Öffnet in einem neuen Tab`}
    >
      {text}
      {!isEmail && <ExternalLink className="h-3 w-3 ml-0.5" />}
    </a>
  );
};

/**
 * Formatiert Text und ersetzt Links mit anklickbaren Elementen.
 * @param text Der zu formatierende Text
 * @returns Formatierter Text mit Links als React-Elemente
 */
export const formatTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Vorverarbeitung: Leerzeichen in URLs entfernen und eckige Klammern bereinigen
  let preprocessedText = text;
  
  // HTML-Tags temporär ersetzen
  preprocessedText = preprocessedText.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
    return `[${text}](${url})`;
  });
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Pattern zum Erkennen verschiedener Link-Typen
  const patterns = [
    // Markdown-Links: [text](url)
    {
      regex: /\[(.*?)\]\s*\(\s*((?:https?:\/\/|www\.|mailto:)[^\s)]+(?:\s+[^\s)]+)*)\s*\)/g,
      process: (match: RegExpExecArray) => {
        const linkText = match[1].trim() || getDomainLabel(match[2]);
        return createLinkElement(match[2], linkText, `md-${match.index}`);
      }
    },
    // URLs in Schlüssel-Wert-Paaren: "Website: https://..."
    {
      regex: /(Website|E-Mail|Homepage|Webseite|URL|Link):\s+((?:https?:\/\/|www\.|mailto:)[^\s\n]+(?:\s+[^\s\n]+)*)/gi,
      process: (match: RegExpExecArray) => {
        const label = match[1];
        const url = match[2];
        // Nur die URL ersetzen, nicht das Label
        parts.push(text.substring(lastIndex, match.index + label.length + 2)); // +2 für ": "
        lastIndex = match.index + label.length + 2 + url.length;
        return createLinkElement(url, getDomainLabel(url), `kv-${match.index}`);
      }
    },
    // E-Mail-Adressen: name@domain.com
    {
      regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      process: (match: RegExpExecArray) => {
        return createLinkElement(`mailto:${match[1]}`, match[1], `email-${match.index}`);
      }
    },
    // URLs in eckigen oder runden Klammern: [url] oder (url)
    {
      regex: /[\[\(]\s*((?:https?:\/\/|www\.)[^\s\]\)]+(?:\s+[^\s\]\)]+)*)\s*[\]\)]/g,
      process: (match: RegExpExecArray) => {
        const url = match[1];
        const fullMatch = match[0];
        // Ersetze die gesamte Klammer-Struktur durch den Link
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + fullMatch.length;
        return createLinkElement(url, getDomainLabel(url), `bracket-${match.index}`);
      }
    },
    // Einfache URLs im Text: https://example.com oder www.example.com
    {
      regex: /(?<!["\][(])\b((?:https?:\/\/|www\.)[^\s"'<>(),;]+)/g,
      process: (match: RegExpExecArray) => {
        return createLinkElement(match[1], getDomainLabel(match[1]), `plain-${match.index}`);
      }
    }
  ];
  
  // Alle Patterns durchlaufen und Links ersetzen
  patterns.forEach(pattern => {
    let match;
    // Regex zurücksetzen für jeden Pattern-Typ
    pattern.regex.lastIndex = 0;
    
    while ((match = pattern.regex.exec(preprocessedText)) !== null) {
      // Text bis zum aktuellen Match hinzufügen (nur wenn es sich nicht um ein Schlüssel-Wert-Paar handelt)
      if (pattern.regex.source.indexOf('Website|E-Mail') === -1) {
        parts.push(preprocessedText.substring(lastIndex, match.index));
      }
      
      // Link-Element erstellen und hinzufügen
      parts.push(pattern.process(match));
      
      // Nur den lastIndex aktualisieren, wenn es sich nicht um ein Schlüssel-Wert-Paar handelt
      if (pattern.regex.source.indexOf('Website|E-Mail') === -1) {
        lastIndex = match.index + match[0].length;
      }
    }
  });
  
  // Restlichen Text hinzufügen
  if (lastIndex < preprocessedText.length) {
    parts.push(preprocessedText.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : preprocessedText;
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