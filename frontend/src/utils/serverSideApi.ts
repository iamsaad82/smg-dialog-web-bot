/**
 * Hilfsfunktionen für serverseitige API-Aufrufe
 * Diese Datei enthält Funktionen, die für serverseitige API-Aufrufe in Next.js verwendet werden
 */

import http from 'http';
import https from 'https';

/**
 * Generische Funktion für serverseitige API-Aufrufe in Next.js
 * Diese Funktion handhabt Weiterleitungen, verschiedene Protokolle und Fehlerfälle
 */
export async function serverSideApiCall<T = any>(
  path: string,
  options: {
    method?: string,
    headers?: Record<string, string>,
    body?: any
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body = null
  } = options;

  // Bestimme den korrekten Backend-Host
  const isDocker = process.env.DOCKER_CONTAINER === 'true'
  const backendHost = isDocker ? 'backend' : 'localhost'
  console.log("Server-Side: Backend-Host ist", backendHost)

  // Normalisiere Pfad
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  // Erstelle URL mit richtigem Host
  const url = `http://${backendHost}:8000/api/v1/${normalizedPath}`;
  
  return new Promise<T>((resolve, reject) => {
    // Rekursive Funktion, um Weiterleitungen zu verfolgen
    const sendRequest = (requestUrl: string, redirectCount = 0): void => {
      if (redirectCount > 5) {
        return reject(new Error('Zu viele Weiterleitungen'));
      }
      
      console.log(`Server-Side: Sende Anfrage an ${requestUrl}`);
      
      try {
        const parsedUrl = new URL(requestUrl);
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        
        const requestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };
        
        const req = httpModule.request(requestOptions, (res) => {
          // Überprüfe auf Weiterleitungen
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
            const location = res.headers.location;
            
            if (!location) {
              return reject(new Error('Weiterleitung ohne Ziel'));
            }
            
            console.log(`Server-Side: Folge Weiterleitung zu ${location}`);
            
            // Bestimme absolute URL für die Weiterleitung
            const redirectUrl = location.startsWith('http')
              ? location
              : new URL(location, parsedUrl.origin).href;
            
            // Folge der Weiterleitung mit erhöhtem Zähler
            return sendRequest(redirectUrl, redirectCount + 1);
          }
          
          // Sammle Antwortdaten
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            // Überprüfe auf erfolgreiche Antwort
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                // Parse JSON oder gib leeres Objekt zurück
                const parsedData = data ? JSON.parse(data) : {};
                resolve(parsedData as T);
              } catch (e) {
                reject(new Error(`Fehler beim Parsen der Antwort: ${e}`));
              }
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('Server-Side: Fehler bei der Anfrage:', error);
          reject(error);
        });
        
        // Sende Anfragekörper, falls vorhanden
        if (body) {
          const bodyData = typeof body === 'string' ? body : JSON.stringify(body);
          req.write(bodyData);
        }
        
        req.end();
        
      } catch (error) {
        console.error('Server-Side: URL-Parsing-Fehler:', error);
        reject(error);
      }
    };
    
    // Starte die Anfrage
    sendRequest(url);
  });
} 