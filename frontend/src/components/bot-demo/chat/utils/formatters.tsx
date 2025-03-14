import React from 'react';
import { ExternalLink, Mail, Globe } from 'lucide-react';
import { LinkItem } from './types';
import { formatTextWithBold } from './formatting';

/**
 * Bereinigt URLs von Leerzeichen und anderen Problemen
 */
const cleanupUrl = (url: string): string => {
  if (!url) return '';
  
  // Leerzeichen in URLs entfernen
  let cleanUrl = url.replace(/\s+/g, '');
  
  // Klammern und andere Formatierungen entfernen
  cleanUrl = cleanUrl.replace(/^\(|\)$|\[$|\]$|\*\*|\*/g, '');
  
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
 * Extrahiert einen menschenlesbaren Domain-Namen aus einer URL
 */
const getDomainLabel = (url: string): string => {
  try {
    if (url.startsWith('mailto:')) {
      return url.replace('mailto:', '');
    }
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    // Für bekannte Domains bessere Labels zurückgeben
    if (hostname.includes('brandenburg')) return 'brandenburg.de';
    if (hostname.includes('berlin')) return 'berlin.de';
    
    return hostname;
  } catch (e) {
    // Fallback für nicht-URL Formate
    return url;
  }
};

/**
 * Erstellt ein einheitliches Link-Element mit konsistentem Styling
 */
const createLinkElement = (url: string, text: string, key: string): JSX.Element => {
  const cleanUrl = cleanupUrl(url);
  const isEmail = cleanUrl.startsWith('mailto:');
  const domainLabel = getDomainLabel(cleanUrl);
  
  // Wenn kein Text gegeben ist, Domain als Text verwenden
  const displayText = text || domainLabel;
  
  // E-Mail-Links anders als Web-Links darstellen
  if (isEmail) {
    return (
      <a 
        key={key} 
        href={cleanUrl} 
        className="text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 hover:underline dark:text-purple-400"
      >
        <Mail className="h-3.5 w-3.5 mr-0.5" />
        {displayText}
      </a>
    );
  } else {
    return (
      <a 
        key={key} 
        href={cleanUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        aria-label={`${displayText} - Öffnet in einem neuen Tab`}
      >
        {displayText}
        <ExternalLink className="h-3 w-3 ml-0.5" />
      </a>
    );
  }
};

/**
 * Formatiert Text und ersetzt Links mit anklickbaren Elementen.
 * Umfassende und robuste Erkennung verschiedener Link-Formate.
 */
export const formatTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return null;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Umfassende Muster für verschiedene Link-Typen
  const patterns = [
    // Markdown-Links: [text](url)
    {
      regex: /\[(.*?)\]\s*\(\s*((?:https?:\/\/|www\.|mailto:)[^\s)]+)\s*\)/g,
      process: (match: RegExpExecArray) => {
        const linkText = match[1].trim();
        const url = cleanupUrl(match[2]);
        
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + match[0].length;
        
        return createLinkElement(url, linkText, `md-${match.index}`);
      }
    },
    
    // URLs in eckigen Klammern: [url]
    {
      regex: /\[\s*((?:https?:\/\/|www\.)[^\s\]]+)\s*\]/g,
      process: (match: RegExpExecArray) => {
        const url = cleanupUrl(match[1]);
        
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + match[0].length;
        
        return createLinkElement(url, '', `brack-${match.index}`);
      }
    },
    
    // URLs in runden Klammern: (url)
    {
      regex: /\(\s*((?:https?:\/\/|www\.)[^\s)]+)\s*\)/g,
      process: (match: RegExpExecArray) => {
        const url = cleanupUrl(match[1]);
        
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + match[0].length;
        
        return createLinkElement(url, '', `paren-${match.index}`);
      }
    },
    
    // URLs in Schlüssel-Wert-Paaren: "Website: https://..."
    {
      regex: /\b(Website|Webseite|E-Mail|Homepage|URL|Link):\s+((?:https?:\/\/|www\.|mailto:)[^\s\n]+)/gi,
      process: (match: RegExpExecArray) => {
        const label = match[1];
        const url = cleanupUrl(match[2]);
        
        // Nur die URL ersetzen, nicht das Label
        parts.push(text.substring(lastIndex, match.index + label.length + 1)); // +1 für den Doppelpunkt
        
        // Finde den Abstand nach dem Doppelpunkt
        const colonPos = match.index + label.length;
        const afterColonSpace = text.substring(colonPos, colonPos + 2).replace(':', '').length;
        
        lastIndex = match.index + label.length + 1 + afterColonSpace + match[2].length;
        
        // Erstelle einen aussagekräftigeren Text für den Link
        const linkText = label.toLowerCase() === 'e-mail' ? url.replace('mailto:', '') : '';
        return createLinkElement(url, linkText, `kv-${match.index}`);
      }
    },
    
    // E-Mail-Adressen: name@domain.com
    {
      regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      process: (match: RegExpExecArray) => {
        const email = match[1];
        
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + email.length;
        
        return createLinkElement(`mailto:${email}`, email, `email-${match.index}`);
      }
    },
    
    // Einfache URLs im Text: https://example.com oder www.example.com
    {
      regex: /\b(?<!["\][(])((?:https?:\/\/|www\.)[^\s"'<>(),;]+)/g,
      process: (match: RegExpExecArray) => {
        const url = cleanupUrl(match[1]);
        
        parts.push(text.substring(lastIndex, match.index));
        lastIndex = match.index + match[1].length;
        
        return createLinkElement(url, '', `plain-${match.index}`);
      }
    }
  ];
  
  // Alle Patterns durchlaufen
  patterns.forEach(pattern => {
    let match;
    pattern.regex.lastIndex = 0; // Regex-Index zurücksetzen
    
    while ((match = pattern.regex.exec(text)) !== null) {
      const processedNode = pattern.process(match);
      if (processedNode) {
        parts.push(processedNode);
      }
    }
  });
  
  // Restlichen Text hinzufügen
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

/**
 * Formatiert Text mit fetten Passagen als React-Elemente.
 * Verarbeitet auch Links innerhalb des fettgedruckten Textes.
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