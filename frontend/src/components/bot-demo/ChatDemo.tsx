import React, { useState, useRef, useEffect } from "react"
import { SendHorizontal, RefreshCw, Bot } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tenant, ChatMessage as ApiChatMessage } from "@/types/api"
import { apiClient } from "@/utils/api"
import { parseBotResponse } from "@/utils/botResponseParser"
import { InteractiveElement } from "@/types/interactive"
import { MessageItem } from "./chat/MessageItem"

// Import der MessageItem-Komponente
import { ChatMessage } from "./chat/utils/types"

interface ChatDemoProps {
  tenant: Tenant
}

export function ChatDemo({ tenant }: ChatDemoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-1",
      role: "assistant",
      content: tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?",
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      interactiveElements: []
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Refs für die aktuelle Bot-Antwort während des Streamings
  const currentAssistantMessageRef = useRef<string>("")
  const interactiveElementsRef = useRef<InteractiveElement[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Stellt sicher, dass der API-Key gesetzt ist
  useEffect(() => {
    if (tenant.api_key) {
      apiClient.setApiKey(tenant.api_key)
    }
  }, [tenant.api_key])

  // Scrollt zum Ende der Nachrichten, wenn neue hinzukommen
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Streaming-Zustand zurücksetzen
    currentAssistantMessageRef.current = ""
    interactiveElementsRef.current = []

    // Füge eine leere Assistentennachricht hinzu, die während des Streamings gefüllt wird
    const assistantMessageId = `assistant-${Date.now()}`
    setMessages((prev) => [...prev, {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      interactiveElements: []
    }])

    try {
      // Alle bisherigen Nachrichten im Chat für Kontext senden
      const apiMessages: ApiChatMessage[] = messages
        .filter(msg => msg.content.trim() !== "") // Leere Nachrichten filtern
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      
      // User-Nachricht hinzufügen
      apiMessages.push({
        role: "user",
        content: inputValue
      })

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
          currentAssistantMessageRef.current += chunk
          
          // Versuch, auch während des Streamings JSON zu erkennen und zu parsen
          try {
            // Prüfen, ob die aktuelle Nachricht ein komplettes JSON-Objekt enthält
            const currentText = currentAssistantMessageRef.current
            
            if (currentText.trim().startsWith('{') && currentText.trim().endsWith('}')) {
              // Versuchen, das JSON zu parsen
              const { text, interactiveElements } = parseBotResponse(currentText)
              
              // Wenn interaktive Elemente gefunden wurden, speichern
              if (interactiveElements && interactiveElements.length > 0) {
                interactiveElementsRef.current = interactiveElements
                
                // Text aktualisieren (ohne JSON)
                setMessages(prev => {
                  const updatedMessages = [...prev]
                  const lastIndex = updatedMessages.length - 1
                  
                  if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
                    updatedMessages[lastIndex] = {
                      ...updatedMessages[lastIndex],
                      content: text,
                      interactiveElements: interactiveElements
                    }
                  }
                  
                  return updatedMessages
                })
                return // Nicht mehr als normalen Text behandeln
              }
            }
          } catch (error) {
            console.log("Kein vollständiges/gültiges JSON während Streaming, behandle als Text:", error)
          }
          
          // Assistentennachricht in Echtzeit aktualisieren
          setMessages(prev => {
            const updatedMessages = [...prev]
            const lastIndex = updatedMessages.length - 1
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content: currentAssistantMessageRef.current,
                interactiveElements: interactiveElementsRef.current
              }
            }
            
            return updatedMessages
          })
        },
        // Abschluss-Handler
        () => {
          // Versuchen, Komponenten aus der vollständigen Antwort zu extrahieren
          try {
            const { text, interactiveElements } = parseBotResponse(currentAssistantMessageRef.current)
            
            // Wenn Komponenten erkannt wurden, aktualisieren wir die letzte Nachricht
            if (interactiveElements && interactiveElements.length > 0) {
              console.log("UI-Komponenten erkannt:", interactiveElements)
              interactiveElementsRef.current = interactiveElements
              
              // Nachricht mit extrahierten Komponenten und bereinigtem Text aktualisieren
              setMessages(prev => {
                const updatedMessages = [...prev]
                const lastIndex = updatedMessages.length - 1
                
                if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
                  updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    content: text,  // Bereinigter Text ohne JSON
                    interactiveElements: interactiveElements
                  }
                }
                
                return updatedMessages
              })
            }
          } catch (error) {
            console.error("Fehler beim Parsen der UI-Komponenten:", error)
          }
          
          setIsLoading(false)
          console.log("Chat-Stream abgeschlossen.")
        },
        // Fehler-Handler
        (error) => {
          console.error("Fehler beim Chat:", error)
          setIsLoading(false)
          
          // Fehlermeldung anzeigen
          setMessages(prev => {
            const updatedMessages = [...prev]
            const lastIndex = updatedMessages.length - 1
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant" && 
                updatedMessages[lastIndex].content === "") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content: "Es tut mir leid, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
              }
            }
            
            return updatedMessages
          })
        },
        // Interaktive Elemente Handler
        (elements) => {
          console.log("Interaktive Elemente empfangen:", elements)
          interactiveElementsRef.current = elements
          
          setMessages(prev => {
            const updatedMessages = [...prev]
            const lastIndex = updatedMessages.length - 1
            
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                interactiveElements: elements
              }
            }
            
            return updatedMessages
          })
        }
      )
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error)
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: "system-1",
        role: "assistant",
        content: tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?",
        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        interactiveElements: []
      },
    ])
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative flex-1">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 p-4 pb-20">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                primaryColor={tenant.primary_color}
                secondaryColor={tenant.secondary_color}
              />
            ))}
            
            {/* Ladeindikator für ausstehende Antwort */}
            {isLoading && !messages[messages.length - 1]?.content && (
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary text-primary-foreground" style={{ backgroundColor: tenant.primary_color, color: tenant.secondary_color }}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <p className="text-sm">
                    <span className="inline-block animate-bounce">.</span>
                    <span className="inline-block animate-bounce delay-100">.</span>
                    <span className="inline-block animate-bounce delay-200">.</span>
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Eingabebereich am unteren Rand fixiert */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <Input
              placeholder="Was möchten Sie wissen?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="pr-28 rounded-full py-6 border-gray-300"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              onClick={handleSendMessage}
              style={{ backgroundColor: tenant.primary_color, color: tenant.secondary_color }}
              className="absolute right-0 rounded-full px-5 py-6 mr-1"
            >
              Fragen
            </Button>
          </div>
          <p className="text-xs text-center mt-2 text-gray-500">
            Drücken Sie Enter zum Senden
          </p>
        </div>
      </div>
    </div>
  )
} 