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
  // Sicherstellen, dass der Text getrimmt ist und URLs bereinigt sind
  const messageContent = message.content.trim();
  
  // Hilfs-Funktion zur URL-Bereinigung
  const cleanupUrls = (text: string): string => {
    if (!text) return '';
    
    // Bereinigen von Markdown-Links: [text](url)
    let cleaned = text.replace(
      /\[(.*?)\]\s*\(\s*(https?:\/\/[^\s)]+[^\s)]*([ \t]+[^\s)]+)*)\s*\)/g, 
      (match, linkText, url) => {
        // Leerzeichen in URLs entfernen (nicht im Linktext)
        const cleanUrl = url.replace(/\s+/g, '');
        return `[${linkText}](${cleanUrl})`;
      }
    );
    
    // Bereinigen von URLs in eckigen Klammern: [url]
    cleaned = cleaned.replace(
      /\[\s*(https?:\/\/[^\s\]]+[^\s\]]*([ \t]+[^\s\]]+)*)\s*\]/g, 
      (match, url) => {
        const cleanUrl = url.replace(/\s+/g, '');
        return `[${cleanUrl}]`;
      }
    );
    
    // Bereinigen einfacher URLs
    cleaned = cleaned.replace(
      /(https?:\/\/[^\s"'<>]+[^\s"'<>]*([ \t]+[^\s"'<>]+)*)/g, 
      (match) => match.replace(/\s+/g, '')
    );
    
    return cleaned;
  };
  
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