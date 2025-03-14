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
    
    // Puffer für strukturierte Daten und Streaming-Steuerung
    let buffer = '';
    let structureDetected = false;
    let potentialStructuredContent = false;
    let headerDetected = false;
    let keyValuePairsCount = 0;
    
    // Verbesserte Regex für strukturierte Inhalte
    const structureHeaderRegex = /^###\s+(.+?)(?:\s*[-:]\s*|$)/;
    const keyValueRegex = /^\s*\**([^:*]+):\s*\**(.+)\**$/;
    const websiteRegex = /(?:Website|Webseite):\s+\[?(?:https?:\/\/|www\.)([^\s\]]+)/i;
    const linkInParensRegex = /\(\s*(?:https?:\/\/|www\.)([^\s\)]+)/;
    
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
      // Wenn es strukturierter Inhalt sein könnte, prüfe nochmal
      if (potentialStructuredContent) {
        const lines = buffer.split('\n');
        const hasHeader = lines.some(line => structureHeaderRegex.test(line));
        const keyValuePairs = lines.filter(line => keyValueRegex.test(line));
        
        structureDetected = Boolean((hasHeader || (lines[0] && !lines[0].includes(':'))) && 
                          keyValuePairs.length >= 3);
      }
      
      // Bereinige URLs, unabhängig davon, ob es strukturierter Inhalt ist
      const cleanedBuffer = cleanupUrls(buffer);
      
      // Sende gereinigten Buffer
      onChunk(cleanedBuffer);
      
      // Buffer zurücksetzen
      buffer = '';
      structureDetected = false;
      potentialStructuredContent = false;
      keyValuePairsCount = 0;
      headerDetected = false;
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
              // Prüfen auf JSON-Format (interaktive Elemente)
              if (content.includes('interactive_elements')) {
                const parsedData = JSON.parse(content);
                
                if (parsedData.interactive_elements && onInteractiveElements) {
                  console.log("Interaktive Elemente gefunden:", parsedData.interactive_elements);
                  onInteractiveElements(parsedData.interactive_elements);
                }
                
                // Eventuellen Text dennoch verarbeiten
                if (parsedData.text !== undefined) {
                  // Zuerst prüfen, ob der Text strukturierte Information enthalten könnte
                  if (!structureDetected && !potentialStructuredContent) {
                    if (parsedData.text.includes('###') || 
                        keyValueRegex.test(parsedData.text) ||
                        websiteRegex.test(parsedData.text) ||
                        parsedData.text.includes('Gymnasium') || 
                        parsedData.text.includes('Schule') ||
                        parsedData.text.includes('Kontakt') ||
                        parsedData.text.includes('Adresse')) {
                      // Möglicherweise strukturierter Inhalt - zum Buffer hinzufügen
                      potentialStructuredContent = true;
                      buffer += parsedData.text;
                      
                      // Prüfe auf Header oder Key-Value-Paare
                      const lines = buffer.split('\n');
                      if (lines.some(line => structureHeaderRegex.test(line))) {
                        headerDetected = true;
                      }
                      
                      keyValuePairsCount += lines.filter(line => keyValueRegex.test(line)).length;
                      
                      // Wenn wir genug Hinweise haben, markiere als strukturiert
                      if ((headerDetected && keyValuePairsCount >= 2) || 
                          keyValuePairsCount >= 3) {
                        structureDetected = true;
                      }
                      
                      // Wenn wir am Ende eines Absatzes sind, verarbeite den Buffer
                      if (parsedData.text.endsWith('\n\n') || 
                          parsedData.text.includes('.') && 
                          (parsedData.text.endsWith('.') || parsedData.text.endsWith('. '))) {
                        processBuffer();
                      }
                    } else if (containsUrl(parsedData.text)) {
                      // Einfacher Text mit URLs - reinigen und direkt senden
                      onChunk(cleanupUrls(parsedData.text));
                    } else {
                      // Normaler Text - direkt senden
                      onChunk(parsedData.text);
                    }
                  } else {
                    // Bereits als strukturiert erkannt - zum Buffer hinzufügen
                    buffer += parsedData.text;
                    
                    // Wenn wir am Ende eines Absatzes sind, verarbeite den Buffer
                    if (parsedData.text.endsWith('\n\n') || 
                        (parsedData.text.includes('.') && parsedData.text.endsWith('.'))) {
                      processBuffer();
                    }
                  }
                }
              } else {
                // Regulärer Text-Chunk - Verbesserte Verarbeitungslogik
                if (structureDetected || potentialStructuredContent) {
                  // Zum Buffer hinzufügen, wenn wir bereits eine Struktur erkannt haben
                  buffer += content;
                  
                  // Erkennung von Absatzende oder Kontextwechsel
                  if (content.endsWith('\n\n') || 
                      (content.includes('.') && content.endsWith('.')) ||
                      content.endsWith('.]') ||
                      content.includes('Ja, für weitere Informationen')) {
                    processBuffer();
                  }
                } else if (content.includes('###') || 
                    keyValueRegex.test(content) ||
                    websiteRegex.test(content) ||
                    linkInParensRegex.test(content) ||
                    content.includes('Schulform') || 
                    content.includes('Gymnasium') || 
                    content.includes('Adresse:')) {
                  // Könnte strukturierter Inhalt sein - puffern
                  potentialStructuredContent = true;
                  buffer += content;
                  
                  // Prüfe auf Header oder Key-Value-Paare
                  const lines = buffer.split('\n');
                  if (lines.some(line => structureHeaderRegex.test(line))) {
                    headerDetected = true;
                  }
                  
                  keyValuePairsCount += lines.filter(line => keyValueRegex.test(line)).length;
                  
                  // Wenn wir genug Hinweise haben, markiere als strukturiert
                  if ((headerDetected && keyValuePairsCount >= 2) || 
                      keyValuePairsCount >= 3) {
                    structureDetected = true;
                  }
                } else if (containsUrl(content)) {
                  // Einfacher Text mit URLs - reinigen und senden
                  onChunk(cleanupUrls(content));
                } else {
                  // Normaler Text - direkt senden
                  onChunk(content);
                }
              }
            } catch (e) {
              console.error("Fehler bei der Verarbeitung:", e);
              
              // Bei Fehlern einfach den bereinigten Inhalt senden
              onChunk(cleanupUrls(content));
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