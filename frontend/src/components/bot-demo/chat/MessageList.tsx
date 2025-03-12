import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem, ChatMessage } from './MessageItem';
import { Bot, Loader } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  primaryColor,
  secondaryColor
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scrollt zum Ende der Nachrichten, wenn neue hinzukommen
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-3 pb-28 px-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        ))}
        
        {/* Verbesserter Ladeindikator für ausstehende Antwort */}
        {isLoading && !messages[messages.length - 1]?.content && (
          <div className="flex items-start gap-2">
            <div 
              className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary text-primary-foreground" 
              style={{ backgroundColor: primaryColor, color: secondaryColor }}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted max-w-[80%]">
              <div className="flex items-center gap-2 mb-1">
                <Loader className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">Antwort wird generiert...</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Ich recherchiere eine passende Antwort für Sie.
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
} 