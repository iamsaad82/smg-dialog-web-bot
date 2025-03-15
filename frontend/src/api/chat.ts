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
    onStructuredData?: (data: any[]) => void
  ) {
    if (!apiCore.getApiKey()) {
      onError(new Error('API-Key nicht gesetzt'));
      return { cancel: () => {} };
    }

    const controller = new AbortController();
    const { signal } = controller;
    let streamActive = true;
    
    // Puffer für Inhalte und Streaming-Steuerung
    let buffer = '';
    
    // Verbesserte URL-Erkennung
    const containsUrl = (text: string): boolean => {
      return text.includes('http') || 
             text.includes('www.') || 
             text.includes('[') && text.includes(']') && text.includes('(') ||
             /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(text);
    };
    
    // Verbesserte URL-Bereinigung
    const cleanupUrls = (text: string): string => {
      let cleanedText = text;
      
      // [Text](URL) Markdown Links bereinigen
      cleanedText = cleanedText.replace(
        /\[(.*?)\]\s*\(\s*(https?:\/\/[^\s)]+(?:\s+[^\s)]+)*)\s*\)/g,
        (_, linkText, url) => `[${linkText}](${url.replace(/\s+/g, '')})`
      );
      
      // Alle anderen URLs bereinigen
      cleanedText = cleanedText.replace(
        /(https?:\/\/[^\s"'<>]+(?:\s+[^\s"'<>]+)*)/g,
        match => match.replace(/\s+/g, '')
      );
      
      return cleanedText;
    };
    
    // Funktion zur Verarbeitung des Buffers
    const processBuffer = () => {
      // Bereinige URLs
      const cleanedBuffer = cleanupUrls(buffer);
      
      // Sende gereinigten Buffer
      onChunk(cleanedBuffer);
      
      // Buffer zurücksetzen
      buffer = '';
    };
    
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
        let messageBuffer = '';
        
        // Verbesserte Zeilenverarbeitung
        const processLine = (line: string): void => {
          if (!line || !streamActive) return;
          
          console.log("Empfangene Zeile:", line);
          
          if (line.startsWith('data:')) {
            const content = line.substring(5);
            
            try {
              // Prüfen, ob content ein JSON ist, bevor wir es parsen
              if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
                // Es sieht aus wie JSON, also versuchen wir es zu parsen
                const parsedData = JSON.parse(content);
                
                // Prüfen auf strukturierte Daten
                if (parsedData.structured_data && onStructuredData) {
                  console.log("Strukturierte Daten gefunden:", parsedData.structured_data);
                  onStructuredData(parsedData.structured_data);
                }
                
                // Eventuellen Text verarbeiten
                if (parsedData.text !== undefined) {
                  // Zum Buffer hinzufügen oder direkt senden
                  if (containsUrl(parsedData.text)) {
                    // Text mit URLs - reinigen und senden
                    onChunk(cleanupUrls(parsedData.text));
                  } else {
                    // Normaler Text - direkt senden
                    onChunk(parsedData.text);
                  }
                }
              } else {
                // Es ist kein JSON, also behandeln wir es als normalen Text
                if (containsUrl(content)) {
                  // Text mit URLs - reinigen und senden
                  onChunk(cleanupUrls(content));
                } else {
                  // Normaler Text - direkt senden
                  onChunk(content);
                }
              }
            } catch (error) {
              console.warn("Fehler beim Parsen des Inhalts als JSON:", error);
              // Bei Parsing-Fehler den Inhalt als normalen Text behandeln
              if (containsUrl(content)) {
                // Text mit URLs - reinigen und senden
                onChunk(cleanupUrls(content));
              } else {
                // Normaler Text - direkt senden
                onChunk(content);
              }
            }
          } else if (line === '[DONE]' || line === 'event: done') {
            console.log('Stream beendet über Event');
            
            // Noch verbliebenen Buffer verarbeiten
            if (buffer) {
              processBuffer();
            }
            
            streamActive = false;
            onDone();
          }
        };
        
        // Stream-Verarbeitung
        while (streamActive) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log('Stream-Lesung beendet');
            
            // Noch verbliebenen Buffer verarbeiten
            if (buffer) {
              processBuffer();
            }
            
            streamActive = false;
            onDone();
            break;
          }
          
          // Chunk decodieren und zum messageBuffer hinzufügen
          const chunk = decoder.decode(value, { stream: true });
          messageBuffer += chunk;
          
          // Nach Zeilenumbrüchen suchen und Zeilen verarbeiten
          let lineBreakIndex;
          while ((lineBreakIndex = messageBuffer.indexOf('\n')) >= 0 && streamActive) {
            const line = messageBuffer.substring(0, lineBreakIndex).trim();
            messageBuffer = messageBuffer.substring(lineBreakIndex + 1);
            
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