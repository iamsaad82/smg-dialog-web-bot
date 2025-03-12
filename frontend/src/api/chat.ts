import { apiCore, API_BASE_URL } from './core';
import { ChatQuery, SearchQuery, SearchResult } from '../types/api';

export class ChatApi {
  // --- Chat-Endpunkte ---

  async getCompletion(query: ChatQuery): Promise<string> {
    // Nicht-Streaming-Anfrage
    const nonStreamingQuery = { ...query, stream: false };
    const response = await apiCore.getClient().post('/chat/completion', nonStreamingQuery);
    return response.data.response;
  }

  // Streaming-Chat-Funktion
  getCompletionStream(
    query: ChatQuery, 
    onChunk: (chunk: string) => void, 
    onDone: () => void, 
    onError: (error: Error) => void,
    onInteractiveElements?: (elements: any[]) => void
  ) {
    if (!apiCore.getApiKey()) {
      onError(new Error('API-Key nicht gesetzt'));
      return { cancel: () => {} };
    }

    const controller = new AbortController();
    const { signal } = controller;
    let streamActive = true;
    
    // Tipp-Verarbeitungsstatus
    let insideTip = false;
    let tipBuffer = '';
    
    // Kontaktdaten-Verarbeitungsstatus
    let insideContact = false;
    let contactBuffer = '';
    
    // Stream-Funktion mit Fetch
    (async () => {
      try {
        console.log('Starte Chat-Stream mit API-Key:', apiCore.getApiKey());
        
        // POST-Anfrage mit stream=true
        const response = await fetch(`${API_BASE_URL}/chat/completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-API-Key': apiCore.getApiKey() || '',
            'Accept': 'text/event-stream; charset=utf-8',
          },
          body: JSON.stringify({...query, stream: true}),
          signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream wird vom Browser nicht unterstützt');
        }

        // Stream-Verarbeitung
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        // Hilfsfunktion zum Verarbeiten einer Zeile
        const processLine = (line: string): void => {
          if (!line || !streamActive) return; // Leere Zeilen ignorieren oder Stream beendet
          
          console.log("Empfangene Zeile:", line);
          
          if (line.startsWith('data:')) {
            // Daten-Zeile (enthält Text-Chunk) - WICHTIG: kein trim() anwenden, um Leerzeichen zu erhalten
            let content = line.substring(5);
            
            try {
              // Prüfen auf JSON-Format (interaktive Elemente)
              if (content.includes('interactive_elements')) {
                const parsedData = JSON.parse(content);
                
                // Interaktive Elemente übergeben, wenn vorhanden
                if (parsedData.interactive_elements && onInteractiveElements) {
                  console.log("Interaktive Elemente gefunden:", parsedData.interactive_elements);
                  onInteractiveElements(parsedData.interactive_elements);
                }
                
                // Eventuellen Text trotzdem verarbeiten
                if (parsedData.text !== undefined) {
                  onChunk(parsedData.text);
                }
              } else {
                // Regulärer Text-Chunk
                onChunk(content);
              }
            } catch (e) {
              // Wenn kein gültiges JSON, dann als normalen Text behandeln
              console.log("Kein JSON, verarbeite als Text:", content);
              onChunk(content);
            }
          } else if (line === '[DONE]' || line === 'event: done') {
            // Ende des Streams
            console.log('Stream beendet über Event');
            streamActive = false;
            onDone();
          } else if (line.startsWith(':')) {
            // Kommentar-Zeile, ignorieren
            console.log('Kommentar:', line);
          } else {
            console.log('Unbekanntes Format:', line);
          }
        };
        
        // Verarbeitung des Streams
        while (streamActive) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log('Stream-Lesung beendet');
            streamActive = false;
            onDone();
            break;
          }
          
          // Decodieren und zum Buffer hinzufügen
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Nach Zeilenumbrüchen suchen und Zeilen verarbeiten
          let lineBreakIndex;
          while ((lineBreakIndex = buffer.indexOf('\n')) >= 0 && streamActive) {
            const line = buffer.substring(0, lineBreakIndex).trim();
            buffer = buffer.substring(lineBreakIndex + 1);
            
            if (line) {
              processLine(line);
            }
          }
        }
      } catch (error: any) {
        console.error('Fehler beim Chat-Stream:', error);
        if (streamActive) {
          streamActive = false;
          onError(error);
        }
      }
    })();
    
    // Rückgabe einer Funktion, um den Stream zu beenden
    return {
      cancel: () => {
        console.log('Chat-Stream wird abgebrochen');
        streamActive = false;
        controller.abort();
      }
    };
  }

  // --- Suchanfrage-Endpunkte ---

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const response = await apiCore.getClient().post('/chat/search', query);
    return response.data.results;
  }
}

// Singleton-Instanz
export const chatApi = new ChatApi(); 