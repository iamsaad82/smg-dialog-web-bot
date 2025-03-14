import React, { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tenant, ChatMessage as ApiChatMessage } from "@/types/api";
import { apiClient } from "@/utils/api";
import { parseBotResponse } from "@/utils/botResponseParser";
import { InteractiveElement } from "@/types/interactive";
import { ChatInput } from "../input/ChatInput";
import { MessageList } from "./MessageList";
import { MessageItem } from "./MessageItem";
import { ChatMessage, ExtendedChatMessage } from "./utils/types";
import { motion, AnimatePresence } from "framer-motion";

// Import der DevTools für das lokale Testen
import { DevTools, TEST_MESSAGE_EVENT } from "./tenant-renderers/DevTools";

interface ChatContainerProps {
  tenant: Tenant;
}

export function ChatContainer({ tenant }: ChatContainerProps) {
  const [messages, setMessages] = useState<(ChatMessage | ExtendedChatMessage)[]>([
    {
      id: "system-1",
      role: "assistant",
      content: tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?",
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      interactiveElements: []
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  
  // Refs für die aktuelle Bot-Antwort während des Streamings
  const currentAssistantMessageRef = useRef<string>("");
  const interactiveElementsRef = useRef<InteractiveElement[]>([]);

  // useEffect für laufenden Chat und Speichern im localStorage
  useEffect(() => {
    // Wenn es bereits Nachrichten gibt, im localStorage speichern
    if (messages.length > 0) {
      localStorage.setItem(`chat_${tenant?.id}`, JSON.stringify(messages));
    }

    // Event-Listener für Test-Nachrichten
    const handleTestMessage = (event: CustomEvent<{message: ExtendedChatMessage}>) => {
      setMessages(prevMessages => [...prevMessages, event.detail.message]);
    };

    // Event-Listener hinzufügen
    window.addEventListener(TEST_MESSAGE_EVENT, handleTestMessage as EventListener);

    // Cleanup-Funktion
    return () => {
      window.removeEventListener(TEST_MESSAGE_EVENT, handleTestMessage as EventListener);
    };
  }, [messages, tenant?.id]);

  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim() || isLoading) return;

    // Chat ist jetzt begonnen, falls er es nicht schon war
    if (!chatStarted) {
      setChatStarted(true);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Streaming-Zustand zurücksetzen
    currentAssistantMessageRef.current = "";
    interactiveElementsRef.current = [];

    // Füge eine leere Assistentennachricht hinzu, die während des Streamings gefüllt wird
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      interactiveElements: []
    }]);

    try {
      // Alle bisherigen Nachrichten im Chat für Kontext senden
      const apiMessages: ApiChatMessage[] = messages
        .filter(msg => msg.content.trim() !== "") // Leere Nachrichten filtern
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // User-Nachricht hinzufügen
      apiMessages.push({
        role: "user",
        content: inputValue
      });

      // Streaming-API aufrufen
      apiClient.getCompletionStream(
        {
          messages: apiMessages,
          stream: true,
          use_mistral: tenant.use_mistral || false,
          custom_instructions: tenant.custom_instructions || undefined
        },
        // Chunk-Handler für Streaming
        (chunk) => {
          // Aktuellen Text aktualisieren
          currentAssistantMessageRef.current += chunk;
          
          // Versuch, auch während des Streamings JSON zu erkennen und zu parsen
          try {
            // Prüfen, ob die aktuelle Nachricht ein komplettes JSON-Objekt enthält
            const currentText = currentAssistantMessageRef.current;
            
            if (currentText.trim().startsWith('{') && currentText.trim().endsWith('}')) {
              // Versuchen, das JSON zu parsen
              const { text, interactiveElements } = parseBotResponse(currentText);
              
              // Wenn interaktive Elemente gefunden wurden, speichern
              if (interactiveElements && interactiveElements.length > 0) {
                interactiveElementsRef.current = interactiveElements;
                
                // Text aktualisieren (ohne JSON)
                setMessages(prev => {
                  const updatedMessages = [...prev];
                  const lastIndex = updatedMessages.length - 1;
                  
                  if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
                    updatedMessages[lastIndex] = {
                      ...updatedMessages[lastIndex],
                      content: text,
                      interactiveElements: interactiveElements
                    };
                  }
                  
                  return updatedMessages;
                });
                return; // Nicht mehr als normalen Text behandeln
              }
            }
          } catch (error) {
            console.log("Kein vollständiges/gültiges JSON während Streaming, behandle als Text:", error);
          }
          
          // Assistentennachricht in Echtzeit aktualisieren
          setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content: currentAssistantMessageRef.current,
                interactiveElements: interactiveElementsRef.current
              };
            }
            
            return updatedMessages;
          });
        },
        // Abschluss-Handler
        () => {
          // Versuchen, Komponenten aus der vollständigen Antwort zu extrahieren
          try {
            const { text, interactiveElements } = parseBotResponse(currentAssistantMessageRef.current);
            
            // Wenn Komponenten erkannt wurden, aktualisieren wir die letzte Nachricht
            if (interactiveElements && interactiveElements.length > 0) {
              console.log("UI-Komponenten erkannt:", interactiveElements);
              interactiveElementsRef.current = interactiveElements;
              
              // Nachricht mit extrahierten Komponenten und bereinigtem Text aktualisieren
              setMessages(prev => {
                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;
                
                if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
                  updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    content: text,  // Bereinigter Text ohne JSON
                    interactiveElements: interactiveElements
                  };
                }
                
                return updatedMessages;
              });
            }
          } catch (error) {
            console.error("Fehler beim Parsen der UI-Komponenten:", error);
          }
          
          setIsLoading(false);
          console.log("Chat-Stream abgeschlossen.");
        },
        // Fehler-Handler
        (error) => {
          console.error("Fehler beim Chat:", error);
          setIsLoading(false);
          
          // Fehlermeldung anzeigen
          setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant" && 
                updatedMessages[lastIndex].content === "") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content: "Es tut mir leid, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
              };
            }
            
            return updatedMessages;
          });
        },
        // Interaktive Elemente Handler
        (elements) => {
          console.log("Interaktive Elemente empfangen:", elements);
          interactiveElementsRef.current = elements;
          
          setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                interactiveElements: elements
              };
            }
            
            return updatedMessages;
          });
        }
      );
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "system-1",
        role: "assistant",
        content: tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?",
        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        interactiveElements: []
      },
    ]);
    setChatStarted(false);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header mit Reset-Button - Padding reduziert */}
      <div className="flex justify-end p-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleResetChat} 
          title="Chat zurücksetzen"
          className="rounded-full h-8 w-8"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Chat-Bereich mit Nachrichten */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {!chatStarted ? (
            // Zentriertes Eingabefeld, wenn der Chat noch nicht begonnen hat - Padding reduziert
            <motion.div 
              key="centered-input"
              className="flex flex-col items-center justify-center h-full w-full px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-4 max-w-2xl">
                <p className="text-lg">{messages[0]?.content || "Wie kann ich Ihnen helfen?"}</p>
              </div>
              <div className="w-full max-w-2xl mx-auto">
                <ChatInput 
                  onSubmit={handleSendMessage}
                  isDisabled={isLoading}
                  placeholder="Stellen Sie Ihre Frage..."
                  primaryColor={tenant.primary_color || undefined}
                  secondaryColor={tenant.secondary_color || undefined}
                />
              </div>
            </motion.div>
          ) : (
            // Normaler Chat-Bereich mit Nachrichtenliste und fixiertem Eingabefeld
            <motion.div
              key="normal-chat"
              className="h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MessageList 
                messages={messages as ChatMessage[]}
                isLoading={isLoading && !messages[messages.length - 1]?.content}
                primaryColor={tenant.primary_color || undefined}
                secondaryColor={tenant.secondary_color || undefined}
              />
              
              {/* Eingabefeld am unteren Rand fixiert mit Gradienten - Padding reduziert */}
              <div className="absolute bottom-0 left-0 right-0 pt-4 px-2 pb-2 bg-gradient-to-t from-background via-background to-transparent">
                <div className="w-full max-w-3xl mx-auto">
                  <ChatInput 
                    onSubmit={handleSendMessage}
                    isDisabled={isLoading}
                    placeholder="Was möchten Sie wissen?"
                    primaryColor={tenant.primary_color || undefined}
                    secondaryColor={tenant.secondary_color || undefined}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1 mb-0">
                  Powered by {tenant.name || "Dialog Engine"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DevTools im Entwicklungsmodus anzeigen */}
      {process.env.NODE_ENV === 'development' && <DevTools />}
    </div>
  );
} 