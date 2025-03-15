import React from 'react';
import { Bot, User } from "lucide-react";
import { InteractiveElement } from "@/types/interactive";
import { TenantAwareRenderer } from './tenant-renderers';
import { ExtendedChatMessage, ChatMessage } from './utils/types';

interface MessageItemProps {
  message: ChatMessage | ExtendedChatMessage;
  primaryColor?: string;
  secondaryColor?: string;
}

// Hilfsfunktion, um Text mit klickbaren Links zu rendern
const formatTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return '';
  
  // Regex für URL-Erkennung (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // Text in Teile aufteilen (Text und URLs)
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  // Matched URLs sammeln
  let matchIndex = 0;
  
  // Array für das Ergebnis
  const result: React.ReactNode[] = [];
  
  // Durch die Teile iterieren und Links ersetzen
  parts.forEach((part, index) => {
    if (part) {
      // Normaler Text
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
    
    // URL einfügen, wenn verfügbar
    if (matches[matchIndex]) {
      let url = matches[matchIndex];
      // Wenn URL mit www beginnt, füge https:// hinzu
      if (url.startsWith('www.')) {
        url = `https://${url}`;
      }
      
      result.push(
        <a 
          key={`link-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {matches[matchIndex]}
        </a>
      );
      matchIndex++;
    }
  });
  
  return <>{result}</>;
};

export function MessageItem({ message, primaryColor, secondaryColor }: MessageItemProps) {
  // Sicherstellen, dass der Text getrimmt ist
  const messageContent = message.content.trim();
  
  // Prüfen, ob die Nachricht strukturierte Daten enthält
  const hasStructuredData = message.role === "assistant" && 
                           'structured_data' in message && 
                           message.structured_data && 
                           message.structured_data.length > 0;
  
  console.log("Message hat structured_data:", hasStructuredData, message);
  
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
            <div className="space-y-4">
              {/* Einfacher Text mit klickbaren Links */}
              <div className="text-sm whitespace-pre-wrap">
                {formatTextWithLinks(messageContent)}
              </div>
              
              {/* Strukturierte Daten (falls vorhanden) */}
              {hasStructuredData && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {(message as ExtendedChatMessage).structured_data!.map((item, index) => (
                    <TenantAwareRenderer 
                      key={index}
                      data={item}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
          )}
          
          <p className="text-xs opacity-50 mt-2">{message.timestamp}</p>
        </div>
        
        {/* Interaktive Elemente anzeigen, falls vorhanden */}
        {message.interactiveElements && message.interactiveElements.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {message.interactiveElements.map((element, index) => (
                <React.Fragment key={index}>
                  {element.type === 'button' && (
                    <button
                      className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      onClick={() => {
                        // Hier könntest du eine Funktion implementieren, die den Button-Klick behandelt
                        console.log('Button clicked:', element.action);
                      }}
                    >
                      {element.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 