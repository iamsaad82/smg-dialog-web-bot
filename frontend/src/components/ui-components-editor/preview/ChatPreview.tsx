import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SectionHeading } from '../shared/SectionHeading';
import { Loader2, Send } from "lucide-react";
import { ChatMessage, InteractiveElement } from '../shared/types';
import { parseBotResponse } from '../shared/utils';
import { EXAMPLE_QUERIES } from '../shared/constants';

// Basis-Komponenten für die verschiedenen UI-Elemente importieren
import OpeningHoursTable from '../../ui-components/OpeningHoursTable';
import StoreMap from '../../ui-components/StoreMap';
import ProductShowcase from '../../ui-components/ProductShowcase';
import ContactCard from '../../ui-components/ContactCard';

interface ChatPreviewProps {
  prompt: string;
}

/**
 * Vorschau-Chat zum Testen der interaktiven UI-Komponenten
 */
export const ChatPreview: React.FC<ChatPreviewProps> = ({
  prompt
}) => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Nachricht an den Bot senden
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Benutzer-Nachricht zur Chat-Historie hinzufügen
    const newUserMessage: ChatMessage = { 
      role: 'user', 
      content: userInput 
    };
    
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // API-Anfrage an den Bot senden
      const response = await fetch('/api/v1/chat/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a386b1cd-a074-4500-90a8-f3b054270297'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userInput }],
          custom_instructions: prompt || undefined,
          stream: false
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      const botMessage = data.answer || 'Keine Antwort vom Bot.';
      
      // Bot-Antwort parsen und interaktive Komponenten extrahieren
      const parsedResponse = parseBotResponse(botMessage);
      
      // Bot-Antwort zur Chat-Historie hinzufügen
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: parsedResponse.text,
          components: parsedResponse.components
        }
      ]);
      
    } catch (err: any) {
      console.error('Fehler beim Senden der Nachricht:', err);
      setError(`Fehler: ${err.message}`);
      
      // Fallback-Nachricht zur Chat-Historie hinzufügen
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: 'Entschuldigung, es ist ein Fehler bei der Kommunikation mit dem Bot aufgetreten.' 
        }
      ]);
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  // Beispiel-Anfrage auswählen
  const selectExampleQuery = (query: string) => {
    setUserInput(query);
  };

  // Passende UI-Komponente rendern
  const renderComponent = (component: InteractiveElement) => {
    switch (component.type) {
      case 'OpeningHoursTable':
        return <OpeningHoursTable data={component.data} />;
      case 'StoreMap':
        return <StoreMap locations={component.data} />;
      case 'ProductShowcase':
        return <ProductShowcase products={component.data} />;
      case 'ContactCard':
        return <ContactCard contacts={component.data} />;
      default:
        return (
          <div className="p-4 border rounded mt-2">
            <p className="text-sm text-muted-foreground">
              Unbekannte Komponente: {component.type}
            </p>
            <code className="text-xs block mt-2 p-2 bg-muted overflow-auto">
              {JSON.stringify(component.data, null, 2)}
            </code>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live-Vorschau</CardTitle>
        <CardDescription>
          Testen Sie, wie der Bot mit interaktiven Komponenten antwortet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeading 
          title="Chat-Vorschau"
          description="Stellen Sie Fragen, um zu sehen, wie der Bot mit interaktiven Elementen antwortet"
        />
        
        {prompt ? (
          <>
            {/* Beispiel-Anfragen */}
            <div className="border rounded p-4 bg-muted/50 mb-4">
              <h4 className="text-sm font-medium mb-2">Beispiel-Anfragen:</h4>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((query, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => selectExampleQuery(query)}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Chat-Bereich */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-background p-4 max-h-[400px] overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Hier erscheint Ihr Chatverlauf.</p>
                    <p className="text-sm mt-2">Stellen Sie eine Frage, um zu testen, wie der Bot mit UI-Komponenten antwortet.</p>
                  </div>
                ) : (
                  // Chat-Nachrichten anzeigen
                  <div className="space-y-4">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content}
                          
                          {/* Komponenten anzeigen, wenn vorhanden */}
                          {msg.components && msg.components.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {msg.components.map((component, compIdx) => (
                                <div key={compIdx}>
                                  {renderComponent(component)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Lade-Animation während der Bot antwortet */}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Bot antwortet...</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Eingabebereich */}
              <div className="p-3 bg-background">
                <div className="flex gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Stellen Sie eine Frage..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !userInput.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Fehlerhinweis anzeigen */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          // Hinweis anzeigen, wenn kein Prompt definiert ist
          <Alert className="my-4">
            <AlertTitle>Kein Prompt definiert</AlertTitle>
            <AlertDescription>
              Sie müssen zuerst einen Prompt mit Komponentenregeln definieren, bevor Sie die Vorschau testen können.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}; 