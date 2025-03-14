import React from 'react';
import { Bot, User } from "lucide-react";
import { InteractiveElement, InfoElement } from "@/types/interactive";
import { renderComponent } from "@/utils/component-registry";
import { 
  InfoComponent, 
  LinkCard, 
  LinkCardSlider, 
  StructuredContent, 
  NumberedStructuredContent, 
  NumberedCardContent 
} from './components';
import { 
  formatText,
  formatTextWithLinks,
  formatTextWithBoldReact as formatTextWithBold
} from './utils/formatters';
import { 
  formatTextWithBoldTitle 
} from './utils/formatting';
import { 
  ChatMessage, 
  StructuredContent as StructuredContentType,
  LinkItem
} from './utils/types';
import { detectStructuredContent } from './utils/detection';
import { extractLinks } from './utils/extraction';
import { renderFormattedContent } from './utils/rendering';

interface MessageItemProps {
  message: ChatMessage;
  primaryColor?: string;
  secondaryColor?: string;
}

export function MessageItem({ message, primaryColor, secondaryColor }: MessageItemProps) {
  // Verbesserte Hilfs-Funktion zur umfassenden URL-Bereinigung
  const cleanupUrls = (text: string): string => {
    if (!text) return '';
    
    // Bekannte Label-Typen, die URLs enthalten können
    const urlLabels = ['Website', 'Webseite', 'URL', 'Link', 'E-Mail', 'Homepage'];
    
    let cleaned = text;
    
    // 1. Umfassendere Erkennung von Doppelungen in strukturierten Daten
    // z.B. "Schulform: Schulform: Gymnasium" oder "Gymnasium - Gymnasium"
    const duplicatePattern = /\b(\w+[^:]*?)(?:\s*[-:]\s+\1|\s*[-:]\s+\**\1\**)\b/gi;
    cleaned = cleaned.replace(duplicatePattern, '$1');
    
    // 2. Bereinigen von Markdown-Links mit extremer Flexibilität
    cleaned = cleaned.replace(
      /\[\s*(.*?)\s*\]\s*\(\s*((?:https?:\/\/|www\.)[^\s)]+(?:[ \t-]+[^\s)]+)*)\s*\)/g, 
      (match, linkText, url) => {
        // Alle Leerzeichen und Bindestriche zwischen Protokoll und Domain-Teilen entfernen
        const cleanUrl = url.replace(/(\w+:\/\/|\w+\.)\s+/g, '$1')
                           .replace(/\s+\./g, '.')
                           .replace(/\s+-\s+/g, '-')
                           .replace(/(\w)-(\w)/g, '$1$2')
                           .replace(/\s+/g, '');
        return `[${linkText}](${cleanUrl})`;
      }
    );
    
    // 3. Besonders aggressive Bereinigung von URLs in eckigen oder runden Klammern
    cleaned = cleaned.replace(
      /[\[\(]\s*((?:https?:\/\/|www\.)[^\s\]\)]+(?:[ \t-]+[^\s\]\)]+)*)\s*[\]\)]/g, 
      (match, url) => {
        // Leerzeichen und Bindestriche in URLs entfernen
        const cleanUrl = url.replace(/(\w+:\/\/|\w+\.)\s+/g, '$1')
                           .replace(/\s+\./g, '.')
                           .replace(/\s+-\s+/g, '-')
                           .replace(/(\w)-(\w)/g, '$1$2')
                           .replace(/\s+/g, '');
        return match.charAt(0) + cleanUrl + match.charAt(match.length - 1);
      }
    );
    
    // 4. Bereinigen von URLs in Label-Kontext mit verbesserter Erkennung
    urlLabels.forEach(label => {
      const pattern = new RegExp(`(${label}):\\s*((?:https?:\/\/|www\.)[^\\s\\n<>"']+(?:[ \\t-]+[^\\s\\n<>"']+)*)`, 'gi');
      cleaned = cleaned.replace(pattern, (match, labelText, url) => {
        // Leerzeichen und Bindestriche in URLs entfernen
        const cleanUrl = url.replace(/(\w+:\/\/|\w+\.)\s+/g, '$1')
                           .replace(/\s+\./g, '.')
                           .replace(/\s+-\s+/g, '-')
                           .replace(/(\w)-(\w)/g, '$1$2')
                           .replace(/\s+/g, '');
        return `${labelText}: ${cleanUrl}`;
      });
    });
    
    // 5. Bereinigen einfacher URLs mit umfassenderer Erkennung
    cleaned = cleaned.replace(
      /(https?:\/\/[^\s"'<>]+(?:[ \t-]+[^\s"'<>]+)*)/g, 
      (match) => {
        return match.replace(/(\w+:\/\/|\w+\.)\s+/g, '$1')
                    .replace(/\s+\./g, '.')
                    .replace(/\s+-\s+/g, '-')
                    .replace(/(\w)-(\w)/g, '$1$2')
                    .replace(/\s+/g, '');
      }
    );
    
    // 6. Bereinigen von Website-URLs ohne http/https
    cleaned = cleaned.replace(
      /\b(www\.[^\s"'<>]+(?:[ \t-]+[^\s"'<>]+)*)/g,
      (match) => {
        return match.replace(/(\w+\.)\s+/g, '$1')
                    .replace(/\s+\./g, '.')
                    .replace(/\s+-\s+/g, '-')
                    .replace(/(\w)-(\w)/g, '$1$2')
                    .replace(/\s+/g, '');
      }
    );
    
    // 7. Sicherstellen, dass www.-URLs ein Protokoll haben
    cleaned = cleaned.replace(
      /\b(www\.[^\s"'<>]+)/g,
      (match) => {
        if (!match.startsWith('http')) {
          return 'https://' + match;
        }
        return match;
      }
    );
    
    // 8. Doppelte Doppelpunkte in strukturierten Daten entfernen
    const knownLabels = [
      'Schulform', 'Schultyp', 'Adresse', 'Telefon', 'E-Mail', 'Website', 
      'Schulname', 'Schulleitung', 'Träger', 'Öffnungszeiten', 'Kontakt',
      'Standort', 'Beschreibung', 'Information', 'Hinweis', 'Details',
      'Ganztags', 'Ganztagsschule'
    ];
    
    knownLabels.forEach(label => {
      const regex = new RegExp(`(${label}):\\s*${label}:\\s*`, 'gi');
      cleaned = cleaned.replace(regex, `$1: `);
    });
    
    // 9. "**" Markierungen bei URLs entfernen
    cleaned = cleaned.replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1');
    
    // 10. Intelligentere Erkennung strukturierter Daten
    // Bereinigen von Fällen wie "Schulform: ** Gymnasium"
    cleaned = cleaned.replace(/(\w+):\s*\*\*\s*([^*]+)/g, '$1: $2');
    
    // Bereinigen von Fällen mit doppelter Formatierung "**Schulform:** ..."
    cleaned = cleaned.replace(/\*\*([^:*]+):\*\*\s*/g, '$1: ');
    
    // 11. Spezifische Behandlung von Bindestrich-getrennten Schlüssel-Wert-Paaren
    // Erkennung: "- Schlüsselwort: Wert"
    cleaned = cleaned.replace(/\s+-\s+(\w+(?:\s+\w+)*):\s+/g, '\n$1: ');
    
    return cleaned;
  };
  
  // Sicherstellen, dass der Text getrimmt ist und URLs bereinigt sind
  const messageContent = message.content.trim();
  
  // Prüfen, ob der Inhalt strukturiert ist oder strukturierte Elemente enthält
  const containsStructuredInfo = messageContent.includes('###') || 
                               (messageContent.split('\n').filter(line => line.includes(':')).length >= 3) ||
                               messageContent.includes('Schulform:') || 
                               messageContent.includes('Gymnasium');
  
  // Für Assistenten-Nachrichten: URLs bereinigen, bevor sie an renderFormattedContent übergeben werden
  const cleanedContent = message.role === "assistant" ? cleanupUrls(messageContent) : messageContent;
  
  return (
    <div
      className={`flex items-start gap-2 ${
        message.role === "user" ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
          message.role === "assistant"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
        style={
          message.role === "assistant" && primaryColor
            ? { backgroundColor: primaryColor, color: secondaryColor }
            : {}
        }
      >
        {message.role === "assistant" ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div
        className={`rounded-lg p-0 ${
          message.role === "assistant" ? "max-w-[650px] w-fit" : "max-w-[85%]"
        } shadow-sm transition-all duration-200 hover:shadow-md ${
          message.role === "assistant"
            ? "bg-muted"
            : "bg-primary text-primary-foreground"
        }`}
        style={
          message.role === "user" && primaryColor
            ? { 
                backgroundColor: primaryColor, 
                color: secondaryColor,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)"
              }
            : {
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)"
              }
        }
      >
        <div className="px-3 py-2">
          {message.role === "assistant" ? (
            renderFormattedContent(cleanedContent)
          ) : (
            <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
          )}
          
          <p className="text-xs opacity-50 mt-2">{message.timestamp}</p>
        </div>
        
        {/* Interaktive Elemente anzeigen, falls vorhanden */}
        {message.interactiveElements && message.interactiveElements.length > 0 && (
          <div className="px-3 pb-2 pt-2 border-t border-gray-200 dark:border-gray-700 w-full">
            {message.interactiveElements.map((element, index) => (
              <div key={index} className="mt-1.5 text-sm w-full">
                {/* Info-Element mit expliziter Komponente rendern */}
                {element.type === 'info' ? (
                  <InfoComponent content={(element as InfoElement).content} />
                ) : (
                  /* Alle anderen Komponenten dynamisch aus der Registry laden */
                  <div className="w-full overflow-x-auto">
                    {renderComponent(
                      element, 
                      index,
                      primaryColor,
                      secondaryColor
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 